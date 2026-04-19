# Hello Texas Records Homepage

A lightweight static homepage for Hello Texas Records built as a radio-dial experience using plain HTML, CSS, and vanilla JavaScript.

## File structure

- `index.html`: Main page markup and section layout
- `css/styles.css`: Theme, layout, responsive styling, and atmosphere effects
- `js/app.js`: App bootstrap and shared event wiring
- `js/stations.js`: Station data and station helpers
- `js/player.js`: Single global audio player and transport logic
- `js/dial.js`: Dial snapping, dragging, arrows, and mobile swipe behavior
- `js/ui.js`: DOM rendering and UI updates
- `assets/`: Optional lightweight local visuals if you want to add them later

## Notes

- Audio stays external through Dropbox raw links and is never bundled into the repo.
- Artist landing pages are linked externally and remain untouched.
- The site uses one global `HTMLAudioElement` and does not autoplay on load.
- Station hero artwork currently falls back to track cover art so the site stays lightweight even without local background images.

## Deploy to GitHub Pages

1. Create a new GitHub repository for this project.
2. Upload the contents of this folder to the repository root.
3. In GitHub, open `Settings` -> `Pages`.
4. Set the source to deploy from the main branch root.
5. Save, then open the published GitHub Pages URL.

## Local preview

Open `index.html` in a browser, or serve the folder with any simple static server.
