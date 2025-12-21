'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simular delay de login
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
    };

    return (
        <AuthLayout
            heroTitle="Retome o controle."
            heroSubtitle="Seu cronograma está monitorado. Bem-vindo de volta ao comando."
        >
            <div className="flex flex-col space-y-6">

                {/* Header */}
                <div className="flex flex-col space-y-2 text-center mb-4">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Bem-vindo</h1>
                    <p className="text-sm text-zinc-400">
                        Acesse o cérebro do seu projeto.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider pl-1">Email</label>
                        <div className="relative">
                            <Input
                                type="email"
                                placeholder="nome@empresa.com"
                                className="bg-zinc-900/50 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-12 px-4 w-full"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider pl-1">Senha</label>
                        <div className="relative">
                            <Input
                                type="password"
                                className="bg-zinc-900/50 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-12 px-4 w-full"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 transition-all active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar na Plataforma"}
                    </Button>

                </form>

                {/* Divider */}
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-950 px-2 text-slate-500 font-medium">Ou continue com</span>
                    </div>
                </div>

                {/* Google Btn */}
                <Button
                    variant="outline"
                    type="button"
                    className="w-full h-12 rounded-xl border-slate-800 bg-transparent hover:bg-slate-900 text-slate-300 hover:text-white transition-all hover:border-slate-700"
                >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </Button>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500">
                    Não tem uma conta?{" "}
                    <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors hover:underline underline-offset-4">
                        Criar agora
                    </Link>
                </p>

            </div>
        </AuthLayout>
    );
}
