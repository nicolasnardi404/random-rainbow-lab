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

// Browser audio recording system
let isRecording = false;
let isPlaying = false;
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob = null;

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

// Initialize p5.sound and Web Audio API recording
function initAudio() {
  try {
    console.log("Initializing audio system...");

    // Check for p5.sound
    if (typeof p5 === "undefined" || typeof p5.Amplitude === "undefined") {
      console.error("p5.sound not available");
      return;
    }

    // Create audio context for recording
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    window.mainAudioContext = audioContext;

    // Create a main gain node for recording
    const mainGain = audioContext.createGain();
    mainGain.gain.value = 1.0;
    mainGain.connect(audioContext.destination);
    window.mainGain = mainGain;

    // Create instruments using p5.sound
    synth = new p5.Oscillator("sine");
    synth.amp(0.5);
    synth.disconnect(); // Disconnect from p5's output
    synth.connect(mainGain); // Connect to our gain node

    piano = new p5.Oscillator("triangle");
    piano.amp(0.4);
    piano.disconnect();
    piano.connect(mainGain);

    bass = new p5.Oscillator("square");
    bass.amp(0.3);
    bass.disconnect();
    bass.connect(mainGain);

    // Create effects
    delay = new p5.Delay();
    reverb = new p5.Reverb();

    // Configure effects
    delay.delayTime(0.5);
    delay.feedback(0.3);
    delay.disconnect();
    delay.connect(mainGain);

    reverb.set(0.5, 0.8, 0.5);
    reverb.disconnect();
    reverb.connect(mainGain);

    // Initialize the recorder
    initSoundRecorder();

    // Set initial values
    updateAudioSettings();

    // Initialize display values
    setTimeout(() => {
      updateAudioSettings();
      updateRecordingButtonStates();
    }, 100);

    console.log("Audio system initialized successfully");
    console.log("Instruments created and connected to recording system");
  } catch (error) {
    console.error("Error in initAudio:", error);
  }
}

// Initialize browser audio recording
async function initSoundRecorder() {
  try {
    console.log("Setting up audio recording...");

    // Get p5's audio context
    const audioContext = p5.prototype.getAudioContext();
    if (!audioContext) {
      throw new Error("No audio context available");
    }

    // Create a gain node to mix all audio
    const recordingGain = audioContext.createGain();
    recordingGain.gain.value = 1.0;

    // Connect p5's master output to our recording gain
    if (p5.prototype.soundOut && p5.prototype.soundOut.output) {
      p5.prototype.soundOut.output.connect(recordingGain);
    }

    // Create a MediaStreamDestination to capture the audio
    const destination = audioContext.createMediaStreamDestination();
    recordingGain.connect(destination);

    // Also connect to the main output so we can hear it
    recordingGain.connect(audioContext.destination);

    // Store the recording system globally
    window.recordingSystem = {
      gain: recordingGain,
      destination: destination,
    };

    // First check what MIME types are supported
    const mimeTypes = [
      "audio/webm",
      "audio/webm;codecs=opus",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];

    let selectedMimeType = "";
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        console.log("Found supported MIME type:", type);
        break;
      }
    }

    if (!selectedMimeType) {
      throw new Error("No supported MIME types found");
    }

    // Create MediaRecorder with the audio stream from our destination
    mediaRecorder = new MediaRecorder(destination.stream, {
      mimeType: selectedMimeType,
      audioBitsPerSecond: 128000,
    });

    // Set up data collection
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      recordedAudioBlob = new Blob(audioChunks, { type: "audio/webm" });
      console.log("Recording completed, size:", recordedAudioBlob.size);
      updateRecordingStatus("✅ Recording complete!", "success");
      updateRecordingButtonStates();
    };

    console.log("System audio capture ready");
    updateRecordingStatus("Ready to record system audio", "info");
    updateRecordingButtonStates();

    console.log("Recording system initialized with direct audio capture");
    updateRecordingStatus("Ready to record", "info");
    updateRecordingButtonStates();
  } catch (error) {
    console.error("Error initializing audio recording:", error);
    updateRecordingStatus("❌ Audio recording failed", "error");
    updateRecordingButtonStates();
  }
}

// Connect all audio sources to the recorder
function connectAllAudioToRecorder(audioContext, destination) {
  try {
    console.log("🎵 Connecting audio sources to recorder...");

    // Store the destination globally so we can access it from anywhere
    window.recordingDestination = destination;

    // Create a gain node to mix all audio before recording
    const recordingGain = audioContext.createGain();
    recordingGain.connect(destination);
    window.recordingGain = recordingGain;

    console.log("🎵 Recording gain node created and connected");

    // We'll connect instruments dynamically when they play
  } catch (error) {
    console.error("Error connecting audio sources:", error);
  }
}

// Function to connect an instrument to the recorder when it plays
function connectInstrumentToRecorder(instrument, instrumentName) {
  try {
    // Get p5's audio context and master output
    const p5AudioContext = p5.prototype.getAudioContext();
    const p5SoundOut = p5.prototype.soundOut;

    if (!p5AudioContext || !p5SoundOut) {
      console.error("No p5 audio system available");
      return;
    }

    // Create or get our recording system
    if (!window.recordingSystem) {
      // Create a gain node for recording
      const recordingGain = p5AudioContext.createGain();
      recordingGain.gain.value = 1.0;

      // Create media stream destination
      const destination = p5AudioContext.createMediaStreamDestination();

      // Connect recording gain to both p5's master output and recording destination
      recordingGain.connect(p5SoundOut.input);
      recordingGain.connect(destination);

      // Initialize MediaRecorder
      const recorder = new MediaRecorder(destination.stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        recordedAudioBlob = new Blob(audioChunks, { type: "audio/webm" });
        console.log("Recording completed, size:", recordedAudioBlob.size);
        updateRecordingStatus("✅ Recording complete!", "success");
        updateRecordingButtonStates();
      };

      // Store our recording system
      window.recordingSystem = {
        gain: recordingGain,
        destination: destination,
        recorder: recorder,
      };

      // Update global mediaRecorder reference
      mediaRecorder = recorder;
    }

    if (instrument) {
      try {
        // For p5.js oscillators and effects
        if (instrument.output) {
          // Disconnect from current output
          instrument.output.disconnect();
          // Connect to our recording gain
          instrument.output.connect(window.recordingSystem.gain);
          console.log(`🎵 ${instrumentName} connected to recorder`);
        }
        // For raw Web Audio nodes
        else if (instrument.connect) {
          instrument.disconnect();
          instrument.connect(window.recordingSystem.gain);
          console.log(`🎵 ${instrumentName} connected to recorder`);
        }
      } catch (connectError) {
        console.error(`Error connecting ${instrumentName}:`, connectError);
        // Try alternate connection method for p5.sound objects
        try {
          instrument.disconnect();
          instrument.connect(window.recordingSystem.gain);
          console.log(`🎵 ${instrumentName} connected via alternate method`);
        } catch (altError) {
          console.error(
            `Alternate connection failed for ${instrumentName}:`,
            altError
          );
        }
      }
    }
  } catch (error) {
    console.error(`Could not connect ${instrumentName} to recorder:`, error);
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
  if (synth) {
    try {
      synth.stop();
    } catch (e) {
      // Ignore errors if oscillator is not playing
    }
  }
  if (piano) {
    try {
      piano.stop();
    } catch (e) {
      // Ignore errors if oscillator is not playing
    }
  }
  if (bass) {
    try {
      bass.stop();
    } catch (e) {
      // Ignore errors if oscillator is not playing
    }
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
        playNote(frequency, duration, "synth");
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
      if (synth) {
        // Update synth frequency for modulation
        const baseFreq = 261.63; // Middle C
        synth.freq(baseFreq * Math.pow(2, pitchBend * 0.5));
      }

      // Y position controls vibrato
      const vibratoAmount = (handY - 0.5) * 2;
      if (vibratoAmount > 0.1 && synth) {
        const vibrato = Math.sin(Date.now() * 0.003) * vibratoAmount * 0.2;
        const baseFreq = 261.63; // Middle C
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

// Play a note with the specified instrument
function playNote(frequency, duration, instrumentType) {
  try {
    let instrument;

    switch (instrumentType) {
      case "synth":
        instrument = synth;
        break;
      case "piano":
        instrument = piano;
        break;
      case "bass":
        instrument = bass;
        break;
      default:
        instrument = synth;
    }

    if (instrument) {
      // Get p5's audio context
      const p5AudioContext = p5.prototype.getAudioContext();
      if (!p5AudioContext) {
        console.error("No p5 audio context available");
        return false;
      }

      // Create a gain node for this note
      const noteGain = p5AudioContext.createGain();
      noteGain.gain.value = 1.0;

      // Connect to our recording system if available
      if (window.recordingSystem && window.recordingSystem.gain) {
        noteGain.connect(window.recordingSystem.gain);
      } else {
        // If no recording system, connect directly to output
        noteGain.connect(p5AudioContext.destination);
      }

      // Connect the instrument through our gain node
      if (instrument.output) {
        instrument.output.disconnect();
        instrument.output.connect(noteGain);
      } else if (instrument.connect) {
        instrument.disconnect();
        instrument.connect(noteGain);
      }

      // Set frequency and play
      instrument.freq(frequency);
      instrument.play();

      // Stop after duration
      setTimeout(() => {
        instrument.stop();
        // Clean up connections
        if (noteGain) {
          noteGain.disconnect();
        }
      }, duration * 1000);

      console.log(`🎵 Note played successfully with ${instrumentType}`);
      return true;
    } else {
      console.error(`Instrument ${instrumentType} not available`);
      return false;
    }
  } catch (error) {
    console.error(`Error playing note with ${instrumentType}:`, error);
    return false;
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

  // Recording control buttons
  const recordBtn = document.getElementById("record-btn");
  const stopBtn = document.getElementById("stop-btn");
  const playBtn = document.getElementById("play-btn");
  const downloadBtn = document.getElementById("download-btn");
  const clearBtn = document.getElementById("clear-btn");

  // Record button
  if (recordBtn) {
    recordBtn.addEventListener("click", async function () {
      console.log("Record button clicked");
      try {
        // Initialize recorder if not already done
        if (!mediaRecorder) {
          console.log("Initializing recorder...");
          await initSoundRecorder();
        }

        if (!isRecording && mediaRecorder) {
          console.log("Starting recording...");
          startAudioRecording();
        } else {
          console.log("Cannot start recording:", {
            isRecording,
            mediaRecorder: !!mediaRecorder,
          });
        }
      } catch (error) {
        console.error("Error in record button click:", error);
        updateRecordingStatus("❌ Recording failed: " + error.message, "error");
      }
    });
  }

  // Stop button
  if (stopBtn) {
    stopBtn.addEventListener("click", function () {
      if (isRecording) {
        stopAudioRecording();
      }
    });
  }

  // Play button
  if (playBtn) {
    playBtn.addEventListener("click", function () {
      if (recordedAudioBlob) {
        playRecordedAudio();
      } else {
        console.log("No recording available to play");
      }
    });
  }

  // Download button
  if (downloadBtn) {
    downloadBtn.addEventListener("click", function () {
      if (recordedAudioBlob) {
        downloadRecordedAudio();
      } else {
        console.log("No recording available to download");
      }
    });
  }

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      clearRecordedAudio();
    });
  }

  // Retry recorder button
  const retryRecorderBtn = document.getElementById("retry-recorder-btn");
  if (retryRecorderBtn) {
    retryRecorderBtn.addEventListener("click", function () {
      console.log("Manual retry of recorder initialization...");
      updateRecordingStatus("🔄 Retrying recorder...", "info");
      initSoundRecorder();
    });
  }

  // Test recording button
  const testRecordingBtn = document.getElementById("test-recording-btn");
  if (testRecordingBtn) {
    testRecordingBtn.addEventListener("click", function () {
      console.log("Testing recording system...");
      if (window.recordingDestination) {
        testAudioRouting(
          new (window.AudioContext || window.webkitAudioContext)(),
          window.recordingDestination
        );
        updateRecordingStatus("🎵 Test tone played", "info");
      } else {
        updateRecordingStatus("❌ Recording system not ready", "error");
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

// Set up keyboard shortcuts for recording
function setupRecordingShortcuts() {
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isRecording) {
      console.log("🚨 Escape key pressed, force stopping recording...");
      event.preventDefault();
      stopAudioRecording();
    }
  });

  console.log("🎵 Recording shortcuts set up (Press ESC to force stop)");
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

// Start recording
async function startAudioRecording() {
  try {
    console.log("Starting audio recording...");

    // Check if we need to initialize the recorder
    if (!mediaRecorder) {
      console.log("No mediaRecorder, initializing...");
      await initSoundRecorder();
    }

    if (!mediaRecorder) {
      throw new Error("Failed to initialize media recorder");
    }

    if (mediaRecorder.state === "recording") {
      console.log("Already recording");
      return false;
    }

    // Clear previous recording data
    audioChunks = [];
    recordedAudioBlob = null;

    // Start recording with 100ms chunks for better responsiveness
    console.log("Starting MediaRecorder...");
    mediaRecorder.start(100);
    isRecording = true;

    console.log("🎙️ Recording started successfully");

    // Update UI
    const recordBtn = document.getElementById("record-btn");
    const stopBtn = document.getElementById("stop-btn");
    if (recordBtn) recordBtn.style.display = "none";
    if (stopBtn) stopBtn.style.display = "inline-block";

    updateRecordingStatus("🔴 Recording in progress...", "recording");
    updateRecordingButtonStates();

    // Add test tone to verify recording is working
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.value = 0.1; // Low volume
    oscillator.frequency.value = 440; // A4 note

    oscillator.start();
    setTimeout(() => oscillator.stop(), 200); // Short beep

    return true;
  } catch (error) {
    console.error("Error starting recording:", error);
    updateRecordingStatus("❌ Recording failed: " + error.message, "error");
    return false;
  }
}

// Stop recording
function stopAudioRecording() {
  try {
    if (!mediaRecorder || mediaRecorder.state !== "recording") {
      console.error("No active recording to stop");
      return false;
    }

    console.log("Stopping recording...");
    mediaRecorder.stop();
    isRecording = false;

    // Update UI
    const recordBtn = document.getElementById("record-btn");
    const stopBtn = document.getElementById("stop-btn");
    if (recordBtn) recordBtn.style.display = "inline-block";
    if (stopBtn) stopBtn.style.display = "none";

    return true;
  } catch (error) {
    console.error("Error stopping recording:", error);
    return false;
  }
}

// Play recorded audio
function playRecordedAudio() {
  try {
    if (!recordedAudioBlob) {
      console.error("No recording available");
      return false;
    }

    const audioUrl = URL.createObjectURL(recordedAudioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      isPlaying = false;
      const playBtn = document.getElementById("play-btn");
      if (playBtn) playBtn.textContent = "▶️ Play";
    };

    audio.play();
    isPlaying = true;
    const playBtn = document.getElementById("play-btn");
    if (playBtn) playBtn.textContent = "⏸ Pause";

    return true;
  } catch (error) {
    console.error("Error playing recording:", error);
    return false;
  }
}

// Download recorded audio
function downloadRecordedAudio() {
  try {
    if (!recordedAudioBlob) {
      console.error("No recorded audio available for download");
      updateRecordingStatus("❌ No recording available", "error");
      return false;
    }

    // Determine file extension based on MIME type
    let fileExtension = "webm";
    if (recordedAudioBlob.type.includes("mp4")) {
      fileExtension = "mp4";
    } else if (recordedAudioBlob.type.includes("ogg")) {
      fileExtension = "ogg";
    }

    // Create download link
    const url = URL.createObjectURL(recordedAudioBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `body-music-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.${fileExtension}`;

    console.log(`Saving audio as ${fileExtension} file...`);

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 100);

    console.log("🎵 Audio file saved");
    updateRecordingStatus("✅ Audio file saved!", "success");
    return true;
  } catch (error) {
    console.error("Error saving audio:", error);
    updateRecordingStatus("❌ Save failed: " + error.message, "error");
    return false;
  }
}

// Clear recorded audio
function clearRecordedAudio() {
  try {
    audioChunks = [];
    recordedAudioBlob = null;
    isRecording = false;
    isPlaying = false;

    // Update UI
    const playBtn = document.getElementById("play-btn");
    if (playBtn) {
      playBtn.textContent = "▶️ Play";
      playBtn.disabled = true;
    }

    updateRecordingStatus("Ready to record", "info");
    updateRecordingButtonStates();

    return true;
  } catch (error) {
    console.error("Error clearing recording:", error);
    return false;
  }
}

// Check if recorder is ready
function isRecorderReady() {
  return mediaRecorder && typeof MediaRecorder !== "undefined";
}

// Update recording status display
function updateRecordingStatus(message, type = "info") {
  const statusElement = document.getElementById("recording-status");
  if (statusElement) {
    statusElement.textContent = message;

    // Set color based on type
    switch (type) {
      case "recording":
        statusElement.style.color = "#ff0000";
        break;
      case "success":
        statusElement.style.color = "#00ff00";
        break;
      case "error":
        statusElement.style.color = "#ff6666";
        break;
      default:
        statusElement.style.color = "#00ffff";
    }
  }
}

// Update button states based on recording status
function updateRecordingButtonStates() {
  const recordBtn = document.getElementById("record-btn");
  const playBtn = document.getElementById("play-btn");
  const downloadBtn = document.getElementById("download-btn");
  const clearBtn = document.getElementById("clear-btn");

  if (recordBtn) {
    // Enable record button if we can record
    recordBtn.disabled = isRecording;

    // Update button text based on recording capability
    if (isRecorderReady()) {
      recordBtn.textContent = "⏺ Record Audio";
    } else {
      recordBtn.textContent = "⏺ Record";
    }
  }

  if (playBtn) {
    // Enable play button if we have recorded content
    const hasAudioRecording = recordedAudioBlob && isRecorderReady();
    playBtn.disabled = !hasAudioRecording;
  }

  if (downloadBtn) {
    // Only enable download for audio recordings
    downloadBtn.disabled = !recordedAudioBlob || !isRecorderReady();
  }

  if (clearBtn) {
    // Enable clear if we have any recorded content
    const hasAudioRecording = recordedAudioBlob && isRecorderReady();
    clearBtn.disabled = !hasAudioRecording;
  }
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

  // Set up recording shortcuts
  setupRecordingShortcuts();

  console.log("Body music application initialized successfully");
}

// Create WAV blob from audio buffer
function createWavBlob(audioBuffer, sampleRate) {
  const numChannels = 1; // Mono
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = audioBuffer.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, "RIFF"); // RIFF identifier
  view.setUint32(4, 36 + dataSize, true); // File size
  writeString(view, 8, "WAVE"); // WAVE identifier
  writeString(view, 12, "fmt "); // Format chunk identifier
  view.setUint32(16, 16, true); // Format chunk length
  view.setUint16(20, 1, true); // Sample format (1 = PCM)
  view.setUint16(22, numChannels, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, byteRate, true); // Byte rate
  view.setUint16(32, blockAlign, true); // Block align
  view.setUint16(34, bitsPerSample, true); // Bits per sample
  writeString(view, 36, "data"); // Data chunk identifier
  view.setUint32(40, dataSize, true); // Data chunk length

  // Audio data
  const offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioBuffer[i]));
    view.setInt16(offset + i * bytesPerSample, sample * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

// Helper function to write strings to DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
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

// Test audio routing with a simple tone
function testAudioRouting(audioContext, destination) {
  try {
    console.log("🎵 Testing audio routing with test tone...");

    // Create a simple oscillator for testing
    const testOsc = audioContext.createOscillator();
    const testGain = audioContext.createGain();

    testOsc.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    testGain.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume

    testOsc.connect(testGain);
    testGain.connect(destination);

    // Play test tone for 1 second
    testOsc.start(audioContext.currentTime);
    testOsc.stop(audioContext.currentTime + 1);

    console.log("🎵 Test tone played through recording system");
  } catch (error) {
    console.error("Error testing audio routing:", error);
  }
}
