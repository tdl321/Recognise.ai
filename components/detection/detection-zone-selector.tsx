"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Webcam from "react-webcam"
import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"

interface DetectionZoneSelectorProps {
  onZoneSelected: (zone: [number, number, number, number]) => void
  onCancel: () => void
}

export function DetectionZoneSelector({ onZoneSelected, onCancel }: DetectionZoneSelectorProps) {
  const webcamRef = useRef<Webcam>(null)
  const selectionRef = useRef<HTMLDivElement>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null)
  const [currentZone, setCurrentZone] = useState<[number, number, number, number] | null>(null)
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null)
  const [cameraReady, setCameraReady] = useState(false)

  useEffect(() => {
    if (selectionRef.current) {
      const rect = selectionRef.current.getBoundingClientRect()
      setContainerRect(rect)
    }
  }, [cameraReady])
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRect) return
    
    const x = e.clientX - containerRect.left
    const y = e.clientY - containerRect.top
    
    setStartPoint({ x, y })
    setIsSelecting(true)
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !startPoint || !containerRect) return
    
    const x = Math.min(Math.max(0, e.clientX - containerRect.left), containerRect.width)
    const y = Math.min(Math.max(0, e.clientY - containerRect.top), containerRect.height)
    
    const minX = Math.min(startPoint.x, x)
    const minY = Math.min(startPoint.y, y)
    const maxX = Math.max(startPoint.x, x)
    const maxY = Math.max(startPoint.y, y)
    
    // Convert coordinates to percentages of container size
    const left = (minX / containerRect.width) * 100
    const top = (minY / containerRect.height) * 100
    const width = ((maxX - minX) / containerRect.width) * 100
    const height = ((maxY - minY) / containerRect.height) * 100
    
    // Store as [x, y, width, height] in percentage values
    setCurrentZone([left, top, width, height])
  }
  
  const handleMouseUp = () => {
    setIsSelecting(false)
    
    // If a zone was selected and it has a meaningful size
    if (currentZone && currentZone[2] > 1 && currentZone[3] > 1) {
      // Zone is valid, keep it for confirmation
    } else {
      // Zone is too small, reset
      setCurrentZone(null)
    }
  }
  
  const confirmZone = () => {
    if (currentZone) {
      onZoneSelected(currentZone)
    }
  }
  
  const resetSelection = () => {
    setCurrentZone(null)
    setStartPoint(null)
  }
  
  const handleCameraReady = () => {
    setCameraReady(true)
  }
  
  return (
    <div className="flex flex-col space-y-4">
      <Card className="p-4 bg-amber-50 border-amber-200">
        <p className="text-amber-800 text-sm">
          Draw a box by clicking and dragging to define the detection zone. Only objects within this zone will be detected.
        </p>
      </Card>
      
      <div 
        ref={selectionRef}
        className="relative cursor-crosshair overflow-hidden rounded-md" 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          onUserMedia={handleCameraReady}
          videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: "environment"
          }}
          className="w-full h-auto rounded-md"
        />
        
        {/* Selection overlay */}
        {currentZone && (
          <div
            className="absolute bg-blue-500/30 border-2 border-blue-500 pointer-events-none"
            style={{
              left: `${currentZone[0]}%`,
              top: `${currentZone[1]}%`,
              width: `${currentZone[2]}%`,
              height: `${currentZone[3]}%`,
            }}
          />
        )}
        
        {/* Instruction overlay when no zone is selected */}
        {!currentZone && !isSelecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <p className="text-white text-lg font-medium">Click and drag to select a detection zone</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        
        <div className="space-x-2">
          {currentZone && (
            <Button 
              variant="outline" 
              onClick={resetSelection}
              className="flex items-center gap-1"
            >
              Reset
            </Button>
          )}
          
          <Button 
            onClick={confirmZone}
            disabled={!currentZone}
            className="flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            Confirm Zone
          </Button>
        </div>
      </div>
    </div>
  )
} 