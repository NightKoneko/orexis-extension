## Installing
Download the CRX from [Releases](https://github.com/NightKoneko/orexis-extension/releases). Drag and drop the CRX file onto your browser to be prompted to install. 

## Building

1. Install dependencies:
    - `npm install`
2. Build the extension:
    - `npm run build`
3. Load the built extension into your browser (use the `extension/dist` folder):
    - Chromium (Chrome/Edge/Brave): open `chrome://extensions`, enable Developer mode, click "Load unpacked" and select `extension/dist`
    - Firefox: open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on" and pick `extension/dist/manifest.json`
