import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Undo } from 'lucide-react';
import BaixaContaDialog from './dialogs/BaixaContaDialog';
import EditContaDialog from './dialogs/EditContaDialog';
import { eventBus } from '@/utils/eventBus';

interface Cliente {
  id: string;
  nome: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

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
  cliente_id: string;
  fornecedor_id: string;
  referencia: string;
  numero_nota: string;
  data_vencimento: string;
  valor: number;
  valor_baixa: number;
  parcela_numero: number;
  parcela_total: number;
  status: 'aberto' | 'pago' | 'vencido';
  banco_baixa_id: string;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
  bancos?: { nome: string };
}

interface BaixaConta {
  id: string;
  conta_id: string;
  valor: number;
  data_baixa: string;
  created_at: string;
  banco_id: string;
}

const ContasPagarReceber = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [baixasContas, setBaixasContas] = useState<BaixaConta[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroBanco, setFiltroBanco] = useState<string>('todos');
  const [baixaDialogOpen, setBaixaDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<Conta | null>(null);
  const [formData, setFormData] = useState({
    tipo: 'pagar' as 'pagar' | 'receber',
    destino_tipo: 'fornecedor' as 'cliente' | 'fornecedor',
    cliente_id: '',
    fornecedor_id: '',
    banco_id: '',
    referencia: '',
    numero_nota: '',
    data_vencimento: '',
    parcelas: '1',
    valor_total: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    carregarClientes();
    carregarFornecedores();
    carregarBancos();
    carregarContas();
    carregarBaixasContas();
  }, []);

  const carregarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');

    if (!error) {
      setClientes(data || []);
    }
  };

  const carregarFornecedores = async () => {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');

    if (!error) {
      setFornecedores(data || []);
    }
  };

  const carregarBancos = async () => {
    const { data, error } = await supabase
      .from('bancos')
      .select('id, nome, agencia, conta, saldo')
      .eq('ativo', true)
      .order('nome');

    if (!error) {
      setBancos(data || []);
    }
  };

  const carregarContas = async () => {
    const { data, error } = await supabase
      .from('contas')
      .select(`
        *,
        clientes (nome),
        fornecedores (nome),
        bancos:banco_baixa_id (nome)
      `)
      .order('data_vencimento', { ascending: true });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar contas",
        variant: "destructive"
      });
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        tipo: item.tipo as 'pagar' | 'receber',
        destino_tipo: item.destino_tipo as 'cliente' | 'fornecedor',
        status: item.status as 'aberto' | 'pago' | 'vencido'
      }));
      setContas(typedData);
    }
  };

  const carregarBaixasContas = async () => {
    const { data, error } = await supabase
      .from('baixas_contas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setBaixasContas(data || []);
    }
  };

  const gerarParcelas = (valorTotal: number, numParcelas: number, dataVencimento: string) => {
    const parcelas = [];
    const valorParcela = valorTotal / numParcelas;
    
    // Usar a data exatamente como informada pelo usuário (sem conversão de timezone)
    const [ano, mes, dia] = dataVencimento.split('-').map(Number);

    for (let i = 0; i < numParcelas; i++) {
      let dataVenc: Date;
      
      if (i === 0) {
        // Primeira parcela: usar exatamente a data informada
        dataVenc = new Date(ano, mes - 1, dia);
      } else {
        // Demais parcelas: adicionar meses mantendo o mesmo dia
        dataVenc = new Date(ano, mes - 1 + i, dia);
        
        // Verificar se o dia existe no mês de destino (ex: 31 de janeiro -> 28/29 de fevereiro)
        if (dataVenc.getDate() !== dia) {
          // Se o dia não existe, usar o último dia do mês
          dataVenc = new Date(ano, mes + i, 0);
        }
      }
      
      // Converter para string no formato YYYY-MM-DD usando UTC para evitar problemas de timezone
      const dataVencString = dataVenc.getFullYear() + '-' + 
        String(dataVenc.getMonth() + 1).padStart(2, '0') + '-' + 
        String(dataVenc.getDate()).padStart(2, '0');
      
      parcelas.push({
        valor: valorParcela,
        data_vencimento: dataVencString,
        parcela_numero: i + 1,
        parcela_total: numParcelas
      });
    }

    return parcelas;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.referencia || !formData.data_vencimento || !formData.valor_total || !formData.banco_id) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (formData.destino_tipo === 'cliente' && !formData.cliente_id) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive"
      });
      return;
    }

    if (formData.destino_tipo === 'fornecedor' && !formData.fornecedor_id) {
      toast({
        title: "Erro",
        description: "Selecione um fornecedor",
        variant: "destructive"
      });
      return;
    }

    const valorTotal = parseFloat(formData.valor_total);
    const numParcelas = parseInt(formData.parcelas);
    const parcelas = gerarParcelas(valorTotal, numParcelas, formData.data_vencimento);

    const contasParaInserir = parcelas.map(parcela => ({
      tipo: formData.tipo,
      destino_tipo: formData.destino_tipo,
      cliente_id: formData.destino_tipo === 'cliente' ? formData.cliente_id : null,
      fornecedor_id: formData.destino_tipo === 'fornecedor' ? formData.fornecedor_id : null,
      banco_baixa_id: formData.banco_id,
      referencia: formData.referencia,
      numero_nota: formData.numero_nota || null,
      data_vencimento: parcela.data_vencimento,
      valor: parcela.valor,
      parcela_numero: parcela.parcela_numero,
      parcela_total: parcela.parcela_total
    }));

    const { error } = await supabase
      .from('contas')
      .insert(contasParaInserir);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar contas",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: `${numParcelas} parcela(s) criada(s) com sucesso`
      });
      
      setFormData({
        tipo: 'pagar',
        destino_tipo: 'fornecedor',
        cliente_id: '',
        fornecedor_id: '',
        banco_id: '',
        referencia: '',
        numero_nota: '',
        data_vencimento: '',
        parcelas: '1',
        valor_total: ''
      });
      
      carregarContas();
    }
  };

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

    // Validar se o valor da baixa não excede o valor em aberto
    const valorEmAberto = conta.valor - (conta.valor_baixa || 0);
    if (baixaData.valor > valorEmAberto) {
      toast({
        title: "Erro",
        description: "O valor da baixa não pode ser maior que o valor em aberto",
        variant: "destructive"
      });
      return;
    }

    // APENAS inserir a baixa - o trigger do banco se encarrega de atualizar saldo e conta
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
    
    // Recarregar dados para sincronizar com as mudanças do trigger
    await carregarContas();
    await carregarBaixasContas();
    await carregarBancos();
  };

  const handleDesfazerBaixaIndividual = async (baixa: BaixaConta) => {
    if (confirm(`Tem certeza que deseja desfazer esta baixa de R$ ${baixa.valor.toFixed(2)}?`)) {
      console.log(`DESFAZENDO BAIXA: ID ${baixa.id}, Valor: R$ ${baixa.valor}`);
      
      // APENAS deletar a baixa - o trigger do banco se encarrega do resto
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
      
      // Recarregar dados para sincronizar com as mudanças do trigger
      await carregarContas();
      await carregarBaixasContas(); 
      await carregarBancos();
    }
  };

  // FILTROS CORRIGIDOS - Item 1
  const contasFiltradas = contas.filter(conta => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVencimento = new Date(conta.data_vencimento + 'T00:00:00');
    
    // Filtro por status
    let statusMatch = true;
    if (filtroStatus === 'pago') statusMatch = conta.valor_baixa >= conta.valor;
    else if (filtroStatus === 'aberto') statusMatch = conta.valor_baixa < conta.valor;
    else if (filtroStatus === 'vencido') {
      statusMatch = dataVencimento < hoje && conta.valor_baixa < conta.valor;
    }
    
    // Filtro por banco
    let bancoMatch = true;
    if (filtroBanco !== 'todos') {
      bancoMatch = conta.banco_baixa_id === filtroBanco;
    }
    
    return statusMatch && bancoMatch;
  });

  const contasClientes = contasFiltradas.filter(conta => conta.destino_tipo === 'cliente');
  const contasFornecedores = contasFiltradas.filter(conta => conta.destino_tipo === 'fornecedor');

  const getBaixasHistorico = (contaId: string) => {
    return baixasContas.filter(baixa => baixa.conta_id === contaId);
  };

  const getValorTotalBaixas = (contaId: string) => {
    return getBaixasHistorico(contaId).reduce((total, baixa) => total + baixa.valor, 0);
  };

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Nova Conta a Pagar/Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value as 'pagar' | 'receber'})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagar">A Pagar</SelectItem>
                  <SelectItem value="receber">A Receber</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="destino_tipo">Destino *</Label>
              <Select value={formData.destino_tipo} onValueChange={(value) => setFormData({...formData, destino_tipo: value as 'cliente' | 'fornecedor', cliente_id: '', fornecedor_id: ''})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.destino_tipo === 'cliente' && (
              <div>
                <Label htmlFor="cliente">Cliente *</Label>
                <Select value={formData.cliente_id} onValueChange={(value) => setFormData({...formData, cliente_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.destino_tipo === 'fornecedor' && (
              <div>
                <Label htmlFor="fornecedor">Fornecedor *</Label>
                <Select value={formData.fornecedor_id} onValueChange={(value) => setFormData({...formData, fornecedor_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="banco">Banco *</Label>
              <Select value={formData.banco_id} onValueChange={(value) => setFormData({...formData, banco_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="referencia">Referência *</Label>
              <Input
                id="referencia"
                value={formData.referencia}
                onChange={(e) => setFormData({...formData, referencia: e.target.value})}
                placeholder="Identificação do lançamento"
                required
              />
            </div>

            <div>
              <Label htmlFor="numero_nota">Número da Nota</Label>
              <Input
                id="numero_nota"
                value={formData.numero_nota}
                onChange={(e) => setFormData({...formData, numero_nota: e.target.value})}
                placeholder="Número da nota"
              />
            </div>

            <div>
              <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="parcelas">Número de Parcelas *</Label>
              <Input
                id="parcelas"
                type="number"
                min="1"
                value={formData.parcelas}
                onChange={(e) => setFormData({...formData, parcelas: e.target.value})}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="valor_total">Valor Total *</Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                value={formData.valor_total}
                onChange={(e) => setFormData({...formData, valor_total: e.target.value})}
                placeholder="0,00"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Button type="submit" className="w-full">
                Gerar Parcelas
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Relatório de Contas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Contas Cadastradas
            <div className="flex space-x-2">
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
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Valor Baixado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasClientes.map((conta) => (
                      <TableRow key={conta.id}>
                        <TableCell>{conta.clientes?.nome}</TableCell>
                        <TableCell>{conta.bancos?.nome || 'N/A'}</TableCell>
                        <TableCell>{conta.referencia}</TableCell>
                        <TableCell>{new Date(conta.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{conta.parcela_numero}/{conta.parcela_total}</TableCell>
                        <TableCell>R$ {conta.valor.toFixed(2)}</TableCell>
                        <TableCell>R$ {(conta.valor_baixa || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            conta.valor_baixa >= conta.valor ? 'bg-green-100 text-green-800' :
                            conta.status === 'vencido' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {conta.valor_baixa >= conta.valor ? 'Pago' : conta.status === 'vencido' ? 'Vencido' : 'Em Aberto'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap space-x-1 space-y-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(conta)}>Editar</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(conta.id)}>Excluir</Button>
                            {conta.valor_baixa < conta.valor && (
                              <Button size="sm" variant="default" onClick={() => handleBaixa(conta)}>Baixa</Button>
                            )}
                          </div>
                          {getBaixasHistorico(conta.id).length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              <strong>Histórico de Baixas:</strong>
                              {getBaixasHistorico(conta.id).map((baixa) => {
                                const banco = bancos.find(b => b.id === baixa.banco_id);
                                return (
                                  <div key={baixa.id} className="flex items-center justify-between">
                                    <span>
                                      {new Date(baixa.data_baixa + 'T00:00:00').toLocaleDateString('pt-BR')}: R$ {baixa.valor.toFixed(2)} ({banco?.nome || 'Banco não encontrado'})
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDesfazerBaixaIndividual(baixa)}
                                      className="ml-2 h-6 w-6 p-0"
                                      title="Desfazer esta baixa"
                                    >
                                      <Undo className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="fornecedores">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Valor Baixado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasFornecedores.map((conta) => (
                      <TableRow key={conta.id}>
                        <TableCell>{conta.fornecedores?.nome}</TableCell>
                        <TableCell>{conta.bancos?.nome || 'N/A'}</TableCell>
                        <TableCell>{conta.referencia}</TableCell>
                        <TableCell>{new Date(conta.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{conta.parcela_numero}/{conta.parcela_total}</TableCell>
                        <TableCell>R$ {conta.valor.toFixed(2)}</TableCell>
                        <TableCell>R$ {(conta.valor_baixa || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            conta.valor_baixa >= conta.valor ? 'bg-green-100 text-green-800' :
                            conta.status === 'vencido' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {conta.valor_baixa >= conta.valor ? 'Pago' : conta.status === 'vencido' ? 'Vencido' : 'Em Aberto'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap space-x-1 space-y-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(conta)}>Editar</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(conta.id)}>Excluir</Button>
                            {conta.valor_baixa < conta.valor && (
                              <Button size="sm" variant="default" onClick={() => handleBaixa(conta)}>Baixa</Button>
                            )}
                          </div>
                          {getBaixasHistorico(conta.id).length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              <strong>Histórico de Baixas:</strong>
                              {getBaixasHistorico(conta.id).map((baixa) => {
                                const banco = bancos.find(b => b.id === baixa.banco_id);
                                return (
                                  <div key={baixa.id} className="flex items-center justify-between">
                                    <span>
                                      {new Date(baixa.data_baixa + 'T00:00:00').toLocaleDateString('pt-BR')}: R$ {baixa.valor.toFixed(2)} ({banco?.nome || 'Banco não encontrado'})
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDesfazerBaixaIndividual(baixa)}
                                      className="ml-2 h-6 w-6 p-0"
                                      title="Desfazer esta baixa"
                                    >
                                      <Undo className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
