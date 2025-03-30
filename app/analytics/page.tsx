"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Download, Filter, Calendar, RefreshCw } from "lucide-react"

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("today")

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Track waste detection and disposal data</p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={timeframe} onValueChange={setTimeframe}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2,548</div>
              <p className="text-xs text-green-600">+8.4% from {timeframe === "today" ? "yesterday" : "last " + timeframe}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Disposals by Waste Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Plastic</span>
                  </div>
                  <span className="text-sm font-medium">845</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Paper</span>
                  </div>
                  <span className="text-sm font-medium">926</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Glass</span>
                  </div>
                  <span className="text-sm font-medium">327</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm">Metal</span>
                  </div>
                  <span className="text-sm font-medium">450</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Incorrect Disposals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">183</div>
              <p className="text-xs text-red-600">7.2% of total waste</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Most Common Error</span>
                  <span className="text-sm font-medium">Plastic in Paper</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Trend</span>
                  <span className="text-sm font-medium text-amber-600">No Change</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">94.8%</div>
              <p className="text-xs text-green-600">+1.2% from {timeframe === "today" ? "yesterday" : "last " + timeframe}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Model</span>
                  <span className="text-sm font-medium">YOLOv11</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Avg. Inference</span>
                  <span className="text-sm font-medium">47ms</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>Waste Detection Trends</CardTitle>
                  <CardDescription>Detections over time by waste type</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Incorrect Disposals</CardTitle>
              <CardDescription>Latest detection issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: "14:32", type: "Plastic", correctBin: "Paper", confidence: 87 },
                  { time: "13:15", type: "Metal", correctBin: "Plastic", confidence: 92 },
                  { time: "11:48", type: "Paper", correctBin: "Compost", confidence: 84 },
                  { time: "10:22", type: "Glass", correctBin: "Plastic", confidence: 91 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-red-50">{item.type}</Badge>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Should be in {item.correctBin}</span>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{item.confidence}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

