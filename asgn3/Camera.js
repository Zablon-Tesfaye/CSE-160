class Camera {
  constructor() {
    this.fov    = 60;
    this.eye    = new Vector3([0,  1,  5]);   // starting position
    this.at     = new Vector3([0,  1,  4]);   // looking toward -Z
    this.up     = new Vector3([0,  1,  0]);

    this.viewMatrix       = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.speed = 0.15;

    this._updateMatrices();
  }

  
  //  Internal: recompute both matrices from
  //  current eye / at / up values
  
  _updateMatrices() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );

    this.projectionMatrix.setPerspective(
      this.fov,
      canvas.width / canvas.height,
      0.1,
      1000
    );
  }

  
  //  Move forward  (W)
  
  moveForward() {
    // forward vector = at - eye, normalized, scaled by speed
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();
    f.mul(this.speed);

    this.eye.add(f);
    this.at.add(f);
    this._updateMatrices();
  }

  
  //  Move backward  (S)
  
  moveBackward() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();
    f.mul(this.speed);

    this.eye.sub(f);
    this.at.sub(f);
    this._updateMatrices();
  }

  
  //  Strafe left  (A)
  
  moveLeft() {
    // side = forward x up,  then move eye and at by -side
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();

    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(this.speed);

    this.eye.sub(s);
    this.at.sub(s);
    this._updateMatrices();
  }

  
  //  Strafe right  (D)
  
  moveRight() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();

    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(this.speed);

    this.eye.add(s);
    this.at.add(s);
    this._updateMatrices();
  }

  
  //  Pan left  (Q)  — rotate 'at' around up axis
  
  panLeft(degrees = 5) {
    // Build rotation matrix around up vector
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);

    let rot = new Matrix4();
    rot.setRotate(degrees, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    let f_prime = rot.multiplyVector3(f);
    this.at.set(this.eye);
    this.at.add(f_prime);
    this._updateMatrices();
  }

  
  //  Pan right  (E)
  
  panRight(degrees = 5) {
    this.panLeft(-degrees);
  }

  
  //  Mouse look  — called with delta x/y from
  //  mousemove handler in World.js
  
  panMouse(dx, dy) {
    // Horizontal: rotate around world up (Y axis)
    if (dx !== 0) {
      let f = new Vector3(this.at.elements);
      f.sub(this.eye);

      let rotY = new Matrix4();
      rotY.setRotate(dx * 0.3, 0, 1, 0);

      let f_prime = rotY.multiplyVector3(f);
      this.at.set(this.eye);
      this.at.add(f_prime);
    }

    // Vertical: rotate around the camera's local right (side) axis
    if (dy !== 0) {
      // Recompute forward from current at (may have changed above)
      let f = new Vector3(this.at.elements);
      f.sub(this.eye);
      f.normalize();

      let s = Vector3.cross(f, this.up);
      s.normalize();

      let rotX = new Matrix4();
      rotX.setRotate(dy * 0.3, s.elements[0], s.elements[1], s.elements[2]);

      // Compute at - eye manually into a fresh vector (avoid chaining bug)
      let diff = new Vector3([
        this.at.elements[0] - this.eye.elements[0],
        this.at.elements[1] - this.eye.elements[1],
        this.at.elements[2] - this.eye.elements[2]
      ]);

      let f_prime = rotX.multiplyVector3(diff);
      this.at.set(this.eye);
      this.at.add(f_prime);
    }

    this._updateMatrices();
  }
}




//  (cuon-matrix-cse160 doesn't include this by default)

Matrix4.prototype.multiplyVector3 = function(v) {
  let e = this.elements;
  let p = v.elements;

  let x = e[0]*p[0] + e[4]*p[1] + e[8] *p[2];
  let y = e[1]*p[0] + e[5]*p[1] + e[9] *p[2];
  let z = e[2]*p[0] + e[6]*p[1] + e[10]*p[2];

  return new Vector3([x, y, z]);
};



//  Patch Matrix4 to support setLookAt  (manual implementation
//  since the stripped cuon-matrix-cse160 may not have it)

Matrix4.prototype.setLookAt = function(
  eyeX,  eyeY,  eyeZ,
  atX,   atY,   atZ,
  upX,   upY,   upZ
) {
  // forward vector (eye → at), normalized
  let fx = atX - eyeX,  fy = atY - eyeY,  fz = atZ - eyeZ;
  let rl = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
  fx *= rl;  fy *= rl;  fz *= rl;

  // side = forward x up, normalized
  let sx = fy*upZ - fz*upY;
  let sy = fz*upX - fx*upZ;
  let sz = fx*upY - fy*upX;
  rl = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
  sx *= rl;  sy *= rl;  sz *= rl;

  // recomputed up = side x forward
  let ux = sy*fz - sz*fy;
  let uy = sz*fx - sx*fz;
  let uz = sx*fy - sy*fx;

  this.elements.set([
     sx,  ux, -fx, 0,
     sy,  uy, -fy, 0,
     sz,  uz, -fz, 0,
    -(sx*eyeX + sy*eyeY + sz*eyeZ),
    -(ux*eyeX + uy*eyeY + uz*eyeZ),
     (fx*eyeX + fy*eyeY + fz*eyeZ),
    1
  ]);
  return this;
};



//  Patch Matrix4 to support setPerspective
Matrix4.prototype.setPerspective = function(fovy, aspect, near, far) {
  let f  = 1.0 / Math.tan((fovy / 2) * Math.PI / 180);
  let nf = 1   / (near - far);

  this.elements.set([
    f / aspect, 0,  0,                    0,
    0,          f,  0,                    0,
    0,          0,  (far + near) * nf,   -1,
    0,          0,  2 * far * near * nf,  0
  ]);
  return this;
};