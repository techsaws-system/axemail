export interface DoughnutChart01Props {
    backgroundColor: [string, string];
    label: string;
    labelColor: string;
    sentCount: number;
    dailyLimit: number;
}

export interface DoughnutChart02Props {
    chartData: { label: string; percentage: number; color: string }[];
}