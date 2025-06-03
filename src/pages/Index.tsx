
import React, { useState } from 'react';
import Login from '@/components/Login';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import Lancamentos from '@/components/Lancamentos';
import ContasPagarReceber from '@/components/ContasPagarReceber';
import CadastroBanco from '@/components/CadastroBanco';
import CadastroCliente from '@/components/CadastroCliente';
import CadastroFornecedor from '@/components/CadastroFornecedor';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = (email: string, password: string) => {
    console.log('Login attempt:', { email, password });
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'lancamento':
        return <Lancamentos />;
      case 'contas':
        return <ContasPagarReceber />;
      case 'relatorio-contas':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Relatório de Contas</h2>
            <p className="text-gray-600">Relatório de contas será implementado aqui.</p>
          </div>
        );
      case 'extrato':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Extrato do Movimento</h2>
            <p className="text-gray-600">Extrato do movimento será implementado aqui.</p>
          </div>
        );
      case 'cadastro-banco':
        return <CadastroBanco />;
      case 'cadastro-cliente':
        return <CadastroCliente />;
      case 'cadastro-fornecedor':
        return <CadastroFornecedor />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderPageContent()}
    </Layout>
  );
};

export default Index;
