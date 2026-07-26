export type OrderStatus =
  | 'recebido'
  | 'processando_ia'
  | 'crop_concluido'
  | 'pdf_pronto'
  | 'em_impressao'
  | 'impresso'
  | 'expedido';

export type Marketplace = 'shopee' | 'mercadolivre' | 'tiktok_shop' | 'nuvemshop' | 'loja_integrada' | 'direto';

export interface PhotoItem {
  id: string;
  originalUrl: string;
  filename: string;
  caption?: string;
  aiCrop?: {
    focalPoint: { x: number; y: number }; // percentage 0-100
    zoom: number; // 1.0 - 2.5
    rotation: number; // 0, 90, 180, 270
    subjectType: 'face' | 'couple' | 'pet' | 'scenery' | 'object';
    confidence: number;
    recommendedMargin: number;
    suggestedCaption?: string;
  };
  customCrop?: {
    focalPoint: { x: number; y: number };
    zoom: number;
    rotation: number;
    bgColor?: string;
  };
  status: 'pending' | 'auto_cropped' | 'user_approved' | 'ready';
}

export type ProductType = 
  | 'foto_ima' 
  | 'polaroid' 
  | 'caneca' 
  | 'mousepad' 
  | 'calendario' 
  | 'adesivo' 
  | 'chaveiro'
  | 'botton'
  | 'corte_redondo';

export interface PrintTemplate {
  id: string;
  name: string;
  productType: ProductType;
  isRound?: boolean;
  description: string;
  pageSize: 'A4' | 'A3' | 'Custom';
  pageWidthMM: number;
  pageHeightMM: number;
  columns: number;
  rows: number;
  marginTopMM: number;
  marginLeftMM: number;
  spacingXMM: number;
  spacingYMM: number;
  itemWidthMM: number;
  itemHeightMM: number;
  innerFaceWidthMM?: number;
  innerFaceHeightMM?: number;
  bleedMM: number;
  showCutLines: boolean;
  showBarcodes: boolean;
  maxItemsPerPage: number;
  badgeTag: string;
}

export interface Order {
  id: string;
  code: string; // e.g. #PF-9482
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  marketplace: Marketplace;
  externalOrderId?: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  templateId: string;
  productName: string;
  totalPhotos: number;
  photos: PhotoItem[];
  shippingCarrier: 'melhor_envio' | 'kangu' | 'correios' | 'retirada';
  trackingNumber?: string;
  shippingLabelUrl?: string;
  printedAt?: string;
  pdfUrl?: string;
  itemPrice: number;
  totalPrice: number;
  timeSavedMinutes: number; // estimated manual time saved by AI
}

export interface MarketIntegration {
  id: Marketplace;
  name: string;
  logo: string;
  connected: boolean;
  activeOrdersCount: number;
  lastSync: string;
  autoImport: boolean;
}

export interface PhotoKit {
  id: string;
  name: string;
  photoCount: number;
  price: number;
  starred?: boolean;
  tag?: string;
  isCustomUnit?: boolean;
}

export interface FactoryStats {
  ordersToday: number;
  producedToday: number;
  pendingCount: number;
  printedCount: number;
  dispatchedCount: number;
  avgProductionTimeMinutes: number;
  totalTimeSavedHours: number;
  estimatedProfitToday: number;
}

export interface AICropAnalysisRequest {
  imageUrl: string;
  productType: string;
  targetWidthMM: number;
  targetHeightMM: number;
}

export interface AICropAnalysisResponse {
  focalPoint: { x: number; y: number };
  zoom: number;
  subjectType: 'face' | 'couple' | 'pet' | 'scenery' | 'object';
  confidence: number;
  recommendedMargin: number;
  reasoning: string;
  suggestedCaption?: string;
}
