// ─── GLSL Noise ───────────────────────────────────────────────────────────────
export const noiseFunctions = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float total = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
      total += snoise(p * frequency) * amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return total;
  }
`;

// ─── Shell Shaders ────────────────────────────────────────────────────────────
export const shellVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const shellFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(vViewPosition)), 2.5);
    gl_FragColor = vec4(uColor, fresnel * uOpacity);
  }
`;

// ─── Plasma Shaders ───────────────────────────────────────────────────────────
export const plasmaVertexShader = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  uniform float uAudioLevel;
  uniform float uTime;

  ${noiseFunctions}

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);

    // Multi-frequency displacement for richer wave detail on audio
    float d1 = snoise(position * 2.0 + uTime * 0.3) * uAudioLevel * 0.3;
    float d2 = snoise(position * 5.0 - uTime * 0.5) * uAudioLevel * 0.12;
    float d3 = snoise(position * 10.0 + uTime * 0.8) * uAudioLevel * 0.05;
    float displacement = d1 + d2 + d3;
    vec3 displaced = position + normal * displacement;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const plasmaFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uBrightness;
  uniform float uThreshold;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorBright;
  uniform float uAudioLevel;
  uniform float uState; // 0=idle, 1=listening, 2=speaking

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  ${noiseFunctions}

  void main() {
    float speed = 0.05 + uAudioLevel * 0.28 + uState * 0.06;

    vec3 p = vPosition * uScale;
    vec3 q = vec3(
      fbm(p + vec3(0.0, uTime * speed, 0.0)),
      fbm(p + vec3(5.2, 1.3, 2.8) + uTime * speed),
      fbm(p + vec3(2.2, 8.4, 0.5) - uTime * speed * 0.4)
    );

    float density = fbm(p + (2.0 + uAudioLevel * 1.8) * q);
    float t = (density + 0.4 + uAudioLevel * 0.2) * 0.8;
    float threshold = uThreshold - uAudioLevel * 0.03;
    float alpha = smoothstep(threshold, 0.7, t);

    vec3 cWhite = vec3(1.0);
    vec3 color = mix(uColorDeep, uColorMid, smoothstep(threshold, 0.5, t));
    color = mix(color, uColorBright, smoothstep(0.5, 0.8, t));
    color = mix(color, cWhite, smoothstep(0.8, 1.0, t));

    // Add warm gold tint when listening
    vec3 listenColor = vec3(1.0, 0.85, 0.3);
    color = mix(color, color * listenColor, uState * 0.3 * uAudioLevel);

    float facing = dot(normalize(vNormal), normalize(vViewPosition));
    float depthFactor = (facing + 1.0) * 0.5;
    float finalAlpha = alpha * (0.02 + 0.98 * depthFactor);

    gl_FragColor = vec4(color * uBrightness, finalAlpha);
  }
`;

// ─── Particle Shaders ─────────────────────────────────────────────────────────
export const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAudioLevel;
  attribute float aSize;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    // Particles stay mostly inside — subtle outward expansion on audio
    float audioBoost = 1.0 + uAudioLevel * 1.2;

    pos *= audioBoost;
    // Subtle internal shimmer only, no net drift outward
    pos.y += sin(uTime * 0.2 + pos.x * 3.0) * 0.015;
    pos.x += cos(uTime * 0.15 + pos.z * 3.0) * 0.015;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size pulses slightly with audio but never grows large enough to escape
    float baseSize = (8.0 * aSize + 4.0) * (1.0 + uAudioLevel * 0.3);
    gl_PointSize = baseSize * (1.0 / -mvPosition.z);

    vAlpha = 0.6 + 0.4 * sin(uTime + aSize * 10.0);
  }
`;

export const particleFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;
    float glow = pow(1.0 - dist * 2.0, 1.8);
    gl_FragColor = vec4(uColor, glow * vAlpha);
  }
`;
