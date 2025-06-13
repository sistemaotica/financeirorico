
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ArrowRight, DollarSign, PieChart, FileText, BarChart3, Shield, Clock, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Apresentacao = () => {
  const navigate = useNavigate();

  const slides = [
    {
      id: 1,
      title: "Sistema Financeiro RICCO",
      subtitle: "Controle Total das suas Finanças",
      description: "Uma solução completa para gestão financeira empresarial, desenvolvida para oferecer total controle sobre suas contas a pagar, receber, lançamentos bancários e relatórios detalhados.",
      icon: <DollarSign className="w-16 h-16 text-blue-500" />,
      gradient: "from-blue-500 to-purple-600"
    },
    {
      id: 2,
      title: "Gestão de Contas",
      subtitle: "Organize suas Finanças",
      description: "Gerencie contas a pagar e receber com facilidade. Controle vencimentos, realize baixas automáticas e mantenha seu fluxo de caixa sempre atualizado com total precisão.",
      icon: <FileText className="w-16 h-16 text-green-500" />,
      gradient: "from-green-500 to-teal-600"
    },
    {
      id: 3,
      title: "Relatórios Inteligentes",
      subtitle: "Dados que Geram Resultados",
      description: "Relatórios detalhados e personalizáveis para análise completa. Extratos de movimento, conciliação bancária e demonstrativos financeiros em PDF profissionais.",
      icon: <BarChart3 className="w-16 h-16 text-orange-500" />,
      gradient: "from-orange-500 to-red-600"
    },
    {
      id: 4,
      title: "Tecnologia & Segurança",
      subtitle: "Modernidade e Confiança",
      description: "Desenvolvido com as mais modernas tecnologias web, garantindo segurança, performance e uma experiência de usuário excepcional em qualquer dispositivo.",
      icon: <Shield className="w-16 h-16 text-purple-500" />,
      gradient: "from-purple-500 to-pink-600"
    }
  ];

  const features = [
    {
      icon: <Clock className="w-8 h-8 text-blue-500" />,
      title: "Economia de Tempo",
      description: "Automatize processos e ganhe produtividade"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      title: "Crescimento",
      description: "Dados precisos para tomada de decisões"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500" />,
      title: "Colaboração",
      description: "Acesso multi-usuário com segurança"
    },
    {
      icon: <PieChart className="w-8 h-8 text-orange-500" />,
      title: "Análises",
      description: "Relatórios detalhados e insights valiosos"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">FINANCEIRO RICCO</h1>
            </div>
            <Button 
              onClick={() => navigate('/sistema')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Acessar Sistema
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section com Carousel */}
      <section className="py-12 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Carousel className="w-full">
            <CarouselContent>
              {slides.map((slide) => (
                <CarouselItem key={slide.id}>
                  <Card className="border-0 shadow-2xl overflow-hidden">
                    <div className={`bg-gradient-to-r ${slide.gradient} text-white`}>
                      <CardContent className="p-8 lg:p-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[400px]">
                          <div className="space-y-6 flex flex-col justify-center">
                            <div className="space-y-3">
                              <h2 className="text-3xl lg:text-5xl font-bold leading-tight">
                                {slide.title}
                              </h2>
                              <h3 className="text-xl lg:text-2xl font-medium opacity-90">
                                {slide.subtitle}
                              </h3>
                            </div>
                            <p className="text-lg lg:text-xl leading-relaxed opacity-95 min-h-[80px] flex items-center">
                              {slide.description}
                            </p>
                            <Button 
                              size="lg" 
                              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 w-fit"
                              onClick={() => navigate('/sistema')}
                            >
                              <ArrowRight className="w-5 h-5 mr-2" />
                              Começar Agora
                            </Button>
                          </div>
                          <div className="flex justify-center lg:justify-end items-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-8 lg:p-12 flex items-center justify-center">
                              {slide.icon}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher o FINANCEIRO RICCO?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Uma solução desenvolvida pensando nas necessidades reais das empresas modernas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-gray-50 rounded-full p-4">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Pronto para transformar sua gestão financeira?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Experimente agora mesmo todas as funcionalidades do sistema FINANCEIRO RICCO e descubra como é fácil ter controle total das suas finanças.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 w-full sm:w-auto"
                onClick={() => navigate('/sistema')}
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Acessar Sistema
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <DollarSign className="w-8 h-8 text-blue-400" />
              <h3 className="text-2xl font-bold">FINANCEIRO RICCO</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Sistema de gestão financeira desenvolvido com tecnologia de ponta
            </p>
            <div className="border-t border-gray-800 pt-4">
              <p className="text-gray-500">
                © 2025 FINANCEIRO RICCO. Todos os direitos reservados a @RICARDOCACTUS.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Apresentacao;
