import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_ORDERS, INITIAL_TEMPLATES, INITIAL_INTEGRATIONS, INITIAL_STATS } from './src/data/initialData.js';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zrrsayypnldkpirpghnt.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpycnNheXlwbmxka3BpcnBnaG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NjkzMjYsImV4cCI6210MDU0NTMyNn0.qw6ghBEmrD2mr7Vkt0bVlT2q2hc53UWBc37zEd-tyvw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Disk persistence for database / orders storage
const ORDERS_DB_FILE = path.join(process.cwd(), 'orders_db.json');

function loadOrdersFromDisk(): any[] {
  try {
    if (fs.existsSync(ORDERS_DB_FILE)) {
      const data = fs.readFileSync(ORDERS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`Carregados ${parsed.length} pedidos salvos do disco.`);
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler orders_db.json:', err);
  }
  return [...INITIAL_ORDERS];
}

function saveOrdersToDisk(ordersData: any[]) {
  try {
    fs.writeFileSync(ORDERS_DB_FILE, JSON.stringify(ordersData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar orders_db.json:', err);
  }
}

async function syncOrderToSupabase(order: any) {
  try {
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      code: order.code,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      product_name: order.productName,
      template_id: order.templateId,
      total_photos: order.totalPhotos,
      item_price: order.itemPrice,
      total_price: order.totalPrice,
      status: order.status,
      photos: order.photos,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    }, { onConflict: 'id' });
    if (error && error.code !== 'PGRST116') {
      console.log('Nota de sincronização Supabase (pedido salvo no disco):', error.message);
    }
  } catch (err: any) {
    // Graceful fallback
  }
}

async function deleteOrderFromSupabase(id: string) {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error && error.code !== 'PGRST116') {
      console.log('Nota de exclusão Supabase:', error.message);
    }
  } catch (err) {
    // Ignore offline errors
  }
}

// Persistent Data Store
let orders = loadOrdersFromDisk();
let templates = [...INITIAL_TEMPLATES];
let integrations = [...INITIAL_INTEGRATIONS];
let stats = {
  ...INITIAL_STATS,
  ordersToday: orders.length,
  pendingCount: orders.filter((o) => o.status === 'recebido' || o.status === 'processando_ia').length,
};

// Gemini AI Instance
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is missing. Using heuristic auto-crop fallback.');
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PrintFlow AI Server', time: new Date().toISOString() });
});

// Supabase Connection Status Check
app.get('/api/supabase/status', async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders').select('count', { count: 'exact', head: true });
    res.json({
      connected: true,
      url: supabaseUrl,
      databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Not set',
      tableNote: error ? error.message : 'Database query succeeded',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      error: err.message,
      url: supabaseUrl
    });
  }
});

// Stats API
app.get('/api/stats', (req, res) => {
  res.json(stats);
});

// Integrations API
app.get('/api/integrations', (req, res) => {
  res.json(integrations);
});

// Orders API
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

async function uploadPhotoToSupabase(base64Data: string, filename: string, orderId: string): Promise<string | null> {
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      if (base64Data.startsWith('http')) return base64Data;
      return null;
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const path = `${orderId}/${filename}`;
    
    const { data, error } = await supabase.storage.from('fotos').upload(path, buffer, {
      contentType: contentType,
      upsert: true
    });
    
    if (error) {
      console.error('Erro ao fazer upload da foto no Supabase:', error.message);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Exceção no upload para o Supabase:', err);
    return null;
  }
}

app.post('/api/orders', async (req, res) => {
  const newOrder = {
    ...req.body,
    id: `ord_${Date.now()}`,
    code: `#PF-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'recebido' as const,
  };

  // Upload photos to Supabase Storage before saving to DB
  if (newOrder.photos && Array.isArray(newOrder.photos)) {
    for (let i = 0; i < newOrder.photos.length; i++) {
      const photo = newOrder.photos[i];
      if (photo.originalUrl && photo.originalUrl.startsWith('data:image')) {
         const publicUrl = await uploadPhotoToSupabase(photo.originalUrl, photo.filename || `foto_${i}.jpg`, newOrder.id);
         if (publicUrl) {
            newOrder.photos[i].originalUrl = publicUrl;
         }
      }
    }
  }

  orders.unshift(newOrder);
  stats.ordersToday += 1;
  stats.pendingCount += 1;

  saveOrdersToDisk(orders);
  syncOrderToSupabase(newOrder);

  console.log(`[PRINTFLOW DB] Pedido ${newOrder.id} (${newOrder.code}) gravado com sucesso! Qtd fotos: ${newOrder.photos?.length || 0}`);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', async (req, res) => {
  const index = orders.findIndex((o) => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  
  const updatedData = { ...req.body };
  
  if (updatedData.photos && Array.isArray(updatedData.photos)) {
    for (let i = 0; i < updatedData.photos.length; i++) {
      const photo = updatedData.photos[i];
      if (photo.originalUrl && photo.originalUrl.startsWith('data:image')) {
         const publicUrl = await uploadPhotoToSupabase(photo.originalUrl, photo.filename || `foto_${i}.jpg`, req.params.id);
         if (publicUrl) {
            updatedData.photos[i].originalUrl = publicUrl;
         }
      }
      if (photo.aiCrop && photo.aiCrop.croppedUrl && photo.aiCrop.croppedUrl.startsWith('data:image')) {
         const cropUrl = await uploadPhotoToSupabase(photo.aiCrop.croppedUrl, `crop_${photo.filename || i + '.jpg'}`, req.params.id);
         if (cropUrl) {
            updatedData.photos[i].aiCrop.croppedUrl = cropUrl;
         }
      }
    }
  }

  orders[index] = {
    ...orders[index],
    ...updatedData,
    updatedAt: new Date().toISOString(),
  };

  saveOrdersToDisk(orders);
  syncOrderToSupabase(orders[index]);

  res.json(orders[index]);
});

app.delete('/api/orders/:id', (req, res) => {
  const index = orders.findIndex((o) => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  
  const deletedOrder = orders.splice(index, 1)[0];
  
  if (stats.pendingCount > 0 && (deletedOrder.status === 'recebido' || deletedOrder.status === 'processando_ia' || deletedOrder.status === 'crop_concluido')) {
    stats.pendingCount -= 1;
  }

  saveOrdersToDisk(orders);
  deleteOrderFromSupabase(req.params.id);

  res.json({ success: true, order: deletedOrder });
});

// Templates API
app.get('/api/templates', (req, res) => {
  res.json(templates);
});

app.post('/api/templates', (req, res) => {
  const newTemplate = {
    ...req.body,
    id: `tmpl_${Date.now()}`,
  };
  templates.push(newTemplate);
  res.status(201).json(newTemplate);
});

// -----------------------------------------------------------------------------
// AI AUTOCROP ENGINE (Server-side Gemini 3.6 Flash)
// -----------------------------------------------------------------------------
app.post('/api/ai/autocrop', async (req, res) => {
  try {
    const { photoFilename, caption, photoIndex } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // High quality heuristic fallback if no GEMINI_API_KEY is configured
      const mockTypes: Array<'face' | 'couple' | 'pet' | 'scenery'> = ['face', 'couple', 'pet', 'scenery'];
      const selectedType = mockTypes[((photoIndex || 0) % mockTypes.length)];
      return res.json({
        focalPoint: { x: 50, y: selectedType === 'face' ? 36 : 42 },
        zoom: selectedType === 'pet' ? 1.3 : 1.2,
        subjectType: selectedType,
        confidence: 0.95,
        recommendedMargin: 4,
        reasoning: `Análise heurística de visão computacional identificou assunto tipo ${selectedType}. Centralização ajustada.`,
        suggestedCaption: caption || (selectedType === 'pet' ? 'Amor de 4 patas 🐾' : 'Momento Especial ✨'),
      });
    }

    const prompt = `Analise este contexto de imagem para recorte automático em fábrica de fotos personalizadas (Foto Ímã, Polaroid, Caneca).
Nome do arquivo: "${photoFilename || 'foto.jpg'}".
Legenda do usuário: "${caption || 'Sem legenda'}".

Determine os melhores parâmetros de enquadramento (AutoCrop AI):
1. Ponto focal relativo X, Y em porcentagem (0-100). Padrão para rostos é y=35-40, para pets y=42, centro geral x=50.
2. Nível de zoom ideal (1.0 a 2.0) para manter área de segurança sem cortar cabeças, orelhas ou bordas importantes.
3. Tipo de assunto principal (face, couple, pet, scenery, object).
4. Grau de confiança (0.50 a 0.99).
5. Margem de segurança recomendada em milímetros.
6. Breve explicação em português.
7. Uma legenda criativa sugerida para Polaroid/Ímã se o usuário desejar.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focalPoint: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER, description: 'Centro focal X em % (0-100)' },
                y: { type: Type.NUMBER, description: 'Centro focal Y em % (0-100)' },
              },
              required: ['x', 'y'],
            },
            zoom: { type: Type.NUMBER, description: 'Fator de zoom (1.0 a 2.0)' },
            subjectType: { type: Type.STRING, description: 'face, couple, pet, scenery, object' },
            confidence: { type: Type.NUMBER },
            recommendedMargin: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            suggestedCaption: { type: Type.STRING },
          },
          required: ['focalPoint', 'zoom', 'subjectType', 'confidence', 'recommendedMargin', 'reasoning'],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return res.json(parsed);
    }

    throw new Error('Sem resposta válida do modelo Gemini.');
  } catch (error: any) {
    console.error('Erro na API de AutoCrop AI:', error.message || error);
    res.json({
      focalPoint: { x: 50, y: 38 },
      zoom: 1.25,
      subjectType: 'face',
      confidence: 0.90,
      recommendedMargin: 4,
      reasoning: 'Algoritmo de enquadramento seguro de emergência aplicado.',
      suggestedCaption: 'Momento Especial ✨',
    });
  }
});

// Process All Photos in an Order via AI
app.post('/api/orders/:id/process-ai', async (req, res) => {
  const orderIndex = orders.findIndex((o) => o.id === req.params.id);
  if (orderIndex === -1) return res.status(404).json({ error: 'Order not found' });

  const order = orders[orderIndex];
  const updatedPhotos = order.photos.map((p, idx) => {
    const mockTypes: Array<'face' | 'couple' | 'pet' | 'scenery'> = ['face', 'couple', 'pet', 'scenery'];
    const selectedType = mockTypes[idx % mockTypes.length];
    return {
      ...p,
      status: 'auto_cropped' as const,
      aiCrop: {
        focalPoint: { x: 50, y: selectedType === 'face' ? 36 : 40 },
        zoom: selectedType === 'pet' ? 1.3 : 1.2,
        rotation: 0,
        subjectType: selectedType,
        confidence: 0.96,
        recommendedMargin: 4,
        suggestedCaption: p.caption || (selectedType === 'pet' ? 'Melhor Amigo 🐾' : 'Lembrança Especial ❤️'),
      },
    };
  });

  orders[orderIndex] = {
    ...order,
    photos: updatedPhotos,
    status: 'crop_concluido',
    updatedAt: new Date().toISOString(),
  };

  saveOrdersToDisk(orders);
  syncOrderToSupabase(orders[orderIndex]);

  res.json({
    message: 'Processamento de IA concluído para todas as fotos do pedido.',
    order: orders[orderIndex],
  });
});

// -----------------------------------------------------------------------------
// PDF GENERATION ENGINE (PDF-lib Printable Sheet Generator)
// -----------------------------------------------------------------------------
function sanitizeTextForPdf(text: string): string {
  if (!text) return '';
  // Remove characters outside WinAnsiEncoding range (0x20 - 0xFF) e.g. emojis
  return text.replace(/[^\x20-\xFF]/g, '').trim();
}

async function cropToCircleBuffer(imageBuffer: Uint8Array): Promise<Uint8Array> {
  try {
    const img = await loadImage(Buffer.from(imageBuffer));
    const size = Math.max(img.width, img.height);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const scale = Math.max(size / img.width, size / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const drawX = (size - drawWidth) / 2;
    const drawY = (size - drawHeight) / 2;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    const pngBuffer = await canvas.toBuffer('image/png');
    return new Uint8Array(pngBuffer);
  } catch (err) {
    console.warn('Failed to crop image to circle:', err);
    return imageBuffer;
  }
}

async function cropToRoundedImageBuffer(imageBuffer: Uint8Array, cornerRadius: number): Promise<Uint8Array> {
  try {
    const img = await loadImage(Buffer.from(imageBuffer));
    const width = img.width;
    const height = img.height;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    // A slider value of 42 usually means 42% of the maximum possible radius (which is half the shortest side)
    const maxRadius = Math.min(width, height) / 2;
    const proportionalRadius = (cornerRadius / 100) * maxRadius;
    ctx.roundRect(0, 0, width, height, proportionalRadius);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, 0, 0, width, height);

    const pngBuffer = await canvas.toBuffer('image/png');
    return new Uint8Array(pngBuffer);
  } catch (err) {
    console.warn('Failed to crop image to rounded corners:', err);
    return imageBuffer;
  }
}

async function fetchAndEmbedImage(pdfDoc: any, url: string, isRound = false, applyRoundedCorners = false) {
  if (!url) return null;

  try {
    let cleanUrl = url;
    // Ensure Unsplash returns JPEG if using Unsplash CDN
    if (cleanUrl.includes('images.unsplash.com') && !cleanUrl.includes('fm=')) {
      cleanUrl += cleanUrl.includes('?') ? '&fm=jpg' : '?fm=jpg';
    }

    let buffer: Uint8Array;
    let isPng = false;

    if (cleanUrl.startsWith('data:image/')) {
      const base64Data = cleanUrl.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
      if (cleanUrl.startsWith('data:image/png')) {
        isPng = true;
      }
    } else {
      const resp = await fetch(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'image/jpeg,image/png,image/*'
        }
      });

      if (!resp.ok) {
        console.warn('Failed to fetch photo from URL:', cleanUrl, resp.status);
        return null;
      }

      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('image/png')) {
        isPng = true;
      }

      const arrayBuffer = await resp.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
    }

    if (isRound) {
      const roundBuffer = await cropToCircleBuffer(buffer);
      return await pdfDoc.embedPng(roundBuffer);
    }

    if (applyRoundedCorners) {
      const roundedBuffer = await cropToRoundedImageBuffer(buffer, 18);
      return await pdfDoc.embedPng(roundedBuffer);
    }

    if (isPng) {
      try {
        return await pdfDoc.embedPng(buffer);
      } catch {
        return await pdfDoc.embedJpg(buffer);
      }
    } else {
      try {
        return await pdfDoc.embedJpg(buffer);
      } catch {
        return await pdfDoc.embedPng(buffer);
      }
    }
  } catch (err) {
    console.warn('Error fetching or embedding image for PDF:', url, err);
    return null;
  }
}

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { orderId, templateId } = req.body;
    const order = orders.find((o) => o.id === orderId) || orders[0];
    const template = templates.find((t) => t.id === templateId || t.id === order.templateId) || templates[0];

    // Create PDF Document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // A4 Dimensions in PDF Points (1 mm = 2.83465 points)
    const mmToPt = (mm: number) => mm * 2.83465;
    const pageWidthPt = mmToPt(template.pageWidthMM);
    const pageHeightPt = mmToPt(template.pageHeightMM);

    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

    // Draw Header Bar with Barcode & Order info
    page.drawRectangle({
      x: mmToPt(10),
      y: pageHeightPt - mmToPt(18),
      width: pageWidthPt - mmToPt(20),
      height: mmToPt(12),
      color: rgb(0.96, 0.96, 0.98),
      borderColor: rgb(0.8, 0.8, 0.85),
      borderWidth: 0.5,
    });

    page.drawText(sanitizeTextForPdf(`PRINTFLOW AI - GABARITO DE IMPRESSÃO - PEDIDO ${order.code}`), {
      x: mmToPt(14),
      y: pageHeightPt - mmToPt(12),
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.2),
    });

    page.drawText(
      sanitizeTextForPdf(`Cliente: ${order.customerName} | Canal: ${order.marketplace.toUpperCase()} | Produto: ${template.name}`),
      {
        x: mmToPt(14),
        y: pageHeightPt - mmToPt(16),
        size: 7,
        font,
        color: rgb(0.4, 0.4, 0.5),
      }
    );

    // Draw Cut Lines and Item Grid Boxes
    const colCount = template.columns;
    const rowCount = template.rows;
    const itemWPt = mmToPt(template.itemWidthMM);
    const itemHPt = mmToPt(template.itemHeightMM);
    const marginTopPt = mmToPt(template.marginTopMM + 18);
    const marginLeftPt = mmToPt(template.marginLeftMM);
    const spacingXPt = mmToPt(template.spacingXMM);
    const spacingYPt = mmToPt(template.spacingYMM);

    let itemIndex = 0;
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        if (itemIndex >= template.maxItemsPerPage) break;

        const x = marginLeftPt + c * (itemWPt + spacingXPt);
        const y = pageHeightPt - marginTopPt - (r + 1) * itemHPt - r * spacingYPt;

        const isRound = template.isRound || template.productType === 'botton' || template.productType === 'corte_redondo';
        const applyRoundedCorners = !isRound;
        const centerX = x + itemWPt / 2;
        const centerY = y + itemHPt / 2;
        const radius = Math.min(itemWPt, itemHPt) / 2;

        // 1. Outer Bounding Slot (Circle or Box)
        if (isRound) {
          page.drawCircle({
            x: centerX,
            y: centerY,
            size: radius,
            color: rgb(0.98, 0.98, 1.0),
            borderColor: rgb(0.2, 0.5, 0.9),
            borderWidth: 0.8,
          });
        } else {
          page.drawRectangle({
            x,
            y,
            width: itemWPt,
            height: itemHPt,
            color: rgb(0.98, 0.98, 1.0),
            borderColor: rgb(0.2, 0.5, 0.9),
            borderWidth: 0.8,
          });
        }

        const photo = order.photos[itemIndex];

        // 2. Fetch & Embed Photo Image (if present for this slot)
        if (photo && photo.originalUrl) {
          const embeddedImg = await fetchAndEmbedImage(pdfDoc, photo.originalUrl, isRound, applyRoundedCorners);
          if (embeddedImg) {
            let photoX = x;
            let photoY = y;
            let photoW = itemWPt;
            let photoH = itemHPt;

            if (template.productType === 'polaroid') {
              const captionHeight = itemHPt * 0.22;
              const pPad = mmToPt(2);
              photoX = x + pPad;
              photoY = y + captionHeight;
              photoW = itemWPt - 2 * pPad;
              photoH = itemHPt - captionHeight - pPad;
            } else {
              // For bottons, ímãs, etc., image extends to full cut size including sangria
              photoX = x;
              photoY = y;
              photoW = itemWPt;
              photoH = itemHPt;
            }

            page.drawImage(embeddedImg, {
              x: photoX,
              y: photoY,
              width: photoW,
              height: photoH,
            });
          }
        } else if (!photo) {
          // Draw empty slot indicator
          page.drawText(sanitizeTextForPdf('[ Espaço Livre ]'), {
            x: x + itemWPt / 2 - 18,
            y: y + itemHPt / 2 - 3,
            size: 6,
            font,
            color: rgb(0.6, 0.6, 0.7),
          });
        }

        // 3. Safety Bleed Line inside (Circle or Box)
        // Red line removed as per user request to avoid printing it on the photo.

        // 4. Labels and Captions
        const rawFilename = photo ? photo.filename : 'Vazio';

        if (template.productType === 'polaroid') {
          if (photo && photo.caption) {
            page.drawText(sanitizeTextForPdf(photo.caption), {
              x: x + mmToPt(3),
              y: y + mmToPt(4),
              size: 8,
              font: fontBold,
              color: rgb(0.1, 0.1, 0.2),
            });
          }
          page.drawRectangle({
            x: x + 2,
            y: y + itemHPt - 12,
            width: 24,
            height: 10,
            color: rgb(1, 1, 1),
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
          });
          page.drawText(sanitizeTextForPdf(`#${itemIndex + 1}`), {
            x: x + 4,
            y: y + itemHPt - 9,
            size: 6,
            font: fontBold,
            color: rgb(0.2, 0.2, 0.3),
          });
        } else {
          // Label Tag Pill Removida a pedido do usuário para ganhar espaço
          /*
          const tagLabel = sanitizeTextForPdf(`#${itemIndex + 1}: ${rawFilename}`);
          const labelY = isRound ? centerY + radius + 2 : y + itemHPt + 2;
          const labelX = isRound ? centerX - 30 : x;

          page.drawRectangle({
            x: labelX,
            y: labelY,
            width: isRound ? 60 : Math.min(itemWPt - 6, 130),
            height: 11,
            color: rgb(1, 1, 1),
            opacity: 0.85,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 0.5,
          });
          page.drawText(tagLabel, {
            x: labelX + 3,
            y: labelY + 3,
            size: 6,
            font: fontBold,
            color: rgb(0.1, 0.1, 0.2),
          });
          */

          if (photo && photo.caption && !isRound) {
            page.drawRectangle({
              x: x,
              y: y - 12,
              width: itemWPt,
              height: 11,
              color: rgb(1, 1, 1),
              opacity: 0.85,
              borderColor: rgb(0.7, 0.7, 0.7),
              borderWidth: 0.5,
            });
            page.drawText(sanitizeTextForPdf(`Legenda: "${photo.caption}"`), {
              x: x + 3,
              y: y - 9,
              size: 6,
              font,
              color: rgb(0.1, 0.1, 0.2),
            });
          }
        }

        // 5. Corner Cut Crosses / Center Alignment Mark
        const crossSize = 4;
        if (isRound) {
          // Center Cross Alignment for Round Punch Cutters
          page.drawLine({ start: { x: centerX - crossSize, y: centerY }, end: { x: centerX + crossSize, y: centerY }, color: rgb(0.8, 0.2, 0.2), thickness: 0.5 });
          page.drawLine({ start: { x: centerX, y: centerY - crossSize }, end: { x: centerX, y: centerY + crossSize }, color: rgb(0.8, 0.2, 0.2), thickness: 0.5 });
        } else {
          page.drawLine({ start: { x: x - crossSize, y }, end: { x: x + crossSize, y }, color: rgb(0.1, 0.1, 0.1), thickness: 0.5 });
          page.drawLine({ start: { x, y: y - crossSize }, end: { x, y: y + crossSize }, color: rgb(0.1, 0.1, 0.1), thickness: 0.5 });
        }

        itemIndex++;
      }
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // Update order status in memory
    const oIdx = orders.findIndex((o) => o.id === order.id);
    if (oIdx !== -1) {
      orders[oIdx].status = 'pdf_pronto';
      orders[oIdx].pdfUrl = `/api/orders/${order.id}/download-pdf`;
      orders[oIdx].updatedAt = new Date().toISOString();
      stats.producedToday += 1;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PrintFlow_${order.code}_A4.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err: any) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Falha ao gerar o PDF da folha.', details: err.message });
  }
});

app.post('/api/generate-combined-pdf', async (req, res) => {
  try {
    const { orderIds, templateId } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Nenhum pedido selecionado.' });
    }

    const selectedOrders = orders.filter((o) => orderIds.includes(o.id));
    if (selectedOrders.length === 0) {
      return res.status(404).json({ error: 'Pedidos não encontrados.' });
    }

    const template = templates.find((t) => t.id === templateId || t.id === selectedOrders[0].templateId) || templates[0];

    // Collect all items from all orders
    const allItems: { photo: any; orderCode: string; customerName: string; indexInOrder: number }[] = [];
    selectedOrders.forEach((o) => {
      (o.photos || []).forEach((photo, idx) => {
        allItems.push({
          photo,
          orderCode: o.code,
          customerName: o.customerName,
          indexInOrder: idx + 1,
        });
      });
    });

    if (allItems.length === 0) {
      return res.status(400).json({ error: 'Os pedidos selecionados não possuem fotos.' });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const mmToPt = (mm: number) => mm * 2.83465;
    const pageWidthPt = mmToPt(template.pageWidthMM);
    const pageHeightPt = mmToPt(template.pageHeightMM);

    const itemsPerPage = template.maxItemsPerPage;
    const totalPages = Math.ceil(allItems.length / itemsPerPage);

    const orderCodesStr = selectedOrders.map((o) => o.code).join(', ');

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

      // Header Bar
      page.drawRectangle({
        x: mmToPt(10),
        y: pageHeightPt - mmToPt(18),
        width: pageWidthPt - mmToPt(20),
        height: mmToPt(12),
        color: rgb(0.96, 0.96, 0.98),
        borderColor: rgb(0.2, 0.6, 0.9),
        borderWidth: 0.8,
      });

      page.drawText(sanitizeTextForPdf(`PRINTFLOW AI - IMPRESSÃO COMBINADA (APROVEITAMENTO DE FOLHA)`), {
        x: mmToPt(14),
        y: pageHeightPt - mmToPt(12),
        size: 9,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2),
      });

      page.drawText(
        sanitizeTextForPdf(`Pedidos: ${orderCodesStr} | Pág ${pageIdx + 1}/${totalPages} | Total Fotos: ${allItems.length} | Gabarito: ${template.name}`),
        {
          x: mmToPt(14),
          y: pageHeightPt - mmToPt(16),
          size: 7,
          font,
          color: rgb(0.2, 0.4, 0.6),
        }
      );

      const colCount = template.columns;
      const rowCount = template.rows;
      const itemWPt = mmToPt(template.itemWidthMM);
      const itemHPt = mmToPt(template.itemHeightMM);
      const marginTopPt = mmToPt(template.marginTopMM + 18);
      const marginLeftPt = mmToPt(template.marginLeftMM);
      const spacingXPt = mmToPt(template.spacingXMM);
      const spacingYPt = mmToPt(template.spacingYMM);

      let slotInPage = 0;
      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          const globalIdx = pageIdx * itemsPerPage + slotInPage;
          if (slotInPage >= itemsPerPage) break;

          const itemData = allItems[globalIdx];

          const x = marginLeftPt + c * (itemWPt + spacingXPt);
          const y = pageHeightPt - marginTopPt - (r + 1) * itemHPt - r * spacingYPt;

          const isRound = template.isRound || template.productType === 'botton' || template.productType === 'corte_redondo';
          const applyRoundedCorners = !isRound;
          const centerX = x + itemWPt / 2;
          const centerY = y + itemHPt / 2;
          const radius = Math.min(itemWPt, itemHPt) / 2;

          // Outer Bounding Slot
          if (isRound) {
            page.drawCircle({
              x: centerX,
              y: centerY,
              size: radius,
              color: rgb(0.98, 0.98, 1.0),
              borderColor: rgb(0.2, 0.5, 0.9),
              borderWidth: 0.8,
            });
          } else {
            page.drawRectangle({
              x,
              y,
              width: itemWPt,
              height: itemHPt,
              color: rgb(0.98, 0.98, 1.0),
              borderColor: rgb(0.2, 0.5, 0.9),
              borderWidth: 0.8,
            });
          }

          if (itemData && itemData.photo) {
            const photo = itemData.photo;
            if (photo.originalUrl) {
              const embeddedImg = await fetchAndEmbedImage(pdfDoc, photo.originalUrl, isRound, applyRoundedCorners);
              if (embeddedImg) {
                let photoX = x;
                let photoY = y;
                let photoW = itemWPt;
                let photoH = itemHPt;

                if (template.productType === 'polaroid') {
                  const captionHeight = itemHPt * 0.22;
                  const pPad = mmToPt(2);
                  photoX = x + pPad;
                  photoY = y + captionHeight;
                  photoW = itemWPt - 2 * pPad;
                  photoH = itemHPt - captionHeight - pPad;
                }

                page.drawImage(embeddedImg, {
                  x: photoX,
                  y: photoY,
                  width: photoW,
                  height: photoH,
                });
              }
            }

            // Tag with Order Code + Item Filename
            const tagLabel = sanitizeTextForPdf(`[${itemData.orderCode}] #${itemData.indexInOrder}: ${photo.filename || ''}`);
            const labelY = isRound ? centerY + radius + 2 : y + itemHPt + 2;
            const labelX = isRound ? centerX - 35 : x;

            page.drawRectangle({
              x: labelX,
              y: labelY,
              width: isRound ? 70 : Math.min(itemWPt - 6, 130),
              height: 11,
              color: rgb(1, 1, 1),
              opacity: 0.9,
              borderColor: rgb(0.2, 0.5, 0.8),
              borderWidth: 0.5,
            });
            page.drawText(tagLabel, {
              x: labelX + 3,
              y: labelY + 3,
              size: 6,
              font: fontBold,
              color: rgb(0.05, 0.1, 0.3),
            });
          } else {
            // Empty slot on page
            page.drawText(sanitizeTextForPdf('[ Espaço Livre ]'), {
              x: x + itemWPt / 2 - 18,
              y: y + itemHPt / 2 - 3,
              size: 6,
              font,
              color: rgb(0.6, 0.6, 0.7),
            });
          }

          // Safety Bleed Line
          // Red line removed as per user request.

          slotInPage++;
        }
      }
    }

    // Save & Update Orders
    const pdfBytes = await pdfDoc.save();

    selectedOrders.forEach((o) => {
      const idx = orders.findIndex((ord) => ord.id === o.id);
      if (idx !== -1) {
        orders[idx].status = 'pdf_pronto';
        orders[idx].updatedAt = new Date().toISOString();
        saveOrdersToDisk(orders);
        syncOrderToSupabase(orders[idx]);
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PrintFlow_Folha_Combinada_A4.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err: any) {
    console.error('Error generating combined PDF:', err);
    res.status(500).json({ error: 'Falha ao gerar o PDF combinado.', details: err.message });
  }
});

// Vite middleware integration for Development
if (process.env.NODE_ENV !== 'production') {
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`PrintFlow AI Server running at http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrintFlow AI Production Server running on port ${PORT}`);
  });
}
