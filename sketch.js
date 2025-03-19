let currentColor;
let colors = [
  'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'magenta', 'brown', 'white', 'black'
];
let paletteWidth = 50; // Width of the color palette
let prevX, prevY; // Variables to store the previous mouse position for drawing lines

// Sound variables
let colorSounds = []; // Array to store sounds for each color
let backgroundMusic;
let clearSound;
let brushSound;
let saveSound;
let osc;
let filledPixels = 0;
let totalPixels;
let lastFilledPercentage = 0;

// Musical variables
let notes = [60, 62, 64, 65, 67, 69, 71, 72]; // C major scale in MIDI notes
let currentBeat = 0;
let bpm = 80;
let loopInterval;

function preload() {
  // Load sound files
  soundFormats('mp3', 'wav');
  
  // Load color selection sounds
  for (let i = 0; i < colors.length; i++) {
    // We use different notes for different colors
    let sound = loadSound('https://cdn.glitch.global/3abaef36-1a74-452f-b94e-30e98c8e7252/note' + (i % 7 + 1) + '.mp3');
    colorSounds.push(sound);
  }
  
  // Load other UI sounds
  clearSound = loadSound('https://cdn.glitch.global/3abaef36-1a74-452f-b94e-30e98c8e7252/clear.mp3');
  saveSound = loadSound('https://cdn.glitch.global/3abaef36-1a74-452f-b94e-30e98c8e7252/save.mp3');
  backgroundMusic = loadSound('https://cdn.glitch.global/3abaef36-1a74-452f-b94e-30e98c8e7252/background.mp3');
}

function setup() {
  createCanvas(800, 600);
  background(255);
  noStroke();
  
  // Draw the color palette once
  drawPalette();
  
  // Set default color to black
  currentColor = 'black';
  
  // Set up oscillator for brush sound
  osc = new p5.Oscillator('sine');
  osc.amp(0);
  osc.start();
  
  // Calculate total pixels for canvas fill percentage (excluding palette)
  totalPixels = (width - paletteWidth) * height;
  
  // Start background music loop
  backgroundMusic.setVolume(0.3);
  backgroundMusic.loop();
  
  // Start the musical loop
  startMusicLoop();
}

function startMusicLoop() {
  // Clear any existing interval
  if (loopInterval) clearInterval(loopInterval);
  
  // Calculate interval time based on BPM
  let intervalTime = (60 / bpm) * 1000;
  
  // Set up the new interval
  loopInterval = setInterval(playNextBeat, intervalTime);
}

function playNextBeat() {
  // Play a note based on the current beat and canvas fill
  let fillPercentage = filledPixels / totalPixels;
  
  // Increase complexity as canvas fills
  let notesToPlay = Math.max(1, Math.floor(fillPercentage * 4));
  
  for (let i = 0; i < notesToPlay; i++) {
    // Select notes based on current beat and canvas state
    let noteIndex = (currentBeat + i * 2) % notes.length;
    let note = notes[noteIndex];
    
    // Create a synth note
    let synth = new p5.MonoSynth();
    synth.play(midiToFreq(note), 0.1, 0, 0.3);
  }
  
  // Advance the beat
  currentBeat = (currentBeat + 1) % 8;
  
  // Adjust tempo based on canvas fill
  if (Math.floor(fillPercentage * 10) > Math.floor(lastFilledPercentage * 10)) {
    bpm = 80 + fillPercentage * 60; // Gradually increase from 80 to 140 BPM
    startMusicLoop(); // Restart loop with new tempo
    lastFilledPercentage = fillPercentage;
  }
}

function draw() {
  // Draw on the canvas when the mouse is pressed and dragged
  if (mouseIsPressed && mouseX > paletteWidth) {
    stroke(currentColor);
    strokeWeight(5);
    line(prevX, prevY, mouseX, mouseY); // Draw a line from the previous mouse position to the current one
    
    // Play brush sound with pitch variation based on Y position
    let pitch = map(mouseY, 0, height, 800, 200);
    osc.freq(pitch);
    osc.amp(0.1, 0.05);
    
    // Estimate filled pixels for canvas percentage calculation
    filledPixels += 5; // Approximate number of pixels in a brush stroke
    filledPixels = constrain(filledPixels, 0, totalPixels);
  } else {
    // Fade out the oscillator when not drawing
    osc.amp(0, 0.5);
  }
  
  // Update the previous mouse position
  prevX = mouseX;
  prevY = mouseY;
}

function mousePressed() {
  // Change the current color when clicking on the palette
  if (mouseX < paletteWidth) {
    for (let i = 0; i < colors.length; i++) {
      if (mouseY > i * 50 && mouseY < (i + 1) * 50) {
        currentColor = colors[i];
        
        // Play color selection sound
        colorSounds[i].play();
        
        break;
      }
    }
  } else {
    // Initialize for drawing
    prevX = mouseX;
    prevY = mouseY;
  }
}

function drawPalette() {
  // Draw the color palette
  for (let i = 0; i < colors.length; i++) {
    fill(colors[i]);
    rect(0, i * 50, paletteWidth, 50);
  }
}

function keyPressed() {
  // Clear the canvas (including the palette) when the 'C' key is pressed
  if (key === 'c' || key === 'C') {
    background(255);
    drawPalette(); // Redraw the palette
    
    // Play clear sound
    clearSound.play();
    
    // Reset filled pixels count
    filledPixels = 0;
    
    // Reset tempo
    bpm = 80;
    startMusicLoop();
  }
  
  // Save the canvas when the 'S' key is pressed
  if (key === 's' || key === 'S') {
    saveCanvas('myPainting', 'png');
    
    // Play save sound
    saveSound.play();
  }
}

// Helper function to convert MIDI note to frequency
function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}