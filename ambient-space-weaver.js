// AMBIENT SPACE WEAVER
// A meditative, drone-based system that creates evolving soundscapes and organic growth patterns
// This organism grows and evolves like a living sound garden

class AmbientSpaceWeaver {
  constructor() {
    this.growthStage = 0;
    this.organicLayers = [];
    this.evolutionRate = 0.001;
    this.harmonicField = 0.5;
    this.breathingRate = 0.02;
    this.spaceDepth = 0.3;
    this.active = false;
    this.growthCycles = 0;

    // Initialize organic sound generators
    this.initOrganicGenerators();
  }

  initOrganicGenerators() {
    // Create organic drone layers that grow and evolve
    this.organicLayers = [];
    for (let i = 0; i < 12; i++) {
      const layer = {
        oscillator: new p5.Oscillator("sine"),
        filter: new p5.LowPass(),
        envelope: new p5.Envelope(),
        growth: Math.random(),
        evolution: Math.random(),
        harmonic: 1 + i * 0.5,
        breathing: Math.random() * Math.PI * 2,
        space: Math.random(),
      };

      // Set up organic filter chain
      layer.oscillator.disconnect();
      layer.oscillator.connect(layer.filter);
      layer.filter.freq(80 + i * 40);
      layer.filter.res(1 + i * 0.2);

      this.organicLayers.push(layer);
    }

    // Initialize growth patterns
    this.growthPatterns = Array(8)
      .fill(0)
      .map(() => ({
        seed: Math.random(),
        growth: 0,
        mutation: Math.random(),
        harmony: Math.random(),
      }));
  }

  // Activate the ambient space
  activate() {
    console.log("🌌 ACTIVATING AMBIENT SPACE WEAVER...");
    this.active = true;
    this.growthStage = 0;
    this.growthCycles = 0;

    // Start the organic growth loop
    this.startOrganicGrowth();

    console.log("🌌 AMBIENT SPACE WEAVER ACTIVATED");
    console.log("🌌 Active state:", this.active);
    console.log("🌌 Organic layers:", this.organicLayers.length);
  }

  // Deactivate and return to silence
  deactivate() {
    this.active = false;

    // Gradually fade out all layers
    this.organicLayers.forEach((layer) => {
      if (layer.oscillator) {
        layer.oscillator.amp(0, 2.0); // Fade out over 2 seconds
        setTimeout(() => {
          if (layer.oscillator) {
            layer.oscillator.stop();
          }
        }, 2000);
      }
    });

    console.log("🌱 Ambient space returning to silence");
  }

  // Start the organic growth animation loop
  startOrganicGrowth() {
    if (!this.active) return;

    // Evolve organic layers
    this.evolveOrganicLayers();

    // Grow new sound patterns
    this.growSoundPatterns();

    // Breathe life into the space
    this.breatheLife();

    // Maintain continuous drone flow
    this.maintainContinuousFlow();

    // Continue the growth cycle
    requestAnimationFrame(() => this.startOrganicGrowth());
  }

  // Evolve organic layers over time
  evolveOrganicLayers() {
    this.organicLayers.forEach((layer, index) => {
      // Natural evolution
      layer.evolution += this.evolutionRate * (1 + Math.random() * 0.5);

      // Growth based on evolution
      layer.growth = Math.sin(layer.evolution) * 0.5 + 0.5;

      // Harmonic evolution
      layer.harmonic = 1 + index * 0.5 + Math.sin(layer.evolution * 0.1) * 0.2;

      // Breathing pattern evolution
      layer.breathing += this.breathingRate * (1 + Math.random() * 0.3);

      // Space depth evolution
      layer.space = 0.1 + Math.sin(layer.evolution * 0.05) * 0.4;
    });
  }

  // Grow new sound patterns organically
  growSoundPatterns() {
    this.growthPatterns.forEach((pattern, index) => {
      // Natural growth
      pattern.growth += 0.001 * (1 + pattern.seed * 0.5);

      // Mutation over time
      pattern.mutation += 0.0005 * (1 + Math.random() * 0.5);

      // Harmony evolution
      pattern.harmony = Math.sin(pattern.growth * 0.1) * 0.5 + 0.5;

      // Continuous growth events for flowing sound
      if (Math.random() < 0.1) {
        // Increased probability for more flow
        this.triggerGrowthEvent(index);
      }
    });

    // Overall growth stage progression
    this.growthStage += 0.0001;
    this.growthCycles = Math.floor(this.growthStage * 100);
  }

  // Trigger a growth event
  triggerGrowthEvent(patternIndex) {
    const pattern = this.growthPatterns[patternIndex];
    const layer = this.organicLayers[patternIndex % this.organicLayers.length];

    if (layer && layer.oscillator) {
      // Calculate organic frequency
      const baseFreq = 60 + patternIndex * 20;
      const harmonicFreq = baseFreq * pattern.harmony * 2;
      const growthFreq = harmonicFreq * (1 + pattern.growth * 0.5);

      // Apply breathing modulation
      const breathingMod = 1 + Math.sin(layer.breathing) * 0.1;
      const finalFreq = growthFreq * breathingMod;

      // Calculate organic amplitude
      const growthAmp = 0.05 + pattern.growth * 0.15;
      const spaceAmp = growthAmp * (1 + layer.space);

      console.log(
        `🌱 Growth event: ${finalFreq.toFixed(1)}Hz, amp: ${spaceAmp.toFixed(
          3
        )}`
      );

      // Start the organic sound
      layer.oscillator.freq(finalFreq);
      layer.oscillator.amp(spaceAmp);

      layer.oscillator.start();

      // Let it grow naturally
      setTimeout(() => {
        if (layer.oscillator) {
          // Gradually reduce amplitude for natural decay
          layer.oscillator.amp(0, 3.0 + Math.random() * 2.0);
        }
      }, 1000 + Math.random() * 2000);
    }
  }

  // Breathe life into the ambient space
  breatheLife() {
    this.organicLayers.forEach((layer, index) => {
      if (layer.oscillator) {
        // Subtle breathing modulation
        const breathingMod = 1 + Math.sin(layer.breathing) * 0.05;
        const currentAmp = layer.oscillator.getAmp();

        // Apply gentle breathing
        if (currentAmp > 0.01) {
          layer.oscillator.amp(currentAmp * breathingMod, 0.1);
        }
      }
    });
  }

  // Maintain continuous drone flow
  maintainContinuousFlow() {
    this.organicLayers.forEach((layer, index) => {
      if (layer.oscillator) {
        // Ensure continuous sound flow

        const baseFreq = 60 + index * 20;
        const harmonicFreq = baseFreq * layer.harmonic;
        const flowAmp = 0.03 + Math.sin(layer.evolution) * 0.02;

        layer.oscillator.freq(harmonicFreq);
        layer.oscillator.amp(flowAmp);
        layer.oscillator.start();

        // Evolve the continuous flow
        const evolutionFreq =
          (60 + index * 20) * (1 + Math.sin(layer.evolution * 0.1) * 0.1);
        layer.oscillator.freq(evolutionFreq);
      }
    });
  }

  // Process hand input for organic control
  processHandInput(hand, isRightHand) {
    if (!this.active) return;

    try {
      const wrist = hand[0];
      const thumbTip = hand[4];
      const indexTip = hand[8];
      const middleTip = hand[12];
      const ringTip = hand[16];
      const pinkyTip = hand[20];

      if (!wrist || !thumbTip || !indexTip) return;

      // Right hand controls growth and evolution
      if (isRightHand) {
        // Wrist Y controls growth rate continuously
        this.evolutionRate = 0.0005 + wrist.y * 0.002;

        // Wrist X controls harmonic field continuously
        this.harmonicField = wrist.x;

        // Thumb controls evolution speed
        const thumbY = thumbTip.y;
        this.evolutionRate = 0.0001 + (1 - thumbY) * 0.003;

        // Index controls harmonic complexity
        const indexY = indexTip.y;
        this.organicLayers.forEach((layer, i) => {
          layer.harmonic = 1 + i * 0.5 + indexY * 2;
        });

        // Middle finger controls breathing rate
        const middleY = middleTip.y;
        this.breathingRate = 0.005 + middleY * 0.08;

        // Ring finger controls space depth
        const ringY = ringTip.y;
        this.spaceDepth = ringY;

        // Pinky controls growth pattern mutation
        const pinkyY = pinkyTip.y;
        this.growthPatterns.forEach((pattern) => {
          pattern.mutation += 0.001 + pinkyY * 0.01;
        });

        // Pinch to trigger rapid growth
        const pinchDistance = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
        );

        if (pinchDistance < 0.3) {
          this.triggerRapidGrowth();
        }
      } else {
        // Left hand controls breathing and space
        this.breathingRate = 0.01 + wrist.y * 0.04;
        this.spaceDepth = wrist.x;

        // Left hand fingers control individual organic layers
        const fingers = [thumbTip, indexTip, middleTip, ringTip, pinkyTip];
        fingers.forEach((finger, i) => {
          if (i < this.organicLayers.length) {
            const layer = this.organicLayers[i];
            layer.breathing += (finger.y - 0.5) * 0.1;
            layer.space = finger.x;
            layer.growth += (finger.y - 0.5) * 0.01;
          }
        });
      }
    } catch (error) {
      console.error("Error processing hand input for ambient space:", error);
    }
  }

  // Trigger rapid growth event
  triggerRapidGrowth() {
    console.log("🌱 RAPID GROWTH TRIGGERED!");

    // Accelerate all growth patterns
    this.growthPatterns.forEach((pattern) => {
      pattern.growth += 0.1 + Math.random() * 0.2;
      pattern.mutation += 0.05 + Math.random() * 0.1;
    });

    // Create growth burst sounds
    this.organicLayers.forEach((layer, index) => {
      if (layer.oscillator) {
        const growthFreq = 80 + index * 30 + Math.random() * 100;
        const growthAmp = 0.2 + Math.random() * 0.3;

        layer.oscillator.freq(growthFreq);
        layer.oscillator.amp(growthAmp);

        layer.oscillator.start();

        // Natural decay
        setTimeout(() => {
          if (layer.oscillator) {
            layer.oscillator.amp(0, 2.0 + Math.random() * 2.0);
          }
        }, 1000 + Math.random() * 2.0);
      }
    });

    // Advance growth stage
    this.growthStage += 0.1;
  }

  // Create organic drone texture
  createDroneTexture() {
    if (!this.active) return;

    // Create a new organic layer
    const newLayer = {
      oscillator: new p5.Oscillator("sine"),
      filter: new p5.LowPass(),
      envelope: new p5.Envelope(),
      growth: Math.random(),
      evolution: Math.random(),
      harmonic: 1 + Math.random() * 2,
      breathing: Math.random() * Math.PI * 2,
      space: Math.random(),
    };

    // Set up the new layer
    newLayer.oscillator.disconnect();
    newLayer.oscillator.connect(newLayer.filter);
    newLayer.filter.freq(60 + Math.random() * 200);
    newLayer.filter.res(1 + Math.random() * 2);

    // Add to organic layers
    this.organicLayers.push(newLayer);

    // Start the drone
    const droneFreq = 60 + Math.random() * 200;
    const droneAmp = 0.05 + Math.random() * 0.1;

    newLayer.oscillator.freq(droneFreq);
    newLayer.oscillator.amp(droneAmp);
    newLayer.oscillator.start();

    console.log("🌱 New organic drone layer created");
  }

  // Get current growth info
  getGrowthInfo() {
    return {
      growthStage: Math.floor(this.growthStage * 100),
      growthCycles: this.growthCycles,
      evolutionRate: Math.round(this.evolutionRate * 10000),
      harmonicField: Math.round(this.harmonicField * 100),
      breathingRate: Math.round(this.breathingRate * 1000),
      spaceDepth: Math.round(this.spaceDepth * 100),
      organicLayers: this.organicLayers.length,
      active: this.active,
    };
  }
}

// Export for use in main system
window.AmbientSpaceWeaver = AmbientSpaceWeaver;
