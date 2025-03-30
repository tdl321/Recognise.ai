"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, CheckCircle, AlertTriangle, RefreshCw, Clock, BarChart3, Calendar, Download } from "lucide-react"

export default function MonitorPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("day")
  const [isLoading, setIsLoading] = useState(false)
  
  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Monitor</h1>
          <p className="text-muted-foreground">Real-time performance metrics and system health</p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList>
              <TabsTrigger value="day">24h</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">All Systems Operational</p>
              <p className="text-xs text-muted-foreground">Last checked: 2 minutes ago</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Detection Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">99.7%</div>
              <p className="text-xs text-green-600">+0.2% from last week</p>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                <span>23h 56m operational</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Inference Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">124ms</div>
              <p className="text-xs text-amber-600">+12ms from yesterday</p>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Activity className="mr-1 h-4 w-4" />
                <span>GPU acceleration active</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0.3%</div>
              <p className="text-xs text-green-600">-0.1% from yesterday</p>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <AlertTriangle className="mr-1 h-4 w-4" />
                <span>7 errors in last 24h</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8,432</div>
              <p className="text-xs text-green-600">+12% from last week</p>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <BarChart3 className="mr-1 h-4 w-4" />
                <span>247 today</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current resource utilization and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">CPU Usage</p>
                  <p className="text-sm font-medium">34%</p>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-blue-500 w-[34%] rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Memory Usage</p>
                  <p className="text-sm font-medium">42%</p>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-purple-500 w-[42%] rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">GPU Usage</p>
                  <p className="text-sm font-medium">78%</p>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-amber-500 w-[78%] rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Disk Usage</p>
                  <p className="text-sm font-medium">23%</p>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-500 w-[23%] rounded-full"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent System Events</CardTitle>
              <CardDescription>Latest system logs and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-auto">
                {[
                  { time: "12:42 PM", message: "Detection service restarted", type: "info" },
                  { time: "11:37 AM", message: "Connection to camera restored", type: "success" },
                  { time: "11:32 AM", message: "Camera connection lost", type: "error" },
                  { time: "10:15 AM", message: "Settings updated", type: "info" },
                  { time: "09:42 AM", message: "Database backup completed", type: "success" },
                  { time: "08:30 AM", message: "System startup", type: "info" },
                  { time: "Yesterday", message: "Inference latency spike detected", type: "warning" },
                  { time: "Yesterday", message: "Model updated to YOLOv11", type: "info" },
                ].map((event, index) => (
                  <div key={index} className="flex items-start gap-2 pb-2 border-b last:border-0">
                    <Badge 
                      variant="outline" 
                      className={
                        event.type === "error" ? "text-red-500 bg-red-50" :
                        event.type === "warning" ? "text-amber-500 bg-amber-50" :
                        event.type === "success" ? "text-green-500 bg-green-50" :
                        "text-blue-500 bg-blue-50"
                      }
                    >
                      {event.type}
                    </Badge>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{event.message}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Detection Performance</CardTitle>
              <CardDescription>Inference speed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="rounded-full bg-muted p-6 inline-flex">
                    <Activity className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium">Performance Graph</p>
                  <p className="text-sm text-muted-foreground">Visualization of detection performance over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Maintenance</CardTitle>
            <CardDescription>Upcoming maintenance windows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Database Optimization</p>
                    <p className="text-sm text-muted-foreground">Scheduled for Apr 2, 2024 at 02:00 AM</p>
                  </div>
                </div>
                <Badge>Upcoming</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Model Update</p>
                    <p className="text-sm text-muted-foreground">Scheduled for Apr 5, 2024 at 03:00 AM</p>
                  </div>
                </div>
                <Badge>Upcoming</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}