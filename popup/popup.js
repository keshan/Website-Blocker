document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const optionsBtn = document.getElementById('optionsBtn');

  // Update status
  chrome.storage.local.get(['blockStartTime', 'blockDuration'], (result) => {
    if (result.blockStartTime && result.blockDuration) {
      const start = new Date(result.blockStartTime);
      const end = new Date(start.getTime() + result.blockDuration * 60000);
      statusDiv.textContent = `Blocking active from ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()}`;
    } else {
      statusDiv.textContent = 'No blocking schedule set';
    }
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