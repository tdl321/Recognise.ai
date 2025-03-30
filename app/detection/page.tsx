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
import { WebcamCapture } from "@/components/detection/webcam-capture"
import { DetectionResults } from "@/components/detection/detection-results"
import { ZoneSelector } from "@/components/detection/zone-selector"
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
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [detectionZone, setDetectionZone] = useState<[number, number, number, number] | null>(null)
  const [recentDetections, setRecentDetections] = useState<any[]>([])
  const [cameraDimensions, setCameraDimensions] = useState({ width: 1280, height: 720 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [wasteDetection, setWasteDetection] = useState<{
    waste_type: string | null;
    is_correct: boolean;
  }>({
    waste_type: null,
    is_correct: false
  });

  const toggleDetection = () => {
    setIsDetecting(!isDetecting)
  }

  const handleDetectionResult = (result: any) => {
    if (!result) return

    console.log("Detection result:", result)
    
    // Set inference speed
    if (result.performance && result.performance.inference_fps) {
      setInferenceSpeed(1000 / result.performance.inference_fps)
    }
    
    // Set detections
    if (result.detections) {
      const formattedDetections = result.detections.map((detection: any) => ({
        class: detection.class_name,
        confidence: detection.confidence,
        bbox: detection.bbox
      }))
      setDetections(formattedDetections)
      
      // Add to recent detections
      if (result.waste_detection && result.waste_detection.waste_type) {
        const newDetection = {
          time: "Just now",
          type: result.waste_detection.waste_type,
          confidence: Math.round(result.detections[0]?.confidence * 100) || 0,
          correct: result.waste_detection.is_correct
        }
        
        setRecentDetections(prev => [newDetection, ...prev.slice(0, 3)])
        
        // Set waste detection info for alerts
        setWasteDetection({
          waste_type: result.waste_detection.waste_type,
          is_correct: result.waste_detection.is_correct
        });
      }
    }
    
    // Set result image if available
    if (result.result_image) {
      setResultImage(result.result_image)
    }
  }

  const handleZoneChange = (zone: [number, number, number, number] | null) => {
    setDetectionZone(zone)
    console.log("Detection zone updated:", zone)
  }

  const drawBoundingBoxes = (detections: any[]) => {
    const canvas = canvasRef.current
    
    if (!canvas || !resultImage) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // If we have a result image from the API, we don't need to draw boxes
    // as they're already in the image
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
          <Toggle
            pressed={showZones}
            onPressedChange={setShowZones}
            aria-label="Toggle zones"
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            {showZones ? "Zones Visible" : "Zones Hidden"}
          </Toggle>
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
                <div className="relative">
                  <WebcamCapture 
                    onDetectionResult={handleDetectionResult}
                    detectionZone={detectionZone}
                    captureInterval={isDetecting ? 2000 : 0} // 2 second interval when detecting
                    autoStart={isDetecting}
                  />
                  
                  {showZones && (
                    <ZoneSelector
                      imageWidth={cameraDimensions.width}
                      imageHeight={cameraDimensions.height}
                      onZoneChange={handleZoneChange}
                      className="absolute top-0 left-0 w-full h-full"
                    />
                  )}
                  
                  {resultImage && (
                    <div className="absolute top-0 left-0 w-full h-full">
                      <img 
                        src={resultImage} 
                        alt="Detection result" 
                        className="w-full h-full object-contain"
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                  )}
                </div>
                
                <canvas 
                  ref={canvasRef} 
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ pointerEvents: 'none' }}
                />
              </CardContent>
              <CardFooter className="p-2 border-t">
                <div className="w-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="confidence" className="text-xs">Confidence Threshold: {confidenceThreshold}%</Label>
                    <Select 
                      value={detectionMode} 
                      onValueChange={setDetectionMode}
                    >
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Detection Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continuous">Continuous</SelectItem>
                        <SelectItem value="on-demand">On Demand</SelectItem>
                        <SelectItem value="interval">Interval (2s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Slider 
                    id="confidence"
                    value={[confidenceThreshold]} 
                    onValueChange={(value) => setConfidenceThreshold(value[0])}
                    min={1} 
                    max={100} 
                    step={1}
                  />
                </div>
              </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <DetectionResults 
              detections={detections}
              inferenceSpeed={inferenceSpeed}
              wasteDetection={wasteDetection}
            />
            
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
              {recentDetections.length > 0 ? (
                <div className="space-y-2">
                  {recentDetections.map((detection, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${detection.correct ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <span>{detection.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{detection.type}</Badge>
                        <Badge className="bg-blue-500">{detection.confidence}%</Badge>
                        {detection.correct ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No detections recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

