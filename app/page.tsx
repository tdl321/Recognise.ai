"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Clock, Trash2, AlertTriangle, CheckCircle, Loader2, RefreshCw, Bug, Badge } from "lucide-react"
import { WasteDistributionChart } from "@/components/analytics/waste-distribution-chart"
import { DetectionStatus } from "@/components/detection/detection-status"
import { fetchDetectionStats, subscribeToDetections, seedSampleData } from "@/lib/supabase"
import { debugSupabaseData } from "@/lib/utils"
import Link from "next/link"

interface DashboardStats {
  totalDetections: number;
  incorrectDisposals: number;
  detectionAccuracy: number;
  wasteTypes: Record<string, number>;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalDetections: 0,
    incorrectDisposals: 0,
    detectionAccuracy: 0,
    wasteTypes: {}
  })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching dashboard data from Supabase...")
      const statsData = await fetchDetectionStats()
      console.log("Dashboard data:", statsData)
      
      if (statsData) {
        const totalDetections = statsData.totalDetections;
        const incorrectDisposals = statsData.incorrectDisposals;
        const correctDisposals = statsData.correctDisposals;
        
        // Calculate accuracy
        const accuracy = totalDetections > 0 
          ? ((correctDisposals / totalDetections) * 100).toFixed(1) 
          : "0";
          
        setStats({
          totalDetections,
          incorrectDisposals,
          detectionAccuracy: parseFloat(accuracy),
          wasteTypes: statsData.wasteTypes
        })
        
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log("Dashboard component mounted - fetching data from Supabase...")
    loadData()
    
    // Subscribe to real-time updates
    console.log("Setting up Supabase real-time subscription...")
    const unsubscribe = subscribeToDetections((payload) => {
      console.log("New detection received on dashboard:", payload)
      
      setStats(prevStats => {
        const wasteType = payload.new.waste_type
        const isCorrect = payload.new.is_correct
        
        // Update waste types
        const wasteTypes = { ...prevStats.wasteTypes }
        if (wasteTypes[wasteType]) {
          wasteTypes[wasteType]++
        } else {
          wasteTypes[wasteType] = 1
        }
        
        // Update counts
        const totalDetections = prevStats.totalDetections + 1
        const incorrectDisposals = prevStats.incorrectDisposals + (isCorrect ? 0 : 1)
        const correctDisposals = totalDetections - incorrectDisposals
        
        // Calculate new accuracy
        const accuracy = ((correctDisposals / totalDetections) * 100).toFixed(1)
        
        setLastUpdated(new Date())
        
        return {
          totalDetections,
          incorrectDisposals,
          detectionAccuracy: parseFloat(accuracy),
          wasteTypes
        }
      })
    })
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [])

  const handleRefresh = () => {
    loadData()
  }

  const handleDebug = async () => {
    console.log("Running Supabase debug...")
    await debugSupabaseData()
    console.log("Debug complete - check console for details")
    
    // If we have no data, seed some sample data and refresh
    if (stats.totalDetections === 0) {
      const seeded = await seedSampleData()
      if (seeded) {
        loadData()
      }
    }
  }

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return ""
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }

  const getWasteTypeColor = (name: string): string => {
    const typeColors: Record<string, string> = {
      'paper': '#4CAF50',
      'cardboard': '#3B82F6',
      'glass': '#9C27B0',
      'metal': '#F59E0B',
      'other': '#8b5cf6',
      'plastic': '#ef4444'
    };
    
    return typeColors[name.toLowerCase()] || '#6b7280';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {formatTimeAgo(lastUpdated)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleDebug}>
            <Bug className="h-4 w-4" />
            <span className="hidden sm:inline">Debug Data</span>
          </Button>
          <Link href="/detection">
            <Button className="gap-2 bg-[#8cb9a3] hover:bg-[#7aa08a]">
              <span>Go to Live Detection</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading dashboard data...</span>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalDetections}</div>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    {stats.totalDetections > 0 
                      ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span>Live data from Supabase</span>
                        </>
                      ) 
                      : 'No detections yet'}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <Trash2 className="mr-1 h-4 w-4" />
                    <span>Across all waste categories</span>
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
                      ? `${((stats.incorrectDisposals / stats.totalDetections) * 100).toFixed(1)}% of total`
                      : 'No data yet'}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    <span>Requires attention</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.detectionAccuracy}%</div>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    {stats.totalDetections > 0 
                      ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span>Based on correct/incorrect ratio</span>
                        </>
                      ) 
                      : 'No detections yet'}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    <span>YOLOv11 model performance</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="md:col-span-1">
                <CardHeader>
                  <div>
                    <CardTitle>Waste Distribution</CardTitle>
                    <CardDescription>Breakdown by material type</CardDescription>
                  </div>
                  {stats.totalDetections > 0 && (
                    <Badge className="bg-green-100 text-green-800">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>Live Data</span>
                      </span>
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full" style={{ height: "350px", overflow: "visible" }}>
                    <WasteDistributionChart 
                      data={Object.entries(stats.wasteTypes).map(([name, value]) => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        value,
                        color: getWasteTypeColor(name)
                      }))}
                      showHistorical={false}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Detection Status</CardTitle>
                  <CardDescription>System performance</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full" style={{ height: "350px", overflow: "visible" }}>
                    <DetectionStatus />
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

