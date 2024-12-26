let timerElement = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

function createTimerElement() {
  const timer = document.createElement('div');
  timer.id = 'website-time-limiter-timer';
  timer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2147483647;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    cursor: move;
    user-select: none;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: background-color 0.2s ease;
  `;

  // Add drag functionality
  timer.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDragging);

  timer.addEventListener('mouseenter', () => {
    timer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  });

  timer.addEventListener('mouseleave', () => {
    timer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  });

  document.body.appendChild(timer);
  return timer;
}

function startDragging(e) {
  if (!timerElement) return;
  
  isDragging = true;
  dragStartX = e.clientX - timerElement.offsetLeft;
  dragStartY = e.clientY - timerElement.offsetTop;
  timerElement.style.cursor = 'grabbing';
}

function drag(e) {
  if (!isDragging || !timerElement) return;

  const x = e.clientX - dragStartX;
  const y = e.clientY - dragStartY;

  // Keep timer within viewport bounds
  const maxX = window.innerWidth - timerElement.offsetWidth;
  const maxY = window.innerHeight - timerElement.offsetHeight;
  
  timerElement.style.left = Math.min(Math.max(0, x), maxX) + 'px';
  timerElement.style.top = Math.min(Math.max(0, y), maxY) + 'px';
  timerElement.style.right = 'auto';
}

function stopDragging() {
  if (!timerElement) return;
  
  isDragging = false;
  timerElement.style.cursor = 'move';
}

function updateTimer(timeLeft) {
  if (!timerElement) {
    timerElement = createTimerElement();
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerElement.textContent = `Time left: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Listen for time updates from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'timeUpdate') {
    updateTimer(message.timeLeft);
  }
});

// Clean up when the content script is unloaded
window.addEventListener('unload', () => {
  if (timerElement) {
    timerElement.remove();
  }
}); 