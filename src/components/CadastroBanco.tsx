
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Banco {
  id: string;
  nome: string;
  agencia: string;
  conta: string;
  saldo: number;
  tipo_banco: string;
  ativo: boolean;
}

const CadastroBanco = () => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    agencia: '',
    conta: '',
    tipo_banco: 'CC' as 'CC' | 'CP' | 'Invest',
    saldo: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    carregarBancos();
  }, []);

  const carregarBancos = async () => {
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.tipo_banco || !formData.saldo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('bancos')
      .insert({
        nome: formData.nome,
        agencia: formData.agencia || null,
        conta: formData.conta || null,
        tipo_banco: formData.tipo_banco,
        saldo: parseFloat(formData.saldo)
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar banco",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Banco cadastrado com sucesso"
      });
      
      setFormData({
        nome: '',
        agencia: '',
        conta: '',
        tipo_banco: 'CC',
        saldo: ''
      });
      
      carregarBancos();
    }
  };

  const alternarAtivo = async (id: string, ativo: boolean) => {
    const { error } = await supabase
      .from('bancos')
      .update({ ativo: !ativo })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar banco",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: `Banco ${!ativo ? 'ativado' : 'desativado'} com sucesso`
      });
      carregarBancos();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulário de Cadastro */}
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Banco</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do Banco *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome do banco"
                required
              />
            </div>

            <div>
              <Label htmlFor="tipo_banco">Tipo do Banco *</Label>
              <Select value={formData.tipo_banco} onValueChange={(value) => setFormData({...formData, tipo_banco: value as 'CC' | 'CP' | 'Invest'})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC">Conta Corrente</SelectItem>
                  <SelectItem value="CP">Conta Poupança</SelectItem>
                  <SelectItem value="Invest">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="agencia">Agência</Label>
              <Input
                id="agencia"
                value={formData.agencia}
                onChange={(e) => setFormData({...formData, agencia: e.target.value})}
                placeholder="Número da agência"
              />
            </div>

            <div>
              <Label htmlFor="conta">Conta</Label>
              <Input
                id="conta"
                value={formData.conta}
                onChange={(e) => setFormData({...formData, conta: e.target.value})}
                placeholder="Número da conta"
              />
            </div>

            <div>
              <Label htmlFor="saldo">Saldo Inicial *</Label>
              <Input
                id="saldo"
                type="number"
                step="0.01"
                value={formData.saldo}
                onChange={(e) => setFormData({...formData, saldo: e.target.value})}
                placeholder="0,00"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Cadastrar Banco
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Bancos */}
      <Card>
        <CardHeader>
          <CardTitle>Bancos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Agência</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bancos.map((banco) => (
                  <TableRow key={banco.id}>
                    <TableCell>{banco.nome}</TableCell>
                    <TableCell>{banco.tipo_banco}</TableCell>
                    <TableCell>{banco.agencia || '-'}</TableCell>
                    <TableCell>{banco.conta || '-'}</TableCell>
                    <TableCell>R$ {banco.saldo.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        banco.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {banco.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={banco.ativo ? "destructive" : "default"}
                        onClick={() => alternarAtivo(banco.id, banco.ativo)}
                      >
                        {banco.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastroBanco;
