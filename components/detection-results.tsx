"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle } from "lucide-react"

interface Detection {
  class: string
  confidence: number
  timestamp?: string
  isCorrect?: boolean
}

interface DetectionResultsProps {
  detections: Detection[]
  showTimestamp?: boolean
  showCorrectness?: boolean
}

export function DetectionResults({
  detections,
  showTimestamp = false,
  showCorrectness = false,
}: DetectionResultsProps) {
  if (!detections || detections.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No detections to display
      </div>
    )
  }

  // Get badge color based on waste type
  const getBadgeVariant = (wasteClass: string) => {
    switch (wasteClass.toLowerCase()) {
      case "plastic":
        return "blue"
      case "paper":
        return "green"
      case "glass":
        return "indigo"
      case "metal":
        return "amber"
      default:
        return "secondary"
    }
  }

  // Get badge color style based on waste type
  const getBadgeStyle = (wasteClass: string) => {
    switch (wasteClass.toLowerCase()) {
      case "plastic":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80"
      case "paper":
        return "bg-green-100 text-green-800 hover:bg-green-100/80"
      case "glass":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80"
      case "metal":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100/80"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-2">
      {detections.map((detection, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 rounded-md border"
        >
          <div className="flex items-center gap-2">
            <Badge className={getBadgeStyle(detection.class)}>
              {detection.class}
            </Badge>
            {showCorrectness && detection.isCorrect !== undefined && (
              <span className="flex items-center">
                {detection.isCorrect ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {showTimestamp && detection.timestamp && (
              <span className="text-xs text-muted-foreground">
                {detection.timestamp}
              </span>
            )}
            <span className="font-medium text-sm">
              {Math.round(detection.confidence * 100)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}