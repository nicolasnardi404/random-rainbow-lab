// Music synthesis setup
let synth, piano, bass, drums;
let reverb, delay;
let currentInstrument = "synth";
let currentMode = "melody";
let currentScale = "major";
let masterVolume = 0.7;
let reverbAmount = 0.3;
let delayAmount = 0.2;

// Hand tracking variables
let hands = [];
let lastNoteTime = 0;
let noteCooldown = 100; // milliseconds between notes

// Recording variables
let recordedNotes = [];
let isRecording = false;
let isPlaying = false;

// Scale definitions
const scales = {
  major: [0, 2, 4, 5, 7, 9, 11, 12], // C D E F G A B C
  minor: [0, 2, 3, 5, 7, 8, 10, 12], // A B C D E F G A
  pentatonic: [0, 2, 4, 7, 9, 12], // C D E G A C
  blues: [0, 3, 5, 6, 7, 10, 12], // C Eb F F# G Bb C
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

// Base frequencies for different octaves
const baseFreq = 261.63; // Middle C

// Initialize p5.sound
function initAudio() {
  try {
    console.log("Initializing p5.sound audio...");

    // Wait for p5.sound to be ready
    if (typeof p5 === "undefined") {
      console.error("p5.js not loaded");
      return;
    }

    if (typeof p5.Amplitude === "undefined") {
      console.error("p5.sound not loaded");
      return;
    }

    // Create instruments using p5.sound
    synth = new p5.Oscillator("sine");
    synth.amp(0.5);

    // Create a simple piano-like sound
    piano = new p5.Oscillator("triangle");
    piano.amp(0.4);

    // Create bass sound
    bass = new p5.Oscillator("square");
    bass.amp(0.3);

    // Set initial values
    updateAudioSettings();

    console.log("p5.sound audio initialized successfully");
    console.log("Instruments created:", { synth, piano, bass });

    // Test audio with a test beep
    setTimeout(() => {
      console.log("Testing audio with a test beep...");
      if (synth) {
        synth.freq(261.63); // Middle C
        synth.start();
        setTimeout(() => synth.stop(), 200);
        console.log("Test beep played successfully");
      } else {
        console.error("Synth not available for test");
      }
    }, 1000);
  } catch (error) {
    console.error("Error initializing audio:", error);
  }
}

// Update audio settings based on UI controls
function updateAudioSettings() {
  // Volume - update all instruments
  if (synth) synth.amp(masterVolume * 0.5);
  if (piano) piano.amp(masterVolume * 0.4);
  if (bass) bass.amp(masterVolume * 0.3);

  // Update status display
  const volumeElement = document.getElementById("current-volume");
  if (volumeElement) {
    volumeElement.textContent = Math.round(masterVolume * 100) + "%";
  }
}

// Play a note based on hand position
function playNoteFromHand(hand, isRightHand) {
  const now = Date.now();
  const timeSinceLastNote = now - lastNoteTime;

  if (timeSinceLastNote < noteCooldown) {
    return;
  }

  // Check if hand has landmarks and they're properly structured
  if (!hand || !Array.isArray(hand) || hand.length < 21) {
    return;
  }

  try {
    const wrist = hand[0];
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const middleTip = hand[12];
    const ringTip = hand[16];
    const pinkyTip = hand[20];

    // Check if landmark points exist and have x,y coordinates
    if (
      !wrist ||
      !thumbTip ||
      !indexTip ||
      !middleTip ||
      !ringTip ||
      !pinkyTip ||
      typeof wrist.x === "undefined" ||
      typeof wrist.y === "undefined" ||
      typeof thumbTip.x === "undefined" ||
      typeof thumbTip.y === "undefined" ||
      typeof indexTip.x === "undefined" ||
      typeof indexTip.y === "undefined" ||
      typeof middleTip.x === "undefined" ||
      typeof middleTip.y === "undefined" ||
      typeof ringTip.x === "undefined" ||
      typeof ringTip.y === "undefined" ||
      typeof pinkyTip.x === "undefined" ||
      typeof pinkyTip.y === "undefined"
    ) {
      return;
    }

    // Process individual finger movements
    processIndividualFingers(hand, isRightHand);

    // Calculate pinch distance between thumb tip and index tip
    const pinchDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2)
    );

    // Only play note if pinching (close enough) - made much more sensitive
    if (pinchDistance < 0.4) {
      window.lastPinchDetected = Date.now(); // Set timestamp for visual indicator
      let frequency, duration;

      if (isRightHand) {
        // Right hand controls pitch and note length
        const pitchY = wrist.y;
        const noteLengthX = wrist.x;

        // Map Y position to pitch (scale notes)
        const scaleIndex = Math.floor(pitchY * scales[currentScale].length);
        const note =
          scales[currentScale][
            Math.min(scaleIndex, scales[currentScale].length - 1)
          ];
        frequency = baseFreq * Math.pow(2, note / 12);

        // Map X position to note length
        const durationMap = [0.25, 0.5, 1, 2, 4]; // quarter, half, whole, etc.
        const durationIndex = Math.floor(noteLengthX * durationMap.length);
        duration = durationMap[Math.min(durationIndex, durationMap.length - 1)];

        // Play the note
        playNote(frequency, duration);
      } else {
        // Left hand controls volume and effects
        const volumeY = wrist.y;
        const effectsX = wrist.x;

        // Update volume based on Y position
        masterVolume = 1 - volumeY;
        masterVolume = Math.max(0.1, Math.min(1, masterVolume));

        // Update effects based on X position
        const reverbAmount = effectsX;
        const delayAmount = 1 - effectsX;

        // Apply volume and effects using p5.sound
        updateAudioSettings();

        // Update reverb and delay amounts for UI
        window.reverbAmount = reverbAmount;
        window.delayAmount = delayAmount;
      }

      lastNoteTime = now;
    }
  } catch (error) {
    console.error("Error in playNoteFromHand:", error);
  }
}

// Process individual finger movements for different effects
function processIndividualFingers(hand, isRightHand) {
  try {
    const wrist = hand[0];
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const middleTip = hand[12];
    const ringTip = hand[16];
    const pinkyTip = hand[20];

    // Calculate finger positions relative to wrist
    const thumbRelative = {
      x: thumbTip.x - wrist.x,
      y: thumbTip.y - wrist.y,
    };
    const indexRelative = {
      x: indexTip.x - wrist.x,
      y: indexTip.y - wrist.y,
    };
    const middleRelative = {
      x: middleTip.x - wrist.x,
      y: middleTip.y - wrist.y,
    };
    const ringRelative = {
      x: ringTip.x - wrist.x,
      y: ringTip.y - wrist.y,
    };
    const pinkyRelative = {
      x: pinkyTip.x - wrist.x,
      y: pinkyTip.y - wrist.y,
    };

    // THUMB: Add audio distortion based on position
    if (isRightHand) {
      // Right hand thumb adds pitch distortion
      const thumbDistance = Math.sqrt(
        thumbRelative.x * thumbRelative.x + thumbRelative.y * thumbRelative.y
      );
      if (thumbDistance > 0.1) {
        // Add pitch bend based on thumb position
        const pitchBend = (thumbRelative.x + 0.5) * 2 - 1; // -1 to 1
        if (synth) {
          synth.freq(baseFreq * Math.pow(2, pitchBend * 0.5));
        }
        if (piano) {
          piano.freq(baseFreq * Math.pow(2, pitchBend * 0.5));
        }
        if (bass) {
          bass.freq(baseFreq * Math.pow(2, pitchBend * 0.5));
        }
      }
    } else {
      // Left hand thumb adds frequency modulation
      const thumbDistance = Math.sqrt(
        thumbRelative.x * thumbRelative.x + thumbRelative.y * thumbRelative.y
      );
      if (thumbDistance > 0.05) {
        const modFreq = thumbDistance * 10; // 0-10 Hz modulation
        if (synth) {
          // Add vibrato effect
          const vibrato = Math.sin(Date.now() * 0.001 * modFreq) * 0.1;
          synth.freq(baseFreq * (1 + vibrato));
        }
      }
    }

    // INDEX FINGER: Add audio effects based on position
    const indexDistance = Math.sqrt(
      indexRelative.x * indexRelative.x + indexRelative.y * indexRelative.y
    );
    if (indexDistance > 0.1) {
      if (isRightHand) {
        // Right hand index adds harmonic distortion
        const harmonicAmount = Math.min(1, indexDistance * 3);
        if (synth) {
          // Add overtones with random timing
          const overtone = new p5.Oscillator("sine");
          overtone.amp(harmonicAmount * 0.3);
          overtone.freq(baseFreq * (2 + Math.random() * 0.5)); // Slightly random harmonic
          overtone.start();
          setTimeout(() => overtone.stop(), 150 + Math.random() * 100); // Random duration
        }
      } else {
        // Left hand index adds random noise bursts
        if (Math.random() < 0.3) {
          // Only 30% chance to avoid constant noise
          const noise = new p5.Oscillator("sawtooth");
          noise.amp(indexDistance * 0.2);
          noise.freq(200 + Math.random() * 400);
          noise.start();
          setTimeout(() => noise.stop(), 50 + Math.random() * 100);
        }
      }
    }

    // MIDDLE FINGER: Add audio modulation effects
    const middleDistance = Math.sqrt(
      middleRelative.x * middleRelative.x + middleRelative.y * middleRelative.y
    );
    if (middleDistance > 0.1) {
      if (isRightHand) {
        // Right hand middle adds amplitude modulation
        const ampMod = Math.sin(Date.now() * 0.002) * middleDistance * 0.5;
        if (synth) {
          synth.amp(Math.max(0.1, 0.5 + ampMod));
        }
        if (piano) {
          piano.amp(Math.max(0.1, 0.4 + ampMod));
        }
        if (bass) {
          bass.amp(Math.max(0.1, 0.3 + ampMod));
        }
      } else {
        // Left hand middle adds delay effect
        const delayAmount = Math.min(1, middleDistance * 2);
        if (synth && synth.isPlaying()) {
          setTimeout(() => {
            if (synth) {
              const delay = new p5.Oscillator("sine");
              delay.amp(delayAmount * 0.3);
              delay.freq(synth.freq());
              delay.start();
              setTimeout(() => delay.stop(), 400);
            }
          }, 200);
        }
      }
    }

    // RING FINGER: Add audio filter effects
    const ringDistance = Math.sqrt(
      ringRelative.x * ringRelative.x + ringRelative.y * ringRelative.y
    );
    if (ringDistance > 0.1) {
      if (isRightHand) {
        // Right hand ring adds filter sweep
        const filterFreq = ringDistance * 2000; // 0-2000 Hz filter
        if (synth) {
          // Simulate low-pass filter effect
          const filterAmount = Math.sin(Date.now() * 0.001) * 0.3;
          synth.amp(Math.max(0.1, 0.5 - filterAmount));
        }
      } else {
        // Left hand ring adds random frequency modulation
        const modAmount = ringDistance * 0.5;
        if (synth && synth.isPlaying()) {
          const randomFreq = Math.sin(Date.now() * 0.001) * modAmount;
          synth.freq(baseFreq * (1 + randomFreq));
        }
      }
    }

    // PINKY FINGER: Add special audio effects
    const pinkyDistance = Math.sqrt(
      pinkyRelative.x * pinkyRelative.x + pinkyRelative.y * pinkyRelative.y
    );
    if (pinkyDistance > 0.1) {
      if (isRightHand) {
        // Right hand pinky adds frequency sweep
        const sweepFreq = pinkyDistance * 1000; // 0-1000 Hz sweep
        if (synth) {
          const sweep = Math.sin(Date.now() * 0.001 * sweepFreq) * 0.2;
          synth.freq(baseFreq * (1 + sweep));
        }
      } else {
        // Left hand pinky adds noise burst
        if (pinkyDistance > 0.15) {
          const noise = new p5.Oscillator("sawtooth");
          noise.amp(0.2);
          noise.freq(100 + Math.random() * 200);
          noise.start();
          setTimeout(() => noise.stop(), 100);
        }
      }
    }
  } catch (error) {
    console.error("Error processing individual fingers:", error);
  }
}

// Play a note with the current instrument using p5.sound
function playNote(frequency, duration) {
  try {
    console.log(
      `🎵 Playing note: ${frequency}Hz, duration: ${duration}s, instrument: ${currentInstrument}`
    );

    let instrument;
    switch (currentInstrument) {
      case "synth":
        instrument = synth;
        break;
      case "piano":
        instrument = piano;
        break;
      case "bass":
        instrument = bass;
        break;
      case "drums":
        playDrumPattern(frequency);
        return;
      default:
        console.error("Unknown instrument:", currentInstrument);
        return;
    }

    if (instrument) {
      // Set frequency and start the oscillator
      instrument.freq(frequency);
      instrument.start();

      // Stop after the specified duration
      setTimeout(() => {
        instrument.stop();
      }, duration * 1000);

      console.log(`🎵 Note played successfully with ${currentInstrument}`);
    } else {
      console.error(`${currentInstrument} not initialized`);
    }
  } catch (error) {
    console.error("Error in playNote:", error);
  }
}

// Play drum pattern
function playDrumPattern(frequency) {
  const kick = new Tone.Player(
    "https://tonejs.github.io/audio/drum-machine/kick.mp3"
  ).toDestination();
  const snare = new Tone.Player(
    "https://tonejs.github.io/audio/drum-machine/snare.mp3"
  ).toDestination();
  const hihat = new Tone.Player(
    "https://tonejs.github.io/audio/drum-machine/hihat.mp3"
  ).toDestination();

  // Simple drum pattern
  kick.start();
  setTimeout(() => snare.start(), 200);
  setTimeout(() => hihat.start(), 100);
  setTimeout(() => hihat.start(), 300);
}

// Handle hand landmarks from MediaPipe
function processHandLandmarks(results) {
  try {
    if (!results || !results.multiHandLandmarks) {
      return;
    }

    hands = results.multiHandLandmarks;

    const handsCountElement = document.getElementById("hands-count");
    if (handsCountElement) {
      handsCountElement.textContent = hands.length;
    }

    // Process each hand
    hands.forEach((hand, index) => {
      try {
        // Validate hand data structure
        if (!hand || !Array.isArray(hand) || hand.length < 21) {
          return null;
        }

        const isRightHand = index === 0; // Assume first hand is right
        playNoteFromHand(hand, isRightHand);
      } catch (handError) {
        console.error(`Error processing hand ${index}:`, handError);
      }
    });

    // Update hand visualization
    drawHandLandmarks(results);
  } catch (error) {
    console.error("Error in processHandLandmarks:", error);
  }
}

// Draw hand landmarks on canvas
function drawHandLandmarks(results) {
  const canvas = document.getElementById("hand-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results || !results.multiHandLandmarks) return;

  // Set drawing styles
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ff00ff";
  ctx.fillStyle = "#00ffff";

  // Draw each detected hand
  results.multiHandLandmarks.forEach((landmarks, handIndex) => {
    // Draw dots for all landmarks
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;

      // Draw a dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();

      // Special highlight for key points
      if (index === 0 || index === 4 || index === 8) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.strokeStyle =
          index === 0 ? "#ffff00" : index === 4 ? "#ff00ff" : "#00ffff";
        ctx.stroke();
      }
    });

    // Draw hand skeleton
    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4], // Thumb
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8], // Index
      [0, 9],
      [9, 10],
      [10, 11],
      [11, 12], // Middle
      [0, 13],
      [13, 14],
      [14, 15],
      [15, 16], // Ring
      [0, 17],
      [17, 18],
      [18, 19],
      [19, 20], // Pinky
      [0, 5],
      [5, 9],
      [9, 13],
      [13, 17], // Palm
    ];

    connections.forEach((connection) => {
      const [i, j] = connection;
      const start = landmarks[i];
      const end = landmarks[j];

      ctx.beginPath();
      ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
      ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
      ctx.strokeStyle = "#00ffff";
      ctx.stroke();
    });
  });
}

// Set up UI controls
function setupUIControls() {
  // Scale selector
  const scaleSelector = document.getElementById("scale-selector");
  if (scaleSelector) {
    scaleSelector.addEventListener("change", function () {
      currentScale = this.value;
      const currentScaleElement = document.getElementById("current-scale");
      if (currentScaleElement) {
        currentScaleElement.textContent = this.options[this.selectedIndex].text;
      }
    });
  }

  // Volume and effects sliders
  const masterVolumeSlider = document.getElementById("master-volume");
  if (masterVolumeSlider) {
    masterVolumeSlider.addEventListener("input", function () {
      masterVolume = this.value / 100;
      updateAudioSettings();
    });
  }

  const reverbSlider = document.getElementById("reverb-amount");
  if (reverbSlider) {
    reverbSlider.addEventListener("input", function () {
      reverbAmount = this.value / 100;
      updateAudioSettings();
    });
  }

  const delaySlider = document.getElementById("delay-amount");
  if (delaySlider) {
    delaySlider.addEventListener("input", function () {
      delayAmount = this.value / 100;
      updateAudioSettings();
    });
  }

  // Instrument buttons
  document
    .querySelectorAll("#synth-btn, #piano-btn, #bass-btn, #drums-btn")
    .forEach((btn) => {
      btn.addEventListener("click", function () {
        document
          .querySelectorAll("#synth-btn, #piano-btn, #bass-btn, #drums-btn")
          .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        currentInstrument = this.id.replace("-btn", "");
      });
    });

  // Mode buttons
  document
    .querySelectorAll("#melody-mode, #chord-mode, #rhythm-mode")
    .forEach((btn) => {
      btn.addEventListener("click", function () {
        document
          .querySelectorAll("#melody-mode, #chord-mode, #rhythm-mode")
          .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        currentMode = this.id.replace("-mode", "");
        const currentModeElement = document.getElementById("current-mode");
        if (currentModeElement) {
          currentModeElement.textContent =
            currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
        }
      });
    });

  // Recording buttons
  const recordBtn = document.getElementById("record-btn");
  if (recordBtn) {
    recordBtn.addEventListener("click", function () {
      if (!isRecording) {
        isRecording = true;
        recordedNotes = [];
        this.textContent = "⏹ Stop";
        this.style.background = "linear-gradient(45deg, #ff0000, #ff6666)";
      } else {
        isRecording = false;
        this.textContent = "⏺ Record";
        this.style.background = "linear-gradient(45deg, #ff00ff, #00ffff)";
      }
    });
  }

  const playBtn = document.getElementById("play-btn");
  if (playBtn) {
    playBtn.addEventListener("click", function () {
      if (recordedNotes.length > 0 && !isPlaying) {
        playRecordedNotes();
      }
    });
  }

  const clearBtn = document.getElementById("clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      recordedNotes = [];
      isRecording = false;
      const recordBtn = document.getElementById("record-btn");
      if (recordBtn) {
        recordBtn.textContent = "⏺ Record";
        recordBtn.style.background = "linear-gradient(45deg, #ff00ff, #00ffff)";
      }
    });
  }

  // Set up test audio button
  const testAudioBtn = document.getElementById("test-audio-btn");
  if (testAudioBtn) {
    testAudioBtn.addEventListener("click", function () {
      console.log("Test audio button clicked");
      if (synth) {
        console.log("Playing test sound with synth");
        synth.freq(261.63); // Middle C
        synth.start();
        setTimeout(() => synth.stop(), 500);
      } else {
        console.error("Synth not available for testing");
        alert(
          "Audio not initialized. Please wait for the application to fully load."
        );
      }
    });
  }
}

// Set up video toggle
function setupVideoToggle() {
  const videoToggle = document.getElementById("video-toggle");
  const videoContainer = document.getElementById("video-container");

  if (videoToggle && videoContainer) {
    videoToggle.addEventListener("click", function () {
      if (videoContainer.style.display === "none") {
        videoContainer.style.display = "block";
        videoToggle.textContent = "Hide";
      } else {
        videoContainer.style.display = "none";
        videoToggle.textContent = "Show";
      }
    });
  }
}

// Set up instructions toggle
function setupInstructionsToggle() {
  const toggleBtn = document.getElementById("toggle-instructions");
  const instructions = document.getElementById("instructions");
  const instructionsIcon = document.getElementById("instructions-icon");

  console.log("Setting up instructions toggle:", {
    toggleBtn,
    instructions,
    instructionsIcon,
  });

  if (toggleBtn && instructions) {
    console.log("Instructions toggle elements found, adding event listeners");

    // Handle toggle button click
    toggleBtn.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevent event from bubbling to instructions panel
      console.log(
        "Toggle button clicked, current state:",
        instructions.classList.contains("collapsed")
      );

      if (instructions.classList.contains("collapsed")) {
        // Expand
        instructions.classList.remove("collapsed");
        toggleBtn.textContent = "Hide";
        console.log("Instructions expanded");
      } else {
        // Collapse
        instructions.classList.add("collapsed");
        toggleBtn.textContent = "Show";
        console.log("Instructions collapsed");
      }
    });

    // Handle clicking on collapsed panel
    instructions.addEventListener("click", function (e) {
      if (this.classList.contains("collapsed")) {
        this.classList.remove("collapsed");
        toggleBtn.textContent = "Hide";
        console.log("Instructions expanded by clicking panel");
      }
    });

    console.log("Instructions toggle setup complete");
  } else {
    console.error("Could not find instructions toggle elements:", {
      toggleBtn,
      instructions,
    });
  }
}

// Initialize hand tracking
function initHandTracking() {
  console.log("Initializing hand tracking...");

  // Wait for MediaPipe to be fully loaded
  setTimeout(() => {
    try {
      // Check if MediaPipe is available
      if (typeof Hands === "undefined") {
        console.error(
          "MediaPipe Hands not loaded. Please check your internet connection."
        );
        console.log(
          "Available global objects:",
          Object.keys(window).filter(
            (key) =>
              key.toLowerCase().includes("hand") ||
              key.toLowerCase().includes("camera")
          )
        );

        // If MediaPipe is not available, try to set up camera anyway
        console.log("MediaPipe not available, trying direct camera setup...");
        setupDirectCamera();
        return;
      }

      console.log("MediaPipe Hands loaded successfully");

      const hands = new Hands({
        locateFile: (file) => {
          console.log("Loading MediaPipe file:", file);
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
        },
      });

      console.log("Hands object created:", hands);

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      console.log("Hands options set");

      hands.onResults(processHandLandmarks);

      console.log("Results handler set");

      // Set up camera with getUserMedia fallback
      setupCamera(hands);
    } catch (error) {
      console.error("Error initializing hand tracking:", error);
      console.log("Error details:", error.message, error.stack);

      // If MediaPipe fails, try direct camera setup
      console.log("MediaPipe failed, trying direct camera setup...");
      setupDirectCamera();
    }
  }, 1000); // Wait 1 second for MediaPipe to load
}

// Direct camera setup without MediaPipe (for testing)
function setupDirectCamera() {
  console.log("Setting up direct camera access...");

  const videoElement = document.getElementById("video");
  if (!videoElement) {
    console.error("Video element not found");
    return;
  }

  // Request camera access directly
  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: 640,
        height: 480,
        facingMode: "user",
      },
    })
    .then((stream) => {
      console.log("Direct camera access granted");
      videoElement.srcObject = stream;
      videoElement.play();

      // Set up canvas
      const canvas = document.getElementById("hand-canvas");
      if (canvas) {
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
      }

      // Add success message to status
      const statusIndicator = document.getElementById("status-indicator");
      if (statusIndicator) {
        const cameraStatus = document.createElement("div");
        cameraStatus.className = "status-item";
        cameraStatus.innerHTML =
          '<span>Camera:</span><span class="status-value" style="color: #00ff00;">ON (Direct)</span>';
        statusIndicator.appendChild(cameraStatus);
      }
    })
    .catch((error) => {
      console.error("Direct camera access failed:", error);

      // Show error in status
      const statusIndicator = document.getElementById("status-indicator");
      if (statusIndicator) {
        const cameraStatus = document.createElement("div");
        cameraStatus.className = "status-item";
        cameraStatus.innerHTML =
          '<span>Camera:</span><span class="status-value" style="color: #ff0000;">ERROR</span>';
        statusIndicator.appendChild(cameraStatus);
      }
    });
}

// Set up camera with fallback methods
function setupCamera(hands) {
  console.log("Setting up camera...");

  const videoElement = document.getElementById("video");
  if (!videoElement) {
    console.error("Video element not found");
    return;
  }

  // Try MediaPipe Camera first
  if (typeof Camera !== "undefined") {
    console.log("Using MediaPipe Camera");
    try {
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          try {
            await hands.send({ image: videoElement });
          } catch (error) {
            console.error("Error processing frame:", error);
          }
        },
        width: 640,
        height: 480,
      });

      console.log("MediaPipe Camera object created:", camera);

      camera
        .start()
        .then(() => {
          console.log("MediaPipe Camera started successfully");
        })
        .catch((error) => {
          console.error(
            "MediaPipe Camera failed, trying getUserMedia fallback:",
            error
          );
          setupUserMediaCamera(hands);
        });
    } catch (error) {
      console.error("Error creating MediaPipe Camera:", error);
      setupUserMediaCamera(hands);
    }
  } else {
    console.log("MediaPipe Camera not available, using getUserMedia fallback");
    setupUserMediaCamera(hands);
  }
}

// Fallback camera setup using getUserMedia
function setupUserMediaCamera(hands) {
  console.log("Setting up getUserMedia camera...");

  const videoElement = document.getElementById("video");

  // Request camera access
  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: 640,
        height: 480,
        facingMode: "user",
      },
    })
    .then((stream) => {
      console.log("Camera access granted");
      videoElement.srcObject = stream;

      // Wait for video to be ready
      videoElement.onloadedmetadata = () => {
        console.log("Video metadata loaded");
        videoElement.play();

        // Set up canvas for hand tracking
        const canvas = document.getElementById("hand-canvas");
        if (canvas) {
          canvas.width = videoElement.videoWidth || 640;
          canvas.height = videoElement.videoHeight || 480;
          console.log("Canvas set to:", canvas.width, "x", canvas.height);
        }

        // Start processing frames
        processVideoFrame(hands, videoElement);

        // Add success message to status
        const statusIndicator = document.getElementById("status-indicator");
        if (statusIndicator) {
          const cameraStatus = document.createElement("div");
          cameraStatus.className = "status-item";
          cameraStatus.innerHTML =
            '<span>Camera:</span><span class="status-value" style="color: #00ff00;">ON</span>';
          statusIndicator.appendChild(cameraStatus);
        }

        console.log("Camera setup complete - video is playing");
      };
    })
    .catch((error) => {
      console.error("Camera access denied:", error);
      alert(
        "Camera access is required for hand tracking. Please allow camera access and refresh the page."
      );

      // Show error in status
      const statusIndicator = document.getElementById("status-indicator");
      if (statusIndicator) {
        const cameraStatus = document.createElement("div");
        cameraStatus.className = "status-item";
        cameraStatus.innerHTML =
          '<span>Camera:</span><span class="status-value" style="color: #ff0000;">ERROR</span>';
        statusIndicator.appendChild(cameraStatus);
      }
    });
}

// Process video frames for hand tracking
function processVideoFrame(hands, videoElement) {
  console.log("Starting frame processing...");

  const processFrame = async () => {
    try {
      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        // Add a visual indicator that frames are being processed
        const canvas = document.getElementById("hand-canvas");
        if (canvas) {
          const ctx = canvas.getContext("2d");
          // Draw a small indicator dot to show processing is active
          ctx.fillStyle = "#00ff00";
          ctx.beginPath();
          ctx.arc(10, 10, 3, 0, 2 * Math.PI);
          ctx.fill();

          // Add pinch detection indicator
          if (
            window.lastPinchDetected &&
            Date.now() - window.lastPinchDetected < 500
          ) {
            ctx.fillStyle = "#ff0000";
            ctx.beginPath();
            ctx.arc(30, 10, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "12px Arial";
            ctx.fillText("PINCH!", 45, 15);
          }
        }

        await hands.send({ image: videoElement });
      }
    } catch (error) {
      console.error("Error processing frame:", error);
    }

    // Continue processing frames
    requestAnimationFrame(processFrame);
  };

  // Start processing
  processFrame();
}

// Play recorded notes
function playRecordedNotes() {
  if (recordedNotes.length === 0) return;

  isPlaying = true;
  const playBtn = document.getElementById("play-btn");
  if (playBtn) {
    playBtn.textContent = "⏸ Pause";
  }

  let currentTime = 0;
  recordedNotes.forEach((note, index) => {
    setTimeout(() => {
      playNote(note.frequency, note.duration);

      if (index === recordedNotes.length - 1) {
        isPlaying = false;
        if (playBtn) {
          playBtn.textContent = "▶️ Play";
        }
      }
    }, currentTime);

    currentTime += note.duration * 1000;
  });
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing body music application...");
  console.log("Waiting for user interaction to start audio and camera...");

  // Set up the start audio button
  const startAudioBtn = document.getElementById("start-audio-btn");
  const audioStartOverlay = document.getElementById("audio-start-overlay");

  if (startAudioBtn && audioStartOverlay) {
    startAudioBtn.addEventListener("click", function () {
      console.log(
        "User clicked start button, initializing audio and camera..."
      );

      // Hide the overlay
      audioStartOverlay.style.display = "none";

      // Start the application
      startApplication();
    });
  } else {
    console.error("Start audio button not found, starting automatically...");
    startApplication();
  }
});

// Start the application after user interaction
function startApplication() {
  console.log("Starting application...");

  // Initialize audio
  initAudio();

  // Set up UI controls
  setupUIControls();

  // Set up video toggle
  setupVideoToggle();

  // Set up instructions toggle
  setupInstructionsToggle();

  // Initialize hand tracking (this will request camera permission)
  console.log(
    "About to initialize hand tracking and request camera permission..."
  );
  initHandTracking();

  console.log("Body music application initialized successfully");
}

// Handle window resize for canvas
window.addEventListener("resize", function () {
  const videoContainer = document.getElementById("video-container");
  const handCanvas = document.getElementById("hand-canvas");

  if (videoContainer && handCanvas) {
    const videoRect = videoContainer.getBoundingClientRect();
    handCanvas.width = videoRect.width;
    handCanvas.height = videoRect.height;
  }
});
