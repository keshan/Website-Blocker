document.addEventListener('DOMContentLoaded', () => {
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const applyFilterBtn = document.getElementById('applyFilter');
  
  // Set default date range (last 7 days)
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  startDateInput.value = weekAgo.toISOString().split('T')[0];
  endDateInput.value = today.toISOString().split('T')[0];
  
  loadAnalytics();
  
  applyFilterBtn.addEventListener('click', loadAnalytics);
});

function loadAnalytics() {
  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);
  endDate.setHours(23, 59, 59, 999); // Include the entire end date
  
  chrome.storage.local.get(['websiteVisits'], (result) => {
    const visits = result.websiteVisits || [];
    const filteredVisits = visits.filter(visit => {
      const visitDate = new Date(visit.timestamp);
      return visitDate >= startDate && visitDate <= endDate;
    });
    
    updateSummaryStats(filteredVisits);
    updateVisitsTable(filteredVisits);
  });
}

function updateSummaryStats(visits) {
  const totalWebsites = new Set(visits.map(v => v.domain)).size;
  const totalSeconds = visits.reduce((sum, visit) => sum + visit.duration, 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  
  document.getElementById('totalWebsites').textContent = totalWebsites;
  document.getElementById('totalTime').textContent = `${totalMinutes} minutes`;
}

function updateVisitsTable(visits) {
  const tbody = document.getElementById('analyticsTable').getElementsByTagName('tbody')[0];
  tbody.innerHTML = '';
  
  // Sort visits by timestamp (most recent first)
  visits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  visits.forEach(visit => {
    const row = tbody.insertRow();
    
    row.insertCell(0).textContent = visit.domain;
    row.insertCell(1).textContent = new Date(visit.timestamp).toLocaleTimeString();
    row.insertCell(2).textContent = `${Math.round(visit.duration / 60)} minutes`;
    row.insertCell(3).textContent = new Date(visit.timestamp).toLocaleDateString();
    row.insertCell(4).textContent = visit.isMonitored ? 'Yes' : 'No';
  });
} 