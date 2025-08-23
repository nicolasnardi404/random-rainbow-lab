// // Body Music Effects - Additional audio and visual enhancements
// // This file extends the functionality of body-music.html

// class BodyMusicEffects {
//   constructor() {
//     this.audioContext = null;
//     this.oscillators = [];
//     this.filters = [];
//     this.reverb = null;
//     this.compressor = null;
//     this.analyser = null;
//     this.dataArray = null;
//     this.isInitialized = false;

//     // Effect parameters
//     this.effects = {
//       reverb: { wet: 0.3, decay: 2.0, preDelay: 0.1 },
//       filter: { frequency: 2000, q: 1.0, type: "lowpass" },
//       compression: { threshold: -24, ratio: 12, attack: 0.003, release: 0.25 },
//       distortion: { amount: 0.8, oversample: "2x" },
//     };

//     this.init();
//   }

//   async init() {
//     try {
//       // Initialize Web Audio API
//       this.audioContext = new (window.AudioContext ||
//         window.webkitAudioContext)();

//       // Create audio nodes
//       this.createAudioNodes();

//       // Create analyser for visualization
//       this.analyser = this.audioContext.createAnalyser();
//       this.analyser.fftSize = 256;
//       this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

//       // Connect analyser
//       this.analyser.connect(this.audioContext.destination);

//       this.isInitialized = true;
//       console.log("Body Music Effects initialized successfully");
//     } catch (error) {
//       console.error("Failed to initialize Body Music Effects:", error);
//     }
//   }

//   createAudioNodes() {
//     // Create compressor
//     this.compressor = this.audioContext.createDynamicsCompressor();
//     this.compressor.threshold.value = this.effects.compression.threshold;
//     this.compressor.ratio.value = this.effects.compression.ratio;
//     this.compressor.attack.value = this.effects.compression.attack;
//     this.compressor.release.value = this.effects.compression.release;

//     // Create reverb (simple delay-based)
//     this.reverb = this.audioContext.createDelay(2.0);
//     this.reverb.delayTime.value = this.effects.reverb.decay;

//     // Create filters
//     this.filters.push(this.audioContext.createBiquadFilter());
//     this.filters.push(this.audioContext.createBiquadFilter());
//     this.filters.push(this.audioContext.createBiquadFilter());

//     // Configure filters
//     this.filters[0].type = "lowpass";
//     this.filters[0].frequency.value = this.effects.filter.frequency;
//     this.filters[0].Q.value = this.effects.filter.q;

//     this.filters[1].type = "highpass";
//     this.filters[1].frequency.value = 200;
//     this.filters[1].Q.value = 0.5;

//     this.filters[2].type = "notch";
//     this.filters[2].frequency.value = 1000;
//     this.filters[2].Q.value = 10;

//     // Connect nodes
//     this.compressor.connect(this.reverb);
//     this.reverb.connect(this.filters[0]);
//     this.filters[0].connect(this.filters[1]);
//     this.filters[1].connect(this.filters[2]);
//     this.filters[2].connect(this.analyser);
//   }

//   // Create oscillator based on body movement
//   createMovementOscillator(movementData, type = "sine") {
//     if (!this.isInitialized) return null;

//     const oscillator = this.audioContext.createOscillator();
//     const gainNode = this.audioContext.createGain();

//     // Calculate frequency based on movement
//     const baseFreq = 110; // A2
//     const freqRange = 880; // Up to A5
//     const movementIntensity = this.calculateMovementIntensity(movementData);
//     const frequency = baseFreq + movementIntensity * freqRange;

//     // Set oscillator properties
//     oscillator.type = type;
//     oscillator.frequency.setValueAtTime(
//       frequency,
//       this.audioContext.currentTime
//     );

//     // Set gain based on movement
//     const gain = Math.min(movementIntensity * 0.5, 0.5);
//     gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);

//     // Connect to audio chain
//     oscillator.connect(gainNode);
//     gainNode.connect(this.compressor);

//     // Store reference
//     this.oscillators.push({
//       oscillator,
//       gainNode,
//       startTime: this.audioContext.currentTime,
//     });

//     // Start oscillator
//     oscillator.start();

//     // Stop after a short duration to prevent buildup
//     setTimeout(() => {
//       oscillator.stop();
//       this.oscillators = this.oscillators.filter(
//         (osc) => osc.oscillator !== oscillator
//       );
//     }, 200);

//     return { oscillator, gainNode, frequency, gain };
//   }

//   // Calculate movement intensity from pose data
//   calculateMovementIntensity(movementData) {
//     if (!movementData) return 0;

//     let totalMovement = 0;
//     const keys = ["leftHand", "rightHand", "leftFoot", "rightFoot", "head"];

//     keys.forEach((key) => {
//       if (movementData[key] && movementData[key].x !== undefined) {
//         totalMovement +=
//           Math.abs(movementData[key].x) + Math.abs(movementData[key].y);
//       }
//     });

//     // Normalize to 0-1 range
//     return Math.min(totalMovement / keys.length, 1.0);
//   }

//   // Create harmonic series based on body position
//   createHarmonicSeries(movementData, baseNote = 220) {
//     if (!this.isInitialized) return;

//     const harmonics = [1, 2, 3, 5, 8]; // Fibonacci-like harmonic series
//     const movementIntensity = this.calculateMovementIntensity(movementData);

//     harmonics.forEach((harmonic, index) => {
//       const oscillator = this.audioContext.createOscillator();
//       const gainNode = this.audioContext.createGain();

//       const frequency = baseNote * harmonic;
//       const gain = (movementIntensity * 0.3) / (index + 1); // Higher harmonics are quieter

//       oscillator.type = "sine";
//       oscillator.frequency.setValueAtTime(
//         frequency,
//         this.audioContext.currentTime
//       );
//       gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime);

//       oscillator.connect(gainNode);
//       gainNode.connect(this.compressor);

//       oscillator.start();

//       // Stop after duration
//       setTimeout(() => {
//         oscillator.stop();
//       }, 300);
//     });
//   }

//   // Create noise-based effects
//   createNoiseEffect(movementData, type = "white") {
//     if (!this.isInitialized) return null;

//     const bufferSize = this.audioContext.sampleRate * 0.1; // 100ms buffer
//     const buffer = this.audioContext.createBuffer(
//       1,
//       bufferSize,
//       this.audioContext.sampleRate
//     );
//     const output = buffer.getChannelData(0);

//     // Generate noise
//     for (let i = 0; i < bufferSize; i++) {
//       switch (type) {
//         case "white":
//           output[i] = Math.random() * 2 - 1;
//           break;
//         case "pink":
//           output[i] = this.generatePinkNoise();
//           break;
//         case "brown":
//           output[i] = this.generateBrownNoise();
//           break;
//       }
//     }

//     const noiseSource = this.audioContext.createBufferSource();
//     const gainNode = this.audioContext.createGain();
//     const filter = this.audioContext.createBiquadFilter();

//     noiseSource.buffer = buffer;
//     gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
//     filter.type = "bandpass";
//     filter.frequency.setValueAtTime(
//       500 + this.calculateMovementIntensity(movementData) * 2000,
//       this.audioContext.currentTime
//     );
//     filter.Q.value = 1.0;

//     noiseSource.connect(gainNode);
//     gainNode.connect(filter);
//     filter.connect(this.compressor);

//     noiseSource.start();

//     // Loop the noise
//     noiseSource.loop = true;

//     // Stop after a while
//     setTimeout(() => {
//       noiseSource.stop();
//     }, 1000);

//     return { noiseSource, gainNode, filter };
//   }

//   // Generate pink noise (1/f noise)
//   generatePinkNoise() {
//     // Simple pink noise approximation
//     return (
//       (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 0.5
//     );
//   }

//   // Generate brown noise (1/f² noise)
//   generateBrownNoise() {
//     // Simple brown noise approximation
//     return (
//       (Math.random() +
//         Math.random() +
//         Math.random() +
//         Math.random() +
//         Math.random() -
//         2.5) *
//       0.4
//     );
//   }

//   // Create beat/rhythm based on movement
//   createRhythmPattern(movementData) {
//     if (!this.isInitialized) return;

//     const movementIntensity = this.calculateMovementIntensity(movementData);
//     const tempo = 60 + movementIntensity * 120; // 60-180 BPM
//     const beatInterval = 60000 / tempo; // Convert BPM to milliseconds

//     // Create kick drum sound
//     const createKick = () => {
//       const oscillator = this.audioContext.createOscillator();
//       const gainNode = this.audioContext.createGain();

//       oscillator.type = "sine";
//       oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
//       oscillator.frequency.exponentialRampToValueAtTime(
//         0.01,
//         this.audioContext.currentTime + 0.1
//       );

//       gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
//       gainNode.gain.exponentialRampToValueAtTime(
//         0.01,
//         this.audioContext.currentTime + 0.1
//       );

//       oscillator.connect(gainNode);
//       gainNode.connect(this.compressor);

//       oscillator.start();
//       oscillator.stop(this.audioContext.currentTime + 0.1);
//     };

//     // Create hi-hat sound
//     const createHiHat = () => {
//       const oscillator = this.audioContext.createOscillator();
//       const gainNode = this.audioContext.createGain();
//       const filter = this.audioContext.createBiquadFilter();

//       oscillator.type = "square";
//       oscillator.frequency.setValueAtTime(8000, this.audioContext.currentTime);

//       gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
//       gainNode.gain.exponentialRampToValueAtTime(
//         0.01,
//         this.audioContext.currentTime + 0.05
//       );

//       filter.type = "highpass";
//       filter.frequency.setValueAtTime(8000, this.audioContext.currentTime);

//       oscillator.connect(gainNode);
//       gainNode.connect(filter);
//       filter.connect(this.compressor);

//       oscillator.start();
//       oscillator.stop(this.audioContext.currentTime + 0.05);
//     };

//     // Start rhythm pattern
//     let beatCount = 0;
//     const rhythmInterval = setInterval(() => {
//       if (beatCount % 4 === 0) {
//         createKick(); // Kick on every 4th beat
//       }
//       if (beatCount % 2 === 1) {
//         createHiHat(); // Hi-hat on off-beats
//       }

//       beatCount++;

//       // Stop after 8 bars
//       if (beatCount >= 32) {
//         clearInterval(rhythmInterval);
//       }
//     }, beatInterval);
//   }

//   // Update effect parameters
//   updateEffectParameters(newParams) {
//     if (!this.isInitialized) return;

//     Object.keys(newParams).forEach((key) => {
//       if (this.effects[key]) {
//         this.effects[key] = { ...this.effects[key], ...newParams[key] };
//       }
//     });

//     // Apply new parameters
//     if (newParams.reverb) {
//       this.reverb.delayTime.value = this.effects.reverb.decay;
//     }

//     if (newParams.filter) {
//       this.filters[0].frequency.value = this.effects.filter.frequency;
//       this.filters[0].Q.value = this.effects.filter.q;
//     }

//     if (newParams.compression) {
//       this.compressor.threshold.value = this.effects.compression.threshold;
//       this.compressor.ratio.value = this.effects.compression.ratio;
//       this.compressor.attack.value = this.effects.compression.attack;
//       this.compressor.release.value = this.effects.compression.release;
//     }
//   }

//   // Get frequency data for visualization
//   getFrequencyData() {
//     if (!this.analyser) return null;

//     this.analyser.getByteFrequencyData(this.dataArray);
//     return Array.from(this.dataArray);
//   }

//   // Clean up resources
//   dispose() {
//     if (this.oscillators.length > 0) {
//       this.oscillators.forEach((osc) => {
//         try {
//           osc.oscillator.stop();
//           osc.oscillator.disconnect();
//           osc.gainNode.disconnect();
//         } catch (e) {
//           // Oscillator might already be stopped
//         }
//       });
//       this.oscillators = [];
//     }

//     if (this.audioContext && this.audioContext.state !== "closed") {
//       this.audioContext.close();
//     }

//     this.isInitialized = false;
//   }
// }

// // Export for use in other files
// if (typeof module !== "undefined" && module.exports) {
//   module.exports = BodyMusicEffects;
// } else {
//   window.BodyMusicEffects = BodyMusicEffects;
// }

// // Auto-initialize if loaded directly
// if (typeof window !== "undefined" && !window.BodyMusicEffects) {
//   window.bodyMusicEffects = new BodyMusicEffects();
// }
