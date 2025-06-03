
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
  valor: number;
  valor_baixa: number;
  referencia: string;
}

interface BaixaContaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: Conta | null;
  bancos: Banco[];
  onSave: (baixaData: { conta_id: string; banco_id: string; valor: number; data_baixa: string }) => void;
}

const BaixaContaDialog = ({ open, onOpenChange, conta, bancos, onSave }: BaixaContaDialogProps) => {
  const [formData, setFormData] = useState({
    banco_id: '',
    valor: '',
    data_baixa: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  React.useEffect(() => {
    if (conta) {
      const valorRestante = conta.valor - (conta.valor_baixa || 0);
      setFormData({
        banco_id: '',
        valor: valorRestante.toFixed(2),
        data_baixa: new Date().toISOString().split('T')[0]
      });
    }
  }, [conta]);

  const handleSave = () => {
    if (!formData.banco_id || !formData.valor || !formData.data_baixa) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const valor = parseFloat(formData.valor);
    const valorRestante = conta ? conta.valor - (conta.valor_baixa || 0) : 0;

    if (valor <= 0) {
      toast({
        title: "Erro",
        description: "O valor deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    if (valor > valorRestante) {
      toast({
        title: "Erro",
        description: "O valor não pode ser maior que o valor em aberto",
        variant: "destructive"
      });
      return;
    }

    if (conta) {
      onSave({
        conta_id: conta.id,
        banco_id: formData.banco_id,
        valor: valor,
        data_baixa: formData.data_baixa
      });
    }
  };

  const valorRestante = conta ? conta.valor - (conta.valor_baixa || 0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Baixa de Conta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {conta && (
            <div className="bg-gray-100 p-3 rounded">
              <p><strong>Referência:</strong> {conta.referencia}</p>
              <p><strong>Valor Total:</strong> R$ {conta.valor.toFixed(2)}</p>
              <p><strong>Valor Baixado:</strong> R$ {(conta.valor_baixa || 0).toFixed(2)}</p>
              <p><strong>Valor em Aberto:</strong> R$ {valorRestante.toFixed(2)}</p>
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
                    {banco.nome} - Ag: {banco.agencia} Conta: {banco.conta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="valor">Valor da Baixa *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              max={valorRestante}
              value={formData.valor}
              onChange={(e) => setFormData({...formData, valor: e.target.value})}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="data_baixa">Data da Baixa *</Label>
            <Input
              id="data_baixa"
              type="date"
              value={formData.data_baixa}
              onChange={(e) => setFormData({...formData, data_baixa: e.target.value})}
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Confirmar Baixa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BaixaContaDialog;
