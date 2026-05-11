// World.js
// Main file that sets up WebGL, handles input, builds the world, and runs the render loop

// Global WebGL context and canvas
let canvas;
let gl;

// Attribute locations in the shader
let a_Position;
let a_UV;

// Uniform locations in the shader
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_FragColor;
let u_texColorWeight;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;

// Camera object and keyboard state
let camera;
let keys = {};

// Variables used to track FPS
let lastTime    = 0;
let frameCount  = 0;
let fpsInterval = 0;

// 32x32 world map. Each number is the height of the wall at that cell.
// 0 means empty, 1-4 means a wall that many cubes tall.
let g_map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,1],
  [1,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,3,0,0,0,0,0,1],
  [1,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,3,0,0,0,0,0,1],
  [1,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,4,4,4,4,4,4,0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,4,0,0,0,0,4,0,0,0,0,4,0,0,0,0,4,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,4,0,0,0,0,4,0,0,0,0,4,0,0,0,0,4,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
  [1,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,1],
  [1,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,1],
  [1,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Pre-built array of wall cube objects, rebuilt whenever the map changes
let g_wallCubes = [];


// Entry point, called when the page loads
function main() {
  canvas = document.getElementById('webgl');
  if (!canvas) {
    console.log('Failed to get canvas element');
    return;
  }

  gl = canvas.getContext('webgl', { antialias: false });
  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }

  // Grab shader source from the script tags in index.html and compile them
  let vShader = document.getElementById('vertex-shader').textContent;
  let fShader = document.getElementById('fragment-shader').textContent;

  if (!initShaders(gl, vShader, fShader)) {
    console.log('Failed to init shaders');
    return;
  }

  // Get the locations of the attributes we declared in the vertex shader
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV       = gl.getAttribLocation(gl.program, 'a_UV');

  if (a_Position < 0 || a_UV < 0) {
    console.log('Failed to get attribute locations');
    return;
  }

  // Get the locations of all uniforms we need to pass data into the shaders
  u_ModelMatrix      = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix       = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_FragColor        = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_texColorWeight   = gl.getUniformLocation(gl.program, 'u_texColorWeight');
  u_Sampler0         = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1         = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2         = gl.getUniformLocation(gl.program, 'u_Sampler2');

  if (!u_ModelMatrix || !u_ViewMatrix || !u_ProjectionMatrix ||
      !u_FragColor   || !u_texColorWeight) {
    console.log('Failed to get uniform locations');
    return;
  }

  // Enable depth testing so closer faces draw on top of farther ones
  // Enable face culling to skip drawing back faces we will never see
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0.2, 0.3, 0.4, 1.0);

  // Tell each sampler uniform which texture unit it should read from
  gl.uniform1i(u_Sampler0, 0);
  gl.uniform1i(u_Sampler1, 1);
  gl.uniform1i(u_Sampler2, 2);

  camera = new Camera();

  initInputHandlers();
  initTextures();
  initWorld();

  tick();
}


// Sets up all keyboard and mouse event listeners
function initInputHandlers() {

  // Track which keys are held down so movement is smooth every frame
  document.addEventListener('keydown', function(ev) {
    keys[ev.key.toLowerCase()] = true;
  });

  document.addEventListener('keyup', function(ev) {
    keys[ev.key.toLowerCase()] = false;
  });

  // Click the canvas to lock the mouse pointer for FPS style mouse look
  canvas.addEventListener('click', function() {
    canvas.requestPointerLock();
  });

  // Add or remove the mousemove listener depending on whether pointer is locked
  document.addEventListener('pointerlockchange', function() {
    if (document.pointerLockElement === canvas) {
      document.addEventListener('mousemove', onMouseMove);
    } else {
      document.removeEventListener('mousemove', onMouseMove);
    }
  });

  // F adds a block in front of the player, G removes one
  document.addEventListener('keydown', function(ev) {
    if (ev.key.toLowerCase() === 'f') addBlock();
    if (ev.key.toLowerCase() === 'g') deleteBlock();
  });
}

// Runs every frame and moves the camera based on what keys are currently held
function handleKeys() {
  if (keys['w']) camera.moveForward();
  if (keys['s']) camera.moveBackward();
  if (keys['a']) camera.moveLeft();
  if (keys['d']) camera.moveRight();
  if (keys['q']) camera.panLeft();
  if (keys['e']) camera.panRight();
}

// Called on every mouse movement while pointer is locked
// movementX and movementY give us the delta directly so we dont need to track last position
function onMouseMove(ev) {
  let dx = ev.movementX || 0;
  let dy = ev.movementY || 0;
  camera.panMouse(dx, dy);
}


// Main render loop, runs once per frame
function tick() {
  handleKeys();
  updateGame();
  renderAllShapes();
  updateHUD();
  requestAnimationFrame(tick);
}

// Clears the screen and draws everything in the world each frame
function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Upload the camera matrices so all objects are drawn from the right viewpoint
  gl.uniformMatrix4fv(u_ViewMatrix,       false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  drawSky();
  drawGround();
  drawWalls();
  drawOrbs();
}


// Updates the FPS counter and camera position shown on screen
function updateHUD() {
  frameCount++;
  let now = performance.now();

  // Only recalculate FPS every 500ms so the number doesnt flicker too fast
  if (now - fpsInterval >= 500) {
    let fps = Math.round(frameCount / ((now - fpsInterval) / 1000));
    let remaining = g_orbs.filter(o => !o.collected).length;
    document.getElementById('fps').textContent =
      'FPS: ' + fps + '  |  Orbs: ' + (g_orbs.length - remaining) + '/' + g_orbs.length;
    frameCount  = 0;
    fpsInterval = now;
  }

  // Show the players current position in the world
  let e = camera.eye.elements;
  document.getElementById('pos').textContent =
    'Pos: (' +
    e[0].toFixed(1) + ', ' +
    e[1].toFixed(1) + ', ' +
    e[2].toFixed(1) + ')';
}


// How far in front of the player we look when adding or deleting blocks
const REACH = 2.5;

// Figures out which map cell the player is looking at based on their position and direction
function getTargetCell() {
  let eye = camera.eye.elements;

  // Get the horizontal forward direction and normalize it
  let fx = camera.at.elements[0] - eye[0];
  let fz = camera.at.elements[2] - eye[2];
  let len = Math.sqrt(fx*fx + fz*fz);
  if (len < 0.0001) return null;
  fx /= len;
  fz /= len;

  // Step REACH units ahead and convert to a grid cell
  let tx = Math.floor(eye[0] + fx * REACH);
  let tz = Math.floor(eye[2] + fz * REACH);

  // Make sure the target is inside the map bounds
  if (tz < 0 || tz >= g_map.length)    return null;
  if (tx < 0 || tx >= g_map[0].length) return null;
  return { x: tx, z: tz };
}

// Adds one block height to the cell in front of the player, max height is 4
function addBlock() {
  let cell = getTargetCell();
  if (!cell) return;
  if (g_map[cell.z][cell.x] >= 4) return;
  g_map[cell.z][cell.x]++;
  buildWalls();
}

// Removes one block height from the cell in front of the player, minimum is 0
function deleteBlock() {
  let cell = getTargetCell();
  if (!cell) return;
  if (g_map[cell.z][cell.x] <= 0) return;
  g_map[cell.z][cell.x]--;
  buildWalls();
}


// Simple game where you walk into all 5 orbs to win
// Orbs are placed at the 4 corners and center of the map
let g_orbs = [
  { x: 5,  z: 5,  collected: false },
  { x: 26, z: 5,  collected: false },
  { x: 5,  z: 26, collected: false },
  { x: 26, z: 26, collected: false },
  { x: 16, z: 16, collected: false },
];

const ORB_COLLECT_DIST = 1.5;
let g_gameWon = false;

// Checks every frame if the player walked close enough to collect an orb
function updateGame() {
  if (g_gameWon) return;

  let eye = camera.eye.elements;
  let allDone = true;

  for (let orb of g_orbs) {
    if (orb.collected) continue;
    allDone = false;

    let dx = eye[0] - (orb.x + 0.5);
    let dz = eye[2] - (orb.z + 0.5);

    if (Math.sqrt(dx*dx + dz*dz) < ORB_COLLECT_DIST) {
      orb.collected = true;
      let remaining = g_orbs.filter(o => !o.collected).length;
      showMessage(remaining === 0
        ? '🎉 You collected all orbs! You win!'
        : `✨ Orb collected! ${remaining} remaining...`);
    }
  }

  if (allDone) g_gameWon = true;
}

// Draws each uncollected orb as a small yellow cube that bobs up and down
function drawOrbs() {
  for (let orb of g_orbs) {
    if (orb.collected) continue;

    // Bob up and down using a sine wave so they look animated
    let bob = Math.sin(performance.now() / 400) * 0.15;

    let c = new Cube();
    c.textureNum = -1;
    c.color = [1.0, 0.95, 0.2, 1.0];
    c.matrix.setIdentity();
    c.matrix.translate(orb.x + 0.25, 1.0 + bob, orb.z + 0.25);
    c.matrix.scale(0.5, 0.5, 0.5);
    c.render();
  }
}

// Shows a message on screen for 3 seconds, or permanently if the game is won
let g_msgTimeout = null;
function showMessage(text) {
  let el = document.getElementById('game-msg');
  if (!el) {
    el = document.createElement('div');
    el.id = 'game-msg';
    el.style.cssText = `
      position: absolute; bottom: 20px; left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.75); color: #ffe066;
      font-family: 'Courier New', monospace; font-size: 15px;
      padding: 10px 22px; border-radius: 6px;
      border: 1px solid #ffe066; pointer-events: none; white-space: nowrap;
    `;
    document.getElementById('canvas-container').appendChild(el);
  }
  el.textContent = text;
  el.style.display = 'block';
  if (g_msgTimeout) clearTimeout(g_msgTimeout);
  if (!g_gameWon) g_msgTimeout = setTimeout(() => { el.style.display = 'none'; }, 3000);
}


// Generates all three textures procedurally using a hidden 2D canvas
// This avoids needing a web server to load image files
function initTextures() {
  loadProceduralTexture(makeBrickCanvas(), gl.TEXTURE0, u_Sampler0);
  loadProceduralTexture(makeGrassCanvas(), gl.TEXTURE1, u_Sampler1);
  loadProceduralTexture(makeSkyCanvas(),   gl.TEXTURE2, u_Sampler2);
}

// Takes a canvas element, uploads its pixels to a WebGL texture unit,
// and sets up mipmaps and filtering
function loadProceduralTexture(offscreen, textureUnit, samplerUniform) {
  let tex = gl.createTexture();
  gl.activeTexture(textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);

  // Generate mipmaps and use nearest filtering for a crisp Minecraft look
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  gl.uniform1i(samplerUniform, textureUnit - gl.TEXTURE0);
}

// Texture 0: Minecraft style grass block used on the walls
// Green top strip with brown dirt below
function makeBrickCanvas() {
  const SIZE = 128;
  let c = document.createElement('canvas');
  c.width = c.height = SIZE;
  let ctx = c.getContext('2d');

  ctx.fillStyle = '#8B6340';
  ctx.fillRect(0, 0, SIZE, SIZE);

  for (let i = 0; i < 200; i++) {
    let x = Math.random() * SIZE;
    let y = Math.random() * SIZE * 0.75 + SIZE * 0.25;
    let r = Math.random() * 2.5 + 0.5;
    let v = 90 + Math.floor(Math.random() * 50);
    ctx.fillStyle = `rgb(${v}, ${Math.floor(v*0.6)}, ${Math.floor(v*0.3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  let grassH = Math.floor(SIZE * 0.28);
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, SIZE, grassH);

  for (let i = 0; i < 80; i++) {
    let x = Math.random() * SIZE;
    let h = 4 + Math.random() * 10;
    let g = 120 + Math.floor(Math.random() * 80);
    ctx.fillStyle = `rgb(20, ${g}, 20)`;
    ctx.fillRect(x, 0, 2, h);
  }

  ctx.fillStyle = '#2d5a1b';
  ctx.fillRect(0, grassH - 2, SIZE, 3);

  return c;
}

// Texture 1: Top-down green grass used on the ground plane
function makeGrassCanvas() {
  const SIZE = 128;
  let c = document.createElement('canvas');
  c.width = c.height = SIZE;
  let ctx = c.getContext('2d');

  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, SIZE, SIZE);

  for (let i = 0; i < 400; i++) {
    let x = Math.random() * SIZE;
    let y = Math.random() * SIZE;
    let r = Math.random() * 4 + 1;
    let g = 130 + Math.floor(Math.random() * 80);
    ctx.fillStyle = `rgb(20, ${g}, 20)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint grid lines to give the ground a tiled feel
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= SIZE; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(SIZE, i); ctx.stroke();
  }

  return c;
}

// Texture 2: Blue gradient sky with white clouds painted on
function makeSkyCanvas() {
  const SIZE = 128;
  let c = document.createElement('canvas');
  c.width = c.height = SIZE;
  let ctx = c.getContext('2d');

  let grad = ctx.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0,   '#1a6faf');
  grad.addColorStop(0.5, '#4a9fd4');
  grad.addColorStop(1,   '#87ceeb');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  drawCloud(ctx, 20,  30, 35, 14);
  drawCloud(ctx, 80,  20, 28, 10);
  drawCloud(ctx, 55,  70, 40, 15);
  drawCloud(ctx, 10,  90, 22,  9);
  drawCloud(ctx, 100, 80, 20,  8);

  return c;
}

// Helper that draws a simple cloud shape made of overlapping ellipses
function drawCloud(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.ellipse(x,         y,         w * 0.5,  h * 0.6,  0, 0, Math.PI * 2);
  ctx.ellipse(x + w*0.3, y - h*0.2, w * 0.4,  h * 0.5,  0, 0, Math.PI * 2);
  ctx.ellipse(x + w*0.6, y,         w * 0.45, h * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
}


// Called once at startup to build the initial wall cube list
function initWorld() {
  buildWalls();
}

// Loops through g_map and creates a Cube for each unit of height at each cell
// We store them all in g_wallCubes so we dont create new objects every frame
function buildWalls() {
  g_wallCubes = [];

  for (let z = 0; z < g_map.length; z++) {
    for (let x = 0; x < g_map[z].length; x++) {
      let height = g_map[z][x];
      if (height === 0) continue;

      for (let y = 0; y < height; y++) {
        let c = new Cube();
        c.textureNum = 0;
        c.matrix.setIdentity();
        c.matrix.translate(x, y, z);
        g_wallCubes.push(c);
      }
    }
  }
}

// Draws a large flat cube scaled to cover the entire 32x32 map as the ground
function drawGround() {
  let ground = new Cube();
  ground.textureNum = 1;
  ground.matrix.setIdentity();
  ground.matrix.translate(-1, -1, -1);
  ground.matrix.scale(34, 1, 34);
  ground.render();
}

// Draws a giant cube around the whole world as the sky box
// Face culling has to be disabled here so the inside faces are visible
function drawSky() {
  gl.disable(gl.CULL_FACE);

  let sky = new Cube();
  sky.textureNum = 2;
  sky.matrix.setIdentity();
  sky.matrix.translate(-484, -484, -484);
  sky.matrix.scale(1000, 1000, 1000);
  sky.render();

  gl.enable(gl.CULL_FACE);
}

// Draws all the pre-built wall cubes from the g_wallCubes array
function drawWalls() {
  for (let cube of g_wallCubes) {
    cube.render();
  }
}


window.onload = main;