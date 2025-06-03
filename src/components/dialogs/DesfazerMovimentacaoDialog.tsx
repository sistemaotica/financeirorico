
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

  const isFornecedor = conta.destino_tipo === 'fornecedor';
  const nomeDestino = isFornecedor ? conta.fornecedores?.nome : conta.clientes?.nome;
  const perguntaTitulo = isFornecedor 
    ? 'Para qual banco o valor total registrado no histórico de baixas será creditado?'
    : 'De qual banco será retirado o valor total registrado no histórico de baixas?';
  
  const descricaoOperacao = isFornecedor 
    ? 'O valor será ADICIONADO como CRÉDITO ao banco selecionado'
    : 'O valor será SUBTRAÍDO como DÉBITO do banco selecionado';

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
              <strong>{isFornecedor ? 'Fornecedor' : 'Cliente'}:</strong> {nomeDestino}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Valor Total das Baixas:</strong> R$ {valorTotalBaixas.toFixed(2)}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">
              {perguntaTitulo}
            </p>
            <p className="text-xs text-blue-700">
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
            variant={isFornecedor ? "default" : "destructive"}
          >
            Confirmar e {isFornecedor ? 'Creditar' : 'Debitar'} R$ {valorTotalBaixas.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DesfazerMovimentacaoDialog;
