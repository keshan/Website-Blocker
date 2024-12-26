function normalizeDomain(domain) {
  // Remove www. if present
  domain = domain.replace(/^www\./, '');
  // Remove any trailing slash
  domain = domain.replace(/\/$/, '');
  // Remove http:// or https://
  domain = domain.replace(/^https?:\/\//, '');
  return domain;
}

document.addEventListener('DOMContentLoaded', () => {
  const newSiteInput = document.getElementById('newSite');
  const timeLimitInput = document.getElementById('timeLimit');
  const addSiteButton = document.getElementById('addSite');
  const siteList = document.getElementById('siteList').getElementsByTagName('tbody')[0];

  // Initial load
  loadWebsites();

  // Set up periodic refresh of the website list
  setInterval(loadWebsites, 1000); // Update every second

  addSiteButton.addEventListener('click', () => {
    const site = normalizeDomain(newSiteInput.value.trim());
    const timeLimit = parseInt(timeLimitInput.value);

    if (site && timeLimit > 0) {
      chrome.storage.local.get(['websiteSettings'], (result) => {
        const settings = result.websiteSettings || {};
        settings[site] = { timeLimit };
        
        chrome.storage.local.set({ websiteSettings: settings }, () => {
          loadWebsites();
          newSiteInput.value = '';
          timeLimitInput.value = '';
        });
      });
    }
  });
});

function loadWebsites() {
  chrome.storage.local.get(['websiteSettings', 'dailyUsage'], (result) => {
    const settings = result.websiteSettings || {};
    const dailyUsage = result.dailyUsage || {};
    const tbody = document.getElementById('siteList').getElementsByTagName('tbody')[0];

    // Only update if there are changes
    const currentContent = Array.from(tbody.children).map(row => ({
      site: row.cells[0].textContent,
      limit: row.cells[1].textContent,
      usage: row.cells[2].textContent
    }));

    const newContent = Object.entries(settings).map(([site, config]) => ({
      site: site,
      limit: `${config.timeLimit} minutes`,
      usage: `${Math.floor((dailyUsage[site] || 0) / 60)} minutes`
    }));

    // Check if content has changed before updating DOM
    if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
      tbody.innerHTML = '';
      
      Object.entries(settings).forEach(([site, config]) => {
        const row = tbody.insertRow();
        
        row.insertCell(0).textContent = site;
        row.insertCell(1).textContent = `${config.timeLimit} minutes`;
        row.insertCell(2).textContent = `${Math.floor((dailyUsage[site] || 0) / 60)} minutes`;
        
        const actionsCell = row.insertCell(3);
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.className = 'remove';
        removeButton.onclick = () => removeWebsite(site);
        actionsCell.appendChild(removeButton);
      });
    }
  });
}

function removeWebsite(site) {
  chrome.storage.local.get(['websiteSettings'], (result) => {
    const settings = result.websiteSettings || {};
    delete settings[site];
    chrome.storage.local.set({ websiteSettings: settings }, loadWebsites);
  });
} 