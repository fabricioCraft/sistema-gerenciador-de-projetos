"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateDashboardInsight } from "@/actions/ai-actions"

type Props = {
    stats: {
        total: number
        todo: number
        doing: number
        done: number
        overdue: number
        critical_urgent: number
        critical_safe: number
    }
}

export function AIInsightCard({ stats }: Props) {
    const [insight, setInsight] = React.useState<string>("")
    const [loading, setLoading] = React.useState(true)
    const [displayedText, setDisplayedText] = React.useState("")

    React.useEffect(() => {
        let mounted = true

        const fetchInsight = async () => {
            try {
                const result = await generateDashboardInsight(stats)
                if (mounted) {
                    if (result.success) {
                        setInsight(result.insight || "Sem análise disponível.");
                    } else {
                        setInsight("Não foi possível conectar à IA.");
                    }
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setInsight("Erro ao carregar insight.");
                    setLoading(false);
                }
            }
        }

        fetchInsight()
        return () => { mounted = false }
    }, [stats])

    // Typewriter effect
    React.useEffect(() => {
        if (loading || !insight) return

        let currentIndex = 0
        const interval = setInterval(() => {
            if (currentIndex <= insight.length) {
                setDisplayedText(insight.slice(0, currentIndex))
                currentIndex++
            } else {
                clearInterval(interval)
            }
        }, 30) // Speed of typing

        return () => clearInterval(interval)
    }, [insight, loading])

    return (
        <Card className="h-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800 shadow-sm relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    AI Executive Summary
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-3 w-3/4 bg-indigo-200/50 dark:bg-indigo-800/50 rounded" />
                        <div className="h-3 w-full bg-indigo-200/50 dark:bg-indigo-800/50 rounded" />
                    </div>
                ) : (
                    <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed font-medium">
                        {displayedText}
                        <span className="animate-pulse inline-block w-1.5 h-3.5 bg-indigo-500 ml-1 align-middle" />
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
