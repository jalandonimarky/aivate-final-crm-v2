import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueChartProps {
  paidDeals: number;
  doneCompletedDeals: number; // Still passed, but not used in chart data
  cancelledDeals: number; // Still passed, but not used in chart data
  pipelineValue: number;
}

export function RevenueChart({ paidDeals, cancelledDeals, pipelineValue }: RevenueChartProps) { // Re-added cancelledDeals to destructuring
  const data = [
    { name: "Paid Deals", value: paidDeals, color: "hsl(var(--success))" }, // Green
    { name: "Cancelled Deals", value: cancelledDeals, color: "hsl(var(--destructive))" }, // Red for cancelled
    { name: "Pipeline", value: pipelineValue, color: "hsl(var(--accent))" }, // Blue
  ];

  const total = paidDeals + cancelledDeals + pipelineValue; // Updated total calculation to include cancelled

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-medium">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            ${data.value.toLocaleString()} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-accent">
          Revenue Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "14px",
                }}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4"> {/* Changed to grid-cols-3 to accommodate three items */}
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <div 
                className="w-4 h-4 rounded-full mx-auto mb-2"
                style={{ backgroundColor: item.color }}
              />
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                ${item.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}