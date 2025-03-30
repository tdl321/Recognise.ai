"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

export function WasteDistributionChart() {
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
    
    // Sample data
    const data = {
      labels: ["Plastic", "Paper", "Glass", "Metal"],
      datasets: [
        {
          label: "Today's Distribution",
          data: [42, 65, 28, 35],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)",  // blue for plastic
            "rgba(16, 185, 129, 0.7)",  // green for paper
            "rgba(99, 102, 241, 0.7)",  // indigo for glass
            "rgba(245, 158, 11, 0.7)",  // amber for metal
          ],
          borderColor: [
            "rgb(59, 130, 246)",
            "rgb(16, 185, 129)",
            "rgb(99, 102, 241)",
            "rgb(245, 158, 11)",
          ],
          borderWidth: 1,
        },
      ],
    }
    
    // Chart config
    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          title: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || ""
                const value = context.parsed || 0
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                const percentage = Math.round((value / total) * 100)
                return `${label}: ${value} (${percentage}%)`
              }
            }
          }
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
    <div className="w-full h-full">
      <canvas ref={chartRef} />
    </div>
  )
} 