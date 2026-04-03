"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoughnutChart01 } from "@/components/charts/doughnut-charts";

import { apiRequest } from "@/utils/api-request";
import { Spinner } from "@/components/ui/spinner";

interface TodayStats {
  sentToday: number;
  dailyLimit: number;
}

function EmailSentCard() {
  const [data, setData] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await apiRequest("/analytics/today");
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="standard-card-styling col-span-1">
      <CardHeader className="py-4 border-b border-border">
        <CardTitle className="font-semibold text-heading text-[16px]">
          Email Sent Today
        </CardTitle>
      </CardHeader>

      <CardContent className="md:h-[500px] h-full flex items-center justify-center">
        {loading ? (
          <Spinner className="w-[30px] h-[30px] text-primary" />
        ) : (
          <DoughnutChart01
            backgroundColor={["#2563EB", "#E5E7EB"]}
            label="Email Sent"
            labelColor="text-[#2563EB]"
            sentCount={data?.sentToday || 0}
            dailyLimit={data?.dailyLimit || 3000}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default EmailSentCard;
