"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Timer } from "lucide-react"
import { useAudio } from "@/lib/audioContext"
import { DetectionResult } from "@/types"

interface DetectionResultsProps {
  // Original interface properties
  detections?: any[];
  inferenceSpeed?: number | null;
  wasteDetection?: {
    waste_type: string | null;
    is_correct: boolean;
  };
  className?: string;
  
  // Alternative prop structure
  result?: DetectionResult;
  confidenceThreshold?: number;
}

export function DetectionResults(props: DetectionResultsProps) {
  const { play } = useAudio();
  
  // Add error boundary-like behavior
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Reset error state when props change
    setHasError(false);
  }, [props]);
  
  console.log("DetectionResults component received props:", JSON.stringify(props, null, 2));
  
  // Normalize props to the expected structure
  let detections: any[] = [];
  let inferenceSpeed: number | null = null;
  let wasteDetection: { waste_type: string | null; is_correct: boolean } = { waste_type: null, is_correct: false };
  let className = "";
  let confidenceThreshold = 0.5;
  
  try {
    detections = props.detections || props.result?.detections || [];
    inferenceSpeed = props.inferenceSpeed || 
      (props.result?.performance?.inference_fps 
        ? 1000 / props.result.performance.inference_fps 
        : null);
    wasteDetection = props.wasteDetection || 
      (props.result?.waste_detection 
        ? props.result.waste_detection 
        : { waste_type: null, is_correct: false });
    className = props.className || "";
    confidenceThreshold = props.confidenceThreshold || 0.5;
  } catch (error) {
    console.error("Error normalizing props:", error);
    setHasError(true);
  }
  
  console.log("DetectionResults normalized props:", {
    detections: Array.isArray(detections) ? `Array with ${detections.length} items` : 'Not an array',
    inferenceSpeed,
    wasteDetection,
    confidenceThreshold
  });
  
  // Filter detections based on confidence threshold if needed
  let filteredDetections: any[] = [];
  try {
    if (Array.isArray(detections)) {
      filteredDetections = detections.filter(
        (detection: any) => detection && typeof detection.confidence === 'number' && detection.confidence >= confidenceThreshold
      );
    }
  } catch (error) {
    console.error("Error filtering detections:", error);
    setHasError(true);
  }
  
  console.log("DetectionResults filtered detections:", 
    Array.isArray(filteredDetections) 
      ? `${filteredDetections.length} items after filtering by threshold ${confidenceThreshold}`
      : 'Filtering failed');
  
  // Play appropriate sound when waste detection changes
  useEffect(() => {
    try {
      console.log("Detection results component received waste detection:", 
        wasteDetection ? JSON.stringify(wasteDetection) : "none");
      
      if (wasteDetection?.waste_type) {
        console.log(`Attempting to play sound for ${wasteDetection.waste_type}, correct: ${wasteDetection.is_correct}`);
        
        // Force a small delay to ensure audio context is ready
        setTimeout(() => {
          // Always play a sound if we have a valid waste type
          if (wasteDetection.is_correct) {
            console.log('About to play CORRECT sound from detection results component');
            try {
              play('correct');
              console.log('Successfully triggered correct sound');
            } catch (e) {
              console.error('Error playing correct sound:', e);
            }
          } else {
            console.log('About to play INCORRECT sound from detection results component');
            try {
              play('incorrect');
              console.log('Successfully triggered incorrect sound');
            } catch (e) {
              console.error('Error playing incorrect sound:', e);
            }
          }
        }, 300);  // Increased delay for more reliability
      }
    } catch (error) {
      console.error("Error in sound playback effect:", error);
    }
  }, [wasteDetection, play]);

  // If we encountered an error, show a simplified fallback UI
  if (hasError) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Detection Results</CardTitle>
          <CardDescription>Something went wrong</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <p>Error displaying detection results</p>
            <p className="text-sm">Please try again or restart the detection</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Detection Results</CardTitle>
        <CardDescription>Latest detection information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredDetections && filteredDetections.length > 0 ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium">Detected Items</h3>
                <Badge variant="outline">{filteredDetections.length} found</Badge>
              </div>
              
              <div className="space-y-2">
                {filteredDetections.map((detection: any, index: number) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ 
                        backgroundColor: getWasteTypeColor(detection.class_name || detection.class) 
                      }} />
                      <span className="font-medium capitalize">{detection.class_name || detection.class}</span>
                    </div>
                    <Badge variant="secondary">
                      {Math.round(detection.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            {wasteDetection?.waste_type && (
              <div className="rounded-lg p-3 flex items-center gap-3" 
                style={{ 
                  backgroundColor: wasteDetection.is_correct 
                    ? 'rgba(34, 197, 94, 0.1)' 
                    : 'rgba(239, 68, 68, 0.1)',
                  color: wasteDetection.is_correct 
                    ? 'rgb(22, 163, 74)' 
                    : 'rgb(220, 38, 38)'
                }}
              >
                {wasteDetection.is_correct ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-medium">
                    {wasteDetection.is_correct 
                      ? 'Correctly Disposed' 
                      : 'Incorrectly Disposed'
                    }
                  </div>
                  <div className="text-sm opacity-80">
                    {wasteDetection.is_correct
                      ? 'This item was placed in the correct bin!'
                      : 'This item should be placed in a different bin.'
                    }
                  </div>
                </div>
              </div>
            )}
            
            {inferenceSpeed && (
              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-2">
                <div className="flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  <span>Inference Speed</span>
                </div>
                <span className="font-mono">{inferenceSpeed.toFixed(1)} ms</span>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No items detected</p>
            <p className="text-sm">Waiting for detection results...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to get a color for each waste type
function getWasteTypeColor(name: string): string {
  const typeColors: Record<string, string> = {
    'paper': '#4CAF50',
    'cardboard': '#3B82F6',
    'glass': '#9C27B0',
    'metal': '#F59E0B',
    'plastic': '#ef4444',
    'other': '#8b5cf6'
  };
  
  return typeColors[name?.toLowerCase()] || '#6b7280';
}