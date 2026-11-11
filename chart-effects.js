(() => {
  const canvas = document.getElementById('muisyle-pulse-chart');
  if (!canvas || !window.Chart) return;

  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, 'rgba(117, 230, 237, 0.28)');
  gradient.addColorStop(1, 'rgba(117, 230, 237, 0.015)');

  new Chart(context, {
    type: 'line',
    data: {
      labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      datasets: [{
        label: 'Illustrative activity index',
        data: [28, 36, 31, 49, 43, 62, 56],
        borderColor: '#78e5ed',
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.42,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#b4a8ff',
        pointBorderColor: '#e7fbff',
        pointBorderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#aab8d8',
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 7,
            padding: 18,
            font: { family: 'DM Sans', size: 10 }
          }
        },
        tooltip: {
          backgroundColor: '#101a32',
          borderColor: '#75e6ed66',
          borderWidth: 1,
          titleColor: '#f5f6ff',
          bodyColor: '#b9c7e6',
          padding: 12,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#8796b8', font: { family: 'DM Sans', size: 9 } }
        },
        y: {
          beginAtZero: true,
          suggestedMax: 80,
          border: { display: false, dash: [3, 5] },
          grid: { color: 'rgba(157, 176, 220, 0.11)' },
          ticks: { color: '#8796b8', stepSize: 20, font: { family: 'DM Sans', size: 9 } }
        }
      }
    }
  });
})();
