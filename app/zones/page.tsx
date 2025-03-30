"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Layers, Save, Trash2, Plus, RotateCcw } from "lucide-react"

export default function ZonesPage() {
  const [activeZone, setActiveZone] = useState<string | null>(null)

  // Mock data for zones
  const zones = [
    { id: "zone1", name: "Recycling Bin", type: "Plastic", color: "#3b82f6" },
    { id: "zone2", name: "Paper Bin", type: "Paper", color: "#10b981" },
    { id: "zone3", name: "Glass Container", type: "Glass", color: "#6366f1" },
    { id: "zone4", name: "Metal Bin", type: "Metal", color: "#f59e0b" }
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detection Zones</h1>
          <p className="text-muted-foreground">Configure and manage waste detection zones</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>Reset Zones</span>
          </Button>
          <Button className="gap-2 bg-[#8cb9a3] hover:bg-[#7aa08a]">
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Zone Configuration</CardTitle>
            <CardDescription>Draw detection zones on the camera view</CardDescription>
          </CardHeader>
          <CardContent className="p-0 relative bg-gray-900 min-h-[400px] rounded-b-lg">
            {/* Placeholder for camera feed */}
            <div className="aspect-video min-h-[400px] bg-gray-900 flex items-center justify-center text-gray-500">
              Camera feed placeholder - Implement drag-and-draw interface here
            </div>

            {/* Zone overlays would be placed here in the implementation */}
            {zones.map(zone => (
              <div
                key={zone.id}
                className={`absolute border-2 rounded-md ${
                  activeZone === zone.id ? "border-white" : `border-[${zone.color}]`
                }`}
                style={{
                  top: `${zone.id === "zone1" ? "20%" : zone.id === "zone2" ? "30%" : zone.id === "zone3" ? "60%" : "40%"}`,
                  left: `${zone.id === "zone1" ? "20%" : zone.id === "zone2" ? "60%" : zone.id === "zone3" ? "30%" : "70%"}`,
                  width: "20%",
                  height: "20%",
                  backgroundColor: `${zone.color}20`,
                  borderColor: zone.color
                }}
                onClick={() => setActiveZone(zone.id)}
              >
                <div className="absolute top-0 left-0 p-1 text-xs text-white" style={{ backgroundColor: zone.color }}>
                  {zone.name}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zone Properties</CardTitle>
              <CardDescription>
                {activeZone 
                  ? `Editing ${zones.find(z => z.id === activeZone)?.name}` 
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
                      defaultValue={zones.find(z => z.id === activeZone)?.name} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waste-type">Waste Type</Label>
                    <Input 
                      id="waste-type" 
                      defaultValue={zones.find(z => z.id === activeZone)?.type} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone-color">Zone Color</Label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-md border"
                        style={{ backgroundColor: zones.find(z => z.id === activeZone)?.color }}
                      ></div>
                      <Input 
                        id="zone-color" 
                        defaultValue={zones.find(z => z.id === activeZone)?.color} 
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button variant="destructive" className="w-full gap-2">
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
                {zones.map(zone => (
                  <div 
                    key={zone.id}
                    className={`p-3 border rounded-md flex items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${
                      activeZone === zone.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setActiveZone(zone.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: zone.color }}></div>
                      <span>{zone.name}</span>
                    </div>
                    <Badge variant="outline">{zone.type}</Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add New Zone
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

