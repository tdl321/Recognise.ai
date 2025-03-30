"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Timer } from "lucide-react"
import { useAudioContext } from "@/lib/audioContext"

interface DetectionResultsProps {
  detections: any[];
  inferenceSpeed: number | null;
  wasteDetection: {
    waste_type: string | null;
    is_correct: boolean;
  };
  className?: string;
}

export function DetectionResults({ 
  detections, 
  inferenceSpeed, 
  wasteDetection,
  className = "" 
}: DetectionResultsProps) {
  const { playSound } = useAudioContext();
  
  // Play appropriate sound when waste detection changes
  useEffect(() => {
    if (wasteDetection.waste_type) {
      if (wasteDetection.is_correct) {
        playSound('correct');
      } else {
        playSound('incorrect');
      }
    }
  }, [wasteDetection, playSound]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Detection Results</CardTitle>
        <CardDescription>Latest detection information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {detections.length > 0 ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium">Detected Items</h3>
                <Badge variant="outline">{detections.length} found</Badge>
              </div>
              
              <div className="space-y-2">
                {detections.map((detection, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ 
                        backgroundColor: getWasteTypeColor(detection.class) 
                      }} />
                      <span className="font-medium capitalize">{detection.class}</span>
                    </div>
                    <Badge variant="secondary">
                      {Math.round(detection.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            {wasteDetection.waste_type && (
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
  
  return typeColors[name.toLowerCase()] || '#6b7280';
}