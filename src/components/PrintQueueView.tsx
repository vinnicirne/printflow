import React, { useState } from 'react';
import {
  Printer,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  FileCheck,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Order, PrintTemplate } from '../types';

interface PrintQueueViewProps {
  orders: Order[];
  templates: PrintTemplate[];
  onGeneratePDF: (orderId: string, templateId: string) => void;
  onPrintDirectly: (orderId: string, templateId: string) => void;
  onMarkAsPrinted: (orderId: string) => void;
  onGenerateCombinedPDF?: (orderIds: string[], templateId?: string) => void;
  onPrintCombinedDirectly?: (orderIds: string[], templateId?: string) => void;
}

export const PrintQueueView: React.FC<PrintQueueViewProps> = ({
  orders,
  templates,
  onGeneratePDF,
  onPrintDirectly,
  onMarkAsPrinted,
  onGenerateCombinedPDF,
  onPrintCombinedDirectly,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((oId) => oId !== id) : [...prev, id]
    );
  };

  const readyOrders = orders.filter(
    (o) => o.status === 'crop_concluido' || o.status === 'pdf_pronto' || o.status === 'em_impressao'
  );

  const handlePrint = async (order: Order) => {
    setDownloadingId(order.id);
    await onGeneratePDF(order.id, order.templateId);
    setDownloadingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Printer className="w-5 h-5 text-cyan-400" />
            <span>Fila de Impressão e Gerador de PDF em Lote</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gere com 1 clique os arquivos PDF em alta resolução prontos para impressão em folha A4.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              readyOrders.forEach((o) => onGeneratePDF(o.id, o.templateId));
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gerar Todos os PDFs em Lote ({readyOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Combined Selection Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="sticky top-2 z-40 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-cyan-500/50 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-extrabold text-xs border border-cyan-500/40">
              {selectedOrderIds.length}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100">
                {selectedOrderIds.length} Pedidos Selecionados para Aproveitamento de Folha
              </h3>
              <p className="text-[11px] text-slate-400">
                Junte fotos de múltiplos pedidos na mesma folha A4 para evitar desperdício de material!
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPrintCombinedDirectly?.(selectedOrderIds)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Combinado</span>
            </button>

            <button
              onClick={() => onGenerateCombinedPDF?.(selectedOrderIds)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PDF Combinado</span>
            </button>

            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Pedidos Prontos para Impressão
          </span>
          <span className="text-xs text-cyan-400 font-semibold">{readyOrders.length} na fila</span>
        </div>

        {readyOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold">Tudo impresso! Fila vazia.</p>
            <p className="text-xs text-slate-400">Novos pedidos aparecerão aqui assim que o AutoCrop for concluído.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length > 0 && selectedOrderIds.length === readyOrders.length}
                      onChange={() => {
                        if (selectedOrderIds.length === readyOrders.length) {
                          setSelectedOrderIds([]);
                        } else {
                          setSelectedOrderIds(readyOrders.map((r) => r.id));
                        }
                      }}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Código</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Gabarito / Produto</th>
                  <th className="p-3">Fotos</th>
                  <th className="p-3">Status PDF</th>
                  <th className="p-3 text-right">Ação de Impressão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {readyOrders.map((o) => {
                  const tmpl = templates.find((t) => t.id === o.templateId) || templates[0];
                  const isChecked = selectedOrderIds.includes(o.id);

                  return (
                    <tr key={o.id} className={`hover:bg-slate-800/40 transition-all ${isChecked ? 'bg-cyan-950/20' : ''}`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(o.id)}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-bold text-cyan-300">{o.code}</td>
                      <td className="p-3 font-medium text-slate-200">
                        {o.customerName}
                        <span className="block text-[10px] text-slate-400 capitalize">{o.marketplace}</span>
                      </td>
                      <td className="p-3 text-slate-300">
                        <span className="font-semibold text-slate-200">{tmpl.name}</span>
                        <span className="block text-[10px] text-slate-400">
                          {tmpl.columns}x{tmpl.rows} em A4 ({tmpl.maxItemsPerPage} p/ folha)
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-cyan-400">{o.totalPhotos} itens</td>
                      <td className="p-3">
                        {o.status === 'pdf_pronto' ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                            PDF Gerado OK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                            Crop Aprovado
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => onPrintDirectly(o.id, o.templateId)}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg shadow text-xs transition-all inline-flex items-center space-x-1 cursor-pointer"
                          title="Abre a janela de impressão do navegador imediatamente"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir Direto</span>
                        </button>

                        <button
                          onClick={() => handlePrint(o)}
                          disabled={downloadingId === o.id}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold rounded-lg shadow text-xs transition-all inline-flex items-center space-x-1 cursor-pointer"
                          title="Baixar arquivo PDF A4 no computador"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingId === o.id ? 'Gerando...' : 'Baixar PDF'}</span>
                        </button>

                        <button
                          onClick={() => onMarkAsPrinted(o.id)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
                        >
                          Marcar Impresso
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
