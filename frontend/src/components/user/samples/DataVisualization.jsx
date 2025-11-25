'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '@/styles/user/DataVisualization.module.css';

export default function DataVisualization({ samples }) {
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  

  // ===== LINE CHART (with animation, grid lines, tooltips) =====
  const animateLineChart = useCallback(() => {
    const canvas = lineChartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const tempSamples = samples.filter(s => s.temperature);
    if (tempSamples.length === 0) return;

    const tempData = tempSamples.map(s => parseFloat(s.temperature));
    const maxTemp = Math.max(...tempData);
    const minTemp = Math.min(...tempData);

    const padding = 50;
    const chartHeight = height - 60;
    const chartWidth = width - 60;
    const stepY = chartHeight / 5;
    const stepX = chartWidth / (tempData.length - 1);

    let progress = 0;
    const duration = 60; // frames

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = height - 30 - i * stepY;
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(width - 10, y);
        ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 10);
      ctx.lineTo(50, height - 30);
      ctx.lineTo(width - 10, height - 30);
      ctx.stroke();

      // Draw line (animated)
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();

      const endIndex = Math.floor((progress / duration) * tempData.length);
      tempData.slice(0, endIndex + 1).forEach((temp, index) => {
        const x = 50 + stepX * index;
        const y = height - 30 - ((temp - minTemp) / (maxTemp - minTemp)) * (height - 50);

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        // Draw data point
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#111827';
      ctx.font = '12px Arial';
      ctx.fillText('Temperature Over Time', width / 2 - 60, 20);
      ctx.fillText(`Max: ${maxTemp.toFixed(1)}°C`, 60, 30);
      ctx.fillText(`Min: ${minTemp.toFixed(1)}°C`, 60, 45);

      if (progress < duration) {
        progress++;
        requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();

    // Tooltip listener
    canvas.onmousemove = e => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const points = tempData.map((temp, index) => {
        const x = 50 + stepX * index;
        const y = height - 30 - ((temp - minTemp) / (maxTemp - minTemp)) * (height - 50);
        return { x, y, value: temp };
      });

      const hover = points.find(p => Math.hypot(p.x - mouseX, p.y - mouseY) < 6);
      if (hover) {
        setTooltip({ x: hover.x, y: hover.y, value: hover.value });
      } else {
        setTooltip(null);
      }
    };
  }, [samples]);

  // ===== BAR CHART =====
  const drawBarChart = useCallback(() => {
    const canvas = barChartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const typeCounts = {};
    samples.forEach(s => {
      typeCounts[s.sample_type] = (typeCounts[s.sample_type] || 0) + 1;
    });

    const types = Object.keys(typeCounts);
    const maxCount = Math.max(...Object.values(typeCounts));
    const barWidth = (width - 100) / types.length;

    types.forEach((type, index) => {
      const count = typeCounts[type];
      const barHeight = (count / maxCount) * (height - 60);
      const x = 50 + index * barWidth + 10;
      const y = height - 30 - barHeight;

      ctx.fillStyle = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5];
      ctx.fillRect(x, y, barWidth - 20, barHeight);

      ctx.fillStyle = '#111827';
      ctx.font = '11px Arial';
      ctx.save();
      ctx.translate(x + (barWidth - 20) / 2, height - 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(type, 0, 0);
      ctx.restore();

      ctx.fillText(count.toString(), x + (barWidth - 20) / 2 - 5, y - 5);
    });

    ctx.fillStyle = '#111827';
    ctx.font = '14px Arial';
    ctx.fillText('Samples by Type', width / 2 - 50, 20);
  }, [samples]);

  // ===== PIE CHART =====
  const drawPieChart = useCallback(() => {
    const canvas = pieChartRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    ctx.clearRect(0, 0, width, height);

    const typeCounts = {};
    samples.forEach(s => {
      typeCounts[s.sample_type] = (typeCounts[s.sample_type] || 0) + 1;
    });

    const total = samples.length;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    let currentAngle = -Math.PI / 2;

    Object.entries(typeCounts).forEach(([type, count], index) => {
      const sliceAngle = (count / total) * 2 * Math.PI;
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
      ctx.fillStyle = '#111827';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(type, labelX, labelY);
      ctx.fillText(`${((count / total) * 100).toFixed(1)}%`, labelX, labelY + 15);
      currentAngle += sliceAngle;
    });

    ctx.fillStyle = '#111827';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sample Distribution', centerX, 20);
  }, [samples]);

  useEffect(() => {
    if (samples && samples.length > 0) {
      animateLineChart();
      drawBarChart();
      drawPieChart();
    }
  }, [samples, animateLineChart, drawBarChart, drawPieChart]);

  return (
    <div className={styles.visualizationContainer}>
      <h2>Data Visualization</h2>
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard} style={{ position: 'relative' }}>
          <canvas ref={lineChartRef} width={400} height={250}></canvas>
          {tooltip && (
            <div
              style={{
                position: 'absolute',
                left: tooltip.x + 10,
                top: tooltip.y - 25,
                background: '#1e293b',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                pointerEvents: 'none',
              }}
            >
              {tooltip.value.toFixed(1)}°C
            </div>
          )}
        </div>
        <div className={styles.chartCard}>
          <canvas ref={barChartRef} width={400} height={250}></canvas>
        </div>
        <div className={styles.chartCard}>
          <canvas ref={pieChartRef} width={400} height={250}></canvas>
        </div>
      </div>
    </div>
  );
}
