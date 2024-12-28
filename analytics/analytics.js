function formatTime(seconds) {
  if (!seconds) return '0h 0m 0s';
  
  // Ensure we're working with a valid number
  seconds = Math.min(86400, Math.floor(Math.abs(seconds))); // Cap at 24 hours
  
  const hours = Math.floor(seconds / 3600);
  const remainingSeconds = seconds % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  
  // Format with leading zeros for better readability
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(secs).padStart(2, '0');
  
  return `${hoursStr}h ${minutesStr}m ${secondsStr}s`;
}

function getDateString(date) {
  return date.toISOString().split('T')[0];
}

function getDateRange(range) {
  const end = new Date();
  const start = new Date();
  
  switch(range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'all':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  
  return { start, end };
}

function createChart(data, dateRange) {
  const ctx = document.getElementById('timeChart').getContext('2d');
  
  // Generate date labels for the selected range
  const labels = [];
  const current = new Date(dateRange.start);
  while (current <= dateRange.end) {
    labels.push(getDateString(current));
    current.setDate(current.getDate() + 1);
  }
  
  // Process data for each site
  const datasets = Object.keys(data).map(site => {
    const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    return {
      label: site,
      data: labels.map(date => data[site].dailyTime[date] || 0),
      borderColor: color,
      backgroundColor: color + '20',
      tension: 0.3,
      fill: true
    };
  });

  if (window.timeChart) {
    window.timeChart.destroy();
  }

  window.timeChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Time (seconds)'
          },
          ticks: {
            callback: function(value) {
              return formatTime(value);
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${formatTime(context.parsed.y)}`;
            }
          }
        }
      }
    }
  });
}

function updateSummaryStats(data, dateRange) {
  const today = getDateString(new Date());
  let totalToday = 0;
  let mostVisitedSite = { site: '-', time: 0 };
  
  Object.entries(data).forEach(([site, siteData]) => {
    const todayTime = siteData.dailyTime[today] || 0;
    totalToday += todayTime;
    
    if (todayTime > mostVisitedSite.time) {
      mostVisitedSite = { site, time: todayTime };
    }
  });
  
  document.getElementById('totalTimeToday').textContent = formatTime(totalToday);
  document.getElementById('mostVisitedSite').textContent = mostVisitedSite.site;
  document.getElementById('sitesTracked').textContent = Object.keys(data).length;
}

function displaySiteStats(data, dateRange) {
  const statsContainer = document.getElementById('dailyStats');
  statsContainer.innerHTML = '';
  
  Object.entries(data).forEach(([site, siteData]) => {
    const siteStats = document.createElement('div');
    siteStats.className = 'site-stats';
    
    const today = getDateString(new Date());
    const todayTime = siteData.dailyTime[today] || 0;
    const periodTime = Object.entries(siteData.dailyTime)
      .filter(([date]) => new Date(date) >= dateRange.start)
      .reduce((sum, [, time]) => sum + time, 0);
    
    siteStats.innerHTML = `
      <div class="site-name">${site}</div>
      <div class="site-details">
        <div class="time-stat">
          <span>Today:</span>
          <span>${formatTime(todayTime)}</span>
        </div>
        <div class="time-stat">
          <span>Selected Period:</span>
          <span>${formatTime(periodTime)}</span>
        </div>
      </div>
    `;
    
    statsContainer.appendChild(siteStats);
  });
}

function loadAnalytics(range = 'today') {
  const dateRange = getDateRange(range);
  
  chrome.storage.local.get(['siteTimers'], (result) => {
    const siteTimers = result.siteTimers || {};
    updateSummaryStats(siteTimers, dateRange);
    displaySiteStats(siteTimers, dateRange);
    createChart(siteTimers, dateRange);
  });
}

function clearAnalyticsData() {
  if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
    chrome.storage.local.remove(['siteTimers'], () => {
      if (chrome.runtime.lastError) {
        console.error('Error clearing data:', chrome.runtime.lastError);
        alert('Error clearing data. Please try again.');
      } else {
        alert('Analytics data has been cleared successfully.');
        // Reload the page to show empty state
        window.location.reload();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Add this new event listener
  const clearDataBtn = document.getElementById('clearDataBtn');
  clearDataBtn.addEventListener('click', clearAnalyticsData);
  
  // Initialize with today's data
  loadAnalytics('today');
  
  // Set up time range buttons
  const timeButtons = document.querySelectorAll('.time-btn');
  timeButtons.forEach(button => {
    button.addEventListener('click', () => {
      timeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      loadAnalytics(button.dataset.range);
    });
  });
}); 