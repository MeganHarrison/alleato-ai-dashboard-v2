"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Metric {
  label: string
  value: string | number
  change: number
  trend: "up" | "down" | "neutral"
  icon: React.ElementType
  color: string
  sparklineData?: number[]
}

export function HeroMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching metrics - replace with actual API call
    const fetchMetrics = async () => {
      // This would be replaced with actual data fetching
      const mockMetrics: Metric[] = [
        {
          label: "Meetings Analyzed",
          value: "47",
          change: 12.5,
          trend: "up",
          icon: Activity,
          color: "from-blue-500 to-cyan-500",
          sparklineData: [30, 35, 32, 40, 38, 45, 47]
        },
        {
          label: "Active Action Items",
          value: "23",
          change: -5.2,
          trend: "down",
          icon: CheckCircle,
          color: "from-green-500 to-emerald-500",
          sparklineData: [28, 26, 25, 24, 23, 23, 23]
        },
        {
          label: "Decision Velocity",
          value: "8.3/wk",
          change: 18.7,
          trend: "up",
          icon: Zap,
          color: "from-purple-500 to-pink-500",
          sparklineData: [5, 6, 7, 6, 8, 7, 8]
        },
        {
          label: "Team Engagement",
          value: "92%",
          change: 3.1,
          trend: "up",
          icon: Users,
          color: "from-orange-500 to-red-500",
          sparklineData: [85, 87, 88, 90, 89, 91, 92]
        },
        {
          label: "Risk Indicators",
          value: "3",
          change: 50,
          trend: "up",
          icon: AlertTriangle,
          color: "from-yellow-500 to-orange-500",
          sparklineData: [2, 2, 2, 3, 3, 3, 3]
        }
      ]
      
      setMetrics(mockMetrics)
      setIsLoading(false)
    }

    fetchMetrics()
  }, [])

  const getTrendIcon = (trend: "up" | "down" | "neutral", isPositive: boolean) => {
    if (trend === "up") {
      return <TrendingUp className={cn("h-4 w-4", isPositive ? "text-green-500" : "text-red-500")} />
    } else if (trend === "down") {
      return <TrendingDown className={cn("h-4 w-4", isPositive ? "text-green-500" : "text-red-500")} />
    }
    return null
  }

  const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min
    const width = 100
    const height = 30
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    }).join(" ")

    return (
      <svg width={width} height={height} className="opacity-50">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-${color}-500`}
        />
      </svg>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        const isPositiveChange = metric.label === "Risk Indicators" || metric.label === "Active Action Items" 
          ? metric.trend === "down" 
          : metric.trend === "up"
        
        return (
          <Card 
            key={index}
            className={cn(
              "relative p-6 overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer group",
              "bg-gradient-to-br"
            )}
          >
            {/* Background Gradient */}
            <div className={cn(
              "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br",
              metric.color
            )} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn("h-5 w-5 text-gray-600")} />
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend, isPositiveChange)}
                  <span className={cn(
                    "text-xs font-medium",
                    isPositiveChange ? "text-green-500" : "text-red-500"
                  )}>
                    {metric.change > 0 ? "+" : ""}{metric.change}%
                  </span>
                </div>
              </div>
              
              <div className="mb-2">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>

              {/* Sparkline */}
              {metric.sparklineData && (
                <div className="mt-3">
                  <Sparkline data={metric.sparklineData} color={metric.color.split("-")[1]} />
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}