// PSYCHEDELIC DIMENSION SHIFTER
// A chaotic, fractal-based sound system that creates infinite variations and cosmic textures
// This organism lives in its own dimension, unrelated to traditional music theory

class PsychedelicDimensionShifter {
  constructor() {
    this.dimension = 0;
    this.fractalDepth = 3;
    this.cosmicChaos = 0.5;
    this.dimensionalLayers = [];
    this.quantumStates = [];
    this.chaosField = 0.3;
    this.dimensionShiftSpeed = 0.1;
    this.active = false;

    // Initialize quantum sound generators
    this.initQuantumGenerators();
  }

  initQuantumGenerators() {
    // Create multiple oscillators for dimensional layering
    this.dimensionalLayers = [];
    for (let i = 0; i < 8; i++) {
      const layer = {
        oscillator: new p5.Oscillator(this.getRandomWaveform()),
        filter: new p5.LowPass(),
        envelope: new p5.Envelope(),
        chaos: Math.random(),
        dimension: Math.random() * 2 - 1,
        phase: Math.random() * Math.PI * 2,
      };

      // Set up filter chain
      layer.oscillator.disconnect();
      layer.oscillator.connect(layer.filter);
      layer.filter.freq(200 + i * 100);
      layer.filter.res(2 + i * 0.5);

      this.dimensionalLayers.push(layer);
    }

    // Initialize quantum states for probability-based sound generation
    this.quantumStates = Array(16)
      .fill(0)
      .map(() => ({
        probability: Math.random(),
        superposition: Math.random() * Math.PI * 2,
        entanglement: Math.random(),
        collapse: false,
      }));
  }

  getRandomWaveform() {
    const waveforms = ["sine", "triangle", "square", "sawtooth"];
    return waveforms[Math.floor(Math.random() * waveforms.length)];
  }

  // Activate the psychedelic dimension
  activate() {
    console.log("🌈 ACTIVATING PSYCHEDELIC DIMENSION SHIFTER...");
    this.active = true;
    this.dimension = 0;
    this.shiftDimension();

    // Start the dimensional animation loop
    this.startDimensionalLoop();

    console.log("🌈 PSYCHEDELIC DIMENSION SHIFTER ACTIVATED");
    console.log("🌈 Active state:", this.active);
    console.log("🌈 Dimensional layers:", this.dimensionalLayers.length);
  }

  // Deactivate and return to normal space
  deactivate() {
    this.active = false;

    // Stop all dimensional layers
    this.dimensionalLayers.forEach((layer) => {
      if (layer.oscillator) {
        layer.oscillator.stop();
      }
    });

    console.log("🌌 Returned to normal space");
  }

  // Shift to a new dimension
  shiftDimension() {
    this.dimension += this.dimensionShiftSpeed;

    // Each dimension has different properties
    const dimensionType = Math.floor(this.dimension) % 8;

    switch (dimensionType) {
      case 0: // INFINITE FRACTAL
        this.fractalDepth = 3 + Math.floor(Math.random() * 5);
        this.cosmicChaos = 0.3 + Math.random() * 0.4;
        break;
      case 1: // QUANTUM SUPERPOSITION
        this.quantumStates.forEach((state) => {
          state.probability = Math.random();
          state.superposition = Math.random() * Math.PI * 2;
        });
        break;
      case 2: // CHAOS FIELD
        this.chaosField = 0.1 + Math.random() * 0.8;
        break;
      case 3: // DIMENSIONAL RIFT
        this.dimensionalLayers.forEach((layer) => {
          layer.dimension = Math.random() * 4 - 2;
        });
        break;
      case 4: // COSMIC RESONANCE
        this.dimensionalLayers.forEach((layer) => {
          layer.phase = Math.random() * Math.PI * 2;
        });
        break;
      case 5: // TEMPORAL DISTORTION
        this.dimensionShiftSpeed = 0.05 + Math.random() * 0.2;
        break;
      case 6: // SPATIAL FRACTURE
        this.fractalDepth = 1 + Math.floor(Math.random() * 8);
        break;
      case 7: // VOID MANIFESTATION
        this.cosmicChaos = Math.random();
        this.chaosField = Math.random();
        break;
    }
  }

  // Start the dimensional animation loop
  startDimensionalLoop() {
    if (!this.active) {
      console.log("🌈 Dimensional loop stopped - organism not active");
      return;
    }

    // Update quantum states
    this.updateQuantumStates();

    // Generate fractal sounds
    this.generateFractalSounds();

    // Shift dimensions periodically
    if (Math.random() < 0.02) {
      this.shiftDimension();
    }

    // Continue the loop
    requestAnimationFrame(() => this.startDimensionalLoop());
  }

  // Update quantum states for probability-based sound generation
  updateQuantumStates() {
    this.quantumStates.forEach((state, index) => {
      // Quantum fluctuation
      state.probability += (Math.random() - 0.5) * 0.1;
      state.probability = Math.max(0, Math.min(1, state.probability));

      // Superposition evolution
      state.superposition += 0.1 + Math.random() * 0.2;

      // Entanglement with other states
      if (Math.random() < 0.1) {
        const otherIndex = Math.floor(
          Math.random() * this.quantumStates.length
        );
        if (otherIndex !== index) {
          state.entanglement = this.quantumStates[otherIndex].entanglement;
        }
      }

      // Quantum collapse
      if (Math.random() < state.probability * 0.01) {
        state.collapse = true;
        this.triggerQuantumCollapse(index);
        state.collapse = false;
      }
    });
  }

  // Trigger a quantum collapse event
  triggerQuantumCollapse(index) {
    const state = this.quantumStates[index];
    const layer = this.dimensionalLayers[index % this.dimensionalLayers.length];

    if (layer && layer.oscillator) {
      // Generate frequency based on quantum state
      const frequency =
        50 + state.probability * 2000 + state.entanglement * 1000;
      const amplitude = 0.1 + state.probability * 0.3;
      const duration = 0.1 + state.entanglement * 0.5;

      // Apply dimensional effects
      const dimensionalFreq = frequency * (1 + layer.dimension * 0.5);
      const chaosFreq =
        dimensionalFreq + (Math.random() - 0.5) * this.chaosField * 500;

      // Start the oscillator
      layer.oscillator.freq(chaosFreq);
      layer.oscillator.amp(amplitude);

      layer.oscillator.start();

      // Stop after duration
      setTimeout(() => {
        if (layer.oscillator) {
          layer.oscillator.stop();
        }
      }, duration * 1000);
    }
  }

  // Generate fractal-based sounds
  generateFractalSounds() {
    for (let i = 0; i < this.fractalDepth; i++) {
      const layer = this.dimensionalLayers[i % this.dimensionalLayers.length];
      if (!layer || !layer.oscillator) continue;

      // Fractal frequency calculation
      const baseFreq = 100 + i * 50;
      const fractalFreq = baseFreq * Math.pow(1.618, i); // Golden ratio

      // Apply cosmic chaos
      const chaosFreq =
        fractalFreq + (Math.random() - 0.5) * this.cosmicChaos * 200;

      // Dimensional phase shift
      const phaseShift = layer.phase + this.dimension * 0.1;
      const amplitude = 0.05 + Math.sin(phaseShift) * 0.1;

      // Only play if probability allows
      if (Math.random() < 0.3) {
        layer.oscillator.freq(chaosFreq);
        layer.oscillator.amp(amplitude);

        layer.oscillator.start();

        // Stop after a short time
        setTimeout(() => {
          if (layer.oscillator) {
            layer.oscillator.stop();
          }
        }, 100 + Math.random() * 200);
      }
    }
  }

  // Process hand input for dimensional control
  processHandInput(hand, isRightHand) {
    if (!this.active) return;

    try {
      const wrist = hand[0];
      const thumbTip = hand[4];
      const indexTip = hand[8];

      if (!wrist || !thumbTip || !indexTip) return;

      // Right hand controls dimension shifting
      if (isRightHand) {
        // Thumb position controls fractal depth
        const fractalControl = 1 - wrist.y;
        this.fractalDepth = Math.floor(1 + fractalControl * 8);

        // Index position controls cosmic chaos
        this.cosmicChaos = wrist.x;

        // Pinch to trigger dimensional rift
        const pinchDistance = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
        );

        if (pinchDistance < 0.3) {
          this.triggerDimensionalRift();
        }
      } else {
        // Left hand controls quantum field
        this.chaosField = wrist.x;
        this.dimensionShiftSpeed = 0.05 + wrist.y * 0.3;
      }
    } catch (error) {
      console.error(
        "Error processing hand input for psychedelic dimension:",
        error
      );
    }
  }

  // Trigger a dimensional rift event
  triggerDimensionalRift() {
    console.log("🌀 DIMENSIONAL RIFT TRIGGERED!");

    // Create intense sound burst
    this.dimensionalLayers.forEach((layer, index) => {
      if (layer.oscillator) {
        const riftFreq = 100 + index * 200 + Math.random() * 500;
        const riftAmp = 0.3 + Math.random() * 0.4;

        layer.oscillator.freq(riftFreq);
        layer.oscillator.amp(riftAmp);

        layer.oscillator.start();

        // Stop after rift duration
        setTimeout(() => {
          if (layer.oscillator) {
            layer.oscillator.stop();
          }
        }, 300 + Math.random() * 500);
      }
    });

    // Shift to a random dimension
    this.dimension = Math.random() * 100;
    this.shiftDimension();
  }

  // Get current dimension info
  getDimensionInfo() {
    return {
      dimension: Math.floor(this.dimension),
      fractalDepth: this.fractalDepth,
      cosmicChaos: Math.round(this.cosmicChaos * 100),
      chaosField: Math.round(this.chaosField * 100),
      quantumStates: this.quantumStates.length,
      active: this.active,
    };
  }
}

// Export for use in main system
window.PsychedelicDimensionShifter = PsychedelicDimensionShifter;
