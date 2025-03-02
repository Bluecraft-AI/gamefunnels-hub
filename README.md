# Game Funnels Hub

This repository serves as the main hub for the Game Funnels collection of retro-inspired browser games, hosted at [gamefunnels.ai](http://gamefunnels.ai).

## Available Games

- [Stick Fighter](http://gamefunnels.ai/stick-fighter/) - A Windows XP-themed stick figure fighting game with local multiplayer.

## How It Works

This repository is set up as the main GitHub Pages site for the custom domain `gamefunnels.ai`. Games are hosted as subdirectories within this repository and are accessible as subpaths of the main domain.

## Repository Structure

- `/` - Main landing page with game listings
- `/stick-fighter/` - Stick Fighter game files

## Adding New Games

To add a new game to the collection:

1. Create a new subdirectory in this repository for the game
2. Add all the game files to that subdirectory
3. Update the main index.html to include a link to the new game

## Development

The hub page is built with HTML, CSS, and JavaScript. Feel free to improve the design or add new features to enhance the game collection experience.

## DNS Configuration

The site is configured with a CNAME record for `gamefunnels.ai` pointing to `Bluecraft-AI.github.io`.

## License

All rights reserved. The games and hub design are proprietary and may not be reproduced without permission. 