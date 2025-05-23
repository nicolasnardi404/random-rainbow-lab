// Video distortion controller
let video;
let videoSource;
let canvas;
let ctx;
let videoElement;
let p5VideoElement; // p5.js compatible video element
let isPlaying = false;
let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let isUsingWebcam = false;

// Effect parameters
let currentEffect = null;
let effectIntensity = 0.5; // 0-1 range
let ghostAlpha = 0.15;
let glitchIntensity = 0.3;
let pixelSize = 10;
let noiseAmount = 0.2;
let rgbShiftAmount = 5;
let vhsIntensity = 0.4;
let mirrorMode = 0; // 0: none, 1: horizontal, 2: vertical, 3: quad
let waveAmplitude = 10;
let waveFrequency = 0.05;
let waveSpeed = 0.1;
let wavePhase = 0;
let sliceCount = 20;
let sliceOffsetMax = 30;
let sliceDirection = 0; // 0: horizontal, 1: vertical
let sliceTime = 0;
let bloomThreshold = 0.6;
let bloomRadius = 8;
let bloomIntensity = 1.5;
let kaleidoscopeSegments = 8;
let kaleidoscopeRadius = 0;
let scanlineSpacing = 4;
let scanlineThickness = 1;
let scanlineIntensity = 0.3;

// Canvas for persistence effects (ghost)
let persistCanvas;
let persistCtx;

// Setup function - p5.js entry point
function setup() {
  // Create a main canvas for display
  canvas = createCanvas(800, 450);
  canvas.id("main-canvas");
  canvas.parent("canvas-container"); // Ensure canvas is added to a container

  // Create a persistence canvas for ghost effects
  persistCanvas = document.createElement("canvas");
  persistCanvas.width = width;
  persistCanvas.height = height;
  persistCtx = persistCanvas.getContext("2d");

  // Create a p5.js video element (with an empty array as source to avoid the error)
  p5VideoElement = createVideo([""]);
  p5VideoElement.hide();

  // Initial setup
  setupEventListeners();
  updateStatusBar("No video loaded. Upload a video to begin.");

  // Debug info
  console.log("Canvas created with dimensions:", width, "x", height);
  console.log("Canvas element:", canvas.elt);
}

// Draw function - p5.js animation loop
function draw() {
  // Always render something to the canvas so we can see it
  clear();

  // Add debugging about video state to console
  if (frameCount % 60 === 0) {
    // Only log once a second
    if (videoElement) {
      console.log(
        `Video element state: readyState=${videoElement.readyState}, paused=${videoElement.paused}, width=${videoElement.videoWidth}, height=${videoElement.videoHeight}`
      );
    }
  }

  // Special debug mode by pressing D key
  if (keyIsDown(68)) {
    // D key
    if (videoElement) {
      // Force show the video element
      drawingContext.drawImage(videoElement, 0, 0, width, height);
      fill(255);
      textFont("monospace", 12);
      textAlign(LEFT, TOP);
      text(
        `Video debug: ${videoElement.videoWidth}x${videoElement.videoHeight}, readyState=${videoElement.readyState}`,
        10,
        10
      );
      return;
    }
  }

  // Debug information
  if (!videoElement || videoElement.readyState < 2) {
    // Show a message or placeholder when no video is loaded
    background(0);
    fill(100);
    textAlign(CENTER, CENTER);
    // Use textFont to avoid the reserved function warning
    textFont("monospace", 20);
    text("Upload a video or enable webcam to begin", width / 2, height / 2);
    return;
  }

  // Check if we have a video source
  if (videoElement && videoElement.readyState >= 2) {
    if (isPlaying && !videoElement.paused) {
      // Main rendering
      renderFrame();
    } else {
      // If paused, still show the last frame
      drawingContext.drawImage(videoElement, 0, 0, width, height);
      fill(255);
      textAlign(CENTER, CENTER);
      textFont("monospace", 20);
      text("PAUSED - Press P to play", width / 2, height / 2);
    }
  }
}

// Set up event listeners for UI controls
function setupEventListeners() {
  // Upload button
  const uploadBtn = document.getElementById("upload-btn");
  const videoFile = document.getElementById("video-file");
  const recordBtn = document.getElementById("record-button");
  const webcamBtn = document.getElementById("webcam-btn");

  uploadBtn.addEventListener("click", () => {
    videoFile.click();
  });

  videoFile.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      loadVideoFile(e.target.files[0]);
    }
  });

  // Webcam button
  webcamBtn.addEventListener("click", () => {
    startWebcam();
  });

  // Effect dropdown
  const effectDropdown = document.getElementById("effect-dropdown");
  if (effectDropdown) {
    effectDropdown.addEventListener("change", function () {
      const effect = this.value;

      if (effect === "none") {
        // Disable effects
        currentEffect = null;
        updateStatusBar("Effects disabled");
      } else {
        // Enable the selected effect
        currentEffect = effect;
        updateStatusBar(`Effect activated: ${effect.replace("_", " ")}`);
      }

      // Update parameter sliders
      updateParameterSliders(currentEffect);
    });
  }

  // Intensity slider
  const intensitySlider = document.getElementById("intensity-slider");
  if (intensitySlider) {
    intensitySlider.addEventListener("input", function () {
      effectIntensity = parseFloat(this.value);
      updateStatusBar(
        `Effect intensity: ${Math.round(effectIntensity * 100)}%`
      );

      // Update the intensity display
      const intensityValue = document.getElementById("intensity-value");
      if (intensityValue) {
        intensityValue.textContent = Math.round(effectIntensity * 100) + "%";
      }
    });
  }

  // Record button
  recordBtn.addEventListener("click", toggleRecording);

  // Keyboard controls
  document.addEventListener("keydown", handleKeyDown);
}

// Start webcam as video source
function startWebcam() {
  // If already using webcam, do nothing
  if (isUsingWebcam && videoElement) return;

  // Stop any existing video
  if (videoElement) {
    videoElement.pause();
    videoElement.removeAttribute("src");
    videoElement.load();
  }

  // Create video element if it doesn't exist
  if (!videoElement) {
    videoElement = document.createElement("video");
    videoElement.controls = false;
    videoElement.muted = true;
    videoElement.style.display = "none";
    videoElement.crossOrigin = "anonymous";
    document.body.appendChild(videoElement);
  }

  // Request webcam access
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        console.log("Webcam stream obtained");
        videoElement.srcObject = stream;

        // Also set the p5 video element
        if (p5VideoElement) {
          // For webcam, need to recreate the p5VideoElement with the stream
          p5VideoElement.remove();
          p5VideoElement = createCapture(VIDEO);
          p5VideoElement.hide();
          console.log("Created p5 capture for webcam");
        }

        videoElement
          .play()
          .then(() => {
            isPlaying = true;
            isUsingWebcam = true;
            updateStatusBar("Using webcam | Press P to pause/play");

            // Resize canvas to match webcam dimensions
            videoElement.addEventListener("loadedmetadata", () => {
              resizeCanvasToVideo();
            });
          })
          .catch((err) => {
            console.error("Error playing webcam:", err);
            updateStatusBar(
              "Error accessing webcam. Please check permissions."
            );
          });
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
        updateStatusBar("Error accessing webcam. Please check permissions.");
      });
  } else {
    updateStatusBar("Webcam not supported in this browser.");
  }
}

// Load a video file from the user's computer
function loadVideoFile(file) {
  console.log("Loading video file:", file.name);

  // Clear any previous video or webcam
  if (videoElement) {
    // If using webcam, stop the stream
    if (isUsingWebcam && videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }

    videoElement.pause();
    videoElement.removeAttribute("src");
    videoElement.srcObject = null;
    videoElement.load();
    isUsingWebcam = false;
  }

  // Create video element if it doesn't exist
  if (!videoElement) {
    videoElement = document.createElement("video");
    videoElement.controls = false;
    videoElement.muted = true;
    videoElement.style.display = "none";
    videoElement.crossOrigin = "anonymous"; // Add this to avoid CORS issues
    document.body.appendChild(videoElement);
    console.log("Created new video element");
  }

  try {
    // Set up video source
    const videoURL = URL.createObjectURL(file);
    videoElement.src = videoURL;
    console.log("Set video source to:", videoURL);

    // Also set the p5 video element
    if (p5VideoElement) {
      // For p5.js videos, we need to use the remove and recreate approach
      p5VideoElement.remove();
      p5VideoElement = createVideo([videoURL], videoLoaded);
      p5VideoElement.hide();
      p5VideoElement.volume(0);
      console.log("Created new p5 video element with source:", videoURL);
    } else {
      console.error("p5VideoElement is not defined!");
    }
  } catch (e) {
    console.error("Error setting video source:", e);
    updateStatusBar("Error loading video: " + e.message);
  }

  // Add event listeners
  videoElement.addEventListener("loadedmetadata", () => {
    console.log(
      "Video metadata loaded:",
      videoElement.videoWidth,
      "x",
      videoElement.videoHeight
    );
    // Resize canvas to match video dimensions while maintaining aspect ratio
    resizeCanvasToVideo();

    // Auto-play video
    videoElement
      .play()
      .then(() => {
        isPlaying = true;
        updateStatusBar(`Playing: ${file.name} | Press P to pause/play`);
        console.log("Video is now playing");
      })
      .catch((err) => {
        console.error("Error playing video:", err);
        updateStatusBar("Error playing video. Try again.");
      });
  });

  videoElement.addEventListener("ended", () => {
    // Loop the video when it ends
    videoElement.currentTime = 0;
    videoElement.play();
  });
}

// Callback when the video is loaded
function videoLoaded() {
  console.log("p5 Video loaded successfully");
  try {
    this.loop();
    this.volume(0);
  } catch (e) {
    console.error("Error in videoLoaded:", e);
  }
}

// Main render function - applies the selected effect
function renderFrame() {
  // Clear the canvas
  clear();

  // Direct rendering approach
  if (videoElement && videoElement.readyState >= 2) {
    // Use the direct approach with drawingContext for the base rendering
    try {
      // Check if we should apply effects or just show the video
      if (!currentEffect) {
        // Just display the video directly
        drawingContext.drawImage(videoElement, 0, 0, width, height);
        return;
      }

      // For effects, we use different methods depending on the effect
      switch (currentEffect) {
        case "rgb_shift":
          applyRGBShiftDirect();
          break;
        case "ghost":
          applyGhostDirect();
          break;
        case "bloom":
          applyBloomEffect();
          break;
        case "pixelate":
          applyPixelateDirect();
          break;
        case "vhs":
          applyVHSEffectDirect();
          break;
        case "noise":
          applyNoiseDirect();
          break;
        case "invert":
          applyInvertDirect();
          break;
        case "wave":
          applyWaveEffect();
          break;
        case "slice":
          applySliceEffect();
          break;
        case "kaleidoscope":
          applyKaleidoscopeEffect();
          break;
        case "scanlines":
          applyScanlinesDirect();
          break;
        case "glitch":
          applyGlitchDirect();
          break;
        case "mirror":
          applyMirrorDirect();
          break;
        default:
          // Just display the video directly
          drawingContext.drawImage(videoElement, 0, 0, width, height);
      }
    } catch (e) {
      console.error("Error rendering frame:", e);
      // Show error message
      background(0);
      fill(255, 0, 0);
      textFont("monospace", 16);
      textAlign(CENTER, CENTER);
      text("Error rendering video: " + e.message, width / 2, height / 2);
    }
  } else {
    // Show placeholder when no video is loaded
    background(0);
    fill(150);
    textFont("monospace", 20);
    textAlign(CENTER, CENTER);
    text("Upload a video or enable webcam to begin", width / 2, height / 2);
  }
}

// Direct RGB Shift Effect using pure Canvas API
function applyRGBShiftDirect() {
  // Create temporary canvases for each channel
  let redCanvas = document.createElement("canvas");
  let greenCanvas = document.createElement("canvas");
  let blueCanvas = document.createElement("canvas");

  redCanvas.width = greenCanvas.width = blueCanvas.width = width;
  redCanvas.height = greenCanvas.height = blueCanvas.height = height;

  let redCtx = redCanvas.getContext("2d");
  let greenCtx = greenCanvas.getContext("2d");
  let blueCtx = blueCanvas.getContext("2d");

  // Draw the video to each canvas with respective offsets
  // Make the shift more noticeable by using the full canvas
  redCtx.drawImage(
    videoElement,
    -rgbShiftAmount * effectIntensity,
    0,
    width,
    height
  );
  greenCtx.drawImage(videoElement, 0, 0, width, height);
  blueCtx.drawImage(
    videoElement,
    rgbShiftAmount * effectIntensity,
    0,
    width,
    height
  );

  // Create a temporary canvas for the final result
  let resultCanvas = document.createElement("canvas");
  resultCanvas.width = width;
  resultCanvas.height = height;
  let resultCtx = resultCanvas.getContext("2d");

  // Extract channels
  let redData = redCtx.getImageData(0, 0, width, height);
  let greenData = greenCtx.getImageData(0, 0, width, height);
  let blueData = blueCtx.getImageData(0, 0, width, height);

  // Create combined image
  let resultData = resultCtx.createImageData(width, height);

  // Combine RGB channels
  for (let i = 0; i < resultData.data.length; i += 4) {
    resultData.data[i] = redData.data[i]; // R
    resultData.data[i + 1] = greenData.data[i + 1]; // G
    resultData.data[i + 2] = blueData.data[i + 2]; // B
    resultData.data[i + 3] = 255; // A
  }

  // Put the result on the result canvas
  resultCtx.putImageData(resultData, 0, 0);

  // Draw the result to the main canvas
  drawingContext.drawImage(resultCanvas, 0, 0, width, height);
}

// Direct Ghost Effect using pure Canvas API
function applyGhostDirect() {
  // Apply fade to persistence canvas based on ghost alpha
  persistCtx.fillStyle = `rgba(0, 0, 0, ${1 - ghostAlpha * effectIntensity})`;
  persistCtx.fillRect(0, 0, width, height);

  // Draw current video frame to persistence canvas
  persistCtx.drawImage(videoElement, 0, 0, width, height);

  // Draw the persistence canvas to the main canvas
  drawingContext.drawImage(persistCanvas, 0, 0);
}

// Direct Pixelate Effect
function applyPixelateDirect() {
  // Create a temporary canvas
  let tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  let tempCtx = tempCanvas.getContext("2d");

  // Draw the video to the temp canvas
  tempCtx.drawImage(videoElement, 0, 0, width, height);

  // Determine pixel size based on intensity
  const pSize = Math.max(2, pixelSize * effectIntensity);

  // Get the context for the main canvas
  let ctx = drawingContext;

  // Apply pixelation by drawing small sections at larger scale
  for (let y = 0; y < height; y += pSize) {
    for (let x = 0; x < width; x += pSize) {
      // Get the color of a pixel
      let pixel = tempCtx.getImageData(x, y, 1, 1).data;

      // Fill a rectangle with that color
      ctx.fillStyle = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${
        pixel[3] / 255
      })`;
      ctx.fillRect(x, y, pSize, pSize);
    }
  }
}

// Direct VHS Effect
function applyVHSEffectDirect() {
  // Create a temporary canvas
  let tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  let tempCtx = tempCanvas.getContext("2d");

  // Draw the base video
  tempCtx.drawImage(videoElement, 0, 0, width, height);

  // Get the main canvas context
  let ctx = drawingContext;

  // Draw the base image to the main canvas
  ctx.drawImage(tempCanvas, 0, 0);

  // Random VHS tracking noise
  if (Math.random() < 0.05 * vhsIntensity) {
    const noiseY = Math.random() * height;
    const noiseHeight = 5 + Math.random() * 10;
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(0, noiseY, width, noiseHeight);
  }

  // Color adjustments (saturation, etc.) directly using filters
  ctx.filter = `saturate(${1.2 + effectIntensity})`;
  ctx.filter += ` brightness(${1 + 0.1 * effectIntensity})`;
  ctx.filter += ` contrast(${1 + 0.2 * effectIntensity})`;

  // Draw the image again with the filters
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.filter = "none";

  // VHS scanlines
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  for (let y = 0; y < height; y += 2) {
    ctx.fillRect(0, y, width, 1);
  }

  // Random horizontal displacement
  if (Math.random() < 0.03 * vhsIntensity * effectIntensity) {
    const scanlineY = Math.floor(Math.random() * height);
    const scanlineHeight = Math.floor(1 + Math.random() * 4);
    const xOffset = (Math.random() * 40 - 20) * effectIntensity;

    // Clear the scanline area
    ctx.clearRect(0, scanlineY, width, scanlineHeight);

    // Draw the offset line
    ctx.drawImage(
      tempCanvas,
      0,
      scanlineY,
      width,
      scanlineHeight,
      xOffset,
      scanlineY,
      width,
      scanlineHeight
    );
  }
}

// Direct Noise Effect
function applyNoiseDirect() {
  // Create a temporary canvas for the base image
  let tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  let tempCtx = tempCanvas.getContext("2d");

  // Draw the video to the temp canvas
  tempCtx.drawImage(videoElement, 0, 0, width, height);

  // Get image data to manipulate
  let imageData = tempCtx.getImageData(0, 0, width, height);
  let data = imageData.data;

  // Add noise
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < noiseAmount * effectIntensity) {
      const noiseValue = Math.random() * 255;
      data[i] = (data[i] + noiseValue) / 2; // R
      data[i + 1] = (data[i + 1] + noiseValue) / 2; // G
      data[i + 2] = (data[i + 2] + noiseValue) / 2; // B
    }
  }

  // Put the modified image data back
  tempCtx.putImageData(imageData, 0, 0);

  // Draw to main canvas
  drawingContext.drawImage(tempCanvas, 0, 0);
}

// Direct Invert Effect
function applyInvertDirect() {
  // Create a temporary canvas
  let tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  let tempCtx = tempCanvas.getContext("2d");

  // Draw the video to the temp canvas
  tempCtx.drawImage(videoElement, 0, 0, width, height);

  // Get image data to manipulate
  let imageData = tempCtx.getImageData(0, 0, width, height);
  let data = imageData.data;

  // Apply inversion based on intensity
  for (let i = 0; i < data.length; i += 4) {
    // Interpolate between original and inverted based on effectIntensity
    data[i] =
      data[i] * (1 - effectIntensity) + (255 - data[i]) * effectIntensity;
    data[i + 1] =
      data[i + 1] * (1 - effectIntensity) +
      (255 - data[i + 1]) * effectIntensity;
    data[i + 2] =
      data[i + 2] * (1 - effectIntensity) +
      (255 - data[i + 2]) * effectIntensity;
  }

  // Put the modified image data back
  tempCtx.putImageData(imageData, 0, 0);

  // Draw to main canvas
  drawingContext.drawImage(tempCanvas, 0, 0);
}

// Direct Scanlines Effect
function applyScanlinesDirect() {
  // Draw the base video
  drawingContext.drawImage(videoElement, 0, 0, width, height);

  // Calculate scanline parameters based on intensity
  const spacing = Math.max(2, Math.floor(scanlineSpacing / effectIntensity));
  const thickness = Math.max(
    1,
    Math.floor(scanlineThickness * effectIntensity)
  );
  const opacity = scanlineIntensity * effectIntensity;

  // Draw horizontal scanlines
  drawingContext.fillStyle = `rgba(0, 0, 0, ${opacity})`;

  for (let y = 0; y < height; y += spacing) {
    drawingContext.fillRect(0, y, width, thickness);
  }

  // Add subtle color distortion occasionally
  if (Math.random() < 0.05) {
    // Create temporary canvas with hue rotation
    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    let tempCtx = tempCanvas.getContext("2d");

    // Apply hue rotation
    tempCtx.filter = "hue-rotate(" + Math.random() * 10 + "deg)";
    tempCtx.drawImage(videoElement, 0, 0, width, height);

    // Draw with slight offset and reduced opacity
    drawingContext.globalAlpha = 0.3;
    drawingContext.drawImage(
      tempCanvas,
      Math.random() * 4 - 2,
      Math.random() * 2 - 1,
      width,
      height
    );
    drawingContext.globalAlpha = 1.0;
  }
}

// Direct Glitch Effect
function applyGlitchDirect() {
  // Draw base image
  drawingContext.drawImage(videoElement, 0, 0, width, height);

  // Randomize if we want a glitch frame
  if (Math.random() < glitchIntensity * effectIntensity) {
    // Create a temporary canvas
    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    let tempCtx = tempCanvas.getContext("2d");

    // Draw the video to the temp canvas
    tempCtx.drawImage(videoElement, 0, 0, width, height);

    // Create glitch slices
    const numSlices = 2 + Math.floor(Math.random() * 8);
    const sliceHeight = height / numSlices;

    for (let i = 0; i < numSlices; i++) {
      // Random offset for each slice
      const xOffset = (Math.random() * 40 - 20) * effectIntensity;
      const yPos = i * sliceHeight;

      // Clear the slice area
      drawingContext.clearRect(0, yPos, width, sliceHeight);

      // Draw the slice with offset
      drawingContext.drawImage(
        tempCanvas,
        0,
        yPos,
        width,
        sliceHeight,
        xOffset,
        yPos,
        width,
        sliceHeight
      );

      // Random color distortion for some slices
      if (Math.random() < 0.3) {
        // Create colored overlay
        drawingContext.globalCompositeOperation = "multiply";
        drawingContext.fillStyle = `rgba(${Math.random() * 255}, ${
          Math.random() * 255
        }, ${Math.random() * 255}, 0.5)`;
        drawingContext.fillRect(xOffset, yPos, width, sliceHeight);
        drawingContext.globalCompositeOperation = "source-over";
      }
    }
  }
}

// Direct Mirror Effect
function applyMirrorDirect() {
  // Create temporary canvas
  let tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  let tempCtx = tempCanvas.getContext("2d");

  // Draw the original video to temp canvas
  tempCtx.drawImage(videoElement, 0, 0, width, height);

  let ctx = drawingContext;

  switch (mirrorMode) {
    case 1: // Horizontal
      // Draw left half
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        width / 2,
        height, // Source
        0,
        0,
        width / 2,
        height
      ); // Destination

      // Draw mirrored right half
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        width / 2,
        height, // Source
        0,
        0,
        width / 2,
        height
      ); // Destination
      ctx.restore();
      break;

    case 2: // Vertical
      // Draw top half
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        width,
        height / 2, // Source
        0,
        0,
        width,
        height / 2
      ); // Destination

      // Draw mirrored bottom half
      ctx.save();
      ctx.translate(0, height);
      ctx.scale(1, -1);
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        width,
        height / 2, // Source
        0,
        0,
        width,
        height / 2
      ); // Destination
      ctx.restore();
      break;

    case 3: // Quad
      // Top-left quadrant original
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        width / 2,
        height / 2, // Source
        0,
        0,
        width / 2,
        height / 2
      ); // Destination

      // Top-right quadrant (mirror of top-left)
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        width / 2,
        height / 2, // Source
        0,
        0,
        width / 2,
        height / 2
      ); // Destination
      ctx.restore();

      // Bottom-left quadrant (mirror of top-left)
      ctx.save();
      ctx.translate(0, height);
      ctx.scale(1, -1);
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        width / 2,
        height / 2, // Source
        0,
        0,
        width / 2,
        height / 2
      ); // Destination
      ctx.restore();

      // Bottom-right quadrant (mirror of top-left)
      ctx.save();
      ctx.translate(width, height);
      ctx.scale(-1, -1);
      ctx.drawImage(
        tempCanvas,
        0,
        0,
        width / 2,
        height / 2, // Source
        0,
        0,
        width / 2,
        height / 2
      ); // Destination
      ctx.restore();
      break;

    default:
      // Default just show the video
      ctx.drawImage(tempCanvas, 0, 0);
  }
}

// Wave Distortion Effect
function applyWaveEffect() {
  // Create a temporary canvas to manipulate pixels
  let tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  let tempCtx = tempCanvas.getContext("2d");

  // Draw the video to the temp canvas
  tempCtx.drawImage(videoElement, 0, 0, width, height);

  // Get pixel data
  let imageData = tempCtx.getImageData(0, 0, width, height);
  let data = imageData.data;
  let result = tempCtx.createImageData(width, height);
  let resultData = result.data;

  // Update wave phase for animation
  wavePhase += waveSpeed * effectIntensity;

  // Apply wave distortion
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate wave offset
      let xOffset =
        Math.sin(y * waveFrequency + wavePhase) *
        waveAmplitude *
        effectIntensity;
      let yOffset =
        Math.sin(x * waveFrequency + wavePhase) *
        waveAmplitude *
        effectIntensity;

      // Calculate source and destination positions
      let sourceX = Math.floor(x + xOffset);
      let sourceY = Math.floor(y + yOffset);

      // Clamp values to prevent going outside bounds
      sourceX = Math.max(0, Math.min(width - 1, sourceX));
      sourceY = Math.max(0, Math.min(height - 1, sourceY));

      // Calculate array positions
      let destPos = (y * width + x) * 4;
      let sourcePos = (sourceY * width + sourceX) * 4;

      // Copy pixel data
      resultData[destPos] = data[sourcePos]; // R
      resultData[destPos + 1] = data[sourcePos + 1]; // G
      resultData[destPos + 2] = data[sourcePos + 2]; // B
      resultData[destPos + 3] = data[sourcePos + 3]; // A
    }
  }

  // Put the modified image data back
  tempCtx.putImageData(result, 0, 0);

  // Draw the result to the main canvas
  drawingContext.drawImage(tempCanvas, 0, 0);
}

// Slice Glitch Effect
function applySliceEffect() {
  // Create a temporary canvas to manipulate pixels
  let tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  let tempCtx = tempCanvas.getContext("2d");

  // Draw the video to the temp canvas
  tempCtx.drawImage(videoElement, 0, 0, width, height);

  // Update slice time for animation
  sliceTime += 0.01;

  // Randomly change slice direction occasionally
  if (Math.random() < 0.01) {
    sliceDirection = sliceDirection === 0 ? 1 : 0;
  }

  // Calculate number of slices based on intensity
  const numSlices = Math.floor(sliceCount * effectIntensity) + 5;

  // Calculate slice size
  const sliceSize =
    sliceDirection === 0 ? height / numSlices : width / numSlices;

  // Clear the canvas
  drawingContext.clearRect(0, 0, width, height);

  // Draw slices with offsets
  for (let i = 0; i < numSlices; i++) {
    // Calculate random offset for this slice using p5's noise function or fallback to Math.random
    let noiseValue;
    if (typeof noise === "function") {
      noiseValue = noise(i * 0.1, sliceTime);
    } else {
      // Fallback if p5's noise function isn't available
      noiseValue = Math.random() * 0.5 + 0.25; // Approximation to get 0.25-0.75 range
    }

    const offset = (noiseValue - 0.5) * sliceOffsetMax * effectIntensity;

    // Calculate source and destination rectangles
    let sx, sy, sw, sh, dx, dy, dw, dh;

    if (sliceDirection === 0) {
      // Horizontal slices
      sy = i * sliceSize;
      sh = sliceSize;
      sx = 0;
      sw = width;

      dy = sy;
      dh = sh;
      dx = offset;
      dw = width;
    } else {
      // Vertical slices
      sx = i * sliceSize;
      sw = sliceSize;
      sy = 0;
      sh = height;

      dx = sx;
      dw = sw;
      dy = offset;
      dh = height;
    }

    // Draw the slice
    drawingContext.drawImage(tempCanvas, sx, sy, sw, sh, dx, dy, dw, dh);

    // Occasionally add color shift to slices
    if (Math.random() < 0.1 * effectIntensity) {
      // Create colored overlay
      drawingContext.globalCompositeOperation = "multiply";
      drawingContext.fillStyle = `rgba(${Math.random() * 255}, ${
        Math.random() * 255
      }, ${Math.random() * 255}, 0.5)`;
      drawingContext.fillRect(dx, dy, dw, dh);
      drawingContext.globalCompositeOperation = "source-over";
    }
  }
}

// Kaleidoscope Effect
function applyKaleidoscopeEffect() {
  // Calculate center and radius
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2;

  // Determine number of segments based on intensity
  const segments = Math.max(
    3,
    Math.floor(kaleidoscopeSegments * effectIntensity)
  );
  const segmentAngle = (Math.PI * 2) / segments;

  // Create a temporary canvas for source
  let tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  let tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(videoElement, 0, 0, width, height);

  // Create a second canvas for full output
  let outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  let outputCtx = outputCanvas.getContext("2d");

  // Clear the output canvas
  outputCtx.clearRect(0, 0, width, height);

  // Draw each segment
  for (let i = 0; i < segments; i++) {
    // Calculate rotation angle for this segment
    const angle = i * segmentAngle;

    // Set up transformation
    outputCtx.save();
    outputCtx.translate(centerX, centerY);
    outputCtx.rotate(angle);

    // Create a triangular clipping path
    outputCtx.beginPath();
    outputCtx.moveTo(0, 0);
    outputCtx.lineTo(
      radius * Math.cos(-segmentAngle / 2),
      radius * Math.sin(-segmentAngle / 2)
    );
    outputCtx.lineTo(
      radius * Math.cos(segmentAngle / 2),
      radius * Math.sin(segmentAngle / 2)
    );
    outputCtx.closePath();
    outputCtx.clip();

    // Draw the source image
    outputCtx.translate(-centerX, -centerY);
    outputCtx.drawImage(tempCanvas, 0, 0);

    // Restore context
    outputCtx.restore();
  }

  // Draw to main canvas
  drawingContext.drawImage(outputCanvas, 0, 0);
}

// Bloom/Glow Effect
function applyBloomEffect() {
  try {
    // Create temporary canvases
    let baseCanvas = document.createElement("canvas");
    baseCanvas.width = width;
    baseCanvas.height = height;
    let baseCtx = baseCanvas.getContext("2d");

    let brightCanvas = document.createElement("canvas");
    brightCanvas.width = width;
    brightCanvas.height = height;
    let brightCtx = brightCanvas.getContext("2d");

    let blurCanvas = document.createElement("canvas");
    blurCanvas.width = width;
    blurCanvas.height = height;
    let blurCtx = blurCanvas.getContext("2d");

    // Draw the video to the base canvas
    baseCtx.drawImage(videoElement, 0, 0, width, height);

    // Extract bright areas
    let baseImageData = baseCtx.getImageData(0, 0, width, height);
    let brightImageData = brightCtx.createImageData(width, height);

    // Calculate threshold based on intensity
    const threshold = 255 * (1 - bloomThreshold * effectIntensity);

    // Extract bright pixels
    for (let i = 0; i < baseImageData.data.length; i += 4) {
      const r = baseImageData.data[i];
      const g = baseImageData.data[i + 1];
      const b = baseImageData.data[i + 2];

      // Calculate brightness (simple average)
      const brightness = (r + g + b) / 3;

      // If pixel is bright enough, keep it for the bloom
      if (brightness > threshold) {
        // Boost the brightness for more pronounced glow
        const factor = 1 + bloomIntensity * effectIntensity;
        brightImageData.data[i] = Math.min(255, r * factor);
        brightImageData.data[i + 1] = Math.min(255, g * factor);
        brightImageData.data[i + 2] = Math.min(255, b * factor);
        brightImageData.data[i + 3] = 255;
      } else {
        // Otherwise make it transparent
        brightImageData.data[i] = 0;
        brightImageData.data[i + 1] = 0;
        brightImageData.data[i + 2] = 0;
        brightImageData.data[i + 3] = 0;
      }
    }

    // Put the bright pixels onto the bright canvas
    brightCtx.putImageData(brightImageData, 0, 0);

    // Apply blur to the bright areas
    blurCtx.filter = `blur(${bloomRadius * effectIntensity}px)`;
    blurCtx.drawImage(brightCanvas, 0, 0);

    // Draw the base image to the main canvas
    drawingContext.drawImage(baseCanvas, 0, 0);

    // Overlay the blurred bright areas with screen blend mode
    drawingContext.globalCompositeOperation = "screen";
    drawingContext.drawImage(blurCanvas, 0, 0);
    drawingContext.globalCompositeOperation = "source-over";
  } catch (e) {
    console.error("Error in bloom effect:", e);
    // Fallback to just drawing the video
    drawingContext.drawImage(videoElement, 0, 0, width, height);
  }
}

// Handle keyboard controls
function handleKeyDown(e) {
  // Only process if video is loaded
  if (!videoElement && e.key !== "w" && e.key !== "W") return;

  switch (e.key) {
    case "w":
    case "W":
      // Toggle webcam
      if (isUsingWebcam) {
        updateStatusBar("Stopping webcam. Please upload a video.");
        // If using webcam, stop the stream
        if (videoElement && videoElement.srcObject) {
          const tracks = videoElement.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
          videoElement.srcObject = null;
          isUsingWebcam = false;
          isPlaying = false;
        }
      } else {
        startWebcam();
      }
      break;
    case "+":
    case "=":
      // Increase effect intensity
      effectIntensity = min(1.0, effectIntensity + 0.1);
      updateStatusBar(
        `Effect intensity: ${Math.round(effectIntensity * 100)}%`
      );
      updateIntensitySlider();
      break;
    case "-":
    case "_":
      // Decrease effect intensity
      effectIntensity = max(0.1, effectIntensity - 0.1);
      updateStatusBar(
        `Effect intensity: ${Math.round(effectIntensity * 100)}%`
      );
      updateIntensitySlider();
      break;
    case "p":
    case "P":
      // Play/Pause toggle
      if (!videoElement || videoElement.readyState < 2) return;

      if (isPlaying) {
        videoElement.pause();
        isPlaying = false;
        updateStatusBar("Paused");
      } else {
        videoElement.play();
        isPlaying = true;
        updateStatusBar("Playing");
      }
      break;
    case " ":
      // If no video is playing, do nothing
      if (!videoElement || videoElement.readyState < 2) return;

      // Cycle to next effect when space is pressed
      cycleToNextEffect();
      break;
    case "r":
    case "R":
      // Toggle recording
      toggleRecording();
      break;
  }
}

// Cycle to the next effect in the list
function cycleToNextEffect() {
  const effects = [
    "none",
    "rgb_shift",
    "ghost",
    "bloom",
    "pixelate",
    "vhs",
    "noise",
    "invert",
    "wave",
    "slice",
    "kaleidoscope",
    "scanlines",
    "glitch",
    "mirror",
  ];

  // Find the current effect index
  let currentIndex = effects.indexOf(currentEffect || "none");

  // Move to the next effect
  currentIndex = (currentIndex + 1) % effects.length;

  // Set the new effect
  const newEffect = effects[currentIndex];

  // Update the dropdown
  const dropdown = document.getElementById("effect-dropdown");
  if (dropdown) dropdown.value = newEffect;

  // Toggle the effect
  if (newEffect === "none") {
    // Disable all effects
    if (currentEffect) {
      currentEffect = null;
      updateStatusBar("Effects disabled");
    }
  } else {
    // Enable the new effect
    currentEffect = newEffect;
    updateStatusBar(`Effect activated: ${newEffect.replace("_", " ")}`);
  }

  // Update parameter sliders
  updateParameterSliders(currentEffect);
}

// Update parameter sliders based on the selected effect
function updateParameterSliders(effect = currentEffect) {
  const parameterContainer = document.getElementById("parameter-sliders");
  if (!parameterContainer) return;

  // Clear existing sliders
  parameterContainer.innerHTML = "";

  // Hide container if no effect is selected
  if (!effect) {
    parameterContainer.style.display = "none";
    return;
  }

  parameterContainer.style.display = "block";

  // Define parameters for each effect
  const parameters = {
    rgb_shift: [
      {
        id: "rgb-shift-amount",
        label: "Shift Amount",
        min: 0,
        max: 50,
        value: rgbShiftAmount,
        update: (val) => (rgbShiftAmount = val),
      },
    ],
    ghost: [
      {
        id: "ghost-alpha",
        label: "Ghost Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        value: ghostAlpha,
        update: (val) => (ghostAlpha = val),
      },
    ],
    bloom: [
      {
        id: "bloom-threshold",
        label: "Brightness Threshold",
        min: 0,
        max: 1,
        step: 0.01,
        value: bloomThreshold,
        update: (val) => (bloomThreshold = val),
      },
      {
        id: "bloom-radius",
        label: "Bloom Radius",
        min: 1,
        max: 30,
        value: bloomRadius,
        update: (val) => (bloomRadius = val),
      },
      {
        id: "bloom-intensity",
        label: "Bloom Intensity",
        min: 0,
        max: 3,
        step: 0.1,
        value: bloomIntensity,
        update: (val) => (bloomIntensity = val),
      },
    ],
    pixelate: [
      {
        id: "pixel-size",
        label: "Pixel Size",
        min: 1,
        max: 50,
        value: pixelSize,
        update: (val) => (pixelSize = val),
      },
    ],
    vhs: [
      {
        id: "vhs-intensity",
        label: "VHS Distortion",
        min: 0,
        max: 1,
        step: 0.01,
        value: vhsIntensity,
        update: (val) => (vhsIntensity = val),
      },
    ],
    noise: [
      {
        id: "noise-amount",
        label: "Noise Amount",
        min: 0,
        max: 1,
        step: 0.01,
        value: noiseAmount,
        update: (val) => (noiseAmount = val),
      },
    ],
    wave: [
      {
        id: "wave-amplitude",
        label: "Wave Amplitude",
        min: 0,
        max: 50,
        value: waveAmplitude,
        update: (val) => (waveAmplitude = val),
      },
      {
        id: "wave-frequency",
        label: "Wave Frequency",
        min: 0.01,
        max: 0.2,
        step: 0.01,
        value: waveFrequency,
        update: (val) => (waveFrequency = val),
      },
      {
        id: "wave-speed",
        label: "Wave Speed",
        min: 0,
        max: 0.5,
        step: 0.01,
        value: waveSpeed,
        update: (val) => (waveSpeed = val),
      },
    ],
    slice: [
      {
        id: "slice-count",
        label: "Slice Count",
        min: 2,
        max: 50,
        value: sliceCount,
        update: (val) => (sliceCount = val),
      },
      {
        id: "slice-offset",
        label: "Slice Offset",
        min: 0,
        max: 100,
        value: sliceOffsetMax,
        update: (val) => (sliceOffsetMax = val),
      },
    ],
    kaleidoscope: [
      {
        id: "kaleidoscope-segments",
        label: "Segments",
        min: 2,
        max: 20,
        value: kaleidoscopeSegments,
        update: (val) => (kaleidoscopeSegments = val),
      },
    ],
    scanlines: [
      {
        id: "scanline-spacing",
        label: "Scanline Spacing",
        min: 1,
        max: 20,
        value: scanlineSpacing,
        update: (val) => (scanlineSpacing = val),
      },
      {
        id: "scanline-thickness",
        label: "Scanline Thickness",
        min: 1,
        max: 10,
        value: scanlineThickness,
        update: (val) => (scanlineThickness = val),
      },
      {
        id: "scanline-intensity",
        label: "Scanline Intensity",
        min: 0,
        max: 1,
        step: 0.01,
        value: scanlineIntensity,
        update: (val) => (scanlineIntensity = val),
      },
    ],
    glitch: [
      {
        id: "glitch-intensity",
        label: "Glitch Frequency",
        min: 0,
        max: 1,
        step: 0.01,
        value: glitchIntensity,
        update: (val) => (glitchIntensity = val),
      },
    ],
    mirror: [
      {
        id: "mirror-mode",
        label: "Mirror Mode",
        min: 0,
        max: 3,
        step: 1,
        value: mirrorMode,
        update: (val) => (mirrorMode = val),
        valueLabelFunc: (val) =>
          ["None", "Horizontal", "Vertical", "Quad"][val],
      },
    ],
  };

  // Create sliders for the selected effect
  if (parameters[effect]) {
    const effectParams = parameters[effect];
    effectParams.forEach((param) => {
      const container = document.createElement("div");
      container.style.marginBottom = "10px";

      const label = document.createElement("label");
      label.for = param.id;
      label.textContent =
        param.label +
        ": " +
        (param.valueLabelFunc
          ? param.valueLabelFunc(param.value)
          : param.value);
      label.style.cssText = "display: block; margin-bottom: 5px;";

      const slider = document.createElement("input");
      slider.type = "range";
      slider.id = param.id;
      slider.min = param.min.toString();
      slider.max = param.max.toString();
      slider.step = param.step ? param.step.toString() : "1";
      slider.value = param.value.toString();
      slider.style.cssText = "width: 100%; background: #333;";

      slider.addEventListener("input", function () {
        const newValue = parseFloat(this.value);
        param.update(newValue);
        label.textContent =
          param.label +
          ": " +
          (param.valueLabelFunc ? param.valueLabelFunc(newValue) : newValue);
      });

      container.appendChild(label);
      container.appendChild(slider);
      parameterContainer.appendChild(container);
    });
  }
}

// Update intensity slider
function updateIntensitySlider() {
  const intensitySlider = document.getElementById("intensity-slider");
  if (intensitySlider) {
    intensitySlider.value = effectIntensity;

    // Update the intensity display
    const intensityValue = document.getElementById("intensity-value");
    if (intensityValue) {
      intensityValue.textContent = Math.round(effectIntensity * 100) + "%";
    }
  }
}

// Update status bar with message
function updateStatusBar(message) {
  const statusBar = document.getElementById("status-bar");
  if (statusBar) {
    statusBar.textContent = message;
  }
}

// Recording functions
function toggleRecording() {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
}

function startRecording() {
  if (!canvas) return;

  const recordBtn = document.getElementById("record-button");
  recordedChunks = [];
  isRecording = true;

  // Update button
  recordBtn.textContent = "■ STOP";
  recordBtn.style.backgroundColor = "#ff0000";

  // Capture the canvas stream at 60fps
  const stream = canvas.elt.captureStream(60);

  // Try to use MP4 container format directly when supported
  const mimeTypes = [
    "video/mp4;codecs=h264",
    "video/mp4",
    "video/webm;codecs=h264",
    "video/webm",
  ];

  // Find the first supported MIME type with much higher bitrate for better quality
  let options = {
    videoBitsPerSecond: 8000000, // 8 Mbps for higher quality
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
    // Show recording status
    updateStatusBar(`Recording started (${supportedMimeType})`);
  } catch (e) {
    console.error("Exception while creating MediaRecorder:", e);
    try {
      // Fallback to default options but still try for higher quality
      mediaRecorder = new MediaRecorder(stream, {
        videoBitsPerSecond: 5000000,
      });
      updateStatusBar("Recording started (medium quality)");
    } catch (e) {
      try {
        // Last resort - use default settings
        mediaRecorder = new MediaRecorder(stream);
        updateStatusBar("Recording started (standard quality)");
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
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;

    // Update button
    const recordBtn = document.getElementById("record-button");
    recordBtn.textContent = "Record HD";
    recordBtn.style.backgroundColor = "#ff0066";

    updateStatusBar("Recording finished - saving video...");
  }
}

function saveVideo() {
  if (recordedChunks.length === 0) {
    console.error("No data recorded!");
    return;
  }

  // Determine file extension based on MIME type
  let fileExtension = "mp4";
  let mimeType = "video/mp4";

  if (mediaRecorder.mimeType && mediaRecorder.mimeType.includes("webm")) {
    fileExtension = "webm";
    mimeType = "video/webm";
  }

  // Create a blob from the recorded chunks
  const blob = new Blob(recordedChunks, {
    type: mimeType,
  });

  // Create a URL for the blob
  const url = URL.createObjectURL(blob);

  // Create a download link
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";
  a.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.download = `video-distortion-${timestamp}.${fileExtension}`;

  // Trigger the download
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    updateStatusBar("Video saved successfully!");
  }, 100);
}

// Initialize p5.js
new p5();
