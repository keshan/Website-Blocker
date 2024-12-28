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

function createCharts(data, dateRange) {
  const chartsContainer = document.querySelector('.chart-section');
  chartsContainer.innerHTML = `
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Time Distribution by Site</h3>
        <canvas id="siteDistributionChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Daily Usage Trends</h3>
        <canvas id="dailyTrendsChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Peak Usage Hours</h3>
        <canvas id="hourlyUsageChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Weekly Usage Pattern</h3>
        <canvas id="weeklyPatternChart"></canvas>
      </div>
    </div>
  `;

  createSiteDistributionChart(data, dateRange);
  createDailyTrendsChart(data, dateRange);
  createHourlyUsageChart(data, dateRange);
  createWeeklyPatternChart(data, dateRange);
}

function createSiteDistributionChart(data, dateRange) {
  const ctx = document.getElementById('siteDistributionChart').getContext('2d');
  const siteData = Object.entries(data)
    .map(([site, siteData]) => ({
      site,
      totalTime: Object.entries(siteData.dailyTime)
        .filter(([date]) => {
          const dateObj = new Date(date);
          return dateObj >= dateRange.start && dateObj <= dateRange.end;
        })
        .reduce((sum, [, time]) => sum + time, 0)
    }))
    .sort((a, b) => b.totalTime - a.totalTime);

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: siteData.map(item => item.site),
      datasets: [{
        data: siteData.map(item => item.totalTime),
        backgroundColor: siteData.map((_, index) => 
          `hsl(${(360 / siteData.length) * index}, 70%, 50%)`
        )
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: ${formatTime(context.raw)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function createDailyTrendsChart(data, dateRange) {
  const ctx = document.getElementById('dailyTrendsChart').getContext('2d');
  const labels = [];
  const current = new Date(dateRange.start);
  
  while (current <= dateRange.end) {
    labels.push(getDateString(current));
    current.setDate(current.getDate() + 1);
  }

  const datasets = Object.entries(data).map(([site, siteData]) => {
    const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    return {
      label: site,
      data: labels.map(date => siteData.dailyTime[date] || 0),
      borderColor: color,
      backgroundColor: color + '20',
      tension: 0.4,
      fill: true
    };
  });

  new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatTime(value)
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatTime(context.raw)}`
          }
        }
      }
    }
  });
}

function createHourlyUsageChart(data, dateRange) {
  const ctx = document.getElementById('hourlyUsageChart').getContext('2d');
  const hourlyData = new Array(24).fill(0);
  
  // This is a placeholder - you'll need to modify your data collection to include hour information
  // For now, showing a sample pattern
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = Math.random() * 100;
  }

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [{
        label: 'Usage by Hour',
        data: hourlyData,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Average Time (minutes)'
          }
        }
      }
    }
  });
}

function createWeeklyPatternChart(data, dateRange) {
  const ctx = document.getElementById('weeklyPatternChart').getContext('2d');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyData = new Array(7).fill(0);

  Object.values(data).forEach(siteData => {
    Object.entries(siteData.dailyTime).forEach(([date, time]) => {
      const dateObj = new Date(date);
      if (dateObj >= dateRange.start && dateObj <= dateRange.end) {
        weeklyData[dateObj.getDay()] += time;
      }
    });
  });

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: days,
      datasets: [{
        label: 'Usage Pattern',
        data: weeklyData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            callback: value => formatTime(value)
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${formatTime(context.raw)}`
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
    createCharts(siteTimers, dateRange);
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