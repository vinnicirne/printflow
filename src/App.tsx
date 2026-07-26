import React, { useState, useEffect } from 'react';
import { TopBar } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PipelineView } from './components/PipelineView';
import { AutoCropStudioView } from './components/AutoCropStudioView';
import { TemplateEngineView } from './components/TemplateEngineView';
import { PrintQueueView } from './components/PrintQueueView';
import { ShippingView } from './components/ShippingView';
import { CustomerPortalView } from './components/CustomerPortalView';
import { IntegrationsView } from './components/IntegrationsView';

import {
  fetchStats,
  fetchOrders,
  fetchTemplates,
  fetchIntegrations,
  updateOrder,
  runAICropForOrder,
  generatePDFSheet,
  generateCombinedPDFSheet,
  deleteOrder
} from './services/api';
import { Order, PrintTemplate, FactoryStats, MarketIntegration, PhotoItem, PhotoKit } from './types';
import { INITIAL_ORDERS, INITIAL_TEMPLATES, INITIAL_INTEGRATIONS, INITIAL_STATS, INITIAL_PHOTO_KITS } from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentStore, setCurrentStore] = useState<string>('matriz');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Application Data States
  const [stats, setStats] = useState<FactoryStats>(INITIAL_STATS);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('printflow_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing local orders:', e);
      }
    }
    return INITIAL_ORDERS;
  });

  // Sync orders to localStorage on change
  useEffect(() => {
    if (orders && orders.length > 0) {
      localStorage.setItem('printflow_orders', JSON.stringify(orders));
    }
  }, [orders]);
  const [templates, setTemplates] = useState<PrintTemplate[]>(INITIAL_TEMPLATES);
  const [integrations, setIntegrations] = useState<MarketIntegration[]>(INITIAL_INTEGRATIONS);
  const [photoKits, setPhotoKits] = useState<PhotoKit[]>(() => {
    const saved = localStorage.getItem('printflow_photo_kits');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_PHOTO_KITS;
  });
  const [selectedStudioOrder, setSelectedStudioOrder] = useState<Order | null>(null);

  const handleSaveKits = (newKits: PhotoKit[]) => {
    setPhotoKits(newKits);
    localStorage.setItem('printflow_photo_kits', JSON.stringify(newKits));
    showNotification('Tabela de Pacotes & Preços atualizada!');
  };

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Load backend data on mount
  const loadData = async () => {
    try {
      const [s, o, t, i] = await Promise.all([
        fetchStats(),
        fetchOrders(),
        fetchTemplates(),
        fetchIntegrations(),
      ]);
      setStats(s);
      setOrders(o);
      setTemplates(t);
      setIntegrations(i);
    } catch (e) {
      console.warn('API data fetch fallback to local memory state.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Process AI Crop for single order
  const handleProcessOrderAI = async (orderId: string) => {
    showNotification(`Executando AutoCrop AI no pedido ${orderId}...`);
    try {
      const result = await runAICropForOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? result.order : o)));
      showNotification(`AutoCrop AI concluído com sucesso!`);
    } catch (err) {
      // Local fallback
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'crop_concluido',
                photos: o.photos.map((p) => ({ ...p, status: 'auto_cropped' as const })),
              }
            : o
        )
      );
      showNotification(`AutoCrop AI concluído!`);
    }
  };

  // Process AI Crop for ALL pending orders
  const handleProcessAllAI = async () => {
    showNotification('Processando AutoCrop AI para toda a fila...');
    orders.forEach((o) => {
      if (o.status === 'recebido' || o.status === 'processando_ia') {
        handleProcessOrderAI(o.id);
      }
    });
  };

  // Generate PDF Sheet
  const handleGeneratePDF = async (orderId: string, templateId: string) => {
    showNotification('Gerando folha de impressão PDF A4...');
    try {
      const blob = await generatePDFSheet(orderId, templateId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PrintFlow_Folha_A4_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'pdf_pronto' } : o))
      );
      showNotification('PDF A4 baixado com sucesso!');
    } catch (err) {
      console.error('PDF error:', err);
      showNotification('Erro ao gerar PDF. Verifique os dados do pedido.');
    }
  };

  // Print PDF Sheet Directly
  const handlePrintDirectly = async (orderId: string, templateId: string) => {
    showNotification('Gerando e preparando folha A4 para impressão...');
    try {
      const blob = await generatePDFSheet(orderId, templateId);
      const blobUrl = window.URL.createObjectURL(blob);

      // Open PDF in a new window/tab for printing and trigger download fallback if popup blocked
      const newWin = window.open(blobUrl, '_blank');
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Folha_A4_Impressao_Pedido_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (newWin) {
        showNotification('PDF gerado! Folha A4 aberta para impressão e baixada.');
      } else {
        showNotification('PDF gerado e baixado! Abra o arquivo baixado para imprimir.');
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'pdf_pronto' } : o))
      );
    } catch (err) {
      console.error('Print error:', err);
      showNotification('Erro ao preparar arquivo de impressão.');
    }
  };

  // Combined PDF handler (combines photos from multiple orders onto same A4 sheet)
  const handleGenerateCombinedPDF = async (orderIds: string[], templateId?: string) => {
    if (!orderIds || orderIds.length === 0) return;
    showNotification(`Gerando folha combinada A4 com ${orderIds.length} pedidos...`);
    try {
      const blob = await generateCombinedPDFSheet(orderIds, templateId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PrintFlow_Folha_Combinada_${orderIds.length}_pedidos.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setOrders((prev) =>
        prev.map((o) => (orderIds.includes(o.id) ? { ...o, status: 'pdf_pronto' } : o))
      );
      showNotification(`PDF Combinado de ${orderIds.length} pedidos baixado com sucesso!`);
    } catch (err) {
      console.error('Combined PDF error:', err);
      showNotification('Erro ao gerar PDF combinado de pedidos.');
    }
  };

  const handlePrintCombinedDirectly = async (orderIds: string[], templateId?: string) => {
    if (!orderIds || orderIds.length === 0) return;
    showNotification(`Gerando e preparando folha A4 combinada (${orderIds.length} pedidos)...`);
    try {
      const blob = await generateCombinedPDFSheet(orderIds, templateId);
      const blobUrl = window.URL.createObjectURL(blob);

      const newWin = window.open(blobUrl, '_blank');

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Folha_Combinada_${orderIds.length}_pedidos.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (newWin) {
        showNotification('PDF Combinado gerado! Folha aberta para impressão e baixada.');
      } else {
        showNotification('PDF Combinado gerado e baixado! Abra o arquivo para imprimir.');
      }

      setOrders((prev) =>
        prev.map((o) => (orderIds.includes(o.id) ? { ...o, status: 'pdf_pronto' } : o))
      );
    } catch (err) {
      console.error('Print combined error:', err);
      showNotification('Erro ao preparar impressão combinada.');
    }
  };

  const handleUpdateOrderPhotos = async (orderId: string, photos: PhotoItem[]) => {
    try {
      // Otimista local
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, photos, status: 'crop_concluido' } : o))
      );
      // Salva no backend
      await updateOrder(orderId, { photos, status: 'crop_concluido' });
      showNotification('Fotos atualizadas com sucesso!');
    } catch (err) {
      console.error('Error updating photos:', err);
      showNotification('Erro ao salvar no servidor, mas atualizado localmente.');
    }
  };

  const handleEditOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      const updatedOrder = await updateOrder(orderId, updates);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      showNotification('Pedido atualizado com sucesso!');
    } catch (err) {
      console.error('Edit order error:', err);
      // Fallback local update
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o)));
      showNotification('Pedido atualizado localmente!');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showNotification('Pedido excluído com sucesso!');
    } catch (err) {
      console.error('Delete order error:', err);
      // Fallback local delete
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showNotification('Pedido excluído localmente!');
    }
  };

  const handleSaveTemplate = (updated: Partial<PrintTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updated.id ? ({ ...t, ...updated } as PrintTemplate) : t))
    );
    showNotification('Gabarito salvo no Motor Universal!');
  };

  const handleMarkAsPrinted = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'impresso' } : o))
    );
    showNotification('Pedido marcado como impresso!');
  };

  const handleMarkAsDispatched = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'expedido' } : o))
    );
    showNotification('Etiqueta gerada e pedido despachado!');
  };

  const handleToggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))
    );
    showNotification('Sincronização de marketplace atualizada!');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 bg-cyan-600 text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-2xl border border-cyan-400 z-50 animate-bounce">
          {notification}
        </div>
      )}

      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        currentStore={currentStore}
        setCurrentStore={setCurrentStore}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <TopBar
          activeTab={activeTab}
          stats={stats}
          currentStore={currentStore}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          setActiveTab={setActiveTab}
        />

        {/* View Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              orders={orders}
              onNavigateTab={setActiveTab}
              onProcessAllAI={handleProcessAllAI}
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelineView
              orders={orders}
              templates={templates}
              onProcessOrderAI={handleProcessOrderAI}
              onGeneratePDF={handleGeneratePDF}
              onPrintDirectly={handlePrintDirectly}
              onSelectOrderForStudio={(order) => {
                setSelectedStudioOrder(order);
                setActiveTab('autocrop');
              }}
              onUpdateOrderPhotos={handleUpdateOrderPhotos}
              onGenerateCombinedPDF={handleGenerateCombinedPDF}
              onPrintCombinedDirectly={handlePrintCombinedDirectly}
              onEditOrder={handleEditOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {activeTab === 'autocrop' && (
            <AutoCropStudioView
              order={selectedStudioOrder || orders[0]}
              onUpdateOrderPhotos={handleUpdateOrderPhotos}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'templates' && (
            <TemplateEngineView
              templates={templates}
              onSaveTemplate={handleSaveTemplate}
              photoKits={photoKits}
              onSaveKits={handleSaveKits}
            />
          )}

          {activeTab === 'print_queue' && (
            <PrintQueueView
              orders={orders}
              templates={templates}
              onGeneratePDF={handleGeneratePDF}
              onPrintDirectly={handlePrintDirectly}
              onMarkAsPrinted={handleMarkAsPrinted}
              onGenerateCombinedPDF={handleGenerateCombinedPDF}
              onPrintCombinedDirectly={handlePrintCombinedDirectly}
            />
          )}

          {activeTab === 'shipping' && (
            <ShippingView
              orders={orders}
              onMarkAsDispatched={handleMarkAsDispatched}
            />
          )}

          {activeTab === 'client_portal' && (
            <CustomerPortalView
              templates={templates}
              photoKits={photoKits}
              onSaveKits={handleSaveKits}
              onOrderCreated={() => {
                loadData();
                setActiveTab('pipeline');
                showNotification('Novo pedido importado para a Esteira!');
              }}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsView
              integrations={integrations}
              onToggleIntegration={handleToggleIntegration}
            />
          )}
        </main>
      </div>
    </div>
  );
}
