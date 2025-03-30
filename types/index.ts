// Detection Types
export type WasteType = 'plastic' | 'paper' | 'metal' | 'glass' | 'unknown';

export interface Detection {
  class_name: string;
  confidence: number;
  bbox: number[]; // [x1, y1, x2, y2]
}

export interface WasteDetection {
  waste_type: WasteType;
  is_correct: boolean;
  is_fake?: boolean;
}

export interface PerformanceMetrics {
  inference_fps: number;
  processing_time?: number;
}

export interface DetectionResult {
  detections: Detection[];
  waste_detection: WasteDetection;
  performance: PerformanceMetrics;
  processed_image_url?: string;
}

// Zone Types
export interface DetectionZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  wasteType: WasteType;
  name: string;
}

// Log Types
export interface DetectionLog {
  id: string;
  timestamp: string;
  waste_type: WasteType;
  is_correct: boolean;
  inference_fps: number;
  zone_name?: string;
}

// App Settings
export interface AppSettings {
  alarmEnabled: boolean;
  alarmVolume: number;
  notificationsEnabled: boolean;
  captureInterval: number;
  autoStart: boolean;
} 