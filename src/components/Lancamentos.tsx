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
import { Edit2, Trash2 } from 'lucide-react';
import EditLancamentoDialog from './dialogs/EditLancamentoDialog';

interface Banco {
  id: string;
  nome: string;
  agencia: string;
  conta: string;
  saldo: number;
}

interface Lancamento {
  id: string;
  data: string;
  banco_id: string;
  tipo: 'credito' | 'debito';
  descricao: string;
  valor: number;
  numero_nota_fiscal: string;
  bancos: {
    nome: string;
  };
}

const Lancamentos = () => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState<Lancamento | null>(null);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    banco_id: '',
    tipo: 'credito' as 'credito' | 'debito',
    descricao: '',
    valor: '',
    numero_nota_fiscal: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    carregarBancos();
    carregarLancamentos();
  }, []);

  const carregarBancos = async () => {
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar bancos",
        variant: "destructive"
      });
    } else {
      setBancos(data || []);
    }
  };

  const carregarLancamentos = async () => {
    const { data, error } = await supabase
      .from('lancamentos')
      .select(`
        *,
        bancos (nome)
      `)
      .order('data', { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar lançamentos",
        variant: "destructive"
      });
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        tipo: item.tipo as 'credito' | 'debito'
      }));
      setLancamentos(typedData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.banco_id || !formData.descricao || !formData.valor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('lancamentos')
      .insert({
        data: formData.data,
        banco_id: formData.banco_id,
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        numero_nota_fiscal: formData.numero_nota_fiscal || null
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar lançamento",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Lançamento salvo com sucesso"
      });
      
      setFormData({
        data: new Date().toISOString().split('T')[0],
        banco_id: '',
        tipo: 'credito',
        descricao: '',
        valor: '',
        numero_nota_fiscal: ''
      });
      
      carregarLancamentos();
      carregarBancos();
    }
  };

  const handleEdit = (lancamento: Lancamento) => {
    setSelectedLancamento(lancamento);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (editedLancamento: Lancamento) => {
    const { error } = await supabase
      .from('lancamentos')
      .update({
        data: editedLancamento.data,
        banco_id: editedLancamento.banco_id,
        tipo: editedLancamento.tipo,
        descricao: editedLancamento.descricao,
        valor: editedLancamento.valor,
        numero_nota_fiscal: editedLancamento.numero_nota_fiscal
      })
      .eq('id', editedLancamento.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao editar lançamento",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Lançamento editado com sucesso"
      });
      setEditDialogOpen(false);
      carregarLancamentos();
      carregarBancos();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir lançamento",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Lançamento excluído com sucesso"
        });
        carregarLancamentos();
        carregarBancos();
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateForDisplay = (dateString: string) => {
    // Cria uma data local sem considerar timezone
    const [year, month, day] = dateString.split('-');
    const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return localDate.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Lançamento */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="banco">Banco *</Label>
                <Select value={formData.banco_id} onValueChange={(value) => setFormData({...formData, banco_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {bancos.map((banco) => (
                      <SelectItem key={banco.id} value={banco.id}>
                        {banco.nome} - Ag: {banco.agencia} Conta: {banco.conta} (Saldo: {formatCurrency(banco.saldo)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value as 'credito' | 'debito'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descrição da movimentação"
                required
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="numero_nota_fiscal">Número da Nota Fiscal</Label>
              <Input
                id="numero_nota_fiscal"
                value={formData.numero_nota_fiscal}
                onChange={(e) => setFormData({...formData, numero_nota_fiscal: e.target.value})}
                placeholder="Número da nota fiscal"
              />
            </div>

            <Button type="submit" className="w-full">
              Salvar Lançamento
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabela de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Nº Nota Fiscal</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.map((lancamento) => (
                  <TableRow key={lancamento.id}>
                    <TableCell>{formatDateForDisplay(lancamento.data)}</TableCell>
                    <TableCell>{lancamento.bancos?.nome}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-sm ${
                        lancamento.tipo === 'credito' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {lancamento.tipo === 'credito' ? 'Crédito' : 'Débito'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={lancamento.descricao}>
                      {lancamento.descricao}
                    </TableCell>
                    <TableCell>{lancamento.numero_nota_fiscal || '-'}</TableCell>
                    <TableCell className={`font-semibold ${lancamento.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                      {lancamento.tipo === 'credito' ? '+' : '-'} {formatCurrency(lancamento.valor)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(lancamento)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(lancamento.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EditLancamentoDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        lancamento={selectedLancamento}
        bancos={bancos}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default Lancamentos;
