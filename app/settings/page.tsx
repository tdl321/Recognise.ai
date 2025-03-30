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
import { Save, RefreshCw, Clock, Database, Shield, Monitor, Upload, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const [saveStatus, setSaveStatus] = useState<null | "saving" | "success" | "error">(null)

  const handleSave = () => {
    setSaveStatus("saving")
    setTimeout(() => {
      setSaveStatus("success")
      setTimeout(() => setSaveStatus(null), 2000)
    }, 1500)
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
                  <Label htmlFor="detection-frequency">Detection Frequency</Label>
                  <span className="text-sm font-medium">2 fps</span>
                </div>
                <Slider
                  id="detection-frequency"
                  defaultValue={[2]}
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">Detections per second. Lower values improve performance</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-gpu">Use GPU Acceleration</Label>
                  <Switch id="use-gpu" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Configure application behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-start Detection</Label>
                  <p className="text-sm text-muted-foreground">Start detection when app launches</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark color theme</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Save Detection Images</Label>
                  <p className="text-sm text-muted-foreground">Save images of detected items</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics Sharing</Label>
                  <p className="text-sm text-muted-foreground">Share anonymous usage data</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage detection data and database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Data Retention</Label>
                <Select defaultValue="90days">
                  <SelectTrigger>
                    <SelectValue placeholder="Select retention period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30days">30 Days</SelectItem>
                    <SelectItem value="90days">90 Days</SelectItem>
                    <SelectItem value="180days">180 Days</SelectItem>
                    <SelectItem value="365days">1 Year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How long to keep detection history</p>
              </div>
              
              <div className="space-y-2">
                <Label>Backup and Restore</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Database className="h-4 w-4" />
                    <span>Backup Data</span>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    <span>Restore</span>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 border-t pt-4 mt-4">
                <Label className="text-red-500">Danger Zone</Label>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Clear All Data</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">This action cannot be undone</p>
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