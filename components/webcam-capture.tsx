"use client"

import { useRef, useState, useCallback } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, RefreshCw } from "lucide-react"

interface WebcamCaptureProps {
  onCapture?: (imageSrc: string | null) => void
  captureInterval?: number
  autoStart?: boolean
}

export function WebcamCapture({ 
  onCapture, 
  captureInterval = 0, 
  autoStart = false 
}: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null)
  const [isCapturing, setIsCapturing] = useState(autoStart)
  const [cameraError, setCameraError] = useState<string | null>(null)
  
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (onCapture) {
      onCapture(imageSrc)
    }
    return imageSrc
  }, [onCapture])
  
  const handleCameraError = (error: string) => {
    console.error('Webcam error:', error)
    setCameraError("Camera access error. Please check permissions.")
  }
  
  const resetCamera = () => {
    setCameraError(null)
    // This forces a remount of the webcam component
    setIsCapturing(false)
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
            onUserMediaError={handleCameraError}
            className="w-full h-auto rounded-md"
          />
          <div className="absolute bottom-3 right-3">
            <Button 
              size="sm" 
              onClick={capture} 
              className="bg-black/50 hover:bg-black/70"
            >
              <Camera className="h-4 w-4 mr-1" />
              Capture
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}