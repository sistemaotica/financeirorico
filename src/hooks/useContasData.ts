
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Cliente, Fornecedor, Banco, Conta, BaixaConta } from '@/types/contas';

export const useContasData = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [baixasContas, setBaixasContas] = useState<BaixaConta[]>([]);
  const { toast } = useToast();

  const carregarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');

    if (!error) {
      setClientes(data || []);
    }
  };

  const carregarFornecedores = async () => {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');

    if (!error) {
      setFornecedores(data || []);
    }
  };

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

  const carregarContas = async () => {
    const { data, error } = await supabase
      .from('contas')
      .select(`
        *,
        clientes (nome),
        fornecedores (nome),
        bancos:banco_baixa_id (nome)
      `)
      .order('data_vencimento', { ascending: true });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar contas",
        variant: "destructive"
      });
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        tipo: item.tipo as 'pagar' | 'receber',
        destino_tipo: item.destino_tipo as 'cliente' | 'fornecedor',
        status: item.status as 'aberto' | 'pago' | 'vencido'
      }));
      setContas(typedData);
    }
  };

  const carregarBaixasContas = async () => {
    const { data, error } = await supabase
      .from('baixas_contas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setBaixasContas(data || []);
    }
  };

  useEffect(() => {
    carregarClientes();
    carregarFornecedores();
    carregarBancos();
    carregarContas();
    carregarBaixasContas();
  }, []);

  return {
    clientes,
    fornecedores,
    bancos,
    contas,
    baixasContas,
    carregarClientes,
    carregarFornecedores,
    carregarBancos,
    carregarContas,
    carregarBaixasContas
  };
};
