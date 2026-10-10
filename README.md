# Zombie Nightfall

A complete browser game built with HTML5 Canvas and packaged for desktop and Android support.

## Features
- Main menu and settings
- PC and mobile controls
- Skin shop and themes
- Zombies, shooting, waves, level-up system
- HUD, minimap, game-over flow
- Electron desktop wrapper
- Capacitor Android preparation

## Run in browser
1. Install dependencies:
   npm install
2. Start local server:
   npm run start
3. Open in browser:
   http://localhost:8080

## Desktop build (Windows EXE)
1. Install development tools:
   npm run install:tools
2. Build the desktop app:
   npm run build:win
3. Output will be created in the `dist` folder.

## Android APK build
1. Install Android Studio and Android SDK.
2. Install tools:
   npm run install:tools
3. Add Android platform:
   npx cap add android
4. Sync web assets:
   npx cap sync android
5. Open the project in Android Studio:
   npx cap open android
6. Build the APK from Android Studio or use Gradle.

## Notes
- This project is ready as a web game and desktop shell.
- Actual EXE and APK binary generation must be done on a machine with the proper packaging tools installed.
- Electron builder is used for Windows packaging.
- Capacitor is used for Android packaging.
