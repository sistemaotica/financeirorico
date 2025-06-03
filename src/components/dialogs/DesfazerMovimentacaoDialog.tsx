
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  valor: number;
  valor_baixa: number;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
}

interface DesfazerMovimentacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: Conta | null;
  bancos: Banco[];
  valorTotalBaixas: number;
  onConfirm: (bancoId: string) => void;
}

const DesfazerMovimentacaoDialog = ({
  open,
  onOpenChange,
  conta,
  bancos,
  valorTotalBaixas,
  onConfirm
}: DesfazerMovimentacaoDialogProps) => {
  const [bancoSelecionado, setBancoSelecionado] = useState('');

  const handleConfirm = () => {
    if (bancoSelecionado) {
      onConfirm(bancoSelecionado);
      setBancoSelecionado('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setBancoSelecionado('');
    onOpenChange(false);
  };

  if (!conta) return null;

  const isCliente = conta.destino_tipo === 'cliente';
  const nomeDestino = isCliente ? conta.clientes?.nome : conta.fornecedores?.nome;
  const tipoOperacao = isCliente ? 'retirado' : 'adicionado';
  const descricaoOperacao = isCliente 
    ? 'O valor será DIMINUÍDO do saldo do banco selecionado'
    : 'O valor será ADICIONADO ao saldo do banco selecionado';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Desfazer Movimentação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800">Detalhes da Conta:</h4>
            <p className="text-sm text-gray-600">
              <strong>Referência:</strong> {conta.referencia}
            </p>
            <p className="text-sm text-gray-600">
              <strong>{isCliente ? 'Cliente' : 'Fornecedor'}:</strong> {nomeDestino}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Valor Total das Baixas:</strong> R$ {valorTotalBaixas.toFixed(2)}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> {descricaoOperacao}
            </p>
          </div>

          <div>
            <Label htmlFor="banco">Selecione o Banco *</Label>
            <Select value={bancoSelecionado} onValueChange={setBancoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o banco para a operação" />
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
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!bancoSelecionado}
            variant={isCliente ? "destructive" : "default"}
          >
            Confirmar e {tipoOperacao === 'retirado' ? 'Retirar' : 'Adicionar'} R$ {valorTotalBaixas.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DesfazerMovimentacaoDialog;
