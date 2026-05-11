// cuon-matrix.js (c) 2012 kanda and matsuda

class Vector3 {
    constructor(opt_src) {
        var v = new Float32Array(3);
        if (opt_src && typeof opt_src === 'object') {
          v[0] = opt_src[0];
          v[1] = opt_src[1];
          v[2] = opt_src[2];
        }
        this.elements = v;
    }

    set(src) {
        var s = src.elements;
        var d = this.elements;

        if (s === d) return;

        for (let i = 0; i < 3; ++i) {
          d[i] = s[i];
        }
        return this;
    }

    add(other) {
        let e = this.elements;
        let o = other.elements;
        e[0] += o[0];
        e[1] += o[1];
        e[2] += o[2];
        return this;
    }

    sub(other) {
        let e = this.elements;
        let o = other.elements;
        e[0] -= o[0];
        e[1] -= o[1];
        e[2] -= o[2];
        return this;
    }

    div(scalar) {
        let e = this.elements;
        e[0] /= scalar;
        e[1] /= scalar;
        e[2] /= scalar;
        return this;
    }

    mul(scalar) {
        let e = this.elements;
        e[0] *= scalar;
        e[1] *= scalar;
        e[2] *= scalar;
        return this;
    }

    static dot(a, b) {
        let x = a.elements;
        let y = b.elements;
        return x[0]*y[0] + x[1]*y[1] + x[2]*y[2];
    }

    static cross(a, b) {
        let x = a.elements;
        let y = b.elements;

        return new Vector3([
            x[1]*y[2] - x[2]*y[1],
            x[2]*y[0] - x[0]*y[2],
            x[0]*y[1] - x[1]*y[0]
        ]);
    }

    magnitude() {
        let e = this.elements;
        return Math.sqrt(e[0]*e[0] + e[1]*e[1] + e[2]*e[2]);
    }

    normalize() {
        let m = this.magnitude();
        if (m > 0) this.div(m);
        return this;
    }
}

class Vector4 {
    constructor(opt_src) {
        var v = new Float32Array(4);
        if (opt_src && typeof opt_src === 'object') {
          v[0] = opt_src[0];
          v[1] = opt_src[1];
          v[2] = opt_src[2];
          v[3] = opt_src[3];
        }
        this.elements = v;
    }
}

class Matrix4 {
    constructor(src) {
        if (src && src.elements) {
            this.elements = new Float32Array(src.elements);
        } else {
            this.elements = new Float32Array([
                1,0,0,0,
                0,1,0,0,
                0,0,1,0,
                0,0,0,1
            ]);
        }
    }

    setIdentity() {
        let e = this.elements;
        e.set([
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ]);
        return this;
    }

    multiply(other) {
        let a = this.elements;
        let b = other.elements;
        let r = new Float32Array(16);

        for (let i = 0; i < 4; i++) {
            let ai0=a[i], ai1=a[i+4], ai2=a[i+8], ai3=a[i+12];
            r[i]    = ai0*b[0] + ai1*b[1] + ai2*b[2] + ai3*b[3];
            r[i+4]  = ai0*b[4] + ai1*b[5] + ai2*b[6] + ai3*b[7];
            r[i+8]  = ai0*b[8] + ai1*b[9] + ai2*b[10]+ ai3*b[11];
            r[i+12] = ai0*b[12]+ ai1*b[13]+ ai2*b[14]+ ai3*b[15];
        }

        this.elements = r;
        return this;
    }

    translate(x,y,z) {
        let e = this.elements;
        e[12] += x;
        e[13] += y;
        e[14] += z;
        return this;
    }

    scale(x,y,z) {
        let e = this.elements;
        e[0]*=x; e[5]*=y; e[10]*=z;
        return this;
    }

    rotate(angle,x,y,z) {
        let m = new Matrix4();
        return this.multiply(m.setRotate(angle,x,y,z));
    }

    setRotate(angle,x,y,z) {
        let e = this.elements;
        let rad = Math.PI * angle / 180;
        let s = Math.sin(rad);
        let c = Math.cos(rad);

        if (x===1) {
            e.set([
                1,0,0,0,
                0,c,s,0,
                0,-s,c,0,
                0,0,0,1
            ]);
        } else if (y===1) {
            e.set([
                c,0,-s,0,
                0,1,0,0,
                s,0,c,0,
                0,0,0,1
            ]);
        } else if (z===1) {
            e.set([
                c,s,0,0,
                -s,c,0,0,
                0,0,1,0,
                0,0,0,1
            ]);
        }

        return this;
    }
}