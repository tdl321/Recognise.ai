"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, RefreshCw, Loader2, Play, Pause } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSettings } from "@/contexts/settings-context"
import { DetectionResult, WasteDetection } from "@/types"

interface WebcamCaptureProps {
  onCapture?: (imageSrc: string | null) => void
  onDetectionResult?: (result: DetectionResult) => void
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
  const { settings } = useSettings()
  
  // Use persistent state for critical UI settings
  const getStoredSettings = () => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('webcamCaptureSettings');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error retrieving stored webcam settings:', e);
      return null;
    }
  };
  
  const [isCapturing, setIsCapturing] = useState(() => {
    const stored = getStoredSettings();
    return stored?.isCapturing ?? (settings.autoStart || autoStart);
  });
  
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const requestRef = useRef<number | null>(null) // For requestAnimationFrame
  const [cameraReady, setCameraReady] = useState(false)
  
  const [streamMode, setStreamMode] = useState<'interval' | 'continuous'>(() => {
    const stored = getStoredSettings();
    if (stored?.streamMode) return stored.streamMode;
    return (settings.captureInterval > 0 || captureInterval > 0) ? 'interval' : 'continuous';
  });
  
  const [fps, setFps] = useState(0)
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef(Date.now())
  const processingQueueRef = useRef<string[]>([])
  const isProcessingRef = useRef(false)
  const { toast } = useToast()
  
  // Save settings when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('webcamCaptureSettings', JSON.stringify({
          isCapturing,
          streamMode
        }));
      } catch (e) {
        console.error('Error storing webcam settings:', e);
      }
    }
  }, [isCapturing, streamMode]);
  
  // Get the actual capture interval from settings or props
  const actualCaptureInterval = captureInterval || settings.captureInterval || 1000;
  
  // Process frames as fast as possible when in continuous mode
  const processFrame = useCallback(async () => {
    // Add error handling for resilient processing
    try {
      if (!webcamRef.current || !cameraReady || !isCapturing || isProcessingRef.current) return;
      
      // Update FPS calculation
      const now = Date.now();
      const elapsed = now - lastFrameTimeRef.current;
      if (elapsed > 1000) {
        setFps(Math.round((frameCountRef.current / elapsed) * 1000));
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }
      frameCountRef.current++;
      
      // Capture frame
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) return;
      
      // Add to processing queue
      processingQueueRef.current.push(imageSrc);
      
      // Process next frame
      requestRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      console.error('Error in processFrame:', error);
      // Attempt recovery
      setTimeout(() => {
        requestRef.current = requestAnimationFrame(processFrame);
      }, 1000);
    }
  }, [cameraReady, isCapturing]);
  
  // Process the queue of captured frames
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || processingQueueRef.current.length === 0) return;
    
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    try {
      // Take the most recent frame from the queue
      const imageSrc = processingQueueRef.current.pop();
      // Clear the rest of the queue since we're only interested in the most recent frame
      processingQueueRef.current = [];
      
      if (!imageSrc) {
        isProcessingRef.current = false;
        setIsProcessing(false);
        return;
      }
      
      if (onCapture) {
        onCapture(imageSrc);
      }
      
      // Process with detection API
      if (onDetectionResult) {
        // Convert base64 to blob
        const base64Data = imageSrc.replace(/^data:image\/jpeg;base64,/, "");
        const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
        
        // Create FormData object
        const formData = new FormData();
        formData.append('file', blob, 'webcam-capture.jpg');
        
        // Add detection zone if provided
        if (detectionZone) {
          formData.append('detection_zone', JSON.stringify(detectionZone));
        }
        
        // Send to API
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'}/detect`;
        console.log(`Processing frame at ${new Date().toISOString()}`);
        console.log(`API URL: ${apiUrl}`);
        console.log(`Detection zone: ${detectionZone ? JSON.stringify(detectionZone) : 'none'}`);
        
        try {
          console.log("Sending API request...");
          console.log("Form data content:", JSON.stringify({
            file: "IMAGE_DATA",
            detection_zone: detectionZone ? JSON.stringify(detectionZone) : null
          }));
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
          });
          
          console.log(`API response status: ${response.status}`);
          
          // Only use mock data if we get an actual error response
          if (!response.ok) {
            console.warn(`API error: ${response.status}. Using mock data instead.`);
            try {
              const errorText = await response.text();
              console.warn(`Response details: ${errorText}`);
            } catch (err) {
              console.warn("Could not read error response text");
            }
            
            if (settings.notificationsEnabled) {
              toast({
                title: "API Connection Error",
                description: `Using fallback detection data. Status: ${response.status}`,
                variant: "destructive",
              });
            }
            
            // Use mock data only in case of actual API errors
            const mockResult = createMockResult();
            onDetectionResult(mockResult);
          } else {
            // API responded successfully
            let responseText = '';
            let result;
            
            try {
              responseText = await response.text();
              console.log(`Raw response (first 200 chars): ${responseText.substring(0, 200)}...`);
              
              if (!responseText || responseText.trim() === '') {
                throw new Error("Empty response");
              }
              
              result = JSON.parse(responseText);
              
              console.log("Detection API response structure:", 
                Object.keys(result).length > 0 ? 
                Object.keys(result).join(', ') : 'Empty object');
              
              // Additional validation to ensure we're not using fake data
              if (!result.waste_detection) {
                console.warn("Response missing waste_detection property");
                throw new Error("Invalid response format");
              }
              
              if (result.waste_detection.waste_type === "plastic" && 
                  result.detections && 
                  result.detections.length === 1 && 
                  result.detections[0].bbox?.join(',') === "100,100,200,200") {
                console.warn("Received suspicious data that matches mock pattern.");
                console.warn("This may be fallback data from the server. Rejecting it.");
                throw new Error("Response contains suspicious mock data pattern");
              }
              
              console.log(`Detection completed at ${new Date().toISOString()}`);
              console.log(`Detected waste type: ${result.waste_detection?.waste_type}`);
              console.log(`Is correct disposal: ${result.waste_detection?.is_correct}`);
              console.log(`Detection count: ${result.detections?.length || 0}`);
              console.log(`Detection coordinates:`, 
                result.detections?.map((d: any) => d.bbox).join(' | '));
              
              // Valid response, use it
              onDetectionResult(result);
               
              if (settings.notificationsEnabled) {
                if (result.waste_detection?.is_correct) {
                  toast({
                    title: "Correct Disposal! 👍",
                    description: `Detected ${result.waste_detection.waste_type} waste in the right bin`,
                    variant: "default",
                  });
                } else if (result.waste_detection?.waste_type) {
                  toast({
                    title: "Incorrect Disposal! ⚠️",
                    description: `${result.waste_detection.waste_type} should go in a different bin`,
                    variant: "destructive",
                  });
                }
              }
            } catch (error) {
              console.error("Error processing response:", error, "Raw text:", responseText);
              
              // Only use mock data if we can't parse the response
              const mockResult = createMockResult();
              mockResult.waste_detection.is_fake = true; // Mark as fake data
              onDetectionResult(mockResult);
              
              toast({
                title: "Response Error",
                description: "Could not process API response. Using mock data.",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.warn('Detection API connection error:', error, 'Using mock data instead');
          const mockResult = createMockResult();
          onDetectionResult(mockResult);
           
          if (settings.notificationsEnabled) {
            toast({
              title: "Detection Error",
              description: "Connection to detection API failed. Using mock data.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error('Detection error:', error);
      if (settings.notificationsEnabled) {
        toast({
          title: "Processing Error",
          description: "Something went wrong while processing the image",
          variant: "destructive",
        });
      }
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [onCapture, onDetectionResult, detectionZone, toast, settings.notificationsEnabled]);
  
  // Create mock result for demo/development
  const createMockResult = () => {
    const wasteType = Math.random() > 0.5 ? "plastic" : "paper";
    const isCorrect = Math.random() > 0.3;
     
    if (settings.notificationsEnabled) {
      if (isCorrect) {
        toast({
          title: "Correct Disposal! 👍 (Mock)",
          description: `Detected ${wasteType} waste in the right bin`,
          variant: "default",
        });
      } else {
        toast({
          title: "Incorrect Disposal! ⚠️ (Mock)",
          description: `${wasteType} should go in a different bin`,
          variant: "destructive",
        });
      }
    }
     
    const mockResult: DetectionResult = {
      detections: [
        {
          class_name: wasteType,
          confidence: 0.7 + Math.random() * 0.2,
          bbox: [100, 100, 200, 200]
        }
      ],
      waste_detection: {
        waste_type: wasteType,
        is_correct: isCorrect,
        is_fake: true
      },
      performance: {
        inference_fps: 20 + Math.random() * 40
      }
    };
    
    return mockResult;
  };
  
  // Set up continuous frame processing
  useEffect(() => {
    if (isCapturing && streamMode === 'continuous' && cameraReady) {
      console.log("Starting continuous frame processing");
      requestRef.current = requestAnimationFrame(processFrame);
      
      // Set up queue processor
      const queueInterval = setInterval(() => {
        processQueue();
      }, 100); // Process queue every 100ms
      
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
        }
        clearInterval(queueInterval);
      };
    }
  }, [isCapturing, streamMode, cameraReady, processFrame, processQueue]);
  
  // Set up interval-based capture if enabled
  useEffect(() => {
    if (isCapturing && streamMode === 'interval' && actualCaptureInterval > 0 && cameraReady) {
      console.log(`Setting up capture interval: ${actualCaptureInterval}ms`);
      
      const captureAndProcess = async () => {
        if (isProcessingRef.current) return;
        
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;
        
        processingQueueRef.current = [imageSrc]; // Replace queue with this frame
        processQueue();
      };
      
      intervalRef.current = setInterval(captureAndProcess, actualCaptureInterval);
      
      return () => {
        if (intervalRef.current) {
          console.log("Clearing capture interval");
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isCapturing, streamMode, actualCaptureInterval, cameraReady, processQueue]);
  
  const toggleCapture = useCallback(() => {
    if (isCapturing) {
      // Stop capturing
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      setIsCapturing(false);
      if (settings.notificationsEnabled) {
        toast({
          title: "Detection Stopped",
          description: "Live waste detection has been paused",
        });
      }
    } else {
      // Start capturing
      setIsCapturing(true);
      if (settings.notificationsEnabled) {
        toast({
          title: "Detection Started",
          description: `Running in ${streamMode === 'continuous' ? 'live' : 'interval'} mode`,
        });
      }
      // Frame processing will be initiated by effect
    }
  }, [isCapturing, streamMode, toast, settings.notificationsEnabled]);
  
  const toggleStreamMode = useCallback(() => {
    // Reset any ongoing capture
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    // Toggle mode
    const newMode = streamMode === 'continuous' ? 'interval' : 'continuous';
    setStreamMode(newMode);
     
    if (settings.notificationsEnabled) {
      toast({
        title: "Mode Changed",
        description: `Switched to ${newMode === 'continuous' ? 'live streaming' : 'interval-based'} mode`,
      });
    }
    
    // Restart if it was already capturing
    if (isCapturing) {
      setIsCapturing(false);
      setTimeout(() => setIsCapturing(true), 100);
    }
  }, [isCapturing, streamMode, toast, settings.notificationsEnabled]);
  
  const handleCameraError = (error: string | DOMException) => {
    console.error('Webcam error:', error);
    setCameraError("Camera access error. Please check permissions.");
    setCameraReady(false);
     
    if (settings.notificationsEnabled) {
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check your permissions.",
        variant: "destructive",
      });
    }
  };
  
  const handleCameraReady = () => {
    console.log("Camera is ready");
    setCameraReady(true);
    setCameraError(null);
     
    if (settings.notificationsEnabled) {
      toast({
        title: "Camera Ready",
        description: "Camera initialized successfully",
      });
    }
  };
  
  const resetCamera = () => {
    setCameraError(null);
    // This forces a remount of the webcam component
    setIsCapturing(false);
    setCameraReady(false);
     
    if (settings.notificationsEnabled) {
      toast({
        title: "Resetting Camera",
        description: "Attempting to reconnect...",
      });
    }
    
    setTimeout(() => setIsCapturing(settings.autoStart || autoStart), 100);
  };
  
  // Add debug buttons for sound testing
  const testCorrectSound = () => {
    if (onDetectionResult) {
      const mockResult = createMockResult();
      mockResult.waste_detection.is_correct = true;
      onDetectionResult(mockResult);
      console.log("Triggering CORRECT sound test");
    }
  };
  
  const testIncorrectSound = () => {
    if (onDetectionResult) {
      const mockResult = createMockResult();
      mockResult.waste_detection.is_correct = false;
      onDetectionResult(mockResult);
      console.log("Triggering INCORRECT sound test");
    }
  };
  
  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Debug buttons for sound testing */}
      {process.env.NODE_ENV !== "production" && (
        <div className="absolute top-2 right-2 z-50 flex gap-2">
          <button 
            onClick={testCorrectSound}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Correct Sound
          </button>
          <button 
            onClick={testIncorrectSound}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Incorrect Sound
          </button>
        </div>
      )}
      
      <div className="relative w-full h-full bg-gray-900 rounded-md overflow-hidden">
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
              <Button 
                size="sm" 
                onClick={toggleStreamMode} 
                variant="outline"
                className="bg-black/30 hover:bg-black/50 text-white"
                disabled={!cameraReady}
              >
                {streamMode === 'continuous' ? 'Mode: Live' : 'Mode: Interval'}
                {streamMode === 'continuous' && fps > 0 && ` (${fps} FPS)`}
              </Button>
              
              <Button 
                size="sm" 
                onClick={toggleCapture} 
                className={`${isCapturing ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                disabled={!cameraReady}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : isCapturing ? (
                  <Pause className="h-4 w-4 mr-1" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                {isCapturing ? 'Stop' : 'Start'}
              </Button>
            </div>
            
            {isProcessing && (
              <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded text-xs">
                Processing...
              </div>
            )}
            
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
    </div>
  );
}