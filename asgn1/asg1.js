
// simple shaders


const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;



// global variables


// canvas and webgl
let canvasThing = null;
let gl = null;

// shader variables
let a_Position = null;
let u_FragColor = null;
let u_Size = null;

// shape mode values
let MODE_POINT = 0;
let MODE_TRIANGLE = 1;
let MODE_CIRCLE = 2;

// current selected settings
let currentMode = MODE_POINT;
let currentColor = [1.0, 0.3, 0.8, 1.0];
let currentSize = 12;
let currentSegments = 14;

// this holds every shape the user makes
let allShapes = [];



// main


function main() {
  setupWebGL();
  connectVariablesToGLSL();
  connectHtmlToJS();

  // draw when mouse is clicked
  canvasThing.onmousedown = function(ev) {
    handleClicks(ev);
  };

  // draw while dragging with left mouse button
  canvasThing.onmousemove = function(ev) {
    if (ev.buttons === 1) {
      handleClicks(ev);
    }
  };

  // black background
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}



// setup functions


function setupWebGL() {
  canvasThing = document.getElementById("webgl");
  gl = canvasThing.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log("Could not get WebGL");
  }
}

function connectVariablesToGLSL() {
  let vertexPart = buildShader(gl.VERTEX_SHADER, VSHADER_SOURCE);
  let fragmentPart = buildShader(gl.FRAGMENT_SHADER, FSHADER_SOURCE);
  let linkedProgram = buildProgram(vertexPart, fragmentPart);

  gl.useProgram(linkedProgram);
  gl.program = linkedProgram;

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_Size = gl.getUniformLocation(gl.program, "u_Size");

  if (a_Position < 0 || !u_FragColor || !u_Size) {
    console.log("Some GLSL variable did not connect right");
  }
}

function buildShader(typeWanted, sourceCode) {
  let shaderPiece = gl.createShader(typeWanted);
  gl.shaderSource(shaderPiece, sourceCode);
  gl.compileShader(shaderPiece);

  if (!gl.getShaderParameter(shaderPiece, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shaderPiece));
    return null;
  }

  return shaderPiece;
}

function buildProgram(vShader, fShader) {
  let prog = gl.createProgram();
  gl.attachShader(prog, vShader);
  gl.attachShader(prog, fShader);
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(prog));
    return null;
  }

  return prog;
}



// html controls


function connectHtmlToJS() {
  // shape buttons
  document.getElementById("pointBtn").onclick = function() {
    currentMode = MODE_POINT;
  };

  document.getElementById("triBtn").onclick = function() {
    currentMode = MODE_TRIANGLE;
  };

  document.getElementById("circleBtn").onclick = function() {
    currentMode = MODE_CIRCLE;
  };

  // clear button
  document.getElementById("clearBtn").onclick = function() {
    allShapes = [];
    renderAllShapes();
  };

  // scene button
  document.getElementById("sceneBtn").onclick = function() {
    makeScene();
  };

  // color sliders
  document.getElementById("redSlide").oninput = function() {
    currentColor[0] = this.value / 100;
  };

  document.getElementById("greenSlide").oninput = function() {
    currentColor[1] = this.value / 100;
  };

  document.getElementById("blueSlide").oninput = function() {
    currentColor[2] = this.value / 100;
  };

  // size slider
  document.getElementById("sizeSlide").oninput = function() {
    currentSize = Number(this.value);
  };

  // circle segments slider
  document.getElementById("segSlide").oninput = function() {
    currentSegments = Number(this.value);
  };
}



// mouse handling


function handleClicks(ev) {
  let xy = convertCoordinatesEventToGL(ev);
  let newShape = null;

  if (currentMode === MODE_POINT) {
    newShape = new PointShape();
  } else if (currentMode === MODE_TRIANGLE) {
    newShape = new TriangleShape();
  } else {
    newShape = new CircleShape();
    newShape.segments = currentSegments;
  }

  // give the shape its values
  newShape.position = [xy[0], xy[1]];
  newShape.color = [currentColor[0], currentColor[1], currentColor[2], currentColor[3]];
  newShape.size = currentSize;

  // save shape and redraw everything
  allShapes.push(newShape);
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  let rect = ev.target.getBoundingClientRect();

  let x = ev.clientX - rect.left;
  let y = ev.clientY - rect.top;

  x = (x - canvasThing.width / 2) / (canvasThing.width / 2);
  y = (canvasThing.height / 2 - y) / (canvasThing.height / 2);

  return [x, y];
}



// draw all saved shapes


function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  let k = 0;
  while (k < allShapes.length) {
    allShapes[k].render();
    k++;
  }
}



// shape classes


class PointShape {
  constructor() {
    this.position = [0, 0];
    this.color = [1, 1, 1, 1];
    this.size = 10;
  }

  render() {
    let p = this.position;
    let c = this.color;
    let s = this.size;

    gl.disableVertexAttribArray(a_Position);
    gl.vertexAttrib3f(a_Position, p[0], p[1], 0.0);

    gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]);
    gl.uniform1f(u_Size, s);

    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class TriangleShape {
  constructor() {
    this.position = [0, 0];
    this.color = [1, 1, 1, 1];
    this.size = 10;
  }

  render() {
    let p = this.position;
    let c = this.color;
    let s = this.size;

    // this controls how far the triangle reaches from the center
    let d = s / 200.0;

    gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]);
    gl.uniform1f(u_Size, s);

    drawTriangle([
      p[0],     p[1] + d,
      p[0] - d, p[1] - d,
      p[0] + d, p[1] - d
    ]);
  }
}

class CircleShape {
  constructor() {
    this.position = [0, 0];
    this.color = [1, 1, 1, 1];
    this.size = 10;
    this.segments = 10;
  }

  render() {
    let center = this.position;
    let c = this.color;
    let radius = this.size / 200.0;
    let pieces = this.segments;

    gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]);
    gl.uniform1f(u_Size, this.size);

    let angleStep = 360 / pieces;

    for (let angleNow = 0; angleNow < 360; angleNow += angleStep) {
      let rad1 = angleNow * Math.PI / 180;
      let rad2 = (angleNow + angleStep) * Math.PI / 180;

      let x1 = center[0] + Math.cos(rad1) * radius;
      let y1 = center[1] + Math.sin(rad1) * radius;

      let x2 = center[0] + Math.cos(rad2) * radius;
      let y2 = center[1] + Math.sin(rad2) * radius;

      drawTriangle([
        center[0], center[1],
        x1, y1,
        x2, y2
      ]);
    }
  }
}



// helper to draw one triangle


function drawTriangle(coords) {
  let buffer = gl.createBuffer();

  if (!buffer) {
    console.log("Buffer was not created");
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}



// picture drawing section
// this part uses only triangles


class FixedTriangle {
  constructor(vertices, color) {
    this.vertices = vertices;
    this.color = color;
  }

  render() {
    let c = this.color;
    gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]);
    gl.uniform1f(u_Size, 1.0);
    drawTriangle(this.vertices);
  }
}

function addFixedTriangle(x1, y1, x2, y2, x3, y3, color) {
  let piece = new FixedTriangle([x1, y1, x2, y2, x3, y3], color);
  allShapes.push(piece);
}

function makeScene() {
    allShapes = [];
  
    // this makes the sky background
    addFixedTriangle(-1.0, -1.0,  1.0, -1.0,  1.0,  1.0, [0.07, 0.08, 0.14, 1.0]);
    addFixedTriangle(-1.0, -1.0, -1.0,  1.0,  1.0,  1.0, [0.07, 0.08, 0.14, 1.0]);
  
    // this makes the moon
    addFixedTriangle(0.55, 0.66, 0.72, 0.92, 0.86, 0.66, [0.95, 0.95, 0.82, 1.0]);
    addFixedTriangle(0.55, 0.66, 0.86, 0.66, 0.72, 0.5, [0.95, 0.95, 0.82, 1.0]);
  
    // this makes the left mountain
    addFixedTriangle(-1.0, -0.38, -0.5, 0.42, -0.05, -0.38, [0.2, 0.24, 0.42, 1.0]);
  
    // this makes the right mountain
    addFixedTriangle(0.05, -0.38, 0.58, 0.48, 1.0, -0.38, [0.18, 0.21, 0.38, 1.0]);
  
    // this makes snow on the left mountain
    addFixedTriangle(-0.6, 0.25, -0.5, 0.42, -0.39, 0.25, [0.92, 0.95, 1.0, 1.0]);
  
    // this makes snow on the right mountain
    addFixedTriangle(0.49, 0.18, 0.58, 0.48, 0.69, 0.18, [0.92, 0.95, 1.0, 1.0]);
  
    // top bar of Z
    addFixedTriangle(-0.74, 0.10, -0.46, 0.10, -0.70, 0.03, [0.93, 0.9, 0.72, 1.0]);
    addFixedTriangle(-0.46, 0.10, -0.42, 0.03, -0.70, 0.03, [0.93, 0.9, 0.72, 1.0]);

    // diagonal middle of Z
    addFixedTriangle(-0.50, 0.03, -0.42, 0.03, -0.70, -0.16, [0.93, 0.9, 0.72, 1.0]);
    addFixedTriangle(-0.50, 0.03, -0.62, -0.16, -0.70, -0.16, [0.93, 0.9, 0.72, 1.0]);

    // bottom bar of Z
    addFixedTriangle(-0.74, -0.16, -0.46, -0.16, -0.70, -0.09, [0.93, 0.9, 0.72, 1.0]);
    addFixedTriangle(-0.46, -0.16, -0.42, -0.09, -0.70, -0.09, [0.93, 0.9, 0.72, 1.0]);
  
    // this makes the letter T on the right mountain
    addFixedTriangle(0.34, 0.12, 0.64, 0.12, 0.6, 0.03, [0.93, 0.9, 0.72, 1.0]);
    addFixedTriangle(0.34, 0.12, 0.38, 0.03, 0.64, 0.12, [0.93, 0.9, 0.72, 1.0]);
  
    addFixedTriangle(0.47, 0.12, 0.56, 0.12, 0.49, -0.16, [0.93, 0.9, 0.72, 1.0]);
    addFixedTriangle(0.56, 0.12, 0.54, -0.16, 0.49, -0.16, [0.93, 0.9, 0.72, 1.0]);
  
    // this makes the ground
    addFixedTriangle(-1.0, -0.38, 1.0, -0.38, 1.0, -1.0, [0.06, 0.35, 0.18, 1.0]);
    addFixedTriangle(-1.0, -0.38, -1.0, -1.0, 1.0, -1.0, [0.06, 0.35, 0.18, 1.0]);
  
    // this makes the left tree top part 1
    addFixedTriangle(-0.86, -0.38, -0.78, -0.04, -0.7, -0.38, [0.0, 0.52, 0.22, 1.0]);
  
    // this makes the left tree top part 2
    addFixedTriangle(-0.84, -0.2, -0.78, 0.05, -0.72, -0.2, [0.0, 0.6, 0.25, 1.0]);
  
    // this makes the left tree top part 3
    addFixedTriangle(-0.82, -0.03, -0.78, 0.17, -0.74, -0.03, [0.0, 0.68, 0.28, 1.0]);
  
    // this makes the left tree trunk
    addFixedTriangle(-0.8, -0.68, -0.76, -0.68, -0.8, -0.38, [0.35, 0.2, 0.1, 1.0]);
    addFixedTriangle(-0.76, -0.68, -0.76, -0.38, -0.8, -0.38, [0.35, 0.2, 0.1, 1.0]);
  
    // this makes the right tree top part 1
    addFixedTriangle(0.76, -0.38, 0.84, -0.08, 0.92, -0.38, [0.0, 0.52, 0.22, 1.0]);
  
    // this makes the right tree top part 2
    addFixedTriangle(0.78, -0.2, 0.84, 0.03, 0.9, -0.2, [0.0, 0.6, 0.25, 1.0]);
  
    // this makes the right tree top part 3
    addFixedTriangle(0.8, -0.04, 0.84, 0.14, 0.88, -0.04, [0.0, 0.68, 0.3, 1.0]);
  
    // this makes the right tree trunk
    addFixedTriangle(0.82, -0.68, 0.86, -0.68, 0.82, -0.38, [0.35, 0.2, 0.1, 1.0]);
    addFixedTriangle(0.86, -0.68, 0.86, -0.38, 0.82, -0.38, [0.35, 0.2, 0.1, 1.0]);
  
    // this makes the tent left side
    addFixedTriangle(-0.5, -0.62, -0.28, -0.3, -0.08, -0.62, [0.7, 0.12, 0.25, 1.0]);
  
    // this makes the tent right side
    addFixedTriangle(-0.28, -0.3, 0.0, -0.62, -0.08, -0.62, [0.9, 0.3, 0.4, 1.0]);
  
    // this makes the tent opening
    addFixedTriangle(-0.3, -0.62, -0.2, -0.48, -0.12, -0.62, [0.18, 0.06, 0.1, 1.0]);
  
    // this makes the campfire outside shape
    addFixedTriangle(-0.04, -0.52, 0.0, -0.35, 0.04, -0.52, [1.0, 0.45, 0.0, 1.0]);
  
    // this makes the campfire inner shape
    addFixedTriangle(-0.025, -0.5, 0.0, -0.4, 0.025, -0.5, [1.0, 0.84, 0.1, 1.0]);
  
    // this makes one log
    addFixedTriangle(-0.08, -0.58, 0.07, -0.5, 0.02, -0.61, [0.45, 0.26, 0.1, 1.0]);
  
    // this makes the other log
    addFixedTriangle(-0.02, -0.5, 0.1, -0.59, -0.06, -0.61, [0.45, 0.26, 0.1, 1.0]);
  
    renderAllShapes();
  }

main();