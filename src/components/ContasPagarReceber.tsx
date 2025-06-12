
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import BaixaContaDialog from './dialogs/BaixaContaDialog';
import EditContaDialog from './dialogs/EditContaDialog';
import ContaForm from './contas/ContaForm';
import ContasTable from './contas/ContasTable';
import { useContasData } from '@/hooks/useContasData';
import { Conta, BaixaConta } from '@/types/contas';

const ContasPagarReceber = () => {
  const {
    clientes,
    fornecedores,
    bancos,
    contas,
    baixasContas,
    carregarContas,
    carregarBaixasContas,
    carregarBancos
  } = useContasData();

  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroBanco, setFiltroBanco] = useState<string>('todos');
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');
  const [filtroFornecedor, setFiltroFornecedor] = useState<string>('todos');
  const [baixaDialogOpen, setBaixaDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<Conta | null>(null);
  const { toast } = useToast();

  const handleEdit = (conta: Conta) => {
    setSelectedConta(conta);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (conta: Conta) => {
    const { error } = await supabase
      .from('contas')
      .update({
        tipo: conta.tipo,
        destino_tipo: conta.destino_tipo,
        cliente_id: conta.destino_tipo === 'cliente' ? conta.cliente_id : null,
        fornecedor_id: conta.destino_tipo === 'fornecedor' ? conta.fornecedor_id : null,
        referencia: conta.referencia,
        numero_nota: conta.numero_nota,
        data_vencimento: conta.data_vencimento,
        valor: conta.valor
      })
      .eq('id', conta.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar conta",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso"
      });
      setEditDialogOpen(false);
      carregarContas();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      const { error } = await supabase
        .from('contas')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir conta",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Conta excluída com sucesso"
        });
        carregarContas();
      }
    }
  };

  const handleBaixa = (conta: Conta) => {
    setSelectedConta(conta);
    setBaixaDialogOpen(true);
  };

  const handleSaveBaixa = async (baixaData: { conta_id: string; banco_id: string; valor: number; data_baixa: string }) => {
    const conta = contas.find(c => c.id === baixaData.conta_id);
    
    if (!conta) return;

    const valorEmAberto = conta.valor - (conta.valor_baixa || 0);
    if (baixaData.valor > valorEmAberto) {
      toast({
        title: "Erro",
        description: "O valor da baixa não pode ser maior que o valor em aberto",
        variant: "destructive"
      });
      return;
    }

    const { error: baixaError } = await supabase
      .from('baixas_contas')
      .insert(baixaData);

    if (baixaError) {
      toast({
        title: "Erro",
        description: "Erro ao realizar baixa",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Baixa realizada com sucesso"
    });
    setBaixaDialogOpen(false);
    
    await carregarContas();
    await carregarBaixasContas();
    await carregarBancos();
  };

  const handleDesfazerBaixaIndividual = async (baixa: BaixaConta) => {
    if (confirm(`Tem certeza que deseja desfazer esta baixa de R$ ${baixa.valor.toFixed(2)}?`)) {
      console.log(`DESFAZENDO BAIXA: ID ${baixa.id}, Valor: R$ ${baixa.valor}`);
      
      const { error: deleteBaixaError } = await supabase
        .from('baixas_contas')
        .delete()
        .eq('id', baixa.id);

      if (deleteBaixaError) {
        console.error('Erro ao remover baixa:', deleteBaixaError);
        toast({
          title: "Erro",
          description: "Erro ao remover baixa",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: `Baixa de R$ ${baixa.valor.toFixed(2)} foi desfeita com sucesso.`
      });
      
      await carregarContas();
      await carregarBaixasContas(); 
      await carregarBancos();
    }
  };

  const contasFiltradas = contas.filter(conta => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVencimento = new Date(conta.data_vencimento + 'T00:00:00');
    
    let statusMatch = true;
    if (filtroStatus === 'pago') statusMatch = conta.valor_baixa >= conta.valor;
    else if (filtroStatus === 'aberto') statusMatch = conta.valor_baixa < conta.valor;
    else if (filtroStatus === 'vencido') {
      statusMatch = dataVencimento < hoje && conta.valor_baixa < conta.valor;
    }
    
    let bancoMatch = true;
    if (filtroBanco !== 'todos') {
      bancoMatch = conta.banco_baixa_id === filtroBanco;
    }

    let clienteMatch = true;
    if (filtroCliente !== 'todos') {
      clienteMatch = conta.destino_tipo === 'cliente' && conta.cliente_id === filtroCliente;
    }

    let fornecedorMatch = true;
    if (filtroFornecedor !== 'todos') {
      fornecedorMatch = conta.destino_tipo === 'fornecedor' && conta.fornecedor_id === filtroFornecedor;
    }
    
    return statusMatch && bancoMatch && clienteMatch && fornecedorMatch;
  });

  const contasClientes = contasFiltradas.filter(conta => conta.destino_tipo === 'cliente');
  const contasFornecedores = contasFiltradas.filter(conta => conta.destino_tipo === 'fornecedor');

  return (
    <div className="space-y-6">
      <ContaForm
        clientes={clientes}
        fornecedores={fornecedores}
        bancos={bancos}
        onSuccess={carregarContas}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Contas Cadastradas
            <div className="flex space-x-2 flex-wrap">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aberto">Em Aberto</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroBanco} onValueChange={setFiltroBanco}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os bancos</SelectItem>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroFornecedor} onValueChange={setFiltroFornecedor}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os fornecedores</SelectItem>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="clientes" className="w-full">
            <TabsList>
              <TabsTrigger value="clientes">Clientes ({contasClientes.length})</TabsTrigger>
              <TabsTrigger value="fornecedores">Fornecedores ({contasFornecedores.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="clientes">
              <ContasTable
                contas={contasClientes}
                baixasContas={baixasContas}
                bancos={bancos}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBaixa={handleBaixa}
                onDesfazerBaixa={handleDesfazerBaixaIndividual}
              />
            </TabsContent>
            
            <TabsContent value="fornecedores">
              <ContasTable
                contas={contasFornecedores}
                baixasContas={baixasContas}
                bancos={bancos}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBaixa={handleBaixa}
                onDesfazerBaixa={handleDesfazerBaixaIndividual}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <BaixaContaDialog
        open={baixaDialogOpen}
        onOpenChange={setBaixaDialogOpen}
        conta={selectedConta}
        bancos={bancos}
        onSave={handleSaveBaixa}
      />

      <EditContaDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        conta={selectedConta}
        clientes={clientes}
        fornecedores={fornecedores}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default ContasPagarReceber;
