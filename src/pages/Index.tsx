
import React, { useState } from 'react';
import Login from '@/components/Login';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import Lancamentos from '@/components/Lancamentos';
import ContasPagarReceber from '@/components/ContasPagarReceber';
import CadastroBanco from '@/components/CadastroBanco';
import CadastroCliente from '@/components/CadastroCliente';
import CadastroFornecedor from '@/components/CadastroFornecedor';
import RelatorioContas from '@/components/RelatorioContas';
import ExtratoMovimento from '@/components/ExtratoMovimento';
import TasksPanel from '@/components/tasks/TasksPanel';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = (email: string, password: string) => {
    console.log('Login attempt:', { email, password });
    
    // Credenciais válidas
    const VALID_CREDENTIALS = {
      email: 'admin@finwise.com',
      password: 'admin123'
    };

    // Verificar se as credenciais são válidas
    if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true);
      console.log('Login successful');
    } else {
      console.log('Login failed - invalid credentials');
      // A validação já é feita no componente Login, aqui só confirmamos
      setIsAuthenticated(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
    console.log('User logged out');
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
      case 'tarefas':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Tarefas</h2>
            <p className="text-gray-600">Use o menu de tarefas no Dashboard para gerenciar suas tarefas.</p>
          </div>
        );
      case 'relatorio-contas':
        return <RelatorioContas />;
      case 'extrato':
        return <ExtratoMovimento />;
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

  // Se não estiver autenticado, mostrar apenas a tela de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Se estiver autenticado, mostrar o sistema
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
