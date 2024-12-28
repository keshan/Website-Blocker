# Website Time Blocker Chrome Extension

A powerful Chrome extension that helps users manage their time on websites by tracking usage and implementing customizable time limits.

## Features

- **Website Time Tracking**: Automatically tracks time spent on each website
- **Interactive Analytics Dashboard**: 
  - Bar charts showing time spent per site
  - Daily usage trends
  - Peak usage hours visualization
  - Weekly usage patterns
- **Time Limits**: Set custom time limits for specific websites
- **Blocking Mechanism**: Automatically blocks websites when time limits are reached
- **Flexible Time Ranges**: View analytics for different time periods (Today, Week, Month, All)
- **Data Management**: Option to clear analytics data when needed

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store (link coming soon)
2. Click "Add to Chrome"
3. Follow the prompts to install

### Local Development Installation
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension directory

## Usage Guide

### Setting Up Time Limits
1. Click the extension icon in Chrome toolbar
2. Click "Options" or right-click the icon and select "Options"
3. Enter the website URL and desired time limit
4. Click "Add" to save the limit

### Viewing Analytics
1. Click the extension icon
2. Select "View Analytics"
3. Use the time range buttons (Today, Week, Month, All) to view different periods
4. Explore various charts showing your website usage patterns

### Managing Data
- To clear all analytics data:
  1. Go to the Analytics page
  2. Click the "Clear Data" button
  3. Confirm the action

### Understanding Charts
1. **Time Distribution by Site**: Doughnut chart showing proportion of time spent on each site
2. **Daily Usage Trends**: Line chart tracking usage over time
3. **Peak Usage Hours**: Bar chart showing most active hours
4. **Weekly Usage Pattern**: Radar chart displaying weekly patterns

## Development

### Project Structure
```
├── manifest.json          # Extension configuration
├── background.js         # Background service worker
├── content.js           # Content script for page interaction
├── popup/               # Extension popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/            # Options page
│   ├── options.html
│   ├── options.css
│   └── options.js
├── analytics/         # Analytics dashboard
│   ├── analytics.html
│   ├── analytics.css
│   └── analytics.js
├── lib/              # External libraries
│   └── chart.min.js  # Chart.js for visualizations
└── icons/           # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Technical Details
- Built with Manifest V3
- Uses Chrome Storage API for data persistence
- Implements Chart.js for data visualization
- Uses service worker for background processing
- Content script for real-time tracking
- Modular architecture for easy maintenance

### Permissions Used
- `storage`: For saving website data and settings
- `webNavigation`: For tracking website visits
- `tabs`: For accessing tab information
- `alarms`: For periodic time checks
- `host_permissions`: For tracking across all websites

## Privacy

- All data is stored locally on your device
- No data is sent to external servers
- You can clear your data at any time
- The extension only tracks the domains you visit, not specific pages

## Known Issues

1. Chart.js loading issues in some scenarios
2. Time calculation edge cases being addressed
3. Working on improving blocking notification system

## Future Enhancements

1. Export/Import settings
2. Custom blocking messages
3. More detailed analytics
4. Site categories and grouping
5. Customizable themes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 