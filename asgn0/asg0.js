// asg0.js (c) 2012 matsuda
function main() {  
  // Retrieve canvas element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the context for a 2D
  var ctx = canvas.getContext('2d');

  //make the entire canvas black
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0, canvas.width, canvas.height);

  //create vector V1
  let v1 = new Vector3([2.25, 2.25, 0]);


  //Draw v1 in red
  drawVector(ctx,  v1, 'red'); 
}

function drawVector(ctx, v, color) {
  var canvas = document.getElementById('example');

  // The center of the canvas
  var x = canvas.width / 2;
  var y = canvas.height /2;

  ctx.beginPath();
  ctx.moveTo(x,y);

  // Scale size of Vector by 20
  ctx.lineTo(x + v.elements[0] * 20, y - v.elements[1] * 20);

  ctx.strokeStyle = color;
  ctx.stroke();
}

function handleDrawEvent() {
  var canvas = document.getElementById('example');
  if(!canvas) {
    console.log('Failed to retrieve <canvas> element');
    return false;
  }
  var ctx = canvas.getContext('2d');

  // Clear the canvas and make the canvas back to black again
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Get user input values for v1
  var x1 = document.getElementById('x1_box').value;
  var y1 = document.getElementById('y1_box').value;

  // Make a v1 for the users input
  let v1 = new Vector3([Number(x1), Number(y1), 0]);

  drawVector(ctx, v1, 'red');

  // Get user input values for v2
  var x2 = document.getElementById('x2_box').value;
  var y2 = document.getElementById('y2_box').value;

  let v2 = new Vector3([Number(x2), Number(y2), 0]);
  drawVector(ctx, v2, 'blue');

}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve <canvas> element');
    return false;
  }

  var ctx = canvas.getContext('2d');

  // clear canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // get v1 values
  var x1 = document.getElementById('x1_box').value;
  var y1 = document.getElementById('y1_box').value;

  // get v2 values
  var x2 = document.getElementById('x2_box').value;
  var y2 = document.getElementById('y2_box').value;

  // make vectors
  let v1 = new Vector3([Number(x1), Number(y1), 0]);
  let v2 = new Vector3([Number(x2), Number(y2), 0]);

  // draw original vectors
  drawVector(ctx, v1, 'red');
  drawVector(ctx, v2, 'blue');

  // get operation and scalar
  var op = document.getElementById('operation_box').value;
  var s = Number(document.getElementById('scalar_box').value);

  if (op == 'add') {
    let v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.add(v2);
    drawVector(ctx, v3, 'green');
  }

  else if (op == 'sub') {
    let v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.sub(v2);
    drawVector(ctx, v3, 'green');
  }

  else if (op == 'mul') {
    let v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    let v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);

    v3.mul(s);
    v4.mul(s);

    drawVector(ctx, v3, 'green');
    drawVector(ctx, v4, 'green');
  }

  else if (op == 'div') {
    let v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    let v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);

    v3.div(s);
    v4.div(s);

    drawVector(ctx, v3, 'green');
    drawVector(ctx, v4, 'green');
  }

  else if (op == 'mag') {
    console.log('Magnitude v1: ' + v1.magnitude());
    console.log('Magnitude v2: ' + v2.magnitude());
  }

  else if (op == 'nor') {
    let v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    let v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);

    v3.normalize();
    v4.normalize();

    drawVector(ctx, v3, 'green');
    drawVector(ctx, v4, 'green');
  }
  else if (op == 'angle') {
    console.log('Angle: ' + angleBetween(v1, v2));
  }
  else if (op == 'area') {
    console.log('Area of triangle: ' + areaTriangle(v1, v2));
  }
}

function angleBetween(v1, v2) {
  let top = Vector3.dot(v1, v2);
  let bottom = v1.magnitude() * v2.magnitude();

  let cosAlpha = top / bottom;

  let angleRad = Math.acos(cosAlpha);
  let angleDeg = angleRad * 180 / Math.PI;

  return angleDeg;
}

function areaTriangle(v1, v2) {
  let crossVec = Vector3.cross(v1, v2);

  let areaPara = crossVec.magnitude();  // parallelogram
  let areaTri = areaPara / 2;           // triangle

  return areaTri;
}

