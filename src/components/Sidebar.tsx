import React from 'react';
import {
  Printer,
  Sparkles,
  LayoutGrid,
  Truck,
  Layers,
  Store,
  Clock,
  Zap,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { FactoryStats } from '../types';
import { NavLink, Link } from 'react-router-dom';

interface SidebarProps {
  stats: FactoryStats;
  currentStore: string;
  setCurrentStore: (store: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  stats,
  currentStore,
  setCurrentStore,
  isCollapsed,
  setIsCollapsed,
}) => {
  const [storeMenuOpen, setStoreMenuOpen] = React.useState(false);

  const stores = [
    { id: 'matriz', name: 'Fábrica Matriz - SP (Gabarito A4)', badge: 'Principal' },
    { id: 'filial_rj', name: 'Gráfica Express - RJ', badge: 'Ativo' },
    { id: 'demo', name: 'PrintFlow Demo Store', badge: 'SaaS Multi-tenant' },
  ];

  const navItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutGrid, count: null },
    { id: 'pipeline', path: '/pedidos', label: 'Esteira de Pedidos', icon: Layers, count: stats.pendingCount },
    { id: 'autocrop', path: '/autocrop', label: 'AutoCrop AI', icon: Sparkles, count: null, highlight: true },
    { id: 'templates', path: '/template', label: 'Motor de Templates', icon: LayoutGrid, count: null },
    { id: 'print_queue', path: '/fila-de-impressao', label: 'Fila de Impressão', icon: Printer, count: stats.printedCount },
    { id: 'shipping', path: '/expedicao', label: 'Expedição', icon: Truck, count: stats.dispatchedCount },
    { id: 'client_portal', path: '/', label: 'Portal do Cliente', icon: ShoppingBag, count: null },
    { id: 'integrations', path: '/configuracoes', label: 'Marketplaces', icon: Store, count: null },
  ];

  const currentStoreObj = stores.find((s) => s.id === currentStore);

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col transition-all duration-300 ease-in-out z-40 relative min-h-screen self-stretch shrink-0 overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-64 sm:w-72'
      }`}
    >
      {/* Top Brand Header & Toggle */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
        {!isCollapsed && (
          <div className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 px-2.5 py-1.5 rounded-xl shadow-md overflow-hidden">
            <Zap className="w-4 h-4 text-white animate-pulse shrink-0" />
            <span className="font-extrabold text-sm tracking-tight text-white whitespace-nowrap">
              PrintFlow<span className="text-cyan-200">.AI</span>
            </span>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto bg-gradient-to-r from-cyan-500 to-blue-600 p-1.5 rounded-xl shadow-md">
            <Zap className="w-4 h-4 text-white animate-pulse" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors border border-slate-700/80 shrink-0 ml-auto"
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Store Switcher */}
      <div className="p-2.5 border-b border-slate-800/80">
        {!isCollapsed ? (
          <div className="relative">
            <button
              onClick={() => setStoreMenuOpen(!storeMenuOpen)}
              className="w-full flex items-center justify-between bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 transition-all"
            >
              <div className="flex items-center space-x-2 truncate">
                <Store className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate text-[11px]">{currentStoreObj?.name}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
            </button>

            {storeMenuOpen && (
              <div className="absolute left-0 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Unidade de Produção
                </div>
                {stores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentStore(s.id);
                      setStoreMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-700/60 transition-all ${
                      currentStore === s.id ? 'bg-cyan-950/40 text-cyan-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600 ml-1">
                      {s.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center" title={currentStoreObj?.name}>
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'
                } rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 font-semibold border border-slate-700/80 shadow-md ring-1 ring-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-cyan-400 scale-105' : item.highlight ? 'text-cyan-300' : 'text-slate-400'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate text-xs">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.count !== null && item.count > 0 && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}

                  {isCollapsed && item.count !== null && item.count > 0 && (
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer Stats / Quick Action */}
      {!isCollapsed ? (
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/40 space-y-2 mt-auto">
          <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-2 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Tempo salvo:
              </span>
              <strong className="text-cyan-300 font-bold">{stats.totalTimeSavedHours}h</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Média produção:
              </span>
              <strong className="text-emerald-300 font-bold">{stats.avgProductionTimeMinutes} min</strong>
            </div>
          </div>

          <Link
            to="/"
            className="w-full flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-1.5 rounded-xl shadow transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Testar Portal Cliente</span>
          </Link>
        </div>
      ) : (
        <div className="p-2.5 border-t border-slate-800 flex justify-center mt-auto">
          <Link
            to="/"
            title="Testar Portal do Cliente"
            className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow transition-all"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      )}
    </aside>
  );
};
