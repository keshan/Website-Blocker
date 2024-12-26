let websiteTimers = {};
let websiteSettings = {};
let activeTabDomain = null;
let currentVisitStart = null;

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

// Handle when tab becomes inactive or window loses focus
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopAllTimers();
  }
});

chrome.tabs.onActivated.addListener(() => {
  stopAllTimers();
});

function normalizeDomain(domain) {
  domain = domain.replace(/^www\./, '');
  domain = domain.replace(/\/$/, '');
  return domain;
}

async function stopAllTimers() {
  try {
    if (activeTabDomain && currentVisitStart) {
      const endTime = new Date();
      const duration = Math.round((endTime - currentVisitStart) / 1000);
      
      if (duration >= 1) {
        const result = await chrome.storage.local.get(['websiteVisits', 'dailyUsage']);
        const visits = result.websiteVisits || [];
        const dailyUsage = result.dailyUsage || {};

        // Update visits history for all sites
        visits.push({
          domain: activeTabDomain,
          timestamp: currentVisitStart.toISOString(),
          duration: duration,
          isMonitored: !!websiteSettings[activeTabDomain]
        });

        // Update daily usage only for monitored sites
        if (websiteSettings[activeTabDomain]) {
          dailyUsage[activeTabDomain] = (dailyUsage[activeTabDomain] || 0) + duration;
        }

        await chrome.storage.local.set({ 
          websiteVisits: visits,
          dailyUsage: dailyUsage
        });
      }
    }
  } catch (error) {
    console.error('Error stopping timers:', error);
  }

  Object.values(websiteTimers).forEach(timer => clearInterval(timer));
  websiteTimers = {};
  activeTabDomain = null;
  currentVisitStart = null;
}

async function updateTimer(tab) {
  await stopAllTimers();

  if (!tab.url || !tab.active) return;

  try {
    const domain = normalizeDomain(new URL(tab.url).hostname);
    
    // Skip tracking for extension pages and empty tabs
    if (domain === '' || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }

    activeTabDomain = domain;
    currentVisitStart = new Date();

    // Check if this is a monitored site
    const isMonitored = Object.keys(websiteSettings).some(site => 
      normalizeDomain(site) === domain
    );

    if (isMonitored) {
      // Start timer for monitored website
      websiteTimers[domain] = setInterval(async () => {
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const currentTab = tabs[0];
          
          if (!currentTab || normalizeDomain(new URL(currentTab.url).hostname) !== domain) {
            await stopAllTimers();
            return;
          }

          const result = await chrome.storage.local.get(['dailyUsage']);
          const dailyUsage = result.dailyUsage || {};
          
          // Increment the time spent
          dailyUsage[domain] = (dailyUsage[domain] || 0) + 1;
          
          const totalSeconds = dailyUsage[domain];
          const timeLeft = (websiteSettings[domain].timeLimit * 60) - totalSeconds;

          // Save the updated usage
          await chrome.storage.local.set({ dailyUsage });

          try {
            await chrome.tabs.sendMessage(currentTab.id, {
              type: 'timeUpdate',
              timeLeft: timeLeft
            });
          } catch (error) {
            console.error('Error sending time update:', error);
          }

          if (timeLeft <= 0) {
            await chrome.tabs.update(tab.id, { url: 'blocked.html' });
            await stopAllTimers();
          }
        } catch (error) {
          console.error('Error in timer interval:', error);
        }
      }, 1000);
    } else {
      // For non-monitored sites, just track time without limits
      websiteTimers[domain] = setInterval(async () => {
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          const currentTab = tabs[0];
          
          if (!currentTab || normalizeDomain(new URL(currentTab.url).hostname) !== domain) {
            await stopAllTimers();
          }
        } catch (error) {
          console.error('Error in unmonitored site timer:', error);
        }
      }, 1000);
    }
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

// Reset daily usage at midnight
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    await chrome.storage.local.set({
      dailyUsage: {},
      lastReset: now.toISOString()
    });
  }
}, 60000); 