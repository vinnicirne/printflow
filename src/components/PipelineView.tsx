import React, { useState } from 'react';
import {
  Sparkles,
  Printer,
  FileCheck,
  CheckCircle,
  Truck,
  Eye,
  Layers,
  ArrowRight,
  Download,
  Sliders,
  Copy,
  Plus,
  Grid,
  CheckSquare,
  Square,
  Edit,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';
import { Order, PrintTemplate, PhotoItem } from '../types';
import { StatusBadge } from './DashboardView';

interface PipelineViewProps {
  orders: Order[];
  templates: PrintTemplate[];
  onProcessOrderAI: (orderId: string) => void;
  onGeneratePDF: (orderId: string, templateId: string) => void;
  onPrintDirectly: (orderId: string, templateId: string) => void;
  onSelectOrderForStudio: (order: Order) => void;
  onUpdateOrderPhotos?: (orderId: string, photos: PhotoItem[]) => void;
  onGenerateCombinedPDF?: (orderIds: string[], templateId?: string) => void;
  onPrintCombinedDirectly?: (orderIds: string[], templateId?: string) => void;
  onEditOrder?: (orderId: string, updates: Partial<Order>) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  orders,
  templates,
  onProcessOrderAI,
  onGeneratePDF,
  onPrintDirectly,
  onSelectOrderForStudio,
  onUpdateOrderPhotos,
  onGenerateCombinedPDF,
  onPrintCombinedDirectly,
  onEditOrder,
  onDeleteOrder,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({ customerName: '', productName: '', status: '' });

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName || '',
      productName: order.productName || '',
      status: order.status || 'recebido'
    });
  };

  const handleSaveEdit = () => {
    if (editingOrder && onEditOrder) {
      onEditOrder(editingOrder.id, {
        customerName: editForm.customerName,
        productName: editForm.productName,
        status: editForm.status as any,
      });
    }
    setEditingOrder(null);
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((oId) => oId !== id) : [...prev, id]
    );
  };

  const handleQuickAddSingleCopy = (order: Order) => {
    if (!order.photos || order.photos.length === 0) return;
    const last = order.photos[order.photos.length - 1];
    const copy: PhotoItem = {
      ...last,
      id: `${Date.now()}_copy_${Math.random().toString(36).substring(2, 6)}`,
      filename: `${last.filename} (Cópia)`,
    };
    const updated = [...order.photos, copy];
    onUpdateOrderPhotos?.(order.id, updated);
  };

  const handleQuickFillSheet = (order: Order, maxCapacity: number) => {
    if (!order.photos || order.photos.length === 0) return;
    let updated = [...order.photos];
    let i = 0;
    while (updated.length < maxCapacity) {
      const src = order.photos[i % order.photos.length];
      updated.push({
        ...src,
        id: `${Date.now()}_fill_${updated.length}_${Math.random().toString(36).substring(2, 5)}`,
        filename: `${src.filename}_copia${updated.length + 1}`,
      });
      i++;
    }
    onUpdateOrderPhotos?.(order.id, updated);
  };

  const filteredOrders = orders.filter((o) => {
    if (selectedStatusFilter === 'todos') return true;
    return o.status === selectedStatusFilter;
  });

  const columns = [
    { id: 'recebido', title: '1. Recebido (Marketplace)', count: orders.filter((o) => o.status === 'recebido').length, color: 'border-blue-500' },
    { id: 'crop_concluido', title: '2. IA AutoCrop OK', count: orders.filter((o) => o.status === 'crop_concluido' || o.status === 'processando_ia').length, color: 'border-cyan-500' },
    { id: 'pdf_pronto', title: '3. Layout PDF A4 Gerado', count: orders.filter((o) => o.status === 'pdf_pronto').length, color: 'border-purple-500' },
    { id: 'em_impressao', title: '4. Fila de Impressão', count: orders.filter((o) => o.status === 'em_impressao' || o.status === 'impresso').length, color: 'border-amber-500' },
    { id: 'expedido', title: '5. Expedição & Etiqueta', count: orders.filter((o) => o.status === 'expedido').length, color: 'border-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="flex flex-col gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Esteira Inteligente de Produção</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe o fluxo automático desde a chegada das fotos até a geração de gabarito A4 e expedição.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex overflow-x-auto pb-1 gap-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <button
            onClick={() => setSelectedStatusFilter('todos')}
            className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedStatusFilter === 'todos'
                ? 'bg-cyan-500 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Todos ({orders.length})
          </button>
          {columns.map((col) => (
            <button
              key={col.id}
              onClick={() => setSelectedStatusFilter(col.id)}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatusFilter === col.id
                  ? 'bg-cyan-500 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {col.title.split('.')[1]} ({col.count})
            </button>
          ))}
        </div>
      </div>

      {/* Floating Action Bar for Combined Orders Printing */}
      {selectedOrderIds.length > 0 && (
        <div className="sticky top-2 z-40 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-cyan-500/50 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-extrabold text-xs border border-cyan-500/40">
              {selectedOrderIds.length}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100">
                {selectedOrderIds.length} Pedido(s) Selecionado(s) para Aproveitamento de Folha A4
              </h3>
              <p className="text-[11px] text-slate-400">
                Aproveite o espaço da folha unindo as fotos de múltiplos pedidos no mesmo gabarito!
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

      {/* Orders Grid/Kanban Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.map((order) => {
          const tmpl = templates.find((t) => t.id === order.templateId) || templates[0];
          const isSelected = selectedOrderIds.includes(order.id);
          const photoCount = order.photos ? order.photos.length : 0;
          const maxCapacity = tmpl.maxItemsPerPage;

          return (
            <div
              key={order.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all relative ${
                isSelected
                  ? 'border-cyan-500 shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleSelectOrder(order.id)}
                      className="text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Selecionar para combinar na mesma folha A4"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                    <span className="font-extrabold text-sm text-cyan-300">{order.code}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={order.status} />
                    <button
                      onClick={() => handleOpenEdit(order)}
                      className="text-slate-400 hover:text-cyan-400 p-1 rounded hover:bg-slate-800 transition"
                      title="Editar Pedido"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o pedido ${order.code}?`)) {
                          onDeleteOrder?.(order.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                      title="Excluir Pedido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                    <span className="font-semibold text-slate-100 truncate pr-2">{order.customerName || 'Cliente não identificado'}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] uppercase font-bold text-slate-400 shrink-0">
                      {order.marketplace}
                    </span>
                  </div>
                  {order.customerEmail && (
                    <div className="text-[10px] text-slate-400 truncate" title="E-mail do cliente">
                      📧 {order.customerEmail}
                    </div>
                  )}
                  {order.customerPhone && (
                    <div className="text-[10px] text-slate-400 truncate mt-0.5" title="WhatsApp do cliente">
                      📱 {order.customerPhone}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                  <span>{order.productName}</span>
                  <span className="text-cyan-400 font-bold">{photoCount} fotos</span>
                </div>
              </div>

              {/* Photos Thumbnails Preview */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-between">
                  <span>Amostra de Recorte AI</span>
                  <span className="text-emerald-400 font-normal">
                    {order.photos.filter((p) => p.status === 'auto_cropped' || p.status === 'user_approved').length} / {photoCount} AI OK
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                  {order.photos.slice(0, 3).map((photo, pIdx) => (
                    <div key={photo.id || pIdx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 group">
                      <img
                        src={photo.originalUrl}
                        alt={photo.filename}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />

                      {/* Focal Point Indicator */}
                      {photo.aiCrop && (
                        <div
                          className="absolute w-2.5 h-2.5 bg-cyan-400 rounded-full border border-white shadow-md transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${photo.aiCrop.focalPoint.x}%`,
                            top: `${photo.aiCrop.focalPoint.y}%`,
                          }}
                          title={`Assunto: ${photo.aiCrop.subjectType} (${Math.round(photo.aiCrop.confidence * 100)}%)`}
                        />
                      )}

                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-slate-300 text-[9px] px-1 py-0.5 truncate text-center">
                        {photo.filename}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Information & Time Saved */}
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 font-medium">{tmpl.name}</p>
                    <p className="text-[10px] text-slate-400">{tmpl.columns}x{tmpl.rows} na folha A4 ({maxCapacity} p/ página)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-400 font-bold">-{order.timeSavedMinutes} min</p>
                    <p className="text-[9px] text-slate-400">economizados</p>
                  </div>
                </div>

                {/* Quick Duplication & Sheet Fill Options */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => handleQuickAddSingleCopy(order)}
                    className="flex items-center justify-center space-x-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-[11px] font-semibold py-1.5 rounded-lg transition-all cursor-pointer"
                    title="Adiciona +1 cópia da foto a cada clique"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+1 Cópia</span>
                  </button>

                  <button
                    onClick={() => handleQuickFillSheet(order, maxCapacity)}
                    className="flex items-center justify-center space-x-1 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 text-[11px] font-semibold py-1.5 rounded-lg transition-all cursor-pointer"
                    title="Preenche as fotos até completar os espaços da folha A4"
                  >
                    <Grid className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Preencher {maxCapacity}</span>
                  </button>
                </div>
              </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onProcessOrderAI(order.id)}
                      className="flex items-center justify-center space-x-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold py-2 rounded-lg transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AutoCrop AI</span>
                    </button>

                    <button
                      onClick={() => onSelectOrderForStudio(order)}
                      className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium py-2 rounded-lg transition-all"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ajuste Fino</span>
                    </button>
                  </div>

                  {/* Print & Download Options directly on Order */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPrintDirectly(order.id, order.templateId)}
                      className="flex items-center justify-center space-x-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                      title="Imprimir direto para a impressora sem precisar salvar arquivo"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Direto</span>
                    </button>

                    <button
                      onClick={() => onGeneratePDF(order.id, order.templateId)}
                      className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                      title="Baixar arquivo PDF A4 em alta resolução no computador"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar PDF</span>
                    </button>
                  </div>
                  
                  {/* Mark as Completed */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditOrder) {
                           onEditOrder(order.id, { status: 'expedido' });
                        }
                      }}
                      className="w-full flex items-center justify-center space-x-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 text-xs font-bold py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.01] cursor-pointer"
                      title="Marcar como concluído para remover da fila de impressão"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Concluído / Expedir</span>
                    </button>
                  </div>
                </div>
            </div>
          );
        })}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">
                Editar Pedido <span className="text-cyan-400">{editingOrder.code}</span>
              </h3>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  value={editForm.productName}
                  onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status do Pedido</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="recebido">Recebido</option>
                  <option value="processando_ia">Processando IA</option>
                  <option value="crop_concluido">Crop Concluído</option>
                  <option value="pdf_pronto">PDF Pronto</option>
                  <option value="em_impressao">Em Impressão</option>
                  <option value="impresso">Impresso</option>
                  <option value="expedido">Expedido</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
