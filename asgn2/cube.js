class Cube {
    constructor() {
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
    }
  
    render() {
      let c = this.color;
  
      gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      drawTriangle3D([
        0, 0, 0,   1, 1, 0,   1, 0, 0,
        0, 0, 0,   0, 1, 0,   1, 1, 0,
  
        0, 0, 1,   1, 0, 1,   1, 1, 1,
        0, 0, 1,   1, 1, 1,   0, 1, 1,
  
        0, 1, 0,   0, 1, 1,   1, 1, 1,
        0, 1, 0,   1, 1, 1,   1, 1, 0,
  
        0, 0, 0,   1, 0, 0,   1, 0, 1,
        0, 0, 0,   1, 0, 1,   0, 0, 1,
  
        1, 0, 0,   1, 1, 0,   1, 1, 1,
        1, 0, 0,   1, 1, 1,   1, 0, 1,
  
        0, 0, 0,   0, 0, 1,   0, 1, 1,
        0, 0, 0,   0, 1, 1,   0, 1, 0
      ]);
    }
  }
    