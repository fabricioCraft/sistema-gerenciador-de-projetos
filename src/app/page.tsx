import { CreateProjectDialog } from '@/components/home/CreateProjectDialog';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex flex-col gap-8 text-center">

        <h1 className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 pb-2">
          AI PMP System
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          O gerente de projetos autônomo que transforma suas ideias em planos prontos para execução.
          Estimativa PERT, Análise de Caminho Crítico e geração automática de EAP.
        </p>

        <div className="mt-8">
          <CreateProjectDialog />
        </div>

        <div className="absolute bottom-10 text-gray-400 text-xs">
          Desenvolvido com Next.js 15, Vercel AI SDK e Shadcn UI.
        </div>
      </div>
    </main>
  );
}
