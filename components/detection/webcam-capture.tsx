"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, RefreshCw, Loader2 } from "lucide-react"

interface WebcamCaptureProps {
  onCapture?: (imageSrc: string | null) => void
  onDetectionResult?: (result: any) => void
  detectionZone?: [number, number, number, number] | null
  captureInterval?: number
  autoStart?: boolean
}

export function WebcamCapture({ 
  onCapture, 
  onDetectionResult,
  detectionZone = null,
  captureInterval = 0, 
  autoStart = false 
}: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null)
  const [isCapturing, setIsCapturing] = useState(autoStart)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  
  const captureAndDetect = useCallback(async () => {
    if (isProcessing || !cameraReady) return null;
    
    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) {
      console.warn("Failed to capture image from webcam")
      return null;
    }
    
    console.log("Image captured successfully")
    
    if (onCapture) {
      onCapture(imageSrc)
    }
    
    // Only proceed with API call if we have a detection result handler
    if (onDetectionResult) {
      try {
        setIsProcessing(true)
        
        // Convert base64 to blob
        const base64Data = imageSrc.replace(/^data:image\/jpeg;base64,/, "")
        const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob())
        
        // Create FormData object
        const formData = new FormData()
        formData.append('file', blob, 'webcam-capture.jpg')
        
        // Add detection zone if provided
        if (detectionZone) {
          formData.append('detection_zone', JSON.stringify(detectionZone))
        }
        
        // Send to API
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/detect`
        console.log("Sending request to API:", apiUrl)
        
        // Mock detection result for demo (since we don't have a real backend)
        // Remove this in production with a real backend
        const mockResult = {
          detections: [
            {
              class_name: Math.random() > 0.5 ? "plastic" : "paper",
              confidence: 0.7 + Math.random() * 0.2,
              bbox: [100, 100, 200, 200]
            }
          ],
          waste_detection: {
            waste_type: Math.random() > 0.5 ? "plastic" : "paper",
            is_correct: Math.random() > 0.3
          },
          performance: {
            inference_fps: 20 + Math.random() * 40
          }
        }
        
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
          })
          
          if (!response.ok) {
            console.warn(`API error: ${response.status}. Using mock data instead.`)
            onDetectionResult(mockResult)
          } else {
            const result = await response.json()
            onDetectionResult(result)
          }
        } catch (error) {
          console.warn('Detection API error:', error, 'Using mock data instead')
          onDetectionResult(mockResult)
        }
      } catch (error) {
        console.error('Detection error:', error)
      } finally {
        setIsProcessing(false)
      }
    }
    
    return imageSrc
  }, [onCapture, onDetectionResult, detectionZone, isProcessing, cameraReady])
  
  // Set up interval-based capture if enabled
  useEffect(() => {
    if (isCapturing && captureInterval > 0 && cameraReady) {
      console.log(`Setting up capture interval: ${captureInterval}ms`)
      intervalRef.current = setInterval(captureAndDetect, captureInterval)
      return () => {
        if (intervalRef.current) {
          console.log("Clearing capture interval")
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [isCapturing, captureInterval, captureAndDetect, cameraReady])
  
  const toggleCapture = useCallback(() => {
    if (isCapturing) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setIsCapturing(false)
    } else {
      setIsCapturing(true)
      if (captureInterval > 0 && cameraReady) {
        intervalRef.current = setInterval(captureAndDetect, captureInterval)
      } else {
        // If no interval, just capture once
        captureAndDetect()
      }
    }
  }, [isCapturing, captureInterval, captureAndDetect, cameraReady])
  
  const handleCameraError = (error: string | DOMException) => {
    console.error('Webcam error:', error)
    setCameraError("Camera access error. Please check permissions.")
    setCameraReady(false)
  }
  
  const handleCameraReady = () => {
    console.log("Camera is ready")
    setCameraReady(true)
    setCameraError(null)
  }
  
  const resetCamera = () => {
    setCameraError(null)
    // This forces a remount of the webcam component
    setIsCapturing(false)
    setCameraReady(false)
    setTimeout(() => setIsCapturing(autoStart), 100)
  }
  
  return (
    <div className="relative">
      {cameraError ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="text-red-500 mb-2">{cameraError}</div>
            <Button onClick={resetCamera} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Camera
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "environment"
            }}
            onUserMedia={handleCameraReady}
            onUserMediaError={handleCameraError}
            className="w-full h-auto rounded-md shadow-md"
          />
          <div className="absolute bottom-3 right-3 flex space-x-2">
            {captureInterval > 0 ? (
              <Button 
                size="sm" 
                onClick={toggleCapture} 
                className={`${isCapturing ? 'bg-red-500 hover:bg-red-600' : 'bg-black/50 hover:bg-black/70'}`}
                disabled={isProcessing || !cameraReady}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-1" />
                )}
                {isCapturing ? 'Stop' : 'Start'} Capture
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={captureAndDetect} 
                className="bg-black/50 hover:bg-black/70"
                disabled={isProcessing || !cameraReady}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-1" />
                )}
                Capture
              </Button>
            )}
          </div>
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <span>Initializing camera...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}