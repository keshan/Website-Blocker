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
  chartsContainer.innerHTML = '';
  
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'single-chart-container';
  
  const canvas = document.createElement('canvas');
  chartWrapper.appendChild(canvas);
  chartsContainer.appendChild(chartWrapper);
  
  // Process and sort sites by total time
  const siteData = Object.entries(data)
    .map(([site, siteData]) => {
      const totalTime = Object.entries(siteData.dailyTime)
        .filter(([date]) => {
          const dateObj = new Date(date);
          return dateObj >= dateRange.start && dateObj <= dateRange.end;
        })
        .reduce((sum, [, time]) => sum + time, 0);
      
      return { site, totalTime };
    })
    .sort((a, b) => b.totalTime - a.totalTime);

  console.log('Site Data:', siteData);
  console.log('Date Range:', dateRange);

  if (siteData.length === 0) {
    const noDataMessage = document.createElement('div');
    noDataMessage.style.textAlign = 'center';
    noDataMessage.style.padding = '20px';
    noDataMessage.textContent = 'No data available for the selected period';
    chartWrapper.appendChild(noDataMessage);
    return;
  }

  try {
    const ctx = canvas.getContext('2d');
    
    // Ensure Chart is available
    if (typeof Chart === 'undefined') {
      throw new Error('Chart.js is not loaded');
    }

    // Prepare the data
    const labels = siteData.map(item => item.site);
    const values = siteData.map(item => item.totalTime);
    
    console.log('Chart Data:', { labels, values });

    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Time Spent',
          data: values,
          backgroundColor: labels.map((_, index) => 
            `hsl(${(360 / labels.length) * index}, 70%, 50%)`
          )
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Time spent: ${formatTime(context.parsed.x)}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatTime(value)
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        }
      }
    };

    console.log('Chart Config:', chartConfig);
    
    // Create the chart
    const chart = new Chart(ctx, chartConfig);
    console.log('Chart created successfully');

  } catch (error) {
    console.error('Detailed error creating chart:', error);
    console.error('Error stack:', error.stack);
    const errorMessage = document.createElement('div');
    errorMessage.style.textAlign = 'center';
    errorMessage.style.padding = '20px';
    errorMessage.style.color = 'red';
    errorMessage.textContent = `Error creating chart: ${error.message}`;
    chartWrapper.appendChild(errorMessage);
  }
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