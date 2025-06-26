"use client";
import React from "react";
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

// Dummy data: simulate 14 days
const dummyEntries = Array.from({ length: 14 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (13 - i));
  const sentiment = Math.sin(i / 2) * 0.8 + 0.2 + Math.random() * 0.4;
  return {
    createdAt: date.toISOString(),
    summary: JSON.stringify({
      sentiment: sentiment,
      summary: `Day ${i + 1} was ${sentiment > 0.5 ? "great" : "tough"}.`,
    }),
  };
});

// Chart config
const chartConfig = {
  sentiment: {
    label: "Positivity Score",
    color: "#ff3e66",
  },
} satisfies ChartConfig;

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(date: Date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

function CustomTooltip({ active, payload }: TooltipProps<any, any>) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="max-w-xs rounded-md border bg-white p-3 text-sm shadow-md">
        <p className="font-medium">{formatFullDate(data.date)}</p>
        <p className="text-muted-foreground mt-1 line-clamp-4">
          {data.summary || "No summary available"}
        </p>
        <p className="mt-2 font-semibold text-pink-600">
          Positivity Score: {data.sentiment.toFixed(1)}
        </p>
      </div>
    );
  }
  return null;
}

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

export function SentimentMock() {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);

  const pastWeekEntries = dummyEntries.filter((entry) => {
    const date = new Date(entry.createdAt);
    return date >= sevenDaysAgo && date <= now;
  });

  const chartData = pastWeekEntries
    .map(({ createdAt, summary }) => {
      try {
        const summaryObj = JSON.parse(summary);
        const sentiment = Number(summaryObj.sentiment);
        if (isNaN(sentiment)) return null;

        const normalized = ((sentiment + 1) / 2) * 10;

        return {
          day: formatDate(createdAt),
          date: new Date(createdAt),
          sentiment: normalized,
          summary: summaryObj.summary || "",
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a!.date.getTime() - b!.date.getTime());

  const first = chartData[0]?.sentiment ?? 0;
  const last = chartData[chartData.length - 1]?.sentiment ?? 0;
  const improvement = (last - first).toFixed(2);

  const currentWeek = getISOWeek(new Date());
  const weeklyScore = chartData.reduce(
    (sum, entry) => sum + entry.sentiment,
    0,
  );

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Your Mood at a Glance</CardTitle>
        <CardDescription className="text-xl">
          Visual insights from this past week’s journal entries.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex h-full flex-col justify-end gap-4 overflow-hidden pt-0">
        <div className="h-[220px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart
              data={chartData}
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
                domain={[0, 10]}
                tickCount={6}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.toFixed(1)}
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
                connectNulls
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="">
          <div className="text-foreground text-md flex items-center gap-2 font-medium">
            <TrendingUp className="h-4 w-4 text-pink-500" />
            Trending up by {improvement} positivity points over the week
          </div>
          <div className="text-muted-foreground text-md">
            Week {currentWeek}: Total Positivity Score:{" "}
            <span className="text-foreground font-semibold">
              {weeklyScore.toFixed(1)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
