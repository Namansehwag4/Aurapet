document.addEventListener('DOMContentLoaded', () => {

  // Dynamic API Host Configuration (Local developer vs production URL)
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://aurapet.onrender.com/api'; // Replace with final deployed Render API in future

  // ==========================================
  // 1. ROUTE GUARD (AUTHENTICATION CHECK)
  // ==========================================
  const token = sessionStorage.getItem('token');
  const sessionUserName = sessionStorage.getItem('userName');

  if (!token) {
    alert('Session expired or unauthorized. Please log in.');
    window.location.href = 'index.html';
    return;
  }

  // Display user details
  if (sessionUserName) {
    document.getElementById('greetingUserName').textContent = sessionUserName;
  }

  // Handle Logout
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', () => {
    sessionStorage.clear();
    alert('Logged out successfully.');
    window.location.href = 'index.html';
  });

  // Global variables to hold active states and chart objects
  let activePet = null;
  let hrChartInstance = null;
  let stepsChartInstance = null;
  let feedLogs = [];

  // DOM Elements
  const petGreetingTitle = document.getElementById('petGreetingTitle');
  const petPlanBadge = document.getElementById('petPlanBadge');
  const alertBanner = document.getElementById('alertBanner');
  const alertMsg = document.getElementById('alertMsg');
  const feedLogList = document.getElementById('feedLogList');
  const dispenseBtn = document.getElementById('dispenseBtn');

  // ==========================================
  // 2. INITIALIZE OWNER DASHBOARD DATA
  // ==========================================
  const initDashboard = async () => {
    try {
      // Step 1: Fetch user's registered pets
      const response = await fetch(`${API_URL}/pets`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const resData = await response.json();

      if (!resData.success || resData.count === 0) {
        alert('No registered pet profiles found. Redirecting to onboarding quiz.');
        window.location.href = 'index.html#quiz';
        return;
      }

      // Select active pet (prefer sessionStorage if set, else first pet in response)
      const storedPetId = sessionStorage.getItem('activePetId');
      if (storedPetId) {
        activePet = resData.data.find(p => p._id === storedPetId) || resData.data[0];
      } else {
        activePet = resData.data[0];
        sessionStorage.setItem('activePetId', activePet._id);
      }

      // Update pet UI details
      petGreetingTitle.textContent = `${activePet.name}'s Vitals`;
      petPlanBadge.textContent = activePet.planName;
      document.getElementById('valStepsGoal').textContent = `Goal: ${activePet.type === 'cat' ? '5,000' : '12,000'} steps`;

      // Step 2: Fetch Telemetry History & Render Charts
      await loadTelemetryHistory(activePet._id);

      // Step 3: Start 10-second polling interval for real-time vitals
      startLiveTelemetryPoller(activePet._id, activePet.type);

    } catch (error) {
      console.error('Error initializing dashboard:', error);
      alert('Failed to connect to backend server. Please verify the Node server is running.');
    }
  };

  // ==========================================
  // 3. FETCH HISTORY AND RENDER CHARTS
  // ==========================================
  const loadTelemetryHistory = async (petId) => {
    try {
      const response = await fetch(`${API_URL}/telemetry/${petId}/history`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.error || 'Failed to fetch history logs');
      }

      const telemetryLogs = resData.data;

      // Update current card stats on screen with the latest record
      if (telemetryLogs.length > 0) {
        const latest = telemetryLogs[telemetryLogs.length - 1];
        updateVitalsUI(latest);
      }

      // Format datasets for Chart.js
      const labels = telemetryLogs.map(log => {
        const d = new Date(log.timestamp);
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      });
      const heartRateData = telemetryLogs.map(log => log.heartRate);
      const stepsData = telemetryLogs.map(log => log.steps);

      // Render Heart Rate Chart (Line)
      const ctxHR = document.getElementById('heartRateChart').getContext('2d');
      hrChartInstance = new Chart(ctxHR, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Heart Rate (bpm)',
            data: heartRateData,
            borderColor: '#FFDDBF',
            backgroundColor: 'rgba(255, 221, 191, 0.15)',
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#171717',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(23,23,23,0.04)' }, ticks: { color: '#5A5A5A' } },
            x: { grid: { display: false }, ticks: { color: '#5A5A5A' } }
          }
        }
      });

      // Render Steps Chart (Bar)
      const ctxSteps = document.getElementById('stepsChart').getContext('2d');
      stepsChartInstance = new Chart(ctxSteps, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Steps Taken',
            data: stepsData,
            backgroundColor: '#A8E8E2',
            borderColor: '#60cfc2',
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 24
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(23,23,23,0.04)' }, ticks: { color: '#5A5A5A' } },
            x: { grid: { display: false }, ticks: { color: '#5A5A5A' } }
          }
        }
      });

    } catch (error) {
      console.error('Error loading telemetry history:', error);
    }
  };

  // ==========================================
  // 4. REAL-TIME VITAL CARDS UPDATER
  // ==========================================
  const updateVitalsUI = (vitals) => {
    document.getElementById('valHeartRate').innerHTML = `${vitals.heartRate} <span style="font-size: 1rem; font-weight: normal; color: var(--color-text-secondary);">bpm</span>`;
    document.getElementById('valSteps').textContent = vitals.steps.toLocaleString('en-IN');
    document.getElementById('valFoodCapacity').innerHTML = `${vitals.foodCapacity} <span style="font-size: 1rem; font-weight: normal; color: var(--color-text-secondary);">g</span>`;
    document.getElementById('valCollarBattery').innerHTML = `${vitals.collarBattery} <span style="font-size: 1rem; font-weight: normal; color: var(--color-text-secondary);">%</span>`;

    // Visual indicators checks
    const hrStatus = document.getElementById('statusHeartRate');
    if (vitals.heartRate > 120) {
      hrStatus.textContent = activePet.type === 'cat' ? 'Relaxed / Purring' : 'Active Play';
      hrStatus.classList.remove('warning');
    } else {
      hrStatus.textContent = 'Active Rest';
      hrStatus.classList.remove('warning');
    }

    const foodStatus = document.getElementById('statusFoodCapacity');
    if (vitals.foodCapacity < 500) {
      foodStatus.textContent = 'Refill Tank Soon';
      foodStatus.classList.add('warning');
    } else {
      foodStatus.textContent = 'Tank secure';
      foodStatus.classList.remove('warning');
    }

    const batteryStatus = document.getElementById('statusCollarBattery');
    if (vitals.collarBattery < 15) {
      batteryStatus.textContent = 'Low Battery Alert';
      batteryStatus.classList.add('warning');
    } else {
      batteryStatus.textContent = 'Charge stable';
      batteryStatus.classList.remove('warning');
    }
  };

  // ==========================================
  // 5. LIVE TELEMETRY POLLING LOOP
  // ==========================================
  const startLiveTelemetryPoller = (petId, petType) => {
    // Poll every 10 seconds
    setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/telemetry/${petId}/latest`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const resData = await response.json();

        if (resData.success) {
          const vitals = resData.data;
          
          // Update cards UI
          updateVitalsUI(vitals);

          // Append live data point to Chart instances dynamically
          const timestampLabel = new Date(vitals.timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          // Check if it is a new data point to prevent duplicate labels on graphs
          if (hrChartInstance && !hrChartInstance.data.labels.includes(timestampLabel)) {
            // Add to heart rate chart
            hrChartInstance.data.labels.push(timestampLabel);
            hrChartInstance.data.datasets[0].data.push(vitals.heartRate);

            // Add to steps chart
            stepsChartInstance.data.labels.push(timestampLabel);
            stepsChartInstance.data.datasets[0].data.push(vitals.steps);

            // Keep charts looking neat by limiting max points (slide window)
            if (hrChartInstance.data.labels.length > 8) {
              hrChartInstance.data.labels.shift();
              hrChartInstance.data.datasets[0].data.shift();

              stepsChartInstance.data.labels.shift();
              stepsChartInstance.data.datasets[0].data.shift();
            }

            // Redraw charts
            hrChartInstance.update();
            stepsChartInstance.update();
          }
        }
      } catch (error) {
        console.warn('Real-time telemetry poll failed. Retrying in next interval.', error);
      }
    }, 10000);
  };

  // ==========================================
  // 6. REMOTE FEED ACTION (DISPENSE FOOD)
  // ==========================================
  if (dispenseBtn) {
    dispenseBtn.addEventListener('click', async () => {
      if (!activePet) return;

      dispenseBtn.disabled = true;
      dispenseBtn.querySelector('.action-details span:first-child').textContent = 'Dispensing Kibble...';

      try {
        const response = await fetch(`${API_URL}/telemetry/${activePet._id}/dispense`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const resData = await response.json();

        if (resData.success) {
          const updatedLog = resData.data;

          // Update vitals summary UI immediately
          updateVitalsUI(updatedLog);

          // Display success notification
          alertMsg.textContent = resData.message;
          alertBanner.style.display = 'flex';
          setTimeout(() => { alertBanner.style.display = 'none'; }, 6000);

          // Add to recent feed list
          const timestamp = new Date(updatedLog.timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          });
          feedLogs.unshift(`Served 100g at ${timestamp}`);
          updateFeedLogsUI();

          // Push updated excitement heart rate to chart immediately
          if (hrChartInstance) {
            hrChartInstance.data.datasets[0].data[hrChartInstance.data.datasets[0].data.length - 1] = updatedLog.heartRate;
            hrChartInstance.update();
          }

        } else {
          throw new Error(resData.error || 'Dispense failed');
        }
      } catch (error) {
        console.error('Dispense remote command error:', error);
        alert(error.message || 'Server connection error. Failed to dispense.');
      } finally {
        dispenseBtn.disabled = false;
        dispenseBtn.querySelector('.action-details span:first-child').textContent = 'Dispense Meal (100g)';
      }
    });
  }

  // Update feeding logs items UI
  const updateFeedLogsUI = () => {
    if (feedLogs.length === 0) {
      feedLogList.innerHTML = `<li class="feed-log-item" style="color:var(--color-text-secondary); font-style:italic;">No feeds logged today yet.</li>`;
      return;
    }
    
    // Display up to 3 recent logs
    feedLogList.innerHTML = feedLogs.slice(0, 3).map(log => `
      <li class="feed-log-item">
        <span>${log.split(' at ')[0]}</span>
        <span style="font-weight: 600; font-family: var(--font-heading); color: var(--color-text-secondary);">${log.split(' at ')[1]}</span>
      </li>
    `).join('');
  };

  // Launch dashboard initialization!
  initDashboard();

});
