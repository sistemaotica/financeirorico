
import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const Layout = ({ children, currentPage, onNavigate, onLogout }: LayoutProps) => {
  const getPageTitle = (page: string) => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'lancamento': 'Lançamento',
      'contas': 'Contas a Pagar/Receber',
      'tarefas': 'Tarefas',
      'relatorio-contas': 'Relatório de Contas',
      'extrato': 'Extrato do Movimento',
      'cadastro-banco': 'Cadastrar Banco',
      'cadastro-cliente': 'Cadastrar Cliente',
      'cadastro-fornecedor': 'Cadastrar Fornecedor'
    };
    return titles[page] || 'Sistema Financeiro';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar 
          currentPage={currentPage} 
          onNavigate={onNavigate} 
          onLogout={onLogout} 
        />
        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-gray-200 p-3 md:p-4 flex items-center gap-2 md:gap-4 sticky top-0 z-10">
            <SidebarTrigger className="text-gray-600 hover:text-gray-900 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                {getPageTitle(currentPage)}
              </h1>
            </div>
          </header>
          <div className="flex-1 p-3 md:p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
