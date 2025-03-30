"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { historicalData } from "@/lib/mockData"
import { Badge } from "@/components/ui/badge"
import { fetchHistoricalData } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { 
  BarChart, 
  DonutChart,
  Card as TremorCard,
  Title,
  Text,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Flex,
  Metric,
  Legend
} from "@tremor/react"

interface WasteDistributionChartProps {
  data?: any[]
  title?: string
  description?: string
  showHistorical?: boolean
}

export function WasteDistributionChart({
  data,
  title = "Waste Distribution",
  description = "Distribution of waste by category",
  showHistorical = false
}: WasteDistributionChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [chartMode, setChartMode] = useState<'donut' | 'bar'>('bar')
  const [historicalYear, setHistoricalYear] = useState<number>(2015)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [dbHistoricalData, setDbHistoricalData] = useState<any[] | null>(null)
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === 'dark'
  
  // Colors for chart segments - matching the screenshot
  const lightModeColors = [
    "#4CAF50", // Green (Paper)
    "#3B82F6", // Blue (Cardboard)
    "#9C27B0", // Purple (Glass)
    "#F59E0B", // Amber (Metal)
    "#8b5cf6", // Purple (other)
    "#6b7280"  // Gray (other)
  ]

  const darkModeColors = [
    "rgba(76, 175, 80, 0.8)",    // Green (Paper)
    "rgba(59, 130, 246, 0.8)",   // Blue (Cardboard)
    "rgba(156, 39, 176, 0.8)",   // Purple (Glass)
    "rgba(245, 158, 11, 0.8)",   // Amber (Metal)
    "rgba(139, 92, 246, 0.8)",   // Purple (other)
    "rgba(107, 114, 128, 0.8)"   // Gray (other)
  ]

  // Choose color set based on theme
  const chartColors = isDarkMode ? darkModeColors : lightModeColors

  // Log theme state for debugging
  useEffect(() => {
    console.log("[WasteDistributionChart] Theme state:", { 
      resolvedTheme, 
      isDarkMode,
      usingColors: isDarkMode ? 'darkModeColors' : 'lightModeColors'
    })
  }, [resolvedTheme, isDarkMode])

  // Fetch historical data from Supabase
  useEffect(() => {
    if (showHistorical) {
      const loadHistoricalData = async () => {
        setIsLoading(true);
        try {
          const data = await fetchHistoricalData(historicalYear);
          if (data) {
            setDbHistoricalData(data);
          }
        } catch (error) {
          console.error("Error loading historical data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadHistoricalData();
    }
  }, [showHistorical, historicalYear]);
  
  useEffect(() => {
    if (showHistorical) {
      // Use data from Supabase if available, otherwise fall back to mock data
      const yearData = dbHistoricalData || historicalData.filter(d => d.year === historicalYear);
      
      if (chartMode === 'bar') {
        // Convert to monthly chart data for Tremor's BarChart
        const processedData = yearData.map((d: any) => ({
          month: getMonthName(d.month),
          "Recyclable": d.totalSingleStream + d.totalRecovered,
          "Non-Recyclable": d.totalRoutineTrash,
        }));
        setChartData(processedData);
      } else {
        // For donut chart, sum up the yearly totals
        const yearlyTotal = {
          'Recyclable Paper/Cardboard': yearData.reduce((acc: number, d: any) => acc + d.totalSingleStream, 0),
          'Recyclable Glass/Metal': yearData.reduce((acc: number, d: any) => acc + d.totalRecovered, 0),
          'Non-Recyclable Waste': yearData.reduce((acc: number, d: any) => acc + d.totalRoutineTrash, 0),
        };
        
        const donutData = [
          { name: 'Recyclable Paper/Cardboard', value: yearlyTotal['Recyclable Paper/Cardboard'] },
          { name: 'Recyclable Glass/Metal', value: yearlyTotal['Recyclable Glass/Metal'] },
          { name: 'Non-Recyclable Waste', value: yearlyTotal['Non-Recyclable Waste'] },
        ];
        
        setChartData(donutData);
      }
    } else if (data && data.length > 0) {
      // Use real-time data if provided - add colors directly to data items
      const dataWithColors = data.map((item: any) => ({
        ...item,
        color: getColorForCategory(item.name)
      }));
      setChartData(dataWithColors);
    } else {
      // Mock data with colors for demonstration
      if (chartMode === 'bar') {
        setChartData([
          { name: 'Paper', value: 35, color: '#4CAF50' },
          { name: 'Cardboard', value: 45, color: '#3B82F6' },
          { name: 'Glass', value: 15, color: '#9C27B0' },
          { name: 'Metal', value: 30, color: '#F59E0B' },
          { name: 'Other', value: 10, color: '#8b5cf6' },
          { name: 'Plastic', value: 25, color: '#ef4444' },
        ]);
      } else {
        setChartData([
          { name: 'Paper', value: 35, color: '#4CAF50' },
          { name: 'Cardboard', value: 45, color: '#3B82F6' },
          { name: 'Glass', value: 15, color: '#9C27B0' },
          { name: 'Metal', value: 30, color: '#F59E0B' },
          { name: 'Other', value: 10, color: '#8b5cf6' },
          { name: 'Plastic', value: 25, color: '#ef4444' },
        ]);
      }
    }
  }, [data, chartMode, showHistorical, historicalYear, dbHistoricalData]);
  
  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' });
  };
  
  const toggleChartMode = () => {
    setChartMode(chartMode === 'bar' ? 'donut' : 'bar');
  };
  
  const toggleHistoricalYear = () => {
    setHistoricalYear(historicalYear === 2015 ? 2014 : 2015);
  };

  const valueFormatter = (number: number) => 
    `${Intl.NumberFormat("us").format(number).toString()}`;
  
  // Map waste type to its color
  const getColorForCategory = (category: string): string => {
    switch (category) {
      case 'Paper': return '#4CAF50';
      case 'Cardboard': return '#3B82F6';
      case 'Glass': return '#9C27B0';
      case 'Metal': return '#F59E0B';
      case 'Other': return '#8b5cf6';
      case 'Plastic': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Ensure data values are valid numbers to prevent NaN errors
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const sanitizedData = chartData.map(item => ({
        ...item,
        value: typeof item.value === 'number' && !isNaN(item.value) ? item.value : 0
      }));
      
      if (JSON.stringify(sanitizedData) !== JSON.stringify(chartData)) {
        console.log('Sanitized data to prevent NaN:', sanitizedData);
        setChartData(sanitizedData);
      }
    }
  }, [chartData]);

  // Debug data being passed to the chart
  useEffect(() => {
    console.log('Chart data:', chartData);
  }, [chartData]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {showHistorical ? (
              <Badge
                onClick={toggleHistoricalYear}
                className="cursor-pointer"
                variant="outline"
              >
                {historicalYear} Data
              </Badge>
            ) : (
              <Badge
                className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200"
              >
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  Live Data
                </span>
              </Badge>
            )}
            <Badge
              onClick={toggleChartMode}
              className="cursor-pointer"
              variant="outline"
            >
              {chartMode === 'bar' ? 'Bar Chart' : 'Donut Chart'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading data...</span>
            </div>
          ) : (
            <>
              {chartMode === 'bar' ? (
                <BarChart
                  data={chartData}
                  index={showHistorical ? "month" : "name"}
                  categories={showHistorical ? ["Recyclable", "Non-Recyclable"] : ["value"]}
                  colors={chartColors}
                  valueFormatter={valueFormatter}
                  yAxisWidth={48}
                  showAnimation={true}
                  showLegend={true}
                  customTooltip={(props) => {
                    const { payload, active } = props;
                    if (!active || !payload) return null;
                    
                    const categoryItem = payload[0];
                    if (!categoryItem) return null;
                    
                    const itemName = String(categoryItem.name || '');
                    const itemValue = typeof categoryItem.value === 'number' ? categoryItem.value : 0;
                    
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-md">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ 
                            backgroundColor: getColorForCategory(itemName) 
                          }}></span>
                          <span className="font-medium">{itemName}</span>
                        </div>
                        <div className="mt-1 text-tremor-default text-gray-700">
                          {valueFormatter(itemValue)}
                        </div>
                      </div>
                    );
                  }}
                  onValueChange={(v) => console.log(v)}
                  className={`h-full ${isDarkMode ? 'tremor-dark' : ''}`}
                />
              ) : (
                <DonutChart
                  data={chartData}
                  category="value"
                  index="name"
                  valueFormatter={valueFormatter}
                  colors={chartColors}
                  showAnimation={true}
                  className={`mt-6 h-full ${isDarkMode ? 'tremor-dark' : ''}`}
                  label="Total Waste"
                  variant="pie"
                  onValueChange={(v) => console.log(v)}
                />
              )}
            </>
          )}
        </div>
        {showHistorical ? (
          <div className="mt-2 text-xs text-right text-muted-foreground">
            <span className="flex items-center justify-end">
              {dbHistoricalData ? "Using data from Supabase database" : "Using mock data (Supabase data not available)"}
            </span>
          </div>
        ) : (
          <div className="mt-2 text-xs text-right text-green-600 flex items-center justify-end gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Live data from Supabase Realtime</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 