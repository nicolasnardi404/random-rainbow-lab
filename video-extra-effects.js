// New video-based effects for VIDEO mode (no color filter by default)
// Each function should use getCurrentVideoTexture() for the video source

window.drawVideoPlanes = function () {
  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let posX = 0,
    posY = 0,
    posZ = 0,
    spacing = 120,
    groupRotY = 0,
    groupRotX = 0;
  if (window.hands && window.hands.length > 0 && window.hands[0]) {
    posX = map(
      window.hands[0][0].x,
      0,
      window.width,
      -window.width / 2,
      window.width / 2
    );
    posY = map(
      window.hands[0][0].y,
      0,
      window.height,
      -window.height / 2,
      window.height / 2
    );
    posZ = window.hands[0][0].z * 400;
    // Use thumb-index distance for spacing
    if (window.hands[0][1] && window.hands[0][2]) {
      let handScale = p5.Vector.dist(window.hands[0][1], window.hands[0][2]);
      spacing = map(handScale, 50, 200, 60, 300);
    }
    // Use hand rotation for group rotation
    if (window.handRotation !== undefined) {
      groupRotY = window.handRotation;
      groupRotX = Math.sin(window.handRotation) * Math.PI * 0.3;
    }
  }

  push();
  translate(posX, posY, posZ);
  rotateY(groupRotY);
  rotateX(groupRotX);
  let numPlanes = 7;
  for (let i = 0; i < numPlanes; i++) {
    push();
    let offset = (i - (numPlanes - 1) / 2) * spacing;
    translate(offset, 0, 0);
    texture(videoTex);
    noStroke();
    plane(160, 120);
    pop();
  }
  pop();
};

window.drawVideoTunnel = function () {
  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let camZ = 0,
    twist = 0,
    speed = 0.02;
  if (window.hands && window.hands.length > 0 && window.hands[0]) {
    camZ = map(window.hands[0][0].y, 0, window.height, -400, 400);
    twist = window.handRotation || 0;
    if (window.hands[0][1] && window.hands[0][2]) {
      let handScale = p5.Vector.dist(window.hands[0][1], window.hands[0][2]);
      speed = map(handScale, 50, 200, 0.01, 0.08);
    }
  }

  push();
  translate(0, 0, camZ);
  rotateZ(twist);
  let tunnelLength = 1200;
  let numSegments = 40;
  let radius = 220;
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  for (let i = 0; i < numSegments; i++) {
    let z1 = map(i, 0, numSegments, -tunnelLength / 2, tunnelLength / 2);
    let z2 = map(i + 1, 0, numSegments, -tunnelLength / 2, tunnelLength / 2);
    beginShape(QUAD_STRIP);
    for (let a = 0; a <= 24; a++) {
      let theta = map(a, 0, 24, 0, TWO_PI);
      let u = a / 24;
      let v1 = i / numSegments;
      let v2 = (i + 1) / numSegments;
      let x1 = cos(theta) * radius;
      let y1 = sin(theta) * radius;
      let x2 = cos(theta) * radius;
      let y2 = sin(theta) * radius;
      vertex(x1, y1, z1, u, v1);
      vertex(x2, y2, z2, u, v2);
    }
    endShape();
  }
  pop();
};

window.drawVideoRibbon = function () {
  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Use a global or static array to store ribbon points
  if (!window._videoRibbonPoints) window._videoRibbonPoints = [];
  let points = window._videoRibbonPoints;

  // Hand controls
  let hand = window.hands && window.hands[0] ? window.hands[0][0] : null;
  let width = 60,
    twist = 0;
  if (hand) {
    let px = map(hand.x, 0, window.width, -window.width / 2, window.width / 2);
    let py = map(
      hand.y,
      0,
      window.height,
      -window.height / 2,
      window.height / 2
    );
    let pz = hand.z * 400;
    points.push({ x: px, y: py, z: pz });
    if (points.length > 80) points.shift();
    if (window.hands[0][1] && window.hands[0][2]) {
      let handScale = p5.Vector.dist(window.hands[0][1], window.hands[0][2]);
      width = map(handScale, 50, 200, 30, 120);
    }
    if (window.handRotation !== undefined) {
      twist = window.handRotation;
    }
  } else {
    points.length = 0;
  }

  if (points.length < 2) return;

  push();
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  for (let i = 1; i < points.length; i++) {
    let p0 = points[i - 1];
    let p1 = points[i];
    let t = i / (points.length - 1);
    let angle = twist * t;
    let w = width * (1 - 0.5 * t);
    let dx = Math.cos(angle) * w * 0.5;
    let dy = Math.sin(angle) * w * 0.5;
    beginShape(QUADS);
    vertex(p0.x - dx, p0.y - dy, p0.z, 0, (i - 1) / points.length);
    vertex(p0.x + dx, p0.y + dy, p0.z, 1, (i - 1) / points.length);
    vertex(p1.x + dx, p1.y + dy, p1.z, 1, i / points.length);
    vertex(p1.x - dx, p1.y - dy, p1.z, 0, i / points.length);
    endShape();
  }
  pop();
};

window.drawVideoCubes = function () {
  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let posX = 0,
    posY = 0,
    posZ = 0,
    spacing = 90,
    rotY = 0,
    rotX = 0;
  if (window.hands && window.hands.length > 0 && window.hands[0]) {
    posX = map(
      window.hands[0][0].x,
      0,
      window.width,
      -window.width / 2,
      window.width / 2
    );
    posY = map(
      window.hands[0][0].y,
      0,
      window.height,
      -window.height / 2,
      window.height / 2
    );
    posZ = window.hands[0][0].z * 400;
    if (window.hands[0][1] && window.hands[0][2]) {
      let handScale = p5.Vector.dist(window.hands[0][1], window.hands[0][2]);
      spacing = map(handScale, 50, 200, 60, 180);
    }
    if (window.handRotation !== undefined) {
      rotY = window.handRotation;
      rotX = Math.sin(window.handRotation) * Math.PI * 0.3;
    }
  }

  let grid = 3;
  let cubeSize = 60;

  push();
  translate(posX, posY, posZ);
  rotateY(rotY);
  rotateX(rotX);
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  for (let x = 0; x < grid; x++) {
    for (let y = 0; y < grid; y++) {
      for (let z = 0; z < grid; z++) {
        push();
        let px = (x - 1) * spacing;
        let py = (y - 1) * spacing;
        let pz = (z - 1) * spacing;
        translate(px, py, pz);
        // Map a different part of the video to each cube face
        for (let f = 0; f < 6; f++) {
          push();
          let u0 = x / grid,
            v0 = y / grid,
            u1 = (x + 1) / grid,
            v1 = (y + 1) / grid;
          switch (f) {
            case 0:
              rotateY(0);
              translate(0, 0, cubeSize / 2);
              break; // front
            case 1:
              rotateY(PI);
              translate(0, 0, cubeSize / 2);
              break; // back
            case 2:
              rotateY(HALF_PI);
              translate(0, 0, cubeSize / 2);
              break; // right
            case 3:
              rotateY(-HALF_PI);
              translate(0, 0, cubeSize / 2);
              break; // left
            case 4:
              rotateX(-HALF_PI);
              translate(0, 0, cubeSize / 2);
              break; // top
            case 5:
              rotateX(HALF_PI);
              translate(0, 0, cubeSize / 2);
              break; // bottom
          }
          beginShape();
          vertex(-cubeSize / 2, -cubeSize / 2, 0, u0, v0);
          vertex(cubeSize / 2, -cubeSize / 2, 0, u1, v0);
          vertex(cubeSize / 2, cubeSize / 2, 0, u1, v1);
          vertex(-cubeSize / 2, cubeSize / 2, 0, u0, v1);
          endShape(CLOSE);
          pop();
        }
        pop();
      }
    }
  }
  pop();
};

window.drawVideoMosaic = function () {
  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let spread = 200,
    rotY = 0,
    rotX = 0,
    moveZ = 0;
  if (window.hands && window.hands.length > 0 && window.hands[0]) {
    if (window.hands[0][1] && window.hands[0][2]) {
      let handScale = p5.Vector.dist(window.hands[0][1], window.hands[0][2]);
      spread = map(handScale, 50, 200, 100, 400);
    }
    moveZ = map(window.hands[0][0].y, 0, window.height, -200, 200);
    if (window.handRotation !== undefined) {
      rotY = window.handRotation;
      rotX = Math.sin(window.handRotation) * Math.PI * 0.3;
    }
  }

  let tiles = 24;
  let tileW = 80,
    tileH = 60;
  let time = millis() * 0.0007;

  push();
  translate(0, 0, moveZ);
  rotateY(rotY);
  rotateX(rotX);
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  for (let i = 0; i < tiles; i++) {
    let angle = map(i, 0, tiles, 0, TWO_PI) + time;
    let r = spread + 60 * Math.sin(time + i);
    let x = Math.cos(angle) * r;
    let y = Math.sin(angle * 1.3) * r * 0.6;
    let z = Math.sin(angle) * r * 0.5;
    let u0 = (i % 6) / 6,
      v0 = Math.floor(i / 6) / 4;
    let u1 = ((i % 6) + 1) / 6,
      v1 = (Math.floor(i / 6) + 1) / 4;
    push();
    translate(x, y, z);
    rotateY(angle + time * 0.7);
    rotateX(angle * 0.5 + time * 0.5);
    beginShape();
    vertex(-tileW / 2, -tileH / 2, 0, u0, v0);
    vertex(tileW / 2, -tileH / 2, 0, u1, v0);
    vertex(tileW / 2, tileH / 2, 0, u1, v1);
    vertex(-tileW / 2, tileH / 2, 0, u0, v1);
    endShape(CLOSE);
    pop();
  }
  pop();
};

window.drawVideoWave = function () {
  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let amp = 40,
    freq = 0.15,
    tiltY = 0,
    tiltX = 0;
  if (window.hands && window.hands.length > 0 && window.hands[0]) {
    if (window.hands[0][1] && window.hands[0][2]) {
      let handScale = p5.Vector.dist(window.hands[0][1], window.hands[0][2]);
      amp = map(handScale, 50, 200, 20, 120);
      freq = map(handScale, 50, 200, 0.08, 0.25);
    }
    if (window.handRotation !== undefined) {
      tiltY = window.handRotation;
      tiltX = Math.sin(window.handRotation) * Math.PI * 0.2;
    }
  }

  let w = 480,
    h = 320;
  let cols = 32,
    rows = 20;
  let time = millis() * 0.001;

  push();
  translate(0, 0, 0);
  rotateY(tiltY);
  rotateX(tiltX);
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  for (let y = 0; y < rows; y++) {
    beginShape(TRIANGLE_STRIP);
    for (let x = 0; x <= cols; x++) {
      let u = x / cols;
      let v0 = y / rows;
      let v1 = (y + 1) / rows;
      let px = map(x, 0, cols, -w / 2, w / 2);
      let py0 = map(y, 0, rows, -h / 2, h / 2);
      let py1 = map(y + 1, 0, rows, -h / 2, h / 2);
      let z0 = Math.sin(time + x * freq + y * 0.2) * amp;
      let z1 = Math.sin(time + x * freq + (y + 1) * 0.2) * amp;
      vertex(px, py0, z0, u, v0);
      vertex(px, py1, z1, u, v1);
    }
    endShape();
  }
  pop();
};

window.drawVideoSphere = function () {
  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let rotY = 0,
    rotX = 0,
    scale = 1;
  if (window.hands && window.hands.length > 0 && window.hands[0]) {
    if (window.handRotation !== undefined) {
      rotY = window.handRotation;
      rotX = Math.sin(window.handRotation) * Math.PI * 0.3;
    }
    if (window.hands[0][1] && window.hands[0][2]) {
      let handScale = p5.Vector.dist(window.hands[0][1], window.hands[0][2]);
      scale = map(handScale, 50, 200, 0.7, 1.7);
    }
  }

  push();
  rotateY(rotY);
  rotateX(rotX);
  scale = constrain(scale, 0.5, 2.5);
  scale(scale);
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  sphere(180, 36, 24);
  pop();
};

window.drawVideoMirrorRoom = function () {
  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let camX = 0,
    camY = 0,
    camZ = 0,
    rotY = 0,
    rotX = 0;
  if (window.hands && window.hands.length > 0 && window.hands[0]) {
    camX = map(window.hands[0][0].x, 0, window.width, -200, 200);
    camY = map(window.hands[0][0].y, 0, window.height, -120, 120);
    camZ = window.hands[0][0].z * 400;
    if (window.handRotation !== undefined) {
      rotY = window.handRotation;
      rotX = Math.sin(window.handRotation) * Math.PI * 0.3;
    }
  }

  let roomW = 480,
    roomH = 320,
    roomD = 480;

  push();
  translate(camX, camY, camZ);
  rotateY(rotY);
  rotateX(rotX);
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  // Floor
  push();
  translate(0, roomH / 2, 0);
  rotateX(HALF_PI);
  beginShape();
  vertex(-roomW / 2, -roomD / 2, 0, 0, 1);
  vertex(roomW / 2, -roomD / 2, 0, 1, 1);
  vertex(roomW / 2, roomD / 2, 0, 1, 0.5);
  vertex(-roomW / 2, roomD / 2, 0, 0, 0.5);
  endShape(CLOSE);
  pop();
  // Ceiling
  push();
  translate(0, -roomH / 2, 0);
  rotateX(-HALF_PI);
  beginShape();
  vertex(-roomW / 2, -roomD / 2, 0, 0, 0.5);
  vertex(roomW / 2, -roomD / 2, 0, 1, 0.5);
  vertex(roomW / 2, roomD / 2, 0, 1, 0);
  vertex(-roomW / 2, roomD / 2, 0, 0, 0);
  endShape(CLOSE);
  pop();
  // Back wall
  push();
  translate(0, 0, -roomD / 2);
  beginShape();
  vertex(-roomW / 2, -roomH / 2, 0, 0, 0);
  vertex(roomW / 2, -roomH / 2, 0, 1, 0);
  vertex(roomW / 2, roomH / 2, 0, 1, 1);
  vertex(-roomW / 2, roomH / 2, 0, 0, 1);
  endShape(CLOSE);
  pop();
  // Left wall
  push();
  translate(-roomW / 2, 0, 0);
  rotateY(HALF_PI);
  beginShape();
  vertex(-roomD / 2, -roomH / 2, 0, 0, 0);
  vertex(roomD / 2, -roomH / 2, 0, 1, 0);
  vertex(roomD / 2, roomH / 2, 0, 1, 1);
  vertex(-roomD / 2, roomH / 2, 0, 0, 1);
  endShape(CLOSE);
  pop();
  // Right wall
  push();
  translate(roomW / 2, 0, 0);
  rotateY(-HALF_PI);
  beginShape();
  vertex(-roomD / 2, -roomH / 2, 0, 0, 0);
  vertex(roomD / 2, -roomH / 2, 0, 1, 0);
  vertex(roomD / 2, roomH / 2, 0, 1, 1);
  vertex(-roomD / 2, roomH / 2, 0, 0, 1);
  endShape(CLOSE);
  pop();
  // Front wall (optional, can be omitted for camera view)
  pop();
};

window.drawVideoParticleSwarm = function () {
  const videoTex = window.getCurrentVideoTexture
    ? window.getCurrentVideoTexture()
    : null;
  if (!videoTex || !videoTex.loadedmetadata) return;

  // Hand controls
  let centerX = 0,
    centerY = 0,
    centerZ = 0,
    spread = 180,
    rotY = 0,
    rotX = 0;
  if (window.hands && window.hands.length > 0 && window.hands[0]) {
    centerX = map(
      window.hands[0][0].x,
      0,
      window.width,
      -window.width / 2,
      window.width / 2
    );
    centerY = map(
      window.hands[0][0].y,
      0,
      window.height,
      -window.height / 2,
      window.height / 2
    );
    centerZ = window.hands[0][0].z * 400;
    if (window.hands[0][1] && window.hands[0][2]) {
      let handScale = p5.Vector.dist(window.hands[0][1], window.hands[0][2]);
      spread = map(handScale, 50, 200, 80, 320);
    }
    if (window.handRotation !== undefined) {
      rotY = window.handRotation;
      rotX = Math.sin(window.handRotation) * Math.PI * 0.3;
    }
  }

  let numParticles = 36;
  let pSize = 48;
  let time = millis() * 0.001;

  push();
  translate(centerX, centerY, centerZ);
  rotateY(rotY);
  rotateX(rotX);
  textureMode(NORMAL);
  texture(videoTex);
  noStroke();
  for (let i = 0; i < numParticles; i++) {
    let angle = map(i, 0, numParticles, 0, TWO_PI) + time * 0.7;
    let r = spread + 40 * Math.sin(time * 1.2 + i);
    let x = Math.cos(angle) * r + Math.sin(time + i) * 30;
    let y = Math.sin(angle * 1.3) * r * 0.7 + Math.cos(time * 0.8 + i) * 18;
    let z = Math.sin(angle) * r * 0.5 + Math.sin(time * 1.1 + i) * 22;
    let u0 = (i % 6) / 6,
      v0 = Math.floor(i / 6) / 6;
    let u1 = ((i % 6) + 1) / 6,
      v1 = (Math.floor(i / 6) + 1) / 6;
    push();
    translate(x, y, z);
    rotateY(angle + time * 0.5);
    rotateX(angle * 0.5 + time * 0.3);
    beginShape();
    vertex(-pSize / 2, -pSize / 2, 0, u0, v0);
    vertex(pSize / 2, -pSize / 2, 0, u1, v0);
    vertex(pSize / 2, pSize / 2, 0, u1, v1);
    vertex(-pSize / 2, pSize / 2, 0, u0, v1);
    endShape(CLOSE);
    pop();
  }
  pop();
};
