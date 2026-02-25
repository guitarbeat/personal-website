// @ts-nocheck
import * as ogl from "ogl";

const { Vec2, Program, RenderTarget, Triangle, Mesh } = ogl;

const defaultVertex =
  "attribute vec2 uv, position; varying vec2 vUv; void main() {vUv = uv; gl_Position = vec4(position, 0, 1);}";

const rto = (gl, width, height, type) => ({
  width,
  height,
  type:
    type ||
    gl.HALF_FLOAT ||
    gl.renderer.extensions.OES_texture_half_float.HALF_FLOAT_OES,
  internalFormat: gl.renderer.isWebgl2
    ? type === gl.FLOAT
      ? gl.RGBA32F
      : gl.RGBA16F
    : gl.RGBA,
  depth: false,
  unpackAlignment: 1,
});

class GPGPU {
  constructor(gl, { width, height, type }) {
    Object.assign(this, {
      gl,
      width,
      height,
      numVertexes: width * height,
      read: new RenderTarget(gl, rto(gl, width, height, type)),
      write: new RenderTarget(gl, rto(gl, width, height, type)),
      mesh: new Mesh(gl, { geometry: new Triangle(gl) }),
    });
  }
  renderProgram(program) {
    this.mesh.program = program;
    this.gl.renderer.render({
      scene: this.mesh,
      target: this.write,
      clear: false,
    });
    this.swap();
  }
  swap() {
    [this.read, this.write] = [this.write, this.read];
  }
}

class RippleEffect {
  constructor(renderer) {
    const width = 512;
    const height = 512;
    Object.assign(this, {
      renderer,
      gl: renderer.gl,
      width,
      height,
      delta: new Vec2(1 / width, 1 / height),
      gpgpu: new GPGPU(renderer.gl, { width, height }),
    });
    this.initShaders();
  }
  initShaders() {
    this.updateProgram = new Program(this.gl, {
      uniforms: { tDiffuse: { value: null }, uDelta: { value: this.delta } },
      vertex: defaultVertex,
      fragment:
        "precision highp float; uniform sampler2D tDiffuse; uniform vec2 uDelta; varying vec2 vUv; void main() {vec4 texel = texture2D(tDiffuse, vUv); vec2 dx = vec2(uDelta.x, 0.0), dy = vec2(0.0, uDelta.y); float average = (texture2D(tDiffuse, vUv - dx).r + texture2D(tDiffuse, vUv - dy).r + texture2D(tDiffuse, vUv + dx).r + texture2D(tDiffuse, vUv + dy).r) * 0.25; texel.g += (average - texel.r) * 2.0; texel.g *= 0.8; texel.r += texel.g; gl_FragColor = texel;}",
    });

    this.dropProgram = new Program(this.gl, {
      uniforms: {
        tDiffuse: { value: null },
        uCenter: { value: new Vec2() },
        uRadius: { value: 0.05 },
        uStrength: { value: 0.05 },
      },
      vertex: defaultVertex,
      fragment:
        "precision highp float; const float PI = 3.1415926535897932384626433832795; uniform sampler2D tDiffuse; uniform vec2 uCenter; uniform float uRadius; uniform float uStrength; varying vec2 vUv; void main() {vec4 texel = texture2D(tDiffuse, vUv); float drop = max(0.0, 1.0 - length(uCenter * 0.5 + 0.5 - vUv) / uRadius); drop = 0.5 - cos(drop * PI) * 0.5; texel.r += drop * uStrength; gl_FragColor = texel;}",
    });
  }
  update() {
    this.updateProgram.uniforms.tDiffuse.value = this.gpgpu.read.texture;
    this.gpgpu.renderProgram(this.updateProgram);
  }
  addDrop(x, y, radius, strength) {
    const us = this.dropProgram.uniforms;
    us.tDiffuse.value = this.gpgpu.read.texture;
    us.uCenter.value.set(x, y);
    us.uRadius.value = radius;
    us.uStrength.value = strength;
    this.gpgpu.renderProgram(this.dropProgram);
  }
}

export default RippleEffect;
