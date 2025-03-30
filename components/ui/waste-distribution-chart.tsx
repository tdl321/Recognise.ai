"use client"

import { useState, useEffect } from "react"
import type React from "react"

import { useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface WasteDistributionChartProps {
  isLive?: boolean
}

export function WasteDistributionChart({ isLive = false }: WasteDistributionChartProps) {
  const [data, setData] = useState([
    {
      name: "Plastic",
      value: 35,
      color: "#3b82f6",
      subcategories: [
        { name: "PET Bottles", value: 15 },
        { name: "Food Containers", value: 10 },
        { name: "Packaging", value: 7 },
        { name: "Other Plastic", value: 3 },
      ],
    },
    {
      name: "Paper",
      value: 25,
      color: "#10b981",
      subcategories: [
        { name: "Cardboard", value: 12 },
        { name: "Office Paper", value: 8 },
        { name: "Newspapers", value: 3 },
        { name: "Paper Bags", value: 2 },
      ],
    },
    {
      name: "Glass",
      value: 15,
      color: "#6366f1",
      subcategories: [
        { name: "Bottles", value: 10 },
        { name: "Jars", value: 4 },
        { name: "Broken Glass", value: 1 },
      ],
    },
    {
      name: "Metal",
      value: 10,
      color: "#f59e0b",
      subcategories: [
        { name: "Aluminum Cans", value: 6 },
        { name: "Steel Cans", value: 3 },
        { name: "Foil", value: 1 },
      ],
    },
    {
      name: "Organic",
      value: 12,
      color: "#84cc16",
      subcategories: [
        { name: "Food Waste", value: 8 },
        { name: "Plant Material", value: 4 },
      ],
    },
    {
      name: "Other",
      value: 3,
      color: "#64748b",
      subcategories: [
        { name: "Textiles", value: 1 },
        { name: "E-waste", value: 1 },
        { name: "Miscellaneous", value: 1 },
      ],
    },
  ])

  // Simulate live data updates
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      setData((prevData) => {
        return prevData.map((item) => {
          // Add small random variations to simulate live data
          const variation = Math.random() * 6 - 3 // -3 to +3
          let newValue = item.value + variation

          // Ensure value stays within reasonable bounds
          newValue = Math.max(5, Math.min(45, newValue))

          return {
            ...item,
            value: Math.round(newValue),
          }
        })
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [isLive])

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [activeTab, setActiveTab] = useState("pie")
  const chartRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = (category: string, e: React.MouseEvent) => {
    setHoveredCategory(category)
    if (chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect()
      setTooltipPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect()
      setTooltipPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseLeave = () => {
    setHoveredCategory(null)
  }

  const hoveredData = data.find((item) => item.name === hoveredCategory)

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Normalize data to ensure total is 100%
  const normalizedData = data.map((item) => ({
    ...item,
    normalizedValue: Math.round((item.value / total) * 100),
  }))

  return (
    <div className="h-full flex flex-col" ref={chartRef}>
      <Tabs defaultValue="pie" className="flex-1" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pie">Pie Chart</TabsTrigger>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="pie" className="flex-1 flex items-center justify-center">
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="40" fill="#f3f4f6" />

              {/* Create pie chart segments */}
              {normalizedData.map((item, index) => {
                // Calculate segment angles
                let startAngle = 0
                for (let i = 0; i < index; i++) {
                  startAngle += (normalizedData[i].normalizedValue / 100) * 360
                }

                const endAngle = startAngle + (item.normalizedValue / 100) * 360

                // Convert angles to radians
                const startRad = ((startAngle - 90) * Math.PI) / 180
                const endRad = ((endAngle - 90) * Math.PI) / 180

                // Calculate path
                const x1 = 50 + 40 * Math.cos(startRad)
                const y1 = 50 + 40 * Math.sin(startRad)
                const x2 = 50 + 40 * Math.cos(endRad)
                const y2 = 50 + 40 * Math.sin(endRad)

                // Determine if the arc should be drawn as a large arc
                const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

                // Create SVG path
                const path = [`M 50 50`, `L ${x1} ${y1}`, `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(" ")

                return (
                  <path
                    key={item.name}
                    d={path}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="1"
                    className="transition-all duration-300 ease-in-out hover:opacity-80 cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(item.name, e)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      transform: hoveredCategory === item.name ? "scale(1.05)" : "scale(1)",
                      transformOrigin: "50px 50px",
                    }}
                  />
                )
              })}

              {/* Center circle for donut chart */}
              <circle cx="50" cy="50" r="20" fill="white" />

              {/* Center text */}
              <text x="50" y="48" textAnchor="middle" dominantBaseline="middle" fontSize="6" fontWeight="bold">
                Total
              </text>
              <text x="50" y="58" textAnchor="middle" dominantBaseline="middle" fontSize="6" fill="#6b7280">
                Waste
              </text>
            </svg>

            {/* Tooltip for hover */}
            {hoveredCategory && hoveredData && (
              <div
                className="absolute bg-white p-2 rounded-md shadow-lg z-10 pointer-events-none"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y - 80}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="font-bold text-sm">
                  {hoveredData.name}: {hoveredData.normalizedValue}%
                </div>
                <div className="text-xs mt-1">
                  {hoveredData.subcategories.map((sub, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span>{sub.name}:</span>
                      <span className="font-medium">{sub.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bar" className="flex-1">
          <div className="h-full flex flex-col justify-center">
            <div className="space-y-3">
              {normalizedData.map((item) => (
                <div key={item.name} className="flex items-center">
                  <div className="w-24 text-sm">{item.name}</div>
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-in-out"
                      style={{
                        width: `${item.normalizedValue}%`,
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                  <div className="w-12 text-right text-sm font-medium">{item.normalizedValue}%</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {activeTab === "pie" && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {normalizedData.map((item) => (
            <Badge
              key={item.name}
              variant="outline"
              className="flex items-center gap-1 cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter(item.name, e as React.MouseEvent)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span>{item.name}</span>
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-2 text-xs text-center text-muted-foreground">Today's waste distribution data</div>
    </div>
  )
}

