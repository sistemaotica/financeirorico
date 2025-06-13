
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Download } from 'lucide-react';
import { useExtratoData, MovimentacaoExtrato } from '@/hooks/useExtratoData';

const ExtratoMovimento = () => {
  const { bancos, movimentacoes, conciliacao, carregarMovimentacoes } = useExtratoData();
  const [bancoId, setBancoId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const formatarValor = (valor: number) => {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateForDisplay = (dateString: string) => {
    // Cria uma data local sem considerar timezone
    const [year, month, day] = dateString.split('-');
    const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return localDate.toLocaleDateString('pt-BR');
  };

  const gerarExtrato = async () => {
    if (!bancoId || !dataInicio || !dataFim) {
      return;
    }

    await carregarMovimentacoes(bancoId, dataInicio, dataFim);
    gerarPDF();
  };

  const gerarPDF = () => {
    const bancoSelecionado = bancos.find(b => b.id === bancoId);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Extrato do Movimento</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 8mm 10mm 8mm;
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
              font-size: 11px;
              background: white;
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
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
              text-align: center;
            }
            
            .header .subtitle {
              color: #718096;
              font-size: 12px;
              margin-bottom: 3px;
              text-align: center;
            }
            
            .bank-info {
              background: #f7fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 8px;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            
            .bank-info h3 {
              color: #2c5282;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 6px;
              text-align: center;
            }
            
            .bank-details {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              flex-wrap: wrap;
            }
            
            .bank-detail {
              background: white;
              padding: 6px;
              border-radius: 4px;
              border-left: 2px solid #4299e1;
              flex: 1;
              min-width: 120px;
            }
            
            .detail-label {
              font-weight: bold;
              color: #2d3748;
              font-size: 8px;
              text-transform: uppercase;
              text-align: center;
            }
            
            .detail-value {
              color: #4a5568;
              font-size: 9px;
              margin-top: 2px;
              text-align: center;
            }

            .conciliacao-section {
              background: #f0fff4;
              border: 1px solid #9ae6b4;
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }

            .conciliacao-title {
              color: #276749;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
              text-align: center;
            }

            .conciliacao-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
            }

            .conciliacao-item {
              background: white;
              padding: 8px;
              border-radius: 4px;
              text-align: center;
              border-left: 2px solid #48bb78;
            }

            .conciliacao-label {
              font-weight: bold;
              color: #2d3748;
              font-size: 7px;
              margin-bottom: 2px;
              text-transform: uppercase;
              text-align: center;
            }

            .conciliacao-value {
              font-size: 9px;
              font-weight: bold;
              color: #276749;
              text-align: center;
            }

            .valor-positivo {
              color: #38a169;
            }

            .valor-negativo {
              color: #e53e3e;
            }
            
            .table-container {
              background: white;
              border-radius: 6px;
              overflow: hidden;
              margin-bottom: 15px;
              border: 1px solid #e2e8f0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9px;
              page-break-inside: auto;
            }
            
            th {
              background: #4299e1;
              color: white;
              padding: 8px 4px;
              text-align: center;
              font-weight: bold;
              font-size: 9px;
              border-bottom: 1px solid #3182ce;
              page-break-inside: avoid;
              page-break-after: avoid;
            }
            
            td {
              padding: 6px 4px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 8px;
              word-wrap: break-word;
              max-width: 100px;
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
              background-color: #f8fafc;
            }
            
            .text-right {
              text-align: center;
              font-weight: bold;
            }
            
            .valor-credito {
              color: #38a169;
              font-weight: bold;
            }
            
            .valor-debito {
              color: #e53e3e;
              font-weight: bold;
            }
            
            .saldo-positivo {
              color: #38a169;
              font-weight: bold;
            }
            
            .saldo-negativo {
              color: #e53e3e;
              font-weight: bold;
            }
            
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 7px;
              color: #718096;
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
              page-break-inside: avoid;
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
              
              .conciliacao-grid {
                grid-template-columns: repeat(5, 1fr);
              }
            }
            
            /* Ajustes para dispositivos móveis */
            @media screen and (max-width: 768px) {
              body {
                font-size: 9px;
              }
              
              .header h1 {
                font-size: 16px;
              }
              
              .header .subtitle {
                font-size: 10px;
              }
              
              .bank-details {
                flex-direction: column;
              }
              
              .conciliacao-grid {
                grid-template-columns: repeat(2, 1fr);
              }
              
              table {
                font-size: 7px;
              }
              
              th, td {
                padding: 3px 2px;
                font-size: 7px;
              }
              
              .bank-info h3 {
                font-size: 10px;
              }
              
              .conciliacao-title {
                font-size: 12px;
              }
            }
            
            /* Configurações para tablets */
            @media screen and (min-width: 769px) and (max-width: 1024px) {
              body {
                font-size: 10px;
              }
              
              .header h1 {
                font-size: 18px;
              }
              
              table {
                font-size: 8px;
              }
              
              th, td {
                padding: 4px 3px;
                font-size: 8px;
              }
              
              .conciliacao-grid {
                grid-template-columns: repeat(3, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Extrato do Movimento</h1>
              <div class="subtitle">Conciliação Bancária Detalhada</div>
              <div class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
            
            <div class="bank-info">
              <h3>Informações do Banco</h3>
              <div class="bank-details">
                <div class="bank-detail">
                  <div class="detail-label">Banco</div>
                  <div class="detail-value">${bancoSelecionado?.nome || 'N/A'}</div>
                </div>
                <div class="bank-detail">
                  <div class="detail-label">Agência</div>
                  <div class="detail-value">${bancoSelecionado?.agencia || 'N/A'}</div>
                </div>
                <div class="bank-detail">
                  <div class="detail-label">Conta</div>
                  <div class="detail-value">${bancoSelecionado?.conta || 'N/A'}</div>
                </div>
                <div class="bank-detail">
                  <div class="detail-label">Período</div>
                  <div class="detail-value">${formatDateForDisplay(dataInicio)} a ${formatDateForDisplay(dataFim)}</div>
                </div>
              </div>
            </div>

            ${conciliacao ? `
            <div class="conciliacao-section">
              <div class="conciliacao-title">💰 Conciliação Bancária</div>
              <div class="conciliacao-grid">
                <div class="conciliacao-item">
                  <div class="conciliacao-label">Saldo Inicial</div>
                  <div class="conciliacao-value ${conciliacao.saldoInicial >= 0 ? 'valor-positivo' : 'valor-negativo'}">
                    R$ ${conciliacao.saldoInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div class="conciliacao-item">
                  <div class="conciliacao-label">Total Entradas</div>
                  <div class="conciliacao-value valor-positivo">
                    + R$ ${conciliacao.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div class="conciliacao-item">
                  <div class="conciliacao-label">Total Saídas</div>
                  <div class="conciliacao-value valor-negativo">
                    - R$ ${conciliacao.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div class="conciliacao-item">
                  <div class="conciliacao-label">Saldo Final</div>
                  <div class="conciliacao-value ${conciliacao.saldoFinal >= 0 ? 'valor-positivo' : 'valor-negativo'}">
                    R$ ${conciliacao.saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div class="conciliacao-item">
                  <div class="conciliacao-label">Movimentações</div>
                  <div class="conciliacao-value">
                    ${conciliacao.quantidadeMovimentacoes} registros
                  </div>
                </div>
              </div>
            </div>
            ` : ''}

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 12%;">Data</th>
                    <th style="width: 45%;">Descrição</th>
                    <th style="width: 13%;">Nº Nota</th>
                    <th style="width: 15%;">Valor</th>
                    <th style="width: 15%;">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  ${movimentacoes.map(mov => {
                    const isCredito = mov.tipo === 'credito' || mov.tipo === 'baixa_receber';
                    return `
                      <tr>
                        <td>${formatDateForDisplay(mov.data)}</td>
                        <td style="word-break: break-word; overflow-wrap: break-word;">${mov.descricao}</td>
                        <td>${mov.numero_nota || '-'}</td>
                        <td class="text-right ${isCredito ? 'valor-credito' : 'valor-debito'}">
                          ${isCredito ? '+' : '-'} R$ ${mov.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td class="text-right ${mov.saldo_acumulado >= 0 ? 'saldo-positivo' : 'saldo-negativo'}">
                          R$ ${mov.saldo_acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="footer">
              © 2025 FINANCEIRO - RICCO. Todos os direitos reservados a @RICARDOCACTUS.
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
    return bancoId && dataInicio && dataFim;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 p-2 md:p-0">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
            <FileText className="w-5 h-5" />
            <span>Extrato do Movimento</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="banco">Banco *</Label>
            <Select value={bancoId} onValueChange={setBancoId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o banco" />
              </SelectTrigger>
              <SelectContent>
                {bancos.map((banco) => (
                  <SelectItem key={banco.id} value={banco.id}>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium">{banco.nome}</span>
                      <span className="text-sm text-gray-500 sm:ml-2">
                        Ag: {banco.agencia} Conta: {banco.conta}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Início *</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim *</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {conciliacao && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 text-lg">Conciliação Bancária</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-600 text-xs font-medium">Saldo Inicial</div>
                    <div className={`font-bold text-sm md:text-base ${conciliacao.saldoInicial >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatarValor(conciliacao.saldoInicial)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs font-medium">Total Entradas</div>
                    <div className="font-bold text-green-600 text-sm md:text-base">
                      + {formatarValor(conciliacao.totalEntradas)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs font-medium">Total Saídas</div>
                    <div className="font-bold text-red-600 text-sm md:text-base">
                      - {formatarValor(conciliacao.totalSaidas)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-xs font-medium">Saldo Final</div>
                    <div className={`font-bold text-sm md:text-base ${conciliacao.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatarValor(conciliacao.saldoFinal)}
                    </div>
                  </div>
                  <div className="text-center col-span-2 md:col-span-1">
                    <div className="text-gray-600 text-xs font-medium">Movimentações</div>
                    <div className="font-bold text-blue-600 text-sm md:text-base">
                      {conciliacao.quantidadeMovimentacoes} registros
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button 
              onClick={gerarExtrato}
              disabled={!isFormValid()}
              className="w-full md:w-auto"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Gerar Extrato PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtratoMovimento;
