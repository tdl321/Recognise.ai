"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Play, Pause, RefreshCw, AlertTriangle, CheckCircle, Layers, Eye, EyeOff } from "lucide-react"
import { WebcamCapture } from "@/components/webcam-capture"
import { DetectionResults } from "@/components/detection-results"
import Link from "next/link"
import Webcam from "react-webcam"
import { Toggle } from "@/components/ui/toggle"
import { Loader2 } from "lucide-react"

export default function DetectionPage() {
  const [isDetecting, setIsDetecting] = useState(false)
  const [selectedTab, setSelectedTab] = useState("live")
  const [confidenceThreshold, setConfidenceThreshold] = useState(50)
  const [showZones, setShowZones] = useState(true)
  const [detectionMode, setDetectionMode] = useState("continuous")
  const [inferenceSpeed, setInferenceSpeed] = useState<number | null>(null)
  const [detections, setDetections] = useState<any[]>([])
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const toggleDetection = () => {
    setIsDetecting(!isDetecting)
  }

  useEffect(() => {
    if (!isDetecting) {
      return
    }

    const detectionInterval = setInterval(() => {
      captureAndDetect()
    }, 500)

    return () => {
      clearInterval(detectionInterval)
    }
  }, [isDetecting])

  const captureAndDetect = async () => {
    if (!webcamRef.current) return

    const startTime = performance.now()
    const imageSrc = webcamRef.current.getScreenshot()
    
    if (!imageSrc) return

    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const mockDetections = [
        { class: "Plastic", confidence: 0.92, bbox: [0.2, 0.3, 0.1, 0.15] },
        { class: "Paper", confidence: 0.87, bbox: [0.6, 0.4, 0.12, 0.1] }
      ]
      
      setDetections(mockDetections)
      
      const endTime = performance.now()
      setInferenceSpeed(endTime - startTime)
      
      drawBoundingBoxes(mockDetections)

    } catch (error) {
      console.error("Detection failed:", error)
    }
  }

  const drawBoundingBoxes = (detections: any[]) => {
    const canvas = canvasRef.current
    const video = webcamRef.current?.video
    
    if (!canvas || !video) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    detections.forEach(detection => {
      const [x, y, width, height] = detection.bbox
      const actualX = x * canvas.width
      const actualY = y * canvas.height
      const actualWidth = width * canvas.width
      const actualHeight = height * canvas.height
      
      let color
      switch(detection.class) {
        case "Plastic": color = "#3b82f6"
          break
        case "Paper": color = "#10b981"
          break
        case "Metal": color = "#f59e0b"
          break
        case "Glass": color = "#6366f1"
          break
        default: color = "#ef4444"
      }
      
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.strokeRect(actualX, actualY, actualWidth, actualHeight)
      
      ctx.fillStyle = color
      const textWidth = ctx.measureText(`${detection.class}: ${Math.round(detection.confidence * 100)}%`).width
      ctx.fillRect(actualX, actualY - 25, textWidth + 10, 25)
      
      ctx.fillStyle = "#ffffff"
      ctx.font = "16px sans-serif"
      ctx.fillText(
        `${detection.class}: ${Math.round(detection.confidence * 100)}%`, 
        actualX + 5, 
        actualY - 7
      )
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Detection</h1>
          <p className="text-muted-foreground">Real-time waste detection using YOLOv11</p>
        </div>
        <div className="flex items-center gap-4">
          <Toggle 
            pressed={isDetecting} 
            onPressedChange={toggleDetection}
            aria-label="Toggle detection"
            className="gap-2"
          >
            {isDetecting ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {isDetecting ? "Detection Active" : "Detection Off"}
          </Toggle>
          <Button variant="outline" size="sm" className="gap-1">
            <Camera className="h-4 w-4" />
            <span>Switch Camera</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
          <div className="lg:col-span-3 relative">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Camera Feed</CardTitle>
              </CardHeader>
              <CardContent className="p-2 relative">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-auto rounded-md"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: "environment"
                  }}
                />
                <canvas 
                  ref={canvasRef} 
                  className="absolute top-2 left-2 w-full h-full rounded-md"
                  style={{ pointerEvents: 'none' }}
                />
                {isDetecting && !detections.length && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Detection Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Inference Speed</p>
                    <p className="text-2xl font-bold">
                      {inferenceSpeed ? `${inferenceSpeed.toFixed(1)}ms` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Objects Detected</p>
                    <p className="text-2xl font-bold">{detections.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="text-base">YOLOv11</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Detection Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {detections.length === 0 && (
                    <p className="text-sm text-muted-foreground">No objects detected yet</p>
                  )}
                  {detections.map((detection, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded-md bg-muted">
                      <span className="font-medium">{detection.class}</span>
                      <span className="text-sm">{Math.round(detection.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Detections</CardTitle>
            <CardDescription>Latest waste items detected in the feed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isDetecting ? (
                <div className="space-y-2">
                  {[
                    { time: "Just now", type: "Plastic", confidence: 98, correct: true },
                    { time: "5s ago", type: "Paper", confidence: 87, correct: false },
                    { time: "12s ago", type: "Glass", confidence: 92, correct: true },
                    { time: "30s ago", type: "Metal", confidence: 95, correct: true },
                  ].map((detection, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${detection.correct ? "bg-green-500" : "bg-red-500"}`}
                        ></div>
                        <span className="font-medium">{detection.type}</span>
                        <span className="text-xs text-muted-foreground">{detection.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{detection.confidence}%</Badge>
                        {!detection.correct && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Active Detection</h3>
                  <p className="text-sm text-muted-foreground">Start detection to see real-time results</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

