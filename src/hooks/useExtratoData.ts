
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Banco } from '@/types/contas';

export interface MovimentacaoExtrato {
  id: string;
  data: string;
  banco_nome: string;
  descricao: string;
  numero_nota: string;
  valor: number;
  tipo: 'credito' | 'debito' | 'baixa_pagar' | 'baixa_receber';
  saldo_acumulado: number;
}

export const useExtratoData = () => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoExtrato[]>([]);
  const { toast } = useToast();

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

  const carregarMovimentacoes = async (bancoId: string, dataInicio: string, dataFim: string) => {
    try {
      // Buscar lançamentos
      const { data: lancamentos, error: errorLancamentos } = await supabase
        .from('lancamentos')
        .select(`
          id,
          data,
          tipo,
          descricao,
          valor,
          numero_nota_fiscal,
          bancos!inner(nome)
        `)
        .eq('banco_id', bancoId)
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .order('data', { ascending: true });

      // Buscar baixas de contas
      const { data: baixas, error: errorBaixas } = await supabase
        .from('baixas_contas')
        .select(`
          id,
          data_baixa,
          valor,
          bancos!inner(nome),
          contas!inner(
            destino_tipo,
            referencia,
            numero_nota,
            clientes(nome),
            fornecedores(nome)
          )
        `)
        .eq('banco_id', bancoId)
        .gte('data_baixa', dataInicio)
        .lte('data_baixa', dataFim)
        .order('data_baixa', { ascending: true });

      if (errorLancamentos || errorBaixas) {
        toast({
          title: "Erro",
          description: "Erro ao carregar movimentações",
          variant: "destructive"
        });
        return;
      }

      // Combinar e ordenar movimentações
      const movimentacoesCombinadas: MovimentacaoExtrato[] = [];

      // Adicionar lançamentos
      (lancamentos || []).forEach(lancamento => {
        movimentacoesCombinadas.push({
          id: `lancamento_${lancamento.id}`,
          data: lancamento.data,
          banco_nome: lancamento.bancos.nome,
          descricao: lancamento.descricao,
          numero_nota: lancamento.numero_nota_fiscal || '',
          valor: lancamento.valor,
          tipo: lancamento.tipo as 'credito' | 'debito',
          saldo_acumulado: 0 // Será calculado depois
        });
      });

      // Adicionar baixas
      (baixas || []).forEach(baixa => {
        const nomeDestino = baixa.contas.destino_tipo === 'cliente' 
          ? baixa.contas.clientes?.nome 
          : baixa.contas.fornecedores?.nome;
        
        movimentacoesCombinadas.push({
          id: `baixa_${baixa.id}`,
          data: baixa.data_baixa,
          banco_nome: baixa.bancos.nome,
          descricao: `Baixa: ${baixa.contas.referencia} - ${nomeDestino}`,
          numero_nota: baixa.contas.numero_nota || '',
          valor: baixa.valor,
          tipo: baixa.contas.destino_tipo === 'cliente' ? 'baixa_receber' : 'baixa_pagar',
          saldo_acumulado: 0 // Será calculado depois
        });
      });

      // Ordenar por data
      movimentacoesCombinadas.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

      // Calcular saldo acumulado
      let saldoAcumulado = 0;
      movimentacoesCombinadas.forEach(mov => {
        if (mov.tipo === 'credito' || mov.tipo === 'baixa_receber') {
          saldoAcumulado += mov.valor;
        } else {
          saldoAcumulado -= mov.valor;
        }
        mov.saldo_acumulado = saldoAcumulado;
      });

      setMovimentacoes(movimentacoesCombinadas);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar extrato",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    carregarBancos();
  }, []);

  return {
    bancos,
    movimentacoes,
    carregarMovimentacoes
  };
};
