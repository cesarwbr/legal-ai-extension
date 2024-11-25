# Legal Gist Chrome Extension

A browser extension that helps you understand the privacy policy of a website.

## Features

- 📄 Sidepanel to view the analysis of the privacy policy
- 🔍 Search through the privacy policy
- 📊 See the risk distribution of the privacy policy (work in progress)

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/cesarwbr/extension-template.git
cd extension-template
```

## Prerequisites

- Node.js (v14 or higher)
- Yarn package manager

## Installation

```bash
yarn install
```

## Development

### Project Structure

- `sidepanel/` - Contains the sidepanel UI and functionality
- `background.ts` - Background script/Service worker for extension functionality
- `dist/` - Build output directory

### Building the Extension

#### Firefox

```bash
yarn build
```

The extension will be built in the `dist/` directory by default.

To test in Firefox:
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json` from the `dist/` directory

Alternatively:
1. Open Firefox
2. Go to Menu > Add-ons and Themes
3. Click the gear icon ⚙️
4. Select "Debug Add-ons"
5. Click "Load Temporary Add-on"
6. Navigate to and select `dist/manifest.json`

#### Chrome

```bash
yarn build:chrome
```

To test in Chrome:
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (top-right corner)
3. Click "Load unpacked"
4. Select the `dist/` directory

## Publishing

To create a distribution package:

```bash
yarn package
```

This will generate a ZIP file suitable for submission to browser extension stores.

## Development Tips

- After making changes, rebuild the extension using the appropriate build command
- For Chrome, you'll need to click the refresh icon in `chrome://extensions/` after rebuilding
- For Firefox, you'll need to reload the temporary add-on after rebuilding

## Browser Support

- Firefox: Latest version
- Chrome: Latest version

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add your license information here]

## Support

[Add support information or contact details here]