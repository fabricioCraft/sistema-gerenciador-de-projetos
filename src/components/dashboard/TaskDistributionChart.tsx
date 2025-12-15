"use client"

import * as React from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
    data: {
        status: string
        count: number
        fill: string
        label: string
    }[]
}

// Custom Tooltip com design SaaS Premium (Dark Mode)
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl min-w-[150px]">
                {/* Título da Categoria */}
                <p className="text-sm font-semibold text-slate-100 mb-2">{label}</p>

                {/* Valor com indicador de cor */}
                <div className="flex items-center gap-2">
                    <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: payload[0].payload.fill }}
                    />
                    <span className="text-xs text-slate-400">Quantidade:</span>
                    <span className="text-sm font-bold text-white">
                        {payload[0].value}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export function TaskDistributionChart({ data }: Props) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="items-center pb-2">
                <CardTitle className="text-sm font-medium">Distribuição de Status</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis
                                dataKey="label"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
