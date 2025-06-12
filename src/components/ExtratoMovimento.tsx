
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Download } from 'lucide-react';
import { useExtratoData, MovimentacaoExtrato } from '@/hooks/useExtratoData';

const ExtratoMovimento = () => {
  const { bancos, movimentacoes, carregarMovimentacoes } = useExtratoData();
  const [bancoId, setBancoId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

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
          <title>Extrato do Movimento</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 20mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #2d3748;
              line-height: 1.5;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
            }
            
            .container {
              background: white;
              border-radius: 16px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              padding: 40px;
              margin: 20px auto;
              max-width: 100%;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 4px solid #4299e1;
              padding-bottom: 30px;
            }
            
            .header h1 {
              color: #2b6cb0;
              font-size: 36px;
              font-weight: 800;
              margin-bottom: 12px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .header .subtitle {
              color: #718096;
              font-size: 18px;
              font-weight: 500;
              margin-bottom: 8px;
            }
            
            .bank-info {
              background: linear-gradient(135deg, #ebf8ff 0%, #e6fffa 100%);
              border: 2px solid #bee3f8;
              border-radius: 16px;
              padding: 25px;
              margin-bottom: 30px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            
            .bank-info h3 {
              color: #2c5282;
              font-size: 22px;
              font-weight: 700;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
            }
            
            .bank-info h3:before {
              content: "🏦";
              margin-right: 12px;
              font-size: 20px;
            }
            
            .bank-details {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
            }
            
            .bank-detail {
              background: white;
              padding: 15px;
              border-radius: 12px;
              border-left: 5px solid #4299e1;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .detail-label {
              font-weight: 700;
              color: #2d3748;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .detail-value {
              color: #4a5568;
              font-size: 16px;
              margin-top: 5px;
              font-weight: 600;
            }
            
            .table-container {
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
              margin-bottom: 30px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
            
            th {
              background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
              color: white;
              padding: 18px 15px;
              text-align: left;
              font-weight: 700;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            th:first-child {
              border-top-left-radius: 16px;
            }
            
            th:last-child {
              border-top-right-radius: 16px;
            }
            
            td {
              padding: 15px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
            }
            
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            
            tr:hover {
              background-color: #edf2f7;
              transform: scale(1.001);
              transition: all 0.2s ease;
            }
            
            .text-right {
              text-align: right;
              font-weight: 700;
            }
            
            .valor-credito {
              color: #38a169;
              font-weight: 700;
            }
            
            .valor-debito {
              color: #e53e3e;
              font-weight: 700;
            }
            
            .saldo-positivo {
              color: #38a169;
              font-weight: 700;
            }
            
            .saldo-negativo {
              color: #e53e3e;
              font-weight: 700;
            }
            
            .summary-section {
              background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
              color: white;
              padding: 30px;
              border-radius: 16px;
              margin-top: 30px;
            }
            
            .summary-title {
              font-size: 24px;
              font-weight: 800;
              margin-bottom: 20px;
              text-align: center;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 25px;
            }
            
            .summary-card {
              background: rgba(255, 255, 255, 0.1);
              padding: 20px;
              border-radius: 12px;
              text-align: center;
              backdrop-filter: blur(10px);
            }
            
            .summary-card h4 {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 10px;
              opacity: 0.9;
            }
            
            .summary-card .value {
              font-size: 28px;
              font-weight: 800;
            }
            
            @media print {
              body {
                background: white !important;
              }
              .container {
                box-shadow: none;
                margin: 0;
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Extrato do Movimento</h1>
              <div class="subtitle">Extrato Bancário Detalhado</div>
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
                  <div class="detail-value">${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>📅 Data</th>
                    <th>📝 Descrição</th>
                    <th>🔢 Nº Nota</th>
                    <th>💰 Valor</th>
                    <th>💳 Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  ${movimentacoes.map(mov => {
                    const isCredito = mov.tipo === 'credito' || mov.tipo === 'baixa_receber';
                    return `
                      <tr>
                        <td>${new Date(mov.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td><strong>${mov.descricao}</strong></td>
                        <td>${mov.numero_nota || '-'}</td>
                        <td class="text-right ${isCredito ? 'valor-credito' : 'valor-debito'}">
                          ${isCredito ? '+' : '-'} R$ ${mov.valor.toFixed(2).replace('.', ',')}
                        </td>
                        <td class="text-right ${mov.saldo_acumulado >= 0 ? 'saldo-positivo' : 'saldo-negativo'}">
                          R$ ${mov.saldo_acumulado.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="summary-section">
              <div class="summary-title">💼 Resumo do Período</div>
              <div class="summary-grid">
                <div class="summary-card">
                  <h4>Total de Movimentações</h4>
                  <div class="value">${movimentacoes.length}</div>
                </div>
                <div class="summary-card">
                  <h4>Total Créditos</h4>
                  <div class="value">R$ ${movimentacoes
                    .filter(m => m.tipo === 'credito' || m.tipo === 'baixa_receber')
                    .reduce((sum, m) => sum + m.valor, 0)
                    .toFixed(2).replace('.', ',')}</div>
                </div>
                <div class="summary-card">
                  <h4>Total Débitos</h4>
                  <div class="value">R$ ${movimentacoes
                    .filter(m => m.tipo === 'debito' || m.tipo === 'baixa_pagar')
                    .reduce((sum, m) => sum + m.valor, 0)
                    .toFixed(2).replace('.', ',')}</div>
                </div>
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
    return bancoId && dataInicio && dataFim;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Extrato do Movimento</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="banco">Banco *</Label>
            <Select value={bancoId} onValueChange={setBancoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o banco" />
              </SelectTrigger>
              <SelectContent>
                {bancos.map((banco) => (
                  <SelectItem key={banco.id} value={banco.id}>
                    {banco.nome} - Ag: {banco.agencia} Conta: {banco.conta}
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
