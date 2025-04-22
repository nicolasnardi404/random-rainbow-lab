// Effect parameters
let hands = [];
let rotationAngle = 0;
let debugMode = true;

// Effect parameters
let particleCount = 150;
let particleSize = 8;
let particleSpeed = 0.05;
let colorShift = 0;
let effectScale = 200;
let globalScale = 1.0;
let energyLevel = 0;

// Effect modes
let currentEffect = 0;
const CRYSTAL_EFFECT = 0;
const NEBULA_EFFECT = 1;
const VORTEX_EFFECT = 2;
const GALAXY_EFFECT = 3;
const FIREFLIES_EFFECT = 4;
const MIRROR_KALEIDOSCOPE = 5;
const PIXEL_DISPLACE = 6;
const PARTICLE_STORM = 7;
const totalEffects = 8;

// Colors
const palette = [
  [255, 0, 128], // Pink
  [0, 255, 255], // Cyan
  [255, 165, 0], // Orange
  [128, 0, 255], // Purple
  [0, 255, 128], // Green
];

// MediaPipe Hands
let mpHands;
let camera;
const videoElement = document.getElementById("video");

// Additional effect parameters
let webcamTexture;
let prevFrames = [];
let maxTrailFrames = 15;
let pixelSize = 15;
let mirrorSegments = 8;
let particles = [];
const NUM_PARTICLES = 300;

// Create webcam capture for effects
let capture;

function setupMediaPipe() {
  mpHands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    },
  });

  mpHands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  mpHands.onResults(onResults);

  camera = new Camera(videoElement, {
    onFrame: async () => {
      await mpHands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });

  camera.start();
}

function onResults(results) {
  hands = [];
  if (results.multiHandLandmarks) {
    results.multiHandLandmarks.forEach((landmarks, index) => {
      const handPoints = [];
      // Extract key points
      const keyPoints = [0, 4, 8, 12, 16, 20]; // wrist, thumb_tip, index_tip, etc.
      keyPoints.forEach((point) => {
        const landmark = landmarks[point];
        handPoints.push(
          createVector(
            landmark.x * width,
            landmark.y * height,
            landmark.z * width
          )
        );
      });
      hands.push(handPoints);
    });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  colorMode(HSB);
  textureMode(NORMAL);

  // Create webcam capture for effects
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide(); // Hide the HTML element

  // Initialize particles with texture coordinates
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      pos: createVector(
        random(-width / 2, width / 2),
        random(-height / 2, height / 2),
        random(-200, 200)
      ),
      vel: p5.Vector.random3D().mult(5),
      size: random(10, 30),
      hue: random(255),
      u: random(1),
      v: random(1),
    });
  }

  setupMediaPipe();

  // Set up debug panel
  const debugPanel = document.getElementById("debug-panel");
  debugPanel.style.display = debugMode ? "block" : "none";
}

function draw() {
  background(0);

  // Update rotation
  rotationAngle += 0.01;

  // Set up lighting
  ambientLight(50);
  pointLight(255, 255, 255, 0, 0, 200);

  // Update debug panel
  if (debugMode) {
    updateDebugPanel();
  }

  // Process hands and effects
  if (hands.length > 0) {
    // Left hand controls position and scale
    if (hands[0]) {
      const palmPos = hands[0][0];
      const thumbPos = hands[0][1];
      const indexPos = hands[0][2];

      // Calculate scale based on thumb-index distance
      const handScale = p5.Vector.dist(thumbPos, indexPos);
      effectScale = map(handScale, 50, 200, 100, 300);

      // Update position based on palm position
      translate(
        map(palmPos.x, 0, width, -width / 2, width / 2),
        map(palmPos.y, 0, height, -height / 2, height / 2),
        0
      );
    }

    // Right hand controls color and energy
    if (hands[1]) {
      const palmPos = hands[1][0];
      const indexPos = hands[1][2];

      // Update color based on hand x position
      colorShift = map(palmPos.x, 0, width, 0, 255);

      // Calculate energy level based on hand movement
      const handSpeed = p5.Vector.dist(palmPos, indexPos);
      energyLevel = map(handSpeed, 0, 100, 0, 1);
    }
  }

  // Draw current effect
  push();
  rotateY(rotationAngle);
  switch (currentEffect) {
    case CRYSTAL_EFFECT:
      drawCrystalEffect();
      break;
    case NEBULA_EFFECT:
      drawNebulaEffect();
      break;
    case VORTEX_EFFECT:
      drawVortexEffect();
      break;
    case GALAXY_EFFECT:
      drawGalaxyEffect();
      break;
    case FIREFLIES_EFFECT:
      drawFirefliesEffect();
      break;
    case MIRROR_KALEIDOSCOPE:
      drawMirrorKaleidoscope();
      break;
    case PIXEL_DISPLACE:
      drawPixelDisplace();
      break;
    case PARTICLE_STORM:
      drawParticleStorm();
      break;
  }
  pop();
}

function drawCrystalEffect() {
  push();
  noFill();
  strokeWeight(2);

  for (let i = 0; i < 8; i++) {
    push();
    rotateY((TWO_PI * i) / 8.0);

    let particlesInLayer = particleCount / 8;
    for (let j = 0; j < particlesInLayer; j++) {
      let t = j / float(particlesInLayer);
      let col = color((colorShift + j * 2) % 255, 255, 255, 200);
      stroke(col);

      let radius =
        effectScale * (1 + sin(t * PI + frameCount * particleSpeed) * 0.5);
      let y = map(t, 0, 1, -effectScale, effectScale);

      push();
      translate(radius * cos(t * TWO_PI), y, radius * sin(t * TWO_PI));
      sphere(particleSize * (1 + energyLevel));
      pop();
    }
    pop();
  }
  pop();
}

function drawNebulaEffect() {
  push();
  noFill();
  strokeWeight(2);

  for (let i = 0; i < particleCount; i++) {
    let t = i / particleCount;
    let col = color((colorShift + i) % 255, 255, 255, 150);
    stroke(col);

    let angle = t * TWO_PI * 8 + frameCount * particleSpeed;
    let radius = effectScale * (1 + sin(angle) * 0.5);
    let x = radius * cos(angle);
    let y = radius * sin(angle * 0.5);
    let z = radius * sin(angle);

    push();
    translate(x, y, z);
    sphere(particleSize * (1 + energyLevel * sin(angle)));
    pop();
  }
  pop();
}

function drawVortexEffect() {
  push();
  noFill();
  strokeWeight(2);

  let rings = 10;
  let particlesInRing = particleCount / rings;

  for (let ring = 0; ring < rings; ring++) {
    let ringRadius = map(ring, 0, rings, effectScale * 0.2, effectScale);

    for (let i = 0; i < particlesInRing; i++) {
      let angle = (TWO_PI * i) / particlesInRing;
      let col = color((colorShift + ring * 25) % 255, 255, 255, 200);
      stroke(col);

      let x = ringRadius * cos(angle + frameCount * particleSpeed);
      let y = map(ring, 0, rings, -effectScale / 2, effectScale / 2);
      let z = ringRadius * sin(angle + frameCount * particleSpeed);

      push();
      translate(x, y, z);
      sphere(particleSize * (1 + energyLevel * (1 - ring / rings)));
      pop();
    }
  }
  pop();
}

function drawGalaxyEffect() {
  push();
  noFill();
  strokeWeight(2);

  // Create spiral arms
  for (let arm = 0; arm < 4; arm++) {
    push();
    rotateY((TWO_PI * arm) / 4);

    for (let i = 0; i < particleCount; i++) {
      let t = i / particleCount;
      let spiralR = t * effectScale;
      let angle = t * TWO_PI * 3 + frameCount * particleSpeed;

      let col = color((colorShift + t * 100) % 255, 255, 255, 150);
      stroke(col);

      let x = cos(angle) * spiralR;
      let y = sin(angle * 2) * spiralR * 0.2;
      let z = sin(angle) * spiralR;

      push();
      translate(x, y, z);
      sphere(particleSize * (1 - t) * (1 + energyLevel));
      pop();
    }
    pop();
  }
  pop();
}

function drawFirefliesEffect() {
  push();
  noFill();
  strokeWeight(2);

  // Create floating particles with individual movements
  for (let i = 0; i < particleCount; i++) {
    let time = frameCount * particleSpeed + i;
    let radius = effectScale * (0.5 + noise(i, time * 0.1) * 0.5);

    let x = cos(time * 0.5) * radius * noise(i, time * 0.05);
    let y = sin(time * 0.3) * radius * noise(i + 100, time * 0.05);
    let z = cos(time * 0.4) * radius * noise(i + 200, time * 0.05);

    let brightness = 150 + sin(time * 0.2) * 105;
    let col = color((colorShift + i * 2) % 255, 255, brightness, 200);
    stroke(col);

    push();
    translate(x, y, z);
    sphere(particleSize * (0.5 + noise(i, time * 0.1) * energyLevel));
    pop();
  }
  pop();
}

function drawMirrorKaleidoscope() {
  push();
  if (capture.loadedmetadata) {
    // Calculate dimensions to maintain aspect ratio
    let aspectRatio = capture.height / capture.width;
    let w = effectScale * 2;
    let h = w * aspectRatio;

    // Create kaleidoscope segments
    for (let i = 0; i < mirrorSegments; i++) {
      push();
      rotateY((TWO_PI * i) / mirrorSegments + rotationAngle);
      rotateX(energyLevel * PI * 0.5);

      // Apply colorization effect
      tint(colorShift % 255, 255, 255, 200);

      // Draw mirrored webcam segment
      texture(capture);
      plane(w, h);

      pop();
    }
  }
  pop();
}

function drawPixelDisplace() {
  push();
  if (capture.loadedmetadata) {
    let pSize = pixelSize * (1 + energyLevel * 2);
    let aspectRatio = capture.height / capture.width;
    let w = width;
    let h = width * aspectRatio;

    // Create pixelated and displaced version
    for (let x = -w / 2; x < w / 2; x += pSize) {
      for (let y = -h / 2; y < h / 2; y += pSize) {
        let xOff = sin(frameCount * 0.05 + y * 0.1) * energyLevel * 50;
        let yOff = cos(frameCount * 0.05 + x * 0.1) * energyLevel * 50;

        let col = color((x + colorShift) % 255, 255, 255, 200);
        fill(col);
        noStroke();

        push();
        translate(x + xOff, y + yOff, 0);

        // Sample webcam texture
        texture(capture);
        plane(pSize, pSize);

        pop();
      }
    }
  }
  pop();
}

function drawParticleStorm() {
  push();
  noStroke();

  if (capture.loadedmetadata) {
    // Create attraction points from hands
    let attractors = [];
    if (hands.length > 0) {
      hands.forEach((hand) => {
        hand.forEach((point) => {
          attractors.push({
            pos: createVector(
              map(point.x, 0, width, -width / 2, width / 2),
              map(point.y, 0, height, -height / 2, height / 2),
              point.z * 100
            ),
            strength: energyLevel * 2,
          });
        });
      });
    }

    // Update and draw particles
    particles.forEach((particle) => {
      // Apply forces from attractors
      attractors.forEach((attractor) => {
        let force = p5.Vector.sub(attractor.pos, particle.pos);
        let distance = force.mag();
        force.normalize();
        // Inverse square law with minimum distance
        let strength = constrain(
          attractor.strength / (distance * distance),
          0,
          0.5
        );
        force.mult(strength * 50);
        particle.vel.add(force);
      });

      // Add some chaos based on energy level
      particle.vel.add(p5.Vector.random3D().mult(energyLevel * 0.5));

      // Update position
      particle.pos.add(particle.vel);
      particle.vel.mult(0.95); // Damping

      // Wrap around edges
      particle.pos.x = ((particle.pos.x + width / 2) % width) - width / 2;
      particle.pos.y = ((particle.pos.y + height / 2) % height) - height / 2;
      particle.pos.z = ((particle.pos.z + 200) % 400) - 200;

      // Draw particle with webcam texture
      push();
      translate(particle.pos.x, particle.pos.y, particle.pos.z);

      // Calculate UV coordinates for webcam texture sampling
      let u = map(particle.pos.x, -width / 2, width / 2, 0, 1);
      let v = map(particle.pos.y, -height / 2, height / 2, 0, 1);

      // Mix webcam color with particle color
      let speed = particle.vel.mag();
      let bright = map(speed, 0, 10, 100, 255);
      let hue = (particle.hue + colorShift) % 255;

      // Apply color tint to the texture
      tint(hue, 255, bright, 200);

      // Create a textured quad for each particle
      let pSize = particle.size * (1 + speed * 0.1);
      textureMode(NORMAL);
      texture(capture);

      // Rotate particle to face camera
      let angle = frameCount * 0.02 + particle.hue * 0.01;
      rotateX(angle);
      rotateY(angle);

      // Draw textured particle
      beginShape(QUADS);
      vertex(-pSize, -pSize, 0, u, v);
      vertex(pSize, -pSize, 0, u + 0.1, v);
      vertex(pSize, pSize, 0, u + 0.1, v + 0.1);
      vertex(-pSize, pSize, 0, u, v + 0.1);
      endShape();

      pop();
    });
  }
  pop();
}

function updateDebugPanel() {
  const debugPanel = document.getElementById("debug-panel");
  const effectNames = [
    "Crystal",
    "Nebula",
    "Vortex",
    "Galaxy",
    "Fireflies",
    "Mirror Kaleidoscope",
    "Pixel Displace",
    "Particle Storm",
  ];

  debugPanel.innerHTML = `
    FPS: ${floor(frameRate())}<br>
    Hands: ${hands.length}<br>
    Effect: ${effectNames[currentEffect]}<br>
    Energy: ${floor(energyLevel * 100)}%
  `;
}

function keyPressed() {
  if (key === "d" || key === "D") {
    debugMode = !debugMode;
    const debugPanel = document.getElementById("debug-panel");
    debugPanel.style.display = debugMode ? "block" : "none";
  } else if (key === " ") {
    // Change effect on spacebar press
    currentEffect = (currentEffect + 1) % totalEffects;
    console.log(
      "Effect changed to:",
      ["Crystal", "Nebula", "Vortex"][currentEffect]
    );
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
