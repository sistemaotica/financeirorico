
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
}

interface EditLancamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamento: Lancamento | null;
  bancos: Banco[];
  onSave: (lancamento: Lancamento) => void;
}

const EditLancamentoDialog = ({ open, onOpenChange, lancamento, bancos, onSave }: EditLancamentoDialogProps) => {
  const [formData, setFormData] = useState({
    data: lancamento?.data || '',
    banco_id: lancamento?.banco_id || '',
    tipo: lancamento?.tipo || 'credito' as 'credito' | 'debito',
    descricao: lancamento?.descricao || '',
    valor: lancamento?.valor?.toString() || '',
    numero_nota_fiscal: lancamento?.numero_nota_fiscal || ''
  });
  const { toast } = useToast();

  React.useEffect(() => {
    if (lancamento) {
      setFormData({
        data: lancamento.data,
        banco_id: lancamento.banco_id,
        tipo: lancamento.tipo,
        descricao: lancamento.descricao,
        valor: lancamento.valor.toString(),
        numero_nota_fiscal: lancamento.numero_nota_fiscal || ''
      });
    }
  }, [lancamento]);

  const handleSave = () => {
    if (!formData.banco_id || !formData.descricao || !formData.valor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (lancamento) {
      onSave({
        ...lancamento,
        data: formData.data,
        banco_id: formData.banco_id,
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        numero_nota_fiscal: formData.numero_nota_fiscal
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Lançamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
                    {banco.nome} - Ag: {banco.agencia} Conta: {banco.conta}
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

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditLancamentoDialog;
