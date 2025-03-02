// Global variables
let p1, p2, groundY, gameState;
let matchStartTime; // Track when the match started
let matchDuration; // Track total match duration in seconds

// Supabase configuration - Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://zjtizhqbbombulphelwb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdGl6aHFiYm9tYnVscGhlbHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzU5NjIsImV4cCI6MjA1NjUxMTk2Mn0.fSd8LlvSxwPTgcY1p-k6GHk9IUMkYxDDyPzCvEnoU-Y';
let supabase;

// Email collection variables
let playerEmail = '';
let emailSubmitted = false;
let emailInputActive = false;
let submitSuccess = false;
let submitError = false;
let errorMessage = '';
let emailInputField; // DOM input element for email
let submissionInProgress = false; // Flag to prevent multiple submissions

// Add a variable to track the last key press time
let lastKeyPressTime = 0;
const KEY_DEBOUNCE_TIME = 150; // Milliseconds to wait between key presses

// Setup function to initialize the game
function setup() {
  createCanvas(800, 600);
  groundY = height - 50;
  // Player 1: A, D, W, S + C for attack + Left Shift for shield
  p1 = new Character(200, groundY, { left: 65, right: 68, up: 87, down: 83, attack: 67, shield: 16 }); // Player 1: WASD + C + Left Shift
  // Player 2: L, ', P, ; + , for attack + Right Shift for shield
  p2 = new Character(600, groundY, { left: 76, right: 222, up: 80, down: 186, attack: 188, shield: 16 }); // Player 2: L, ', P, ; + , + Right Shift
  gameState = 'start'; // Changed to start with menu
  
  // Set up key detection for right shift vs left shift
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  // Set the default font for the entire sketch
  textFont('monospace');
  
  // Initialize Supabase client
  try {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
  }
  
  // Create email input field directly (no container)
  emailInputField = createInput('');
  emailInputField.style('font-family', 'monospace');
  emailInputField.style('font-size', '16px');
  emailInputField.style('padding', '5px 10px');
  emailInputField.style('width', '250px');
  emailInputField.style('height', '30px');
  emailInputField.style('border', '2px solid #0078D7');
  emailInputField.style('border-radius', '5px');
  emailInputField.style('background-color', 'rgba(240, 248, 255, 0.95)');
  emailInputField.style('box-sizing', 'border-box');
  emailInputField.style('outline', 'none');
  emailInputField.style('position', 'absolute');
  emailInputField.style('z-index', '100');
  emailInputField.attribute('maxlength', '50');
  emailInputField.attribute('placeholder', 'Enter your email');
  emailInputField.position(-1000, -1000); // Position off-screen initially
  emailInputField.hide(); // Hide initially
  
  // Add event listener for input changes
  emailInputField.input(function() {
    playerEmail = this.value();
    console.log("Email input updated via DOM: " + playerEmail);
  });
}

// Global variables to track left and right shift states
let leftShiftPressed = false;
let rightShiftPressed = false;

// Handle keydown events to distinguish between left and right shift
function handleKeyDown(event) {
  if (event.keyCode === 16) { // Shift key
    if (event.location === 1) { // Left shift
      leftShiftPressed = true;
    } else if (event.location === 2) { // Right shift
      rightShiftPressed = true;
    }
  }
}

// Handle keyup events for shift keys
function handleKeyUp(event) {
  if (event.keyCode === 16) { // Shift key
    if (event.location === 1) { // Left shift
      leftShiftPressed = false;
    } else if (event.location === 2) { // Right shift
      rightShiftPressed = false;
    }
  }
}

// Draw function for the game loop
function draw() {
  if (gameState === 'start') {
    drawStartMenu();
  } else if (gameState === 'playing') {
    drawGame();
  } else if (gameState === 'paused') {
    drawPauseScreen();
  } else if (gameState === 'ended') {
    drawEndScreen();
  }
}

// Draw the Windows XP style start menu
function drawStartMenu() {
  // Windows XP blue gradient background
  drawWindowsBackground();
  
  // Title - changed to black
  fill(0); // Changed from white to black
  textSize(48);
  textAlign(CENTER, TOP);
  text("STICK FIGHTER", width/2, 60);
  
  // Player controls in Windows XP style boxes - centered and widened
  // Increased width from 200 to 250 and adjusted x positions for better centering
  drawControlsBox("PLAYER 1 CONTROLS", width/2 - 275, 200, 
                 ["A / D - Move Left/Right",
                  "W - Jump",
                  "S - Duck",
                  "C - Attack",
                  "LEFT SHIFT - Shield"], color(0, 120, 215), 250, 200, true); // Added true for black title
                  
  drawControlsBox("PLAYER 2 CONTROLS", width/2 + 25, 200,
                 ["L / ' - Move Left/Right",
                  "P - Jump",
                  "; - Duck",
                  ", - Attack",
                  "RIGHT SHIFT - Shield"], color(220, 0, 0), 250, 200, true); // Added true for black title
  
  // Start button - if clicked, start the game
  if (drawXPButton("START GAME", width/2 - 100, 450, 200, 50)) {
    gameState = 'playing';
    matchStartTime = millis(); // Record match start time
  }
}

// Draw the game
function drawGame() {
  // Draw background
  background(135, 206, 235); // Sky blue
  fill(34, 139, 34); // Forest green
  rect(0, groundY, width, 50); // Ground

  // Update game logic if playing
  // Update player shield states based on the correct shift key
  p1.shieldPressed = leftShiftPressed;
  p2.shieldPressed = rightShiftPressed;
  
  p1.update();
  p2.update();

  // Check for attack collisions - only if target is not guarding
  let p1Attack = p1.getAttackBox();
  let p2Body = p2.getBodyBox();
  if (p1Attack && rectIntersect(p1Attack, p2Body) && !p2.isInHitCooldown() && !p2.isGuarding()) {
    p2.health -= 10;
    p2.setHitCooldown(30); // Set cooldown to prevent multiple hits from same attack
    
    // Track punch landed and damage dealt
    p1.punchesLanded++;
    p1.damageDealt += 10;
  }

  let p2Attack = p2.getAttackBox();
  let p1Body = p1.getBodyBox();
  if (p2Attack && rectIntersect(p2Attack, p1Body) && !p1.isInHitCooldown() && !p1.isGuarding()) {
    p1.health -= 10;
    p1.setHitCooldown(30); // Set cooldown to prevent multiple hits from same attack
    
    // Track punch landed and damage dealt
    p2.punchesLanded++;
    p2.damageDealt += 10;
  }

  // Check for game end
  if (p1.health <= 0 || p2.health <= 0) {
    gameState = 'ended';
    // Calculate match duration in seconds
    matchDuration = (millis() - matchStartTime) / 1000;
  }

  // Draw characters
  p1.draw();
  p2.draw();

  // Draw health bars with Windows XP style
  drawXPHealthBar(p1.x - 25, p1.y - p1.height - 15, 50, 10, p1.health, "P1");
  drawXPHealthBar(p2.x - 25, p2.y - p2.height - 15, 50, 10, p2.health, "P2");

  // Display compact controls reminder at the top
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, width, 30);
  fill(255);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("SPACE = PAUSE   |   P1: WASD+C+SHIFT   |   P2: L'P;+,+SHIFT", width/2, 15);

  // Update key states at the end of each frame
  updateKeyStates();
}

// Draw the pause screen
function drawPauseScreen() {
  // First draw the game in the background (frozen)
  drawGame();
  
  // Semi-transparent overlay
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);
  
  // Windows XP style pause dialog
  fill(236, 233, 216);
  stroke(0, 84, 227);
  strokeWeight(3);
  rect(width/2 - 250, height/2 - 200, 500, 400, 10);
  
  // Title bar
  fill(0, 84, 227);
  noStroke();
  rect(width/2 - 250, height/2 - 200, 500, 30, 10, 10, 0, 0);
  
  // Title text
  fill(255); // White text for the pause dialog title
  textSize(16);
  textAlign(LEFT, CENTER);
  text(" GAME PAUSED", width/2 - 240, height/2 - 185);
  
  // Close button (X)
  fill(236, 233, 216);
  stroke(0);
  rect(width/2 + 220, height/2 - 200, 30, 30);
  textSize(20);
  fill(0);
  noStroke();
  text("×", width/2 + 230, height/2 - 185);
  
  // Controls display
  fill(0);
  textSize(16);
  textAlign(CENTER, TOP);
  text("CONTROLS", width/2, height/2 - 150);
  
  // Player controls in Windows XP style boxes (wider and better positioned)
  drawControlsBox("PLAYER 1 CONTROLS", width/2 - 225, height/2 - 110, 
                 ["A / D - Move Left/Right",
                  "W - Jump",
                  "S - Duck",
                  "C - Attack",
                  "LEFT SHIFT - Shield"], color(0, 120, 215), 210, 150);
                  
  drawControlsBox("PLAYER 2 CONTROLS", width/2 + 15, height/2 - 110,
                 ["L / ' - Move Left/Right",
                  "P - Jump",
                  "; - Duck",
                  ", - Attack",
                  "RIGHT SHIFT - Shield"], color(220, 0, 0), 210, 150);
  
  // Resume button - if clicked, resume the game
  if (drawXPButton("RESUME GAME", width/2 - 100, height/2 + 120, 200, 40)) {
    gameState = 'playing';
  }
}

// Draw the end screen
function drawEndScreen() {
  // Draw background
  background(236, 233, 216); // Windows XP background color
  
  // Windows XP style dialog box
  fill(255);
  stroke(0, 84, 227);
  strokeWeight(3);
  rect(width/2 - 200, height/2 - 200, 400, 400, 10);
  
  // Title bar
  fill(0, 84, 227);
  noStroke();
  rect(width/2 - 200, height/2 - 200, 400, 30, 10, 10, 0, 0);
  
  // Title text
  fill(255);
  textSize(16);
  textAlign(LEFT, CENTER);
  text(" GAME OVER", width/2 - 190, height/2 - 185);
  
  // Winner text
  fill(0);
  textSize(24);
  textAlign(CENTER, CENTER);
  let winner = "";
  if (p1.health <= 0) {
    winner = "Player 2";
    text("Player 2 wins!", width/2, height/2 - 150);
  } else if (p2.health <= 0) {
    winner = "Player 1";
    text("Player 1 wins!", width/2, height/2 - 150);
  }
  
  // Trophy icon
  fill(255, 215, 0); // Gold
  noStroke();
  ellipse(width/2, height/2 - 100, 60, 60);
  fill(255, 235, 0);
  rect(width/2 - 20, height/2 - 100, 40, 40);
  
  // Email collection section
  fill(0);
  textSize(16);
  textAlign(CENTER, CENTER);
  
  if (!emailSubmitted) {
    // Keep text inside the white box with 10pt padding from the blue outline
    text("Enter your email to get", width/2, height/2 - 40);
    text("detailed match results:", width/2, height/2 - 15);
    
    // Only draw the input box background when the DOM input is NOT active
    if (!emailInputActive) {
      // Normal input box (only drawn when DOM input is not visible)
      fill(255);
      stroke(180);
      strokeWeight(1);
      rect(width/2 - 125, height/2, 250, 30, 5);
      
      // Draw placeholder text when input is empty
      if (playerEmail === '') {
        fill(150);
        textAlign(LEFT, CENTER);
        text("Click to enter email", width/2 - 115, height/2 + 15);
      } else {
        // Show the email text when not active but has content
        fill(0);
        textAlign(LEFT, CENTER);
        text(playerEmail, width/2 - 115, height/2 + 15);
      }
    }
    
    // Get Results button - moved down slightly
    if (drawXPButton("GET GAME RESULTS", width/2 - 100, height/2 + 50, 200, 40)) {
      // Get the latest value from the input field if it's active
      if (emailInputActive) {
        playerEmail = emailInputField.value();
      }
      
      if (validateEmail(playerEmail)) {
        submitMatchResults(winner);
      } else {
        submitError = true;
        errorMessage = "Please enter a valid email address";
      }
    }
    
    // Show submission status - adjusted position
    if (submissionInProgress) {
      fill(0, 0, 150);
      textSize(12);
      textAlign(CENTER, CENTER);
      text("Submitting results...", width/2, height/2 + 100);
    }
    // Display error message if there is one - adjusted position
    else if (submitError) {
      fill(255, 0, 0);
      textSize(12);
      textAlign(CENTER, CENTER);
      text(errorMessage, width/2, height/2 + 100);
    }
    
    // Privacy notice removed
  } else if (submitSuccess) {
    // Display player statistics instead of generic success message
    textAlign(CENTER, TOP);
    fill(0, 100, 0);
    textSize(16);
    text("Match Statistics", width/2, height/2 - 40);
    
    // Draw a line to separate the title from stats
    stroke(0, 100, 0);
    strokeWeight(1);
    line(width/2 - 150, height/2 - 20, width/2 + 150, height/2 - 20);
    
    // Display match duration
    noStroke();
    textAlign(LEFT, TOP);
    textSize(14);
    fill(0);
    text("Match Duration: " + matchDuration.toFixed(1) + " seconds", width/2 - 150, height/2 - 10);
    
    // Player 1 stats
    fill(0, 120, 215); // Player 1 color
    text("Player 1:", width/2 - 150, height/2 + 15);
    fill(0);
    textSize(12);
    text("Punches Thrown: " + p1.punchesThrown, width/2 - 140, height/2 + 35);
    text("Punches Landed: " + p1.punchesLanded, width/2 - 140, height/2 + 55);
    text("Damage Dealt: " + p1.damageDealt, width/2 - 140, height/2 + 75);
    text("Blocks: " + p1.blocksPerformed, width/2 - 140, height/2 + 95);
    
    // Player 2 stats
    fill(220, 0, 0); // Player 2 color
    textSize(14);
    text("Player 2:", width/2 + 10, height/2 + 15);
    fill(0);
    textSize(12);
    text("Punches Thrown: " + p2.punchesThrown, width/2 + 20, height/2 + 35);
    text("Punches Landed: " + p2.punchesLanded, width/2 + 20, height/2 + 55);
    text("Damage Dealt: " + p2.damageDealt, width/2 + 20, height/2 + 75);
    text("Blocks: " + p2.blocksPerformed, width/2 + 20, height/2 + 95);
    
    // Email confirmation
    textAlign(CENTER, TOP);
    textSize(11);
    fill(0, 100, 0);
    text("Full results sent to: " + playerEmail, width/2, height/2 + 120);
  } else {
    // Error message - better spacing
    fill(255, 0, 0);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("There was an error sending your results.", width/2, height/2 + 10);
    text("Please try again later.", width/2, height/2 + 40);
  }
  
  // Play Again button - moved down for better spacing
  if (drawXPButton("PLAY AGAIN", width/2 - 80, height/2 + 150, 160, 40)) {
    // Reset the game
    resetGame();
  }
}

// Reset the game
function resetGame() {
  p1.health = 100;
  p2.health = 100;
  p1.x = 200;
  p2.x = 600;
  p1.y = groundY;
  p2.y = groundY;
  p1.state = 'idle';
  p2.state = 'idle';
  
  // Reset statistics
  p1.punchesThrown = 0;
  p1.punchesLanded = 0;
  p1.blocksPerformed = 0;
  p1.damageDealt = 0;
  p1.jumpsPerformed = 0;
  p1.timeSpentDucking = 0;
  
  p2.punchesThrown = 0;
  p2.punchesLanded = 0;
  p2.blocksPerformed = 0;
  p2.damageDealt = 0;
  p2.jumpsPerformed = 0;
  p2.timeSpentDucking = 0;
  
  // Reset email collection variables
  playerEmail = '';
  emailSubmitted = false;
  emailInputActive = false;
  submitSuccess = false;
  submitError = false;
  errorMessage = '';
  submissionInProgress = false; // Reset submission flag
  
  // Reset the DOM input field
  emailInputField.value('');
  emailInputField.hide();
  emailInputField.position(-1000, -1000); // Move off-screen
  
  gameState = 'start';
}

// Validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Submit match results to Supabase
async function submitMatchResults(winner) {
  // Prevent multiple submissions
  if (submissionInProgress || emailSubmitted) {
    console.log('Submission already in progress or completed, ignoring duplicate request');
    return;
  }
  
  // Set flag to prevent multiple submissions
  submissionInProgress = true;
  
  // If email input is active, get the latest value
  if (emailInputActive) {
    playerEmail = emailInputField.value();
    emailInputActive = false;
    emailInputField.hide();
    emailInputField.position(-1000, -1000); // Move off-screen
  }
  
  // Prepare match data
  const matchData = {
    email: playerEmail,
    winner: winner,
    match_duration: matchDuration.toFixed(2),
    date: new Date().toISOString(),
    p1_stats: {
      punches_thrown: p1.punchesThrown,
      punches_landed: p1.punchesLanded,
      blocks_performed: p1.blocksPerformed,
      damage_dealt: p1.damageDealt,
      jumps_performed: p1.jumpsPerformed,
      time_spent_ducking: p1.timeSpentDucking
    },
    p2_stats: {
      punches_thrown: p2.punchesThrown,
      punches_landed: p2.punchesLanded,
      blocks_performed: p2.blocksPerformed,
      damage_dealt: p2.damageDealt,
      jumps_performed: p2.jumpsPerformed,
      time_spent_ducking: p2.timeSpentDucking
    }
  };
  
  try {
    // Insert data into Supabase
    const { data, error } = await supabase
      .from('match_results')
      .insert([matchData]);
      
    if (error) {
      console.error('Error submitting match results:', error);
      submitError = true;
      errorMessage = "Error saving results: " + error.message;
      submissionInProgress = false; // Reset flag on error to allow retry
    } else {
      console.log('Match results submitted successfully:', data);
      emailSubmitted = true;
      submitSuccess = true;
      // Keep submissionInProgress true to prevent further submissions
    }
  } catch (error) {
    console.error('Exception submitting match results:', error);
    submitError = true;
    errorMessage = "Error: " + error.message;
    submissionInProgress = false; // Reset flag on error to allow retry
  }
}

// Draw a Windows XP style controls box
function drawControlsBox(title, x, y, controlsList, boxColor, boxWidth = 200, boxHeight = 200, whiteTitle = false) {
  // Box
  fill(255);
  stroke(boxColor);
  strokeWeight(2);
  rect(x, y, boxWidth, boxHeight, 8);
  
  // Title bar
  fill(boxColor);
  noStroke();
  rect(x, y, boxWidth, 30, 8, 8, 0, 0);
  
  // Title text - option for white title
  if (whiteTitle) {
    fill(255); // White text for title
  } else {
    fill(0); // Default to black title text
  }
  textSize(14);
  textAlign(CENTER, CENTER);
  text(title, x + boxWidth/2, y + 15);
  
  // Controls text
  fill(0);
  textSize(14);
  
  // Calculate available space for controls
  let availableHeight = boxHeight - 50; // Subtract title bar height (30) and top padding (20)
  let itemHeight = availableHeight / controlsList.length;
  
  // Left-aligned text with fixed margin, but evenly spaced vertically
  textAlign(LEFT, CENTER);
  for (let i = 0; i < controlsList.length; i++) {
    // Position each control item with left margin of 10px and evenly spaced vertically
    let itemY = y + 50 + (i * itemHeight) + (itemHeight / 2);
    text(controlsList[i], x + 10, itemY);
  }
}

// Draw a Windows XP style button
function drawXPButton(label, x, y, w, h) {
  let isHovering = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  let isPressed = isHovering && mouseIsPressed;
  
  // Button gradient - changed to white
  if (isPressed) {
    fill(220, 220, 220); // Pressed color - light gray
  } else if (isHovering) {
    fill(240, 240, 240); // Hover color - lighter gray
  } else {
    fill(255, 255, 255); // Normal color - white
  }
  
  // Button shape
  stroke(0, 60, 116);
  strokeWeight(1);
  rect(x, y, w, h, 5);
  
  // Button text - already black
  fill(0);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(label, x + w/2, y + h/2);
  
  // Return true if clicked (for compatibility with mousePressed function)
  return isHovering && mouseIsPressed;
}

// Draw Windows XP style health bar
function drawXPHealthBar(x, y, w, h, health, label) {
  // Border
  stroke(100);
  strokeWeight(1);
  fill(200);
  rect(x, y, w, h, 3);
  
  // Health fill with gradient
  noStroke();
  let healthWidth = w * (health / 100);
  
  // Gradient colors based on health
  let c1, c2;
  if (health > 70) {
    c1 = color(0, 200, 0);
    c2 = color(100, 255, 100);
  } else if (health > 30) {
    c1 = color(255, 200, 0);
    c2 = color(255, 255, 0);
  } else {
    c1 = color(255, 0, 0);
    c2 = color(255, 100, 100);
  }
  
  // Draw gradient
  for (let i = 0; i < healthWidth; i++) {
    let inter = map(i, 0, w, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(x + i, y, x + i, y + h);
  }
  
  // Label
  textSize(10);
  textAlign(CENTER, CENTER);
  text(label, x + w/2, y + h/2);
}

// Draw Windows XP background
function drawWindowsBackground() {
  // Blue gradient background
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color(0, 120, 215), color(0, 80, 160), inter);
    stroke(c);
    line(0, y, width, y);
  }
  
  // Add some "clouds" in the bottom right
  noStroke();
  fill(255, 255, 255, 30);
  ellipse(width - 100, height - 100, 300, 200);
  ellipse(width - 200, height - 150, 250, 180);
}

// Draw Windows logo
function drawWindowsLogo(x, y, size) {
  let s = size / 4;
  noStroke();
  
  // Red square
  fill(246, 83, 20);
  rect(x, y, s, s);
  
  // Green square
  fill(124, 187, 0);
  rect(x + s, y, s, s);
  
  // Blue square
  fill(0, 161, 241);
  rect(x, y + s, s, s);
  
  // Yellow square
  fill(255, 187, 0);
  rect(x + s, y + s, s, s);
}

// Handle key presses
function keyPressed() {
  console.log("Key pressed: " + key + ", keyCode: " + keyCode);
  
  // If email input is active, don't handle any keyboard events
  if (gameState === 'ended' && emailInputActive) {
    return true; // Let the DOM input handle all keyboard events
  }
  
  // Only handle space bar for pausing when in playing or paused state
  if (keyCode === 32) { // Space bar
    if (gameState === 'playing') {
      gameState = 'paused';
      return false; // Prevent default behavior
    } else if (gameState === 'paused') {
      gameState = 'playing';
      return false; // Prevent default behavior
    }
  }
  
  // Only allow 'R' key to reset game when not typing in email field
  if (gameState === 'ended' && !emailInputActive && keyCode === 82) { // 'R' key
    resetGame();
    return false; // Prevent default behavior
  }
  
  // Start game with ENTER key only in start state
  if (gameState === 'start' && keyCode === ENTER) {
    gameState = 'playing';
    matchStartTime = millis(); // Record match start time
    return false; // Prevent default behavior
  }
  
  // Allow default behavior for other keys
  return true;
}

// Handle mouse clicks for buttons
function mousePressed() {
  console.log("Mouse pressed at: " + mouseX + ", " + mouseY + " | Game state: " + gameState);
  
  if (gameState === 'start') {
    // Check if start button is clicked - updated y coordinates to match new position
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > 450 && mouseY < 500) {
      gameState = 'playing';
      matchStartTime = millis(); // Record match start time
      return false; // Prevent default behavior
    }
  } else if (gameState === 'paused') {
    // Check if resume button is clicked
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 120 && mouseY < height/2 + 160) {
      gameState = 'playing';
      return false; // Prevent default behavior
    }
  } else if (gameState === 'ended') {
    // Check if email input field is clicked - updated coordinates
    if (!emailSubmitted && 
        mouseX > width/2 - 125 && mouseX < width/2 + 125 && 
        mouseY > height/2 && mouseY < height/2 + 30) {
      
      // Toggle email input active state
      emailInputActive = true;
      
      // Get the canvas element for positioning
      let canvas = document.querySelector('canvas');
      let canvasRect = canvas.getBoundingClientRect();
      
      // Calculate scaling factors in case the canvas is displayed at a different size
      let scaleX = canvasRect.width / width;
      let scaleY = canvasRect.height / height;
      
      // Use fixed coordinates relative to the canvas, adjusted for scaling
      let fixedX = width/2 - 125; // Left edge of our drawn box
      let fixedY = height/2; // Top edge of our drawn box - updated
      
      // Calculate the absolute position in the window with scaling
      let absoluteX = canvasRect.left + fixedX * scaleX;
      let absoluteY = canvasRect.top + fixedY * scaleY;
      
      console.log("Canvas rect:", canvasRect);
      console.log("Scale factors:", scaleX, scaleY);
      console.log("Fixed position:", fixedX, fixedY);
      console.log("Absolute position:", absoluteX, absoluteY);
      
      // Position and show the input field
      emailInputField.position(absoluteX, absoluteY);
      emailInputField.show();
      emailInputField.elt.focus();
      
      console.log("Email input field activated");
      return false; // Prevent default behavior
    } 
    // Check if clicking outside the input field - updated coordinates
    else if (emailInputActive) {
      // Check if click is outside the input area
      if (!(mouseX > width/2 - 125 && mouseX < width/2 + 125 && 
            mouseY > height/2 && mouseY < height/2 + 30)) {
        
        // Update playerEmail with the current value of the input field
        playerEmail = emailInputField.value();
        emailInputActive = false;
        
        // Hide the input field
        emailInputField.hide();
        emailInputField.position(-1000, -1000); // Move off-screen
        
        console.log("Email input field deactivated, value saved: " + playerEmail);
      }
    }
    
    // Check if play again button is clicked - updated coordinates
    if (mouseX > width/2 - 80 && mouseX < width/2 + 80 && 
        mouseY > height/2 + 150 && mouseY < height/2 + 190) {
      resetGame();
      return false; // Prevent default behavior
    }
    
    // Check if get results button is clicked - updated coordinates
    if (!emailSubmitted && !submissionInProgress &&
        mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 50 && mouseY < height/2 + 90) {
      if (validateEmail(playerEmail)) {
        let winner = "";
        if (p1.health <= 0) {
          winner = "Player 2";
        } else if (p2.health <= 0) {
          winner = "Player 1";
        }
        submitMatchResults(winner);
      } else {
        submitError = true;
        errorMessage = "Please enter a valid email address";
      }
      return false; // Prevent default behavior
    }
  }
  
  return true; // Allow default behavior for other mouse clicks
}

// Character class
class Character {
  constructor(x, y, controls) {
    this.x = x; // Center x position
    this.y = y; // Feet y position (bottom)
    this.vx = 0; // X velocity
    this.vy = 0; // Y velocity
    this.state = 'idle'; // Current state: idle, walking, jumping, attacking, ducking, guarding
    this.facingRight = true; // Direction facing
    this.health = 100; // Health points
    this.controls = controls; // Control key codes
    this.attackTimer = 0; // Frames remaining in attack
    this.hitCooldown = 0; // Frames remaining in hit cooldown
    this.walkTimer = 0; // Frames for walking animation
    this.walkPose = 0; // 0 or 1 for walking animation
    this.jumpForce = -10; // Initial jump velocity
    this.gravity = 0.5; // Gravity acceleration
    this.width = 50; // Collision box width
    this.height = 100; // Collision box height
    this.normalHeight = 100; // Normal height when standing
    this.duckHeight = 60; // Height when ducking
    this.shieldPressed = false; // Tracks if shield button is pressed (set externally)
    
    // Match statistics tracking
    this.punchesThrown = 0;
    this.punchesLanded = 0;
    this.blocksPerformed = 0;
    this.damageDealt = 0;
    this.jumpsPerformed = 0;
    this.timeSpentDucking = 0; // In frames
    this.wasJumping = false; // Helper to track jump starts
    this.wasDucking = false; // Helper to track ducking
  }

  update() {
    if (gameState !== 'playing') return;

    // Reset state if not attacking or ducking
    if (this.state !== 'attacking' && this.state !== 'ducking' && this.state !== 'guarding') {
      this.state = 'idle';
      this.height = this.normalHeight;
    }

    // Handle input - can't move while guarding
    if (this.state !== 'guarding') {
      if (keyIsDown(this.controls.left)) {
        this.vx = -5;
        this.facingRight = false;
        if (this.state !== 'attacking' && this.state !== 'ducking' && this.y === groundY) {
          this.state = 'walking';
        }
      } else if (keyIsDown(this.controls.right)) {
        this.vx = 5;
        this.facingRight = true;
        if (this.state !== 'attacking' && this.state !== 'ducking' && this.y === groundY) {
          this.state = 'walking';
        }
      } else {
        this.vx = 0;
      }

      if (keyIsDown(this.controls.up) && this.y === groundY && this.state !== 'ducking' && this.state !== 'guarding') {
        this.vy = this.jumpForce;
        this.state = 'jumping';
        
        // Track jump (only count when starting a jump)
        if (!this.wasJumping) {
          this.jumpsPerformed++;
          this.wasJumping = true;
        }
      }
    } else {
      // No movement while guarding
      this.vx = 0;
    }

    // Check for guarding with dedicated shield button
    if (this.shieldPressed && this.y === groundY && this.state !== 'jumping' && this.state !== 'attacking') {
      // Guard when shield button is pressed
      if (this.state !== 'guarding') {
        // Only increment when first entering guard state
        this.blocksPerformed++;
      }
      this.state = 'guarding';
      this.vx = 0; // Can't move while guarding
      
      // Can crouch and guard at the same time
      if (keyIsDown(this.controls.down)) {
        this.height = this.duckHeight; // Crouch while guarding
      } else {
        this.height = this.normalHeight; // Stand while guarding
      }
    } 
    // Check for ducking (without guarding)
    else if (keyIsDown(this.controls.down) && this.y === groundY && this.state !== 'attacking' && this.state !== 'jumping') {
      // Duck when only down is pressed
      this.state = 'ducking';
      this.height = this.duckHeight;
      
      // Track ducking time
      this.timeSpentDucking++;
      this.wasDucking = true;
    } 
    // Return to normal when keys are released
    else if (this.state === 'ducking' || this.state === 'guarding') {
      if (!keyIsDown(this.controls.down) && !this.shieldPressed) {
        this.state = 'idle';
        this.height = this.normalHeight;
      }
    }

    // Attack - only if not ducking or guarding
    if (keyIsDown(this.controls.attack) && this.attackTimer === 0 && 
        this.state !== 'ducking' && this.state !== 'guarding') {
      this.state = 'attacking';
      this.attackTimer = 30; // Attack lasts 30 frames
      
      // Track punch thrown
      this.punchesThrown++;
    }

    // Apply physics
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Keep within canvas bounds
    if (this.x < this.width / 2) this.x = this.width / 2;
    if (this.x > width - this.width / 2) this.x = width - this.width / 2;

    // Ground collision
    if (this.y > groundY) {
      this.y = groundY;
      this.vy = 0;
      if (this.state === 'jumping') {
        this.state = 'idle';
        // Reset jump tracking when landing
        this.wasJumping = false;
      }
    }

    // Update timers and states
    if (this.state === 'walking' && this.vx !== 0) {
      this.walkTimer++;
      if (this.walkTimer >= 10) {
        this.walkTimer = 0;
        this.walkPose = 1 - this.walkPose;
      }
    } else if (this.vx === 0 && this.state === 'walking') {
      this.state = 'idle';
      this.walkTimer = 0;
      this.walkPose = 0;
    }

    if (this.attackTimer > 0) {
      this.attackTimer--;
      if (this.attackTimer === 0 && this.state === 'attacking') {
        this.state = 'idle';
      }
    }

    // Update hit cooldown
    if (this.hitCooldown > 0) {
      this.hitCooldown--;
    }

    // Update state based on movement if not in special states
    if (this.state !== 'attacking' && this.state !== 'ducking' && this.state !== 'guarding') {
      if (this.vy !== 0) {
        this.state = 'jumping';
      } else if (this.vx !== 0 && this.y === groundY) {
        this.state = 'walking';
      } else if (this.vy === 0 && this.vx === 0) {
        this.state = 'idle';
      }
    }
    
    // Reset ducking flag if not ducking
    if (this.state !== 'ducking') {
      this.wasDucking = false;
    }
  }

  // Check if character is in hit cooldown
  isInHitCooldown() {
    return this.hitCooldown > 0;
  }

  // Set hit cooldown
  setHitCooldown(frames) {
    this.hitCooldown = frames;
  }

  // Check if character is guarding
  isGuarding() {
    return this.state === 'guarding';
  }

  draw() {
    push();
    translate(this.x, this.y);
    if (!this.facingRight) {
      scale(-1, 1);
    }

    // Draw body with hit feedback
    stroke(0);
    strokeWeight(5);
    
    // Flash red when hit, blue when guarding
    if (this.hitCooldown > 0 && this.hitCooldown % 6 < 3) {
      stroke(255, 0, 0);
    } else if (this.state === 'guarding') {
      stroke(0, 0, 255);
    }
    
    // Draw body based on state
    if (this.state === 'ducking') {
      // Shorter body when ducking
      line(0, -this.duckHeight, 0, 0); // Shorter spine
    } else if (this.state === 'guarding' && this.height === this.duckHeight) {
      // Crouched guarding
      line(0, -this.duckHeight, 0, 0); // Shorter spine
    } else {
      // Normal height for standing or standing guard
      line(0, -this.height, 0, 0); // Normal spine
    }

    // Draw head
    noStroke();
    fill(255, 224, 189); // Skin color
    if (this.state === 'ducking' || (this.state === 'guarding' && this.height === this.duckHeight)) {
      ellipse(0, -this.duckHeight, 20, 20);
    } else {
      ellipse(0, -this.height, 20, 20);
    }

    // Draw arms
    stroke(0);
    if (this.hitCooldown > 0 && this.hitCooldown % 6 < 3) {
      stroke(255, 0, 0);
    } else if (this.state === 'guarding') {
      stroke(0, 0, 255);
    }
    strokeWeight(3);
    
    if (this.state === 'guarding') {
      // Arms in blocking position
      let armY = this.height === this.normalHeight ? -this.height + 30 : -this.duckHeight + 20;
      line(0, armY, 15, armY - 5); // Right arm up
      line(0, armY, -15, armY - 5); // Left arm up
      
      // Draw shield effect
      noStroke();
      fill(0, 100, 255, 100); // Translucent blue
      let shieldY = this.height === this.normalHeight ? -this.height + 40 : -this.duckHeight + 10;
      arc(0, shieldY, 50, 50, -PI/2, PI/2, OPEN);
    } else if (this.state === 'attacking' && this.attackTimer > 15) {
      // Extend right arm for attack
      let armY = this.state === 'ducking' ? -this.duckHeight + 20 : -this.height + 20;
      line(0, armY, 30, armY);
      fill(255, 0, 0); // Red hand
      ellipse(30, armY, 10, 10);
    } else if (this.state === 'ducking') {
      // Arms when ducking
      line(0, -this.duckHeight + 20, -10, -this.duckHeight + 30); // Left arm
      line(0, -this.duckHeight + 20, 10, -this.duckHeight + 30);   // Right arm
    } else {
      // Normal arm positions
      line(0, -this.height + 20, -10, -this.height + 30); // Left arm
      line(0, -this.height + 20, 10, -this.height + 30);   // Right arm
    }

    // Draw legs
    stroke(0);
    if (this.hitCooldown > 0 && this.hitCooldown % 6 < 3) {
      stroke(255, 0, 0);
    } else if (this.state === 'guarding') {
      stroke(0, 0, 255);
    }
    strokeWeight(3);
    
    if (this.state === 'ducking' || (this.state === 'guarding' && this.height === this.duckHeight)) {
      // Crouched legs
      line(0, 0, -15, 5); // Left leg bent more
      line(0, 0, 15, 5);  // Right leg bent more
    } else if (this.state === 'walking') {
      if (this.walkPose === 0) {
        line(0, 0, -10, 10); // Left leg forward
        line(0, 0, 10, 10);  // Right leg back
      } else {
        line(0, 0, -5, 10);  // Left leg back
        line(0, 0, 5, 10);   // Right leg forward
      }
    } else if (this.state === 'jumping') {
      line(0, 0, -5, 5);   // Left leg bent
      line(0, 0, 5, 5);    // Right leg bent
    } else {
      line(0, 0, -10, 10); // Left leg straight
      line(0, 0, 10, 10);  // Right leg straight
    }

    pop();
  }

  getBodyBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      w: this.width,
      h: this.height
    };
  }

  getAttackBox() {
    if (this.state === 'attacking' && this.attackTimer > 15) {
      let handX = this.facingRight ? 30 : -30;
      let handY = -this.height + 20;
      let handWorldX = this.x + handX;
      let handWorldY = this.y + handY;
      let attackSize = 10;
      return {
        x: handWorldX - attackSize / 2,
        y: handWorldY - attackSize / 2,
        w: attackSize,
        h: attackSize
      };
    }
    return null;
  }
}

// Rectangle intersection function for collision detection
function rectIntersect(r1, r2) {
  return !(
    r2.x > r1.x + r1.w ||
    r2.x + r2.w < r1.x ||
    r2.y > r1.y + r1.h ||
    r2.y + r2.h < r1.y
  );
}

// Track key press states for better control
let previousKeyStates = {};

function keyIsJustPressed(keyCode) {
  let isPressed = keyIsDown(keyCode);
  let wasPressed = previousKeyStates[keyCode] || false;
  previousKeyStates[keyCode] = isPressed;
  return isPressed && !wasPressed;
}

// Update previous key states at the end of each frame
function updateKeyStates() {
  for (let key in previousKeyStates) {
    previousKeyStates[key] = keyIsDown(parseInt(key));
  }
}

// Helper function to set the default font - moved to a separate function for clarity
function setTextFont() {
  textFont('monospace');
}