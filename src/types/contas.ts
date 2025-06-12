
export interface Cliente {
  id: string;
  nome: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
}

export interface Banco {
  id: string;
  nome: string;
  agencia: string;
  conta: string;
  saldo: number;
}

export interface Conta {
  id: string;
  tipo: 'pagar' | 'receber';
  destino_tipo: 'cliente' | 'fornecedor';
  cliente_id: string;
  fornecedor_id: string;
  referencia: string;
  numero_nota: string;
  data_vencimento: string;
  valor: number;
  valor_baixa: number;
  parcela_numero: number;
  parcela_total: number;
  status: 'aberto' | 'pago' | 'vencido';
  banco_baixa_id: string;
  clientes?: { nome: string };
  fornecedores?: { nome: string };
  bancos?: { nome: string };
}

export interface BaixaConta {
  id: string;
  conta_id: string;
  valor: number;
  data_baixa: string;
  created_at: string;
  banco_id: string;
}

export interface FormData {
  tipo: 'pagar' | 'receber';
  destino_tipo: 'cliente' | 'fornecedor';
  cliente_id: string;
  fornecedor_id: string;
  banco_id: string;
  referencia: string;
  numero_nota: string;
  data_vencimento: string;
  parcelas: string;
  valor_total: string;
}
