# Stick Shooter - Windows XP Edition

A retro-inspired stick figure shooting game with a nostalgic Windows XP interface, part of the [Game Funnels](http://gamefunnels.ai) collection.

## Play the Game

You can play the game online at [gamefunnels.ai/stick-shooter/](http://gamefunnels.ai/stick-shooter/)

## Game Features

- Single-player shooting game with mouse aiming and keyboard movement
- Nostalgic Windows XP-themed interface and visual style
- Dynamic stick figure animations and enemy AI
- Projectile shooting mechanics with visual aiming line
- Multiple power-ups to enhance gameplay
- Match statistics tracking (shots fired, accuracy, damage dealt)
- Email submission for detailed match results
- Pause functionality with game controls display

## How to Play

### Controls

**Movement:**
- W: Jump
- A: Move Left
- D: Move Right
- ESC: Pause Game

**Shooting:**
- Mouse: Aim (follow the red aiming line)
- Left Mouse Button: Shoot

### Power-ups

Collect power-ups to gain advantages:
- **Rapid Fire**: Shoot faster for 10 seconds
- **Double Damage**: Deal twice the damage for 10 seconds
- **Shield**: Gain temporary protection from damage for 10 seconds
- **Health**: Restore health points

### Objective

Survive as long as possible while defeating enemies. Your score increases as you defeat enemies. The game ends when your health reaches zero or when the time limit is reached.

## Game Statistics

The game tracks several statistics during gameplay:
- Shots fired
- Shots hit (accuracy)
- Damage dealt to enemies
- Power-ups collected
- Final score

These statistics are displayed at the end of each match and can be submitted with your email for record-keeping.

## Technical Details

The game is built using:
- p5.js for rendering and game logic
- Supabase for storing match results and player statistics
- HTML5 and JavaScript for the game engine
- Custom pixel art and animations

## Supabase Integration

The game includes integration with Supabase for storing match results. To set up your own Supabase project for this game:

1. Follow the instructions in the `supabase_setup_instructions.md` file
2. Update the Supabase URL and API key in the `sketch.js` file
3. Test the integration by playing a game and submitting your email

## Development

To modify or extend the game:

1. Clone this repository
2. Make your changes to the code
3. Test locally by opening index.html in a browser
4. Submit a pull request with your improvements

## License

All rights reserved. This game is proprietary and may not be reproduced without permission. 