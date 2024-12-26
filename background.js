let websiteTimers = {};
let websiteSettings = {};
let activeTabDomain = null;

// Load settings when extension starts
chrome.runtime.onStartup.addListener(loadSettings);
chrome.runtime.onInstalled.addListener(loadSettings);

function loadSettings() {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);

  chrome.storage.local.get(['websiteSettings', 'dailyUsage', 'lastReset'], (result) => {
    websiteSettings = result.websiteSettings || {};
    
    // Reset daily usage if it's a new day
    const lastReset = result.lastReset ? new Date(result.lastReset) : null;
    if (!lastReset || lastReset < midnight) {
      chrome.storage.local.set({
        dailyUsage: {},
        lastReset: new Date().toISOString()
      });
    }
  });
}

// Track active tab time
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  updateTimer(tab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateTimer(tab);
  }
});

// Handle when tab becomes inactive
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopAllTimers();
  }
});

// Function to normalize domain names
function normalizeDomain(domain) {
  // Remove www. if present
  domain = domain.replace(/^www\./, '');
  // Remove any trailing slash
  domain = domain.replace(/\/$/, '');
  return domain;
}

function stopAllTimers() {
  Object.values(websiteTimers).forEach(timer => clearInterval(timer));
  websiteTimers = {};
  activeTabDomain = null;
}

function updateTimer(tab) {
  stopAllTimers();

  if (!tab.url || !tab.active) return;

  try {
    const domain = normalizeDomain(new URL(tab.url).hostname);
    
    // Check if this domain or its www version is in settings
    const matchedSite = Object.keys(websiteSettings).find(site => 
      normalizeDomain(site) === domain
    );

    if (!matchedSite) return;

    activeTabDomain = matchedSite;

    // Start timer for current website
    websiteTimers[domain] = setInterval(async () => {
      try {
        // Verify tab is still active
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        if (!currentTab || normalizeDomain(new URL(currentTab.url).hostname) !== domain) {
          stopAllTimers();
          return;
        }

        // Update time usage
        const result = await chrome.storage.local.get(['dailyUsage']);
        const dailyUsage = result.dailyUsage || {};
        dailyUsage[matchedSite] = (dailyUsage[matchedSite] || 0) + 1;

        // Calculate time left
        const timeLeft = (websiteSettings[matchedSite].timeLimit * 60) - dailyUsage[matchedSite];

        // Send time update to content script
        try {
          await chrome.tabs.sendMessage(currentTab.id, {
            type: 'timeUpdate',
            timeLeft: timeLeft
          });
        } catch (error) {
          console.error('Error sending time update:', error);
        }

        // If time limit exceeded, block the website
        if (dailyUsage[matchedSite] >= websiteSettings[matchedSite].timeLimit * 60) {
          await chrome.tabs.update(tab.id, { url: 'blocked.html' });
          stopAllTimers();
        } else {
          await chrome.storage.local.set({ dailyUsage });
        }
      } catch (error) {
        console.error('Error updating timer:', error);
      }
    }, 1000); // Update every second
  } catch (error) {
    console.error('Error processing URL:', error);
  }
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.websiteSettings) {
    websiteSettings = changes.websiteSettings.newValue;
  }
}); 