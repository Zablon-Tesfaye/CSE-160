class Cube {
    constructor() {
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.textureNum = -1; // -1 = solid color, 0/1/2 = texture slot
    }
  
    render() {
      // Pass model matrix
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      // Pass texture mode
      gl.uniform1i(u_texColorWeight, this.textureNum);
  
      // Pass color (used when textureNum == -1)
      let c = this.color;
      gl.uniform4f(u_FragColor, c[0], c[1], c[2], c[3]);
  
      // Draw all 6 faces with UV coords
      // Each face = 2 triangles = 6 vertices
  
      // ── Front face  (z = 1) 
      drawTriangle3DUV(
        [0,0,1,  1,0,1,  1,1,1],
        [0,0,    1,0,    1,1]
      );
      drawTriangle3DUV(
        [0,0,1,  1,1,1,  0,1,1],
        [0,0,    1,1,    0,1]
      );
  
      // ── Back face   (z = 0) 
      drawTriangle3DUV(
        [1,0,0,  0,0,0,  0,1,0],
        [0,0,    1,0,    1,1]
      );
      drawTriangle3DUV(
        [1,0,0,  0,1,0,  1,1,0],
        [0,0,    1,1,    0,1]
      );
  
      // ── Left face   (x = 0) 
      drawTriangle3DUV(
        [0,0,0,  0,0,1,  0,1,1],
        [0,0,    1,0,    1,1]
      );
      drawTriangle3DUV(
        [0,0,0,  0,1,1,  0,1,0],
        [0,0,    1,1,    0,1]
      );
  
      // ── Right face  (x = 1) 
      drawTriangle3DUV(
        [1,0,1,  1,0,0,  1,1,0],
        [0,0,    1,0,    1,1]
      );
      drawTriangle3DUV(
        [1,0,1,  1,1,0,  1,1,1],
        [0,0,    1,1,    0,1]
      );
  
      // ── Top face    (y = 1) 
      drawTriangle3DUV(
        [0,1,1,  1,1,1,  1,1,0],
        [0,0,    1,0,    1,1]
      );
      drawTriangle3DUV(
        [0,1,1,  1,1,0,  0,1,0],
        [0,0,    1,1,    0,1]
      );
  
      // ── Bottom face (y = 0) 
      drawTriangle3DUV(
        [0,0,0,  1,0,0,  1,0,1],
        [0,0,    1,0,    1,1]
      );
      drawTriangle3DUV(
        [0,0,0,  1,0,1,  0,0,1],
        [0,0,    1,1,    0,1]
      );
    }
  }
  
  
  
  //  Helper: draw a single triangle with positions + UVs
  //  verts : flat array of 9 numbers  [x0,y0,z0, x1,y1,z1, x2,y2,z2]
  //  uvs   : flat array of 6 numbers  [u0,v0, u1,v1, u2,v2]
  
  function drawTriangle3DUV(verts, uvs) {
  
    // ── Position buffer 
    let posBuffer = gl.createBuffer();
    if (!posBuffer) { console.log('Failed to create position buffer'); return; }
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    // ── UV buffer 
    let uvBuffer = gl.createBuffer();
    if (!uvBuffer) { console.log('Failed to create UV buffer'); return; }
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
  
    // ── Draw 
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }