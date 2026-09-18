# Game_of_Life
Application dedicated in recreating Conway's game of life to a fun game

Game_of_Life/
├── index.html      the page: canvas, HUD, meta tags
├── manifest.json   name, icon, portrait, fullscreen
├── sw.js           service worker — caches files so it runs offline
├── game.js         your game: loop, dt, save/load, pause
└── icons/
    ├── icon-180.png       iPhone home screen
    ├── icon-192.png       Android
    ├── icon-512.png       splash screen / install prompt
    └── maskable-512.png   Android, cropped to a circle or square-circle