"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Layers, Trash2, Plus, Move } from "lucide-react"

// Debounce function to limit frequent calls
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export interface DetectionZone {
  id: string
  name: string
  type: string // 'Plastic', 'Paper', 'Glass', 'Metal'
  color: string
  coordinates: [number, number, number, number] // [x1, y1, x2, y2]
}

interface EnhancedZoneSelectorProps {
  zones: DetectionZone[]
  activeZoneId: string | null
  imageWidth: number
  imageHeight: number
  onZoneChange: (zones: DetectionZone[]) => void
  onActiveZoneChange: (zoneId: string | null) => void
  className?: string
}

export function EnhancedZoneSelector({
  zones,
  activeZoneId,
  imageWidth,
  imageHeight,
  onZoneChange,
  onActiveZoneChange,
  className = "",
}: EnhancedZoneSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [isMoveMode, setIsMoveMode] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [newZone, setNewZone] = useState<[number, number, number, number] | null>(null)
  const [draggedZoneId, setDraggedZoneId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
  const [resizingZoneId, setResizingZoneId] = useState<string | null>(null)
  const [resizeCorner, setResizeCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null)
  const [newZoneType, setNewZoneType] = useState('Plastic')
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Get color for a waste type
  const getColorForWasteType = (type: string): string => {
    switch (type) {
      case 'Plastic': return '#3b82f6' // Blue
      case 'Paper': return '#10b981'   // Green
      case 'Glass': return '#6366f1'   // Indigo
      case 'Metal': return '#f59e0b'   // Amber
      default: return '#6b7280'        // Gray
    }
  }

  // Draw all zones on the canvas - debounced version to improve performance
  const drawZonesDebounced = useCallback(
    debounce(() => {
      const canvas = canvasRef.current
      if (!canvas) return
  
      const ctx = canvas.getContext('2d')
      if (!ctx) return
  
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
  
      // Draw existing zones
      zones.forEach(zone => {
        const [x1, y1, x2, y2] = zone.coordinates
        const width = x2 - x1
        const height = y2 - y1
  
        // Draw semi-transparent rectangle
        ctx.fillStyle = `${zone.color}40` // 25% opacity
        ctx.fillRect(x1, y1, width, height)
  
        // Draw border (thicker for active zone)
        ctx.strokeStyle = zone.color
        ctx.lineWidth = zone.id === activeZoneId ? 3 : 2
        ctx.strokeRect(x1, y1, width, height)
        
        // Draw zone name
        ctx.fillStyle = zone.color
        ctx.font = '14px sans-serif'
        
        // Background for the label
        const labelText = zone.name
        const labelWidth = ctx.measureText(labelText).width + 10
        ctx.fillStyle = zone.color
        ctx.fillRect(x1, y1, labelWidth, 22)
        
        // Label text
        ctx.fillStyle = '#ffffff'
        ctx.fillText(labelText, x1 + 5, y1 + 15)
        
        // Draw resize handles for active zone
        if (zone.id === activeZoneId) {
          const handleSize = 8
          const halfHandleSize = handleSize / 2
          
          // Draw handles at corners
          ctx.fillStyle = 'white'
          ctx.strokeStyle = zone.color
          ctx.lineWidth = 1
          
          // Top-left
          ctx.beginPath()
          ctx.rect(x1 - halfHandleSize, y1 - halfHandleSize, handleSize, handleSize)
          ctx.fill()
          ctx.stroke()
          
          // Top-right
          ctx.beginPath()
          ctx.rect(x2 - halfHandleSize, y1 - halfHandleSize, handleSize, handleSize)
          ctx.fill()
          ctx.stroke()
          
          // Bottom-left
          ctx.beginPath()
          ctx.rect(x1 - halfHandleSize, y2 - halfHandleSize, handleSize, handleSize)
          ctx.fill()
          ctx.stroke()
          
          // Bottom-right
          ctx.beginPath()
          ctx.rect(x2 - halfHandleSize, y2 - halfHandleSize, handleSize, handleSize)
          ctx.fill()
          ctx.stroke()
        }
      })
  
      // Draw zone being created
      if (isDrawing && newZone) {
        const [x1, y1, x2, y2] = newZone
        const width = x2 - x1
        const height = y2 - y1
  
        const newColor = getColorForWasteType(newZoneType)
        
        // Draw semi-transparent rectangle
        ctx.fillStyle = `${newColor}40` // 25% opacity
        ctx.fillRect(x1, y1, width, height)
  
        // Draw border
        ctx.strokeStyle = newColor
        ctx.lineWidth = 2
        ctx.strokeRect(x1, y1, width, height)
        
        // Show dimensions
        ctx.fillStyle = 'white'
        ctx.font = '12px sans-serif'
        ctx.fillText(`${Math.round(width)} x ${Math.round(height)}`, x1 + width / 2 - 20, y1 + height / 2)
      }
    }, 10), // 10ms debounce delay for smooth visuals
    [zones, activeZoneId, newZone, isDrawing, isDrawingMode, isMoveMode, newZoneType]
  );

  // Replace original drawZones with a function that calls the debounced version
  const drawZones = () => {
    drawZonesDebounced();
  };

  // Initialize canvas and draw zones, plus handle resizing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = containerRef.current
      if (container) {
        // Set canvas dimensions to match the container's display size
        const rect = container.getBoundingClientRect()
        
        // Store the new size in state for calculations
        const newWidth = rect.width;
        const newHeight = rect.height;
        
        // Only update if dimensions actually changed (prevents unnecessary redraws)
        if (canvasSize.width !== newWidth || canvasSize.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // Update size state
          setCanvasSize({ width: newWidth, height: newHeight });
          
          // Redraw with new dimensions
          drawZones();
        }
      }
    }

    // Initial sizing
    resizeCanvas()
    
    // Add resize listener with debouncing to prevent excessive redraws
    const debouncedResize = debounce(resizeCanvas, 100);
    window.addEventListener('resize', debouncedResize)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [canvasSize.width, canvasSize.height])

  // Redraw zones when they change
  useEffect(() => {
    drawZones()
  }, [zones, activeZoneId, newZone, isDrawingMode, isMoveMode])

  // Get canvas coordinates from event
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    
    // Scale by canvas ratio if the display size and internal size differ
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: x * scaleX,
      y: y * scaleY
    }
  }

  // Handle pointer down for drawing or selecting
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Capture pointer to track movements outside canvas
    canvas.setPointerCapture(e.pointerId)
    
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY)

    // Check if we're in drawing mode
    if (isDrawingMode) {
      setIsDrawing(true)
      setStartPos({ x, y })
      return
    }

    // Check if we're clicking on a resize handle of the active zone
    if (activeZoneId) {
      const activeZone = zones.find(zone => zone.id === activeZoneId)
      if (activeZone) {
        const [x1, y1, x2, y2] = activeZone.coordinates
        const handleSize = 8
        
        // Check each corner
        if (Math.abs(x - x1) <= handleSize && Math.abs(y - y1) <= handleSize) {
          setResizingZoneId(activeZoneId)
          setResizeCorner('tl')
          return
        }
        if (Math.abs(x - x2) <= handleSize && Math.abs(y - y1) <= handleSize) {
          setResizingZoneId(activeZoneId)
          setResizeCorner('tr')
          return
        }
        if (Math.abs(x - x1) <= handleSize && Math.abs(y - y2) <= handleSize) {
          setResizingZoneId(activeZoneId)
          setResizeCorner('bl')
          return
        }
        if (Math.abs(x - x2) <= handleSize && Math.abs(y - y2) <= handleSize) {
          setResizingZoneId(activeZoneId)
          setResizeCorner('br')
          return
        }
      }
    }

    // Check if we're clicking inside a zone to select/drag it
    for (let i = zones.length - 1; i >= 0; i--) {
      const zone = zones[i]
      const [x1, y1, x2, y2] = zone.coordinates
      
      if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        // Select this zone
        onActiveZoneChange(zone.id)
        
        // If in move mode, prepare for dragging
        if (isMoveMode) {
          setDraggedZoneId(zone.id)
          setDragOffset({ x: x - x1, y: y - y1 })
        }
        
        return
      }
    }
    
    // If we clicked outside of any zone, deselect
    onActiveZoneChange(null)
  }

  // Handle pointer move for drawing or dragging
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY)

    // If drawing a new zone
    if (isDrawingMode && isDrawing && startPos) {
      const newZoneCoords: [number, number, number, number] = [
        Math.min(startPos.x, x),
        Math.min(startPos.y, y),
        Math.max(startPos.x, x),
        Math.max(startPos.y, y),
      ]
      setNewZone(newZoneCoords)
      return
    }

    // If resizing a zone
    if (resizingZoneId && resizeCorner) {
      const zoneIndex = zones.findIndex(z => z.id === resizingZoneId)
      if (zoneIndex >= 0) {
        const updatedZones = [...zones]
        const [x1, y1, x2, y2] = updatedZones[zoneIndex].coordinates
        
        // Update coordinates based on which corner is being dragged
        switch (resizeCorner) {
          case 'tl':
            updatedZones[zoneIndex].coordinates = [x, y, x2, y2]
            break
          case 'tr':
            updatedZones[zoneIndex].coordinates = [x1, y, x, y2]
            break
          case 'bl':
            updatedZones[zoneIndex].coordinates = [x, y1, x2, y]
            break
          case 'br':
            updatedZones[zoneIndex].coordinates = [x1, y1, x, y]
            break
        }
        
        onZoneChange(updatedZones)
      }
      return
    }

    // If dragging a zone
    if (isMoveMode && draggedZoneId && dragOffset) {
      const zoneIndex = zones.findIndex(z => z.id === draggedZoneId)
      if (zoneIndex >= 0) {
        const updatedZones = [...zones]
        const [x1, y1, x2, y2] = updatedZones[zoneIndex].coordinates
        const width = x2 - x1
        const height = y2 - y1
        
        // Calculate new position (keep within bounds)
        const newX1 = Math.max(0, Math.min(x - dragOffset.x, canvas.width - width))
        const newY1 = Math.max(0, Math.min(y - dragOffset.y, canvas.height - height))
        
        updatedZones[zoneIndex].coordinates = [
          newX1, 
          newY1, 
          newX1 + width, 
          newY1 + height
        ]
        
        onZoneChange(updatedZones)
      }
    }
  }

  // Handle pointer up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId)
    }
    
    // If we were drawing a new zone, create it
    if (isDrawingMode && isDrawing && newZone) {
      const [x1, y1, x2, y2] = newZone
      
      // Only create if the zone has some size
      if (Math.abs(x2 - x1) > 10 && Math.abs(y2 - y1) > 10) {
        // Create new zone
        const zoneNumber = zones.length + 1
        const newZoneObject: DetectionZone = {
          id: `zone${Date.now()}`,
          name: `${newZoneType} Bin ${zoneNumber}`,
          type: newZoneType,
          color: getColorForWasteType(newZoneType),
          coordinates: newZone
        }
        
        onZoneChange([...zones, newZoneObject])
        onActiveZoneChange(newZoneObject.id)
      }
      
      // Reset drawing state
      setIsDrawing(false)
      setNewZone(null)
      setIsDrawingMode(false)
    }
    
    // Reset all interactive states
    setIsDrawing(false)
    setDraggedZoneId(null)
    setResizingZoneId(null)
    setResizeCorner(null)
  }

  // Toggle drawing mode
  const toggleDrawingMode = (type: string) => {
    setNewZoneType(type)
    setIsDrawingMode(true)
    setIsMoveMode(false)
  }

  // Toggle move mode
  const toggleMoveMode = () => {
    setIsMoveMode(!isMoveMode)
    setIsDrawingMode(false)
  }

  // Delete active zone
  const deleteActiveZone = () => {
    if (activeZoneId) {
      const updatedZones = zones.filter(zone => zone.id !== activeZoneId)
      onZoneChange(updatedZones)
      onActiveZoneChange(null)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className} w-full h-full`}>
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${isDrawingMode || isMoveMode ? 'cursor-crosshair' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      />
      
      {/* Tool palette */}
      <div className="absolute top-2 left-2 flex flex-col space-y-2 z-10">
        <Button
          size="sm"
          variant={isDrawingMode && newZoneType === 'Plastic' ? "default" : "outline"}
          onClick={() => toggleDrawingMode('Plastic')}
          className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Plastic
        </Button>
        <Button
          size="sm"
          variant={isDrawingMode && newZoneType === 'Paper' ? "default" : "outline"}
          onClick={() => toggleDrawingMode('Paper')}
          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Paper
        </Button>
        <Button
          size="sm"
          variant={isDrawingMode && newZoneType === 'Glass' ? "default" : "outline"}
          onClick={() => toggleDrawingMode('Glass')}
          className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Glass
        </Button>
        <Button
          size="sm"
          variant={isDrawingMode && newZoneType === 'Metal' ? "default" : "outline"}
          onClick={() => toggleDrawingMode('Metal')}
          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Metal
        </Button>
        <Button
          size="sm"
          variant={isMoveMode ? "default" : "outline"}
          onClick={toggleMoveMode}
          className="flex items-center gap-1"
        >
          <Move className="h-4 w-4" />
          Move
        </Button>
        {activeZoneId && (
          <Button
            size="sm"
            variant="outline"
            onClick={deleteActiveZone}
            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 border-red-200"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </div>
      
      {/* Current mode indicator */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-3 py-1 rounded-md">
        {isDrawingMode ? `Drawing ${newZoneType} Zone` : isMoveMode ? 'Move Mode' : 'Select Mode'}
      </div>
    </div>
  )
} 