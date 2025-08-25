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

    // Create delay and reverb effects
    delay = new p5.Delay();
    reverb = new p5.Reverb();

    // Set initial delay and reverb settings
    delay.delayTime(0.5);
    delay.feedback(0.3);
    reverb.set(0.5, 0.8, 0.5);

    // Set initial values
    updateAudioSettings();

    // Initialize display values
    setTimeout(() => {
      updateAudioSettings();
    }, 100);

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

  // Update delay and reverb effects
  if (delay) {
    delay.delayTime(delayAmount * 0.8); // 0 to 0.8 seconds
    delay.feedback(delayAmount * 0.6); // 0 to 0.6 feedback
  }

  if (reverb) {
    reverb.set(reverbAmount * 0.8, reverbAmount * 0.9, reverbAmount * 0.5);
  }

  // Update status display
  const volumeElement = document.getElementById("current-volume");
  if (volumeElement) {
    volumeElement.textContent = Math.round(masterVolume * 100) + "%";
  }

  // Update effects display
  const reverbElement = document.getElementById("current-reverb");
  if (reverbElement) {
    reverbElement.textContent = Math.round(reverbAmount * 100) + "%";
  }

  const delayElement = document.getElementById("current-delay");
  if (delayElement) {
    delayElement.textContent = Math.round(delayAmount * 100) + "%";
  }
}

// Clear all background audio effects
function clearBackgroundAudio() {
  // Stop all oscillators that might be running in background
  if (synth && synth.isPlaying()) {
    synth.stop();
  }
  if (piano && piano.isPlaying()) {
    piano.stop();
  }
  if (bass && bass.isPlaying()) {
    bass.stop();
  }

  // Clear any lingering oscillators from finger effects
  window.activeOscillators = window.activeOscillators || [];
  window.activeOscillators.forEach((osc) => {
    if (osc && osc.stop) {
      try {
        osc.stop();
      } catch (e) {
        // Ignore errors
      }
    }
  });
  window.activeOscillators = [];
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

    // Process individual finger movements for noise
    processIndividualFingers(hand, isRightHand);

    // Process hand movements for modulation
    processHandModulation(hand, isRightHand);

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

// Process individual finger movements for different noise types
function processIndividualFingers(hand, isRightHand) {
  try {
    const wrist = hand[0];
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const middleTip = hand[12];
    const ringTip = hand[16];
    const pinkyTip = hand[20];

    // We'll check finger extension directly instead of relative positions

    // Check if fingers are actually extended (not just present)
    // We'll use the distance between finger tip and finger base to detect extension

    // THUMB: Check if thumb is extended away from palm
    const thumbBase = hand[3];
    const thumbExtension = Math.sqrt(
      Math.pow(thumbTip.x - thumbBase.x, 2) +
        Math.pow(thumbTip.y - thumbBase.y, 2)
    );

    if (isRightHand) {
      // Right hand thumb creates white noise when extended
      if (thumbExtension > 0.03) {
        // Must be significantly extended
        const noise = new p5.Oscillator("sawtooth");
        noise.amp(thumbExtension * 0.4);
        noise.freq(100 + thumbExtension * 400);
        noise.start();
        setTimeout(() => noise.stop(), 200);

        window.activeOscillators = window.activeOscillators || [];
        window.activeOscillators.push(noise);
      }
    } else {
      // Left hand thumb creates bass rumble when extended
      if (thumbExtension > 0.03) {
        const rumble = new p5.Oscillator("square");
        rumble.amp(thumbExtension * 0.4);
        rumble.freq(40 + thumbExtension * 100);
        rumble.start();
        setTimeout(() => rumble.stop(), 400);

        window.activeOscillators = window.activeOscillators || [];
        window.activeOscillators.push(rumble);
      }
    }

    // INDEX FINGER: Check if index is extended
    const indexBase = hand[6];
    const indexExtension = Math.sqrt(
      Math.pow(indexTip.x - indexBase.x, 2) +
        Math.pow(indexTip.y - indexBase.y, 2)
    );

    if (indexExtension > 0.03) {
      if (isRightHand) {
        // Right hand index creates harmonic noise when extended
        const harmonic = new p5.Oscillator("triangle");
        harmonic.amp(indexExtension * 0.3);
        harmonic.freq(200 + indexExtension * 600);
        harmonic.start();
        setTimeout(() => harmonic.stop(), 250);

        window.activeOscillators = window.activeOscillators || [];
        window.activeOscillators.push(harmonic);
      } else {
        // Left hand index creates click/pop noise when extended
        const click = new p5.Oscillator("sawtooth");
        click.amp(indexExtension * 0.3);
        click.freq(500 + indexExtension * 1000);
        click.start();
        setTimeout(() => click.stop(), 80);

        window.activeOscillators = window.activeOscillators || [];
        window.activeOscillators.push(click);
      }
    }

    // MIDDLE FINGER: Check if middle is extended
    const middleBase = hand[10];
    const middleExtension = Math.sqrt(
      Math.pow(middleTip.x - middleBase.x, 2) +
        Math.pow(middleTip.y - middleBase.y, 2)
    );

    if (middleExtension > 0.03) {
      if (isRightHand) {
        // Right hand middle creates metallic noise when extended
        const metallic = new p5.Oscillator("square");
        metallic.amp(middleExtension * 0.25);
        metallic.freq(300 + middleExtension * 800);
        metallic.start();
        setTimeout(() => metallic.stop(), 180);

        window.activeOscillators = window.activeOscillators || [];
        window.activeOscillators.push(metallic);
      } else {
        // Left hand middle creates hi-hat noise when extended
        const hihat = new p5.Oscillator("triangle");
        hihat.amp(middleExtension * 0.2);
        hihat.freq(1000 + middleExtension * 2000);
        hihat.start();
        setTimeout(() => hihat.stop(), 100);

        window.activeOscillators = window.activeOscillators || [];
        window.activeOscillators.push(hihat);
      }
    }

    // RING FINGER: Check if ring is extended
    const ringBase = hand[14];
    const ringExtension = Math.sqrt(
      Math.pow(ringTip.x - ringBase.x, 2) + Math.pow(ringTip.y - ringBase.y, 2)
    );

    if (ringExtension > 0.03) {
      if (isRightHand) {
        // Right hand ring creates wind noise when extended
        const wind = new p5.Oscillator("sine");
        wind.amp(ringExtension * 0.15);
        wind.freq(50 + ringExtension * 200);
        wind.start();
        setTimeout(() => wind.stop(), 300);

        window.activeOscillators = window.activeOscillators || [];
        window.activeOscillators.push(wind);
      } else {
        // Left hand ring creates snare noise when extended
        const snare = new p5.Oscillator("sawtooth");
        snare.amp(ringExtension * 0.35);
        snare.freq(200 + ringExtension * 400);
        snare.start();
        setTimeout(() => snare.stop(), 150);

        window.activeOscillators = window.activeOscillators || [];
        window.activeOscillators.push(snare);
      }
    }

    // PINKY FINGER: Check if pinky is extended
    const pinkyBase = hand[18];
    const pinkyExtension = Math.sqrt(
      Math.pow(pinkyTip.x - pinkyBase.x, 2) +
        Math.pow(pinkyTip.y - pinkyBase.y, 2)
    );

    if (pinkyExtension > 0.03) {
      if (isRightHand) {
        // Right hand pinky creates digital glitch noise when extended
        const glitch = new p5.Oscillator("sawtooth");
        glitch.amp(pinkyExtension * 0.35);
        glitch.freq(800 + pinkyExtension * 1200);
        glitch.start();
        setTimeout(() => glitch.stop(), 120);

        window.activeOscillators = window.activeOscillators || [];
        window.activeOscillators.push(glitch);
      } else {
        // Left hand pinky creates cymbal noise when extended
        const cymbal = new p5.Oscillator("sine");
        cymbal.amp(pinkyExtension * 0.25);
        cymbal.freq(1500 + pinkyExtension * 3000);
        cymbal.start();
        setTimeout(() => cymbal.stop(), 200);

        window.activeOscillators = window.activeOscillators || [];
        window.activeOscillators.push(cymbal);
      }
    }
  } catch (error) {
    console.error("Error processing individual fingers:", error);
  }
}

// Process hand movements for modulation effects
function processHandModulation(hand, isRightHand) {
  try {
    const wrist = hand[0];
    const palm = hand[9]; // Middle finger base

    if (!wrist || !palm) return;

    // Calculate hand movement patterns
    const handX = wrist.x;
    const handY = wrist.y;
    const palmX = palm.x;
    const palmY = palm.y;

    if (isRightHand) {
      // Right hand controls melodic modulation
      // X position controls pitch bend
      const pitchBend = (handX - 0.5) * 2; // -1 to 1
      if (synth && synth.isPlaying()) {
        synth.freq(baseFreq * Math.pow(2, pitchBend * 0.5));
      }

      // Y position controls vibrato
      const vibratoAmount = (handY - 0.5) * 2;
      if (vibratoAmount > 0.1 && synth && synth.isPlaying()) {
        const vibrato = Math.sin(Date.now() * 0.003) * vibratoAmount * 0.2;
        synth.freq(baseFreq * (1 + vibrato));
      }
    } else {
      // Left hand controls rhythmic modulation
      // X position controls delay time
      const delayTime = handX * 0.8; // 0 to 0.8 seconds
      if (delay && delayAmount > 0.1) {
        delay.delayTime(delayTime);
      }

      // Y position controls reverb amount
      const reverbAmount = handY;
      if (reverb && reverbAmount > 0.1) {
        reverb.set(reverbAmount * 0.8, reverbAmount * 0.9, reverbAmount * 0.5);
      }
    }
  } catch (error) {
    console.error("Error processing hand modulation:", error);
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

      // Apply delay and reverb effects if they exist
      if (delay && delayAmount > 0.1) {
        delay.process(instrument, delayAmount * 0.8);
      }

      if (reverb && reverbAmount > 0.1) {
        reverb.process(instrument, reverbAmount * 0.8);
      }

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

        // Route to organism controller if available
        if (window.ecosystem && window.ecosystem.processHandInput) {
          window.ecosystem.processHandInput(hand, isRightHand);
        } else {
          // Fallback to classic system
          playNoteFromHand(hand, isRightHand);
        }
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

  // Set up clear audio button
  const clearAudioBtn = document.getElementById("clear-audio-btn");
  if (clearAudioBtn) {
    clearAudioBtn.addEventListener("click", function () {
      console.log("Clear audio button clicked");
      clearBackgroundAudio();
      console.log("Background audio cleared");
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
