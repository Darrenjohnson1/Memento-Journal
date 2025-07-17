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
  // Map each entry to a single data point per day with original and newest sentiment
  const chartDataAll = entry.map(({ createdAt, summary, sentiment, sentimentHistory }) => {
    let summaryObj = {};
    try {
      summaryObj = summary ? JSON.parse(summary) : {};
    } catch {}
    let original = null, newest = null;
    if (sentimentHistory && Array.isArray(sentimentHistory) && sentimentHistory.length > 0) {
      original = sentimentHistory[0]?.score ?? null;
      newest = sentimentHistory[sentimentHistory.length - 1]?.score ?? null;
    } else if (typeof sentiment === 'number') {
      original = newest = sentiment;
    }
    return {
      day: formatDate(createdAt),
      date: new Date(createdAt),
      original,
      newest,
      summary: summaryObj.summary || "",
    };
  });

  // Determine the ISO week and year to filter by
  let weekToShow: number, yearToShow: number;
  if (chartDataAll.length > 0) {
    const firstDate = chartDataAll[0].date;
    weekToShow = (() => {
      const tmp = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), firstDate.getUTCDate()));
      const dayNum = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      return Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    })();
    yearToShow = firstDate.getUTCFullYear();
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

  // Fill in missing days with nulls for both series
  const chartDataFull = weekDays.map((date) => {
    const dayKey = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const found = chartData.find(d => d.day === dayKey);
    return {
      day: dayKey,
      date,
      original: found && found.original !== null ? found.original : 0, // Drop to zero
      newest: found && found.newest !== null ? found.newest : 0,      // Drop to zero
      summary: found ? found.summary : "No entry",
    };
  });

  console.log('WeeklySentiment chartDataFull:', chartDataFull);

  // Calculate improvement
  const first = chartData.find(d => d.original !== null)?.original ?? 0;
  const last = chartData.reverse().find(d => d.newest !== null)?.newest ?? 0;
  const improvement = (last - first).toFixed(2);

  // Calculate weekly score totals for both series
  const weeklyScores: Record<string, { original: number, newest: number }> = {};
  chartData.forEach((entry) => {
    const week = getISOWeek(entry.date);
    if (!weeklyScores[week]) weeklyScores[week] = { original: 0, newest: 0 };
    weeklyScores[week].original += entry.original ?? 0;
    weeklyScores[week].newest += entry.newest ?? 0;
  });

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Positivity Score This Week</h2>
        <p className="text-muted-foreground text-sm">
          Based on each individual journal entry
        </p>
      </div>

      <ChartContainer config={{ original: { label: "Original Sentiment", color: "#f57459" }, newest: { label: "Newest Sentiment", color: "#f1396a" } }}>
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
          <Tooltip content={({ active, payload }) => {
            if (active && payload && payload.length > 0) {
              const data = payload[0].payload;
              return (
                <div className="max-w-xs rounded-md border bg-white p-3 text-sm shadow-md">
                  <p className="font-medium">{formatFullDate(data.date)}</p>
                  <p className="text-muted-foreground mt-1 line-clamp-4">
                    {data.summary || "No summary available"}
                  </p>
                  <p className="mt-2 font-semibold" style={{ color: '#f57459' }}>
                    Original: {data.original !== null ? data.original : "-"}
                  </p>
                  <p className="mt-2 font-semibold" style={{ color: '#f1396a' }}>
                    Newest: {data.newest !== null ? data.newest : "-"}
                  </p>
                </div>
              );
            }
            return null;
          }} />
          <Area
            dataKey="original"
            type="monotone"
            stroke="#f57459"
            fill="#f57459"
            fillOpacity={0.2}
            strokeWidth={2}
            name="Original Sentiment"
            connectNulls={true}
            isAnimationActive={true}
          />
          <Area
            dataKey="newest"
            type="monotone"
            stroke="#f1396a"
            fill="#f1396a"
            fillOpacity={0.2}
            strokeWidth={2}
            name="Newest Sentiment"
            connectNulls={true}
            isAnimationActive={true}
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
            Week {week}: Total Original: <span className="text-foreground font-semibold">{score.original.toFixed(1)}</span> | Total Newest: <span className="text-foreground font-semibold">{score.newest.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
