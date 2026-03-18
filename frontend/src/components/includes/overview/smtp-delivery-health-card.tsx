"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoughnutChart02 } from "@/components/charts/doughnut-charts";

import { apiRequest } from "@/utils/api-request";
import { Spinner } from "@/components/ui/spinner";

interface TransportStats {
  accepted: number;
  rejected: number;
  deferred: number;
}

const SMTPDeliveryHealthCard = () => {
  const [data, setData] = useState<TransportStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await apiRequest("/analytics/transport");
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
    <Card className="standard-card-styling">
      <CardHeader className="md:py-4 py-6 border-b border-border">
        <CardTitle className="font-medium text-heading text-[16px] leading-[18px]">
          Transport Health — SMTP Delivery Status
        </CardTitle>
      </CardHeader>

      <CardContent className="py-4 mx-auto lg:h-[500px] lg:flex-center max-lg:py-12 px-0">
        {loading ? (
          <Spinner className="w-[30px] h-[30px] text-primary" />
        ) : (
          <DoughnutChart02
            chartData={[
              {
                label: "Accepted",
                percentage: data?.accepted || 0,
                color: "#16A34A",
              },
              {
                label: "Rejected",
                percentage: data?.rejected || 0,
                color: "#B91C1C",
              },
              {
                label: "Deferred",
                percentage: data?.deferred || 0,
                color: "#D97706",
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SMTPDeliveryHealthCard;
