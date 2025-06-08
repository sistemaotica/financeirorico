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
    
    // Escutar eventos de atualização de banco
    const handleBancoUpdate = (data: { bancoId: string; novoSaldo: number }) => {
      console.log('Dashboard: Recebido evento de atualização de banco:', data);
      setBancos(prev => {
        const bancosAtualizados = prev.map(banco => 
          banco.id === data.bancoId 
            ? { ...banco, saldo: data.novoSaldo } 
            : banco
        );
        console.log('Dashboard: Bancos atualizados:', bancosAtualizados);
        return bancosAtualizados;
      });
      
      // Forçar atualização do saldo se for o banco selecionado
      if (data.bancoId === bancoSelecionado) {
        console.log('Dashboard: Atualizando saldo do banco selecionado:', data.novoSaldo);
        setSaldoBanco(data.novoSaldo);
      }
    };

    eventBus.on('bancoSaldoAtualizado', handleBancoUpdate);

    // Configurar atualização automática dos bancos a cada 10 segundos como backup
    const interval = setInterval(() => {
      carregarBancos();
    }, 10000);

    return () => {
      eventBus.off('bancoSaldoAtualizado', handleBancoUpdate);
      clearInterval(interval);
    };
  }, [bancoSelecionado]);

  useEffect(() => {
    if (bancoSelecionado) {
      const banco = bancos.find(b => b.id === bancoSelecionado);
      setSaldoBanco(banco?.saldo || 0);
      console.log(`Dashboard: Saldo atualizado para banco ${banco?.nome}: ${banco?.saldo}`);
    }
  }, [bancoSelecionado, bancos]);

  const carregarBancos = async () => {
    console.log('Dashboard: Carregando bancos...');
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (!error && data) {
      console.log('Dashboard: Bancos carregados:', data);
      setBancos(data);
      if (data.length > 0 && !bancoSelecionado) {
        setBancoSelecionado(data[0].id);
      }
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
        {/* Saldo da Conta */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Saldo da Conta
            </CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(saldoBanco)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {bancoAtual ? `${bancoAtual.nome} - ${bancoAtual.agencia}/${bancoAtual.conta}` : 'Selecione um banco'}
            </p>
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
