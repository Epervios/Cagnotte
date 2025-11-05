import { useEffect, useRef } from 'react';

export function MonthlyChart({ data, height = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size accounting for device pixel ratio
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.offsetWidth;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find max value
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const minValue = 0;
    const valueRange = maxValue - minValue;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (graphHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Y-axis labels
      const value = maxValue - (valueRange / 5) * i;
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(0), padding - 5, y + 4);
    }

    // Draw bars
    const barWidth = graphWidth / data.length * 0.7;
    const barSpacing = graphWidth / data.length;

    data.forEach((point, index) => {
      const x = padding + index * barSpacing + barSpacing * 0.15;
      const barHeight = (point.value / maxValue) * graphHeight;
      const y = padding + graphHeight - barHeight;

      // Draw bar
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#0F5C4C');
      gradient.addColorStop(1, '#0a4739');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw month label
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(point.label, x + barWidth / 2, height - 10);

      // Draw value on top of bar
      if (point.value > 0) {
        ctx.fillStyle = '#0F5C4C';
        ctx.font = 'bold 11px Inter';
        ctx.fillText(point.value.toFixed(0), x + barWidth / 2, y - 5);
      }
    });

  }, [data, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px` }}
    />
  );
}
