import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download } from 'lucide-react';
import EditLancamentoDialog from './dialogs/EditLancamentoDialog';

interface Banco {
  id: string;
  nome: string;
  agencia: string;
  conta: string;
  saldo: number;
}

interface Lancamento {
  id: string;
  data: string;
  banco_id: string;
  tipo: 'credito' | 'debito';
  descricao: string;
  valor: number;
  numero_nota_fiscal: string;
  bancos: {
    nome: string;
  };
}

const Lancamentos = () => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState<Lancamento | null>(null);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    banco_id: '',
    tipo: 'credito' as 'credito' | 'debito',
    descricao: '',
    valor: '',
    numero_nota_fiscal: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    carregarBancos();
    carregarLancamentos();
  }, []);

  const carregarBancos = async () => {
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar bancos",
        variant: "destructive"
      });
    } else {
      setBancos(data || []);
    }
  };

  const carregarLancamentos = async () => {
    const { data, error } = await supabase
      .from('lancamentos')
      .select(`
        *,
        bancos (nome)
      `)
      .order('data', { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar lançamentos",
        variant: "destructive"
      });
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        tipo: item.tipo as 'credito' | 'debito'
      }));
      setLancamentos(typedData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.banco_id || !formData.descricao || !formData.valor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('lancamentos')
      .insert({
        data: formData.data,
        banco_id: formData.banco_id,
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        numero_nota_fiscal: formData.numero_nota_fiscal || null
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar lançamento",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Lançamento salvo com sucesso"
      });
      
      setFormData({
        data: new Date().toISOString().split('T')[0],
        banco_id: '',
        tipo: 'credito',
        descricao: '',
        valor: '',
        numero_nota_fiscal: ''
      });
      
      carregarLancamentos();
      carregarBancos();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir lançamento",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Lançamento excluído com sucesso"
        });
        carregarLancamentos();
        carregarBancos();
      }
    }
  };

  const gerarRelatorioPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório de Lançamentos</title>
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
              font-size: 10px;
              line-height: 1.3;
              color: #2d3748;
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
              padding-bottom: 10px;
              border-bottom: 2px solid #4299e1;
              page-break-inside: avoid;
            }
            
            .header h1 {
              color: #2b6cb0;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .header .subtitle {
              color: #718096;
              font-size: 11px;
              margin-bottom: 3px;
            }
            
            .info-section {
              background: #f7fafc;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 10px;
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
              border-bottom: 1px solid #e2e8f0;
              font-size: 9px;
            }
            
            .info-label {
              font-weight: bold;
              color: #4a5568;
            }
            
            .info-value {
              color: #2d3748;
            }
            
            .table-container {
              width: 100%;
              margin-bottom: 15px;
              overflow: hidden;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
              page-break-inside: auto;
            }
            
            th {
              background: #4299e1;
              color: white;
              padding: 6px 4px;
              text-align: left;
              font-weight: bold;
              font-size: 8px;
              border: 1px solid #3182ce;
              page-break-inside: avoid;
              page-break-after: avoid;
            }
            
            td {
              padding: 4px 3px;
              border: 1px solid #e2e8f0;
              font-size: 7px;
              word-wrap: break-word;
              max-width: 120px;
              vertical-align: top;
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
              text-align: right;
            }
            
            .valor-credito {
              color: #38a169;
              font-weight: bold;
            }
            
            .valor-debito {
              color: #e53e3e;
              font-weight: bold;
            }
            
            .tipo-badge {
              padding: 1px 4px;
              border-radius: 2px;
              font-size: 6px;
              font-weight: bold;
              text-transform: uppercase;
            }
            
            .tipo-credito {
              background: #c6f6d5;
              color: #22543d;
            }
            
            .tipo-debito {
              background: #fed7d7;
              color: #742a2a;
            }
            
            .footer {
              margin-top: 15px;
              text-align: center;
              font-size: 8px;
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
              
              .page-break {
                page-break-before: always;
              }
            }
            
            /* Ajustes para dispositivos móveis */
            @media screen and (max-width: 768px) {
              body {
                font-size: 8px;
              }
              
              .header h1 {
                font-size: 14px;
              }
              
              .header .subtitle {
                font-size: 9px;
              }
              
              .info-grid {
                grid-template-columns: 1fr;
              }
              
              table {
                font-size: 6px;
              }
              
              th, td {
                padding: 2px;
                font-size: 6px;
              }
              
              .tipo-badge {
                font-size: 5px;
                padding: 1px 2px;
              }
            }
            
            /* Configurações para tablets */
            @media screen and (min-width: 769px) and (max-width: 1024px) {
              body {
                font-size: 9px;
              }
              
              .header h1 {
                font-size: 16px;
              }
              
              table {
                font-size: 7px;
              }
              
              th, td {
                padding: 3px;
                font-size: 7px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Relatório de Lançamentos</h1>
              <div class="subtitle">Sistema Financeiro RICCO</div>
              <div class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
            
            <div class="info-section">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Total de Lançamentos:</span>
                  <span class="info-value">${lancamentos.length} registros</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total Créditos:</span>
                  <span class="info-value valor-credito">R$ ${lancamentos.filter(l => l.tipo === 'credito').reduce((sum, l) => sum + l.valor, 0).toFixed(2)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total Débitos:</span>
                  <span class="info-value valor-debito">R$ ${lancamentos.filter(l => l.tipo === 'debito').reduce((sum, l) => sum + l.valor, 0).toFixed(2)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Saldo Líquido:</span>
                  <span class="info-value">R$ ${(lancamentos.filter(l => l.tipo === 'credito').reduce((sum, l) => sum + l.valor, 0) - lancamentos.filter(l => l.tipo === 'debito').reduce((sum, l) => sum + l.valor, 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th style="width: 12%;">Data</th>
                    <th style="width: 18%;">Banco</th>
                    <th style="width: 10%;">Tipo</th>
                    <th style="width: 40%;">Descrição</th>
                    <th style="width: 10%;">Nº Nota</th>
                    <th style="width: 10%;">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${lancamentos.map(lancamento => `
                    <tr>
                      <td>${new Date(lancamento.data).toLocaleDateString('pt-BR')}</td>
                      <td>${lancamento.bancos?.nome || 'N/A'}</td>
                      <td>
                        <span class="tipo-badge ${lancamento.tipo === 'credito' ? 'tipo-credito' : 'tipo-debito'}">
                          ${lancamento.tipo === 'credito' ? 'Créd.' : 'Déb.'}
                        </span>
                      </td>
                      <td style="word-break: break-word; overflow-wrap: break-word;">${lancamento.descricao}</td>
                      <td>${lancamento.numero_nota_fiscal || '-'}</td>
                      <td class="text-right ${lancamento.tipo === 'credito' ? 'valor-credito' : 'valor-debito'}">
                        ${lancamento.tipo === 'credito' ? '+' : '-'} R$ ${lancamento.valor.toFixed(2)}
                      </td>
                    </tr>
                  `).join('')}
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
      {/* Formulário de Lançamento */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg md:text-xl">
            Novo Lançamento
            <Button 
              onClick={gerarRelatorioPDF}
              size="sm"
              variant="outline"
              className="ml-2"
            >
              <Download className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Relatório PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value as 'credito' | 'debito'})}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="banco">Banco *</Label>
              <Select value={formData.banco_id} onValueChange={(value) => setFormData({...formData, banco_id: value})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="font-medium">{banco.nome}</span>
                        <span className="text-sm text-gray-500 sm:ml-2">
                          Ag: {banco.agencia} Conta: {banco.conta} (R$ {banco.saldo.toFixed(2)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descrição da movimentação"
                required
                className="w-full min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  placeholder="0,00"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="numero_nota_fiscal">Número da Nota Fiscal</Label>
                <Input
                  id="numero_nota_fiscal"
                  value={formData.numero_nota_fiscal}
                  onChange={(e) => setFormData({...formData, numero_nota_fiscal: e.target.value})}
                  placeholder="Número da nota fiscal"
                  className="w-full"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Salvar Lançamento
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Relatório de Movimentações */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Banco</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentos.map((lancamento) => (
                    <TableRow key={lancamento.id}>
                      <TableCell className="text-xs">{new Date(lancamento.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-xs">{lancamento.bancos?.nome}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          lancamento.tipo === 'credito' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {lancamento.tipo === 'credito' ? 'Crédito' : 'Débito'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-xs" title={lancamento.descricao}>
                        {lancamento.descricao}
                      </TableCell>
                      <TableCell className={`text-xs ${lancamento.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                        {lancamento.tipo === 'credito' ? '+' : '-'} R$ {lancamento.valor.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(lancamento.id)}
                          className="text-xs"
                        >
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile view */}
            <div className="md:hidden space-y-3">
              {lancamentos.map((lancamento) => (
                <Card key={lancamento.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{new Date(lancamento.data).toLocaleDateString('pt-BR')}</span>
                      <span className="text-xs text-gray-500">{lancamento.bancos?.nome}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      lancamento.tipo === 'credito' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {lancamento.tipo === 'credito' ? 'Crédito' : 'Débito'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm">{lancamento.descricao}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${lancamento.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                      {lancamento.tipo === 'credito' ? '+' : '-'} R$ {lancamento.valor.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(lancamento.id)}
                      className="text-xs"
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Lancamentos;
