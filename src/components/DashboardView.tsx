import React from 'react';
import {
  Clock,
  Zap,
  TrendingUp,
  Sparkles,
  Printer,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Package,
  Layers,
  FileCheck
} from 'lucide-react';
import { FactoryStats, Order } from '../types';

interface DashboardViewProps {
  stats: FactoryStats;
  orders: Order[];
  onNavigateTab: (tab: string) => void;
  onProcessAllAI: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  orders,
  onNavigateTab,
  onProcessAllAI,
}) => {
  const pendingCount = orders.filter((o) => o.status === 'recebido' || o.status === 'processando_ia').length;
  const readyForPrintCount = orders.filter((o) => o.status === 'crop_concluido' || o.status === 'pdf_pronto').length;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800/90 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Pedidos Totais</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{orders.length}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pedidos cadastrados no sistema</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Aguardando Impressão</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-300">{readyForPrintCount}</span>
            <span className="text-xs text-slate-400">folhas prontas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">PDFs gerados com marcas de corte</p>
        </div>
      </div>

      {/* Active Orders Quick Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span>Pedidos Recentes na Esteira</span>
          </h2>
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
          >
            <span>Ver Esteira Completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Marketplace</th>
                <th className="p-3">Produto</th>
                <th className="p-3">Fotos</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="p-3 font-bold text-cyan-300">{o.code}</td>
                  <td className="p-3 font-medium text-slate-200">{o.customerName}</td>
                  <td className="p-3 capitalize">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {o.marketplace}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{o.productName}</td>
                  <td className="p-3">{o.totalPhotos} fotos</td>
                  <td className="p-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onNavigateTab('pipeline')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-medium text-[11px]"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const configs: Record<Order['status'], { label: string; color: string }> = {
    recebido: { label: 'Recebido', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    processando_ia: { label: 'IA AutoCrop...', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse' },
    crop_concluido: { label: 'Crop OK', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    pdf_pronto: { label: 'PDF Gerado', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
    em_impressao: { label: 'Imprimindo', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
    impresso: { label: 'Impresso', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    expedido: { label: 'Despachado', color: 'bg-slate-700 text-slate-300 border-slate-600' },
  };

  const cfg = configs[status] || { label: status, color: 'bg-slate-800 text-slate-300 border-slate-700' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};
