
import React, { useState } from 'react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckSquare, Square, Trash2, Plus, X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onAddTask: (title: string) => void;
  onRemoveTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
}

const TasksPanel = ({ 
  isOpen, 
  onClose, 
  tasks, 
  onAddTask, 
  onRemoveTask, 
  onToggleTask 
}: TasksPanelProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl font-bold text-gray-900">
              Gerenciar Tarefas
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Adicionar Nova Tarefa */}
          <div className="space-y-3">
            <Label htmlFor="new-task" className="text-sm font-medium text-gray-700">
              Nova Tarefa
            </Label>
            <div className="flex space-x-2">
              <Input
                id="new-task"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite o título da tarefa..."
                className="flex-1"
              />
              <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lista de Tarefas */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Tarefas ({tasks.length})
            </Label>
            
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nenhuma tarefa criada</p>
                <p className="text-sm">Adicione uma tarefa acima para começar</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                    }`}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onToggleTask(task.id)}
                      className="p-0 h-auto hover:bg-transparent"
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5 text-green-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <p className={`text-sm ${
                        task.completed 
                          ? 'line-through text-gray-500' 
                          : 'text-gray-900'
                      }`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        Criada em {new Date(task.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveTask(task.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {tasks.filter(t => t.completed).length} de {tasks.length} completadas
            </span>
            <span>
              {tasks.filter(t => !t.completed).length} pendentes
            </span>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default TasksPanel;
