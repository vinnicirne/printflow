import React from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  ExternalLink,
  Store,
  PanelLeftOpen,
  PanelLeftClose,
  Zap,
  Bell,
  Database
} from 'lucide-react';
import { FactoryStats } from '../types';

interface TopBarProps {
  activeTab: string;
  stats: FactoryStats;
  currentStore: string;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  stats,
  currentStore,
  isCollapsed,
  setIsCollapsed,
  setActiveTab,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard de Operações';
      case 'pipeline':
        return 'Esteira de Pedidos Inteligente';
      case 'autocrop':
        return 'Estúdio AutoCrop AI (Reenquadramento Otimizado)';
      case 'templates':
        return 'Motor Universal de Templates e Gabaritos';
      case 'print_queue':
        return 'Fila de Impressão e Lotes A4';
      case 'shipping':
        return 'Expedição e Logística Integrada';
      case 'client_portal':
        return 'Portal do Cliente (Envio de Fotos)';
      case 'integrations':
        return 'Central de Integrações e Marketplaces';
      default:
        return 'PrintFlow AI';
    }
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Toggle & View Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700/80 transition-all md:hidden"
            title="Menu Lateral"
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <span>{getTabTitle(activeTab)}</span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Sistema de Automação Pré-Impressão para Gráficas e Fotoprodutos
            </p>
          </div>
        </div>

        {/* Live Metrics Ribbon Removed */}

        {/* Right Quick Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('client_portal')}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portal do Cliente</span>
          </button>
        </div>
      </div>
    </header>
  );
};
