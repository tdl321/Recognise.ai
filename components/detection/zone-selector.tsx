"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Layers, Trash2 } from "lucide-react"

interface ZoneSelectorProps {
  onZoneChange: (zone: [number, number, number, number] | null) => void
  imageWidth: number
  imageHeight: number
  className?: string
}

export function ZoneSelector({
  onZoneChange,
  imageWidth,
  imageHeight,
  className = "",
}: ZoneSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentZone, setCurrentZone] = useState<[number, number, number, number] | null>(null)
  const [isSelectingMode, setIsSelectingMode] = useState(false)

  // Initialize canvas and draw existing zone
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = imageWidth
    canvas.height = imageHeight

    drawZones()
  }, [imageWidth, imageHeight, currentZone])

  const drawZones = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // If we have a zone, draw it
    if (currentZone) {
      const [x1, y1, x2, y2] = currentZone
      const width = x2 - x1
      const height = y2 - y1

      // Draw semi-transparent rectangle
      ctx.fillStyle = "rgba(0, 123, 255, 0.2)"
      ctx.fillRect(x1, y1, width, height)

      // Draw border
      ctx.strokeStyle = "rgba(0, 123, 255, 0.8)"
      ctx.lineWidth = 2
      ctx.strokeRect(x1, y1, width, height)
      
      // Draw label
      ctx.fillStyle = "rgba(0, 123, 255, 1)"
      ctx.font = "14px sans-serif"
      ctx.fillText("Detection Zone", x1 + 5, y1 + 20)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelectingMode) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setStartPos({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelectingMode || !isDrawing || !startPos) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newZone: [number, number, number, number] = [
      Math.min(startPos.x, x),
      Math.min(startPos.y, y),
      Math.max(startPos.x, x),
      Math.max(startPos.y, y),
    ]

    setCurrentZone(newZone)
  }

  const handleMouseUp = () => {
    if (!isSelectingMode) return

    setIsDrawing(false)
    
    if (currentZone) {
      onZoneChange(currentZone)
      setIsSelectingMode(false)
    }
  }

  const toggleSelectingMode = () => {
    setIsSelectingMode(!isSelectingMode)
  }

  const clearZone = () => {
    setCurrentZone(null)
    onZoneChange(null)
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full ${isSelectingMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute top-2 right-2 flex space-x-2">
        <Button
          size="sm"
          variant={isSelectingMode ? "default" : "outline"}
          onClick={toggleSelectingMode}
          className="flex items-center gap-1"
        >
          <Layers className="h-4 w-4" />
          {isSelectingMode ? "Drawing..." : "Draw Zone"}
        </Button>
        {currentZone && (
          <Button
            size="sm"
            variant="outline"
            onClick={clearZone}
            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 border-red-200"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
} 