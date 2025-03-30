"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { 
  Card,
  AreaChart,
  Text,
  Title,
  Flex,
  Badge,
  Color
} from "@tremor/react"
import { Loader2 } from "lucide-react"
import { fetchRecentDetections } from "@/lib/supabase"

// Transform detection data into hourly format
const transformDetectionDataToHourly = (detections: any[]) => {
  // Initialize hourly data
  const hourlyData = Array.from({length: 24}, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    Detections: 0,
    "Incorrect Disposals": 0
  }));

  // If we have detection data, process it
  if (detections && detections.length > 0) {
    detections.forEach(detection => {
      const date = new Date(detection.timestamp);
      const hour = date.getHours();
      
      // Increment count for the hour
      hourlyData[hour].Detections += 1;
      
      // If detection is incorrect, increment that counter too
      if (!detection.is_correct) {
        hourlyData[hour]["Incorrect Disposals"] += 1;
      }
    });
  }
  
  return hourlyData;
};

export function DetectionStatus() {
  const [isLoading, setIsLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDetections: 0,
    totalIncorrect: 0,
    accuracyRate: 0
  });
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Log theme state for debugging
  useEffect(() => {
    console.log("[DetectionStatus] Theme state:", { 
      resolvedTheme, 
      isDarkMode
    });
  }, [resolvedTheme, isDarkMode]);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch detection data from Supabase
        const detections = await fetchRecentDetections(100); // Get last 100 detections
        
        // Process the data for the chart
        const processed = transformDetectionDataToHourly(detections);
        setHourlyData(processed);
        
        // Calculate stats
        const totalDetections = processed.reduce((acc, item) => acc + item.Detections, 0);
        const totalIncorrect = processed.reduce((acc, item) => acc + item["Incorrect Disposals"], 0);
        const accuracyRate = totalDetections > 0 
          ? ((totalDetections - totalIncorrect) / totalDetections * 100)
          : 0;
          
        setStats({
          totalDetections,
          totalIncorrect,
          accuracyRate
        });
      } catch (error) {
        console.error('Error loading detection data:', error);
        // Use empty data as fallback
        setHourlyData(transformDetectionDataToHourly([]));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Format values for the chart
  const valueFormatter = (number: number) => `${number}`;
  
  // Define color arrays for light and dark mode - matching the screenshot
  const lightModeColors = [
    "#4CAF50", // Green (Detections)
    "#F44336"  // Red (Incorrect Disposals)
  ];
  
  const darkModeColors = [
    "rgba(76, 175, 80, 0.8)", // Green (Detections)
    "rgba(244, 67, 54, 0.8)"  // Red (Incorrect Disposals)
  ];
  
  // More visible in dark mode
  
  // Choose colors based on theme
  const colors = isDarkMode ? darkModeColors : lightModeColors;
  
  return (
    <Card className={`w-full p-0 ${isDarkMode ? 'bg-gray-900 border-gray-800' : ''}`}>
      <div className="p-4">
        <Flex alignItems="center" justifyContent="between">
          <div>
            <Text>Daily Activity</Text>
            <Title>Detection Performance</Title>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="green" className="text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>Live Updates</span>
              </div>
            </Badge>
          </div>
        </Flex>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading data...</span>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-2">
              <Flex>
                <div>
                  <Text>Total Detections</Text>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold">{stats.totalDetections}</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>items</span>
                  </div>
                </div>
                <div>
                  <Text>Accuracy Rate</Text>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold">{stats.accuracyRate.toFixed(1)}%</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>rate</span>
                  </div>
                </div>
              </Flex>
            </div>
            
            <div className="h-[250px] mt-4">
              <AreaChart
                data={hourlyData}
                index="hour"
                categories={["Detections", "Incorrect Disposals"]}
                colors={colors}
                valueFormatter={valueFormatter}
                showLegend={true}
                showGridLines={false}
                startEndOnly={true}
                showXAxis={true}
                showYAxis={true}
                yAxisWidth={30}
                showAnimation={true}
                className={`h-full detection-status-chart ${isDarkMode ? 'tremor-dark' : ''}`}
              />
            </div>
          </>
        )}
      </div>
    </Card>
  )
} 