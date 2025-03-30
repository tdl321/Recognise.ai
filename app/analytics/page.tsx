"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, Download, Filter, Calendar, RefreshCw, Loader2 } from "lucide-react"
import { DetectionRecord, fetchDetectionStats, fetchRecentDetections, subscribeToDetections } from "@/lib/supabase"
import { WasteDistributionChart } from "@/components/analytics/waste-distribution-chart"

// Define a more flexible type for waste types
interface WasteStats {
  wasteTypes: Record<string, number>;
  correctDisposals: number;
  incorrectDisposals: number;
  totalDetections: number;
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("today")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<WasteStats>({
    wasteTypes: { plastic: 0, paper: 0, glass: 0, metal: 0 },
    correctDisposals: 0,
    incorrectDisposals: 0,
    totalDetections: 0,
  })
  const [recentIncorrectDisposals, setRecentIncorrectDisposals] = useState<any[]>([])
  const [detectionAccuracy, setDetectionAccuracy] = useState(0)
  const [avgInferenceTime, setAvgInferenceTime] = useState(0)
  const [showHistoricalData, setShowHistoricalData] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [supabaseConnected, setSupabaseConnected] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        console.log("Fetching data from Supabase...")
        // Fetch stats
        const statsData = await fetchDetectionStats()
        console.log("Stats data:", statsData)
        setStats(statsData)
        
        // Calculate accuracy
        const totalDetections = statsData.correctDisposals + statsData.incorrectDisposals
        if (totalDetections > 0) {
          setDetectionAccuracy((statsData.correctDisposals / totalDetections) * 100)
        }
        
        // Fetch recent incorrect disposals
        const recentDetections = await fetchRecentDetections(20)
        console.log("Recent detections:", recentDetections)
        
        if (recentDetections && recentDetections.length > 0) {
          setSupabaseConnected(true)
          const incorrectDisposals = recentDetections
            .filter(d => !d.is_correct)
            .slice(0, 4)
            .map(d => {
              // Mapping for correct bins
              const correctBinMap: Record<string, string> = {
                'plastic': 'Paper',
                'paper': 'Plastic',
                'glass': 'Metal',
                'metal': 'Glass',
                'cardboard': 'Trash',
                'other': 'Recycling'
              }
              const wasteName = d.waste_type.charAt(0).toUpperCase() + d.waste_type.slice(1)
              return {
                time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                type: wasteName,
                correctBin: correctBinMap[d.waste_type] || 'Other',
                confidence: Math.round(Math.random() * 10 + 80) // Mock confidence for demo
              }
            })
          
          setRecentIncorrectDisposals(incorrectDisposals)
          
          // Calculate average inference time
          const avgTime = recentDetections.reduce((acc, curr) => acc + curr.inference_speed, 0) / recentDetections.length
          if (!isNaN(avgTime)) {
            setAvgInferenceTime(1000 / avgTime) // Convert FPS to ms
          }
        }
        
        // Transform waste type data for chart
        const wasteTypeData = Object.entries(statsData.wasteTypes).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        }))
        setChartData(wasteTypeData)
      } catch (error) {
        console.error('Error loading analytics data:', error)
        setSupabaseConnected(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToDetections((payload) => {
      console.log("New detection received:", payload)
      const newDetection = payload.new
      setSupabaseConnected(true)
      
      // Update stats
      setStats(prevStats => {
        const wasteType = newDetection.waste_type
        const wasteTypes = { ...prevStats.wasteTypes }
        
        if (wasteTypes[wasteType] !== undefined) {
          wasteTypes[wasteType]++
        } else {
          wasteTypes[wasteType] = 1
        }
        
        const newCorrectDisposals = prevStats.correctDisposals + (newDetection.is_correct ? 1 : 0)
        const newIncorrectDisposals = prevStats.incorrectDisposals + (newDetection.is_correct ? 0 : 1)
        const newTotalDetections = prevStats.totalDetections + 1
        
        // Update detection accuracy
        setDetectionAccuracy((newCorrectDisposals / newTotalDetections) * 100)
        
        // Update chart data
        setChartData(prev => {
          const existingIndex = prev.findIndex(item => item.name.toLowerCase() === wasteType.toLowerCase())
          if (existingIndex >= 0) {
            const newData = [...prev]
            newData[existingIndex] = {
              ...newData[existingIndex],
              value: newData[existingIndex].value + 1
            }
            return newData
          } else {
            return [
              ...prev,
              {
                name: wasteType.charAt(0).toUpperCase() + wasteType.slice(1),
                value: 1
              }
            ]
          }
        })
        
        return {
          wasteTypes,
          correctDisposals: newCorrectDisposals,
          incorrectDisposals: newIncorrectDisposals,
          totalDetections: newTotalDetections
        }
      })
      
      // Add to incorrect disposals if applicable
      if (!newDetection.is_correct) {
        const correctBinMap: Record<string, string> = {
          'plastic': 'Paper',
          'paper': 'Plastic',
          'glass': 'Metal',
          'metal': 'Glass',
          'cardboard': 'Trash',
          'other': 'Recycling'
        }
        
        const wasteName = newDetection.waste_type.charAt(0).toUpperCase() + newDetection.waste_type.slice(1)
        const newIncorrectDisposal = {
          time: new Date(newDetection.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          type: wasteName,
          correctBin: correctBinMap[newDetection.waste_type] || 'Other',
          confidence: Math.round(Math.random() * 10 + 80) // Mock confidence for demo
        }
        
        setRecentIncorrectDisposals(prev => [newIncorrectDisposal, ...prev.slice(0, 3)])
      }
      
      // Update average inference time
      setAvgInferenceTime(prev => {
        const newFps = newDetection.inference_speed
        return ((prev * 0.8) + (1000 / newFps * 0.2)) // Weighted average
      })
    })
    
    return () => {
      unsubscribe()
    }
  }, [])

  const refreshData = async () => {
    setIsLoading(true)
    try {
      const statsData = await fetchDetectionStats()
      setStats(statsData)
      
      const totalDetections = statsData.correctDisposals + statsData.incorrectDisposals
      if (totalDetections > 0) {
        setDetectionAccuracy((statsData.correctDisposals / totalDetections) * 100)
      }
      
      // Update chart data
      const wasteTypeData = Object.entries(statsData.wasteTypes).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
      setChartData(wasteTypeData)
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDataView = () => {
    setShowHistoricalData(!showHistoricalData);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track waste detection and disposal data
            {supabaseConnected && (
              <span className="ml-2 text-xs text-green-500 inline-flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                Connected to Supabase
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Tabs value={timeframe} onValueChange={setTimeframe}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={toggleDataView}
          >
            <Calendar className="h-4 w-4" />
            <span>{showHistoricalData ? "Live Data" : "Historical Data"}</span>
          </Button>
          <Button variant="outline" className="gap-2" onClick={refreshData} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Refresh</span>
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading analytics data...</span>
          </div>
        ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalDetections}</div>
                <p className="text-xs text-green-600">
                  <span className="inline-flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Real-time data
                  </span>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Disposals by Waste Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.wasteTypes).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No waste types detected yet</p>
                  ) : (
                    Object.entries(stats.wasteTypes).slice(0, 4).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            type === 'plastic' ? 'bg-red-500' :
                            type === 'paper' ? 'bg-green-500' :
                            type === 'glass' ? 'bg-purple-500' :
                            type === 'metal' ? 'bg-amber-500' :
                            type === 'cardboard' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}></div>
                          <span className="text-sm">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Incorrect Disposals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.incorrectDisposals}</div>
                <p className="text-xs text-red-600">
                  {stats.totalDetections > 0 
                    ? `${((stats.incorrectDisposals / stats.totalDetections) * 100).toFixed(1)}% of total waste`
                    : 'No data available'}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Most Common Error</span>
                    <span className="text-sm font-medium">
                      {recentIncorrectDisposals.length > 0 
                        ? `${recentIncorrectDisposals[0].type} in ${recentIncorrectDisposals[0].correctBin}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Trend</span>
                    <span className="text-sm font-medium text-amber-600">Real-time</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{detectionAccuracy.toFixed(1)}%</div>
                <p className="text-xs text-green-600">
                  <span className="inline-flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Real-time data
                  </span>
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Model</span>
                    <span className="text-sm font-medium">YOLOv11</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Avg. Inference</span>
                    <span className="text-sm font-medium">{avgInferenceTime.toFixed(0)}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WasteDistributionChart 
                data={showHistoricalData ? undefined : chartData}
                showHistorical={showHistoricalData}
                title="Waste Distribution Trends"
                description={showHistoricalData ? "Historical waste data from Amherst College (2014-2015)" : "Real-time waste detection data"}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Incorrect Disposals</CardTitle>
                <CardDescription>Latest detection issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentIncorrectDisposals.length > 0 ? (
                    recentIncorrectDisposals.map((item, i) => (
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
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-muted-foreground">No incorrect disposals recorded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
        )}
      </div>
    </div>
  )
}

