
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Activity
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

const Dashboard = () => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [bancoSelecionado, setBancoSelecionado] = useState<string>('');
  const [saldoBanco, setSaldoBanco] = useState<number>(0);
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
      carregarTotaisContas()
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

  const carregarTotaisContas = async () => {
    console.log('Dashboard: Carregando totais de contas...');
    
    // Total contas a pagar (fornecedores) - valor total menos valor baixado
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

    // Total contas a receber (clientes) - valor total menos valor baixado
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

        {/* Saldo da Conta - COM REALTIME */}
        <Card className="shadow-2xl border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white relative overflow-hidden max-w-md mx-auto">
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

        {/* Cards de Totais - Independentes do Banco */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Total Contas a Pagar */}
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
                  Valor líquido a pagar
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Contas a Receber */}
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
                  Valor líquido a receber
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
