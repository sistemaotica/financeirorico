
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
      // Cast the tipo field to the correct type
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
      carregarBancos(); // Recarregar para atualizar saldos
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulário de Lançamento */}
      <Card>
        <CardHeader>
          <CardTitle>Novo Lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                      {banco.nome} - Ag: {banco.agencia} Conta: {banco.conta} (Saldo: R$ {banco.saldo.toFixed(2)})
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
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descrição da movimentação"
                required
              />
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

      {/* Relatório de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.map((lancamento) => (
                  <TableRow key={lancamento.id}>
                    <TableCell>{new Date(lancamento.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{lancamento.bancos?.nome}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        lancamento.tipo === 'credito' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {lancamento.tipo === 'credito' ? 'Crédito' : 'Débito'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-40 truncate" title={lancamento.descricao}>
                      {lancamento.descricao}
                    </TableCell>
                    <TableCell className={lancamento.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}>
                      {lancamento.tipo === 'credito' ? '+' : '-'} R$ {lancamento.valor.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Lancamentos;
