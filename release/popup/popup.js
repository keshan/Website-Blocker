document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const optionsBtn = document.getElementById('optionsBtn');

  // Get blocked sites count from storage
  chrome.storage.sync.get(['blockedSites'], (result) => {
    const blockedSites = result.blockedSites || [];
    statusDiv.textContent = `${blockedSites.length} Sites Blocked`;
  });

  // Open options page
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  const analyticsBtn = document.getElementById('analyticsBtn');
  analyticsBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('analytics/analytics.html')
    });
  });
}); 