# Hands As Videos Controller

An interactive web application that uses hand tracking technology to control visual effects in real-time. Create stunning visuals by simply moving your hands in front of your webcam.

## Features

- Real-time hand tracking using MediaPipe
- 8 different visual effects to choose from
- Intuitive gesture controls for manipulating effects
- HD video recording capability
- Works directly in your browser with no additional hardware

## Demo

Visit the landing page to get started, then click "Launch Experience" to enter the main application.

## Requirements

- A modern web browser (Chrome, Firefox, or Edge recommended)
- A webcam
- Node.js and npm installed

## Installation

1. Clone this repository or download the source code
2. Open a terminal in the project directory
3. Install dependencies:

```bash
npm install
```

## Running the Application

### Development Mode

To run the application in development mode with automatic browser opening:

```bash
npm run dev
```

This will start a local server and automatically open the landing page in your browser.

### Production Mode

To run the application in production mode:

```bash
npm start
```

Then visit `http://localhost:3000` in your browser.
The main application is available at `http://localhost:3000/app`

## Usage

1. Grant camera access when prompted
2. Position your hands in front of the camera
3. Use the following controls:

### Hand Controls

- **Right Hand**: Controls position and size of effects
  - Move hand to position the effect
  - Pinch (thumb to index) to control size

- **Left Hand**: Controls colors and energy levels
  - Move left/right to change colors
  - Movement speed controls energy level

### Keyboard Controls

- Press **SPACE** to change effects
- Press **D** to toggle debug info
- Press **R** to toggle recording

## Technologies Used

- p5.js for rendering and visual effects
- MediaPipe for hand tracking
- Express.js for the server

## License

[MIT License](LICENSE) 