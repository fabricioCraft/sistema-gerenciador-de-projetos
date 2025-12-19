'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type Props = {
    data: {
        status: string
        count: number
        fill: string
        label: string
    }[]
}

// Custom Tooltip adaptado
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl min-w-[150px]">
                {/* Título da Categoria */}
                <p className="text-sm font-semibold text-slate-100 mb-2">{data.label}</p>

                {/* Valor com indicador de cor */}
                <div className="flex items-center gap-2">
                    <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: data.fill }}
                    />
                    <span className="text-xs text-slate-400">Quantidade:</span>
                    <span className="text-sm font-bold text-white">
                        {data.count}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export function TaskDistributionChart({ data }: Props) {
    // Calcular o total para o centro
    const total = data.reduce((acc, item) => acc + item.count, 0);

    return (
        <div className="flex flex-col h-full w-full bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-400 mb-4">Distribuição de Status</h3>

            <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            cornerRadius={5}
                            dataKey="count"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />

                        {/* Texto Centralizado */}
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                            <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold" fill="#fff">
                                {total}
                            </tspan>
                            <tspan x="50%" dy="1.5em" fontSize="12" fill="#64748b">
                                Tarefas
                            </tspan>
                        </text>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legenda Customizada (Footer) */}
            <div className="flex justify-center gap-6 mt-4">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-xs text-slate-400">{item.label}</span>
                        <span className="text-xs font-bold text-slate-200">{item.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
