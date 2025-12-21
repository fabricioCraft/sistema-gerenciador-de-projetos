'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/components/auth/AuthLayout';

// Reuse Glass Input Wrapper
const GlassInputWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`group relative rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm transition-all focus-within:border-indigo-500/50 focus-within:bg-slate-900/80 focus-within:shadow-[0_0_20px_-5px_rgba(99,102,241,0.15)] hover:border-slate-700 ${className}`}>
        {children}
    </div>
);

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simular delay de cadastro
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
    };

    return (
        <AuthLayout
            heroTitle="Dê um cérebro ao seu projeto."
            heroSubtitle="Pare de apenas listar tarefas. Comece a orquestrar resultados com inteligência preditiva."
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="space-y-2 text-center sm:text-left">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Comece com a Kira</h2>
                    <p className="text-zinc-400">Crie sua conta para orquestração inteligente de projetos.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    <div className="space-y-4">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider pl-1">Nome Completo</label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Seu nome"
                                    className="bg-zinc-900/50 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-12 px-4 w-full"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider pl-1">Email</label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="bg-zinc-900/50 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-12 px-4 w-full"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider pl-1">Senha</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Crie uma senha forte"
                                    className="bg-zinc-900/50 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-12 px-4 w-full"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-indigo-400 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-900/20 hover:shadow-indigo-900/40 transition-all active:scale-[0.98] mt-4"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <span className="flex items-center justify-center gap-2 font-medium">
                                Criar conta gratuita <ArrowRight className="w-4 h-4" />
                            </span>
                        )}
                    </Button>

                    <p className="text-xs text-center text-zinc-500 leading-relaxed px-4">
                        Ao clicar em criar conta, você aceita nossos <Link href="#" className="underline hover:text-indigo-400">Termos</Link> e <Link href="#" className="underline hover:text-indigo-400">Privacidade</Link>.
                    </p>

                </form>

                {/* Separador */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#020203] px-2 text-zinc-500">Ou continue com</span>
                    </div>
                </div>

                {/* Botão Google */}
                <Button
                    variant="outline"
                    type="button"
                    // onClick={handleGoogleSignUp} // Conectar lógica futura aqui
                    className="w-full h-12 rounded-xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 font-medium transition-all hover:text-white"
                >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </Button>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 border-t border-slate-800 pt-6">
                    Já tem uma conta?{" "}
                    <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors hover:underline">
                        Fazer login
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
