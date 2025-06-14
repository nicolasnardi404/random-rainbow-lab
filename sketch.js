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
const FRACTAL_3D = 8;
const WIREFRAME = 9;
const SCULPTURE_3D = 10;
const GEOMETRIC_3D = 11;
const NOISE_FIELD_3D = 12;
const PARTICLE_FLOW = 13;
const MAGNETIC_FIELD = 14;
const FLUID_SIM = 15;
const PARTICLE_EXPLOSION = 16;
const TRAIL_SYSTEM = 17;
const STYLE_TRANSFER = 18;
const NEURAL_WARP = 19;
const DEEP_DREAM = 20;
const AI_PATTERNS = 21;
const NEURAL_FLOW = 22;
// New video effects
const VIDEO_PLANES = 23;
const VIDEO_TUNNEL = 24;
const VIDEO_RIBBON = 25;
const VIDEO_CUBES = 26;
const VIDEO_MOSAIC = 27;
const VIDEO_WAVE = 28;
const VIDEO_SPHERE = 29;
const VIDEO_MIRROR_ROOM = 30;
const VIDEO_PARTICLE_SWARM = 31;
const VIDEO_OVERLAY = 32;

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
  CRYSTAL_EFFECT, // Rainbow Wave
  NEBULA_EFFECT, // Digital Noise
  VORTEX_EFFECT, // Glitch Field
  GALAXY_EFFECT, // Cyber Grid
  FIREFLIES_EFFECT, // Neon Pulse
  FRACTAL_3D, // 3D Fractals
  WIREFRAME, // Wireframe Objects
  SCULPTURE_3D, // 3D Sculptures
  GEOMETRIC_3D, // Geometric Shapes
  NOISE_FIELD_3D, // 3D Noise Field
  PARTICLE_FLOW, // Particle Flow
  MAGNETIC_FIELD, // Magnetic Field
  FLUID_SIM, // Fluid Simulation
  PARTICLE_EXPLOSION, // Particle Explosion
  TRAIL_SYSTEM, // Trail System
  STYLE_TRANSFER, // Style Transfer
  NEURAL_WARP, // Neural Warp
  DEEP_DREAM, // Deep Dream
  AI_PATTERNS, // AI Patterns
  NEURAL_FLOW, // Neural Flow
];
// VIDEO: Only video-based effects (Mirror Kaleidoscope, Pixel Displace, Particle Storm)
const VIDEO_EFFECTS_LIST = [
  MIRROR_KALEIDOSCOPE,
  PIXEL_DISPLACE,
  PARTICLE_STORM,
  // New video effects
  VIDEO_TUNNEL,
  VIDEO_CUBES, // Re-enabled - user wants the squares effect
  // VIDEO_MOSAIC, // Removed - causing issues
  VIDEO_SPHERE,
  VIDEO_OVERLAY, // New geometric overlay effect with video background
  // VIDEO_MIRROR_ROOM, // Removed - user didn't like it
  // VIDEO_PARTICLE_SWARM, // Removed - user didn't like it
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

  // Setup instructions panel toggle
  const toggleBtn = select("#toggle-instructions");
  const instructions = select("#instructions");

  // Handle toggle button click
  toggleBtn.mousePressed(() => {
    instructions.toggleClass("collapsed");
  });

  // Handle clicking on collapsed panel
  instructions.mousePressed(() => {
    if (instructions.hasClass("collapsed")) {
      instructions.removeClass("collapsed");
    }
  });

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

  // Get the current effect from window variable if set
  if (window.currentEffect !== undefined) {
    currentEffect = window.currentEffect;
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
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

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
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

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
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

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
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

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
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

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
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTex = getCurrentVideoTexture();
    if (videoTex && videoTex.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTex.width / videoTex.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTex, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

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
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTex = getCurrentVideoTexture();
    if (videoTex && videoTex.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTex.width / videoTex.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTex, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

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
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTex = getCurrentVideoTexture();
    if (videoTex && videoTex.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTex.width / videoTex.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTex, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

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
    case FRACTAL_3D:
      drawFractal3D();
      break;
    case WIREFRAME:
      drawWireframe();
      break;
    case SCULPTURE_3D:
      drawSculpture3D();
      break;
    case GEOMETRIC_3D:
      drawGeometric3D();
      break;
    case NOISE_FIELD_3D:
      drawNoiseField3D();
      break;
    case PARTICLE_FLOW:
      drawParticleFlow();
      break;
    case MAGNETIC_FIELD:
      drawMagneticField();
      break;
    case FLUID_SIM:
      drawFluidSim();
      break;
    case PARTICLE_EXPLOSION:
      drawParticleExplosion();
      break;
    case TRAIL_SYSTEM:
      drawTrailSystem();
      break;
    case STYLE_TRANSFER:
      drawStyleTransfer();
      break;
    case NEURAL_WARP:
      drawNeuralWarp();
      break;
    case DEEP_DREAM:
      drawDeepDream();
      break;
    case AI_PATTERNS:
      drawAIPatterns();
      break;
    case NEURAL_FLOW:
      drawNeuralFlow();
      break;
    case VIDEO_PLANES:
      drawVideoPlanes();
      break;
    case VIDEO_TUNNEL:
      drawVideoTunnel();
      break;
    case VIDEO_RIBBON:
      drawVideoRibbon();
      break;
    case VIDEO_CUBES:
      drawVideoCubes();
      break;
    case VIDEO_MOSAIC:
      drawVideoMosaic();
      break;
    case VIDEO_WAVE:
      drawVideoWave();
      break;
    case VIDEO_SPHERE:
      drawVideoSphere();
      break;
    case VIDEO_OVERLAY:
      drawVideoOverlay();
      break;
    case VIDEO_MIRROR_ROOM:
      drawVideoMirrorRoom();
      break;
    case VIDEO_PARTICLE_SWARM:
      drawVideoParticleSwarm();
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
      "Rainbow Wave",
      "Digital Noise",
      "Glitch Field",
      "Cyber Grid",
      "Neon Pulse",
      "3D Fractals",
      "Wireframe Objects",
      "3D Sculptures",
      "Geometric Shapes",
      "3D Noise Field",
      "Particle Flow",
      "Magnetic Field",
      "Fluid Simulation",
      "Particle Explosion",
      "Trail System",
      "Style Transfer",
      "Neural Warp",
      "Deep Dream",
      "AI Patterns",
      "Neural Flow",
      "Video Planes",
      "Video Tunnel",
      "Video Ribbon",
      "Video Cubes", // Re-enabled - user wants the squares effect
      // "Video Mosaic", // Removed - was causing issues
      "Video Wave",
      "Video Sphere",
      "Video Mirror Room",
      // "Video Particle Swarm", // Removed - user didn't like it
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
      "Rainbow Wave",
      "Digital Noise",
      "Glitch Field",
      "Cyber Grid",
      "Neon Pulse",
      "3D Fractals",
      "Wireframe Objects",
      "3D Sculptures",
      "Geometric Shapes",
      "3D Noise Field",
      "Particle Flow",
      "Magnetic Field",
      "Fluid Simulation",
      "Particle Explosion",
      "Trail System",
      "Style Transfer",
      "Neural Warp",
      "Deep Dream",
      "AI Patterns",
      "Neural Flow",
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

// Function to update video source and force reload
window.updateVideoSource = function (source) {
  videoSource = source;
  window.videoSource = source;

  // Force reload of video if needed
  if (source === "upload" && window.uploadedVideoURL) {
    if (uploadedVideo) {
      uploadedVideo.remove();
      uploadedVideo = null;
    }
    uploadedVideo = createVideo(window.uploadedVideoURL);
    uploadedVideo.loop();
    uploadedVideo.hide();
    uploadedVideo.volume(0);
  } else if (source === "webcam") {
    if (!capture) {
      capture = createCapture(VIDEO);
      capture.hide();
    }
  }
};

// In video-based effects, use getCurrentVideoTexture() as the texture source
function getCurrentVideoTexture() {
  // Return video texture if we're in video mode OR if video background is enabled
  if (window.selectedBackgroundMode === 2 || window.videoBackgroundEnabled) {
    // Video mode or video background enabled - either webcam or uploaded video
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

// New 3D Effects
function drawFractal3D() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(2);

  let time = frameCount * 0.01;
  let scale = effectScale * 0.5;

  for (let i = 0; i < 5; i++) {
    push();
    rotateY(time + (i * PI) / 2.5);
    rotateX(time * 0.5 + (i * PI) / 3);

    let col = color((colorShift + i * 50) % 255, 255, 255, 200);
    stroke(col);

    // Draw fractal pattern
    for (let j = 0; j < 8; j++) {
      push();
      rotateY((j * PI) / 4);
      let r = scale * (1 + sin(time + j) * 0.2);
      let x = cos(time * 2 + j) * r;
      let y = sin(time + j) * r;
      let z = cos(time * 1.5 + j) * r;

      translate(x, y, z);
      box(scale * 0.2 * (1 + energyLevel));
      pop();
    }
    pop();
  }
  pop();
}

function drawWireframe() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(1);

  let time = frameCount * 0.02;
  let scale = effectScale * 0.8;

  // Create wireframe cube
  for (let i = 0; i < 8; i++) {
    let x = i & 1 ? scale : -scale;
    let y = i & 2 ? scale : -scale;
    let z = i & 4 ? scale : -scale;

    push();
    translate(x, y, z);
    let col = color((colorShift + i * 30) % 255, 255, 255, 150);
    stroke(col);
    box(scale * 0.1);
    pop();
  }

  // Connect vertices with lines
  stroke(255, 255, 255, 100);
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      if ((i ^ j) === 1 || (i ^ j) === 2 || (i ^ j) === 4) {
        let x1 = i & 1 ? scale : -scale;
        let y1 = i & 2 ? scale : -scale;
        let z1 = i & 4 ? scale : -scale;
        let x2 = j & 1 ? scale : -scale;
        let y2 = j & 2 ? scale : -scale;
        let z2 = j & 4 ? scale : -scale;

        line(x1, y1, z1, x2, y2, z2);
      }
    }
  }
  pop();
}

function drawSculpture3D() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(2);

  let time = frameCount * 0.01;
  let scale = effectScale * 0.6;

  // Create organic sculpture
  for (let i = 0; i < 12; i++) {
    push();
    rotateY(time + (i * PI) / 6);
    rotateX(time * 0.5 + (i * PI) / 4);

    let col = color((colorShift + i * 20) % 255, 255, 255, 200);
    stroke(col);

    // Draw curved surfaces
    for (let j = 0; j < 8; j++) {
      push();
      let angle = (j * PI) / 4;
      let r = scale * (1 + sin(time + j) * 0.3);
      let x = cos(angle) * r;
      let y = sin(angle) * r;
      let z = cos(time + j) * r;

      translate(x, y, z);
      rotateX(time + j);
      rotateY(time * 0.5 + j);
      torus(scale * 0.1, scale * 0.05);
      pop();
    }
    pop();
  }
  pop();
}

function drawGeometric3D() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(2);

  let time = frameCount * 0.015;
  let scale = effectScale * 0.7;

  // Create geometric patterns
  for (let i = 0; i < 6; i++) {
    push();
    rotateY(time + (i * PI) / 3);
    rotateX(time * 0.5 + (i * PI) / 4);

    let col = color((colorShift + i * 40) % 255, 255, 255, 200);
    stroke(col);

    // Draw different geometric shapes
    switch (i % 4) {
      case 0:
        box(scale * 0.3);
        break;
      case 1:
        sphere(scale * 0.2);
        break;
      case 2:
        cylinder(scale * 0.2, scale * 0.4);
        break;
      case 3:
        cone(scale * 0.2, scale * 0.4);
        break;
    }
    pop();
  }
  pop();
}

function drawNoiseField3D() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(1);

  let time = frameCount * 0.01;
  let scale = effectScale * 0.8;
  let resolution = 10;

  // Create 3D noise field
  for (let x = -scale; x <= scale; x += scale / resolution) {
    for (let y = -scale; y <= scale; y += scale / resolution) {
      for (let z = -scale; z <= scale; z += scale / resolution) {
        let noiseVal = noise(x * 0.01 + time, y * 0.01, z * 0.01 + time);
        if (noiseVal > 0.5) {
          let col = color((colorShift + noiseVal * 100) % 255, 255, 255, 150);
          stroke(col);
          point(x, y, z);
        }
      }
    }
  }
  pop();
}

// New Particle Effects
function drawParticleFlow() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(2);

  let time = frameCount * 0.02;
  let scale = effectScale * 0.8;

  // Create flowing particles
  for (let i = 0; i < particleCount; i++) {
    let t = i / particleCount;
    let angle = t * TWO_PI * 4 + time;
    let radius = scale * (1 + sin(angle) * 0.3);

    let x = cos(angle) * radius;
    let y = sin(angle * 2) * radius;
    let z = sin(angle) * radius;

    let col = color((colorShift + t * 100) % 255, 255, 255, 200);
    stroke(col);

    push();
    translate(x, y, z);
    sphere(particleSize * (1 + energyLevel * sin(angle)));
    pop();
  }
  pop();
}

function drawMagneticField() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(1);

  let time = frameCount * 0.01;
  let scale = effectScale * 0.7;

  // Create magnetic field lines
  for (let i = 0; i < 12; i++) {
    push();
    rotateY(time + (i * PI) / 6);

    let col = color((colorShift + i * 20) % 255, 255, 255, 150);
    stroke(col);

    // Draw field lines
    for (let j = 0; j < 8; j++) {
      let angle = (j * PI) / 4;
      let r = scale * (1 + sin(time + j) * 0.2);
      let x = cos(angle) * r;
      let y = sin(angle) * r;
      let z = cos(time + j) * r;

      push();
      translate(x, y, z);
      rotateX(time + j);
      rotateY(time * 0.5 + j);
      box(scale * 0.1);
      pop();
    }
    pop();
  }
  pop();
}

function drawFluidSim() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(2);

  let time = frameCount * 0.015;
  let scale = effectScale * 0.8;

  // Create fluid-like particles
  for (let i = 0; i < particleCount; i++) {
    let t = i / particleCount;
    let angle = t * TWO_PI * 3 + time;
    let radius = scale * (1 + noise(t * 10 + time) * 0.4);

    let x = cos(angle) * radius;
    let y = sin(angle * 1.5) * radius;
    let z = sin(angle) * radius;

    let col = color((colorShift + t * 80) % 255, 255, 255, 200);
    stroke(col);

    push();
    translate(x, y, z);
    sphere(particleSize * (1 + energyLevel * noise(t * 5 + time)));
    pop();
  }
  pop();
}

function drawParticleExplosion() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(2);

  let time = frameCount * 0.02;
  let scale = effectScale * 0.9;

  // Create explosive particle effect
  for (let i = 0; i < particleCount; i++) {
    let t = i / particleCount;
    let angle = t * TWO_PI * 8 + time;
    let radius = scale * (1 + sin(time * 2 + t * 10) * 0.5);

    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    let z = cos(time + t * 5) * radius;

    let col = color((colorShift + t * 120) % 255, 255, 255, 200);
    stroke(col);

    push();
    translate(x, y, z);
    sphere(particleSize * (1 + energyLevel * sin(time + t * 8)));
    pop();
  }
  pop();
}

function drawTrailSystem() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(2);

  let time = frameCount * 0.01;
  let scale = effectScale * 0.7;

  // Create trailing particles
  for (let i = 0; i < particleCount; i++) {
    let t = i / particleCount;
    let angle = t * TWO_PI * 5 + time;
    let radius = scale * (1 + sin(angle * 2) * 0.3);

    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    let z = sin(time + t * 3) * radius;

    let col = color((colorShift + t * 60) % 255, 255, 255, 200);
    stroke(col);

    push();
    translate(x, y, z);
    sphere(particleSize * (1 + energyLevel * cos(time + t * 4)));
    pop();
  }
  pop();
}

// New Neural Effects
function drawStyleTransfer() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(2);

  let time = frameCount * 0.01;
  let scale = effectScale * 0.8;

  // Create stylized patterns
  for (let i = 0; i < 8; i++) {
    push();
    rotateY(time + (i * PI) / 4);

    let col = color((colorShift + i * 30) % 255, 255, 255, 200);
    stroke(col);

    // Draw artistic patterns
    for (let j = 0; j < 6; j++) {
      let angle = (j * PI) / 3;
      let r = scale * (1 + sin(time + j) * 0.2);
      let x = cos(angle) * r;
      let y = sin(angle) * r;
      let z = cos(time + j) * r;

      push();
      translate(x, y, z);
      rotateX(time + j);
      rotateY(time * 0.5 + j);
      box(scale * 0.15);
      pop();
    }
    pop();
  }
  pop();
}

function drawNeuralWarp() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(1);

  let time = frameCount * 0.015;
  let scale = effectScale * 0.9;

  // Create warped neural patterns
  for (let i = 0; i < particleCount; i++) {
    let t = i / particleCount;
    let angle = t * TWO_PI * 6 + time;
    let radius = scale * (1 + noise(t * 8 + time) * 0.4);

    let x = cos(angle) * radius;
    let y = sin(angle * 1.5) * radius;
    let z = sin(angle) * radius;

    let col = color((colorShift + t * 90) % 255, 255, 255, 200);
    stroke(col);

    push();
    translate(x, y, z);
    sphere(particleSize * (1 + energyLevel * noise(t * 4 + time)));
    pop();
  }
  pop();
}

function drawDeepDream() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(2);

  let time = frameCount * 0.01;
  let scale = effectScale * 0.7;

  // Create dream-like patterns
  for (let i = 0; i < 10; i++) {
    push();
    rotateY(time + (i * PI) / 5);
    rotateX(time * 0.5 + (i * PI) / 4);

    let col = color((colorShift + i * 25) % 255, 255, 255, 200);
    stroke(col);

    // Draw dream patterns
    for (let j = 0; j < 8; j++) {
      let angle = (j * PI) / 4;
      let r = scale * (1 + sin(time + j) * 0.3);
      let x = cos(angle) * r;
      let y = sin(angle) * r;
      let z = cos(time + j) * r;

      push();
      translate(x, y, z);
      rotateX(time + j);
      rotateY(time * 0.5 + j);
      torus(scale * 0.1, scale * 0.05);
      pop();
    }
    pop();
  }
  pop();
}

function drawAIPatterns() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(1);

  let time = frameCount * 0.02;
  let scale = effectScale * 0.8;

  // Create AI-inspired patterns
  for (let i = 0; i < particleCount; i++) {
    let t = i / particleCount;
    let angle = t * TWO_PI * 7 + time;
    let radius = scale * (1 + sin(angle * 2) * 0.3);

    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    let z = cos(time + t * 4) * radius;

    let col = color((colorShift + t * 70) % 255, 255, 255, 200);
    stroke(col);

    push();
    translate(x, y, z);
    sphere(particleSize * (1 + energyLevel * sin(time + t * 6)));
    pop();
  }
  pop();
}

function drawNeuralFlow() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = getCurrentVideoTexture();
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  push();
  noFill();
  strokeWeight(2);

  let time = frameCount * 0.015;
  let scale = effectScale * 0.9;

  // Create flowing neural patterns
  for (let i = 0; i < 12; i++) {
    push();
    rotateY(time + (i * PI) / 6);

    let col = color((colorShift + i * 20) % 255, 255, 255, 200);
    stroke(col);

    // Draw neural connections
    for (let j = 0; j < 8; j++) {
      let angle = (j * PI) / 4;
      let r = scale * (1 + sin(time + j) * 0.2);
      let x = cos(angle) * r;
      let y = sin(angle) * r;
      let z = cos(time + j) * r;

      push();
      translate(x, y, z);
      rotateX(time + j);
      rotateY(time * 0.5 + j);
      box(scale * 0.1);
      pop();
    }
    pop();
  }
  pop();
}

function drawVideoPlanes() {
  // This effect has been disabled per user request
  return;
}

function drawVideoTunnel() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = window.getCurrentVideoTexture
      ? window.getCurrentVideoTexture()
      : null;
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let camZ = 0,
    twist = 0,
    speed = 0.02;
  if (window.hands && window.hands.length > 0 && window.hands[0]) {
    camZ = map(window.hands[0][0].y, 0, window.height, -400, 400);
    twist = window.handRotation || 0;
    if (window.hands[0][1] && window.hands[0][2]) {
      let handScale = p5.Vector.dist(window.hands[0][1], window.hands[0][2]);
      speed = map(handScale, 50, 200, 0.01, 0.08);
    }
  }

  push();
  translate(0, 0, camZ);
  rotateZ(twist);
  let tunnelLength = 1200;
  let numSegments = 40;
  let radius = 220;
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  for (let i = 0; i < numSegments; i++) {
    let z1 = map(i, 0, numSegments, -tunnelLength / 2, tunnelLength / 2);
    let z2 = map(i + 1, 0, numSegments, -tunnelLength / 2, tunnelLength / 2);
    beginShape(QUAD_STRIP);
    for (let a = 0; a <= 24; a++) {
      let theta = map(a, 0, 24, 0, TWO_PI);
      let u = a / 24;
      let v1 = i / numSegments;
      let v2 = (i + 1) / numSegments;
      let x1 = cos(theta) * radius;
      let y1 = sin(theta) * radius;
      let x2 = cos(theta) * radius;
      let y2 = sin(theta) * radius;
      vertex(x1, y1, z1, u, v1);
      vertex(x2, y2, z2, u, v2);
    }
    endShape();
  }
  pop();
}

function drawVideoRibbon() {
  // This effect has been disabled per user request
  return;
}

function drawVideoCubes() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = window.getCurrentVideoTexture
      ? window.getCurrentVideoTexture()
      : null;
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let posX = 0,
    posY = 0,
    posZ = 0,
    spacing = 90,
    rotY = 0,
    rotX = 0;
  if (hands && hands.length > 0 && hands[0]) {
    posX = map(hands[0][0].x, 0, width, -width / 2, width / 2);
    posY = map(hands[0][0].y, 0, height, -height / 2, height / 2);
    posZ = hands[0][0].z * 400;
    if (hands[0][1] && hands[0][2]) {
      let handScale = p5.Vector.dist(hands[0][1], hands[0][2]);
      spacing = map(handScale, 50, 200, 60, 180);
    }
    if (handRotation !== undefined) {
      rotY = handRotation;
      rotX = Math.sin(handRotation) * Math.PI * 0.3;
    }
  }

  let grid = 3;
  let cubeSize = 60;

  push();
  translate(posX, posY, posZ);
  rotateY(rotY);
  rotateX(rotX);
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  for (let x = 0; x < grid; x++) {
    for (let y = 0; y < grid; y++) {
      for (let z = 0; z < grid; z++) {
        push();
        let px = (x - 1) * spacing;
        let py = (y - 1) * spacing;
        let pz = (z - 1) * spacing;
        translate(px, py, pz);
        // Map a different part of the video to each cube face
        for (let f = 0; f < 6; f++) {
          push();
          let u0 = x / grid,
            v0 = y / grid,
            u1 = (x + 1) / grid,
            v1 = (y + 1) / grid;
          switch (f) {
            case 0:
              rotateY(0);
              translate(0, 0, cubeSize / 2);
              break; // front
            case 1:
              rotateY(PI);
              translate(0, 0, cubeSize / 2);
              break; // back
            case 2:
              rotateY(HALF_PI);
              translate(0, 0, cubeSize / 2);
              break; // right
            case 3:
              rotateY(-HALF_PI);
              translate(0, 0, cubeSize / 2);
              break; // left
            case 4:
              rotateX(-HALF_PI);
              translate(0, 0, cubeSize / 2);
              break; // top
            case 5:
              rotateX(HALF_PI);
              translate(0, 0, cubeSize / 2);
              break; // bottom
          }
          beginShape();
          vertex(-cubeSize / 2, -cubeSize / 2, 0, u0, v0);
          vertex(cubeSize / 2, -cubeSize / 2, 0, u1, v0);
          vertex(cubeSize / 2, cubeSize / 2, 0, u1, v1);
          vertex(-cubeSize / 2, cubeSize / 2, 0, u0, v1);
          endShape(CLOSE);
          pop();
        }
        pop();
      }
    }
  }
  pop();
}

// Replacement function that does nothing
function drawVideoMosaic() {
  // This effect has been disabled due to rendering issues
  return;
}

function drawVideoWave() {
  // This effect has been disabled per user request
  return;
}

function drawVideoSphere() {
  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    const videoTexBg = window.getCurrentVideoTexture
      ? window.getCurrentVideoTexture()
      : null;
    if (videoTexBg && videoTexBg.loadedmetadata) {
      // Exit 3D transformation context to draw background in screen space
      pop();

      // Draw video as full-screen background
      push();
      resetMatrix();
      translate(-width / 2, -height / 2);
      imageMode(CORNER);

      // Calculate aspect ratio to cover entire screen
      let videoAspect = videoTexBg.width / videoTexBg.height;
      let screenAspect = width / height;
      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0;

      if (videoAspect > screenAspect) {
        drawHeight = height;
        drawWidth = height * videoAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / videoAspect;
        offsetY = (height - drawHeight) / 2;
      }

      if (drawWidth < width) {
        let scale = width / drawWidth;
        drawWidth = width;
        drawHeight = drawHeight * scale;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      if (drawHeight < height) {
        let scale = height / drawHeight;
        drawHeight = height;
        drawWidth = drawWidth * scale;
        offsetY = 0;
        offsetX = (width - drawWidth) / 2;
      }

      image(videoTexBg, offsetX, offsetY, drawWidth, drawHeight);
      pop();

      // Re-enter 3D transformation context for overlay effects
      push();
    }
  }

  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let rotY = 0,
    rotX = 0,
    scaleValue = 1; // Renamed from 'scale' to avoid conflict with p5.js scale() function
  if (hands && hands.length > 0 && hands[0]) {
    if (handRotation !== undefined) {
      rotY = handRotation;
      rotX = Math.sin(handRotation) * Math.PI * 0.3;
    }
    if (hands[0][1] && hands[0][2]) {
      let handScale = p5.Vector.dist(hands[0][1], hands[0][2]);
      scaleValue = map(handScale, 50, 200, 0.7, 1.7);
    }
  }

  push();
  rotateY(rotY);
  rotateX(rotX);
  scaleValue = constrain(scaleValue, 0.5, 2.5);
  scale(scaleValue); // Now using the p5.js scale() function properly
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  sphere(180, 36, 24);
  pop();
}

function drawVideoMirrorRoom() {
  // This effect has been disabled per user request
  return;
}

function drawVideoParticleSwarm() {
  // This effect has been disabled per user request
  return;
}

function drawVideoOverlay() {
  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Check if video background toggle is enabled
  if (window.videoBackgroundEnabled) {
    // IMPORTANT: This effect needs to ignore all 3D transformations from drawCurrentEffect
    // We need to draw the video background in screen space, not 3D space
    pop(); // Exit the 3D transformation context from drawCurrentEffect

    // Draw video as a true background layer - completely static and non-interactive
    // This should cover the entire screen with no black areas
    push();

    // Reset ALL transformations to draw in pure screen coordinates
    resetMatrix();

    // Move to screen coordinates (WEBGL uses center as origin)
    translate(-width / 2, -height / 2);

    // Use image() function to draw the video texture directly like an image
    imageMode(CORNER);

    // Calculate aspect ratio to COVER the entire screen (no black areas)
    let videoAspect = videoTex.width / videoTex.height;
    let screenAspect = width / height;

    let drawWidth, drawHeight;
    let offsetX = 0,
      offsetY = 0;

    // Always scale to cover the entire screen (crop if needed, no black areas)
    if (videoAspect > screenAspect) {
      // Video is wider - scale to screen height and crop left/right if needed
      drawHeight = height;
      drawWidth = height * videoAspect;
      offsetX = (width - drawWidth) / 2;
    } else {
      // Video is taller - scale to screen width and crop top/bottom if needed
      drawWidth = width;
      drawHeight = width / videoAspect;
      offsetY = (height - drawHeight) / 2;
    }

    // Ensure we always fill the entire screen by scaling up if needed
    if (drawWidth < width) {
      let scale = width / drawWidth;
      drawWidth = width;
      drawHeight = drawHeight * scale;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    }

    if (drawHeight < height) {
      let scale = height / drawHeight;
      drawHeight = height;
      drawWidth = drawWidth * scale;
      offsetY = 0;
      offsetX = (width - drawWidth) / 2;
    }

    // Draw the video texture as a background image, guaranteed to cover full screen
    image(videoTex, offsetX, offsetY, drawWidth, drawHeight);

    pop();

    // Re-enter 3D transformation context for overlay effects
    push();
  }

  // Now add psychedelic geometric overlay effects on top of the video background (or regular background)
  push();

  // Reset matrix again to work in screen space for overlay effects
  resetMatrix();

  // Hand controls for overlay effects
  let centerX = 0,
    centerY = 0;
  let effectSize = 150;
  let rotationSpeed = 0;
  let numLayers = 3;
  let waveAmplitude = 50;

  if (hands && hands.length > 0 && hands[0]) {
    // Right hand controls position and size
    centerX = map(hands[0][0].x, 0, width, -width / 3, width / 3);
    centerY = map(hands[0][0].y, 0, height, -height / 3, height / 3);

    // Pinch controls effect size
    if (hands[0][1] && hands[0][2]) {
      let pinchDist = p5.Vector.dist(hands[0][1], hands[0][2]);
      effectSize = map(pinchDist, 30, 150, 80, 300);
    }

    // Hand rotation controls spin speed
    if (handRotation !== undefined) {
      rotationSpeed = handRotation * 0.5;
    }

    // Left hand controls wave amplitude and layers
    if (hands.length > 1 && hands[1] && hands[1][0]) {
      waveAmplitude = map(hands[1][0].y, 0, height, 20, 100);
      numLayers = Math.floor(map(hands[1][0].x, 0, width, 2, 6));
    }
  }

  translate(centerX, centerY);

  // Create multiple layers of psychedelic geometric effects
  for (let layer = 0; layer < numLayers; layer++) {
    push();

    // Each layer rotates at different speeds
    let layerRotation = millis() * 0.001 * (layer + 1) + rotationSpeed;
    rotateZ(layerRotation);

    // Layer-specific properties
    let layerSize = effectSize * (1 - layer * 0.2);
    let numShapes = 8 + layer * 4;

    // Draw geometric shapes with video texture
    for (let i = 0; i < numShapes; i++) {
      push();

      let angle = (TWO_PI / numShapes) * i;
      let radius =
        layerSize + sin(millis() * 0.003 + i + layer) * waveAmplitude;

      let x = cos(angle) * radius;
      let y = sin(angle) * radius;
      let z = sin(millis() * 0.002 + i * 0.5) * 30;

      translate(x, y, z);
      rotateZ(angle + millis() * 0.002);
      rotateY(millis() * 0.001 + i);

      // Apply video texture to shapes
      textureMode(NORMAL);
      texture(videoTex);
      noStroke();

      // Different geometric shapes for psychedelic effect
      let shapeType = (i + layer) % 4;

      if (shapeType === 0) {
        // Triangular prisms
        fill(255, 200 + layer * 20);
        beginShape(TRIANGLES);
        let size = 30 + layer * 10;
        // Front face
        vertex(-size / 2, -size / 2, size / 2, 0.2, 0.2);
        vertex(size / 2, -size / 2, size / 2, 0.8, 0.2);
        vertex(0, size / 2, size / 2, 0.5, 0.8);
        // Back face
        vertex(-size / 2, -size / 2, -size / 2, 0.2, 0.2);
        vertex(0, size / 2, -size / 2, 0.5, 0.8);
        vertex(size / 2, -size / 2, -size / 2, 0.8, 0.2);
        endShape();
      } else if (shapeType === 1) {
        // Hexagonal shapes
        fill(255, 180 + layer * 15);
        beginShape();
        let size = 25 + layer * 8;
        for (let j = 0; j < 6; j++) {
          let hexAngle = (TWO_PI / 6) * j;
          let hx = cos(hexAngle) * size;
          let hy = sin(hexAngle) * size;
          let u = map(hx, -size, size, 0.1, 0.9);
          let v = map(hy, -size, size, 0.1, 0.9);
          vertex(hx, hy, 0, u, v);
        }
        endShape(CLOSE);
      } else if (shapeType === 2) {
        // Rotating cubes
        fill(255, 160 + layer * 25);
        let size = 20 + layer * 6;
        rotateX(millis() * 0.003);
        rotateY(millis() * 0.002);
        box(size);
      } else {
        // Morphing ellipses
        fill(255, 140 + layer * 30);
        let sizeX = 35 + sin(millis() * 0.004 + i) * 15;
        let sizeY = 25 + cos(millis() * 0.003 + i) * 10;
        ellipse(0, 0, sizeX, sizeY);
      }

      pop();
    }

    // Add connecting lines between shapes for extra psychedelic effect
    stroke(255, 255, 0, 100 + layer * 20);
    strokeWeight(1 + layer * 0.5);
    noFill();

    for (let i = 0; i < numShapes; i++) {
      let angle1 = (TWO_PI / numShapes) * i;
      let angle2 = (TWO_PI / numShapes) * ((i + 1) % numShapes);
      let radius1 =
        layerSize + sin(millis() * 0.003 + i + layer) * waveAmplitude;
      let radius2 =
        layerSize + sin(millis() * 0.003 + (i + 1) + layer) * waveAmplitude;

      let x1 = cos(angle1 + layerRotation) * radius1;
      let y1 = sin(angle1 + layerRotation) * radius1;
      let x2 = cos(angle2 + layerRotation) * radius2;
      let y2 = sin(angle2 + layerRotation) * radius2;

      line(x1, y1, x2, y2);
    }

    pop();
  }

  // Add particle trails that follow hand movement with video texture
  if (hands && hands.length > 0 && hands[0]) {
    // Store trail points
    if (!window.overlayTrailPoints) window.overlayTrailPoints = [];

    window.overlayTrailPoints.push({
      x: centerX,
      y: centerY,
      time: millis(),
      size: effectSize * 0.1,
    });

    // Remove old points
    window.overlayTrailPoints = window.overlayTrailPoints.filter(
      (p) => millis() - p.time < 3000
    );

    // Draw psychedelic trail with video texture
    for (let i = 0; i < window.overlayTrailPoints.length - 1; i++) {
      let point = window.overlayTrailPoints[i];
      let nextPoint = window.overlayTrailPoints[i + 1];
      let alpha = map(millis() - point.time, 0, 3000, 255, 0);

      push();
      translate(point.x, point.y);

      // Create small video-textured shapes along the trail
      textureMode(NORMAL);
      texture(videoTex);
      fill(255, alpha * 0.7);
      noStroke();

      let trailSize = point.size * map(alpha, 0, 255, 0.2, 1);
      beginShape();
      vertex(-trailSize, -trailSize, 0, 0.3, 0.3);
      vertex(trailSize, -trailSize, 0, 0.7, 0.3);
      vertex(trailSize, trailSize, 0, 0.7, 0.7);
      vertex(-trailSize, trailSize, 0, 0.3, 0.7);
      endShape(CLOSE);

      pop();

      // Connect trail points with glowing lines
      stroke(255, 100, 255, alpha * 0.5);
      strokeWeight(2);
      if (nextPoint) {
        line(point.x, point.y, nextPoint.x, nextPoint.y);
      }
    }
  }

  pop();

  // Re-enter the 3D transformation context for any overlay effects
  push();
}
