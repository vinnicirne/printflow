import React from 'react';
import { Store, RefreshCw, CheckCircle2, ShieldCheck, Power, Zap, Database } from 'lucide-react';
import { MarketIntegration } from '../types';

interface IntegrationsViewProps {
  integrations: MarketIntegration[];
  onToggleIntegration: (id: string) => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  integrations,
  onToggleIntegration,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Store className="w-5 h-5 text-cyan-400" />
            <span>Central de Conectores e Banco de Dados Supabase</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sincronização de banco de dados relacional Supabase / PostgreSQL e marketplaces (Shopee, Mercado Livre, TikTok, Nuvemshop).
          </p>
        </div>
      </div>

      {/* Supabase Connection Banner */}
      <div className="bg-slate-900 border border-emerald-800/80 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Banco de Dados Supabase (PostgreSQL)</h2>
              <p className="text-xs text-slate-400">Conectado via AWS Pooler & SDK Supabase Client</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Conectado Ativo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Project URL</span>
            <code className="text-emerald-300 font-mono text-[11px] break-all">https://zrrsayypnldkpirpghnt.supabase.co</code>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">PostgreSQL Connection Pooler</span>
            <code className="text-slate-300 font-mono text-[11px] break-all">aws-0-sa-east-1.pooler.supabase.com:5432</code>
          </div>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100">{item.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.connected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {item.connected ? 'Conectado API' : 'Desconectado'}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Pedidos Ativos:</span>
                  <span className="font-bold text-cyan-400">{item.activeOrdersCount} pedidos</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Última Sincronização:</span>
                  <span className="text-slate-300">{item.lastSync}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Importação Automática</span>
              <button
                onClick={() => onToggleIntegration(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  item.connected
                    ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
                }`}
              >
                {item.connected ? 'Desconectar' : 'Conectar Canal'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
