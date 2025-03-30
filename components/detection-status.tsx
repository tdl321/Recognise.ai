"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

export function DetectionStatus() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  
  useEffect(() => {
    if (!chartRef.current) return
    
    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return
    
    // Cleanup previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }
    
    // Sample data - hourly detection count over a day
    const labels = [...Array(24).keys()].map(hour => `${hour}:00`)
    
    const data = {
      labels,
      datasets: [
        {
          label: "Detections",
          data: [0, 0, 0, 0, 0, 0, 4, 15, 23, 35, 28, 42, 45, 37, 29, 22, 18, 9, 3, 0, 0, 0, 0, 0],
          borderColor: "#8cb9a3",
          backgroundColor: "rgba(140, 185, 163, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
        {
          label: "Incorrect Disposals",
          data: [0, 0, 0, 0, 0, 0, 1, 3, 5, 4, 3, 5, 2, 3, 2, 1, 2, 1, 0, 0, 0, 0, 0, 0],
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
      ],
    }
    
    // Chart config
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              drawBorder: false,
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
          },
        },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 6,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        interaction: {
          mode: "nearest",
          intersect: false,
          axis: "x",
        },
      },
    })
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])
  
  return (
    <div className="w-full h-full relative">
      <div className="absolute top-0 right-0 flex gap-2">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Live Updates</span>
        </div>
      </div>
      <canvas ref={chartRef} />
    </div>
  )
} 