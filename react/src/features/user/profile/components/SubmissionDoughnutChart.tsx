import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { SubmissionStatusStat } from '../services/profileService';

interface Props {
    stats: SubmissionStatusStat[];
}

const SubmissionDoughnutChart: React.FC<Props> = ({ stats }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        // Group status counts
        const acCount = stats?.find(s => s.status === 'AC')?.count || 0;
        const _waReCount = (stats?.find(s => s.status === 'WA')?.count || 0) + (stats?.find(s => s.status === 'RE')?.count || 0);
        const tleCount = stats?.find(s => s.status === 'TLE')?.count || 0;
        const total = stats?.reduce((acc, curr) => acc + curr.count, 0) || 0;

        // Chart mapping
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (ctx) {
            chartInstance.current = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['AC', 'WA/RE', 'TLE'],
                    datasets: [{
                        data: [acCount, _waReCount, tleCount],
                        backgroundColor: ['#22c55e', '#ef4444', '#eab308'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '80%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (item) => `${item.label}: ${item.raw}`
                            }
                        }
                    }
                }
            });
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [stats]);

    const acCount = stats?.find(s => s.status === 'AC')?.count || 0;
    const waReCount = (stats?.find(s => s.status === 'WA')?.count || 0) + (stats?.find(s => s.status === 'RE')?.count || 0);
    const tleCount = stats?.find(s => s.status === 'TLE')?.count || 0;
    const total = stats?.reduce((acc, curr) => acc + curr.count, 0) || 0;

    return (
        <div className="glass p-6 rounded-2xl flex flex-col h-full min-h-[220px]">
            <h3 className="font-bold text-lg mb-4">Tình trạng Submissions</h3>
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-between">
                <div className="relative w-32 h-32 ml-4">
                    <canvas ref={chartRef}></canvas>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-xl font-bold text-white">{total}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">Tổng</span>
                    </div>
                </div>
                <div className="space-y-3 pr-4 mt-4 sm:mt-0 w-full sm:w-auto">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full bg-green-500 min-w-[12px]"></span>
                        <span className="text-slate-300 w-12 pt-1 font-mono">AC</span>
                        <span className="text-white font-semibold pt-1">{acCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full bg-red-500 min-w-[12px]"></span>
                        <span className="text-slate-300 w-12 pt-1 font-mono">WA/RE</span>
                        <span className="text-white font-semibold pt-1">{waReCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full bg-yellow-500 min-w-[12px]"></span>
                        <span className="text-slate-300 w-12 pt-1 font-mono">TLE</span>
                        <span className="text-white font-semibold pt-1">{tleCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionDoughnutChart;
