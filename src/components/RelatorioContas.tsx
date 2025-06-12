
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Download } from 'lucide-react';
import { useContasData } from '@/hooks/useContasData';
import { Conta } from '@/types/contas';

const RelatorioContas = () => {
  const { clientes, fornecedores, contas } = useContasData();
  const [tipoRelatorio, setTipoRelatorio] = useState<'pagar' | 'receber' | ''>('');
  const [statusRelatorio, setStatusRelatorio] = useState<'aberto' | 'baixadas' | 'todas' | ''>('');
  const [tipoData, setTipoData] = useState<'vencimento' | 'baixa' | ''>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoDestino, setTipoDestino] = useState<'cliente' | 'fornecedor' | ''>('');
  const [destinoId, setDestinoId] = useState('');

  const gerarRelatorio = () => {
    // Filtrar contas baseado nos critérios selecionados
    let contasFiltradas = [...contas];

    // Filtro por tipo (pagar/receber)
    if (tipoRelatorio) {
      contasFiltradas = contasFiltradas.filter(conta => conta.tipo === tipoRelatorio);
    }

    // Filtro por status
    if (statusRelatorio) {
      if (statusRelatorio === 'aberto') {
        contasFiltradas = contasFiltradas.filter(conta => conta.valor_baixa < conta.valor);
      } else if (statusRelatorio === 'baixadas') {
        contasFiltradas = contasFiltradas.filter(conta => conta.valor_baixa >= conta.valor);
      }
    }

    // Filtro por tipo de destino
    if (tipoDestino) {
      contasFiltradas = contasFiltradas.filter(conta => conta.destino_tipo === tipoDestino);
    }

    // Filtro por destino específico
    if (destinoId) {
      if (tipoDestino === 'cliente') {
        contasFiltradas = contasFiltradas.filter(conta => conta.cliente_id === destinoId);
      } else if (tipoDestino === 'fornecedor') {
        contasFiltradas = contasFiltradas.filter(conta => conta.fornecedor_id === destinoId);
      }
    }

    // Filtro por data
    if (dataInicio && dataFim) {
      contasFiltradas = contasFiltradas.filter(conta => {
        const dataComparacao = tipoData === 'baixa' ? conta.data_pagamento : conta.data_vencimento;
        if (!dataComparacao) return false;
        const dataComparacaoObj = new Date(dataComparacao);
        const dataInicioObj = new Date(dataInicio);
        const dataFimObj = new Date(dataFim);
        return dataComparacaoObj >= dataInicioObj && dataComparacaoObj <= dataFimObj;
      });
    }

    // Gerar PDF em nova aba
    gerarPDF(contasFiltradas);
  };

  const gerarPDF = (contasFiltradas: Conta[]) => {
    // Criar HTML para o relatório
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Contas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin-bottom: 10px; }
            .filters { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .filters h3 { margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total { font-weight: bold; background-color: #e8f4f8; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Contas</h1>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          
          <div class="filters">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Tipo:</strong> ${tipoRelatorio === 'pagar' ? 'Contas a Pagar' : tipoRelatorio === 'receber' ? 'Contas a Receber' : 'Todas'}</p>
            <p><strong>Status:</strong> ${statusRelatorio === 'aberto' ? 'Em Aberto' : statusRelatorio === 'baixadas' ? 'Baixadas' : 'Todas'}</p>
            <p><strong>Período:</strong> ${dataInicio && dataFim ? `${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}` : 'Sem filtro'}</p>
            <p><strong>Destino:</strong> ${tipoDestino ? (tipoDestino === 'cliente' ? 'Clientes' : 'Fornecedores') : 'Todos'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Data Vencimento</th>
                <th>Cliente/Fornecedor</th>
                <th>Referência</th>
                <th>Parcelas</th>
                <th>Nº Nota</th>
                <th>Valor Total</th>
                <th>Valor Baixado</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${contasFiltradas.map(conta => `
                <tr>
                  <td>${new Date(conta.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td>${conta.destino_tipo === 'cliente' ? conta.clientes?.nome || 'N/A' : conta.fornecedores?.nome || 'N/A'}</td>
                  <td>${conta.referencia}</td>
                  <td>${conta.parcela_numero}/${conta.parcela_total}</td>
                  <td>${conta.numero_nota || '-'}</td>
                  <td class="text-right">R$ ${conta.valor.toFixed(2)}</td>
                  <td class="text-right">R$ ${(conta.valor_baixa || 0).toFixed(2)}</td>
                  <td class="text-right">R$ ${(conta.valor - (conta.valor_baixa || 0)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total">
                <td colspan="5"><strong>TOTAIS:</strong></td>
                <td class="text-right"><strong>R$ ${contasFiltradas.reduce((sum, conta) => sum + conta.valor, 0).toFixed(2)}</strong></td>
                <td class="text-right"><strong>R$ ${contasFiltradas.reduce((sum, conta) => sum + (conta.valor_baixa || 0), 0).toFixed(2)}</strong></td>
                <td class="text-right"><strong>R$ ${contasFiltradas.reduce((sum, conta) => sum + (conta.valor - (conta.valor_baixa || 0)), 0).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    // Abrir nova aba com o relatório
    const novaAba = window.open('', '_blank');
    if (novaAba) {
      novaAba.document.write(htmlContent);
      novaAba.document.close();
      
      // Aguardar carregamento e imprimir/salvar como PDF
      setTimeout(() => {
        novaAba.print();
      }, 500);
    }
  };

  const isFormValid = () => {
    return tipoRelatorio && statusRelatorio && tipoData && dataInicio && dataFim;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Relatório de Contas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Linha 1: Tipo e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-relatorio">Tipo de Conta *</Label>
              <Select value={tipoRelatorio} onValueChange={(value: 'pagar' | 'receber') => setTipoRelatorio(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagar">Contas a Pagar</SelectItem>
                  <SelectItem value="receber">Contas a Receber</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-relatorio">Status das Contas *</Label>
              <Select value={statusRelatorio} onValueChange={(value: 'aberto' | 'baixadas' | 'todas') => setStatusRelatorio(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="aberto">Em Aberto</SelectItem>
                  <SelectItem value="baixadas">Baixadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 2: Tipo de Data e Período */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-data">Tipo de Data *</Label>
              <Select value={tipoData} onValueChange={(value: 'vencimento' | 'baixa') => setTipoData(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vencimento">Data de Vencimento</SelectItem>
                  <SelectItem value="baixa">Data de Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Início *</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim *</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          {/* Linha 3: Tipo de Destino e Destino */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-destino">Tipo de Destino</Label>
              <Select value={tipoDestino} onValueChange={(value: 'cliente' | 'fornecedor' | '') => {
                setTipoDestino(value);
                setDestinoId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="cliente">Clientes</SelectItem>
                  <SelectItem value="fornecedor">Fornecedores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoDestino && (
              <div className="space-y-2">
                <Label htmlFor="destino">
                  {tipoDestino === 'cliente' ? 'Cliente' : 'Fornecedor'}
                </Label>
                <Select value={destinoId} onValueChange={setDestinoId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Selecione ${tipoDestino === 'cliente' ? 'o cliente' : 'o fornecedor'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {(tipoDestino === 'cliente' ? clientes : fornecedores).map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Botão Gerar Relatório */}
          <div className="flex justify-center">
            <Button 
              onClick={gerarRelatorio}
              disabled={!isFormValid()}
              className="w-full md:w-auto"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Gerar Relatório PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioContas;
