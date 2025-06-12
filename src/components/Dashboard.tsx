
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowDown, 
  ArrowUp, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  AlertTriangle,
  Activity,
  Eye,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Banco {
  id: string;
  nome: string;
  agencia: string;
  conta: string;
  saldo: number;
  tipo_banco: string;
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
  // NOVOS ESTADOS - Itens 2 e 3
  const [totalContasPagar, setTotalContasPagar] = useState<number>(0);
  const [totalContasReceber, setTotalContasReceber] = useState<number>(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  
  // Usar ref para controlar se já há uma subscription ativa
  const channelRef = useRef<any>(null);

  useEffect(() => {
    carregarDados();
    setupRealtimeSubscription();
    
    // Cleanup function para remover subscription
    return () => {
      if (channelRef.current) {
        console.log('Dashboard: Removendo subscription existente');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Realtime subscription para sincronização instantânea
  const setupRealtimeSubscription = () => {
    // Se já existe um canal, remove primeiro
    if (channelRef.current) {
      console.log('Dashboard: Removendo canal existente antes de criar novo');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    console.log('Dashboard: Configurando nova Realtime subscription...');
    
    const channel = supabase
      .channel('dashboard-realtime-unique')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bancos'
        },
        (payload) => {
          console.log('Dashboard Realtime: Mudança em bancos detectada:', payload);
          handleBancoRealtimeUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'baixas_contas'
        },
        (payload) => {
          console.log('Dashboard Realtime: Mudança em baixas_contas detectada:', payload);
          // Recarregar dados quando há mudanças em baixas
          carregarDados();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lancamentos'
        },
        (payload) => {
          console.log('Dashboard Realtime: Mudança em lançamentos detectada:', payload);
          // Recarregar dados quando há mudanças em lançamentos
          carregarDados();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas'
        },
        (payload) => {
          console.log('Dashboard Realtime: Mudança em contas detectada:', payload);
          // Recarregar dados quando há mudanças em contas
          carregarDados();
        }
      )
      .subscribe((status) => {
        console.log('Dashboard Realtime status:', status);
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    // Armazenar referência do canal
    channelRef.current = channel;
  };

  const handleBancoRealtimeUpdate = (payload: any) => {
    console.log('Dashboard: Processando atualização realtime de banco:', payload);
    
    if (payload.eventType === 'UPDATE' && payload.new) {
      const bancoAtualizado = payload.new;
      
      // Atualizar array de bancos IMEDIATAMENTE
      setBancos(prevBancos => {
        const bancosAtualizados = prevBancos.map(banco => 
          banco.id === bancoAtualizado.id 
            ? { ...banco, saldo: bancoAtualizado.saldo } 
            : banco
        );
        console.log('Dashboard Realtime: Array de bancos atualizado:', bancosAtualizados);
        return bancosAtualizados;
      });
      
      // Se é o banco selecionado, atualizar saldo IMEDIATAMENTE
      if (bancoAtualizado.id === bancoSelecionado) {
        console.log('Dashboard Realtime: SALDO ATUALIZADO INSTANTANEAMENTE para:', bancoAtualizado.saldo);
        setSaldoBanco(bancoAtualizado.saldo);
      }
    }
  };

  const carregarDados = async () => {
    await Promise.all([
      carregarBancos(),
      carregarContasAtrasadas(),
      carregarTotaisContas() // NOVA FUNÇÃO - Itens 2 e 3
    ]);
  };

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
      
      // Se não há banco selecionado e há bancos disponíveis, selecionar o primeiro
      if (!bancoSelecionado && data.length > 0) {
        setBancoSelecionado(data[0].id);
        setSaldoBanco(data[0].saldo);
      }
    } else if (error) {
      console.error('Dashboard: Erro ao carregar bancos:', error);
    }
  };

  // NOVA FUNÇÃO - Itens 2 e 3
  const carregarTotaisContas = async () => {
    console.log('Dashboard: Carregando totais de contas...');
    
    // Total contas a pagar (fornecedores) - todas as contas em aberto
    const { data: contasPagar, error: errorPagar } = await supabase
      .from('contas')
      .select('valor, valor_baixa')
      .eq('destino_tipo', 'fornecedor')
      .lt('valor_baixa', 'valor'); // Apenas contas não totalmente pagas

    if (!errorPagar && contasPagar) {
      const totalPagar = contasPagar.reduce((sum, conta) => 
        sum + (conta.valor - (conta.valor_baixa || 0)), 0
      );
      setTotalContasPagar(totalPagar);
      console.log('Dashboard: Total contas a pagar:', totalPagar);
    }

    // Total contas a receber (clientes) - todas as contas em aberto
    const { data: contasReceber, error: errorReceber } = await supabase
      .from('contas')
      .select('valor, valor_baixa')
      .eq('destino_tipo', 'cliente')
      .lt('valor_baixa', 'valor'); // Apenas contas não totalmente pagas

    if (!errorReceber && contasReceber) {
      const totalReceber = contasReceber.reduce((sum, conta) => 
        sum + (conta.valor - (conta.valor_baixa || 0)), 0
      );
      setTotalContasReceber(totalReceber);
      console.log('Dashboard: Total contas a receber:', totalReceber);
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
      const contasTyped = contas.map(conta => ({
        ...conta,
        tipo: conta.tipo as 'pagar' | 'receber',
        destino_tipo: conta.destino_tipo as 'cliente' | 'fornecedor'
      }));

      const contasPagarAtrasadas = contasTyped.filter(conta => 
        conta.destino_tipo === 'fornecedor' && conta.tipo === 'pagar'
      );
      
      const contasReceberAtrasadas = contasTyped.filter(conta => 
        conta.destino_tipo === 'cliente' && conta.tipo === 'receber'
      );
      
      // ALTERADO - Itens 4 e 5: Não limitar a 5, mostrar todas com scroll
      setContasAtrasadasPagar(contasPagarAtrasadas);
      setContasAtrasadasReceber(contasReceberAtrasadas);
      
      const totalPagar = contasPagarAtrasadas.reduce((sum, conta) => sum + (conta.valor - (conta.valor_baixa || 0)), 0);
      const totalReceber = contasReceberAtrasadas.reduce((sum, conta) => sum + (conta.valor - (conta.valor_baixa || 0)), 0);
      
      setTotalAtrasadoPagar(totalPagar);
      setTotalAtrasadoReceber(totalReceber);
    }
  };

  // Atualizar saldo quando banco selecionado muda
  useEffect(() => {
    if (bancoSelecionado && bancos.length > 0) {
      const banco = bancos.find(b => b.id === bancoSelecionado);
      if (banco) {
        setSaldoBanco(banco.saldo);
        console.log(`Dashboard: Saldo atualizado para banco ${banco.nome}: ${banco.saldo}`);
      }
    }
  }, [bancoSelecionado, bancos]);

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

  const getStatusColor = (dias: number) => {
    if (dias === 0) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (dias > 0) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (dias >= -7) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const bancoAtual = bancos.find(b => b.id === bancoSelecionado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dashboard Financeiro
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Controle completo das suas finanças com sincronização em tempo real
          </p>
          
          {/* Status de Conexão Realtime */}
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isRealtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${isRealtimeConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isRealtimeConnected ? 'Conectado em tempo real' : 'Desconectado'}
            </span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Seletor de Banco */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="max-w-md mx-auto">
              <Label htmlFor="banco-selector" className="text-lg font-semibold text-slate-700 mb-3 block">
                Selecionar Banco
              </Label>
              <Select value={bancoSelecionado} onValueChange={setBancoSelecionado}>
                <SelectTrigger className="h-12 text-lg border-2 border-slate-200 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Selecione um banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id} className="text-lg py-3">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 h-4 text-blue-500" />
                        <span>{banco.nome}</span>
                        <Badge variant="outline" className="ml-2">
                          {banco.tipo_banco}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cards Principais - ATUALIZADOS com Itens 2 e 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Saldo da Conta - COM REALTIME */}
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-blue-100">
                  Saldo da Conta
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-300 font-medium">LIVE</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-3">
              <div className="text-3xl font-bold text-white transition-all duration-500 ease-out">
                {formatCurrency(saldoBanco)}
              </div>
              
              {bancoAtual && (
                <div className="space-y-1">
                  <p className="text-blue-100 font-medium">
                    {bancoAtual.nome}
                  </p>
                  <div className="flex items-center space-x-3 text-blue-200 text-xs">
                    <span>Ag: {bancoAtual.agencia}</span>
                    <span>•</span>
                    <span>Conta: {bancoAtual.conta}</span>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 mt-1 text-xs">
                    {bancoAtual.tipo_banco}
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center space-x-2 pt-1">
                <Activity className="w-3 h-3 text-green-400" />
                <span className="text-green-300 text-xs font-medium">
                  Sincronização Automática
                </span>
              </div>
            </CardContent>
          </Card>

          {/* NOVO - Total Contas a Pagar (Item 2) */}
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-red-500 via-red-600 to-pink-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-red-100">
                  Total a Pagar
                </CardTitle>
                <TrendingDown className="w-6 h-6 text-red-200" />
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-3">
              <div className="text-3xl font-bold text-white">
                {formatCurrency(totalContasPagar)}
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-red-200" />
                <span className="text-red-100">
                  Todas as contas em aberto
                </span>
              </div>
            </CardContent>
          </Card>

          {/* NOVO - Total Contas a Receber (Item 3) */}
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-green-100">
                  Total a Receber
                </CardTitle>
                <TrendingUp className="w-6 h-6 text-green-200" />
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-3">
              <div className="text-3xl font-bold text-white">
                {formatCurrency(totalContasReceber)}
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-200" />
                <span className="text-green-100">
                  Todas as contas em aberto
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Resumo das Contas Atrasadas */}
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-orange-100">
                  Contas Atrasadas
                </CardTitle>
                <AlertTriangle className="w-6 h-6 text-orange-200" />
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-3">
              <div className="text-3xl font-bold text-white">
                {formatCurrency(totalAtrasadoPagar + totalAtrasadoReceber)}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-orange-200">A pagar:</span>
                  <span className="text-white font-medium">{formatCurrency(totalAtrasadoPagar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-200">A receber:</span>
                  <span className="text-white font-medium">{formatCurrency(totalAtrasadoReceber)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhamento das Contas Atrasadas - ATUALIZADOS com Itens 4 e 5 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Contas a Pagar Atrasadas - COM SCROLL VERTICAL (Item 4) */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <ArrowDown className="w-6 h-6 text-red-500" />
                Contas a Pagar Atrasadas ({contasAtrasadasPagar.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contasAtrasadasPagar.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-xl border-l-4 border-red-500">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-red-700 text-lg">Total Atrasado:</span>
                      <span className="text-red-700 font-bold text-2xl">
                        {formatCurrency(totalAtrasadoPagar)}
                      </span>
                    </div>
                  </div>
                  
                  {/* SCROLL VERTICAL - Item 4 */}
                  <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                    {contasAtrasadasPagar.map((conta) => {
                      const hoje = new Date();
                      const vencimento = new Date(conta.data_vencimento);
                      const diasAtraso = Math.ceil((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={conta.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800">{conta.referencia}</p>
                              <p className="text-slate-600 text-sm">
                                {conta.destino_tipo === 'fornecedor' ? conta.fornecedores?.nome : 'Despesa'}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-500">
                                  {new Date(conta.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </span>
                                <Badge className={`${getStatusColor(-diasAtraso)} border text-xs`}>
                                  {diasAtraso} dias atrasado
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-red-600 font-bold">
                                {formatCurrency(conta.valor - (conta.valor_baixa || 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-slate-500 text-lg">Nenhuma conta a pagar atrasada</p>
                  <p className="text-slate-400">Parabéns! Você está em dia</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contas a Receber Atrasadas - COM SCROLL VERTICAL (Item 5) */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <ArrowUp className="w-6 h-6 text-orange-500" />
                Contas a Receber Atrasadas ({contasAtrasadasReceber.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contasAtrasadasReceber.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-xl border-l-4 border-orange-500">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-orange-700 text-lg">Total Atrasado:</span>
                      <span className="text-orange-700 font-bold text-2xl">
                        {formatCurrency(totalAtrasadoReceber)}
                      </span>
                    </div>
                  </div>
                  
                  {/* SCROLL VERTICAL - Item 5 */}
                  <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                    {contasAtrasadasReceber.map((conta) => {
                      const hoje = new Date();
                      const vencimento = new Date(conta.data_vencimento);
                      const diasAtraso = Math.ceil((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={conta.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800">{conta.referencia}</p>
                              <p className="text-slate-600 text-sm">
                                {conta.destino_tipo === 'cliente' ? conta.clientes?.nome : 'Receita'}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-500">
                                  {new Date(conta.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </span>
                                <Badge className={`${getStatusColor(-diasAtraso)} border text-xs`}>
                                  {diasAtraso} dias atrasado
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-orange-600 font-bold">
                                {formatCurrency(conta.valor - (conta.valor_baixa || 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-slate-500 text-lg">Nenhuma conta a receber atrasada</p>
                  <p className="text-slate-400">Excelente! Todos os pagamentos em dia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
