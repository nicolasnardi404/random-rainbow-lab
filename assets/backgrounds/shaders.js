// Collection of WebGL fragment shaders for backgrounds

const SHADER_SOURCES = {
  // 1. Cyberpunk Grid
  cyberpunkGrid: `
    precision mediump float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    
    // Grid and glow effects
    float grid(vec2 uv, float size) {
      vec2 g = mod(uv * size, 1.0);
      return (step(0.95, g.x) + step(0.95, g.y)) * 0.5;
    }
    
    void main() {
      // Normalized coordinates (0 to 1)
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      
      // Transform coordinates
      uv.y = 1.0 - uv.y; // Flip Y
      uv -= 0.5; // Center
      uv.x *= u_resolution.x / u_resolution.y; // Fix aspect ratio
      
      // Create perspective grid effect
      float t = u_time * 0.2;
      vec2 gridUv = vec2(uv.x, uv.y * 0.3 + 0.7);
      gridUv.y -= t * 0.2;
      
      // Main grid
      float gridVal = grid(gridUv, 20.0);
      
      // Distant grid
      float gridVal2 = grid(gridUv * 0.5, 10.0) * 0.5;
      
      // Moving horizontal lines
      float lines = abs(sin(uv.y * 30.0 + u_time)) < 0.1 ? 1.0 : 0.0;
      lines *= 0.2;
      
      // Scanline effect
      float scanline = sin(uv.y * 100.0 + u_time * 5.0) * 0.5 + 0.5;
      scanline = pow(scanline, 10.0) * 0.3;
      
      // Glow gradient
      float glow = length(uv.y + 0.3);
      vec3 color = mix(u_color1, u_color2, glow);
      
      // Combine effects
      color += vec3(gridVal + gridVal2 + lines + scanline);
      
      // Vignette
      float vignette = 1.0 - length(uv * 1.5);
      vignette = smoothstep(0.0, 1.0, vignette);
      color *= vignette;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,

  // 2. Nebula Flow
  nebulaFlow: `
    precision mediump float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    
    // Noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      
      // Centered coordinates
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;
      
      float time = u_time * 0.1;
      
      // Create layered noise for nebula effect
      float n1 = snoise(p * 1.0 + time * 0.1);
      float n2 = snoise(p * 2.0 - time * 0.2);
      float n3 = snoise(p * 4.0 + time * 0.3);
      float n4 = snoise(p * 8.0 - time * 0.4);
      
      float nebula = n1 * 0.5 + n2 * 0.25 + n3 * 0.15 + n4 * 0.1;
      nebula = nebula * 0.5 + 0.5; // Normalize to 0-1
      
      // Stars
      float stars = step(0.98, snoise(p * 50.0)) * 0.5;
      stars += step(0.99, snoise(p * 100.0 + time)) * 0.5;
      
      // Color gradient
      vec3 color = mix(u_color1, u_color2, nebula);
      
      // Add stars
      color += stars;
      
      // Vignette
      float vignette = 1.0 - length(p * 0.7);
      vignette = smoothstep(0.0, 1.0, vignette);
      color *= vignette;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,

  // 3. Matrix Rain
  matrixRain: `
    precision mediump float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec3 u_color1;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      
      // Grid
      vec2 grid = vec2(80.0, 40.0);
      vec2 ipos = floor(uv * grid);
      
      // Falling speed based on column
      float speed = 1.0 + random(vec2(ipos.x, 0.0)) * 5.0;
      float offset = random(ipos) * 100.0;
      float falling = fract(offset - u_time * speed * 0.1);
      
      // Character intensity varies by position
      float intensity = random(ipos + floor(u_time * 0.2));
      intensity = pow(intensity, 0.8);
      
      // Add "glitch" effect
      float glitch = step(0.98, random(vec2(ipos.x, floor(u_time * 20.0))));
      
      // Decide which characters are visible
      float isOn = step(falling, 0.8) * step(0.2, intensity);
      
      // Create vertical fade
      float fade = pow(falling, 2.0);
      
      // Final color 
      vec3 color = u_color1 * isOn * fade;
      color += u_color1 * glitch * 0.8; // Add glitch effect
      
      // Add some horizontal lines occasionally 
      float scanline = step(0.99, random(vec2(floor(u_time * 10.0), ipos.y)));
      color += u_color1 * scanline * 0.5;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,

  // 4. Liquid RGB
  liquidRgb: `
    precision mediump float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    
    // Noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      // Normalized pixel coordinates (0 to 1)
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      
      float time = u_time * 0.2;
      
      // Offset for the RGB channels
      float r_offset = 0.01 * snoise(uv + vec2(time * 0.5, 0.0));
      float g_offset = 0.01 * snoise(uv + vec2(time * 0.3, time * 0.2));
      float b_offset = 0.01 * snoise(uv + vec2(0.0, time * 0.6));
      
      // Create distorted UV coordinates for each channel
      vec2 uv_r = uv + vec2(r_offset, r_offset * 0.5);
      vec2 uv_g = uv + vec2(g_offset, g_offset * 0.5);
      vec2 uv_b = uv + vec2(b_offset, b_offset * 0.5);
      
      // Generate liquid-like patterns for each channel
      float r = smoothstep(0.4, 0.6, snoise(uv_r * 3.0 + time * vec2(0.2, 0.1)));
      float g = smoothstep(0.4, 0.6, snoise(uv_g * 2.8 + time * vec2(-0.1, 0.3)));
      float b = smoothstep(0.4, 0.6, snoise(uv_b * 2.5 + time * vec2(0.3, -0.2)));
      
      // Combine into RGB color
      vec3 color = vec3(r, g, b);
      
      // Add some small-scale noise for texture
      float noise = snoise(uv * 50.0 + time) * 0.05;
      color += noise;
      
      // Apply a subtle vignette
      float vignette = 1.0 - length(uv - 0.5) * 0.7;
      color *= vignette;
      
      // Output final color
      gl_FragColor = vec4(color, 1.0);
    }
  `,

  // 5. Fractal Noise
  fractalNoise: `
    precision mediump float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_color3;
    
    // Simplex noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    // Fractal Brownian Motion
    float fbm(vec2 p, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 2.0;
      
      for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * (snoise(p * frequency) * 0.5 + 0.5);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }
    
    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      
      // Center and adjust aspect ratio
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;
      
      // Time variables
      float time = u_time * 0.05;
      
      // Create warped coordinates
      vec2 warp = vec2(
        fbm(p * 0.5 + vec2(time * 0.1, time * -0.2), 3),
        fbm(p * 0.5 + vec2(time * -0.3, time * 0.4), 3)
      );
      
      // Double warp for more complex pattern
      warp = vec2(
        fbm(p + warp * 0.8, 4),
        fbm(p + warp * 0.8, 4)
      );
      
      // Final noise for coloring
      float n = fbm(p + warp, 6);
      
      // Color mapping using the noise value
      vec3 color;
      if (n < 0.4) {
        color = mix(u_color1, u_color2, n * 2.5);
      } else {
        color = mix(u_color2, u_color3, (n - 0.4) * 1.67);
      }
      
      // Add subtle pulse
      float pulse = 0.5 + 0.5 * sin(time * 2.0);
      color = mix(color, color * 1.3, pulse * 0.1);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
