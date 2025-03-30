import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Clock, Trash2, AlertTriangle, CheckCircle } from "lucide-react"
import { WasteDistributionChart } from "@/components/waste-distribution-chart"
import { DetectionStatus } from "@/components/detection-status"

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-1">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Today's Data</span>
          </Button>
          <Button className="gap-2 bg-[#8cb9a3] hover:bg-[#7aa08a]">
            <span>Go to Live Detection</span>
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Detections Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">247</div>
              <p className="text-xs text-green-600">+12% from yesterday</p>
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
              <div className="text-3xl font-bold">32</div>
              <p className="text-xs text-red-600">-5% from yesterday</p>
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
              <div className="text-3xl font-bold">94.2%</div>
              <p className="text-xs text-green-600">+1.5% from yesterday</p>
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
                <CardDescription>Today's breakdown by material type</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[400px]">
                <WasteDistributionChart />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Detection Status</CardTitle>
              <CardDescription>Today's system performance</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[400px]">
                <DetectionStatus />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

