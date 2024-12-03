# ⚖️ Legal AI Chrome Extension

A browser extension that helps you understand the privacy policy of a website.

## Features

- 📄 Sidepanel to view the analysis of the privacy policy
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

- Chrome: Latest version

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need assistance, please contact us at cesarwbr@gmail.com.