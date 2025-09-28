# QuickSpace Shortcut Chrome Extension

A Chrome extension I vibecoded for language learning sites like Clozemaster and Duolingo, to quickly navigate between lessons by triggering buttons and interactive elements of choice using the spacebar.

## 🚀 Features

- **Spacebar shortcuts**: Press spacebar to automatically click buttons/elements
- **Dual targeting methods**:
  - **CSS Selectors**: Traditional precise element targeting
  - **Text Contains**: Smart text-based matching (perfect for dynamic sites)
- **Smart element detection**: Automatically finds clickable elements
- **Case-insensitive text matching**: Works regardless of text capitalization
- **Multi-site support**: Works on any website you configure
- **User-friendly settings**: Easy-to-use options page with visual rule management

## 📦 Installation

### From Source (Development)
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked" and select the extension folder
5. The extension will appear with a puzzle piece icon

### Configuration
1. Right-click the extension icon and select "Options"
2. Add rules for buttons you want to trigger with spacebar
3. Save your settings

### Example Configurations

**For Duolingo:**
- Text Contains: `Continue`, `Check`, `Click to speak`, `Start +`, `No thanks`

**For Clozemaster:**
- CSS Selector: `button.btn.btn-block.btn-success.joystix`, `button.btn.btn-block.joystix.btn-success`, `a.btn.btn-default.btn-sm.joystix`

## 🌐 Supported Sites

Currently configured for:
- Clozemaster (`www.clozemaster.com`)
- Duolingo (`www.duolingo.com`)

To add more sites, edit the `matches` array in `manifest.json`:
```json
"matches": [
  "*://www.clozemaster.com/*",
  "*://www.duolingo.com/*",
  "*://your-site.com/*"
]
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Disclaimer

Provided as-is. Feel free to fork and modify, but no support is offered and contributions will probably be ignored.


