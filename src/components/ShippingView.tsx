import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Printer,
  Barcode,
  PackageCheck,
  Search,
  Building,
  ExternalLink
} from 'lucide-react';
import { Order } from '../types';

interface ShippingViewProps {
  orders: Order[];
  onMarkAsDispatched: (orderId: string) => void;
}

export const ShippingView: React.FC<ShippingViewProps> = ({
  orders,
  onMarkAsDispatched,
}) => {
  const [selectedCarrier, setSelectedCarrier] = useState<string>('todos');
  const [printedLabelIds, setPrintedLabelIds] = useState<Set<string>>(new Set());

  const carriers = [
    { id: 'melhor_envio', name: 'Melhor Envio', logo: '🚚' },
    { id: 'kangu', name: 'Kangu', logo: '📦' },
    { id: 'correios', name: 'Correios', logo: '📮' },
  ];

  const handlePrintLabel = (orderId: string) => {
    setPrintedLabelIds((prev) => new Set(prev).add(orderId));
    onMarkAsDispatched(orderId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <span>Expedição e Gerador Automático de Etiquetas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gere e imprima etiquetas do Melhor Envio, Kangu e Correios diretamente sem acessar outros sistemas.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {carriers.map((c) => (
            <span
              key={c.id}
              className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <span>{c.logo}</span>
              <span>{c.name}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {orders.map((order) => {
          const isLabelPrinted = printedLabelIds.has(order.id) || order.status === 'expedido';

          return (
            <div
              key={order.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-cyan-300">{order.code}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {order.shippingCarrier}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-100">{order.customerName}</p>
                  <p className="text-slate-400 text-[11px]">{order.customerEmail || 'camila@email.com'}</p>
                  <p className="text-slate-400 text-[11px]">{order.customerPhone || '(11) 98765-4321'}</p>
                </div>

                {/* Simulated Shipping Label Preview Box */}
                <div className="bg-white rounded-xl p-3 text-slate-900 border border-slate-300 space-y-1 text-[10px] font-mono shadow-inner">
                  <div className="flex justify-between font-bold border-b border-slate-200 pb-1">
                    <span>ETIQUETA DE ENVIO</span>
                    <span>{order.shippingCarrier.toUpperCase()}</span>
                  </div>
                  <p className="font-bold">{order.customerName}</p>
                  <p className="text-[9px] text-slate-600">Rua das Flores, 123 - Ap 42, São Paulo - SP</p>
                  <p className="text-[9px] text-slate-600">CEP: 01310-100</p>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                    <div className="h-6 w-32 bg-slate-800 flex items-center justify-center text-white text-[8px] tracking-widest font-bold rounded">
                      ||| | |||| | ||||
                    </div>
                    <span className="font-bold">{order.trackingNumber || 'ME992810BR'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => handlePrintLabel(order.id)}
                  className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl font-bold text-xs shadow transition-all ${
                    isLabelPrinted
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>{isLabelPrinted ? 'Etiqueta Impressa (Despachado)' : 'Imprimir Etiqueta & Despachar'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
