// simple 3D fox for ASG2

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;

  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;

  void main() {
    gl_FragColor = u_FragColor;
  }
`;

let canvas, gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_globalAngle = 180;
let g_legAngle = 0;
let g_headAngle = 0;
let g_tailAngle = 0;
let g_bodyHop = 0;
let g_headBob = 0;
let g_animation = false;

let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;

class Cube {
  constructor() {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    let v = new Float32Array([
      -0.5,-0.5,0.5, 0.5,-0.5,0.5, 0.5,0.5,0.5,
      -0.5,-0.5,0.5, 0.5,0.5,0.5, -0.5,0.5,0.5,

      -0.5,-0.5,-0.5, -0.5,0.5,-0.5, 0.5,0.5,-0.5,
      -0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,-0.5,-0.5,

      -0.5,0.5,-0.5, -0.5,0.5,0.5, 0.5,0.5,0.5,
      -0.5,0.5,-0.5, 0.5,0.5,0.5, 0.5,0.5,-0.5,

      -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,-0.5,0.5,
      -0.5,-0.5,-0.5, 0.5,-0.5,0.5, -0.5,-0.5,0.5,

      0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5,0.5,
      0.5,-0.5,-0.5, 0.5,0.5,0.5, 0.5,-0.5,0.5,

      -0.5,-0.5,-0.5, -0.5,-0.5,0.5, -0.5,0.5,0.5,
      -0.5,-0.5,-0.5, -0.5,0.5,0.5, -0.5,0.5,-0.5
    ]);

    drawTriangle3D(v);
  }
}

class Pyramid {
  constructor() {
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    let v = new Float32Array([
      -0.5,0,-0.5, 0.5,0,-0.5, 0.5,0,0.5,
      -0.5,0,-0.5, 0.5,0,0.5, -0.5,0,0.5,

      -0.5,0,0.5, 0.5,0,0.5, 0,1,0,
      0.5,0,0.5, 0.5,0,-0.5, 0,1,0,
      0.5,0,-0.5, -0.5,0,-0.5, 0,1,0,
      -0.5,0,-0.5, -0.5,0,0.5, 0,1,0
    ]);

    drawTriangle3D(v);
  }
}

function drawTriangle3D(vertices) {
  let buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
}

function main() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  gl.enable(gl.DEPTH_TEST);

  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix");

  addActionsForHtmlUI();
  tick();
}

function addActionsForHtmlUI() {
  document.getElementById("angleSlide").value = 180;

  document.getElementById("angleSlide").addEventListener("mousemove", function() {
    g_globalAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("legSlide").addEventListener("mousemove", function() {
    g_legAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("headSlide").addEventListener("mousemove", function() {
    g_headAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("tailSlide").addEventListener("mousemove", function() {
    g_tailAngle = Number(this.value);
    renderScene();
  });

  document.getElementById("animationOn").onclick = function() {
    g_animation = true;
  };

  document.getElementById("animationOff").onclick = function() {
    g_animation = false;
  };

  document.getElementById("resetBtn").onclick = function() {
    g_globalAngle = 180;
    g_legAngle = 0;
    g_headAngle = 0;
    g_tailAngle = 0;
    g_bodyHop = 0;
    g_headBob = 0;
    g_animation = false;

    document.getElementById("angleSlide").value = 180;
    document.getElementById("legSlide").value = 0;
    document.getElementById("headSlide").value = 0;
    document.getElementById("tailSlide").value = 0;

    renderScene();
  };
}

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;

  if (g_animation) {
    g_legAngle = g_seconds * 4;
    g_bodyHop = 0.025 * Math.abs(Math.sin(g_seconds * 4));
    g_headBob = 0.018 * Math.sin(g_seconds * 3);
  } else {
    g_bodyHop = 0;
    g_headBob = 0;
  }

  renderScene();
  requestAnimationFrame(tick);
}

function makeCube(color, matrix) {
  let c = new Cube();
  c.color = color;
  c.matrix = matrix;
  c.render();
}

function makePyramid(color, matrix) {
  let p = new Pyramid();
  p.color = color;
  p.matrix = matrix;
  p.render();
}

function drawLeg(x, z, sideShift, angle) {
  let black = [0.02, 0.02, 0.02, 1];

  let upper = new Matrix4();
  upper.translate(x + sideShift, -0.40 + g_bodyHop, z);
  upper.rotate(angle * 0.45, 1, 0, 0);
  upper.scale(0.08, 0.24, 0.08);
  makeCube(black, upper);

  let lower = new Matrix4();
  lower.translate(x + sideShift, -0.62 + g_bodyHop, z);
  lower.rotate(-angle * 0.20, 1, 0, 0);
  lower.scale(0.075, 0.22, 0.075);
  makeCube(black, lower);
}

function drawNeckFur(baseX) {
  let furColor = [1.0, 0.55, 0.08, 1];

  let fur1 = new Matrix4();
  fur1.translate(baseX, -0.02 + g_bodyHop, 0.20);
  fur1.rotate(180, 0, 0, 1);
  fur1.scale(0.15, 0.22, 0.08);
  makePyramid(furColor, fur1);

  let fur2 = new Matrix4();
  fur2.translate(baseX, -0.02 + g_bodyHop, -0.20);
  fur2.rotate(180, 0, 0, 1);
  fur2.scale(0.15, 0.22, 0.08);
  makePyramid(furColor, fur2);

  let fur3 = new Matrix4();
  fur3.translate(baseX + 0.04, -0.09 + g_bodyHop, 0);
  fur3.rotate(180, 0, 0, 1);
  fur3.scale(0.18, 0.25, 0.10);
  makePyramid(furColor, fur3);
}

function renderScene() {
  gl.clearColor(0.66, 0.83, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  let orange = [1.0, 0.43, 0.05, 1];
  let darkOrange = [0.9, 0.25, 0.02, 1];
  let black = [0.02, 0.02, 0.02, 1];
  let white = [1.0, 0.92, 0.75, 1];

  let body = new Matrix4();
  body.translate(0, -0.15 + g_bodyHop, -0.25);
  body.scale(0.45, 0.32, 0.95);
  makeCube(orange, body);

  let neck = new Matrix4();
  neck.translate(0, 0.06 + g_bodyHop, 0.25);
  neck.scale(0.22, 0.26, 0.22);
  makeCube(darkOrange, neck);

  drawNeckFur(0);

  let headBase = new Matrix4();
  headBase.translate(0, 0.35 + g_bodyHop + g_headBob, 0.47);
  headBase.rotate(g_headAngle, 0, 1, 0);

  let head = new Matrix4(headBase);
  head.rotate(180, 0, 0, 1);
  head.scale(0.44, 0.42, 0.36);
  makePyramid(orange, head);

  let earLeft = new Matrix4(headBase);
  earLeft.translate(-0.18, -0.02, 0);
  earLeft.scale(0.15, 0.30, 0.12);
  makePyramid(darkOrange, earLeft);

  let earRight = new Matrix4(headBase);
  earRight.translate(0.18, -0.02, 0);
  earRight.scale(0.15, 0.30, 0.12);
  makePyramid(darkOrange, earRight);

  let innerLeft = new Matrix4(headBase);
  innerLeft.translate(-0.18, 0.04, 0.025);
  innerLeft.scale(0.055, 0.13, 0.025);
  makePyramid(white, innerLeft);

  let innerRight = new Matrix4(headBase);
  innerRight.translate(0.18, 0.04, 0.025);
  innerRight.scale(0.055, 0.13, 0.025);
  makePyramid(white, innerRight);

  let facePatch = new Matrix4(headBase);
  facePatch.translate(0, -0.21, 0.145);
  facePatch.scale(0.25, 0.17, 0.04);
  makeCube(white, facePatch);

  let chin = new Matrix4(headBase);
  chin.translate(0, -0.34, 0.13);
  chin.scale(0.15, 0.08, 0.04);
  makeCube(white, chin);

  let nose = new Matrix4(headBase);
  nose.translate(0, -0.24, 0.175);
  nose.scale(0.075, 0.055, 0.035);
  makeCube(black, nose);

  let eyeLeft = new Matrix4(headBase);
  eyeLeft.translate(-0.11, -0.09, 0.155);
  eyeLeft.scale(0.045, 0.045, 0.025);
  makeCube(black, eyeLeft);

  let eyeRight = new Matrix4(headBase);
  eyeRight.translate(0.11, -0.09, 0.155);
  eyeRight.scale(0.045, 0.045, 0.025);
  makeCube(black, eyeRight);

  let tailBase = new Matrix4();
  tailBase.translate(0, -0.02 + g_bodyHop, -0.83);
  tailBase.rotate(g_tailAngle, 0, 1, 0);
  tailBase.rotate(25, 1, 0, 0);

  let tail = new Matrix4(tailBase);
  tail.scale(0.32, 0.20, 0.42);
  makeCube(darkOrange, tail);

  let tailTip = new Matrix4(tailBase);
  tailTip.translate(0, 0.02, -0.28);
  tailTip.scale(0.25, 0.16, 0.18);
  makeCube(white, tailTip);

  let walkA = 9 * Math.sin(g_legAngle);
  let walkB = 9 * Math.sin(g_legAngle + Math.PI);
  let walkC = 9 * Math.sin(g_legAngle + Math.PI / 2);
  let walkD = 9 * Math.sin(g_legAngle + Math.PI * 1.5);

  drawLeg(-0.18, 0.08, -0.04, walkA);
  drawLeg(0.18, 0.08, 0.04, walkB);
  drawLeg(-0.13, -0.58, 0.04, walkC);
  drawLeg(0.13, -0.58, -0.04, walkD);

  let ground = new Matrix4();
  ground.translate(0, -0.95, 0);
  ground.scale(2.5, 0.05, 1.5);
  makeCube([0.25, 0.65, 0.25, 1], ground);
}