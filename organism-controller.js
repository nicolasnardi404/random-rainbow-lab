// ORGANISM CONTROLLER
// Master controller for managing three musical organisms in the same ecosystem
// Each organism is completely independent but can coexist and interact

class OrganismController {
  constructor() {
    this.organisms = {
      classic: null, // Your original music module
      psychedelic: null, // Psychedelic Dimension Shifter
      ambient: null, // Ambient Space Weaver
    };

    this.activeOrganism = "classic";
    this.organismStates = {
      classic: { active: true, volume: 1.0 },
      psychedelic: { active: false, volume: 0.0 },
      ambient: { active: false, volume: 0.0 },
    };

    this.crossPollination = false;
    this.ecosystemHarmony = 0.5;

    this.init();
  }

  init() {
    console.log("🌍 Initializing Musical Ecosystem...");
    console.log("🌍 Available classes:", {
      PsychedelicDimensionShifter: typeof window.PsychedelicDimensionShifter,
      AmbientSpaceWeaver: typeof window.AmbientSpaceWeaver,
    });

    // Initialize the psychedelic organism
    if (window.PsychedelicDimensionShifter) {
      console.log("🌈 Creating Psychedelic Dimension Shifter instance...");
      this.organisms.psychedelic = new window.PsychedelicDimensionShifter();
      console.log(
        "🌈 Psychedelic Dimension Shifter initialized:",
        this.organisms.psychedelic
      );
    } else {
      console.error("❌ PsychedelicDimensionShifter class not found!");
    }

    // Initialize the ambient organism
    if (window.AmbientSpaceWeaver) {
      console.log("🌌 Creating Ambient Space Weaver instance...");
      this.organisms.ambient = new window.AmbientSpaceWeaver();
      console.log(
        "🌌 Ambient Space Weaver initialized:",
        this.organisms.ambient
      );
    } else {
      console.error("❌ AmbientSpaceWeaver class not found!");
    }

    // The classic organism is already running in your main system
    this.organisms.classic = "active"; // Reference to existing system

    console.log("🌍 Musical Ecosystem ready with organisms:", this.organisms);
  }

  // Switch to a different organism
  switchOrganism(organismName) {
    console.log(`🔄 Attempting to switch to ${organismName} organism...`);

    if (!this.organisms[organismName]) {
      console.error(`Organism ${organismName} not found in:`, this.organisms);
      return;
    }

    console.log(
      `🔄 Switching from ${this.activeOrganism} to ${organismName} organism...`
    );

    // Deactivate current organism
    this.deactivateOrganism(this.activeOrganism);

    // Activate new organism
    this.activateOrganism(organismName);

    this.activeOrganism = organismName;

    console.log(`✅ Successfully switched to ${organismName} organism`);
    console.log(`🌍 Current ecosystem status:`, this.getEcosystemStatus());
  }

  // Activate an organism
  activateOrganism(organismName) {
    console.log(`🔓 Activating ${organismName} organism...`);

    const organism = this.organisms[organismName];
    if (!organism) {
      console.error(`No organism found for ${organismName}`);
      return;
    }

    console.log(`🔓 Found organism:`, organism);
    console.log(`🔓 Organism type:`, typeof organism);
    console.log(`🔓 Has activate method:`, organism.activate ? "Yes" : "No");

    this.organismStates[organismName].active = true;
    this.organismStates[organismName].volume = 1.0;

    switch (organismName) {
      case "psychedelic":
        if (organism.activate) {
          console.log("🌈 Activating Psychedelic Dimension Shifter...");
          organism.activate();
        } else {
          console.error("Psychedelic organism missing activate method");
        }
        break;
      case "ambient":
        if (organism.activate) {
          console.log("🌌 Activating Ambient Space Weaver...");
          organism.activate();
        } else {
          console.error("Ambient organism missing activate method");
        }
        break;
      case "classic":
        console.log("🎵 Classic system already active");
        break;
    }

    console.log(`✅ ${organismName} organism activated`);

    // Update UI to show active organism
    this.updateOrganismUI();
  }

  // Deactivate an organism
  deactivateOrganism(organismName) {
    const organism = this.organisms[organismName];
    if (!organism) return;

    this.organismStates[organismName].active = false;
    this.organismStates[organismName].volume = 0.0;

    switch (organismName) {
      case "psychedelic":
        if (organism.deactivate) {
          organism.deactivate();
        }
        break;
      case "ambient":
        if (organism.deactivate) {
          organism.deactivate();
        }
        break;
      case "classic":
        // Don't deactivate your main system
        break;
    }

    // Update UI
    this.updateOrganismUI();
  }

  // Enable cross-pollination between organisms
  enableCrossPollination() {
    this.crossPollination = true;
    console.log("🌸 Cross-pollination enabled - organisms can now interact");

    // Start cross-pollination effects
    this.startCrossPollination();
  }

  // Disable cross-pollination
  disableCrossPollination() {
    this.crossPollination = false;
    console.log("🚫 Cross-pollination disabled");
  }

  // Start cross-pollination effects
  startCrossPollination() {
    if (!this.crossPollination) return;

    // Create interaction between organisms
    this.createOrganismInteraction();

    // Continue cross-pollination
    setTimeout(
      () => this.startCrossPollination(),
      5000 + Math.random() * 10000
    );
  }

  // Create interaction between organisms
  createOrganismInteraction() {
    if (
      this.organismStates.psychedelic.active &&
      this.organismStates.ambient.active
    ) {
      console.log("🌺 Cross-pollination: Psychedelic + Ambient interaction");

      // Psychedelic affects ambient
      if (this.organisms.psychedelic && this.organisms.ambient) {
        const dimensionInfo = this.organisms.psychedelic.getDimensionInfo();
        const growthInfo = this.organisms.ambient.getGrowthInfo();

        // Psychedelic chaos influences ambient growth
        if (dimensionInfo.cosmicChaos > 70) {
          this.organisms.ambient.triggerRapidGrowth();
        }

        // Ambient harmony influences psychedelic dimension
        if (growthInfo.harmonicField > 80) {
          this.organisms.psychedelic.shiftDimension();
        }
      }
    }
  }

  // Process hand input for the active organism
  processHandInput(hand, isRightHand) {
    console.log(`🌍 Processing hand input for ${this.activeOrganism} organism`);

    const activeOrg = this.activeOrganism;

    switch (activeOrg) {
      case "psychedelic":
        console.log("🌈 Routing to Psychedelic Dimension Shifter");
        if (
          this.organisms.psychedelic &&
          this.organisms.psychedelic.processHandInput
        ) {
          this.organisms.psychedelic.processHandInput(hand, isRightHand);
        } else {
          console.error("Psychedelic organism not properly initialized");
        }
        break;
      case "ambient":
        console.log("🌌 Routing to Ambient Space Weaver");
        if (this.organisms.ambient && this.organisms.ambient.processHandInput) {
          this.organisms.ambient.processHandInput(hand, isRightHand);
        } else {
          console.error("Ambient organism not properly initialized");
        }
        break;
      case "classic":
        console.log("🎵 Routing to Classic Music System");
        // Your existing hand processing continues
        if (window.playNoteFromHand) {
          window.playNoteFromHand(hand, isRightHand);
        }
        break;
      default:
        console.log(`Unknown organism: ${activeOrg}, falling back to classic`);
        if (window.playNoteFromHand) {
          window.playNoteFromHand(hand, isRightHand);
        }
    }

    // If cross-pollination is enabled, all organisms can respond
    if (this.crossPollination) {
      console.log("🌸 Cross-pollination active - all organisms responding");
      if (
        this.organismStates.psychedelic.active &&
        this.organisms.psychedelic
      ) {
        this.organisms.psychedelic.processHandInput(hand, isRightHand);
      }
      if (this.organismStates.ambient.active && this.organisms.ambient) {
        this.organisms.ambient.processHandInput(hand, isRightHand);
      }
    }
  }

  // Get ecosystem status
  getEcosystemStatus() {
    return {
      activeOrganism: this.activeOrganism,
      organismStates: this.organismStates,
      crossPollination: this.crossPollination,
      ecosystemHarmony: this.ecosystemHarmony,
    };
  }

  // Update organism UI
  updateOrganismUI() {
    // This will be called to update the UI when organisms change
    // You can integrate this with your existing status display

    const status = this.getEcosystemStatus();
    console.log("🌍 Ecosystem Status:", status);

    // Update status display if it exists
    if (window.updateStatus) {
      window.updateStatus("current-mode", status.activeOrganism.toUpperCase());
    }
  }

  // Create a new organism combination
  createOrganismCombination(combination) {
    switch (combination) {
      case "chaos-harmony":
        // Psychedelic + Ambient
        this.activateOrganism("psychedelic");
        this.activateOrganism("ambient");
        this.enableCrossPollination();
        break;
      case "classic-psychedelic":
        // Classic + Psychedelic
        this.activateOrganism("psychedelic");
        this.enableCrossPollination();
        break;
      case "classic-ambient":
        // Classic + Ambient
        this.activateOrganism("ambient");
        this.enableCrossPollination();
        break;
      case "all-three":
        // All three organisms active
        this.activateOrganism("psychedelic");
        this.activateOrganism("ambient");
        this.enableCrossPollination();
        break;
    }
  }

  // Emergency shutdown of all organisms
  emergencyShutdown() {
    console.log("🚨 EMERGENCY SHUTDOWN - Deactivating all organisms");

    Object.keys(this.organisms).forEach((orgName) => {
      if (orgName !== "classic") {
        // Don't shutdown your main system
        this.deactivateOrganism(orgName);
      }
    });

    this.disableCrossPollination();
    this.activeOrganism = "classic";

    console.log("✅ Emergency shutdown complete");
  }
}

// Export for use in main system
window.OrganismController = OrganismController;

// Initialize the ecosystem when the page loads
document.addEventListener("DOMContentLoaded", function () {
  // Wait a bit for other organisms to load
  setTimeout(() => {
    if (window.OrganismController) {
      window.ecosystem = new window.OrganismController();
      console.log("🌍 Musical Ecosystem Controller initialized");
    }
  }, 2000);
});
