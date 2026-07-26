import { Order, PrintTemplate, MarketIntegration, FactoryStats, PhotoKit } from '../types';

export const INITIAL_PHOTO_KITS: PhotoKit[] = [
  { id: 'kit_mini_6', name: 'Kit Mini (6)', photoCount: 6, price: 39.90 },
  { id: 'kit_familia_12', name: 'Kit Família (12)', photoCount: 12, price: 69.90, starred: true, tag: 'Mais Vendido' },
  { id: 'kit_premium_24', name: 'Kit Premium (24)', photoCount: 24, price: 119.90, starred: true, tag: 'Recomendado' },
  { id: 'kit_memorias_36', name: 'Kit Memórias (36)', photoCount: 36, price: 169.90, starred: true, tag: 'Super Desconto' },
  { id: 'kit_ilimitado_60', name: 'Kit Ilimitado (60)', photoCount: 60, price: 249.90, tag: 'Pacote Completo' },
];

export const INITIAL_TEMPLATES: PrintTemplate[] = [
  {
    id: 'ima_6x6_a4',
    name: 'Foto Ímã 6.13x6.13 cm (Tamanho final da imagem)',
    productType: 'foto_ima',
    description: 'Encaixe perfeito para fotos na folha A4 com borda e sangria',
    pageSize: 'A4',
    pageWidthMM: 210,
    pageHeightMM: 297,
    columns: 3,
    rows: 4,
    marginTopMM: 3,
    marginLeftMM: 5.5,
    spacingXMM: 3,
    spacingYMM: 2,
    itemWidthMM: 64.3,
    itemHeightMM: 64.3,
    innerFaceWidthMM: 61.3,
    innerFaceHeightMM: 61.3,
    bleedMM: 1.5,
    showCutLines: true,
    showBarcodes: true,
    maxItemsPerPage: 12,
    badgeTag: 'Mais Vendido',
  },
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_INTEGRATIONS: MarketIntegration[] = [
  {
    id: 'shopee',
    name: 'Shopee Brasil',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg',
    connected: true,
    activeOrdersCount: 0,
    lastSync: 'Conectado',
    autoImport: true,
  },
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    logo: 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.22.13/mercadolibre/logo__large_plus.png',
    connected: true,
    activeOrdersCount: 0,
    lastSync: 'Conectado',
    autoImport: true,
  },
  {
    id: 'tiktok_shop',
    name: 'TikTok Shop',
    logo: 'https://sf-tb-sg.ibytedtos.com/obj/eden-sg/u3zkeh_ls_zh/tiktok_shop_logo.png',
    connected: true,
    activeOrdersCount: 0,
    lastSync: 'Conectado',
    autoImport: true,
  },
  {
    id: 'nuvemshop',
    name: 'Nuvemshop / Tiendanube',
    logo: 'https://d26lpennugte82.cloudfront.net/stores/001/123/456/themes/common/logo-nuvemshop.png',
    connected: true,
    activeOrdersCount: 0,
    lastSync: 'Conectado',
    autoImport: true,
  },
  {
    id: 'loja_integrada',
    name: 'Loja Integrada',
    logo: 'https://d335luupugsy2.cloudfront.net/cms/files/42071/1601053123Logo-Loja-Integrada.png',
    connected: false,
    activeOrdersCount: 0,
    lastSync: 'Não conectado',
    autoImport: false,
  },
];

export const INITIAL_STATS: FactoryStats = {
  ordersToday: 0,
  producedToday: 0,
  pendingCount: 0,
  printedCount: 0,
  dispatchedCount: 0,
  avgProductionTimeMinutes: 0,
  totalTimeSavedHours: 0,
  estimatedProfitToday: 0,
};
