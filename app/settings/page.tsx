"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, RefreshCw, Clock, Database, Shield, Monitor, Upload, Trash2, AlertCircle } from "lucide-react"
import { seedDatabase, clearDatabase } from "@/lib/seedDatabase"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert/index"
import { SoundSettings } from "@/components/settings/sound-settings"

export default function SettingsPage() {
  const [saveStatus, setSaveStatus] = useState<null | "saving" | "success" | "error">(null)
  const [dbStatus, setDbStatus] = useState<{
    operation: null | "seeding" | "clearing";
    status: null | "in-progress" | "success" | "error";
    message: string;
  }>({
    operation: null,
    status: null,
    message: ""
  })
  const [seedCount, setSeedCount] = useState(100)

  const handleSave = () => {
    setSaveStatus("saving")
    setTimeout(() => {
      setSaveStatus("success")
      setTimeout(() => setSaveStatus(null), 2000)
    }, 1500)
  }

  const handleSeedDatabase = async () => {
    setDbStatus({
      operation: "seeding",
      status: "in-progress",
      message: "Seeding database with mock data..."
    })

    try {
      const result = await seedDatabase(seedCount)
      
      setDbStatus({
        operation: "seeding",
        status: result.success ? "success" : "error",
        message: result.message
      })
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setDbStatus({
          operation: null,
          status: null,
          message: ""
        })
      }, 5000)
    } catch (error) {
      setDbStatus({
        operation: "seeding",
        status: "error",
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      })
    }
  }

  const handleClearDatabase = async () => {
    if (!confirm("Are you sure you want to clear all detection data? This cannot be undone.")) {
      return
    }
    
    setDbStatus({
      operation: "clearing",
      status: "in-progress",
      message: "Clearing database..."
    })

    try {
      const result = await clearDatabase()
      
      setDbStatus({
        operation: "clearing",
        status: result.success ? "success" : "error",
        message: result.message
      })
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setDbStatus({
          operation: null,
          status: null,
          message: ""
        })
      }, 5000)
    } catch (error) {
      setDbStatus({
        operation: "clearing",
        status: "error",
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Configure application preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSave}
            className="gap-2 bg-[#8cb9a3] hover:bg-[#7aa08a]"
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "saving" ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {dbStatus.status && (
          <Alert variant={dbStatus.status === "error" ? "destructive" : dbStatus.status === "success" ? "default" : "outline"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {dbStatus.operation === "seeding" 
                ? (dbStatus.status === "in-progress" ? "Seeding Database" : dbStatus.status === "success" ? "Seeding Complete" : "Seeding Error")
                : (dbStatus.status === "in-progress" ? "Clearing Database" : dbStatus.status === "success" ? "Database Cleared" : "Clearing Error")
              }
            </AlertTitle>
            <AlertDescription>{dbStatus.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Camera Settings</CardTitle>
              <CardDescription>Configure camera and detection preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="camera-source">Camera Source</Label>
                <Select defaultValue="default">
                  <SelectTrigger id="camera-source">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Webcam</SelectItem>
                    <SelectItem value="external">External Camera</SelectItem>
                    <SelectItem value="ip">IP Camera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Select defaultValue="720p">
                  <SelectTrigger id="resolution">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p (Recommended)</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="1440p">1440p</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fps">Frame Rate</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="fps"
                    defaultValue={[15]}
                    min={5}
                    max={30}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">15 FPS</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="camera-flip">Flip Camera Horizontally</Label>
                  <Switch id="camera-flip" />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-focus">Auto Focus</Label>
                  <Switch id="auto-focus" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Detection Settings</CardTitle>
              <CardDescription>Configure detection model and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="model">Detection Model</Label>
                <Select defaultValue="yolov11">
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yolov11">YOLOv11 (Default)</SelectItem>
                    <SelectItem value="yolov11-tiny">YOLOv11-Tiny (Faster)</SelectItem>
                    <SelectItem value="yolov8x">YOLOv8X (Higher Accuracy)</SelectItem>
                    <SelectItem value="custom">Custom Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidence-threshold">Confidence Threshold</Label>
                  <span className="text-sm font-medium">65%</span>
                </div>
                <Slider
                  id="confidence-threshold"
                  defaultValue={[65]}
                  min={10}
                  max={95}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">Higher values reduce false positives but may miss detections</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="detection-interval">Detection Interval</Label>
                  <span className="text-sm font-medium">2s</span>
                </div>
                <Slider
                  id="detection-interval"
                  defaultValue={[2]}
                  min={0.5}
                  max={5}
                  step={0.5}
                />
                <p className="text-xs text-muted-foreground">Time between detection runs in seconds</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-detect">Auto Start Detection</Label>
                  <Switch id="auto-detect" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-debug">Show Debug Information</Label>
                  <Switch id="show-debug" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <SoundSettings />
          
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>Manage detection data and historical records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="data-retention">Data Retention Period</Label>
                <Select defaultValue="30">
                  <SelectTrigger id="data-retention">
                    <SelectValue placeholder="Select data retention period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="180">6 Months</SelectItem>
                    <SelectItem value="365">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seed-count">Number of Records to Seed</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="seed-count"
                    type="number"
                    value={seedCount}
                    onChange={(e) => setSeedCount(parseInt(e.target.value) || 100)}
                    min={10}
                    max={1000}
                  />
                  <Button
                    variant="outline"
                    onClick={handleSeedDatabase}
                    disabled={dbStatus.operation === "seeding" && dbStatus.status === "in-progress"}
                    className="whitespace-nowrap"
                  >
                    {dbStatus.operation === "seeding" && dbStatus.status === "in-progress" ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Seeding...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Seed Data
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Creates mock detection records for testing</p>
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleClearDatabase}
                  disabled={dbStatus.operation === "clearing" && dbStatus.status === "in-progress"}
                >
                  {dbStatus.operation === "clearing" && dbStatus.status === "in-progress" ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Clearing Database...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Detection Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current system status and version information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">Disposify v0.9.2</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Model</p>
                <div className="flex items-center gap-1">
                  <span className="font-medium">YOLOv11</span>
                  <Badge variant="outline" className="text-xs">Latest</Badge>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Update</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">March 29, 2024</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="font-medium">Operational</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}