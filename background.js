let activeTabId = null;
let startTime = null;

function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return !urlObj.href.startsWith('chrome://') && 
           !urlObj.href.startsWith('chrome-extension://') &&
           !urlObj.href.startsWith('about:') &&
           urlObj.hostname !== 'newtab' &&
           !urlObj.protocol.startsWith('chrome');
  } catch {
    return false;
  }
}

function normalizeDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function updateTimeSpent(url) {
  if (!url || !isValidUrl(url) || !startTime) return;
  
  const hostname = normalizeDomain(url);
  if (!hostname) return;
  
  const currentDate = new Date().toISOString().split('T')[0];
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  
  if (elapsedSeconds > 0) {
    chrome.storage.local.get(['siteTimers'], (result) => {
      const siteTimers = result.siteTimers || {};
      
      if (!siteTimers[hostname]) {
        siteTimers[hostname] = {
          dailyTime: {}
        };
      }
      
      if (!siteTimers[hostname].dailyTime[currentDate]) {
        siteTimers[hostname].dailyTime[currentDate] = 0;
      }
      
      siteTimers[hostname].dailyTime[currentDate] += elapsedSeconds;
      
      chrome.storage.local.set({ siteTimers });
    });
  }
  
  // Reset start time to current time after updating
  startTime = Date.now();
}

// Tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Update time for previous tab
    if (startTime && activeTabId) {
      const tab = await chrome.tabs.get(activeTabId);
      if (tab && tab.url) {
        updateTimeSpent(tab.url);
      }
    }

    // Set up new tab tracking
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && isValidUrl(tab.url)) {
      activeTabId = activeInfo.tabId;
      startTime = Date.now();
    } else {
      activeTabId = null;
      startTime = null;
    }
  } catch (error) {
    console.error('Error in tab activation:', error);
    activeTabId = null;
    startTime = null;
  }
});

// URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    if (startTime) {
      updateTimeSpent(tab.url);
    }
    
    if (isValidUrl(changeInfo.url)) {
      startTime = Date.now();
    } else {
      activeTabId = null;
      startTime = null;
    }
  }
});

// Window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (startTime && activeTabId) {
      chrome.tabs.get(activeTabId, (tab) => {
        if (tab && tab.url) {
          updateTimeSpent(tab.url);
        }
      });
    }
    startTime = null;
    activeTabId = null;
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && isValidUrl(tabs[0].url)) {
        activeTabId = tabs[0].id;
        startTime = Date.now();
      }
    });
  }
});

// Periodic update (every 1 second)
setInterval(() => {
  if (startTime && activeTabId) {
    chrome.tabs.get(activeTabId, (tab) => {
      if (tab && tab.url) {
        updateTimeSpent(tab.url);
      }
    });
  }
}, 1000);

// Before browser close
chrome.runtime.onSuspend.addListener(() => {
  if (startTime && activeTabId) {
    chrome.tabs.get(activeTabId, (tab) => {
      if (tab && tab.url) {
        updateTimeSpent(tab.url);
      }
    });
  }
}); 