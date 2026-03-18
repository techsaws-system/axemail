"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  Chart as ChartJS,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

import {
  DoughnutChart01Props,
  DoughnutChart02Props,
} from "./types/doughnut-charts-type";
import {
  DoughnutChart01Cofigs,
  DoughnutChart02Cofigs,
} from "./configs/doughnut-charts-config";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  ChartDataLabels,
);

export const DoughnutChart01 = ({
  backgroundColor,
  label,
  labelColor,
  sentCount,
  dailyLimit,
}: DoughnutChart01Props) => {
  const remaining = Math.max(dailyLimit - sentCount, 0);

  const chartData = useMemo(
    () => ({
      labels: ["Sent", "Remaining"],
      datasets: [
        {
          data: [sentCount, remaining],
          backgroundColor: backgroundColor,
          borderWidth: 0,
        },
      ],
    }),
    [sentCount, remaining, backgroundColor],
  );

  const options = DoughnutChart01Cofigs();

  return (
    <div className="relative mx-auto aspect-square">
      <Doughnut data={chartData} options={options} />

      <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center text-center">
        <span
          className={`${labelColor} lg:text-[16px] text-[14px] font-bold font-inter`}
        >
          {label}
        </span>

        <span className="text-[40px] font-bold text-heading-color">
          {sentCount.toLocaleString()}
        </span>

        <span className="text-sm text-muted-foreground">
          / {dailyLimit.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export const DoughnutChart02 = ({ chartData }: DoughnutChart02Props) => {
  const data = {
    labels: chartData.map((data) => data.label),
    datasets: [
      {
        data: chartData.map((data) => data.percentage),
        backgroundColor: chartData.map((data) => data.color),
      },
    ],
  };

  const options = DoughnutChart02Cofigs();

  return (
    <div className="relative mx-auto aspect-square lg:w-[350px] w-[300px]">
      <Doughnut data={data} options={options} />
    </div>
  );
};
