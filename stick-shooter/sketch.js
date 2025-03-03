// Global variables
let gameState = 'start';
let p1;
let enemies = [];
let projectiles = [];
let powerUps = [];
let groundY;
let score = 0;
let gameStartTime;
let gameTimeLimit = 999999; // Effectively infinite time limit
let minGameDuration = 5; // Minimum game duration in seconds
let gameEndingTriggered = false;
let debugMode = false; // Debug mode disabled by default

// Mouse click tracking
let mouseWasPressed = false;

// Projectile arrays
let p1Projectiles = [];

// Projectile cooldown timers
let p1ShootCooldown = 0;
const SHOOT_COOLDOWN = 15; // Frames between shots

// Power-up variables
let powerUpTimer = 0;
const POWER_UP_INTERVAL = 600; // Frames between power-up spawns (less frequent)

// Target variables
let targetSpawnTimer = 0;
const TARGET_SPAWN_INTERVAL = 120; // Frames between target spawns

// Score animation variables
let scoreAnimations = [];

// Supabase configuration - Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://tpfdmjwrsuygqjcrfczl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZmRtandyc3V5Z3FqY3JmY3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5Njc2MzcsImV4cCI6MjA1NjU0MzYzN30.mLa1wtw1qi8gQN_lkrj-rZ4WST1fYf1i6SNOwAA273o';
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

// Pistol image
let pistolImg;

// Enemy variables
let enemySpawnTimer = 0;
const ENEMY_SPAWN_INTERVAL = 120; // Frames between enemy spawns

// Setup function to initialize the game
function setup() {
  // Create canvas and set it in the sketch-container
  let canvas = createCanvas(800, 600);
  canvas.parent('sketch-container');
  
  // Set up ground level
  groundY = height - 50;
  
  // Create player character
  // Player: A, D, W, S + Mouse for aiming and shooting
  p1 = new Character(400, groundY, { left: 65, right: 68, up: 87, down: 83 }, true);
  
  // Set initial game state
  gameState = 'start';
  
  // Set up email modal
  setupEmailModal();
  
  // Initialize key states for input handling
  updateKeyStates();
  
  // Initialize Supabase client
  try {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
  }
  
  // Set the default font for the entire sketch
  textFont('monospace');
  
  // Create pistol image if it doesn't exist
  if (!pistolImg) {
    pistolImg = createGraphics(30, 15);
    pistolImg.background(0, 0, 0, 0);
    pistolImg.fill(0);
    pistolImg.noStroke();
    pistolImg.rect(0, 3, 20, 9, 1);
    pistolImg.rect(15, 0, 15, 6, 1);
  }
  
  console.log("Setup complete. Game ready to start.");
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
        let winner = "Player 1";
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
          let winner = "Player 1";
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
  // Clear the canvas
  background(220);
  
  // Update key states
  updateKeyStates();
  
  // Draw the appropriate screen based on game state
  if (gameState === 'start') {
    drawStartMenu();
    
    // Check for start button click
    if (mouseIsPressed && !mouseWasPressed) {
      if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
          mouseY > height/2 + 80 && mouseY < height/2 + 130) {
        console.log("Start button clicked in draw!");
        startGame();
      }
    }
  } else if (gameState === 'playing') {
    drawGame();
    updateMuzzleFlashes();
    drawMuzzleFlashes();
  } else if (gameState === 'paused') {
    drawGameStatic();
    drawPauseScreen();
  } else if (gameState === 'ended') {
    drawEndScreen();
  }
  
  // Update mouse state
  mouseWasPressed = mouseIsPressed;
  
  // Reset key states
  resetKeyJustPressed();
}

// Draw the Windows XP style start menu
function drawStartMenu() {
  // Draw background
  drawWindowsBackground();
  
  // Draw title
  fill(0); // Black text
  textSize(48);
  textAlign(CENTER, CENTER);
  text("STICK SHOOTER", width/2, height/2 - 180);
  
  // Draw controls info - centered above the start button
  drawControlsBox(
    "Controls", 
    width/2 - 100, 
    height/2 - 120, 
    [
      "W: Jump",
      "A/D: Move",
      "Mouse: Aim",
      "Left Click: Shoot"
    ],
    color(0, 84, 227),
    200, // Match width with start button
    150  // Explicit height to avoid overlap
  );
  
  // Draw start button - simplified approach
  let isHovering = mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
                   mouseY > height/2 + 80 && mouseY < height/2 + 130;
  
  // Button background
  if (isHovering && mouseIsPressed) {
    fill(200); // Darker when pressed
  } else if (isHovering) {
    fill(240); // Lighter when hovering
  } else {
    fill(255); // White by default
  }
  
  stroke(0, 60, 116);
  strokeWeight(2);
  rect(width/2 - 100, height/2 + 80, 200, 50, 5);
  
  // Button text
  fill(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("START GAME", width/2, height/2 + 105);
}

// Draw the game
function drawGame() {
  // Draw background
  drawWindowsBackground();
  
  // Draw ground
  fill(100, 200, 100);
  rect(0, groundY, width, height - groundY);
  
  // Update and draw game elements
  updatePowerUps();
  updateProjectiles();
  updateEnemies();
  updateMuzzleFlashes();
  
  // Update player
  p1.update();
  p1.draw();
  
  // Draw muzzle flashes on top
  drawMuzzleFlashes();
  
  // Check for collisions
  checkProjectileHits();
  checkPowerUpCollection();
  
  // Draw game UI
  drawGameUI();
  
  // Check if game is over
  checkGameOver();
}

function updateEnemies() {
  // Spawn new enemies
  enemySpawnTimer++;
  if (enemySpawnTimer >= ENEMY_SPAWN_INTERVAL) {
    spawnEnemy();
    enemySpawnTimer = 0;
  }
  
  // Update and draw existing enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].draw();
    
    // Remove enemies that are off-screen or dead
    if (enemies[i].x < -50 || enemies[i].x > width + 50 || enemies[i].health <= 0) {
      if (enemies[i].health <= 0) {
        // Add score when enemy is defeated
        score += 100;
        addScoreAnimation(100, enemies[i].x, enemies[i].y - 30);
      }
      enemies.splice(i, 1);
    }
  }
}

function spawnEnemy() {
  // Spawn from right side of screen
  const x = width + 20;
  const y = groundY; // Position at ground level
  enemies.push(new Enemy(x, y));
}

function checkProjectileHits() {
  // Check for projectile hits on enemies
  for (let i = p1Projectiles.length - 1; i >= 0; i--) {
    let projectile = p1Projectiles[i];
    let hitDetected = false;
    
    // Check for hits on enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (projectile.checkCollision(enemies[j].getHitBox())) {
        enemies[j].takeDamage(projectile.damage);
        
        // Update player statistics
        if (projectile.owner === p1) {
          p1.shotsHit++;
          p1.damageDealt += projectile.damage;
        }
        
        // Check if enemy is defeated
        if (enemies[j].health <= 0) {
          // Add score
          score += 100;
          addScoreAnimation(100, enemies[j].x, enemies[j].y - 20);
          
          // Remove enemy
          enemies.splice(j, 1);
        }
        
        hitDetected = true;
        break;
      }
    }
    
    if (hitDetected) {
      // Remove projectile if it hit something
      p1Projectiles.splice(i, 1);
    }
  }
}

// Function to check for power-up collection
function checkPowerUpCollection() {
  // Get player hitbox
  let playerHitbox = p1.getHitBox();
  
  // Check for collisions with power-ups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let powerUp = powerUps[i];
    
    // Check if player collides with power-up
    if (
      playerHitbox.x < powerUp.x + powerUp.size/2 &&
      playerHitbox.x + playerHitbox.width > powerUp.x - powerUp.size/2 &&
      playerHitbox.y < powerUp.y + powerUp.size/2 + powerUp.floatOffset &&
      playerHitbox.y + playerHitbox.height > powerUp.y - powerUp.size/2 + powerUp.floatOffset
    ) {
      console.log("Power-up collected:", powerUp.type);
      
      // Apply power-up effect to player
      if (powerUp.type === 'health') {
        p1.health = min(p1.health + 25, p1.maxHealth);
        console.log("Health power-up collected! Health: " + p1.health);
      } else if (powerUp.type === 'shield') {
        p1.powerUps.shield = 600; // 10 seconds of shield (60 frames per second)
        console.log("Shield power-up collected!");
      } else if (powerUp.type === 'doubleDamage') {
        p1.powerUps.doubleDamage = 600; // 10 seconds of double damage
        console.log("Double damage power-up collected!");
      } else if (powerUp.type === 'rapidFire') {
        p1.powerUps.rapidFire = 600; // 10 seconds of rapid fire
        console.log("Rapid fire power-up collected!");
      }
      
      // Increment power-ups collected counter
      p1.powerUpsCollected++;
      
      // Add score animation
      addScoreAnimation(50, powerUp.x, powerUp.y - 20);
      
      // Remove collected power-up
      powerUps.splice(i, 1);
    }
  }
}

// Function to apply power-up effect
function applyPowerUp(character, type) {
  console.log("Applying power-up:", type);
  
  switch(type) {
    case 'health':
      character.health += 25;
      if (character.health > 100) character.health = 100;
      break;
    case 'rapidFire':
      character.powerUps.rapidFire = 300; // 5 seconds at 60 FPS
      break;
    case 'damage':
      character.powerUps.doubleDamage = 300; // 5 seconds at 60 FPS
      break;
    case 'shield':
      character.powerUps.shield = 300; // 5 seconds at 60 FPS
      break;
  }
}

// Draw game UI (health bars, etc.)
function drawGameUI() {
  // Draw health bar for player
  drawXPHealthBar(20, 20, 200, 20, p1.health, "Health");
  
  // Draw score - aligned with health bar
  textAlign(CENTER, CENTER);
  fill(0);
  textSize(20); // Slightly smaller to match health bar height
  text("Score: " + score, width/2, 30); // y=30 aligns with the center of the health bar
  
  // Draw power-up indicators
  let powerUpY = 50;
  textAlign(LEFT, TOP);
  textSize(14);
  fill(0);
  
  if (p1.rapidFireTimer > 0) {
    text("Rapid Fire: " + Math.ceil(p1.rapidFireTimer / 60) + "s", 20, powerUpY);
    powerUpY += 20;
  }
  
  if (p1.damageBoostTimer > 0) {
    text("Double Damage: " + Math.ceil(p1.damageBoostTimer / 60) + "s", 20, powerUpY);
    powerUpY += 20;
  }
  
  if (p1.shieldTimer > 0) {
    text("Shield: " + Math.ceil(p1.shieldTimer / 60) + "s", 20, powerUpY);
  }
  
  // Calculate match duration for statistics (but don't display timer)
  let currentTime = millis();
  matchDuration = (currentTime - matchStartTime) / 1000; // Convert to seconds
  
  // Draw shots fired counter
  textAlign(RIGHT, TOP);
  fill(0);
  text("Shots: " + p1.shotsFired, width - 20, 20);
  
  // Draw accuracy
  let accuracy = p1.shotsFired > 0 ? Math.round((p1.shotsHit / p1.shotsFired) * 100) : 0;
  text("Accuracy: " + accuracy + "%", width - 20, 40);
  
  // Draw score animations
  updateScoreAnimations();
}

function updateScoreAnimations() {
  for (let i = scoreAnimations.length - 1; i >= 0; i--) {
    let anim = scoreAnimations[i];
    
    // Update position
    anim.y -= 2;
    
    // Update alpha
    anim.alpha -= 5;
    
    // Draw score text
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, anim.alpha);
    textSize(16);
    text("+" + anim.points, anim.x, anim.y);
    
    // Remove animation if faded out
    if (anim.alpha <= 0) {
      scoreAnimations.splice(i, 1);
    }
  }
}

// Check if the game is over
function checkGameOver() {
  // In single player mode, game ends when:
  // 1. Player health reaches 0
  // Time limit check has been removed
  
  // Ensure we don't end the game too early
  if (matchDuration < minGameDuration) {
    // Force player health to be at least 1 during the minimum duration
    if (p1.health <= 0) {
      p1.health = 1;
      console.log("Prevented premature game over: Health restored to 1");
    }
    return;
  }
  
  // Check if player health is 0
  if (p1.health <= 0) {
    if (!gameEndingTriggered) {
      console.log("Game over: Player died");
      gameEndingTriggered = true;
      // Use setTimeout to delay the game state change slightly
      setTimeout(() => {
        if (gameState === 'playing') {
          gameState = 'ended';
        }
      }, 500);
    }
    return;
  }
  
  // Time limit check has been removed
}

// Draw the pause screen
function drawPauseScreen() {
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
  
  // Pause message
  fill(0, 100, 0);
  textSize(14);
  textAlign(CENTER, TOP);
  text("Game is paused. Enemies can't hurt you while paused.", width/2, height/2 - 150);
  
  // Controls display
  fill(0);
  textSize(16);
  textAlign(CENTER, TOP);
  text("CONTROLS", width/2, height/2 - 120);
  
  // Player controls in Windows XP style box (centered)
  drawControlsBox("PLAYER CONTROLS", width/2 - 125, height/2 - 80, 
                 ["A / D - Move Left/Right",
                  "W - Jump",
                  "Mouse - Aim",
                  "Left Click - Shoot",
                  "P - Pause/Resume"], color(0, 120, 215), 250, 150);
  
  // Game info
  fill(0);
  textSize(14);
  textAlign(CENTER, TOP);
  text("Current Score: " + score, width/2, height/2 + 90);
  
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
  
  // Game over text
  fill(0);
  textSize(24);
  textAlign(CENTER, CENTER);
  
  // Only show "You Died!" message since time limit has been removed
  text("You Died!", width/2, height/2 - 150);
  
  // Display final score
  textSize(32);
  text("Score: " + score, width/2, height/2 - 100);
  
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
        submitMatchResults("Player 1");
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
    
    // Player stats
    fill(0, 120, 215); // Player color
    text("Player:", width/2 - 150, height/2 + 15);
    fill(0);
    textSize(12);
    text("Shots Fired: " + p1.shotsFired, width/2 - 140, height/2 + 35);
    text("Shots Hit: " + p1.shotsHit, width/2 - 140, height/2 + 55);
    text("Accuracy: " + (p1.shotsFired > 0 ? Math.round((p1.shotsHit / p1.shotsFired) * 100) : 0) + "%", width/2 - 140, height/2 + 75);
    text("Power-ups: " + p1.powerUpsCollected, width/2 - 140, height/2 + 95);
    text("Final Score: " + score, width/2 - 140, height/2 + 115);
  }
  
  // Draw play again button with more prominence
  fill(0, 120, 215); // Windows blue color
  stroke(0, 84, 227);
  strokeWeight(2);
  rect(width/2 - 100, height/2 + 150, 200, 40, 5);
  
  fill(255); // White text
  noStroke();
  textSize(18);
  textAlign(CENTER, CENTER);
  text("Play Again", width/2, height/2 + 170);
}

// Reset the game to start a new match
function resetGame() {
  console.log("Resetting game");
  
  // Reset player
  p1 = new Character(400, groundY, { left: 65, right: 68, up: 87, down: 83 }, true);
  
  // Reset game state
  gameState = 'playing';
  gameEndingTriggered = false;
  
  // Reset score
  score = 0;
  
  // Clear projectiles
  p1Projectiles = [];
  
  // Clear power-ups
  powerUps = [];
  powerUpTimer = 0;
  
  // Clear targets
  targets = [];
  targetSpawnTimer = 0;
  
  // Clear score animations
  scoreAnimations = [];
  
  // Reset match timer
  matchStartTime = millis();
  matchDuration = 0;
  
  // Reset email submission status
  emailSubmitted = false;
  submitSuccess = false;
  submitError = false;
  errorMessage = "";
  submissionInProgress = false;
  
  console.log("Game reset complete. Player health:", p1.health);
}

// Validate email format
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Submit match results to Supabase
async function submitMatchResults(winner) {
  console.log("Submitting match results...");
  
  // Validate email
  if (!validateEmail(playerEmail)) {
    emailError = "Please enter a valid email address";
    return;
  }
  
  // Set email as submitted to prevent multiple submissions
  emailSubmitted = true;
  submissionInProgress = true;
  
  try {
    // Prepare match data
    const matchData = {
      email: playerEmail,
      game_name: "stick-shooter",
      match_duration: matchDuration,
      winner: winner,
      p1_stats: {
        shots_fired: p1.shotsFired,
        shots_hit: p1.shotsHit,
        damage_dealt: p1.damageDealt,
        score: score,
        power_ups_collected: p1.powerUpsCollected
      }
    };
    
    // Log the data being sent
    console.log("Sending match data to Supabase:", matchData);
    
    // Use Supabase client directly to insert data
    const { data, error } = await supabase
      .from('match_results')
      .insert([{
        email: matchData.email,
        game_name: matchData.game_name,
        winner: matchData.winner,
        match_duration: matchData.match_duration,
        p1_stats: matchData.p1_stats
      }]);
    
    if (error) {
      console.error("Failed to submit match results to Supabase:", error);
      submitError = true;
      errorMessage = "Failed to submit: " + error.message;
      emailSubmitted = false; // Allow retry
    } else {
      console.log("Match results submitted successfully to Supabase!", data);
      submitSuccess = true;
    }
  } catch (error) {
    console.error("Error submitting match results:", error);
    submitError = true;
    errorMessage = "Error: " + error.message;
    emailSubmitted = false; // Allow retry
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
  
  // Label with black text
  fill(0); // Set text color to black
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
  // Don't process game key presses when the email modal is open
  if (emailModalOpen) {
    return true; // Allow default behavior for typing in email field
  }
  
  // Game controls based on current state
  if (gameState === 'start') {
    if (keyCode === ENTER) {
      startGame();
    }
  } else if (gameState === 'playing') {
    if (keyCode === 80 || keyCode === 27) { // P or ESC key
      gameState = 'paused';
    }
  } else if (gameState === 'paused') {
    if (keyCode === 80) { // P key
      gameState = 'playing';
    }
  } else if (gameState === 'ended') {
    // Only allow 'R' key to restart if the email modal is not open
    if (keyCode === 82 && !emailModalOpen) { // R key
      resetGame();
      gameState = 'start';
    }
  }
  
  return false; // Prevent default behavior for game keys
}

// Handle mouse clicks for buttons
function mousePressed() {
  console.log("Mouse pressed at:", mouseX, mouseY);
  
  // Don't process mouse clicks when the email modal is open
  if (emailModalOpen) {
    return false;
  }
  
  // Handle mouse clicks based on game state
  if (gameState === 'start') {
    // Check if start button is clicked
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 80 && mouseY < height/2 + 130) {
      console.log("Start button clicked in mousePressed!");
      startGame();
      return false; // Prevent default behavior
    }
  } else if (gameState === 'playing') {
    // Shoot when left mouse button is clicked
    p1.shoot();
    return false; // Prevent default behavior
  } else if (gameState === 'paused') {
    // Check if resume button is clicked
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 120 && mouseY < height/2 + 160) {
      console.log("Resume button clicked!");
      gameState = 'playing';
      return false; // Prevent default behavior
    }
    
    // Check if close button (X) is clicked
    if (mouseX > width/2 + 220 && mouseX < width/2 + 250 && 
        mouseY > height/2 - 200 && mouseY < height/2 - 170) {
      console.log("Close button clicked!");
      gameState = 'playing';
      return false; // Prevent default behavior
    }
    
    return false; // Prevent any other clicks while paused
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
        let winner = "Player 1"; // Single player game
        submitMatchResults(winner);
      }
      return false; // Prevent default behavior
    }
    
    // Check if play again button is clicked - updated dimensions to match new button
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && 
        mouseY > height/2 + 150 && mouseY < height/2 + 190) {
      resetGame();
      return false; // Prevent default behavior
    }
  }
  
  return true; // Allow default behavior for other clicks
}

// Character class
class Character {
  constructor(x, y, controls, isPlayer1) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 60; // Character height from feet to top of head
    this.speed = 5;
    this.jumpForce = 12;
    this.gravity = 0.6;
    this.velocityY = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.state = 'standing';
    this.facingRight = true;
    this.gunAngle = 0;
    this.damageFlash = 0;
    this.powerUps = {
      shield: 0,
      doubleDamage: 0,
      rapidFire: 0
    };
    this.lastShotTime = 0;
    this.shootCooldown = 0; // Initialize to 0 so player can shoot immediately
    this.isPlayer1 = isPlayer1;
    this.controls = controls;
    this.vx = 0;
    this.vy = 0;
    this.isJumping = false;
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.shootTimer = 0;
    this.shotsFired = 0; // Track shots fired
    this.shotsHit = 0; // Track shots that hit enemies
    this.damageDealt = 0; // Track damage dealt to enemies
    this.powerUpsCollected = 0; // Track power-ups collected
  }
  
  update() {
    // Handle movement
    this.vx = 0;
    
    // Left/right movement
    if (keyIsDown(this.controls.left)) {
      this.vx = -this.speed;
      this.state = 'running';
    } else if (keyIsDown(this.controls.right)) {
      this.vx = this.speed;
      this.state = 'running';
    } else {
      this.state = 'idle';
    }
    
    // Update facing direction based on mouse position
    this.facingRight = mouseX > this.x;
    
    // Jumping
    if (keyIsDown(this.controls.up) && !this.isJumping) {
      this.vy = -this.jumpForce;
      this.isJumping = true;
      this.state = 'jumping';
    }
    
    // Apply gravity
    this.vy += this.gravity;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Keep character within bounds
    if (this.x < 0) this.x = 0;
    if (this.x > width - this.width) this.x = width - this.width;
    
    // Ground collision
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.isJumping = false;
    }
    
    // Update cooldowns
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
    
    // Update power-up timers
    for (let powerUp in this.powerUps) {
      if (this.powerUps[powerUp] > 0) {
        this.powerUps[powerUp]--;
      }
    }
    
    // Update animation timers
    this.animationTimer++;
    if (this.animationTimer >= 5) {
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 4;
    }
    
    if (this.shootTimer > 0) {
      this.shootTimer--;
      if (this.shootTimer <= 0) {
        this.state = 'idle';
      }
    }
    
    // Decrease damage flash
    if (this.damageFlash > 0) {
      this.damageFlash--;
    }
  }
  
  shoot() {
    console.log("Shoot method called, cooldown:", this.shootCooldown);
    
    if (this.shootCooldown <= 0) {
      // Calculate gun position (at the end of arm)
      let gunX = this.x;
      let gunY = this.y - this.height + 30; // Position at shoulder height
      
      if (this.facingRight) {
        gunX += 30; // Position gun to the right
      } else {
        gunX -= 30; // Position gun to the left
      }
      
      // Calculate direction vector from gun to mouse
      let dirX = mouseX - gunX;
      let dirY = mouseY - gunY;
      
      // Normalize the direction vector
      let length = Math.sqrt(dirX * dirX + dirY * dirY);
      dirX = dirX / length;
      dirY = dirY / length;
      
      // Create projectile with muzzle flash effect
      let damage = 10;
      if (this.powerUps.doubleDamage > 0) damage *= 2;
      
      p1Projectiles.push(new Projectile(gunX, gunY, dirX, dirY, 10, damage, this));
      console.log("Projectile created at:", gunX, gunY, "direction:", dirX, dirY, "total projectiles:", p1Projectiles.length);
      
      // Add muzzle flash effect
      addMuzzleFlash(gunX + dirX * 15, gunY + dirY * 15);
      
      // Reset cooldown
      this.shootCooldown = SHOOT_COOLDOWN;
      if (this.powerUps.rapidFire > 0) this.shootCooldown = Math.floor(SHOOT_COOLDOWN / 2);
      
      // Update statistics
      this.shotsFired++;
      console.log("Shot fired. Total shots:", this.shotsFired);
      
      // Set shooting state
      this.state = 'shooting';
      this.shootTimer = 10;
    }
  }
  
  drawGun() {
    push();
    // Position gun in hand
    let gunX = this.x;
    let gunY = this.y - this.height + 30; // Position at shoulder height
    
    // Calculate angle to mouse for aiming
    let angle = atan2(mouseY - gunY, mouseX - gunX);
    
    if (this.facingRight) {
      // Draw gun pointing toward mouse
      push();
      translate(gunX + 10, gunY);
      rotate(angle);
      image(pistolImg, 0, -7.5);
      pop();
    } else {
      // Draw gun pointing toward mouse (flipped)
      push();
      translate(gunX - 10, gunY);
      rotate(angle);
      scale(-1, 1); // Flip horizontally
      image(pistolImg, -30, -7.5);
      pop();
    }
    pop();
  }
  
  takeDamage(amount) {
    // Check for shield power-up
    if (this.powerUps.shield > 0) {
      console.log("Shield absorbed damage!");
      return; // No damage taken
    }
    
    // Apply damage
    this.health -= amount;
    console.log(`Player took ${amount} damage. Health: ${this.health}`);
    
    // Set damage flash
    this.damageFlash = 10;
    
    // Check if health is below 0
    if (this.health <= 0) {
      this.health = 0;
      console.log("Player defeated!");
    }
  }
  
  draw() {
    push();
    
    // Flash red when taking damage
    if (this.damageFlash > 0) {
      fill(255, 0, 0, 150);
      this.damageFlash--;
    } else {
      fill(0); // Black stick figure
    }
    
    stroke(0);
    strokeWeight(2);
    
    // Draw character relative to feet position (this.y is at ground level)
    
    // Head
    ellipse(this.x, this.y - this.height + 10, 20);
    
    // Body
    line(this.x, this.y - this.height + 20, this.x, this.y - this.height + 50);
    
    // Arms
    if (this.state === 'shooting') {
      // Shooting pose - one arm extended
      if (this.facingRight) {
        line(this.x, this.y - this.height + 30, this.x - 15, this.y - this.height + 40); // Left arm down
        line(this.x, this.y - this.height + 30, this.x + 25, this.y - this.height + 30); // Right arm extended
      } else {
        line(this.x, this.y - this.height + 30, this.x - 25, this.y - this.height + 30); // Left arm extended
        line(this.x, this.y - this.height + 30, this.x + 15, this.y - this.height + 40); // Right arm down
      }
    } else {
      // Normal arms
      let armOffset = 0;
      if (this.state === 'running') {
        // Animate arms when running
        armOffset = sin(frameCount * 0.2) * 5;
      }
      
      line(this.x, this.y - this.height + 30, this.x - 15, this.y - this.height + 40 + armOffset);
      line(this.x, this.y - this.height + 30, this.x + 15, this.y - this.height + 40 - armOffset);
    }
    
    // Legs
    if (this.state === 'jumping') {
      // Jumping pose
      line(this.x, this.y - this.height + 50, this.x - 15, this.y - this.height + 55);
      line(this.x, this.y - this.height + 50, this.x + 15, this.y - this.height + 55);
    } else if (this.state === 'running') {
      // Running animation
      let legOffset = sin(frameCount * 0.2) * 10;
      line(this.x, this.y - this.height + 50, this.x - 10, this.y - legOffset);
      line(this.x, this.y - this.height + 50, this.x + 10, this.y + legOffset);
    } else {
      // Standing pose
      line(this.x, this.y - this.height + 50, this.x - 10, this.y);
      line(this.x, this.y - this.height + 50, this.x + 10, this.y);
    }
    
    // Draw gun in hand
    this.drawGun();
    
    // Draw power-up effects
    if (this.powerUps.shield > 0) {
      noFill();
      stroke(0, 100, 255, 150);
      strokeWeight(3);
      ellipse(this.x, this.y - this.height + 30, 70, 90);
    }
    
    if (this.powerUps.doubleDamage > 0) {
      noStroke();
      fill(255, 50, 50, 100);
      ellipse(this.x, this.y - this.height + 30, 40, 40);
    }
    
    if (this.powerUps.rapidFire > 0) {
      noStroke();
      fill(255, 255, 0, 100);
      ellipse(this.x, this.y - this.height, 15, 15);
    }
    
    // Draw health bar
    this.drawHealthBar();
    
    pop();
  }
  
  drawHealthBar() {
    const barWidth = 30;
    const barHeight = 5;
    const x = this.x - barWidth / 2;
    const y = this.y - this.height - 5;
    
    // Background
    fill(100);
    rect(x, y, barWidth, barHeight);
    
    // Health
    const healthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);
    fill(255, 0, 0);
    rect(x, y, healthWidth, barHeight);
  }
  
  getHitBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
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
  console.log("Starting game...");
  
  // Reset game state
  gameState = 'playing';
  score = 0;
  
  // Reset timers
  matchStartTime = millis();
  matchDuration = 0;
  gameEndingTriggered = false;
  
  // Reset arrays
  p1Projectiles = [];
  powerUps = [];
  enemies = [];
  scoreAnimations = [];
  muzzleFlashes = [];
  
  // Reset timers
  p1ShootCooldown = 0;
  powerUpTimer = 0;
  enemySpawnTimer = 0;
  
  // Create player character - position exactly at ground level
  p1 = new Character(width / 2, groundY, {
    left: 65,    // A
    right: 68,   // D
    up: 87,      // W
    down: 83     // S
  }, true);
  
  console.log("Game started successfully!");
}

// Projectile class for bullets
class Projectile {
  constructor(x, y, dirX, dirY, speed, damage, owner) {
    this.x = x;
    this.y = y;
    this.dirX = dirX;
    this.dirY = dirY;
    this.speed = speed;
    this.damage = damage;
    this.owner = owner;
    this.radius = 3;
    this.color = color(0); // Black bullet
    this.trail = []; // Store positions for trail effect
  }
  
  update() {
    // Store current position for trail
    this.trail.push({x: this.x, y: this.y});
    
    // Limit trail length
    if (this.trail.length > 5) {
      this.trail.shift();
    }
    
    // Move projectile
    this.x += this.dirX * this.speed;
    this.y += this.dirY * this.speed;
  }
  
  draw() {
    push();
    
    // Draw trail
    noStroke();
    for (let i = 0; i < this.trail.length; i++) {
      let alpha = map(i, 0, this.trail.length, 50, 255);
      fill(0, alpha);
      let size = map(i, 0, this.trail.length, 1, this.radius);
      ellipse(this.trail[i].x, this.trail[i].y, size * 2);
    }
    
    // Draw bullet
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.radius * 2);
    
    pop();
  }
  
  getHitBox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }
  
  checkCollision(rect) {
    // Check if projectile collides with rectangle
    return (
      this.x > rect.x && 
      this.x < rect.x + rect.width && 
      this.y > rect.y && 
      this.y < rect.y + rect.height
    );
  }
}

// PowerUp class
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20; // Use size for both width and height
    this.active = true;
    
    // Randomly select power-up type
    const types = ['health', 'rapidFire', 'doubleDamage', 'shield']; // Fixed 'damage' to 'doubleDamage'
    this.type = types[Math.floor(random(types.length))];
    
    this.color = this.getColor();
    this.floatOffset = 0;
    this.floatDir = 1;
  }
  
  getColor() {
    switch(this.type) {
      case 'health':
        return [0, 255, 0]; // Green for health
      case 'rapidFire':
        return [255, 255, 0]; // Yellow for rapid fire
      case 'doubleDamage': // Fixed 'damage' to 'doubleDamage'
        return [255, 0, 0]; // Red for damage boost
      case 'shield':
        return [0, 100, 255]; // Blue for shield
      default:
        return [255, 255, 255]; // White default
    }
  }
  
  update() {
    // Float up and down
    this.floatOffset += 0.1 * this.floatDir;
    if (Math.abs(this.floatOffset) > 5) {
      this.floatDir *= -1;
    }
  }
  
  draw() {
    push();
    noStroke();
    fill(this.color[0], this.color[1], this.color[2]);
    
    // Draw power-up
    ellipse(this.x, this.y + this.floatOffset, this.size, this.size);
    
    // Draw icon
    fill(255);
    textSize(12);
    textAlign(CENTER, CENTER);
    
    if (this.type === 'health') {
      text("+", this.x, this.y + this.floatOffset);
    } else if (this.type === 'rapidFire') {
      text("F", this.x, this.y + this.floatOffset);
    } else if (this.type === 'doubleDamage') { // Fixed 'damage' to 'doubleDamage'
      text("D", this.x, this.y + this.floatOffset);
    } else if (this.type === 'shield') {
      text("S", this.x, this.y + this.floatOffset);
    }
    
    pop();
  }
  
  getHitBox() {
    return {
      x: this.x - this.size/2,
      y: this.y - this.size/2 + this.floatOffset,
      width: this.size,
      height: this.size
    };
  }
}

// Muzzle flash effect
let muzzleFlashes = [];

function addMuzzleFlash(x, y) {
  muzzleFlashes.push({
    x: x,
    y: y,
    life: 5 // Frames the flash will last
  });
}

function updateMuzzleFlashes() {
  for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
    muzzleFlashes[i].life--;
    if (muzzleFlashes[i].life <= 0) {
      muzzleFlashes.splice(i, 1);
    }
  }
}

function drawMuzzleFlashes() {
  push();
  for (let flash of muzzleFlashes) {
    // Draw muzzle flash
    fill(255, 255, 0, 200);
    noStroke();
    ellipse(flash.x, flash.y, 10 + random(5));
    
    // Add some random particles
    for (let i = 0; i < 3; i++) {
      fill(255, 200, 0, 150);
      ellipse(
        flash.x + random(-5, 5),
        flash.y + random(-5, 5),
        random(3, 6)
      );
    }
  }
  pop();
}

// Enemy class
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 60;
    this.speed = 2;
    this.health = 30;
    this.maxHealth = 30;
    this.attackCooldown = 0;
    this.attackRange = 50;
    this.attackDamage = 5;
    this.facingRight = false; // Facing left by default
  }
  
  update() {
    // Move towards player
    if (this.x > p1.x + this.attackRange) {
      this.x -= this.speed;
      this.facingRight = false;
    } else if (this.x < p1.x - this.attackRange) {
      this.x += this.speed;
      this.facingRight = true;
    }
    
    // Attack if in range
    if (abs(this.x - p1.x) < this.attackRange) {
      this.attack();
    }
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }
  
  attack() {
    if (this.attackCooldown <= 0) {
      // Attack player
      p1.takeDamage(this.attackDamage);
      this.attackCooldown = 60; // Attack every 60 frames (1 second)
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    // Flash red when taking damage
    this.damageFlash = 5;
  }
  
  draw() {
    push();
    
    // Flash red when taking damage
    if (this.damageFlash > 0) {
      fill(255, 0, 0, 150);
      this.damageFlash--;
    } else {
      fill(50); // Darker stick figure than player
    }
    
    stroke(0);
    strokeWeight(2);
    
    // Draw stick figure
    // Head
    ellipse(this.x, this.y - this.height + 10, 20);
    
    // Evil red eyes
    fill(255, 0, 0);
    ellipse(this.x - 5, this.y - this.height + 7, 5, 5);
    ellipse(this.x + 5, this.y - this.height + 7, 5, 5);
    
    // Body
    stroke(0);
    fill(50);
    line(this.x, this.y - this.height + 20, this.x, this.y - this.height + 50);
    
    // Arms with animation
    let armOffset = sin(frameCount * 0.1) * 3; // Slower, subtler movement than player
    
    if (this.facingRight) {
      // Right-facing arms
      line(this.x, this.y - this.height + 30, this.x - 15, this.y - this.height + 40 + armOffset);
      line(this.x, this.y - this.height + 30, this.x + 15, this.y - this.height + 40 - armOffset);
    } else {
      // Left-facing arms
      line(this.x, this.y - this.height + 30, this.x - 15, this.y - this.height + 40 - armOffset);
      line(this.x, this.y - this.height + 30, this.x + 15, this.y - this.height + 40 + armOffset);
    }
    
    // Legs with animation
    let legOffset = sin(frameCount * 0.1) * 5; // Slower movement than player
    line(this.x, this.y - this.height + 50, this.x - 10, this.y - legOffset);
    line(this.x, this.y - this.height + 50, this.x + 10, this.y + legOffset);
    
    // Health bar
    this.drawHealthBar();
    
    pop();
  }
  
  drawHealthBar() {
    const barWidth = 30;
    const barHeight = 5;
    const x = this.x - barWidth / 2;
    const y = this.y - this.height - 5;
    
    // Background
    fill(100);
    rect(x, y, barWidth, barHeight);
    
    // Health
    const healthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);
    fill(255, 0, 0);
    rect(x, y, healthWidth, barHeight);
  }
  
  getHitBox() {
    return {
      x: this.x - 15,
      y: this.y - this.height,
      width: 30,
      height: this.height
    };
  }
}

// Function to update and draw power-ups
function updatePowerUps() {
  // Spawn new power-ups
  powerUpTimer++;
  if (powerUpTimer >= POWER_UP_INTERVAL) {
    powerUpTimer = 0;
    
    // Random position on screen
    let x = random(50, width - 50);
    let y = groundY - 30; // Position just above ground
    
    powerUps.push(new PowerUp(x, y));
    console.log("Power-up spawned at:", x, y);
  }
  
  // Update and draw existing power-ups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].update();
    powerUps[i].draw();
  }
}

// Function to update and draw projectiles
function updateProjectiles() {
  // Update and draw p1 projectiles
  for (let i = p1Projectiles.length - 1; i >= 0; i--) {
    let p = p1Projectiles[i];
    
    // Move projectile
    p.update();
    
    // Check if projectile is out of bounds
    if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
      p1Projectiles.splice(i, 1);
      continue;
    }
    
    // Draw projectile
    p.draw();
  }
}

// Preload function to load assets before setup
function preload() {
  // We'll create the pistol image in setup instead of loading it
  // This allows us to create it programmatically
}

// Helper function to add score animations
function addScoreAnimation(points, x, y) {
  scoreAnimations.push({
    x: x,
    y: y,
    points: points,
    alpha: 255,
    life: 30
  });
}

// Reset key just pressed states
function resetKeyJustPressed() {
  for (let key in previousKeyStates) {
    previousKeyStates[key] = keyIsDown(parseInt(key));
  }
}

// Draw the game without updating (for pause screen)
function drawGameStatic() {
  // Draw background
  drawWindowsBackground();
  
  // Draw ground
  fill(100, 200, 100);
  rect(0, groundY, width, height - groundY);
  
  // Draw power-ups (without updating)
  for (let powerUp of powerUps) {
    powerUp.draw();
  }
  
  // Draw projectiles (without updating)
  for (let projectile of p1Projectiles) {
    projectile.draw();
  }
  
  // Draw enemies (without updating)
  for (let enemy of enemies) {
    enemy.draw();
  }
  
  // Draw player (without updating)
  p1.draw();
  
  // Draw muzzle flashes
  drawMuzzleFlashes();
  
  // Draw game UI
  drawGameUI();
}