"use client"

import React, { useState, useEffect, useCallback, useRef, Suspense, ComponentType } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { WebcamCapture } from "@/components/detection/webcam-capture"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Toggle } from "@/components/ui/toggle"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Clock, Volume2, VolumeX, Settings2, Trash2, XCircle, CheckCircle2 } from "lucide-react"
import { useAudio } from "@/lib/audioContext"
import { insertDetectionRecord } from "@/lib/supabase"
import { DetectionResults } from "@/components/detection/detection-results"
import { formatDistance } from "date-fns"
import { Badge } from "@/components/ui/badge"

// Safe dynamic imports with fallbacks for components that may cause issues
const SafeComponent = ({ 
  componentPath, 
  fallback, 
  props = {}
}: { 
  componentPath: string; 
  fallback: React.ReactNode; 
  props?: any;
}) => {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Dynamic import
    import(componentPath)
      .then(module => {
        setComponent(() => module.default);
      })
      .catch(err => {
        console.error(`Failed to load component ${componentPath}:`, err);
        setError(true);
      });
  }, [componentPath]);

  if (error || !Component) return <>{fallback}</>;
  return <Component {...props} />;
};

// Simple error boundary to prevent crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Error in component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Default detection configuration
const DEFAULT_CONFIDENCE = 0.5
const DEFAULT_DETECTION_ZONE: [number, number, number, number] | null = null
const DEFAULT_SOUND_ENABLED = true
const DEFAULT_CAPTURE_INTERVAL = 2000 // 2 seconds

// Fallback components
const WasteTypeBadgeFallback = ({ wasteType }: { wasteType: string }) => (
  <Badge variant="outline" className="capitalize">{wasteType}</Badge>
);

const DetectionZoneSelectorFallback = ({ 
  onZoneSelected, 
  onCancel 
}: { 
  onZoneSelected: (zone: [number, number, number, number]) => void; 
  onCancel: () => void;
}) => (
  <div className="border rounded-md p-4 text-center">
    <p>Zone selector not available</p>
    <Button onClick={onCancel} className="mt-2">Cancel</Button>
  </div>
);

const WasteDistributionChartFallback = () => (
  <div className="border rounded-md p-4 text-center">
    <p>Chart component not available</p>
  </div>
);

const ScrollAreaFallback = ({ children }: { children: React.ReactNode }) => (
  <div className="max-h-[400px] overflow-auto">{children}</div>
);

const SeparatorFallback = () => <hr className="my-2" />;

export default function DetectionPage() {
  const [wastes, setWastes] = useState<any[]>([])
  const [toastState, setToastState] = useState<any>({ toast: () => {} })
  
  // Load toast dynamically to prevent errors
  useEffect(() => {
    import("@/components/ui/use-toast").then(module => {
      setToastState({ toast: module.useToast().toast });
    }).catch(err => {
      console.error("Failed to load toast:", err);
    });
  }, []);
  
  const { toast } = toastState;
  const { play } = useAudio()
  
  // Recovery from server restarts - load state from localStorage if available
  const loadPersistedState = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('detectionPageState');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Error loading persisted state:', e);
      return null;
    }
  };
  
  // Detection settings and state
  const [detectionZone, setDetectionZone] = useState<[number, number, number, number] | null>(() => {
    const persisted = loadPersistedState();
    return persisted?.detectionZone ?? DEFAULT_DETECTION_ZONE;
  });
  
  const [confidenceThreshold, setConfidenceThreshold] = useState(() => {
    const persisted = loadPersistedState();
    return persisted?.confidenceThreshold ?? DEFAULT_CONFIDENCE;
  });
  
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const persisted = loadPersistedState();
    return persisted?.soundEnabled ?? DEFAULT_SOUND_ENABLED;
  });
  
  const [captureInterval, setCaptureInterval] = useState(() => {
    const persisted = loadPersistedState();
    return persisted?.captureInterval ?? DEFAULT_CAPTURE_INTERVAL;
  });
  
  const [isZoneSelectionMode, setIsZoneSelectionMode] = useState(false)
  
  const [liveDetectionMode, setLiveDetectionMode] = useState<boolean>(() => {
    const persisted = loadPersistedState();
    return persisted?.liveDetectionMode ?? false;
  });
  
  const [lastDetectionResult, setLastDetectionResult] = useState<any | null>(null)
  const [detectionActive, setDetectionActive] = useState(false)
  const [recentDetections, setRecentDetections] = useState<any[]>([])
  const recentDetectionsRef = useRef<any[]>([])
  const [statsData, setStatsData] = useState<any>({
    total: 0,
    correct: 0,
    incorrect: 0,
    byType: {}
  })
  
  // Persist state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('detectionPageState', JSON.stringify({
        detectionZone,
        confidenceThreshold,
        soundEnabled,
        captureInterval,
        liveDetectionMode
      }));
    } catch (e) {
      console.error('Error persisting state:', e);
    }
  }, [detectionZone, confidenceThreshold, soundEnabled, captureInterval, liveDetectionMode]);
  
  // Update statistics based on detection results
  const updateStats = useCallback((result: any) => {
    if (!result?.waste_detection) return
    
    const { waste_type, is_correct } = result.waste_detection
    
    setStatsData((prev: {
      total: number;
      correct: number;
      incorrect: number;
      byType: Record<string, { total: number; correct: number; incorrect: number }>;
    }) => {
      // Create a copy of the previous state
      const newStats = {
        ...prev,
        total: prev.total + 1,
        correct: is_correct ? prev.correct + 1 : prev.correct,
        incorrect: !is_correct ? prev.incorrect + 1 : prev.incorrect,
        byType: { ...prev.byType }
      }
      
      // Update waste type counts
      if (!newStats.byType[waste_type]) {
        newStats.byType[waste_type] = { total: 0, correct: 0, incorrect: 0 }
      }
      
      newStats.byType[waste_type].total += 1
      if (is_correct) {
        newStats.byType[waste_type].correct += 1
      } else {
        newStats.byType[waste_type].incorrect += 1
      }
      
      return newStats
    })
  }, [])
  
  // Handle detection results
  const handleDetectionResult = useCallback(async (result: any) => {
    console.log("handleDetectionResult called with:", JSON.stringify(result, null, 2));
    
    if (!result?.waste_detection) {
      console.warn("Detection result is missing waste_detection property");
      return;
    }
    
    console.log("Setting lastDetectionResult:", JSON.stringify(result, null, 2));
    setLastDetectionResult(result);
    
    const { waste_type, is_correct } = result.waste_detection;
    console.log(`Detected waste_type: ${waste_type}, is_correct: ${is_correct}`);
    
    // Play sound if enabled
    if (soundEnabled) {
      if (is_correct) {
        console.log("Playing 'correct' sound");
        play("correct");
      } else {
        console.log("Playing 'incorrect' sound");
        play("incorrect");
      }
    }
    
    // Add timestamp to result
    const resultWithTimestamp = {
      ...result,
      timestamp: new Date().toISOString()
    };
    
    // Update recent detections (keep only the last 10)
    const updatedDetections = [resultWithTimestamp, ...recentDetectionsRef.current.slice(0, 9)];
    console.log(`Updating recentDetections with ${updatedDetections.length} items`);
    setRecentDetections(updatedDetections);
    recentDetectionsRef.current = updatedDetections;
    
    // Update statistics
    console.log("Updating stats");
    updateStats(result);
    
    // Store result in database
    try {
      console.log("Inserting detection record to database");
      const record = {
        timestamp: new Date().toISOString(),
        waste_type: waste_type,
        is_correct: is_correct,
        inference_speed: result.performance?.inference_fps || 0
      };
      
      console.log("Inserting record:", JSON.stringify(record, null, 2));
      const insertResult = await insertDetectionRecord(record);
      
      if (insertResult) {
        console.log("Database record inserted successfully:", insertResult);
      } else {
        console.error("Failed to insert detection record");
      }
    } catch (error) {
      console.error("Error inserting detection record:", error);
    }
  }, [play, soundEnabled, updateStats])
  
  // Format chart data for the WasteDistributionChart component
  const getChartData = useCallback(() => {
    const chartData = {
      wasteByType: Object.entries(statsData.byType).map(([type, data]: [string, any]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: data.total
      })),
      disposalAccuracy: [
        { name: "Correct", value: statsData.correct },
        { name: "Incorrect", value: statsData.incorrect }
      ]
    }
    return chartData
  }, [statsData])
  
  // Reset the detection settings
  const resetDetection = () => {
    setDetectionZone(DEFAULT_DETECTION_ZONE)
    setConfidenceThreshold(DEFAULT_CONFIDENCE)
    setSoundEnabled(DEFAULT_SOUND_ENABLED)
    setCaptureInterval(DEFAULT_CAPTURE_INTERVAL)
    setLiveDetectionMode(false)
  }
  
  return (
    <div className="container max-w-screen-xl mx-auto py-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Camera Feed */}
        <div className="md:col-span-2 space-y-4">
          {/* Detection Camera */}
          <ErrorBoundary fallback={
            <Card>
              <CardHeader>
                <CardTitle>Camera Error</CardTitle>
                <CardDescription>Failed to load camera component</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </CardContent>
            </Card>
          }>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Waste Detection Camera</CardTitle>
                <CardDescription>
                  {liveDetectionMode 
                    ? "Live detection mode: continuous real-time waste identification" 
                    : "Interval mode: captures and analyzes frames at regular intervals"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {isZoneSelectionMode ? (
                    <Suspense fallback={<div>Loading zone selector...</div>}>
                      <SafeComponent
                        componentPath="@/components/detection/detection-zone-selector"
                        fallback={
                          <DetectionZoneSelectorFallback 
                            onZoneSelected={(zone) => {
                              setDetectionZone(zone as [number, number, number, number])
                              setIsZoneSelectionMode(false)
                              toast({
                                title: "Detection zone set",
                                description: "The camera will now only detect objects in this zone."
                              })
                            }}
                            onCancel={() => setIsZoneSelectionMode(false)}
                          />
                        }
                        props={{
                          onZoneSelected: (zone: [number, number, number, number]) => {
                            setDetectionZone(zone)
                            setIsZoneSelectionMode(false)
                            toast({
                              title: "Detection zone set",
                              description: "The camera will now only detect objects in this zone."
                            })
                          },
                          onCancel: () => setIsZoneSelectionMode(false)
                        }}
                      />
                    </Suspense>
                  ) : (
                    <WebcamCapture
                      onDetectionResult={handleDetectionResult}
                      detectionZone={detectionZone}
                      captureInterval={liveDetectionMode ? 0 : captureInterval}
                      autoStart={detectionActive}
                    />
                  )}
                </div>
                
                {/* Latest detection result */}
                {lastDetectionResult && !isZoneSelectionMode && (
                  <div className="mt-4">
                    <ErrorBoundary fallback={
                      <Card>
                        <CardHeader>
                          <CardTitle>Results Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                          Failed to display detection results
                        </CardContent>
                      </Card>
                    }>
                      <DetectionResults 
                        result={lastDetectionResult} 
                        confidenceThreshold={confidenceThreshold} 
                      />
                    </ErrorBoundary>
                  </div>
                )}
              </CardContent>
            </Card>
          </ErrorBoundary>
          
          {/* Quick Stats */}
          <ErrorBoundary fallback={
            <Card>
              <CardHeader>
                <CardTitle>Stats Error</CardTitle>
                <CardDescription>Failed to load statistics</CardDescription>
              </CardHeader>
            </Card>
          }>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Live Detection Statistics</CardTitle>
                <CardDescription>
                  Overview of waste detections in this session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Suspense fallback={<div>Loading chart...</div>}>
                    <SafeComponent
                      componentPath="@/components/analytics/waste-distribution-chart"
                      fallback={<WasteDistributionChartFallback />}
                      props={{
                        data: getChartData(),
                        compactMode: true,
                        chartMode: "donut"
                      }}
                    />
                  </Suspense>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Detection Summary</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-muted rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold">{statsData.total}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div className="bg-green-100 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-green-700">{statsData.correct}</div>
                          <div className="text-xs text-green-700">Correct</div>
                        </div>
                        <div className="bg-red-100 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-red-700">{statsData.incorrect}</div>
                          <div className="text-xs text-red-700">Incorrect</div>
                        </div>
                      </div>
                    </div>
                    
                    {statsData.total > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Waste Types Detected</h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(statsData.byType).map(([type, data]: [string, any]) => (
                            <div key={type} className="flex items-center space-x-1">
                              <Suspense fallback={<Badge>{type}</Badge>}>
                                <SafeComponent
                                  componentPath="@/components/ui/waste-type-badge"
                                  fallback={<WasteTypeBadgeFallback wasteType={type} />}
                                  props={{ wasteType: type }}
                                />
                              </Suspense>
                              <span className="text-xs text-muted-foreground">({data.total})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </ErrorBoundary>
        </div>
        
        {/* Right Column - Settings and Recent Detections */}
        <div className="space-y-4">
          {/* Detection Settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Settings2 className="h-5 w-5 mr-2" />
                Detection Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="camera">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="camera">Camera</TabsTrigger>
                  <TabsTrigger value="detection">Detection</TabsTrigger>
                </TabsList>
                
                <TabsContent value="camera" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="live-mode">Live Detection Mode</Label>
                      <Switch 
                        id="live-mode" 
                        checked={liveDetectionMode}
                        onCheckedChange={(checked) => {
                          setLiveDetectionMode(checked)
                          // Reset detection active state when switching modes
                          setDetectionActive(false)
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {liveDetectionMode 
                        ? "Continuous real-time detection (higher resource usage)" 
                        : "Interval-based detection (lower resource usage)"}
                    </p>
                  </div>
                  
                  {!liveDetectionMode && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="capture-interval">Capture Interval</Label>
                        <span className="text-sm">{captureInterval / 1000}s</span>
                      </div>
                      <Slider
                        id="capture-interval"
                        min={500}
                        max={5000}
                        step={500}
                        value={[captureInterval]}
                        onValueChange={(values) => setCaptureInterval(values[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0.5s</span>
                        <span>5.0s</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="detection-zone">Detection Zone</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setIsZoneSelectionMode(true)
                          setDetectionActive(false) // Pause detection while selecting zone
                        }}
                      >
                        {detectionZone ? "Change Zone" : "Set Zone"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {detectionZone 
                        ? "Zone active: Detection limited to selected area" 
                        : "No zone: Detecting in entire camera view"}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="detection" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="confidence">Confidence Threshold</Label>
                      <span className="text-sm">{Math.round(confidenceThreshold * 100)}%</span>
                    </div>
                    <Slider
                      id="confidence"
                      min={0.1}
                      max={0.9}
                      step={0.05}
                      value={[confidenceThreshold]}
                      onValueChange={(values) => setConfidenceThreshold(values[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10%</span>
                      <span>90%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound">Sound Alerts</Label>
                      <Switch 
                        id="sound" 
                        checked={soundEnabled}
                        onCheckedChange={(checked) => setSoundEnabled(checked)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {soundEnabled 
                        ? "Audio feedback for correct/incorrect disposal" 
                        : "Silent operation (no audio alerts)"}
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2" 
                    onClick={resetDetection}
                  >
                    Reset to Defaults
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Recent Detections */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Recent Detections</CardTitle>
              <CardDescription>
                Last {recentDetections.length} waste items detected
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Suspense fallback={<div className="h-[400px] overflow-auto p-4">Loading recent detections...</div>}>
                <SafeComponent
                  componentPath="@/components/ui/scroll-area"
                  fallback={<ScrollAreaFallback>{
                    recentDetections.length === 0 ? (
                      <div className="px-4 py-8 text-center text-muted-foreground">
                        <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No recent detections</p>
                        <p className="text-sm">Start detection to see results here</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {recentDetections.map((detection, index) => (
                          <div key={index} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                {detection.waste_detection?.is_correct ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="font-medium capitalize">
                                  {detection.waste_detection?.waste_type || "Unknown"}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {detection.timestamp && formatDistance(new Date(detection.timestamp), new Date(), { addSuffix: true })}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div>
                                Confidence: {detection.detections && detection.detections[0] 
                                  ? `${Math.round(detection.detections[0].confidence * 100)}%` 
                                  : 'N/A'}
                              </div>
                              <div>
                                Speed: {detection.performance?.inference_fps 
                                  ? `${Math.round(detection.performance.inference_fps)} FPS` 
                                  : 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }</ScrollAreaFallback>}
                  props={{
                    className: "h-[400px]",
                    children: recentDetections.length === 0 ? (
                      <div className="px-4 py-8 text-center text-muted-foreground">
                        <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No recent detections</p>
                        <p className="text-sm">Start detection to see results here</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {recentDetections.map((detection, index) => (
                          <div key={index} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                {detection.waste_detection?.is_correct ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="font-medium capitalize">
                                  {detection.waste_detection?.waste_type || "Unknown"}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {detection.timestamp && formatDistance(new Date(detection.timestamp), new Date(), { addSuffix: true })}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div>
                                Confidence: {detection.detections && detection.detections[0] 
                                  ? `${Math.round(detection.detections[0].confidence * 100)}%` 
                                  : 'N/A'}
                              </div>
                              <div>
                                Speed: {detection.performance?.inference_fps 
                                  ? `${Math.round(detection.performance.inference_fps)} FPS` 
                                  : 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

