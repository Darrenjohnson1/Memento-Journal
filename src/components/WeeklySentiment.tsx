"use client";
import { TrendingUp } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
} from "recharts";
import React from "react";
import { Entry } from "@prisma/client";
import { getDateOfISOWeek } from "@/lib/utils";

// Chart configuration
const chartConfig = {
  sentiment: {
    label: "Positivity Score",
    color: "#ff3e66",
  },
} satisfies ChartConfig;

type Props = {
  entry: Entry[];
};

// Format the date to "Jun 21"
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Optional: format full date for tooltip
function formatFullDate(date: Date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

// Custom Tooltip
function CustomTooltip({ active, payload }: TooltipProps<any, any>) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const versionText = data.version === 'original' ? 'Original' : 
                       data.version === 'reframed' ? 'Reframed' : 
                       data.version === 'current' ? 'Current' : 
                       data.version || 'Unknown';
    return (
      <div className="max-w-xs rounded-md border bg-white p-3 text-sm shadow-md">
        <p className="font-medium">{formatFullDate(data.date)}</p>
        <p className="text-muted-foreground mt-1 line-clamp-4">
          {data.summary || "No summary available"}
        </p>
        <p className="mt-2 font-semibold text-pink-600">
          Positivity Score: {data.sentiment.toFixed(1)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Version: {versionText}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      </div>
    );
  }
  return null;
}

// Get ISO week number
function getISOWeek(date: Date) {
  const tmp = new Date(date.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return (
    tmp.getFullYear() +
    "-W" +
    String(
      1 +
        Math.round(
          ((tmp.getTime() - week1.getTime()) / 86400000 -
            3 +
            ((week1.getDay() + 6) % 7)) /
            7,
        ),
    ).padStart(2, "0")
  );
}

export function WeeklySentiment({ entry }: Props) {
  // Transform each entry to include sentiment history
  const chartDataAll = entry
    .flatMap(({ createdAt, summary, sentiment, sentimentHistory }) => {
      try {
        const summaryObj = JSON.parse(summary);
        const baseDate = new Date(createdAt);
        
        // Use sentiment history for all data points
        const dataPoints = [];
        
        console.log('Processing entry:', { createdAt, sentiment, sentimentHistory });
        
        if (sentimentHistory && Array.isArray(sentimentHistory)) {
          console.log('Found sentiment history:', sentimentHistory);
          // Use all sentiment history points
          sentimentHistory.forEach((historyItem: any) => {
            console.log('Processing history item:', historyItem);
            if (historyItem && typeof historyItem.score === 'number' && !isNaN(historyItem.score)) {
              dataPoints.push({
                day: formatDate(String(historyItem.timestamp || createdAt)),
                date: new Date(historyItem.timestamp || createdAt),
                sentiment: historyItem.score,
                summary: summaryObj.summary || "",
                version: historyItem.version || 'unknown',
                timestamp: historyItem.timestamp || createdAt,
              });
            }
          });
        } else if (typeof sentiment === 'number' && !isNaN(sentiment)) {
          console.log('Using fallback sentiment:', sentiment);
          // Fallback to current sentiment if no history exists
          dataPoints.push({
            day: formatDate(createdAt),
            date: baseDate,
            sentiment: sentiment,
            summary: summaryObj.summary || "",
            version: 'current',
            timestamp: createdAt,
          });
        }
        
        console.log('Generated data points:', dataPoints);
        
        return dataPoints;
      } catch {
        return [];
      }
    })
    .filter(Boolean)
    .sort((a, b) => a!.date.getTime() - b!.date.getTime());

  // Determine the ISO week and year to filter by
  let weekToShow: number, yearToShow: number;
  if (chartDataAll.length > 0) {
    const firstDate = chartDataAll[0].date;
    // getDateOfISOWeek returns the Monday of the ISO week
    const weekMonday = getDateOfISOWeek(
      // getISOWeek from WeeklyCalendar logic
      (() => {
        const tmp = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), firstDate.getUTCDate()));
        const dayNum = tmp.getUTCDay() || 7;
        tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
        return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      })(),
      firstDate.getUTCFullYear()
    );
    weekToShow = (() => {
      const tmp = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), firstDate.getUTCDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    })();
    yearToShow = firstDate.getUTCFullYear();
    // weekMonday is the start of the week
  } else {
    const now = new Date();
    weekToShow = (() => {
      const tmp = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    })();
    yearToShow = now.getUTCFullYear();
  }
  // Get the Monday of the ISO week
  const weekStart = getDateOfISOWeek(weekToShow, yearToShow);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  // Filter chartData to only include entries from this ISO week
  const chartData = chartDataAll.filter(d => d.date >= weekStart && d.date <= weekEnd);

  // Always show all 7 days of the ISO week, even if no entry exists for some days
  const weekDays: Date[] = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    return d;
  });

  // Create separate data points for each sentiment score on the same day
  const chartDataFull = [];
  
  // Group all sentiment data by day
  const sentimentByDay: Record<string, any[]> = {};
  chartData.forEach((dataPoint) => {
    const dayKey = dataPoint.date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!sentimentByDay[dayKey]) {
      sentimentByDay[dayKey] = [];
    }
    sentimentByDay[dayKey].push(dataPoint);
  });
  
  // Create data points for each day
  weekDays.forEach((date) => {
    const dayKey = date.toISOString().split('T')[0];
    const daySentiments = sentimentByDay[dayKey] || [];
    
    if (daySentiments.length === 0) {
      // No sentiments for this day
      chartDataFull.push({
        day: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        date,
        sentiment: 0,
        summary: "No entry",
      });
    } else {
              // Create a separate data point for each sentiment on this day
        daySentiments.forEach((sentiment, index) => {
          const sentimentDate = new Date(sentiment.timestamp || date);
          // Add time to the day label to distinguish multiple points on same day
          const timeString = sentimentDate.toLocaleTimeString(undefined, { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          chartDataFull.push({
            day: `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${timeString}`,
            date: sentimentDate,
            sentiment: sentiment.sentiment,
            summary: sentiment.summary,
            version: sentiment.version,
            timestamp: sentiment.timestamp,
          });
        });
    }
  });
  
  // Sort by date
  chartDataFull.sort((a, b) => a.date.getTime() - b.date.getTime());

  console.log('WeeklySentiment chartDataFull:', chartDataFull);

  const first = chartData[0]?.sentiment ?? 0;
  const last = chartData[chartData.length - 1]?.sentiment ?? 0;
  const improvement = (last - first).toFixed(2);

  // Calculate weekly score totals
  const weeklyScores: Record<string, number> = {};
  chartData.forEach((entry) => {
    const week = getISOWeek(entry.date);
    weeklyScores[week] = (weeklyScores[week] || 0) + entry.sentiment;
  });

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Positivity Score Over Time</h2>
        <p className="text-muted-foreground text-sm">
          Based on each individual journal entry
        </p>
      </div>

      <ChartContainer config={chartConfig}>
        <AreaChart
          data={chartDataFull}
          margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            domain={[0, 100]}
            tickCount={6}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            dataKey="sentiment"
            type="monotone"
            stroke="#ff3e66"
            fill="#ff3e66"
            fillOpacity={0.2}
            strokeWidth={2}
            isAnimationActive={true}
            connectNulls={false}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>

      <div className="mt-6 space-y-2">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4 text-pink-500" />
          Trending up by {improvement} positivity points over time
        </div>
        {Object.entries(weeklyScores).map(([week, score]) => (
          <div key={week} className="text-muted-foreground text-sm">
            Week {week}: Total Positivity Score:{" "}
            <span className="text-foreground font-semibold">
              {score.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
