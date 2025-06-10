// Effect parameters
let hands = [];
let rotationAngle = 0;
let debugMode = false;

// Video recording variables
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordButton;
let recordingQualityIndicator;

// Effect parameters
let particleCount = 150;
let particleSize = 8;
let particleSpeed = 0.05;
let colorShift = 0;
let effectScale = 200;
let globalScale = 1.0;
let energyLevel = 0;
let handRotation = 0;
let prevHandRotation = 0;
let rotationSpeed = 0;

// Background parameters
let currentBackground = 0;
let backgroundMode = 0; // 0: shader, 1: effects, 2: video (webcam or uploaded)
const BACKGROUND_MODES = ["Shader", "Effects", "Video"];
let backgroundVideos = [];
let userBackground = null;
let backgroundShaders = [];
let currentShader = 0;
const SHADER_NAMES = [
  "Cyberpunk Grid",
  "Nebula Flow",
  "Matrix Rain",
  "Liquid RGB",
  "Fractal Noise",
];
let shaderTime = 0;
let bgSelectBtn;

// Video source variables
let videoSource = "webcam"; // 'webcam' or 'upload'
let uploadedVideo = null;

// Upload video specific constants and variables
const UPLOAD_EFFECT_MIRROR = 8;
const UPLOAD_EFFECT_PIXEL = 9;
const UPLOAD_EFFECT_PARTICLE = 10;
const totalEffects = 11;

// Global persistence variables (not per-effect)
let persistCanvas;
let persistenceAlpha = 0.15; // How much of the previous frame to keep (lower = faster fade)

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
let videoElement;

// Additional effect parameters
let webcamTexture;
let pixelSize = 15;
let mirrorSegments = 8;
let particles = [];
const NUM_PARTICLES = 300;

// Create webcam capture for effects
let capture;

// Add background-related variables
let shaders = [];
let bgVideos = [];
let customBg;
let customBgType;

// --- VIDEO SOURCE HANDLING ---
// videoSource is declared above ("webcam" or "upload")

// --- MODE SELECTION ---
window.selectedMode = window.selectedMode || "shader"; // 'shader', 'effect', 'video'

// EFFECTS: Only core hand-controlled generative effects (no webcam/video, no Neon Particles, Digital Waves, etc.)
const EFFECTS_LIST = [
  CRYSTAL_EFFECT,
  NEBULA_EFFECT,
  VORTEX_EFFECT,
  GALAXY_EFFECT,
  FIREFLIES_EFFECT,
];
// VIDEO: Only video-based effects (Mirror Kaleidoscope, Pixel Displace, Particle Storm)
const VIDEO_EFFECTS_LIST = [
  MIRROR_KALEIDOSCOPE,
  PIXEL_DISPLACE,
  PARTICLE_STORM,
];

// VIDEO effects work with both webcam and uploaded video sources

function setupMediaPipe() {
  console.log("Setting up MediaPipe...");

  // Make sure we get the video element after the DOM is loaded
  videoElement = document.getElementById("video");

  if (!videoElement) {
    console.error("Video element not found!");
    return;
  }

  console.log("Video element found:", videoElement);

  // Update debug panel if it exists
  const cameraStatus = document.getElementById("camera-status");
  if (cameraStatus) {
    cameraStatus.textContent = "Camera: Initializing MediaPipe...";
  }

  try {
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

    mpHands.onResults((results) => {
      console.log(
        "Hand detection results:",
        results.multiHandLandmarks ? results.multiHandLandmarks.length : 0
      );
      onResults(results);
    });

    camera = new Camera(videoElement, {
      onFrame: async () => {
        await mpHands.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });

    // Start camera with error handling
    camera
      .start()
      .then(() => {
        console.log("Camera started successfully");
        if (cameraStatus) {
          cameraStatus.textContent = "Camera: Running";
        }
      })
      .catch((error) => {
        console.error("Error starting camera:", error);
        if (cameraStatus) {
          cameraStatus.textContent = "Camera Error: " + error.message;
        }
      });
  } catch (error) {
    console.error("Error in setupMediaPipe:", error);
    if (cameraStatus) {
      cameraStatus.textContent = "MediaPipe Error: " + error.message;
    }
  }
}

function onResults(results) {
  // Call the visualization function if it exists
  if (window.drawHandLandmarks) {
    window.drawHandLandmarks(results);
  }

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

      // Calculate hand rotation for the first hand (controlling size)
      if (index === 0) {
        // Store previous rotation for calculating rotation speed
        prevHandRotation = handRotation;

        // Get wrist and thumb points
        const wrist = handPoints[0];
        const thumb = handPoints[1];

        // Calculate angle between wrist and thumb in the XY plane
        const angleRadians = Math.atan2(thumb.y - wrist.y, thumb.x - wrist.x);
        handRotation = angleRadians;

        // Calculate rotation speed (how fast the hand is rotating)
        let rotationDiff = handRotation - prevHandRotation;
        // Handle angle wrap-around
        if (rotationDiff > Math.PI) rotationDiff -= TWO_PI;
        if (rotationDiff < -Math.PI) rotationDiff += TWO_PI;

        rotationSpeed = lerp(rotationSpeed, rotationDiff * 10, 0.2);
      }
    });
  }
}

function setup() {
  console.log("P5.js setup function called");

  // Create the main canvas that will contain all effects
  let mainCanvas = createCanvas(windowWidth, windowHeight, WEBGL);

  // Set an ID for easier access later
  mainCanvas.id("main-effects-canvas");

  console.log("Main canvas created:", mainCanvas);
  console.log("Canvas element:", mainCanvas.elt);

  colorMode(HSB);
  textureMode(NORMAL);

  // Create persistence canvas with the correct size
  persistCanvas = createGraphics(windowWidth, windowHeight);
  persistCanvas.background(0);

  // Get the record button from HTML
  recordButton = select("#record-button");

  // Add click handler to record button
  recordButton.mousePressed(toggleRecording);

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

  // Initialize backgrounds
  initBackgrounds();

  // Wait a small delay to ensure DOM is fully ready
  setTimeout(() => {
    setupMediaPipe();

    // Set up debug panel
    const debugPanel = document.getElementById("debug-panel");
    if (debugPanel) {
      debugPanel.style.display = debugMode ? "block" : "none";
    } else {
      console.error("Debug panel element not found");
    }
  }, 1000);
}

function initBackgrounds() {
  // Initialize shaders from the SHADER_SOURCES object
  const shaderSourceKeys = Object.keys(SHADER_SOURCES);

  for (let key of shaderSourceKeys) {
    const newShader = createShader(
      // Improved vertex shader to ensure full screen coverage
      `
      // Vertex shader to cover the entire screen
      attribute vec3 aPosition;
      attribute vec2 aTexCoord;
      
      varying vec2 vTexCoord;
      
      void main() {
        vTexCoord = aTexCoord;
        
        // This ensures the vertex positions fill the entire screen properly
        // We directly pass through the position with normalization
        vec4 positionVec4 = vec4(aPosition, 1.0);
        positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
        gl_Position = positionVec4;
      }
      `,
      // Fragment shader from our sources
      SHADER_SOURCES[key]
    );

    shaders.push(newShader);

    // Log shader creation
    console.log(`Initialized shader: ${key}`);
  }

  // Load background videos
  BACKGROUND_VIDEO_SOURCES.forEach((source) => {
    const vid = createVideo(source.url);
    vid.hide();
    vid.loop();
    vid.volume(0);
    bgVideos.push(vid);
    console.log(`Loaded video: ${source.name}`);
  });
}

function draw() {
  // Clear the canvas at the beginning of each frame
  clear();

  // Draw background first - this will fill entire screen
  drawBackground();

  // If in shader mode, skip effects and persistence
  const mode =
    window.selectedBackgroundMode !== undefined
      ? window.selectedBackgroundMode
      : 0; // default to shader
  if (mode === 0) {
    // Only shader background, no effects or persistence
    return;
  }

  // Always draw the persistence canvas (to show existing trails)
  push();
  // In WEBGL mode, we need to reset the coordinate system and translate to draw full screen
  resetMatrix();
  translate(-width / 2, -height / 2, 0);
  imageMode(CORNER);
  image(persistCanvas, 0, 0, width, height);
  pop();

  // Main drawing code starts here
  push();

  // Update rotation
  rotationAngle += 0.01;

  // Set up lighting
  ambientLight(50);
  pointLight(255, 255, 255, 0, 0, 200);

  // Update debug panel
  if (debugMode) {
    updateDebugPanel();
  }

  // Always draw some default effect even if hands are not detected
  if (hands.length === 0) {
    resetMatrix(); // Reset to center of screen
    // Don't translate, keep in center for better composition

    // Draw a default effect with auto rotation
    push();
    rotateY(rotationAngle);
    rotateX(rotationAngle * 0.5);

    // Draw the current effect
    drawCurrentEffect();
    pop();
  } else if (hands.length > 0) {
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

      // Right hand control (if available)
      if (hands.length > 1 && hands[1]) {
        const rightPalmVel = createVector(
          hands[1][0].x - hands[1][0].x,
          hands[1][0].y - hands[1][0].y
        );

        // Calculate energy level based on hand movement speed
        const rightHandSpeed = rightPalmVel.mag();
        energyLevel = lerp(energyLevel, rightHandSpeed * 10, 0.1);

        // Map X position of right hand to color shift
        colorShift = map(hands[1][0].x, 0, width, 0, 255);
      }
    }

    // Draw the current effect
    drawCurrentEffect();
  }

  // End main drawing
  pop();

  // Only update the persistence canvas with new trails if the effect is enabled
  // This ensures we respect the trail recording state across effect changes
  if (window.persistenceEnabled) {
    updatePersistenceCanvas();
  }
  // Note: We no longer clear the persistence canvas when the effect is disabled

  // Only show effects from the current mode
  let allowedEffects = EFFECTS_LIST;
  if (mode === 2) allowedEffects = VIDEO_EFFECTS_LIST;
  if (!allowedEffects.includes(currentEffect)) {
    currentEffect = allowedEffects[0];
  }
}

function updatePersistenceCanvas() {
  // Ensure we never reset the persistence canvas when changing effects
  // Get current frame
  let currentFrame = get();

  // Apply fade to persistence canvas - this creates the trail effect
  // by slightly fading the existing content rather than completely erasing it
  persistCanvas.push();
  persistCanvas.fill(0, 0, 0, 1.0 - persistenceAlpha);
  persistCanvas.noStroke();
  persistCanvas.rect(0, 0, persistCanvas.width, persistCanvas.height);
  persistCanvas.pop();

  // Ensure image uses corner mode
  persistCanvas.imageMode(CORNER);
  // Draw current frame to persistence canvas (full size)
  // This adds the current frame to the persistence canvas
  persistCanvas.image(
    currentFrame,
    0,
    0,
    persistCanvas.width,
    persistCanvas.height
  );
}

function drawBackground() {
  // Get the background mode and index from window globals (set by UI)
  const mode =
    window.selectedBackgroundMode !== undefined
      ? window.selectedBackgroundMode
      : backgroundMode;
  const index =
    window.selectedBackground !== undefined
      ? window.selectedBackground
      : currentBackground;

  // Save shader time
  shaderTime += 0.01;

  push();
  // Reset any transformations so background fills screen
  resetMatrix();

  // In WEBGL mode, coordinates are centered at (0,0)
  // We need to draw a rect that covers the entire screen

  // For shaders, we'll use the shader's coordinate system
  if (mode === 0) {
    // Shader
    if (shaders.length > 0 && index < shaders.length) {
      shader(shaders[index]);

      // Set shader uniforms
      const thisShader = shaders[index];
      thisShader.setUniform("u_resolution", [width, height]);
      thisShader.setUniform("u_time", shaderTime);

      // Set colors from UI
      if (window.shaderColor1)
        thisShader.setUniform("u_color1", window.shaderColor1);
      if (window.shaderColor2)
        thisShader.setUniform("u_color2", window.shaderColor2);
      if (window.shaderColor3)
        thisShader.setUniform("u_color3", window.shaderColor3);

      // --- Hand control uniforms ---
      let handPos = [0.5, 0.5]; // fallback center
      let handRot = 0.0;
      let handDist = 0.5; // fallback scale
      if (hands.length > 0 && hands[0]) {
        // Palm position normalized
        handPos = [
          constrain(hands[0][0].x / width, 0, 1),
          constrain(hands[0][0].y / height, 0, 1),
        ];
        // Rotation
        handRot = handRotation;
        // Scale (thumb-index distance, normalized)
        const thumb = hands[0][1];
        const indexF = hands[0][2];
        const dist = p5.Vector.dist(thumb, indexF);
        handDist = constrain((dist - 50) / 150, 0, 1); // map 50-200px to 0-1
      }
      thisShader.setUniform("u_handPos", handPos);
      thisShader.setUniform("u_handRot", handRot);
      thisShader.setUniform("u_handDist", handDist);
      // --- End hand control uniforms ---

      // Draw shader as full-screen rectangle - make even larger to guarantee coverage
      rectMode(CENTER);
      // Draw a rectangle 2x the size of the canvas to ensure full coverage
      rect(0, 0, width * 2.0, height * 2.0);
      resetShader();
    }
  } else {
    // For videos and custom backgrounds, we need to position differently
    // Translate to bottom-left corner in WEBGL coordinates
    translate(-width / 2, -height / 2, 0);

    if (mode === 2) {
      // Video mode - use the appropriate video source
      if (videoSource === "webcam") {
        // Use the selected background video
        if (bgVideos.length > 0 && index < bgVideos.length) {
          texture(bgVideos[index]);
          rectMode(CORNER);
          rect(0, 0, width, height);
        }
      } else if (videoSource === "upload") {
        // Use the uploaded video
        handleUploadedVideo();
      }
    } else if (mode === 3) {
      // Custom upload
      handleCustomBackground();
    } else if (mode === 4) {
      // Upload video mode
      handleUploadedVideo();
    }
  }

  pop();
}

function handleUploadedVideo() {
  // Check if there's an uploaded video
  if (window.uploadedVideoURL) {
    const url = window.uploadedVideoURL;

    if (!uploadedVideo) {
      // Create the uploaded video
      uploadedVideo = createVideo(url);
      uploadedVideo.loop();
      uploadedVideo.hide();
      uploadedVideo.volume(0);

      // Reset the URL so we don't reload on each frame
      window.uploadedVideoURL = null;

      console.log("Uploaded video loaded");
    }

    // Only draw the video if using the upload source
    if (videoSource === "upload" && uploadedVideo.loadedmetadata) {
      texture(uploadedVideo);
      rectMode(CORNER);
      rect(0, 0, width, height);
    }
  }
}

function handleCustomBackground() {
  // Check if there's a custom background URL
  if (window.customBackgroundURL) {
    const url = window.customBackgroundURL;
    const type = window.customBackgroundType;

    if (!customBg) {
      // Create the custom background
      if (type === "image") {
        loadImage(url, (img) => {
          customBg = img;
          customBgType = "image";
        });
      } else if (type === "video") {
        customBg = createVideo(url);
        customBg.loop();
        customBg.hide();
        customBg.volume(0);
        customBgType = "video";
      }

      // Reset the URL so we don't reload on each frame
      window.customBackgroundURL = null;
    } else if (
      customBgType === "image" ||
      (customBgType === "video" && customBg.loadedmetadata)
    ) {
      // Draw the custom background to fill the entire screen
      texture(customBg);
      rectMode(CORNER);
      rect(0, 0, width, height);
    }
  }
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
  if (getCurrentVideoTexture() && getCurrentVideoTexture().loadedmetadata) {
    // Calculate dimensions to maintain aspect ratio
    let aspectRatio =
      getCurrentVideoTexture().height / getCurrentVideoTexture().width;
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
      texture(getCurrentVideoTexture());
      plane(w, h);

      pop();
    }
  }
  pop();
}

function drawPixelDisplace() {
  push();
  if (getCurrentVideoTexture() && getCurrentVideoTexture().loadedmetadata) {
    // Make pixel size more responsive to hand movements and use effectScale
    let pSize = pixelSize * (1 + energyLevel * 2) * (effectScale / 200);
    let displacementAmount = 50 * (1 + energyLevel * 2); // Displacement based on energy

    // Use effectScale to control the coverage area
    let aspectRatio =
      getCurrentVideoTexture().height / getCurrentVideoTexture().width;
    let w = effectScale * 1.5; // Scale the effect area with hand movement
    let h = w * aspectRatio;

    // Create pixelated and displaced version
    for (let x = -w / 2; x < w / 2; x += pSize) {
      for (let y = -h / 2; y < h / 2; y += pSize) {
        // Make displacement more sensitive to hand movement
        let xOff = sin(frameCount * 0.05 + y * 0.1) * displacementAmount;
        let yOff = cos(frameCount * 0.05 + x * 0.1) * displacementAmount;

        // Use colorShift more effectively
        let col = color((colorShift + x + y) % 255, 255, 255, 200);
        fill(col);
        noStroke();

        push();
        translate(x + xOff, y + yOff, (x + y) * 0.1 * energyLevel); // Add Z-axis displacement

        // Sample webcam texture
        texture(getCurrentVideoTexture());
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

  if (getCurrentVideoTexture() && getCurrentVideoTexture().loadedmetadata) {
    // Scale the effect with effectScale
    let effectRadius = effectScale;

    // Create stronger attraction points from hands
    let attractors = [];
    if (hands.length > 0) {
      hands.forEach((hand) => {
        hand.forEach((point) => {
          attractors.push({
            pos: createVector(
              map(point.x, 0, width, -width / 2, width / 2),
              map(point.y, 0, height, -height / 2, height / 2),
              point.z * 200 // Increase Z influence
            ),
            strength: 2 + energyLevel * 5, // Greatly increase attractor strength
          });
        });
      });
    } else {
      // Add default attractor at center if no hands
      attractors.push({
        pos: createVector(0, 0, 0),
        strength: 0.5,
      });
    }

    // Update and draw particles with more responsiveness
    particles.forEach((particle) => {
      // Apply stronger forces from attractors
      attractors.forEach((attractor) => {
        let force = p5.Vector.sub(attractor.pos, particle.pos);
        let distance = force.mag();
        if (distance < 0.1) distance = 0.1; // Prevent division by zero

        force.normalize();
        // Stronger inverse square law with higher minimum value
        let strength = constrain(
          attractor.strength / (distance * distance * 0.5),
          0,
          2.0 // Higher maximum force
        );
        force.mult(strength * 100); // Increase force multiplier
        particle.vel.add(force);
      });

      // Add more chaos based on energy level
      particle.vel.add(p5.Vector.random3D().mult(energyLevel * 2.0));

      // Update position with higher responsiveness
      particle.pos.add(particle.vel);
      particle.vel.mult(0.92); // Less damping for more active motion

      // Constrain particles to a sphere with radius based on effectScale
      let pos = particle.pos;
      let mag = pos.mag();
      if (mag > effectRadius) {
        pos.mult(effectRadius / mag);
      }

      // Draw particle with webcam texture
      push();
      translate(particle.pos.x, particle.pos.y, particle.pos.z);

      // Calculate UV coordinates for webcam texture sampling
      let u = map(particle.pos.x, -width / 2, width / 2, 0, 1);
      let v = map(particle.pos.y, -height / 2, height / 2, 0, 1);

      // Mix webcam color with particle color - make colors more vibrant
      let speed = particle.vel.mag();
      let bright = map(speed, 0, 20, 100, 255);
      // Use colorShift more effectively
      let hue = (particle.hue + colorShift + frameCount * 0.5) % 255;

      // Apply color tint to the texture
      tint(hue, 255, bright, 200);

      // Scale the particle size with effectScale
      let pSize = particle.size * (1 + speed * 0.2) * (effectScale / 200);
      textureMode(NORMAL);
      texture(getCurrentVideoTexture());

      // Rotate particle to face camera - more rotation with energy
      let angle =
        frameCount * (0.02 + energyLevel * 0.05) + particle.hue * 0.01;
      rotateX(angle);
      rotateY(angle * 1.5);

      // Draw textured particle
      beginShape(QUADS);
      vertex(-pSize, -pSize, 0, u, v);
      vertex(pSize, -pSize, 0, u + 0.2, v);
      vertex(pSize, pSize, 0, u + 0.2, v + 0.2);
      vertex(-pSize, pSize, 0, u, v + 0.2);
      endShape();

      pop();
    });
  }
  pop();
}

function drawCurrentEffect() {
  push();

  // Use hand rotation to control rotation of effects
  // Base rotation on both automatic rotation angle and hand rotation
  rotateY(rotationAngle + handRotation);
  rotateX(sin(handRotation) * PI * 0.3);
  rotateZ(rotationSpeed);

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

function updateDebugPanel() {
  try {
    const fpsDiv = document.getElementById("fps");
    const handsCountDiv = document.getElementById("hands-count");
    const currentEffectDiv = document.getElementById("current-effect");
    const controlsDiv = document.getElementById("controls");
    const ghostStatusDiv = document.getElementById("ghost-status");

    if (!fpsDiv || !handsCountDiv || !currentEffectDiv || !controlsDiv) {
      console.error("Debug panel elements not found");
      return;
    }

    // Update FPS
    const fps = Math.round(frameRate());
    fpsDiv.innerHTML = `FPS: ${fps}`;

    // Update hands count
    handsCountDiv.innerHTML = `Hands detected: ${hands.length}`;

    // Update current effect
    const effectNames = [
      "Crystal Effect",
      "Nebula Effect",
      "Vortex Effect",
      "Galaxy Effect",
      "Fireflies Effect",
      "Mirror Kaleidoscope",
      "Pixel Displace",
      "Particle Storm",
    ];
    currentEffectDiv.innerHTML = `Effect: ${effectNames[currentEffect]}`;

    // Update persistence effect status - use the global state
    if (ghostStatusDiv) {
      ghostStatusDiv.innerHTML = `Trail recording: ${
        window.persistenceEnabled ? "ON" : "OFF"
      }`;
    }

    // Update controls info
    controlsDiv.innerHTML = `
      Scale: ${Math.round(effectScale)}<br>
      Energy: ${Math.round(energyLevel * 100)}%<br>
      Color: ${Math.round((colorShift / 255) * 360)}°<br>
      Hand Rotation: ${Math.round((handRotation / TWO_PI) * 360)}°<br>
      Rotation Speed: ${Math.abs(rotationSpeed).toFixed(2)}
    `;
  } catch (err) {
    console.error("Error updating debug panel:", err);
  }
}

function keyPressed() {
  if (key === "d" || key === "D") {
    debugMode = !debugMode;
    const debugPanel = document.getElementById("debug-panel");
    if (debugPanel) {
      debugPanel.style.display = debugMode ? "block" : "none";
    }
  } else if (key === " ") {
    // Log the trail recording state before changing effect
    console.log(
      "Trail recording state before change:",
      window.persistenceEnabled ? "ON" : "OFF"
    );

    // If in shader mode, cycle shaders instead of effects
    const mode =
      window.selectedBackgroundMode !== undefined
        ? window.selectedBackgroundMode
        : 0;
    if (mode === 0) {
      currentShader = (currentShader + 1) % shaders.length;
      window.selectedBackground = currentShader;
      // Visual feedback for shader change
      const shaderNames = [
        "Cyberpunk Grid",
        "Nebula Flow",
        "Matrix Rain",
        "Liquid RGB",
        "Fractal Noise",
      ];
      const notification = createDiv(`Shader: ${shaderNames[currentShader]}`);
      notification.position(width / 2 - 100, 50);
      notification.style("background-color", "rgba(0,0,0,0.7)");
      notification.style("color", "white");
      notification.style("padding", "10px 20px");
      notification.style("border-radius", "5px");
      notification.style("font-size", "16px");
      notification.style("z-index", "2000");
      notification.style("text-align", "center");
      setTimeout(() => {
        notification.remove();
      }, 2000);
      return;
    }

    // Cycle through effects in the current mode
    let allowedEffects = EFFECTS_LIST;
    if (mode === 2) allowedEffects = VIDEO_EFFECTS_LIST;
    let idx = allowedEffects.indexOf(currentEffect);
    currentEffect = allowedEffects[(idx + 1) % allowedEffects.length];

    // Show effect change notification
    const effectNames = [
      "Crystal Effect",
      "Nebula Effect",
      "Vortex Effect",
      "Galaxy Effect",
      "Fireflies Effect",
      "Mirror Kaleidoscope",
      "Pixel Displace",
      "Particle Storm",
    ];

    console.log("Effect changed to:", effectNames[currentEffect]);

    // Log the trail recording state after changing effect
    console.log(
      "Trail recording state after change:",
      window.persistenceEnabled ? "ON" : "OFF"
    );

    // Visual feedback for effect change
    const notification = createDiv(`Effect: ${effectNames[currentEffect]}`);
    notification.position(width / 2 - 100, 50);
    notification.style("background-color", "rgba(0,0,0,0.7)");
    notification.style("color", "white");
    notification.style("padding", "10px 20px");
    notification.style("border-radius", "5px");
    notification.style("font-size", "16px");
    notification.style("z-index", "2000");
    notification.style("text-align", "center");

    // Remove after 2 seconds
    setTimeout(() => {
      notification.remove();
    }, 2000);

    // IMPORTANT: We don't change the trail recording state when changing effects
    // The persistence state is controlled solely by the toggle button
  } else if (key === "r" || key === "R") {
    // Toggle recording with 'r' key
    toggleRecording();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Recreate the persistence canvas when window is resized
  persistCanvas = createGraphics(windowWidth, windowHeight);
  persistCanvas.background(0);
}

// Video recording functions
function toggleRecording() {
  if (!isRecording) {
    startRecording();
    recordButton.html("⏹ Stop Recording");
    recordButton.style("background", "rgba(255, 0, 0, 0.5)");
    recordButton.style("border-color", "#ff0000");
    recordButton.style("color", "#ff0000");
    recordButton.style("box-shadow", "0 0 10px rgba(255, 0, 0, 0.3)");

    // Show recording started notification
    showNotification("Recording Started", "#ff0000");
  } else {
    stopRecording();
    recordButton.html("⏺ Record HD");
    recordButton.style("background", "rgba(0, 0, 0, 0.5)");
    recordButton.style("border-color", "#00ffff");
    recordButton.style("color", "#00ffff");
    recordButton.style("box-shadow", "0 0 10px rgba(0, 255, 255, 0.3)");

    // Show recording stopped notification
    showNotification("Recording Saved", "#00ff00");
  }
}

// Helper function to show notifications
function showNotification(message, color) {
  const notification = createDiv(message);
  notification.position(width / 2 - 100, 100);
  notification.style("background-color", "rgba(0,0,0,0.8)");
  notification.style("color", color);
  notification.style("padding", "15px 25px");
  notification.style("border-radius", "5px");
  notification.style("font-size", "18px");
  notification.style("font-weight", "bold");
  notification.style("z-index", "2000");
  notification.style("text-align", "center");

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function startRecording() {
  recordedChunks = [];
  isRecording = true;

  // Find our main canvas by ID
  const mainCanvas = document.getElementById("main-effects-canvas");

  if (mainCanvas) {
    console.log("Found main effects canvas by ID:", mainCanvas);
    startRecordingWithCanvas(mainCanvas);
    return;
  }

  // Fallback: Try to find the p5 canvas
  const p5Canvas = document.getElementsByClassName("p5Canvas")[0];

  if (p5Canvas) {
    console.log("Found p5 canvas:", p5Canvas);
    startRecordingWithCanvas(p5Canvas);
    return;
  }

  // Second fallback: Try any canvas
  const canvases = document.querySelectorAll("canvas");
  console.log("Fallback: Found", canvases.length, "canvas elements");

  if (canvases.length > 0) {
    console.log("Using fallback canvas:", canvases[0]);
    startRecordingWithCanvas(canvases[0]);
  } else {
    alert("No canvas found for recording!");
    isRecording = false;
  }
}

function startRecordingWithCanvas(canvas) {
  // Log canvas info
  console.log("Recording canvas:", canvas.width, "x", canvas.height, canvas);

  // Capture the canvas stream at 60fps
  const stream = canvas.captureStream(60);
  console.log("Stream created:", stream);

  // Try to use MP4 container format directly when supported
  const mimeTypes = [
    "video/mp4;codecs=h264",
    "video/mp4",
    "video/webm;codecs=h264",
    "video/webm",
  ];

  // Find the first supported MIME type with much higher bitrate for better quality
  let options = {
    videoBitsPerSecond: 8000000, // Increased to 8 Mbps for higher quality
  };

  let supportedMimeType;

  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      supportedMimeType = type;
      options.mimeType = type;
      console.log(`Using supported mime type: ${type}`);
      break;
    }
  }

  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e) {
    console.error("Exception while creating MediaRecorder:", e);
    try {
      // Fallback to default options but still try for higher quality
      mediaRecorder = new MediaRecorder(stream, {
        videoBitsPerSecond: 5000000,
      });
    } catch (e) {
      try {
        // Last resort - use default settings
        mediaRecorder = new MediaRecorder(stream);
      } catch (e) {
        alert("MediaRecorder is not supported by this browser");
        isRecording = false;
        return;
      }
    }
  }

  mediaRecorder.ondataavailable = function (event) {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = saveVideo;

  // Start recording with smaller chunks to improve quality
  mediaRecorder.start(40); // Smaller time slices for better quality
  console.log("Recording started with high quality settings");
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    console.log("Recording stopped");
  }
}

function saveVideo() {
  if (recordedChunks.length === 0) {
    console.error("No data recorded!");
    return;
  }

  console.log("Saving video from", recordedChunks.length, "chunks");

  // Determine file extension based on MIME type
  let fileExtension = "mp4";
  let mimeType = "video/mp4";

  if (mediaRecorder.mimeType && mediaRecorder.mimeType.includes("webm")) {
    fileExtension = "webm";
    mimeType = "video/webm";
  }

  // Log the MIME type being used
  console.log("Using MIME type for saving:", mimeType);

  // Create a blob from the recorded chunks
  const blob = new Blob(recordedChunks, {
    type: mimeType,
  });

  console.log("Created blob of size:", blob.size, "bytes");

  // Create a URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a download link
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";
  a.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.download = `hand-effect-recording-${timestamp}.${fileExtension}`;

  // Trigger the download
  a.click();
  console.log("Download triggered for file:", a.download);

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    console.log("Cleanup completed");
  }, 100);
}

// Add a new function to clear the persistence canvas
function clearPersistenceCanvas() {
  persistCanvas.background(0);
}

// Make the function globally available
window.clearPersistenceCanvas = clearPersistenceCanvas;

// In video-based effects, use getCurrentVideoTexture() as the texture source
function getCurrentVideoTexture() {
  if (window.selectedBackgroundMode === 2) {
    // Video mode - either webcam or uploaded video
    if (
      videoSource === "upload" &&
      uploadedVideo &&
      uploadedVideo.loadedmetadata
    ) {
      return uploadedVideo;
    } else if (capture) {
      return capture;
    }
  }
  return null;
}
