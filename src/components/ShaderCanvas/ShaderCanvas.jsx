import React, { useEffect, useRef, useState } from 'react';

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[ShaderCanvas]', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * Full-size fragment-shader canvas. Uniforms: u_time (s), u_res (px).
 * Renders `fallback` when WebGL is unavailable or the shader fails to compile.
 */
export default function ShaderCanvas({ fragment, className, style, fallback = null, fps = 60 }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) { setFailed(true); return undefined; }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, `precision mediump float;\nuniform float u_time;\nuniform vec2 u_res;\n${fragment}`);
    if (!vs || !fs) { setFailed(true); return undefined; }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setFailed(true); return undefined; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');
    gl.clearColor(0, 0, 0, 0);

    const mobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
    const dprCap = mobile ? 1 : 1.5;
    const frameGap = 1000 / (mobile ? Math.min(fps, 30) : fps);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const start = performance.now();
    let raf = 0;
    let last = 0;
    const draw = (now) => {
      gl.uniform1f(uTime, reduced ? 12.0 : (now - start) / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < frameGap) return;
      last = now;
      draw(now);
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(loop);
    };

    if (reduced) draw(performance.now());
    else raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', onVis);

    const onLost = (e) => { e.preventDefault(); cancelAnimationFrame(raf); setFailed(true); };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [fragment, fps]);

  if (failed) return fallback;
  return <canvas ref={ref} className={className} style={{ display: 'block', width: '100%', height: '100%', ...style }} aria-hidden="true" />;
}
