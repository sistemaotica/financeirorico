
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
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar 
          currentPage={currentPage} 
          onNavigate={onNavigate} 
          onLogout={onLogout} 
        />
        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 p-4 flex items-center gap-4">
            <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {currentPage === 'dashboard' ? 'Dashboard' : 
                 currentPage === 'lancamento' ? 'Lançamento' :
                 currentPage === 'contas' ? 'Contas a Pagar/Receber' :
                 currentPage === 'relatorio-contas' ? 'Relatório de Contas' :
                 currentPage === 'extrato' ? 'Extrato do Movimento' :
                 currentPage === 'cadastro-banco' ? 'Cadastrar Banco' :
                 currentPage === 'cadastro-cliente' ? 'Cadastrar Cliente' :
                 currentPage === 'cadastro-fornecedor' ? 'Cadastrar Fornecedor' :
                 'Sistema Financeiro'}
              </h1>
            </div>
          </header>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
