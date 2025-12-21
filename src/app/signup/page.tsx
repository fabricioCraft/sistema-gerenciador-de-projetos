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
        <AuthLayout>
            <div className="space-y-8">
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
