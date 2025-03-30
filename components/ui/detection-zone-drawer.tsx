"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"

interface DetectionZoneDrawerProps {
  activeZone?: string | null
}

export function DetectionZoneDrawer({ activeZone }: DetectionZoneDrawerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
  const [zones, setZones] = useState<any[]>([])

  // Draw the zones on the canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all zones
    zones.forEach((zone) => {
      const { x, y, width, height } = zone.coords

      // Fill with semi-transparent color
      ctx.fillStyle = `${zone.color}40` // 25% opacity
      ctx.fillRect(x, y, width, height)

      // Draw border
      ctx.strokeStyle = zone.color
      ctx.lineWidth = activeZone === zone.id ? 3 : 2
      ctx.strokeRect(x, y, width, height)

      // Draw label
      ctx.fillStyle = "white"
      ctx.fillRect(x, y - 25, ctx.measureText(zone.name).width + 20, 25)

      ctx.fillStyle = zone.color
      ctx.font = "bold 14px sans-serif"
      ctx.fillText(zone.name, x + 10, y - 8)
    })
  }, [zones, activeZone])

  // Handle mouse events for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !activeZone) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setStartPoint({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeZone) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Redraw all zones
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw existing zones
    zones.forEach((zone) => {
      const { x, y, width, height } = zone.coords

      ctx.fillStyle = `${zone.color}40`
      ctx.fillRect(x, y, width, height)

      ctx.strokeStyle = zone.color
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, width, height)

      ctx.fillStyle = "white"
      ctx.fillRect(x, y - 25, ctx.measureText(zone.name).width + 20, 25)

      ctx.fillStyle = zone.color
      ctx.font = "bold 14px sans-serif"
      ctx.fillText(zone.name, x + 10, y - 8)
    })

    // Draw the new zone being created
    const width = x - startPoint.x
    const height = y - startPoint.y

    if (activeZone) {
      // Get color from parent component based on activeZone
      let color = "#3b82f6" // Default blue

      if (activeZone === "zone1") color = "#3b82f6" // Blue for recycling
      if (activeZone === "zone2") color = "#ef4444" // Red for general waste
      if (activeZone === "zone3") color = "#10b981" // Green for paper

      ctx.fillStyle = `${color}40`
      ctx.fillRect(startPoint.x, startPoint.y, width, height)

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.strokeRect(startPoint.x, startPoint.y, width, height)
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeZone) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Create a new zone
    const width = x - startPoint.x
    const height = y - startPoint.y

    // Only add if the zone has a minimum size
    if (Math.abs(width) > 20 && Math.abs(height) > 20) {
      // Get name and color based on activeZone
      let name = "New Zone"
      let color = "#3b82f6" // Default blue
      let type = "custom"

      if (activeZone === "zone1") {
        name = "Recycling Bin"
        color = "#3b82f6"
        type = "recycling"
      } else if (activeZone === "zone2") {
        name = "General Waste"
        color = "#ef4444"
        type = "general"
      } else if (activeZone === "zone3") {
        name = "Paper Bin"
        color = "#10b981"
        type = "paper"
      }

      const newZone = {
        id: `${activeZone}_${Date.now()}`,
        name,
        type,
        color,
        coords: {
          x: Math.min(startPoint.x, x),
          y: Math.min(startPoint.y, y),
          width: Math.abs(width),
          height: Math.abs(height),
        },
      }

      setZones([...zones, newZone])
    }

    setIsDrawing(false)
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full h-full object-cover"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  )
}

