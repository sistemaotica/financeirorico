import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowDown, ArrowUp, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [proximosVencimentos, setProximosVencimentos] = useState<Conta[]>([]);
  const [proximosRecebimentos, setProximosRecebimentos] = useState<Conta[]>([]);
  const [debitosSemana, setDebitosSemana] = useState<number>(0);
  const [receberSemana, setReceberSemana] = useState<number>(0);

  useEffect(() => {
    carregarBancos();
    carregarContasSemana();
  }, []);

  useEffect(() => {
    if (bancoSelecionado) {
      const banco = bancos.find(b => b.id === bancoSelecionado);
      setSaldoBanco(banco?.saldo || 0);
    }
  }, [bancoSelecionado, bancos]);

  const carregarBancos = async () => {
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (!error && data) {
      setBancos(data);
      if (data.length > 0 && !bancoSelecionado) {
        setBancoSelecionado(data[0].id);
      }
    }
  };

  const carregarContasSemana = async () => {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);

    const { data: contas, error } = await supabase
      .from('contas')
      .select(`
        *,
        clientes (nome),
        fornecedores (nome)
      `)
      .gte('data_vencimento', inicioSemana.toISOString().split('T')[0])
      .lte('data_vencimento', fimSemana.toISOString().split('T')[0])
      .lt('valor_baixa', 'valor')
      .order('data_vencimento');

    if (!error && contas) {
      // Mapear os dados para garantir os tipos corretos
      const contasTyped = contas.map(conta => ({
        ...conta,
        tipo: conta.tipo as 'pagar' | 'receber',
        destino_tipo: conta.destino_tipo as 'cliente' | 'fornecedor'
      }));

      const contasPagar = contasTyped.filter(conta => conta.tipo === 'pagar');
      const contasReceber = contasTyped.filter(conta => conta.tipo === 'receber');
      
      setProximosVencimentos(contasPagar.slice(0, 3));
      setProximosRecebimentos(contasReceber.slice(0, 3));
      
      const totalDebitos = contasPagar.reduce((sum, conta) => sum + (conta.valor - (conta.valor_baixa || 0)), 0);
      const totalReceber = contasReceber.reduce((sum, conta) => sum + (conta.valor - (conta.valor_baixa || 0)), 0);
      
      setDebitosSemana(totalDebitos);
      setReceberSemana(totalReceber);
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

        {/* Débitos da Semana */}
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Débitos da Semana
            </CardTitle>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {formatCurrency(debitosSemana)}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {proximosVencimentos.length} contas a pagar
            </p>
          </CardContent>
        </Card>

        {/* A Receber da Semana */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              A Receber da Semana
            </CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(receberSemana)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {proximosRecebimentos.length} recebimentos previstos
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
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proximosVencimentos.length > 0 ? (
                proximosVencimentos.map((conta) => (
                  <div key={conta.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{conta.referencia}</p>
                      <p className="text-sm text-gray-600">
                        {conta.destino_tipo === 'fornecedor' ? conta.fornecedores?.nome : 'Despesa'}
                      </p>
                      <p className="text-xs text-gray-500">{getDiasParaVencimento(conta.data_vencimento)}</p>
                    </div>
                    <span className="text-red-600 font-semibold">
                      {formatCurrency(conta.valor - (conta.valor_baixa || 0))}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum vencimento na semana</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-green-500" />
              Próximos Recebimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proximosRecebimentos.length > 0 ? (
                proximosRecebimentos.map((conta) => (
                  <div key={conta.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{conta.referencia}</p>
                      <p className="text-sm text-gray-600">
                        {conta.destino_tipo === 'cliente' ? conta.clientes?.nome : 'Receita'}
                      </p>
                      <p className="text-xs text-gray-500">{getDiasParaVencimento(conta.data_vencimento)}</p>
                    </div>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(conta.valor - (conta.valor_baixa || 0))}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum recebimento na semana</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
