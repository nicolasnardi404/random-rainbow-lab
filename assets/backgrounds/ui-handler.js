// Background UI Handler

document.addEventListener("DOMContentLoaded", function () {
  // Default selections
  window.selectedBackgroundMode = 0; // Shader by default
  window.selectedBackground = 0; // First background in each category

  // Single global persistence state (not per-effect)
  window.persistenceEnabled = false; // Persistence effect disabled by default

  // Background type buttons
  const bgTypeButtons = document.querySelectorAll(".bg-type-btn");
  const bgSelect = document.getElementById("bg-select");
  const uploadSection = document.getElementById("upload-section");
  const persistenceToggle = document.getElementById("ghost-toggle");
  const clearTrailsBtn = document.getElementById("clear-trails");

  // Background color pickers
  const colorPicker1 = document.getElementById("shader-color1");
  const colorPicker2 = document.getElementById("shader-color2");
  const colorPicker3 = document.getElementById("shader-color3");

  // Upload input element
  const uploadInput = document.getElementById("bg-upload");

  // Ensure the toggle is in sync with our default state (OFF)
  if (persistenceToggle) {
    persistenceToggle.checked = window.persistenceEnabled;
  }

  // Initialize background options in dropdown
  function populateBackgroundOptions(mode) {
    // Clear existing options
    bgSelect.innerHTML = "";

    let options = [];
    switch (mode) {
      case 0: // Shader
        SHADER_NAMES.forEach((name, index) => {
          options.push(`<option value="${index}">${name}</option>`);
        });
        break;
      case 2: // Video
        BACKGROUND_VIDEO_SOURCES.forEach((source, index) => {
          options.push(`<option value="${index}">${source.name}</option>`);
        });
        break;
    }

    bgSelect.innerHTML = options.join("");
  }

  // Event Handlers

  // Background type selection
  bgTypeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Get the mode from data attribute
      const mode = parseInt(this.getAttribute("data-mode"));

      // Update selected class
      bgTypeButtons.forEach((btn) => btn.classList.remove("selected"));
      this.classList.add("selected");

      // Update global mode
      window.selectedBackgroundMode = mode;

      // Show/hide appropriate UI elements
      if (mode === 3) {
        // Custom upload
        bgSelect.style.display = "none";
        uploadSection.style.display = "block";
        document.getElementById("shader-colors").style.display = "none";
      } else {
        bgSelect.style.display = "block";
        uploadSection.style.display = "none";
        document.getElementById("shader-colors").style.display =
          mode === 0 ? "block" : "none";

        // Populate options
        populateBackgroundOptions(mode);
      }
    });
  });

  // Handle persistence effect toggle
  if (persistenceToggle) {
    persistenceToggle.addEventListener("change", function () {
      window.persistenceEnabled = this.checked;

      // Update the status display in the debug panel
      const statusElement = document.getElementById("ghost-status");
      if (statusElement) {
        statusElement.textContent =
          "Trail recording: " + (this.checked ? "ON" : "OFF");
      }
    });
  }

  // Handle clear trails button
  if (clearTrailsBtn) {
    clearTrailsBtn.addEventListener("click", function () {
      // Call the clear function defined in sketch.js
      if (window.clearPersistenceCanvas) {
        window.clearPersistenceCanvas();
      } else {
        console.warn("clearPersistenceCanvas function not found");
      }
    });
  }

  // Background selection dropdown
  bgSelect.addEventListener("change", function () {
    window.selectedBackground = parseInt(this.value);
  });

  // Shader color pickers
  if (colorPicker1) {
    colorPicker1.addEventListener("input", function () {
      const rgb = hexToRgb(this.value);
      window.shaderColor1 = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    });
    // Initialize with default color
    const rgb1 = hexToRgb(colorPicker1.value);
    window.shaderColor1 = [rgb1.r / 255, rgb1.g / 255, rgb1.b / 255];
  }

  if (colorPicker2) {
    colorPicker2.addEventListener("input", function () {
      const rgb = hexToRgb(this.value);
      window.shaderColor2 = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    });
    // Initialize with default color
    const rgb2 = hexToRgb(colorPicker2.value);
    window.shaderColor2 = [rgb2.r / 255, rgb2.g / 255, rgb2.b / 255];
  }

  if (colorPicker3) {
    colorPicker3.addEventListener("input", function () {
      const rgb = hexToRgb(this.value);
      window.shaderColor3 = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    });
    // Initialize with default color
    const rgb3 = hexToRgb(colorPicker3.value);
    window.shaderColor3 = [rgb3.r / 255, rgb3.g / 255, rgb3.b / 255];
  }

  // Handle custom background uploads
  if (uploadInput) {
    uploadInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        const url = URL.createObjectURL(file);

        // Determine if it's an image or video
        const fileType = file.type.split("/")[0];

        // Set the global custom background
        window.customBackgroundURL = url;
        window.customBackgroundType = fileType;

        // Update UI to show upload success
        const uploadStatus = document.getElementById("upload-status");
        if (uploadStatus) {
          uploadStatus.textContent = `Uploaded: ${file.name}`;
          uploadStatus.style.display = "block";
        }
      }
    });
  }

  // Initialize UI
  populateBackgroundOptions(0); // Start with shaders
  document
    .querySelector('.bg-type-btn[data-mode="0"]')
    .classList.add("selected");
  if (document.getElementById("shader-colors")) {
    document.getElementById("shader-colors").style.display = "block";
  }

  // Utility function to convert hex color to RGB
  function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace("#", "");

    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
  }
});
