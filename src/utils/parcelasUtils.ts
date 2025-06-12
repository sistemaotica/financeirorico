
export const gerarParcelas = (valorTotal: number, numParcelas: number, dataVencimento: string) => {
  const parcelas = [];
  const valorParcela = valorTotal / numParcelas;
  
  // Usar a data exatamente como informada pelo usuário (sem conversão de timezone)
  const [ano, mes, dia] = dataVencimento.split('-').map(Number);

  for (let i = 0; i < numParcelas; i++) {
    let dataVenc: Date;
    
    if (i === 0) {
      // Primeira parcela: usar exatamente a data informada
      dataVenc = new Date(ano, mes - 1, dia);
    } else {
      // Demais parcelas: adicionar meses mantendo o mesmo dia
      dataVenc = new Date(ano, mes - 1 + i, dia);
      
      // Verificar se o dia existe no mês de destino (ex: 31 de janeiro -> 28/29 de fevereiro)
      if (dataVenc.getDate() !== dia) {
        // Se o dia não existe, usar o último dia do mês
        dataVenc = new Date(ano, mes + i, 0);
      }
    }
    
    // Converter para string no formato YYYY-MM-DD usando UTC para evitar problemas de timezone
    const dataVencString = dataVenc.getFullYear() + '-' + 
      String(dataVenc.getMonth() + 1).padStart(2, '0') + '-' + 
      String(dataVenc.getDate()).padStart(2, '0');
    
    parcelas.push({
      valor: valorParcela,
      data_vencimento: dataVencString,
      parcela_numero: i + 1,
      parcela_total: numParcelas
    });
  }

  return parcelas;
};
