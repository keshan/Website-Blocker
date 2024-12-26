# Website Time Limiter Chrome Extension

A Chrome extension that helps you manage your time on specific websites by setting daily time limits. Once you reach your daily time limit for a website, you'll be blocked from accessing it until midnight.

## Features

- Set daily time limits for specific websites
- Real-time tracking of time spent on each website
- Automatic blocking when time limit is reached
- Daily reset of time limits at midnight
- Support for both www and non-www versions of websites
- Clean and simple interface

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## How to Use

### Adding Websites to Monitor

1. Click the extension icon in your Chrome toolbar
2. Click "Open Settings" to access the options page
3. In the "Add Website Time Limit" section:
   - Enter the website domain (e.g., "facebook.com", "youtube.com")
   - Enter the daily time limit in minutes
   - Click "Add Website"

### Managing Website Limits

The options page shows a table with:
- Website domains
- Daily time limits
- Time used today
- Option to remove websites from monitoring

### Understanding How It Works

- Time tracking starts when you actively view a monitored website
- The timer pauses when:
  - You switch to a different tab
  - The browser window loses focus
  - You minimize the browser
- At midnight, all time counters reset automatically
- When you reach the time limit for a website:
  - You'll be redirected to a blocking page
  - Access will be blocked until midnight

### Tips

- You can enter domains with or without "www." (e.g., both "youtube.com" and "www.youtube.com" will work)
- The extension automatically handles different URL formats (http://, https://, www., etc.)
- Time is counted in seconds but displayed in minutes
- You can modify or remove website limits at any time
- The blocking is per-domain, so it works across all pages of the monitored websites

## Technical Details

The extension uses:
- Chrome Storage API for saving settings and time data
- Chrome Tabs API for tracking active tabs
- Chrome Windows API for detecting window focus
- Background service worker for continuous time tracking
- Real-time updates in the options page

## Privacy

This extension:
- Only tracks time on websites you specifically add
- Stores all data locally in your browser
- Doesn't send any data to external servers
- Doesn't track your browsing history or activities on non-monitored sites

## Troubleshooting

If the extension isn't working as expected:

1. Check if the website domain is entered correctly
2. Verify that the extension is enabled in Chrome
3. Try reloading the monitored website
4. Check the options page to verify time limits
5. Restart Chrome if settings aren't applying

## License

This project is open source and available under the MIT License. 