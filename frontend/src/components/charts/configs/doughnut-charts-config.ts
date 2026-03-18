import { ChartOptions, TooltipItem } from "chart.js";

export const DoughnutChart01Cofigs =
    (): ChartOptions<"doughnut"> => {
        return {
            cutout: "85%",
            plugins: {
                tooltip: {
                    enabled: false,
                },
                legend: {
                    display: false,
                },
                datalabels: {
                    display: false,
                },
            },
        };
    };

export const DoughnutChart02Cofigs =
    (): ChartOptions<"doughnut"> => {
        return {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom" as const,
                    labels: {
                        color: "#000000",
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 25,
                        font: {
                            family: "Poppins",
                            size: 12,
                            weight: "normal",
                        },
                    },
                },

                tooltip: {
                    enabled: true,
                    backgroundColor: "#000000",
                    borderColor: "transparent",
                    borderWidth: 0,
                    cornerRadius: 8,
                    padding: 10,
                    displayColors: false,
                    titleColor: "#ffffff",
                    titleFont: {
                        size: 14,
                    },
                    bodyFont: {
                        family: "Poppins",
                        size: 12,
                    },
                    bodyColor: "#ffffff",
                    caretSize: 5,
                    caretPadding: 10,
                    callbacks: {
                        label: function (tooltipItem: TooltipItem<"doughnut">) {
                            const label = tooltipItem.label;
                            const value = tooltipItem.raw || 0;
                            return `${label}: ${value}%`;
                        },
                    },
                    animation: {
                        duration: 1000,
                        easing: "easeOutCubic",
                    },
                },

                datalabels: {
                    display: true,
                    color: "#fff",
                    formatter: (value: number) => `${value}%`,
                    font: {
                        family: "JetBrains Mono, sans-serif",
                        size: 12,
                        weight: "normal",
                    },
                },
            },
            cutout: "30%",
            elements: {
                arc: {
                    borderWidth: 5,
                    borderColor: "#ffffff",
                    hoverBackgroundColor: (ctx) => {
                        const raw = ctx.raw as { backgroundColor: string };
                        return raw.backgroundColor;
                    },
                    hoverBorderColor: (ctx) => {
                        const raw = ctx.raw as { borderColor: string };
                        return raw.borderColor;
                    },
                },
            },
        };
    };