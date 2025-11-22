import { useEffect, useRef } from "react";
import { UsageData } from "@shared/schema";

interface UsageChartProps {
  data: UsageData[];
  height?: number;
}

declare global {
  interface Window {
    Chart: any;
  }
}

export function UsageChart({ data, height = 300 }: UsageChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "rgb(210, 220, 240)" : "rgb(30, 41, 59)";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

    chartRef.current = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((d) => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: "Total Requests",
            data: data.map((d) => d.totalRequests),
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Successful",
            data: data.map((d) => d.successfulRequests),
            borderColor: "rgb(34, 197, 94)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: "Failed",
            data: data.map((d) => d.failedRequests),
            borderColor: "rgb(239, 68, 68)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: textColor,
              usePointStyle: true,
              padding: 15,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            grid: {
              color: gridColor,
            },
            ticks: {
              color: textColor,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: gridColor,
            },
            ticks: {
              color: textColor,
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={canvasRef} height={height} />;
}
