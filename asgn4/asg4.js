// asg4.js - Phong lighting from scratch

// VERTEX SHADER
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjMatrix;
  uniform mat4 u_NormalMatrix;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  void main() {
    vec4 worldPos = u_ModelMatrix * a_Position;
    gl_Position   = u_ProjMatrix * u_ViewMatrix * worldPos;
    v_Position    = worldPos.xyz;
    v_Normal      = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);
  }
`;

// FRAGMENT SHADER
const FSHADER_SOURCE = `
  precision mediump float;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  uniform vec4  u_BaseColor;
  uniform vec3  u_LightPos;
  uniform vec3  u_LightColor;
  uniform vec3  u_CameraPos;
  uniform int   u_LightOn;
  uniform int   u_ShowNormals;
  uniform int   u_SpotOn;
  uniform vec3  u_SpotPos;
  uniform vec3  u_SpotDir;
  uniform float u_SpotCutoff;
  void main() {
    if (u_ShowNormals == 1) {
      gl_FragColor = vec4(normalize(v_Normal) * 0.5 + 0.5, 1.0);
      return;
    }
    vec3 base = u_BaseColor.rgb;
    if (u_LightOn == 0) {
      gl_FragColor = vec4(base, 1.0);
      return;
    }
    vec3 N = normalize(v_Normal);
    vec3 L = normalize(u_LightPos - v_Position);
    vec3 V = normalize(u_CameraPos - v_Position);
    vec3 R = reflect(-L, N);
    vec3 ambient  = 0.3 * u_LightColor * base;
    float NdotL   = dot(N, L);
    float diff    = max(NdotL, 0.0);
    vec3 diffuse  = 0.8 * diff * u_LightColor * base;
    vec3 specular = vec3(0.0);
    if (NdotL > 0.0) {
      float spec = pow(max(dot(R, V), 0.0), 32.0);
      specular   = 0.5 * spec * u_LightColor;
    }
    vec3 phong = ambient + diffuse + specular;
    if (u_SpotOn == 1) {
      vec3  Ls    = normalize(u_SpotPos - v_Position);
      float theta = dot(Ls, normalize(-u_SpotDir));
      if (theta > u_SpotCutoff) {
        float NdotLs = dot(N, Ls);
        float sd     = max(NdotLs, 0.0);
        vec3  sc     = vec3(1.0, 0.95, 0.7);
        vec3  sdiff  = 0.8 * sd * sc * base;
        vec3  sspec  = vec3(0.0);
        if (NdotLs > 0.0) {
          vec3  Rs = reflect(-Ls, N);
          sspec    = 0.5 * pow(max(dot(Rs, V), 0.0), 32.0) * sc;
        }
        float inten = (theta - u_SpotCutoff) / (1.0 - u_SpotCutoff);
        phong += (sdiff + sspec) * inten;
      }
    }
    gl_FragColor = vec4(phong, 1.0);
  }
`;

// ── Globals ──────────────────────────────────────────────────
let canvas, gl;
let a_Position, a_Normal;
let u_ModelMatrix, u_ViewMatrix, u_ProjMatrix, u_NormalMatrix;
let u_BaseColor, u_LightPos, u_LightColor, u_CameraPos;
let u_LightOn, u_ShowNormals, u_SpotOn, u_SpotPos, u_SpotDir, u_SpotCutoff;

let g_camX = 20, g_camY = 30;
let g_lightOn = true, g_showNormals = false, g_spotOn = false;
let g_lightSpeed = 1.0, g_lightY = 2.0, g_lightManX = 0.0;
let g_lightAngle = 0;
let g_lightColor = [1.0, 1.0, 1.0];
let g_spotCutoff = 25;

let g_sphPos = null, g_sphNorm = null, g_sphCount = 0;
let g_objPos = null, g_objNorm = null, g_objCount = 0, g_objLoaded = false;


// ── Main ─────────────────────────────────────────────────────
function main() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl');
  if (!gl) { alert('WebGL not supported'); return; }

  gl.enable(gl.DEPTH_TEST);

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    alert('Shader compile failed — check console');
    return;
  }

  a_Position    = gl.getAttribLocation(gl.program,  'a_Position');
  a_Normal      = gl.getAttribLocation(gl.program,  'a_Normal');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix  = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjMatrix  = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_NormalMatrix= gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_BaseColor   = gl.getUniformLocation(gl.program, 'u_BaseColor');
  u_LightPos    = gl.getUniformLocation(gl.program, 'u_LightPos');
  u_LightColor  = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_CameraPos   = gl.getUniformLocation(gl.program, 'u_CameraPos');
  u_LightOn     = gl.getUniformLocation(gl.program, 'u_LightOn');
  u_ShowNormals = gl.getUniformLocation(gl.program, 'u_ShowNormals');
  u_SpotOn      = gl.getUniformLocation(gl.program, 'u_SpotOn');
  u_SpotPos     = gl.getUniformLocation(gl.program, 'u_SpotPos');
  u_SpotDir     = gl.getUniformLocation(gl.program, 'u_SpotDir');
  u_SpotCutoff  = gl.getUniformLocation(gl.program, 'u_SpotCutoff');

  buildSphere(24);
  loadOBJ(PYRAMID_OBJ);
  setupUI();
  tick();
}


// ── Tick ─────────────────────────────────────────────────────
function tick() {
  g_lightAngle += 0.01 * g_lightSpeed;
  renderScene();
  requestAnimationFrame(tick);
}


// ── Render ───────────────────────────────────────────────────
function renderScene() {
  gl.clearColor(0.1, 0.1, 0.15, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let lx = Math.cos(g_lightAngle) * 2.5 + g_lightManX;
  let ly = g_lightY;
  let lz = Math.sin(g_lightAngle) * 2.5;

  gl.uniform3f(u_LightPos,   lx, ly, lz);
  gl.uniform3f(u_LightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
  gl.uniform1i(u_LightOn,     g_lightOn     ? 1 : 0);
  gl.uniform1i(u_ShowNormals, g_showNormals ? 1 : 0);
  gl.uniform1i(u_SpotOn,      g_spotOn      ? 1 : 0);
  gl.uniform3f(u_SpotPos,  0, 4, 0);
  gl.uniform3f(u_SpotDir,  0, -1, 0);
  gl.uniform1f(u_SpotCutoff, Math.cos(g_spotCutoff * Math.PI / 180));

  // Orbit camera
  let cx = g_camX * Math.PI / 180;
  let cy = g_camY * Math.PI / 180;
  let eyeX = 7 * Math.sin(cy) * Math.cos(cx);
  let eyeY = 7 * Math.sin(cx);
  let eyeZ = 7 * Math.cos(cy) * Math.cos(cx);

  gl.uniform3f(u_CameraPos, eyeX, eyeY, eyeZ);
  gl.uniformMatrix4fv(u_ViewMatrix, false, makeLookAt(eyeX, eyeY, eyeZ, 0, 0, 0, 0, 1, 0));
  gl.uniformMatrix4fv(u_ProjMatrix, false, makePerspective(45, canvas.width / canvas.height, 0.1, 100));

  // Blue cube
  drawCube([0.3, 0.5, 1.0, 1.0], makeTranslate(-1.5, -0.5, 0));

  // Green ground
  drawCube([0.25, 0.6, 0.25, 1.0], makeScaled(makeTranslate(-4, -1.5, -4), 8, 0.2, 8));

  // Red sphere
  drawSphere([1.0, 0.3, 0.2, 1.0], makeTranslate(1.5, 0, 0));

  // OBJ pyramid
  if (g_objLoaded) {
    drawOBJ([0.8, 0.65, 0.35, 1.0], makeScaled(makeTranslate(0, -1.4, -2.5), 0.9, 0.9, 0.9));
  }

  // Light marker — always bright, lighting off
  gl.uniform1i(u_LightOn,     0);
  gl.uniform1i(u_ShowNormals, 0);
  drawCube([1.0, 1.0, 0.0, 1.0], makeScaled(makeTranslate(lx - 0.1, ly - 0.1, lz - 0.1), 0.2, 0.2, 0.2));
  gl.uniform1i(u_LightOn,     g_lightOn     ? 1 : 0);
  gl.uniform1i(u_ShowNormals, g_showNormals ? 1 : 0);
}


// ── Matrix helpers (no lib dependency) ───────────────────────

function makeIdentity() {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}

function makeTranslate(x, y, z) {
  let m = makeIdentity();
  m[12] = x; m[13] = y; m[14] = z;
  return m;
}

function makeScaled(m, sx, sy, sz) {
  // Returns a new matrix = m * scale(sx,sy,sz)
  let s = new Float32Array(16);
  s[0]=sx; s[5]=sy; s[10]=sz; s[15]=1;
  return mat4Mul(m, s);
}

function mat4Mul(a, b) {
  let r = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      r[j*4+i] = a[i]*b[j*4] + a[i+4]*b[j*4+1] + a[i+8]*b[j*4+2] + a[i+12]*b[j*4+3];
    }
  }
  return r;
}

function mat4Inverse(m) {
  let s = m, inv = new Float32Array(16);
  inv[0] =s[5]*s[10]*s[15]-s[5]*s[11]*s[14]-s[9]*s[6]*s[15]+s[9]*s[7]*s[14]+s[13]*s[6]*s[11]-s[13]*s[7]*s[10];
  inv[4] =-s[4]*s[10]*s[15]+s[4]*s[11]*s[14]+s[8]*s[6]*s[15]-s[8]*s[7]*s[14]-s[12]*s[6]*s[11]+s[12]*s[7]*s[10];
  inv[8] =s[4]*s[9]*s[15]-s[4]*s[11]*s[13]-s[8]*s[5]*s[15]+s[8]*s[7]*s[13]+s[12]*s[5]*s[11]-s[12]*s[7]*s[9];
  inv[12]=-s[4]*s[9]*s[14]+s[4]*s[10]*s[13]+s[8]*s[5]*s[14]-s[8]*s[6]*s[13]-s[12]*s[5]*s[10]+s[12]*s[6]*s[9];
  inv[1] =-s[1]*s[10]*s[15]+s[1]*s[11]*s[14]+s[9]*s[2]*s[15]-s[9]*s[3]*s[14]-s[13]*s[2]*s[11]+s[13]*s[3]*s[10];
  inv[5] =s[0]*s[10]*s[15]-s[0]*s[11]*s[14]-s[8]*s[2]*s[15]+s[8]*s[3]*s[14]+s[12]*s[2]*s[11]-s[12]*s[3]*s[10];
  inv[9] =-s[0]*s[9]*s[15]+s[0]*s[11]*s[13]+s[8]*s[1]*s[15]-s[8]*s[3]*s[13]-s[12]*s[1]*s[11]+s[12]*s[3]*s[9];
  inv[13]=s[0]*s[9]*s[14]-s[0]*s[10]*s[13]-s[8]*s[1]*s[14]+s[8]*s[2]*s[13]+s[12]*s[1]*s[10]-s[12]*s[2]*s[9];
  inv[2] =s[1]*s[6]*s[15]-s[1]*s[7]*s[14]-s[5]*s[2]*s[15]+s[5]*s[3]*s[14]+s[13]*s[2]*s[7]-s[13]*s[3]*s[6];
  inv[6] =-s[0]*s[6]*s[15]+s[0]*s[7]*s[14]+s[4]*s[2]*s[15]-s[4]*s[3]*s[14]-s[12]*s[2]*s[7]+s[12]*s[3]*s[6];
  inv[10]=s[0]*s[5]*s[15]-s[0]*s[7]*s[13]-s[4]*s[1]*s[15]+s[4]*s[3]*s[13]+s[12]*s[1]*s[7]-s[12]*s[3]*s[5];
  inv[14]=-s[0]*s[5]*s[14]+s[0]*s[6]*s[13]+s[4]*s[1]*s[14]-s[4]*s[2]*s[13]-s[12]*s[1]*s[6]+s[12]*s[2]*s[5];
  inv[3] =-s[1]*s[6]*s[11]+s[1]*s[7]*s[10]+s[5]*s[2]*s[11]-s[5]*s[3]*s[10]-s[9]*s[2]*s[7]+s[9]*s[3]*s[6];
  inv[7] =s[0]*s[6]*s[11]-s[0]*s[7]*s[10]-s[4]*s[2]*s[11]+s[4]*s[3]*s[10]+s[8]*s[2]*s[7]-s[8]*s[3]*s[6];
  inv[11]=-s[0]*s[5]*s[11]+s[0]*s[7]*s[9]+s[4]*s[1]*s[11]-s[4]*s[3]*s[9]-s[8]*s[1]*s[7]+s[8]*s[3]*s[5];
  inv[15]=s[0]*s[5]*s[10]-s[0]*s[6]*s[9]-s[4]*s[1]*s[10]+s[4]*s[2]*s[9]+s[8]*s[1]*s[6]-s[8]*s[2]*s[5];
  let det = s[0]*inv[0]+s[1]*inv[4]+s[2]*inv[8]+s[3]*inv[12];
  if (det === 0) return makeIdentity();
  det = 1/det;
  for (let i = 0; i < 16; i++) inv[i] *= det;
  return inv;
}

function mat4Transpose(m) {
  return new Float32Array([
    m[0],m[4],m[8], m[12],
    m[1],m[5],m[9], m[13],
    m[2],m[6],m[10],m[14],
    m[3],m[7],m[11],m[15]
  ]);
}

function normalMatrix(modelMatrix) {
  return mat4Transpose(mat4Inverse(modelMatrix));
}

function makeLookAt(ex,ey,ez, ax,ay,az, ux,uy,uz) {
  let fx=ax-ex, fy=ay-ey, fz=az-ez;
  let fl=Math.sqrt(fx*fx+fy*fy+fz*fz);
  fx/=fl; fy/=fl; fz/=fl;
  let sx=fy*uz-fz*uy, sy=fz*ux-fx*uz, sz=fx*uy-fy*ux;
  let sl=Math.sqrt(sx*sx+sy*sy+sz*sz);
  sx/=sl; sy/=sl; sz/=sl;
  let ux2=sy*fz-sz*fy, uy2=sz*fx-sx*fz, uz2=sx*fy-sy*fx;
  return new Float32Array([
    sx, ux2, -fx, 0,
    sy, uy2, -fy, 0,
    sz, uz2, -fz, 0,
    -(sx*ex+sy*ey+sz*ez),
    -(ux2*ex+uy2*ey+uz2*ez),
     (fx*ex+fy*ey+fz*ez), 1
  ]);
}

function makePerspective(fovy, aspect, near, far) {
  let f  = 1/Math.tan(fovy/2*Math.PI/180);
  let nf = 1/(near-far);
  return new Float32Array([
    f/aspect, 0, 0,              0,
    0,        f, 0,              0,
    0,        0, (far+near)*nf, -1,
    0,        0, 2*far*near*nf,  0
  ]);
}

// Upload model+normal matrices for a given Float32Array matrix
function setModelMatrix(m) {
  gl.uniformMatrix4fv(u_ModelMatrix,  false, m);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix(m));
}

// Upload positions and normals then draw
function uploadAndDraw(positions, normals, count) {
  let pb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  let nb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.drawArrays(gl.TRIANGLES, 0, count);
}


// ── Draw Cube ────────────────────────────────────────────────
function drawCube(color, matrix) {
  gl.uniform4f(u_BaseColor, color[0], color[1], color[2], color[3]);
  setModelMatrix(matrix);

  // 6 faces, each as 2 triangles with flat normals
  let faces = [
    { v:[-0.5,-0.5,0.5, 0.5,-0.5,0.5, 0.5,0.5,0.5, -0.5,-0.5,0.5, 0.5,0.5,0.5, -0.5,0.5,0.5],  n:[0,0,1]  },
    { v:[0.5,-0.5,-0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5, 0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5,-0.5], n:[0,0,-1] },
    { v:[-0.5,0.5,-0.5,-0.5,0.5,0.5,0.5,0.5,0.5, -0.5,0.5,-0.5,0.5,0.5,0.5,0.5,0.5,-0.5],       n:[0,1,0]  },
    { v:[-0.5,-0.5,0.5,-0.5,-0.5,-0.5,0.5,-0.5,-0.5, -0.5,-0.5,0.5,0.5,-0.5,-0.5,0.5,-0.5,0.5], n:[0,-1,0] },
    { v:[0.5,-0.5,0.5,0.5,-0.5,-0.5,0.5,0.5,-0.5, 0.5,-0.5,0.5,0.5,0.5,-0.5,0.5,0.5,0.5],       n:[1,0,0]  },
    { v:[-0.5,-0.5,-0.5,-0.5,-0.5,0.5,-0.5,0.5,0.5, -0.5,-0.5,-0.5,-0.5,0.5,0.5,-0.5,0.5,-0.5], n:[-1,0,0] },
  ];

  for (let f of faces) {
    let norms = [];
    for (let i = 0; i < 6; i++) norms.push(...f.n);
    uploadAndDraw(f.v, norms, 6);
  }
}


// ── Build & Draw Sphere ──────────────────────────────────────
function buildSphere(segs) {
  let pos = [], norm = [];
  for (let lat = 0; lat < segs; lat++) {
    let t1 = (lat/segs)*Math.PI, t2 = ((lat+1)/segs)*Math.PI;
    for (let lon = 0; lon < segs; lon++) {
      let p1 = (lon/segs)*2*Math.PI, p2 = ((lon+1)/segs)*2*Math.PI;
      let v0=spt(t1,p1), v1=spt(t1,p2), v2=spt(t2,p1), v3=spt(t2,p2);
      pos.push(...v0,...v1,...v2, ...v1,...v3,...v2);
      norm.push(...v0,...v1,...v2, ...v1,...v3,...v2);
    }
  }
  g_sphCount = pos.length/3;
  g_sphPos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphPos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
  g_sphNorm = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphNorm);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norm), gl.STATIC_DRAW);
}

function spt(t, p) {
  return [Math.sin(t)*Math.cos(p), Math.cos(t), Math.sin(t)*Math.sin(p)];
}

function drawSphere(color, matrix) {
  gl.uniform4f(u_BaseColor, color[0], color[1], color[2], color[3]);
  setModelMatrix(matrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphPos);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphNorm);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);
  gl.drawArrays(gl.TRIANGLES, 0, g_sphCount);
}


// ── OBJ Loader ───────────────────────────────────────────────
function loadOBJ(text) {
  let rp=[], rn=[], fp=[], fn=[];
  for (let line of text.split('\n')) {
    line = line.trim();
    if (line.startsWith('v ')) {
      let p=line.split(/\s+/);
      rp.push([parseFloat(p[1]),parseFloat(p[2]),parseFloat(p[3])]);
    } else if (line.startsWith('vn ')) {
      let p=line.split(/\s+/);
      rn.push([parseFloat(p[1]),parseFloat(p[2]),parseFloat(p[3])]);
    } else if (line.startsWith('f ')) {
      let parts=line.split(/\s+/).slice(1);
      let fv=[], fnv=[];
      for (let pt of parts) {
        let idx=pt.split('/');
        fv.push(rp[parseInt(idx[0])-1]);
        fnv.push(rn[parseInt(idx[idx.length-1])-1]||[0,1,0]);
      }
      for (let i=1;i<fv.length-1;i++) {
        fp.push(...fv[0],...fv[i],...fv[i+1]);
        fn.push(...fnv[0],...fnv[i],...fnv[i+1]);
      }
    }
  }
  g_objCount = fp.length/3;
  g_objPos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_objPos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fp), gl.STATIC_DRAW);
  g_objNorm = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_objNorm);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fn), gl.STATIC_DRAW);
  g_objLoaded = true;
  console.log('OBJ loaded: ' + g_objCount + ' verts');
}

function drawOBJ(color, matrix) {
  if (!g_objLoaded) return;
  gl.uniform4f(u_BaseColor, color[0], color[1], color[2], color[3]);
  setModelMatrix(matrix);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_objPos);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_objNorm);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);
  gl.drawArrays(gl.TRIANGLES, 0, g_objCount);
}


// ── UI ───────────────────────────────────────────────────────
function setupUI() {
  bind('cam-x',      v => { g_camX = v; updateSpan('v-cx', v); });
  bind('cam-y',      v => { g_camY = v; updateSpan('v-cy', v); });
  bind('light-speed',v => { g_lightSpeed = v; updateSpan('v-ls', v.toFixed(1)); });
  bind('light-y',    v => { g_lightY     = v; updateSpan('v-ly', v.toFixed(1)); });
  bind('light-x',    v => { g_lightManX  = v; updateSpan('v-lx', v.toFixed(1)); });
  bind('lc-r',       v => { g_lightColor[0] = v; updateSpan('v-lr', v.toFixed(2)); });
  bind('lc-g',       v => { g_lightColor[1] = v; updateSpan('v-lg', v.toFixed(2)); });
  bind('lc-b',       v => { g_lightColor[2] = v; updateSpan('v-lb', v.toFixed(2)); });
  bind('spot-cut',   v => { g_spotCutoff = v; updateSpan('v-sc', v); });

  document.getElementById('btn-light').addEventListener('click', function() {
    g_lightOn = !g_lightOn;
    this.textContent = 'Lighting: ' + (g_lightOn ? 'ON' : 'OFF');
    this.className   = g_lightOn ? 'on' : 'off';
  });
  document.getElementById('btn-normals').addEventListener('click', function() {
    g_showNormals = !g_showNormals;
    this.textContent = 'Show Normals: ' + (g_showNormals ? 'ON' : 'OFF');
    this.className   = g_showNormals ? 'active' : '';
  });
  document.getElementById('btn-spot').addEventListener('click', function() {
    g_spotOn = !g_spotOn;
    this.textContent = 'Spot Light: ' + (g_spotOn ? 'ON' : 'OFF');
    this.className   = g_spotOn ? 'active' : '';
  });
}

function bind(id, fn) {
  document.getElementById(id).addEventListener('input', function() {
    fn(parseFloat(this.value));
  });
}

function updateSpan(id, val) {
  let el = document.getElementById(id);
  if (el) el.textContent = val;
}


// ── Hardcoded OBJ pyramid ────────────────────────────────────
const PYRAMID_OBJ = `
v  0.0  1.5  0.0
v -1.0  0.0  1.0
v  1.0  0.0  1.0
v  1.0  0.0 -1.0
v -1.0  0.0 -1.0
vn  0.0  0.4472  0.8944
vn  0.8944  0.4472  0.0
vn  0.0  0.4472 -0.8944
vn -0.8944  0.4472  0.0
vn  0.0 -1.0  0.0
f 1//1 2//1 3//1
f 1//2 3//2 4//2
f 1//3 4//3 5//3
f 1//4 5//4 2//4
f 2//5 4//5 3//5
f 2//5 5//5 4//5
`;