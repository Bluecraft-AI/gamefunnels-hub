/*
 * EMAIL INPUT FIX FOR STICK FIGHTER GAME
 * 
 * This file implements a fix for the email input functionality
 * using a DOM input element approach.
 */

// This function will be called after the sketch.js setup function
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit to ensure p5.js is fully initialized
  setTimeout(function() {
    console.log("Email input fix applied");
    
    // Get the canvas element
    let canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }
    
    // Add a click event listener to the canvas
    canvas.addEventListener('click', function(event) {
      // Only proceed if we're in the ended state
      if (window.gameState !== 'ended') return;
      
      // Get canvas position and dimensions
      let rect = canvas.getBoundingClientRect();
      let scaleX = canvas.width / rect.width;
      let scaleY = canvas.height / rect.height;
      
      // Convert click position to canvas coordinates
      let canvasX = (event.clientX - rect.left) * scaleX;
      let canvasY = (event.clientY - rect.top) * scaleY;
      
      // Check if email input area was clicked
      if (!window.emailSubmitted && 
          canvasX > window.width/2 - 125 && canvasX < window.width/2 + 125 && 
          canvasY > window.height/2 && canvasY < window.height/2 + 30) {
        
        // Calculate the absolute position for the input field
        let inputX = rect.left + (window.width/2 - 125) * (rect.width / canvas.width);
        let inputY = rect.top + (window.height/2) * (rect.height / canvas.height);
        
        // Position and show the input field
        window.emailInputField.position(inputX, inputY);
        window.emailInputField.show();
        window.emailInputField.elt.focus();
        window.emailInputActive = true;
        
        console.log("Email input field activated at", inputX, inputY);
      }
    });
    
    // Add a global click handler to detect clicks outside the input
    document.addEventListener('click', function(event) {
      // Only handle if email input is active
      if (window.gameState !== 'ended' || !window.emailInputActive) return;
      
      // Check if click is outside the input element
      if (event.target !== window.emailInputField.elt) {
        // Update playerEmail with the current value of the input field
        window.playerEmail = window.emailInputField.value();
        window.emailInputActive = false;
        
        // Hide the input field
        window.emailInputField.hide();
        window.emailInputField.position(-1000, -1000); // Move off-screen
        
        console.log("Email input field deactivated, value saved: " + window.playerEmail);
      }
    });
  }, 1000); // Wait 1 second for everything to initialize
});

// Ensure the email input field is properly reset when the game resets
function resetEmailInput() {
  if (window.emailInputField) {
    window.emailInputField.value('');
    window.emailInputField.hide();
    window.emailInputField.position(-1000, -1000);
    window.emailInputActive = false;
    window.playerEmail = '';
    window.emailSubmitted = false;
  }
}

// If the original resetGame function exists, hook into it
if (typeof window.originalResetGame === 'undefined' && typeof window.resetGame === 'function') {
  window.originalResetGame = window.resetGame;
  window.resetGame = function() {
    window.originalResetGame();
    resetEmailInput();
  };
}

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