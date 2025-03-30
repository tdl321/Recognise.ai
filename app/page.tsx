"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchDetectionStats, subscribeToDetections, testConnection, seedSampleData } from "@/lib/supabase"
import { CircleOff, RefreshCw, Zap, AlertTriangle, Bug, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { WasteDistributionChart } from "@/components/analytics/waste-distribution-chart"

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [chartMode, setChartMode] = useState<'bar' | 'donut'>('bar')
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalDetections: 0,
    incorrectDisposals: 0,
    detectionAccuracy: 0,
    wasteTypes: {} as Record<string, number>,
  })

  // Function to load data with connection test and loading state
  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    
    // First test the connection
    if (isConnecting) {
      try {
        const connected = await testConnection()
        setIsConnected(connected)
        setIsConnecting(false)
        
        if (!connected) {
          setError("Failed to connect to database. Please check your connection.")
        }
      } catch (err) {
        console.error("Connection test failed:", err)
        setIsConnecting(false)
        setIsConnected(false)
        setError("Connection test failed. Please refresh the page.")
      }
    }
    
    try {
      const stats = await fetchDetectionStats()
      const totalDetections = stats.totalDetections
      const incorrectDisposals = stats.incorrectDisposals
      const correctDisposals = stats.correctDisposals
      
      // Calculate accuracy
      const accuracy = totalDetections > 0
        ? ((correctDisposals / totalDetections) * 100).toFixed(1)
        : "0.0"
      
      setStats({
        totalDetections,
        incorrectDisposals,
        detectionAccuracy: parseFloat(accuracy),
        wasteTypes: stats.wasteTypes || {},
      })
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to load data:", error)
      setError("Failed to load data. Please try again.")
    } finally {
      // Set loading to false even if there was an error
      setIsLoading(false)
    }
  }

  useEffect(() => {
    try {
      loadData()
      
      // Only set up subscription if we have a connection
      let unsubscribe: (() => void) | null = null
      
      if (isConnected) {
        // Subscribe to real-time updates
        unsubscribe = subscribeToDetections((payload) => {
          const wasteType = payload.new.waste_type
          const isCorrect = payload.new.is_correct
          
          setStats(prevStats => {
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
      }
      
      // Cleanup subscription on unmount
      return () => {
        if (unsubscribe) unsubscribe()
      }
    } catch (err) {
      console.error("Unexpected error in useEffect:", err)
      setError("An unexpected error occurred. Please refresh the page.")
      setIsLoading(false)
      setIsConnecting(false)
    }
  }, [isConnected])

  const handleRefresh = () => {
    setError(null)
    loadData()
  }

  // Display error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="mb-4 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  // Display different states based on connection and loading
  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin mb-4">
          <RefreshCw size={28} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Connecting to database...</h2>
        <p className="text-muted-foreground">This should only take a moment</p>
      </div>
    )
  }
  
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="mb-4 text-amber-500">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Database connection issue</h2>
        <p className="text-muted-foreground mb-4">Could not connect to Supabase</p>
        <div className="flex gap-3">
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry connection
          </Button>
          <Button variant="outline" onClick={() => seedSampleData()}>
            <Bug className="mr-2 h-4 w-4" />
            Generate test data
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <Button onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Detections
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDetections.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Items analyzed by AI model
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Disposal Accuracy
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.detectionAccuracy}%</div>
              <p className="text-xs text-muted-foreground">
                Items correctly disposed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Incorrect Disposals
              </CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.incorrectDisposals.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Items in wrong bins
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Most Common Type
              </CardTitle>
              <CircleOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {Object.entries(stats.wasteTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"}
              </div>
              <p className="text-xs text-muted-foreground">
                Highest volume waste category
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Waste Type Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] overflow-hidden">
              {Object.keys(stats.wasteTypes).length > 0 ? (
                <div className="h-full flex flex-col">
                  <div className="flex justify-end mb-2 flex-shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        console.log("[Dashboard] Toggling chart mode:", chartMode === 'bar' ? 'donut' : 'bar');
                        setChartMode(chartMode === 'bar' ? 'donut' : 'bar');
                      }}
                    >
                      {chartMode === 'bar' ? 'Show as Donut' : 'Show as Bar Chart'}
                    </Button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100% - 40px)' }}>
                    <WasteDistributionChart 
                      data={Object.entries(stats.wasteTypes).map(([name, value]) => {
                        console.log(`[Dashboard] Data point: ${name} = ${value}`);
                        return {
                          name: name.charAt(0).toUpperCase() + name.slice(1),
                          value
                        };
                      })}
                      chartMode={chartMode}
                      compactMode={true}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No waste type data available</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <Link href="/detection" className="w-full">
                <Button className="w-full">
                  Go to Live Detection
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

