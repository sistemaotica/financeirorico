
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  LayoutDashboard, 
  ArrowRight, 
  FileText, 
  CreditCard, 
  BarChart3,
  Receipt,
  Building2,
  Users,
  Truck,
  Settings,
  LogOut,
  ChevronRight,
  DollarSign,
  CheckSquare
} from 'lucide-react';

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const AppSidebar = ({ currentPage, onNavigate, onLogout }: AppSidebarProps) => {
  const menuItems = [
    {
      title: "Operação",
      icon: ArrowRight,
      items: [
        { title: "Lançamento", page: "lancamento", icon: FileText },
        { title: "Contas a Pagar/Receber", page: "contas", icon: CreditCard },
        { title: "Tarefas", page: "tarefas", icon: CheckSquare },
      ],
    },
    {
      title: "Relatório", 
      icon: BarChart3,
      items: [
        { title: "Contas", page: "relatorio-contas", icon: Receipt },
        { title: "Extrato do Movimento", page: "extrato", icon: FileText },
      ],
    },
    {
      title: "Cadastro",
      icon: Settings,
      items: [
        { title: "Cadastrar Banco", page: "cadastro-banco", icon: Building2 },
        { title: "Cadastrar Cliente", page: "cadastro-cliente", icon: Users },
        { title: "Cadastrar Fornecedor", page: "cadastro-fornecedor", icon: Truck },
      ],
    },
  ];

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 p-3 md:p-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">RICCO</h2>
            <p className="text-xs text-gray-600 truncate">Sistema Financeiro</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-1 md:p-2">
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => onNavigate('dashboard')}
                isActive={currentPage === 'dashboard'}
                className="w-full justify-start p-2 md:p-3"
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Menus principais */}
        {menuItems.map((menu, index) => (
          <SidebarGroup key={index}>
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-gray-100 rounded-md transition-colors">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <menu.icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="font-medium text-gray-700 truncate text-sm md:text-base">{menu.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 transition-transform group-data-[state=open]/collapsible:rotate-90 flex-shrink-0" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menu.items.map((item, itemIndex) => (
                      <SidebarMenuItem key={itemIndex}>
                        <SidebarMenuButton 
                          onClick={() => onNavigate(item.page)}
                          isActive={currentPage === item.page}
                          className="w-full justify-start pl-6 md:pl-8 p-2 md:p-3"
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate text-sm">{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-2 md:p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={onLogout}
              className="w-full justify-start text-red-600 hover:bg-red-50 p-2 md:p-3"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
