"use client"

import { useRef, useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Camera, AlertTriangle } from "lucide-react"

interface WebcamCaptureProps {
  isDetecting: boolean
  showZones: boolean
}

export function WebcamCapture({ isDetecting, showZones }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [detections, setDetections] = useState<any[]>([])
  const [fps, setFps] = useState(0)

  // Simulated detection zones
  const zones = [
    {
      id: "zone1",
      name: "Recycling Bin",
      type: "recycling",
      color: "rgba(59, 130, 246, 0.3)",
      coords: { x: 50, y: 100, width: 200, height: 150 },
    },
    {
      id: "zone2",
      name: "General Waste",
      type: "general",
      color: "rgba(239, 68, 68, 0.3)",
      coords: { x: 300, y: 150, width: 180, height: 120 },
    },
    {
      id: "zone3",
      name: "Paper Bin",
      type: "paper",
      color: "rgba(16, 185, 129, 0.3)",
      coords: { x: 150, y: 300, width: 220, height: 100 },
    },
  ]

  // Simulated detections
  const simulatedDetections = [
    { id: 1, class: "Plastic", confidence: 0.92, bbox: [120, 150, 80, 60] },
    { id: 2, class: "Paper", confidence: 0.87, bbox: [350, 200, 70, 50] },
    { id: 3, class: "Glass", confidence: 0.78, bbox: [220, 320, 60, 40] },
  ]

  useEffect(() => {
    // Access webcam
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions.")
        console.error(err)
      }
    }

    setupCamera()

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        const tracks = stream.getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  // Simulate detection process
  useEffect(() => {
    if (!isDetecting) {
      setDetections([])
      return
    }

    let frameCount = 0
    let lastTime = performance.now()
    let animationFrameId: number

    const detectFrame = () => {
      if (!videoRef.current || !canvasRef.current) return

      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

      // Draw video frame
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)

      // Draw zones if enabled
      if (showZones) {
        zones.forEach((zone) => {
          ctx.fillStyle = zone.color
          ctx.fillRect(zone.coords.x, zone.coords.y, zone.coords.width, zone.coords.height)

          ctx.strokeStyle = zone.color.replace("0.3", "0.8")
          ctx.lineWidth = 2
          ctx.strokeRect(zone.coords.x, zone.coords.y, zone.coords.width, zone.coords.height)

          ctx.fillStyle = "white"
          ctx.font = "14px sans-serif"
          ctx.fillText(zone.name, zone.coords.x + 5, zone.coords.y + 20)
        })
      }

      // Simulate detections with random variations
      const currentDetections = [...simulatedDetections]
      if (Math.random() > 0.7) {
        // Occasionally add or remove detections to simulate real-time changes
        if (Math.random() > 0.5 && currentDetections.length < 5) {
          const classes = ["Plastic", "Paper", "Glass", "Metal"]
          const randomClass = classes[Math.floor(Math.random() * classes.length)]
          const randomX = Math.floor(Math.random() * (canvasRef.current.width - 100))
          const randomY = Math.floor(Math.random() * (canvasRef.current.height - 100))

          currentDetections.push({
            id: Date.now(),
            class: randomClass,
            confidence: 0.7 + Math.random() * 0.25,
            bbox: [randomX, randomY, 60 + Math.random() * 40, 40 + Math.random() * 30],
          })
        } else if (currentDetections.length > 1) {
          currentDetections.pop()
        }
      }

      // Draw bounding boxes for detections
      currentDetections.forEach((detection) => {
        const [x, y, width, height] = detection.bbox

        // Slightly randomize position to simulate movement
        const jitterX = Math.random() * 6 - 3
        const jitterY = Math.random() * 6 - 3

        const boxX = x + jitterX
        const boxY = y + jitterY

        // Determine color based on class
        let color = "rgba(59, 130, 246, 1)" // Default blue
        if (detection.class === "Paper") color = "rgba(16, 185, 129, 1)" // Green
        if (detection.class === "Glass") color = "rgba(99, 102, 241, 1)" // Indigo
        if (detection.class === "Metal") color = "rgba(245, 158, 11, 1)" // Amber

        // Draw bounding box
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(boxX, boxY, width, height)

        // Draw label background
        ctx.fillStyle = color
        const textWidth = ctx.measureText(`${detection.class} ${Math.round(detection.confidence * 100)}%`).width + 10
        ctx.fillRect(boxX, boxY - 25, textWidth, 25)

        // Draw label text
        ctx.fillStyle = "white"
        ctx.font = "bold 14px sans-serif"
        ctx.fillText(`${detection.class} ${Math.round(detection.confidence * 100)}%`, boxX + 5, boxY - 8)
      })

      // Update detections state
      setDetections(currentDetections)

      // Calculate FPS
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)))
        frameCount = 0
        lastTime = now
      }

      // Continue detection loop
      animationFrameId = requestAnimationFrame(detectFrame)
    }

    detectFrame()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isDetecting, showZones])

  return (
    <div className="relative w-full h-full bg-black">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black">
          <Camera className="w-16 h-16 mb-4 text-gray-500" />
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm text-gray-400 mt-2">
            Please ensure your camera is connected and permissions are granted
          </p>
        </div>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full object-cover" />

          {/* Status indicators */}
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <Badge variant={isDetecting ? "default" : "outline"} className="bg-black/50 backdrop-blur-sm">
              {isDetecting ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                  Live Detection
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                  Detection Paused
                </span>
              )}
            </Badge>

            {isDetecting && (
              <Badge variant="outline" className="bg-black/50 backdrop-blur-sm">
                {fps} FPS
              </Badge>
            )}
          </div>

          {/* Show Zones indicator - centered vertically */}
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
            {showZones ? "Zones Visible" : "Zones Hidden"}
          </div>

          {/* Detection count */}
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
            {detections.length} objects detected
          </div>

          {/* Incorrect disposal alert */}
          {isDetecting && Math.random() > 0.7 && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <div>
                <p className="font-medium">Incorrect Disposal Detected</p>
                <p className="text-sm">Plastic item detected in Paper bin</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

