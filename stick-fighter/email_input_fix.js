/*
 * EMAIL INPUT FIX FOR STICK FIGHTER GAME
 * 
 * The issue with the email input not working is likely due to how p5.js handles keyboard events.
 * Here are the changes needed to fix the issue:
 */

// STEP 1: Replace the keyTyped function with this version
function keyTyped() {
  // Only handle typing when email input is active
  if (gameState === 'ended' && emailInputActive) {
    console.log("Key typed: '" + key + "', keyCode: " + keyCode);
    
    // Add the character to the email (without regex validation)
    if (playerEmail.length < 50) {
      playerEmail += key;
      console.log("Email input updated: " + playerEmail);
    }
    return false; // Prevent default behavior
  }
  return true;
}

// STEP 2: Update the keyPressed function to handle backspace properly
function keyPressed() {
  console.log("Key pressed: " + key + ", keyCode: " + keyCode);
  
  // Handle email input in ended state
  if (gameState === 'ended' && emailInputActive) {
    // Handle backspace for email input
    if (keyCode === BACKSPACE) {
      playerEmail = playerEmail.slice(0, -1);
      console.log("Backspace pressed, email now: " + playerEmail);
      return false; // Prevent default behavior
    }
    
    // Prevent other keys from affecting the game state when typing email
    return false;
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

// STEP 3: Update the mousePressed function to better handle email input field activation
function mousePressed() {
  console.log("Mouse pressed at: " + mouseX + ", " + mouseY + " | Game state: " + gameState);
  
  if (gameState === 'ended') {
    // Check if email input field is clicked
    if (!emailSubmitted && 
        mouseX > width/2 - 125 && mouseX < width/2 + 125 && 
        mouseY > height/2 + 10 && mouseY < height/2 + 40) {
      emailInputActive = true;
      console.log("Email input field activated");
      return false; // Prevent default behavior
    } else if (emailInputActive) {
      // Only deactivate if we're clicking outside the input field
      if (!(mouseX > width/2 - 125 && mouseX < width/2 + 125 && 
            mouseY > height/2 + 10 && mouseY < height/2 + 40)) {
        emailInputActive = false;
        console.log("Email input field deactivated");
      }
    }
    
    // Rest of the mousePressed function...
  }
  
  // Rest of the mousePressed function...
}

/*
 * ALTERNATIVE SOLUTION: DOM INPUT ELEMENT
 * 
 * If the above solution doesn't work, you can try using a DOM input element:
 * 
 * 1. Add a DOM input variable at the top of the file:
 *    let emailInputField;
 * 
 * 2. Create the input element in setup():
 *    emailInputField = createInput('');
 *    emailInputField.position(-1000, -1000); // Off-screen
 *    emailInputField.hide();
 *    emailInputField.input(function() {
 *      playerEmail = this.value();
 *    });
 * 
 * 3. Show/position the input when the email field is clicked:
 *    emailInputField.position(width/2 - 125, height/2 + 10);
 *    emailInputField.show();
 *    emailInputField.elt.focus();
 * 
 * 4. Hide the input when clicking elsewhere or submitting
 */ 