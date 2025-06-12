
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Cliente, Fornecedor, Banco, FormData } from '@/types/contas';
import { gerarParcelas } from '@/utils/parcelasUtils';

interface ContaFormProps {
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  bancos: Banco[];
  onSuccess: () => void;
}

const ContaForm = ({ clientes, fornecedores, bancos, onSuccess }: ContaFormProps) => {
  const [formData, setFormData] = useState<FormData>({
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
  const { toast } = useToast();

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
      
      onSuccess();
    }
  };

  return (
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
  );
};

export default ContaForm;
