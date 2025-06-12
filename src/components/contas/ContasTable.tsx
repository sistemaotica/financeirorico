
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Undo } from 'lucide-react';
import { Conta, BaixaConta, Banco } from '@/types/contas';

interface ContasTableProps {
  contas: Conta[];
  baixasContas: BaixaConta[];
  bancos: Banco[];
  onEdit: (conta: Conta) => void;
  onDelete: (id: string) => void;
  onBaixa: (conta: Conta) => void;
  onDesfazerBaixa: (baixa: BaixaConta) => void;
}

const ContasTable = ({ 
  contas, 
  baixasContas, 
  bancos, 
  onEdit, 
  onDelete, 
  onBaixa, 
  onDesfazerBaixa 
}: ContasTableProps) => {
  const getBaixasHistorico = (contaId: string) => {
    return baixasContas.filter(baixa => baixa.conta_id === contaId);
  };

  return (
    <div className="max-h-96 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente/Fornecedor</TableHead>
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
          {contas.map((conta) => (
            <TableRow key={conta.id}>
              <TableCell>
                {conta.destino_tipo === 'cliente' ? conta.clientes?.nome : conta.fornecedores?.nome}
              </TableCell>
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
                  <Button size="sm" variant="outline" onClick={() => onEdit(conta)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(conta.id)}>Excluir</Button>
                  {conta.valor_baixa < conta.valor && (
                    <Button size="sm" variant="default" onClick={() => onBaixa(conta)}>Baixa</Button>
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
                            onClick={() => onDesfazerBaixa(baixa)}
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
  );
};

export default ContasTable;
