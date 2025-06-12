import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowDown, ArrowUp, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { eventBus } from '@/utils/eventBus';

interface Banco {
  id: string;
  nome: string;
  agencia: string;
  conta: string;
  saldo: number;
}

interface Conta {
  id: string;
  tipo: 'pagar' | 'receber';
  destino_tipo: 'cliente' | 'fornecedor';
  referencia: string;
  data_vencimento: string;
  valor: number;
  valor_baixa: number;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
}

const Dashboard = () => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [bancoSelecionado, setBancoSelecionado] = useState<string>('');
  const [saldoBanco, setSaldoBanco] = useState<number>(0);
  const [contasAtrasadasPagar, setContasAtrasadasPagar] = useState<Conta[]>([]);
  const [contasAtrasadasReceber, setContasAtrasadasReceber] = useState<Conta[]>([]);
  const [totalAtrasadoPagar, setTotalAtrasadoPagar] = useState<number>(0);
  const [totalAtrasadoReceber, setTotalAtrasadoReceber] = useState<number>(0);

  useEffect(() => {
    carregarBancos();
    carregarContasAtrasadas();
  }, []);

  // Event listener PRIORITÁRIO para atualizações INSTANTÂNEAS de saldo
  useEffect(() => {
    const handleBancoUpdate = (data: { bancoId: string; novoSaldo: number }) => {
      console.log('Dashboard: ATUALIZAÇÃO INSTANTÂNEA recebida:', data);
      
      // PRIORIDADE MÁXIMA: Atualizar array de bancos IMEDIATAMENTE
      setBancos(prevBancos => {
        const bancosAtualizados = prevBancos.map(banco => 
          banco.id === data.bancoId 
            ? { ...banco, saldo: data.novoSaldo } 
            : banco
        );
        console.log('Dashboard: Array de bancos atualizado INSTANTANEAMENTE:', bancosAtualizados);
        return bancosAtualizados;
      });
      
      // Se é o banco selecionado, atualizar saldo INSTANTANEAMENTE
      if (data.bancoId === bancoSelecionado) {
        console.log('Dashboard: SALDO ATUALIZADO INSTANTANEAMENTE para:', data.novoSaldo);
        setSaldoBanco(data.novoSaldo);
      }
    };

    // EVENT LISTENER ESPECÍFICO para desfazer baixa de fornecedor
    const handleDesfazerBaixaFornecedor = (data: { bancoId: string; novoSaldo: number; valor: number }) => {
      console.log('Dashboard: DESFAZER BAIXA FORNECEDOR - Atualização INSTANTÂNEA recebida:', data);
      
      // ATUALIZAÇÃO PRIORITÁRIA do saldo no array de bancos
      setBancos(prevBancos => {
        const bancosAtualizados = prevBancos.map(banco => 
          banco.id === data.bancoId 
            ? { ...banco, saldo: data.novoSaldo } 
            : banco
        );
        console.log('Dashboard: DESFAZER BAIXA - Array de bancos atualizado INSTANTANEAMENTE:', bancosAtualizados);
        return bancosAtualizados;
      });
      
      // Se é o banco selecionado, atualizar saldo INSTANTANEAMENTE
      if (data.bancoId === bancoSelecionado) {
        console.log('Dashboard: DESFAZER BAIXA - SALDO ATUALIZADO INSTANTANEAMENTE para:', data.novoSaldo);
        setSaldoBanco(data.novoSaldo);
      }
    };

    // EVENTOS PRIORITÁRIOS para sincronização INSTANTÂNEA
    eventBus.on('bancoSaldoAtualizado', handleBancoUpdate);
    eventBus.on('lancamentoRealizado', handleBancoUpdate); // Evento de lançamentos
    eventBus.on('baixaContaRealizada', handleBancoUpdate); // Evento de baixas
    eventBus.on('desfazerBaixaRealizada', handleDesfazerBaixaFornecedor); // Evento específico de desfazer baixas
    
    console.log('Dashboard: Event listeners PRIORITÁRIOS registrados para sincronização INSTANTÂNEA');

    return () => {
      eventBus.off('bancoSaldoAtualizado', handleBancoUpdate);
      eventBus.off('lancamentoRealizado', handleBancoUpdate);
      eventBus.off('baixaContaRealizada', handleBancoUpdate);
      eventBus.off('desfazerBaixaRealizada', handleDesfazerBaixaFornecedor);
      console.log('Dashboard: Event listeners removidos');
    };
  }, [bancoSelecionado]);

  // Sincronização secundária - apenas se não houver atualização por evento
  useEffect(() => {
    if (bancoSelecionado && bancos.length > 0) {
      const banco = bancos.find(b => b.id === bancoSelecionado);
      if (banco && banco.saldo !== saldoBanco) {
        setSaldoBanco(banco.saldo);
        console.log(`Dashboard: Sincronização secundária - saldo para ${banco.nome}: ${banco.saldo}`);
      }
    }
  }, [bancos, bancoSelecionado, saldoBanco]);

  const carregarBancos = async () => {
    console.log('Dashboard: Carregando bancos do banco de dados...');
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (!error && data) {
      console.log('Dashboard: Bancos carregados:', data);
      
      // Verificar se há atualizações estruturais, mas preservar saldos atualizados por eventos
      setBancos(prevBancos => {
        if (prevBancos.length === 0) {
          // Primeira carga - usar dados do BD
          if (data.length > 0 && !bancoSelecionado) {
            setBancoSelecionado(data[0].id);
          }
          return data;
        }
        
        // Carga subsequente - preservar saldos locais que foram atualizados por eventos
        const bancosAtualizados = data.map(bancoDB => {
          const bancoLocal = prevBancos.find(b => b.id === bancoDB.id);
          if (bancoLocal) {
            // Manter saldo local se existe (pode ter sido atualizado por evento)
            return { ...bancoDB, saldo: bancoLocal.saldo };
          }
          return bancoDB;
        });
        
        return bancosAtualizados;
      });
    } else if (error) {
      console.error('Dashboard: Erro ao carregar bancos:', error);
    }
  };

  const carregarContasAtrasadas = async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataHoje = hoje.toISOString().split('T')[0];

    const { data: contas, error } = await supabase
      .from('contas')
      .select(`
        *,
        clientes (nome),
        fornecedores (nome)
      `)
      .lt('data_vencimento', dataHoje)
      .lt('valor_baixa', 'valor')
      .order('data_vencimento');

    if (!error && contas) {
      // Mapear os dados para garantir os tipos corretos
      const contasTyped = contas.map(conta => ({
        ...conta,
        tipo: conta.tipo as 'pagar' | 'receber',
        destino_tipo: conta.destino_tipo as 'cliente' | 'fornecedor'
      }));

      // Filtrar contas de fornecedores (pagar) atrasadas
      const contasPagarAtrasadas = contasTyped.filter(conta => 
        conta.destino_tipo === 'fornecedor' && conta.tipo === 'pagar'
      );
      
      // Filtrar contas de clientes (receber) atrasadas
      const contasReceberAtrasadas = contasTyped.filter(conta => 
        conta.destino_tipo === 'cliente' && conta.tipo === 'receber'
      );
      
      setContasAtrasadasPagar(contasPagarAtrasadas.slice(0, 3));
      setContasAtrasadasReceber(contasReceberAtrasadas.slice(0, 3));
      
      const totalPagar = contasPagarAtrasadas.reduce((sum, conta) => sum + (conta.valor - (conta.valor_baixa || 0)), 0);
      const totalReceber = contasReceberAtrasadas.reduce((sum, conta) => sum + (conta.valor - (conta.valor_baixa || 0)), 0);
      
      setTotalAtrasadoPagar(totalPagar);
      setTotalAtrasadoReceber(totalReceber);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getDiasParaVencimento = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays === 1) return 'Vence amanhã';
    if (diffDays > 0) return `Vence em ${diffDays} dias`;
    return `Venceu há ${Math.abs(diffDays)} dias`;
  };

  const bancoAtual = bancos.find(b => b.id === bancoSelecionado);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral das suas finanças</p>
      </div>

      {/* Seletor de Banco */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm">
            <Label htmlFor="banco-selector">Selecionar Banco</Label>
            <Select value={bancoSelecionado} onValueChange={setBancoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um banco" />
              </SelectTrigger>
              <SelectContent>
                {bancos.map((banco) => (
                  <SelectItem key={banco.id} value={banco.id}>
                    {banco.nome} - Ag: {banco.agencia} Conta: {banco.conta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Saldo da Conta - MODELO APRIMORADO COM SINCRONIZAÇÃO INSTANTÂNEA */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-shadow relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Sincronização em tempo real ativa"></div>
              <span className="text-xs text-green-600 font-medium">SYNC</span>
            </div>
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Saldo da Conta
            </CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 transition-all duration-300 mb-2">
              {formatCurrency(saldoBanco)}
            </div>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              {bancoAtual ? `${bancoAtual.nome}` : 'Selecione um banco'}
            </p>
            <p className="text-xs text-blue-500 opacity-75">
              {bancoAtual ? `Ag: ${bancoAtual.agencia} | Conta: ${bancoAtual.conta}` : ''}
            </p>
            <div className="mt-2 flex items-center space-x-1">
              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">Atualização Instantânea</span>
            </div>
          </CardContent>
        </Card>

        {/* Contas a Pagar Atrasadas */}
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Contas a Pagar Atrasadas
            </CardTitle>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(totalAtrasadoPagar)}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {contasAtrasadasPagar.length} contas atrasadas
            </p>
          </CardContent>
        </Card>

        {/* Contas a Receber Atrasadas */}
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Contas a Receber Atrasadas
            </CardTitle>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(totalAtrasadoReceber)}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {contasAtrasadasReceber.length} recebimentos atrasados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ArrowDown className="w-5 h-5 text-red-500" />
              Contas a Pagar Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contasAtrasadasPagar.length > 0 ? (
                <>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <span className="font-semibold text-red-700">Total Atrasado:</span>
                    <span className="text-red-700 font-bold text-lg">
                      {formatCurrency(totalAtrasadoPagar)}
                    </span>
                  </div>
                  {contasAtrasadasPagar.map((conta) => (
                    <div key={conta.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{conta.referencia}</p>
                        <p className="text-sm text-gray-600">
                          {conta.destino_tipo === 'fornecedor' ? conta.fornecedores?.nome : 'Despesa'}
                        </p>
                        <p className="text-xs text-red-500 font-medium">{getDiasParaVencimento(conta.data_vencimento)}</p>
                      </div>
                      <span className="text-red-600 font-semibold">
                        {formatCurrency(conta.valor - (conta.valor_baixa || 0))}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma conta a pagar atrasada</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-orange-500" />
              Contas a Receber Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contasAtrasadasReceber.length > 0 ? (
                <>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <span className="font-semibold text-orange-700">Total Atrasado:</span>
                    <span className="text-orange-700 font-bold text-lg">
                      {formatCurrency(totalAtrasadoReceber)}
                    </span>
                  </div>
                  {contasAtrasadasReceber.map((conta) => (
                    <div key={conta.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{conta.referencia}</p>
                        <p className="text-sm text-gray-600">
                          {conta.destino_tipo === 'cliente' ? conta.clientes?.nome : 'Receita'}
                        </p>
                        <p className="text-xs text-orange-500 font-medium">{getDiasParaVencimento(conta.data_vencimento)}</p>
                      </div>
                      <span className="text-orange-600 font-semibold">
                        {formatCurrency(conta.valor - (conta.valor_baixa || 0))}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma conta a receber atrasada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
