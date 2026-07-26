import { Order, PrintTemplate, FactoryStats, MarketIntegration, AICropAnalysisResponse } from '../types';

export async function fetchStats(): Promise<FactoryStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch factory stats');
  return res.json();
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders');
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function fetchTemplates(): Promise<PrintTemplate[]> {
  const res = await fetch('/api/templates');
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function fetchIntegrations(): Promise<MarketIntegration[]> {
  const res = await fetch('/api/integrations');
  if (!res.ok) throw new Error('Failed to fetch integrations');
  return res.json();
}

export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
  const res = await fetch(`/api/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update order');
  return res.json();
}

export async function deleteOrder(id: string): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`/api/orders/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete order');
  return res.json();
}

export async function runAICropForOrder(orderId: string): Promise<{ message: string; order: Order }> {
  const res = await fetch(`/api/orders/${orderId}/process-ai`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to run AI crop for order');
  return res.json();
}

export async function analyzePhotoAutoCrop(params: {
  photoFilename: string;
  caption?: string;
  photoIndex?: number;
}): Promise<AICropAnalysisResponse> {
  const res = await fetch('/api/ai/autocrop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to perform AI autocrop analysis');
  return res.json();
}

export async function generatePDFSheet(orderId: string, templateId: string): Promise<Blob> {
  const res = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, templateId }),
  });
  if (!res.ok) throw new Error('Failed to generate PDF sheet');
  return res.blob();
}

export async function generateCombinedPDFSheet(orderIds: string[], templateId?: string): Promise<Blob> {
  const res = await fetch('/api/generate-combined-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderIds, templateId }),
  });
  if (!res.ok) throw new Error('Failed to generate combined PDF sheet');
  return res.blob();
}

