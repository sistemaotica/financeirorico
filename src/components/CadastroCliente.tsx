
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  ativo: boolean;
}

const CadastroCliente = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    endereco: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome');

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive"
      });
    } else {
      setClientes(data || []);
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

    if (editingCliente) {
      const { error } = await supabase
        .from('clientes')
        .update({
          nome: formData.nome,
          cpf_cnpj: formData.cpf_cnpj,
          email: formData.email || null,
          telefone: formData.telefone || null,
          endereco: formData.endereco || null
        })
        .eq('id', editingCliente.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar cliente",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso"
        });
        resetForm();
        carregarClientes();
      }
    } else {
      const { error } = await supabase
        .from('clientes')
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
          description: "Erro ao salvar cliente",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Cliente cadastrado com sucesso"
        });
        resetForm();
        carregarClientes();
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
    setEditingCliente(null);
  };

  const handleEdit = (cliente: Cliente) => {
    setFormData({
      nome: cliente.nome,
      cpf_cnpj: cliente.cpf_cnpj || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || ''
    });
    setEditingCliente(cliente);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir cliente",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Cliente excluído com sucesso"
        });
        carregarClientes();
      }
    }
  };

  const alternarAtivo = async (id: string, ativo: boolean) => {
    const { error } = await supabase
      .from('clientes')
      .update({ ativo: !ativo })
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cliente",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: `Cliente ${!ativo ? 'ativado' : 'desativado'} com sucesso`
      });
      carregarClientes();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulário de Cadastro */}
      <Card>
        <CardHeader>
          <CardTitle>{editingCliente ? 'Editar Cliente' : 'Cadastrar Cliente'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome do cliente"
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
                {editingCliente ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
              </Button>
              {editingCliente && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
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
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>{cliente.nome}</TableCell>
                    <TableCell>{cliente.cpf_cnpj}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        cliente.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cliente)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(cliente.id)}
                        >
                          Excluir
                        </Button>
                        <Button
                          size="sm"
                          variant={cliente.ativo ? "destructive" : "default"}
                          onClick={() => alternarAtivo(cliente.id, cliente.ativo)}
                        >
                          {cliente.ativo ? 'Desativar' : 'Ativar'}
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

export default CadastroCliente;
