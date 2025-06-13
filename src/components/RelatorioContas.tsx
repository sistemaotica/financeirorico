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
  const [tipoDestino, setTipoDestino] = useState<'cliente' | 'fornecedor' | 'todos' | ''>('');
  const [destinoId, setDestinoId] = useState('');

  const formatarValor = (valor: number) => {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateForDisplay = (dateString: string) => {
    // Garantir que a data seja exibida exatamente como está no banco, sem conversão de timezone
    const [year, month, day] = dateString.split('-');
    const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return localDate.toLocaleDateString('pt-BR');
  };

  const gerarRelatorio = () => {
    console.log('Gerando relatório com filtros:', {
      tipoRelatorio,
      statusRelatorio,
      tipoData,
      dataInicio,
      dataFim,
      tipoDestino,
      destinoId
    });

    // Filtrar contas baseado nos critérios selecionados
    let contasFiltradas = [...contas];

    if (tipoRelatorio) {
      contasFiltradas = contasFiltradas.filter(conta => conta.tipo === tipoRelatorio);
    }

    if (statusRelatorio) {
      if (statusRelatorio === 'aberto') {
        contasFiltradas = contasFiltradas.filter(conta => conta.valor_baixa < conta.valor);
      } else if (statusRelatorio === 'baixadas') {
        contasFiltradas = contasFiltradas.filter(conta => conta.valor_baixa >= conta.valor);
      }
    }

    if (tipoDestino) {
      contasFiltradas = contasFiltradas.filter(conta => conta.destino_tipo === tipoDestino);
    }

    if (destinoId) {
      if (tipoDestino === 'cliente') {
        contasFiltradas = contasFiltradas.filter(conta => conta.cliente_id === destinoId);
      } else if (tipoDestino === 'fornecedor') {
        contasFiltradas = contasFiltradas.filter(conta => conta.fornecedor_id === destinoId);
      }
    }

    if (dataInicio && dataFim) {
      contasFiltradas = contasFiltradas.filter(conta => {
        const dataComparacao = tipoData === 'baixa' ? conta.data_pagamento : conta.data_vencimento;
        if (!dataComparacao) return false;
        
        // Usar comparação direta de strings de data (YYYY-MM-DD) para evitar problemas de timezone
        return dataComparacao >= dataInicio && dataComparacao <= dataFim;
      });
    }

    console.log('Contas filtradas:', contasFiltradas.length);
    gerarPDF(contasFiltradas);
  };

  const gerarPDF = (contasFiltradas: Conta[]) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório de Contas</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 8mm 6mm 8mm 6mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Arial', 'Helvetica', sans-serif;
              color: #2d3748;
              line-height: 1.3;
              background: white;
              font-size: 12px;
            }
            
            .container {
              width: 100%;
              max-width: 100%;
              padding: 0;
            }
            
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 2px solid #4299e1;
              padding-bottom: 10px;
              page-break-inside: avoid;
            }
            
            .header h1 {
              color: #2b6cb0;
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 5px;
              text-align: center;
            }
            
            .header .subtitle {
              color: #718096;
              font-size: 14px;
              font-weight: 500;
              text-align: center;
            }
            
            .filters {
              background: #ebf8ff;
              border: 1px solid #bee3f8;
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            
            .filters h3 {
              color: #2c5282;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 10px;
              text-align: center;
            }
            
            .filter-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
            }
            
            .filter-item {
              background: white;
              padding: 10px;
              border-radius: 4px;
              border-left: 3px solid #4299e1;
              text-align: center;
            }
            
            .filter-label {
              font-weight: 600;
              color: #2d3748;
              font-size: 11px;
              text-align: center;
            }
            
            .filter-value {
              color: #4a5568;
              font-size: 11px;
              margin-top: 2px;
              text-align: center;
            }
            
            .table-container {
              background: white;
              border-radius: 6px;
              overflow: hidden;
              margin-bottom: 15px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
              page-break-inside: auto;
            }
            
            th {
              background: #4299e1;
              color: white;
              padding: 10px 6px;
              text-align: center;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              page-break-inside: avoid;
              page-break-after: avoid;
            }
            
            td {
              padding: 8px 6px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 10px;
              word-wrap: break-word;
              max-width: 80px;
              vertical-align: middle;
              text-align: center;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            tbody tr {
              page-break-inside: avoid;
            }
            
            tr:nth-child(even) {
              background-color: #f7fafc;
            }
            
            .text-right {
              text-align: center;
              font-weight: 600;
            }
            
            .valor-positivo {
              color: #38a169;
            }
            
            .valor-negativo {
              color: #e53e3e;
            }
            
            .total-row {
              background: #2d3748 !important;
              color: white !important;
              font-weight: 700;
              font-size: 11px;
            }
            
            .total-row td {
              border-bottom: none;
              padding: 12px 6px;
              text-align: center;
            }
            
            .summary-cards {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-top: 15px;
            }
            
            .summary-card {
              background: #667eea;
              color: white;
              padding: 15px;
              border-radius: 6px;
              text-align: center;
            }
            
            .summary-card h4 {
              font-size: 11px;
              font-weight: 600;
              margin-bottom: 6px;
              opacity: 0.9;
              text-align: center;
            }
            
            .summary-card .value {
              font-size: 15px;
              font-weight: 700;
              text-align: center;
            }
            
            .status-badge {
              display: inline-block;
              padding: 3px 6px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
              text-align: center;
            }
            
            .status-aberto {
              background-color: #fed7d7;
              color: #c53030;
            }
            
            .status-pago {
              background-color: #c6f6d5;
              color: #2f855a;
            }
            
            /* Configurações específicas para impressão */
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              
              .container {
                padding: 0;
                margin: 0;
              }
              
              .table-container {
                page-break-inside: auto;
              }
              
              tr {
                page-break-inside: avoid;
              }
              
              thead {
                display: table-header-group;
              }
              
              tfoot {
                display: table-footer-group;
              }
              
              tbody {
                display: table-row-group;
              }
            }
            
            /* Ajustes para dispositivos móveis */
            @media screen and (max-width: 768px) {
              @page {
                size: A4 portrait;
                margin: 10mm 8mm 10mm 8mm;
              }
              
              body {
                font-size: 10px;
              }
              
              .header h1 {
                font-size: 20px;
              }
              
              .header .subtitle {
                font-size: 12px;
              }
              
              .filter-grid {
                grid-template-columns: repeat(2, 1fr);
              }
              
              table {
                font-size: 8px;
              }
              
              th, td {
                padding: 4px 3px;
                font-size: 8px;
              }
              
              .summary-cards {
                grid-template-columns: 1fr;
              }
              
              .status-badge {
                font-size: 7px;
                padding: 2px 4px;
              }
            }
            
            /* Configurações para tablets */
            @media screen and (min-width: 769px) and (max-width: 1024px) {
              body {
                font-size: 11px;
              }
              
              .header h1 {
                font-size: 22px;
              }
              
              table {
                font-size: 9px;
              }
              
              th, td {
                padding: 6px 4px;
                font-size: 9px;
              }
              
              .filter-grid {
                grid-template-columns: repeat(3, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Relatório de Contas</h1>
              <div class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
            
            <div class="filters">
              <h3>🔍 Filtros Aplicados</h3>
              <div class="filter-grid">
                <div class="filter-item">
                  <div class="filter-label">Tipo de Conta</div>
                  <div class="filter-value">${tipoRelatorio === 'pagar' ? '💰 Contas a Pagar' : tipoRelatorio === 'receber' ? '💳 Contas a Receber' : '📋 Todas'}</div>
                </div>
                <div class="filter-item">
                  <div class="filter-label">Status</div>
                  <div class="filter-value">${statusRelatorio === 'aberto' ? '🔓 Em Aberto' : statusRelatorio === 'baixadas' ? '✅ Baixadas' : '📊 Todas'}</div>
                </div>
                <div class="filter-item">
                  <div class="filter-label">Período</div>
                  <div class="filter-value">${dataInicio && dataFim ? `📅 ${formatDateForDisplay(dataInicio)} a ${formatDateForDisplay(dataFim)}` : '🗓️ Sem filtro'}</div>
                </div>
                <div class="filter-item">
                  <div class="filter-label">Destino</div>
                  <div class="filter-value">${tipoDestino ? (tipoDestino === 'cliente' ? '👥 Clientes' : '🏢 Fornecedores') : '🌐 Todos'}</div>
                </div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 10%;">📅 Venc.</th>
                    <th style="width: 20%;">👤 Cliente/Fornec.</th>
                    <th style="width: 20%;">📝 Referência</th>
                    <th style="width: 8%;">🔢 Parc.</th>
                    <th style="width: 10%;">📄 Nº Nota</th>
                    <th style="width: 10%;">💰 V. Total</th>
                    <th style="width: 10%;">✅ V. Baixado</th>
                    <th style="width: 10%;">📊 Saldo</th>
                    <th style="width: 7%;">🏷️ Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${contasFiltradas.map(conta => {
                    const saldo = conta.valor - (conta.valor_baixa || 0);
                    const status = saldo > 0 ? 'aberto' : 'pago';
                    return `
                      <tr>
                        <td>${formatDateForDisplay(conta.data_vencimento)}</td>
                        <td style="word-break: break-word; overflow-wrap: break-word;"><strong>${conta.destino_tipo === 'cliente' ? conta.clientes?.nome || 'N/A' : conta.fornecedores?.nome || 'N/A'}</strong></td>
                        <td style="word-break: break-word; overflow-wrap: break-word;">${conta.referencia}</td>
                        <td>${conta.parcela_numero}/${conta.parcela_total}</td>
                        <td>${conta.numero_nota || '-'}</td>
                        <td class="text-right">R$ ${conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="text-right valor-positivo">R$ ${(conta.valor_baixa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="text-right ${saldo > 0 ? 'valor-negativo' : 'valor-positivo'}">R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td><span class="status-badge status-${status}">${status === 'aberto' ? 'Aberto' : 'Pago'}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="5"><strong>🎯 TOTAIS GERAIS</strong></td>
                    <td class="text-right"><strong>R$ ${contasFiltradas.reduce((sum, conta) => sum + conta.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                    <td class="text-right"><strong>R$ ${contasFiltradas.reduce((sum, conta) => sum + (conta.valor_baixa || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                    <td class="text-right"><strong>R$ ${contasFiltradas.reduce((sum, conta) => sum + (conta.valor - (conta.valor_baixa || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                    <td class="text-right"><strong>${contasFiltradas.length} contas</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div class="summary-cards">
              <div class="summary-card">
                <h4>Total de Contas</h4>
                <div class="value">${contasFiltradas.length}</div>
              </div>
              <div class="summary-card">
                <h4>Valor Total</h4>
                <div class="value">R$ ${contasFiltradas.reduce((sum, conta) => sum + conta.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div class="summary-card">
                <h4>Saldo Pendente</h4>
                <div class="value">R$ ${contasFiltradas.reduce((sum, conta) => sum + (conta.valor - (conta.valor_baixa || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const novaAba = window.open('', '_blank');
    if (novaAba) {
      novaAba.document.write(htmlContent);
      novaAba.document.close();
      
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-destino">Tipo de Destino</Label>
              <Select value={tipoDestino} onValueChange={(value: 'cliente' | 'fornecedor' | 'todos') => {
                setTipoDestino(value === 'todos' ? '' : value as 'cliente' | 'fornecedor');
                setDestinoId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
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
                <Select value={destinoId} onValueChange={(value) => setDestinoId(value === 'todos' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Selecione ${tipoDestino === 'cliente' ? 'o cliente' : 'o fornecedor'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
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
