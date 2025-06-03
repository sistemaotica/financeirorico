
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Cliente {
  id: string;
  nome: string;
}

interface Fornecedor {
  id: string;
  nome: string;
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
  parcela_numero: number;
  parcela_total: number;
}

interface EditContaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: Conta | null;
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  onSave: (conta: Conta) => void;
}

const EditContaDialog = ({ open, onOpenChange, conta, clientes, fornecedores, onSave }: EditContaDialogProps) => {
  const [formData, setFormData] = useState({
    tipo: 'pagar' as 'pagar' | 'receber',
    destino_tipo: 'fornecedor' as 'cliente' | 'fornecedor',
    cliente_id: '',
    fornecedor_id: '',
    referencia: '',
    numero_nota: '',
    data_vencimento: '',
    valor: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (conta) {
      setFormData({
        tipo: conta.tipo,
        destino_tipo: conta.destino_tipo,
        cliente_id: conta.cliente_id || '',
        fornecedor_id: conta.fornecedor_id || '',
        referencia: conta.referencia,
        numero_nota: conta.numero_nota || '',
        data_vencimento: conta.data_vencimento,
        valor: conta.valor.toString()
      });
    }
  }, [conta]);

  const handleSave = () => {
    if (!formData.referencia || !formData.data_vencimento || !formData.valor) {
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

    if (conta) {
      const contaAtualizada: Conta = {
        ...conta,
        tipo: formData.tipo,
        destino_tipo: formData.destino_tipo,
        cliente_id: formData.destino_tipo === 'cliente' ? formData.cliente_id : '',
        fornecedor_id: formData.destino_tipo === 'fornecedor' ? formData.fornecedor_id : '',
        referencia: formData.referencia,
        numero_nota: formData.numero_nota,
        data_vencimento: formData.data_vencimento,
        valor: parseFloat(formData.valor)
      };
      onSave(contaAtualizada);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditContaDialog;
