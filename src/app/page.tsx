import Link from "next/link";
import { KiraAvatar } from "@/components/ui/kira-avatar";
import { KiraLogo } from "@/components/ui/kira-logo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cookies } from "next/headers";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("auth-token");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500/30">

      {/* Navbar */}
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Link href="/">
            <KiraLogo className="h-8 w-auto text-white" showIcon={true} />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button>Ir para o Dashboard</Button>
            </Link>
          ) : (
            <>
              {/* Botão Entrar -> Login */}
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                  Entrar
                </Button>
              </Link>

              {/* Botão Cadastrar -> Signup (Estilo Premium) */}
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full px-6 shadow-lg shadow-indigo-500/20 border border-white/10 transition-all hover:scale-105">
                  Cadastrar
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">

        {/* Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-1000">

          {/* Pulsing Orb */}
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
            <KiraAvatar size="2xl" state="idle" className="relative z-10 shadow-2xl shadow-indigo-500/20" />
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-500 leading-tight">
              Não gerencie.<br /> Orquestre.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              A primeira IA projetada para liderar projetos complexos, prever riscos e eliminar o microgerenciamento.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-indigo-500/20 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0 transition-all hover:scale-105">
                  Acessar Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-indigo-500/20 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 border-0 transition-all hover:scale-105">
                  Conhecer a Kira
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-600">
        <p>© 2024 Kira AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
