"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Layers, Save, Trash2, Plus, RotateCcw, Camera } from "lucide-react"
import { EnhancedZoneSelector, DetectionZone } from "@/components/detection/enhanced-zone-selector"
import Webcam from "react-webcam"

export default function ZonesPage() {
  const [zones, setZones] = useState<DetectionZone[]>([
    { 
      id: "zone1", 
      name: "Recycling Bin", 
      type: "Plastic", 
      color: "#3b82f6",
      coordinates: [200, 150, 400, 300]
    },
    { 
      id: "zone2", 
      name: "Paper Bin", 
      type: "Paper", 
      color: "#10b981",
      coordinates: [600, 150, 800, 300]
    },
    { 
      id: "zone3", 
      name: "Glass Container", 
      type: "Glass", 
      color: "#6366f1",
      coordinates: [200, 350, 400, 500]
    },
    { 
      id: "zone4", 
      name: "Metal Bin", 
      type: "Metal", 
      color: "#f59e0b",
      coordinates: [600, 350, 800, 500]
    }
  ])
  
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
  const [webcamReady, setWebcamReady] = useState(false)
  const [editedZone, setEditedZone] = useState<Partial<DetectionZone>>({})
  const [cameraDimensions, setCameraDimensions] = useState({ width: 640, height: 480 })
  const [saved, setSaved] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Update edited zone when active zone changes
  useEffect(() => {
    if (activeZoneId) {
      const zone = zones.find(z => z.id === activeZoneId)
      if (zone) {
        setEditedZone({
          name: zone.name,
          type: zone.type,
          color: zone.color
        })
      }
    } else {
      setEditedZone({})
    }
  }, [activeZoneId, zones])

  // Set camera dimensions to match container with a delay to improve initial load
  useEffect(() => {
    const initialLoad = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    const updateDimensions = () => {
      if (typeof window !== 'undefined') {
        // Use a lower resolution initially, then upgrade once everything is loaded
        setCameraDimensions({
          width: 640,
          height: 480
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Higher resolution after initial load
    const upgradeResolution = setTimeout(() => {
      if (webcamReady) {
        setCameraDimensions({
          width: 1280,
          height: 720
        });
      }
    }, 2000);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(initialLoad);
      clearTimeout(upgradeResolution);
    };
  }, [webcamReady]);

  // Handle camera error
  const handleCameraError = () => {
    console.error('Camera error - showing placeholder instead')
    setShowPlaceholder(true)
  }

  // Handle manual save of zone properties
  const saveZoneProperties = () => {
    if (activeZoneId && editedZone) {
      const updatedZones = zones.map(zone => {
        if (zone.id === activeZoneId) {
          return {
            ...zone,
            name: editedZone.name || zone.name,
            type: editedZone.type || zone.type,
            color: editedZone.color || zone.color
          }
        }
        return zone
      })
      setZones(updatedZones)
    }
  }

  // Handle input change for zone properties
  const handleInputChange = (field: keyof DetectionZone, value: string) => {
    setEditedZone({
      ...editedZone,
      [field]: value
    })
  }

  // Reset all zones
  const resetZones = () => {
    if (confirm('Are you sure you want to reset all zones? This cannot be undone.')) {
      setZones([])
      setActiveZoneId(null)
    }
  }

  // Save configuration
  const saveConfiguration = () => {
    // In a real app, this would save to a backend/localStorage
    console.log('Saving zone configuration:', zones)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Get active zone
  const activeZone = zones.find(z => z.id === activeZoneId)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detection Zones</h1>
          <p className="text-muted-foreground">Configure and manage waste detection zones</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={resetZones}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Zones</span>
          </Button>
          <Button 
            className="gap-2 bg-[#8cb9a3] hover:bg-[#7aa08a]"
            onClick={saveConfiguration}
          >
            <Save className="h-4 w-4" />
            <span>{saved ? 'Saved!' : 'Save Configuration'}</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Zone Configuration</CardTitle>
            <CardDescription>Draw detection zones on the camera view</CardDescription>
          </CardHeader>
          <CardContent className="p-0 relative bg-gray-900 min-h-[400px] rounded-b-lg overflow-hidden">
            {isLoading ? (
              <div className="aspect-video min-h-[400px] bg-gray-900 flex flex-col items-center justify-center text-gray-500 gap-4">
                <div className="h-8 w-8 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="text-center">
                  <p>Initializing camera...</p>
                  <p className="text-sm">This may take a few moments</p>
                </div>
              </div>
            ) : showPlaceholder ? (
              <div className="aspect-video min-h-[400px] bg-gray-900 flex flex-col items-center justify-center text-gray-500 gap-4">
                <Camera className="h-16 w-16 text-gray-700" />
                <div className="text-center">
                  <p>Camera unavailable</p>
                  <p className="text-sm">Using placeholder zone editor</p>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video min-h-[400px] w-full h-full">
                <Webcam
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: cameraDimensions.width,
                    height: cameraDimensions.height,
                    facingMode: "environment"
                  }}
                  onUserMedia={() => {
                    setWebcamReady(true);
                    setIsLoading(false);
                  }}
                  onUserMediaError={handleCameraError}
                  className="w-full h-full object-cover"
                  style={{ 
                    opacity: webcamReady ? 1 : 0,
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
                
                {/* Overlay the zone selector on top of the webcam */}
                {webcamReady && (
                  <EnhancedZoneSelector
                    zones={zones}
                    activeZoneId={activeZoneId}
                    imageWidth={cameraDimensions.width}
                    imageHeight={cameraDimensions.height}
                    onZoneChange={setZones}
                    onActiveZoneChange={setActiveZoneId}
                    className="absolute top-0 left-0 w-full h-full"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zone Properties</CardTitle>
              <CardDescription>
                {activeZoneId 
                  ? `Editing ${zones.find(z => z.id === activeZoneId)?.name}` 
                  : "Select a zone to edit its properties"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeZone ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="zone-name">Zone Name</Label>
                    <Input 
                      id="zone-name" 
                      value={editedZone.name || ''} 
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waste-type">Waste Type</Label>
                    <Input 
                      id="waste-type" 
                      value={editedZone.type || ''} 
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">Waste type is determined when creating the zone</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone-color">Zone Color</Label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: editedZone.color }}
                      ></div>
                      <Input 
                        id="zone-color" 
                        value={editedZone.color || ''} 
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        type="color"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={saveZoneProperties}
                    >
                      Apply Changes
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1 gap-2"
                      onClick={() => {
                        const updatedZones = zones.filter(zone => zone.id !== activeZoneId)
                        setZones(updatedZones)
                        setActiveZoneId(null)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Zone
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground text-center">
                    Select a zone from the camera view to edit its properties
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zone List</CardTitle>
              <CardDescription>All configured detection zones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {zones.length === 0 ? (
                  <p className="text-center text-muted-foreground py-2">No zones configured yet</p>
                ) : (
                  zones.map(zone => (
                    <div 
                      key={zone.id}
                      className={`p-3 border rounded-md flex items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
                        activeZoneId === zone.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setActiveZoneId(zone.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: zone.color }}></div>
                        <span>{zone.name}</span>
                      </div>
                      <Badge variant="outline">{zone.type}</Badge>
                    </div>
                  ))
                )}
              </div>
              
              {/* Tips for using the zone configuration */}
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Tips:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Click a colored button to add a new zone</li>
                  <li>• Use "Move" to reposition zones</li>
                  <li>• Drag corners to resize zones</li>
                  <li>• Click a zone to select and edit it</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

