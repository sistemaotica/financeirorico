
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Fornecedor {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  ativo: boolean;
}

const CadastroFornecedor = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    endereco: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome');

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar fornecedores",
        variant: "destructive"
      });
    } else {
      setFornecedores(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cpf_cnpj) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (editingFornecedor) {
      const { error } = await supabase
        .from('fornecedores')
        .update({
          nome: formData.nome,
          cpf_cnpj: formData.cpf_cnpj,
          email: formData.email || null,
          telefone: formData.telefone || null,
          endereco: formData.endereco || null
        })
        .eq('id', editingFornecedor.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar fornecedor",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Fornecedor atualizado com sucesso"
        });
        resetForm();
        carregarFornecedores();
      }
    } else {
      const { error } = await supabase
        .from('fornecedores')
        .insert({
          nome: formData.nome,
          cpf_cnpj: formData.cpf_cnpj,
          email: formData.email || null,
          telefone: formData.telefone || null,
          endereco: formData.endereco || null
        });

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao salvar fornecedor",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Fornecedor cadastrado com sucesso"
        });
        resetForm();
        carregarFornecedores();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf_cnpj: '',
      email: '',
      telefone: '',
      endereco: ''
    });
    setEditingFornecedor(null);
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setFormData({
      nome: fornecedor.nome,
      cpf_cnpj: fornecedor.cpf_cnpj || '',
      email: fornecedor.email || '',
      telefone: fornecedor.telefone || '',
      endereco: fornecedor.endereco || ''
    });
    setEditingFornecedor(fornecedor);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir fornecedor",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Fornecedor excluído com sucesso"
        });
        carregarFornecedores();
      }
    }
  };

  const alternarAtivo = async (id: string, ativo: boolean) => {
    const { error } = await supabase
      .from('fornecedores')
      .update({ ativo: !ativo })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar fornecedor",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: `Fornecedor ${!ativo ? 'ativado' : 'desativado'} com sucesso`
      });
      carregarFornecedores();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulário de Cadastro */}
      <Card>
        <CardHeader>
          <CardTitle>{editingFornecedor ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome do fornecedor"
                required
              />
            </div>

            <div>
              <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
              <Input
                id="cpf_cnpj"
                value={formData.cpf_cnpj}
                onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                placeholder="CPF ou CNPJ"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                placeholder="Endereço completo"
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                {editingFornecedor ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}
              </Button>
              {editingFornecedor && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Fornecedores Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedores.map((fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell>{fornecedor.nome}</TableCell>
                    <TableCell>{fornecedor.cpf_cnpj}</TableCell>
                    <TableCell>{fornecedor.email || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        fornecedor.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(fornecedor)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(fornecedor.id)}
                        >
                          Excluir
                        </Button>
                        <Button
                          size="sm"
                          variant={fornecedor.ativo ? "destructive" : "default"}
                          onClick={() => alternarAtivo(fornecedor.id, fornecedor.ativo)}
                        >
                          {fornecedor.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
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

export default CadastroFornecedor;
