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
let submitSuccess = false;
let submitError = false;
let errorMessage = '';
let submissionInProgress = false; // Flag to prevent multiple submissions

// Add a variable to track the last key press time
let lastKeyPressTime = 0;
const KEY_DEBOUNCE_TIME = 150; // Milliseconds to wait between key presses

// Add a variable to track if the email modal is currently open
let emailModalOpen = false;

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
  
  // Create email modal when the game loads
  setupEmailModal();
}

// Create a simple email modal overlay
function setupEmailModal() {
  console.log("Setting up email modal...");
  
  // Create a modal dialog with inline styles
  const emailModal = document.createElement('div');
  emailModal.id = 'simple-email-modal';
  emailModal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(0,0,0,0.7); z-index:99999;';
  
  // Create the modal content
  emailModal.innerHTML = `
    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background-color:white; padding:20px; border-radius:8px; width:300px; text-align:center; font-family:sans-serif;">
      <h3 style="margin-top:0; color:#0078D7;">Enter Your Email</h3>
      <p>Get your detailed match results</p>
      <input type="email" id="simple-email-input" placeholder="your.email@example.com" 
             style="width:100%; padding:8px; box-sizing:border-box; border:2px solid #0078D7; border-radius:4px; font-size:16px;">
      <div style="margin-top:15px;">
        <button id="simple-email-submit" style="background-color:#0078D7; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; font-weight:bold;">Submit</button>
        <button id="simple-email-cancel" style="background-color:#f0f0f0; color:#333; border:none; padding:8px 16px; border-radius:4px; cursor:pointer; margin-left:10px;">Cancel</button>
      </div>
    </div>
  `;
  
  // Add the modal to the document body
  document.body.appendChild(emailModal);
  
  // Get references to elements
  const emailInput = document.getElementById('simple-email-input');
  const submitButton = document.getElementById('simple-email-submit');
  const cancelButton = document.getElementById('simple-email-cancel');
  
  // Add event listeners
  submitButton.addEventListener('click', function() {
    const email = emailInput.value.trim();
    if (email) {
      playerEmail = email;
      hideEmailModal();
      
      if (gameState === 'ended' && !emailSubmitted) {
        // Get the winner
        let winner = "";
        if (p1.health <= 0) {
          winner = "Player 2";
        } else if (p2.health <= 0) {
          winner = "Player 1";
        }
        submitMatchResults(winner);
      }
    } else {
      // Highlight the input if empty
      emailInput.style.borderColor = 'red';
      setTimeout(() => emailInput.style.borderColor = '#0078D7', 1000);
    }
  });
  
  cancelButton.addEventListener('click', function() {
    hideEmailModal();
  });
  
  emailInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const email = emailInput.value.trim();
      if (email) {
        playerEmail = email;
        hideEmailModal();
        
        if (gameState === 'ended' && !emailSubmitted) {
          // Get the winner
          let winner = "";
          if (p1.health <= 0) {
            winner = "Player 2";
          } else if (p2.health <= 0) {
            winner = "Player 1";
          }
          submitMatchResults(winner);
        }
      } else {
        // Highlight the input if empty
        emailInput.style.borderColor = 'red';
        setTimeout(() => emailInput.style.borderColor = '#0078D7', 1000);
      }
    }
  });
  
  // Close modal when clicking outside
  emailModal.addEventListener('click', function(e) {
    if (e.target === emailModal) {
      hideEmailModal();
    }
  });
  
  console.log("Email modal setup complete");
}

// Function to show the email modal
function showEmailModal() {
  const emailModal = document.getElementById('simple-email-modal');
  const emailInput = document.getElementById('simple-email-input');
  
  if (emailModal && emailInput) {
    emailModal.style.display = 'block';
    emailInput.focus();
    emailModalOpen = true;
    
    // If we already have an email, pre-fill it
    if (playerEmail) {
      emailInput.value = playerEmail;
    }
  }
}

// Function to hide the email modal
function hideEmailModal() {
  const emailModal = document.getElementById('simple-email-modal');
  if (emailModal) {
    emailModal.style.display = 'none';
    emailModalOpen = false;
  }
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
  
  if (!emailSubmitted) {
    // Email collection section
    fill(0);
    textSize(16);
    textAlign(CENTER, CENTER);
    
    // Keep text inside the white box with 10pt padding from the blue outline
    text("Enter your email to get", width/2, height/2 - 40);
    text("detailed match results:", width/2, height/2 - 15);
    
    // Draw the input box background
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
    
    // Get Results button
    if (drawXPButton("GET GAME RESULTS", width/2 - 100, height/2 + 50, 200, 40)) {
      if (!playerEmail) {
        // Show the email modal if no email entered yet
        showEmailModal();
      } else if (validateEmail(playerEmail)) {
        submitMatchResults(winner);
      } else {
        submitError = true;
        errorMessage = "Please enter a valid email address";
      }
    }
    
    // Show submission status
    if (submissionInProgress) {
      fill(0, 0, 150);
      textSize(12);
      textAlign(CENTER, CENTER);
      text("Submitting results...", width/2, height/2 + 100);
    }
    
    if (submitError) {
      fill(200, 0, 0);
      textSize(12);
      textAlign(CENTER, CENTER);
      text(errorMessage, width/2, height/2 + 100);
    }
  } else if (submitSuccess) {
    // Display detailed match statistics
    textAlign(CENTER, TOP);
    fill(0, 100, 0);
    textSize(18);
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
  }
  
  // Play again button - only show if email modal is not open
  if (!emailModalOpen && drawXPButton("PLAY AGAIN", width/2 - 80, height/2 + 150, 160, 40)) {
    resetGame();
  }
}

// Reset the game to start a new match
function resetGame() {
  // Reset players
  p1 = new Character(200, groundY, { left: 65, right: 68, up: 87, down: 83, attack: 67, shield: 16 });
  p2 = new Character(600, groundY, { left: 76, right: 222, up: 80, down: 186, attack: 188, shield: 16 });
  
  // Reset game state
  gameState = 'start';
  
  // Reset email variables
  emailSubmitted = false;
  submitSuccess = false;
  submitError = false;
  errorMessage = '';
  submissionInProgress = false;
  
  // We keep playerEmail so returning players don't need to re-enter it
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
  
  console.log('Submitting match data:', matchData);
  
  try {
    // Submit to Supabase
    const { data, error } = await supabase
      .from('match_results')
      .insert([matchData]);
    
    if (error) {
      console.error('Error submitting match data:', error);
      submitError = true;
      errorMessage = "Error: " + (error.message || "Unknown error");
    } else {
      console.log('Match data submitted successfully:', data);
      emailSubmitted = true;
      submitSuccess = true;
    }
  } catch (error) {
    console.error('Exception submitting match data:', error);
    submitError = true;
    errorMessage = "Error: " + (error.message || "Unknown error");
  } finally {
    submissionInProgress = false;
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
  // Don't process key presses when the email modal is open
  if (emailModalOpen) {
    return true; // Let the browser handle keyboard events for the modal
  }
  
  // Prevent default behavior for certain keys
  if (keyCode === 32) { // Space bar
    return false; // Prevent default behavior (page scrolling)
  }
  
  // Only process key presses if enough time has passed since the last one
  const currentTime = millis();
  if (currentTime - lastKeyPressTime < KEY_DEBOUNCE_TIME) {
    return false; // Ignore key press if it's too soon after the last one
  }
  lastKeyPressTime = currentTime;
  
  // Handle game state changes
  if (gameState === 'playing') {
    if (keyCode === 27) { // ESC key
      gameState = 'paused';
      return false;
    }
  } else if (gameState === 'paused') {
    if (keyCode === 27) { // ESC key
      gameState = 'playing';
      return false;
    }
  } else if (gameState === 'ended') {
    // Don't process other keys if we're in the email input
    if (keyCode === 82) { // 'R' key
      resetGame();
      return false;
    }
  }
  
  return true; // Allow default behavior for other keys
}

// Handle mouse clicks for buttons
function mousePressed() {
  // Don't process mouse clicks when the email modal is open
  if (emailModalOpen) {
    return false;
  }
  
  // Handle mouse clicks based on game state
  if (gameState === 'start') {
    // Check if start button is clicked
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 50 && mouseY < height/2 + 90) {
      startGame();
      return false; // Prevent default behavior
    }
  } else if (gameState === 'ended') {
    // Check if email input area is clicked
    if (!emailSubmitted && 
        mouseX > width/2 - 125 && mouseX < width/2 + 125 && 
        mouseY > height/2 && mouseY < height/2 + 30) {
      
      // Show the email modal
      showEmailModal();
      return false; // Prevent default behavior
    }
    
    // Check if GET GAME RESULTS button is clicked
    if (!emailSubmitted &&
        mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 50 && mouseY < height/2 + 90) {
      
      if (!playerEmail) {
        // Show the email modal if no email entered yet
        showEmailModal();
      } else {
        // Submit with existing email
        let winner = "";
        if (p1.health <= 0) {
          winner = "Player 2";
        } else if (p2.health <= 0) {
          winner = "Player 1";
        }
        submitMatchResults(winner);
      }
      return false; // Prevent default behavior
    }
    
    // Check if play again button is clicked
    if (mouseX > width/2 - 80 && mouseX < width/2 + 80 && 
        mouseY > height/2 + 150 && mouseY < height/2 + 190) {
      resetGame();
      return false; // Prevent default behavior
    }
  }
  return true; // Allow default behavior for other clicks
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

// Start a new game
function startGame() {
  gameState = 'playing';
  matchStartTime = millis(); // Record match start time
}