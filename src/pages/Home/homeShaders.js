// Fragment shaders for the homepage arch scene (WebGL 1 / GLSL ES 1.0).
// Each receives u_time (seconds) and u_res (canvas size in px) from ShaderCanvas.

/* Halo: soft rotating rays + slowly drifting rainbow aura + warm core.
   Drawn in a square canvas centred on the Buddha medallion; output is premultiplied alpha. */
export const HALO_FRAG = `
vec3 hue(float h) {
  return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (uv - 0.5) * 2.0;           // -1..1, centre = medallion
  float r = length(p);
  float a = atan(p.y, p.x);
  float t = u_time;

  // Two counter-rotating ray sets, softly blended
  float rays1 = pow(0.5 + 0.5 * cos(a * 18.0 + t * 0.12), 6.0);
  float rays2 = pow(0.5 + 0.5 * cos(a * 11.0 - t * 0.08 + 1.3), 8.0);
  float rays = (rays1 * 0.7 + rays2 * 0.5) * (1.0 - smoothstep(0.25, 1.0, r)) * smoothstep(0.18, 0.34, r);

  // Rainbow aura drifting around the circle
  vec3 rainbow = mix(vec3(1.0, 0.86, 0.55), hue(fract(a / 6.2832 + t * 0.02)), 0.45);
  float aura = exp(-pow(max(r - 0.32, 0.0) * 3.2, 2.0)) * smoothstep(0.2, 0.42, r);

  // Breathing warm core behind the image
  float breath = 0.88 + 0.12 * sin(t * 1.2);
  float core = exp(-r * r * 5.5) * breath;

  vec3 col = vec3(1.0, 0.97, 0.88) * core
           + rainbow * aura * 0.75
           + vec3(1.0, 0.98, 0.92) * rays * 0.55;
  float alpha = clamp(core * 0.95 + aura * 0.6 + rays * 0.5, 0.0, 1.0);
  alpha *= 1.0 - smoothstep(0.82, 1.0, r);    // fade out before the square edge
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

/* Lotus pond: layered gradient water, drifting horizontal shimmer, expanding ripple rings
   and soft sky reflection near the shoreline. Opaque. */
export const POND_FRAG = `
float ring(vec2 uv, vec2 c, float t, float speed, float aspect) {
  vec2 d = uv - c;
  d.x *= aspect;
  float dist = length(d * vec2(1.0, 2.6));
  float phase = fract(t * speed);
  float radius = phase * 0.55;
  float w = 0.012 + phase * 0.02;
  return (1.0 - smoothstep(0.0, w, abs(dist - radius))) * (1.0 - phase);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;     // y: 0 bottom .. 1 shoreline
  float aspect = u_res.x / u_res.y;
  float t = u_time;

  vec3 deep = vec3(0.62, 0.80, 0.86);
  vec3 mid  = vec3(0.74, 0.87, 0.91);
  vec3 sky  = vec3(0.99, 0.90, 0.88);     // warm reflection at the far edge
  vec3 col = mix(deep, mid, smoothstep(0.0, 0.7, uv.y));
  col = mix(col, sky, smoothstep(0.55, 1.0, uv.y) * 0.65);

  // Drifting shimmer bands
  float wave = sin(uv.y * 46.0 + sin(uv.x * 7.0 * aspect + t * 0.9) * 1.6 + t * 1.1);
  float shimmer = smoothstep(0.86, 1.0, wave) * (0.35 + 0.65 * uv.y);
  col += shimmer * 0.16;

  // Expanding ripple rings (staggered)
  float rip = ring(uv, vec2(0.22, 0.45), t, 0.16, aspect)
            + ring(uv, vec2(0.72, 0.60), t + 2.7, 0.13, aspect)
            + ring(uv, vec2(0.50, 0.25), t + 5.1, 0.11, aspect);
  col += rip * 0.18;

  // Sparkles
  vec2 g = floor(uv * vec2(38.0 * aspect, 12.0));
  float rnd = fract(sin(dot(g, vec2(12.9898, 78.233))) * 43758.5453);
  float tw = smoothstep(0.985, 1.0, rnd) * (0.5 + 0.5 * sin(t * 3.0 + rnd * 40.0));
  col += tw * 0.35;

  // Soft shoreline line
  col = mix(col, vec3(1.0), smoothstep(0.93, 1.0, uv.y) * 0.35);
  gl_FragColor = vec4(col, 1.0);
}
`;
