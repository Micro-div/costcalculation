"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   Aurora — Kexsio® · Gradient / 01
   One self-contained WebGL2 swirling-gradient component.

   Technique
     • Full-screen quad (two triangles), trivial vertex shader
       (gl_Position = a_position).
     • Fragment shader loop:
         1. scale + rotate the UV space (noise_scale, rotation)
         2. inject a noise-driven angle field
            (uv.x += 4·distortion·n2·cos(angle) / same for y)
         3. SWIRL loop — Fourier-style stacked sin(uv) waves
         4. smooth horizontal "Edge" shape → three-colour blend
            via a pair of smoothsteps.
     • ResizeObserver keeps the canvas filling its container.
     • A single rAF loop only writes u_time — no React re-renders.
     • prefers-reduced-motion → one still frame, then stop.

   Rules
     • ONE baked palette: midnight #030c1a / electric teal #00e5b4 /
       deep indigo #0c0330 — no preset system, no next-themes.
     • No animation libraries, no images, no body copy.
     • All styles live in the ONE injected <style> block below.
     • Continuous in every context (standalone + card) — there is no
       special ?card branch.
   ============================================================ */

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Spline+Sans+Mono:wght@400;500;600&display=swap");

.aurora {
  /* Override --aurora-height to embed it inside a card/container. */
  --aurora-height: 100vh;
  --aurora-bg: #030c1a;
  position: relative;
  display: block;
  width: 100%;
  height: var(--aurora-height);
  overflow: hidden;
  isolation: isolate;
  background-color: var(--aurora-bg);
  color: #eafff9;
  font-family: "Spline Sans Mono", ui-monospace, SFMono-Regular, "SF Mono",
    Menlo, Consolas, monospace;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

@supports (height: 100svh) {
  .aurora {
    --aurora-height: 100svh;
  }
}

.aurora__canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* Identity chrome — the gradient is the hero, so this is all the "copy". */
.aurora__bar {
  position: absolute;
  z-index: 2;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: clamp(14px, 2.6vw, 30px) clamp(16px, 3.2vw, 40px);
  font-size: clamp(10px, 0.85vw, 12.5px);
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.16em;
  color: rgba(234, 255, 249, 0.82);
  text-shadow: 0 1px 14px rgba(3, 12, 26, 0.75);
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
}

.aurora__bar--top {
  top: 0;
}

.aurora__bar--bottom {
  bottom: 0;
}

.aurora__brand {
  font-weight: 500;
  letter-spacing: 0.2em;
  color: #f3fffc;
}

.aurora__reg {
  font-size: 0.7em;
  vertical-align: super;
  opacity: 0.7;
}

.aurora__accent {
  color: #00e5b4;
}

.aurora__muted {
  opacity: 0.6;
}

/* Static stand-in when WebGL2 is unavailable — same three colours. */
.aurora--fallback .aurora__canvas {
  display: none;
}

.aurora--fallback {
  background-image: radial-gradient(
      85% 70% at 54% 46%,
      rgba(0, 229, 180, 0.5),
      rgba(0, 229, 180, 0) 62%
    ),
    linear-gradient(96deg, #030c1a 0%, #04263a 32%, #00e5b4 57%, #0c0330 100%);
}
`;

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;

/* ---- ONE baked Kexsio palette (no preset system) -------------- */
const vec3 MIDNIGHT = vec3(0.01176, 0.04706, 0.10196); /* #030c1a */
const vec3 TEAL     = vec3(0.00000, 0.89804, 0.70588); /* #00e5b4 */
const vec3 INDIGO   = vec3(0.04706, 0.01176, 0.18824); /* #0c0330 */

/* ---- baked settings ------------------------------------------ */
const float ROTATION    = 0.0;    /* rotation   0deg   */
const float PROPORTION  = 0.33;   /* proportion 33     */
const float NOISE_SCALE = 0.48;   /* scale      0.48   */
const float SPEED       = 28.0;   /* speed      28     */
const float DISTORTION  = 4.0;    /* distortion 4      */
const float SWIRL       = 65.0;   /* swirl      65     */
const int   SWIRL_ITER  = 6;      /* swirlIterations 6 */
const float SOFTNESS    = 1.0;    /* softness   100    */
const float OFFSET      = -0.235; /* offset     -235   */
const float SHAPE_SIZE  = 0.48;   /* shapeSize  48     */

/* ---- hash / value noise / fbm -------------------------------- */
float hash31(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = hash31(i);
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}

/* 3-octave fbm over a noise field that drifts on the Z (time) axis. */
float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    sum += amp * vnoise(p);
    p = p * 2.03 + 17.1;
    amp *= 0.5;
  }
  return sum * 1.1428571; /* 0.875 max -> renormalise to 0..1 */
}

void main() {
  vec2 res = u_resolution;
  vec2 p = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y);

  /* 1 — scale and rotate the UV space */
  float a = radians(ROTATION);
  mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 uv = rot * (p / NOISE_SCALE);

  float T = u_time * SPEED * 0.015;

  /* 2 — noise-driven angle-field distortion */
  vec3 q = vec3(uv * 1.35, T * 0.55);
  float n1 = fbm(q);
  float n2 = fbm(q * 1.9 + vec3(4.7, 2.1, -T * 0.35)) - 0.5;
  float angle = n1 * 12.566371 + T;

  float d = DISTORTION * 0.02;
  uv.x += 4.0 * d * n2 * cos(angle);
  uv.y += 4.0 * d * n2 * sin(angle);

  /* 3 — swirl loop: Fourier-style stacked sin(uv) waves */
  float sw = SWIRL * 0.0028;
  for (int i = 1; i <= SWIRL_ITER; i++) {
    float fi = float(i);
    float ph = T * (1.0 + 0.35 * fi) + fi * 1.7;
    uv.x += (sw / fi) * sin(uv.y * (1.6 + 1.4 * fi) + ph);
    uv.y += (sw / fi) * cos(uv.x * (1.6 + 1.4 * fi) - ph * 0.9);
  }

  /* 4 — smooth horizontal "Edge" shape → three-colour blend */
  float band = SHAPE_SIZE * (1.6 + 1.6 * PROPORTION);
  float soft = band * mix(0.10, 0.38, SOFTNESS);
  float x = uv.x + OFFSET;

  float lo = -0.5 * band;
  float hi = 0.5 * band;
  float m1 = smoothstep(lo - soft, lo + soft, x); /* midnight -> teal */
  float m2 = smoothstep(hi - soft, hi + soft, x); /* teal -> indigo  */

  vec3 col = mix(MIDNIGHT, TEAL, m1);
  col = mix(col, INDIGO, m2);

  /* gentle top/bottom falloff keeps the chrome legible */
  float fall = 1.0 - 0.28 * smoothstep(0.45, 1.15, abs(p.y * 2.0));
  col *= fall;

  /* static dither — kills banding in the dark fields */
  col += (hash31(vec3(gl_FragCoord.xy, 1.0)) - 0.5) / 255.0;

  fragColor = vec4(col, 1.0);
}
`;

/* Two triangles covering clip space. */
const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

const MAX_DPR = 2;
/* Keeps 4K/retina canvases from shading more pixels than they can handle. */
const PIXEL_BUDGET = 4_200_000;
/* Fixed timestamp used for the reduced-motion still frame. */
const STILL_TIME = 6.5;
const FALLBACK_CLASS = "aurora--fallback";

export function Aurora() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const goFallback = () => host.classList.add(FALLBACK_CLASS);

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      goFallback();
      return;
    }

    const compile = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = vertex && fragment ? gl.createProgram() : null;
    if (!vertex || !fragment || !program) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      goFallback();
      return;
    }

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      goFallback();
      return;
    }
    gl.useProgram(program);

    const quadBuffer = gl.createBuffer();
    const positionLoc = gl.getAttribLocation(program, "a_position");
    if (!quadBuffer || positionLoc < 0) {
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(program);
      goFallback();
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let rafId = 0;
    let disposed = false;
    const startedAt = performance.now();

    /* The only per-frame work: write u_time and draw the quad. */
    const draw = (seconds: number) => {
      gl.uniform1f(uTime, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const resize = () => {
      if (disposed) return;
      const rect = host.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width);
      const cssHeight = Math.max(1, rect.height);

      let scale = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const projected = cssWidth * cssHeight * scale * scale;
      if (projected > PIXEL_BUDGET) {
        scale = Math.max(1, Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight)));
      }

      const width = Math.max(1, Math.round(cssWidth * scale));
      const height = Math.max(1, Math.round(cssHeight * scale));
      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uResolution, width, height);
      if (reducedMotion.matches) draw(STILL_TIME);
    };

    const loop = (now: number) => {
      draw((now - startedAt) / 1000);
      rafId = reducedMotion.matches ? 0 : requestAnimationFrame(loop);
    };

    /* One still frame for reduced motion — or continuous motion. */
    const syncMotion = () => {
      if (reducedMotion.matches) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        draw(STILL_TIME);
      } else if (!rafId) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    syncMotion();
    reducedMotion.addEventListener("change", syncMotion);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      goFallback();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      reducedMotion.removeEventListener("change", syncMotion);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(program);
      host.classList.remove(FALLBACK_CLASS);
    };
  }, []);

  return (
    <section className="aurora" ref={hostRef}>
      <style>{CSS}</style>

      <canvas className="aurora__canvas" ref={canvasRef} aria-hidden="true" />

      <div className="aurora__bar aurora__bar--top">
        <span className="aurora__brand">
          Kexsio<span className="aurora__reg">®</span>
        </span>
        <span>Aurora · Gradient</span>
      </div>

      <div className="aurora__bar aurora__bar--bottom">
        <span>A swirling aurora gradient</span>
        <span>
          Gradient / <span className="aurora__accent">01</span>
        </span>
      </div>
    </section>
  );
}
