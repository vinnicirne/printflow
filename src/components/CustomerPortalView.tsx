import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Sparkles,
  CheckCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  ShoppingBag,
  Type,
  ArrowRight,
  Smile,
  Zap,
  CheckCircle2,
  ChevronDown,
  Package,
  Star,
  Copy,
  Camera,
  UploadCloud,
  Truck,
  ShieldCheck,
  Smartphone,
  Heart
} from 'lucide-react';
import { PrintTemplate, PhotoKit } from '../types';
import { createOrder } from '../services/api';
import { PackagePricingManager } from './PackagePricingManager';
import { INITIAL_PHOTO_KITS } from '../data/initialData';

interface CustomerPortalViewProps {
  templates: PrintTemplate[];
  photoKits?: PhotoKit[];
  onSaveKits?: (kits: PhotoKit[]) => void;
  onOrderCreated: () => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  templates,
  photoKits = INITIAL_PHOTO_KITS,
  onSaveKits = (_kits: PhotoKit[]) => {},
  onOrderCreated,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate>(templates[0]);
  const activeKits = photoKits.length > 0 ? photoKits : INITIAL_PHOTO_KITS;
  const [selectedKit, setSelectedKit] = useState<PhotoKit>(
    activeKits.find((k) => k.starred) || activeKits[0]
  );
  const [customerName, setCustomerName] = useState<string>(
    () => localStorage.getItem('printflow_customer_name') || ''
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    () => localStorage.getItem('printflow_customer_email') || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    () => localStorage.getItem('printflow_customer_phone') || ''
  );

  useEffect(() => {
    localStorage.setItem('printflow_customer_name', customerName);
  }, [customerName]);

  useEffect(() => {
    localStorage.setItem('printflow_customer_email', customerEmail);
  }, [customerEmail]);

  useEffect(() => {
    localStorage.setItem('printflow_customer_phone', customerPhone);
  }, [customerPhone]);
  const [showKitManager, setShowKitManager] = useState<boolean>(false);

  // Update selected kit if activeKits change
  useEffect(() => {
    if (!activeKits.some((k) => k.id === selectedKit.id)) {
      setSelectedKit(activeKits.find((k) => k.starred) || activeKits[0]);
    }
  }, [activeKits]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Photo list state (starts empty for real testing)
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; caption: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  const samplePhotoPool = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  ];

  const handleOpenPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const compressAndReadImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        if (!rawUrl) return resolve('');
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.90));
          } else {
            resolve(rawUrl);
          }
        };
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files) as File[];
    for (let idx = 0; idx < fileList.length; idx++) {
      const file = fileList[idx];
      const dataUrl = await compressAndReadImage(file);
      if (dataUrl) {
        setPhotos((prev) => [
          ...prev,
          {
            id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            url: dataUrl,
            caption: file.name.replace(/\.[^/.]+$/, ''),
          },
        ]);
      }
    }

    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleAddSamplePhoto = () => {
    const nextUrl = samplePhotoPool[photos.length % samplePhotoPool.length];
    setPhotos([
      ...photos,
      {
        id: String(Date.now()),
        url: nextUrl,
        caption: `Nova Lembrança #${photos.length + 1}`,
      },
    ]);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter((p) => p.id !== id));
  };

  const handleDuplicatePhoto = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;
    const copy = {
      ...photo,
      id: `${Date.now()}_copy_${Math.random().toString(36).substring(2, 6)}`,
      caption: `${photo.caption} (Cópia)`,
    };
    setPhotos([...photos, copy]);
  };

  const handleCaptionChange = (id: string, text: string) => {
    setPhotos(
      photos.map((p) => (p.id === id ? { ...p, caption: text } : p))
    );
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      alert("Por favor, preencha o seu Nome, E-mail e WhatsApp antes de finalizar o pedido.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder({
        customerName,
        customerEmail,
        customerPhone,
        marketplace: 'direto',
        productName: `${selectedTemplate.name} (${selectedKit.starred ? '⭐ ' : ''}${selectedKit.name})`,
        templateId: selectedTemplate.id,
        totalPhotos: photos.length,
        itemPrice: selectedKit.price,
        totalPrice: selectedKit.price,
        timeSavedMinutes: 15,
        shippingCarrier: 'melhor_envio',
        photos: photos.map((p) => ({
          id: `ph_${p.id}`,
          originalUrl: p.url,
          filename: `foto_${p.id}.jpg`,
          caption: p.caption,
          status: 'pending',
        })),
      });

      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        onOrderCreated();
      }, 2000);
    } catch (err) {
      console.error('Error submitting order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* LEFT PANE - FIXED BRANDING & HERO */}
      <div className="lg:w-[45%] lg:fixed lg:h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between overflow-y-auto relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="p-8 lg:p-12 relative z-10 space-y-12">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-xl shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">PrintFlow<span className="text-cyan-400">.AI</span></span>
          </div>

          {/* Hero Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-slate-950 border border-slate-800 text-cyan-300 px-4 py-1.5 rounded-full text-xs font-semibold shadow-xl">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>A Revolução da Fotografia IA</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1]">
              Suas Fotos Virando <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Lembranças Reais
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Transforme o rolo da câmera do seu celular em Ímãs e Polaroids. A IA faz o enquadramento perfeito pra você.
            </p>
          </div>

          {/* Quick Steps */}
          <div className="space-y-4 pt-4 border-t border-slate-800/60">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Como Funciona</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">1. Escolha o Pacote</p>
                  <p className="text-slate-500 text-xs">Selecione fotos, ímãs ou polaroids.</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">2. Envie do Celular</p>
                  <p className="text-slate-500 text-xs">Upload rápido. A IA enquadra os rostos.</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">3. Receba em Casa</p>
                  <p className="text-slate-500 text-xs">Impressão fotográfica de alta qualidade.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info in Left Side */}
        <div className="p-8 lg:p-12 border-t border-slate-800/60 relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
           <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
             <Star className="w-4 h-4 text-yellow-500" />
             <span>Qualidade Premium</span>
           </div>
           <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
             <ShieldCheck className="w-4 h-4 text-cyan-500" />
             <span>Privacidade Garantida</span>
           </div>
        </div>
      </div>

      {/* RIGHT PANE - ORDERING FORM */}
      <div className="lg:w-[55%] lg:ml-[45%] bg-slate-950 min-h-screen relative">
        <div className="max-w-3xl mx-auto p-4 sm:p-8 lg:p-12 space-y-8">
          
          <div className="space-y-2 mb-8 border-b border-slate-800 pb-6">
            <h2 className="text-2xl font-bold text-white">Criar Novo Pedido</h2>
            <p className="text-slate-400 text-sm">Preencha os dados abaixo e veja a mágica acontecer</p>
          </div>

      {orderSuccess && (
        <div className="bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 p-6 rounded-2xl text-center space-y-2 shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Pedido Recebido com Sucesso!</h2>
          <p className="text-xs text-emerald-300">
            Enviado diretamente para o AutoCrop AI e gerador de PDF A4 do PrintFlow.
          </p>
        </div>
      )}

      {/* Step 1: Customer Information */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>1. Dados para Envio do Pedido</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Seu Nome Completo</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Seu E-mail</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="joao@email.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-medium">WhatsApp p/ Rastreio</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="(11) 98765-4321"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Select Product Template */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span>2. Escolha o Produto / Tamanho Desejado</span>
          </h2>
          <span className="text-[11px] bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-2.5 py-1 rounded-lg font-semibold self-start sm:self-auto">
            {selectedTemplate.columns * selectedTemplate.rows} itens por folha {selectedTemplate.pageSize}
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 relative">
            <select
              value={selectedTemplate.id}
              onChange={(e) => {
                const found = templates.find((t) => t.id === e.target.value);
                if (found) setSelectedTemplate(found);
              }}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer pr-10"
            >
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id} className="bg-slate-900 text-slate-200">
                  {tmpl.name} — ({tmpl.badgeTag}) • {tmpl.columns}x{tmpl.rows} na folha {tmpl.pageSize}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 flex items-center justify-between gap-3">
            <span className="text-slate-400 text-[11px] shrink-0 font-medium">Descrição:</span>
            <span className="font-medium text-slate-200 truncate">{selectedTemplate.description}</span>
          </div>
        </div>
      </div>

      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Step 3: Upload Photos & Real-time Grid Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>3. Suas Fotos e Legendamento ({photos.length} de {selectedKit.photoCount} fotos)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enquadramento automático de rostos e pets no produto {selectedTemplate.name}.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {photos.length > 0 && (
              <button
                type="button"
                onClick={() => setPhotos([])}
                className="flex items-center space-x-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                title="Limpar todas as fotos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddSamplePhoto}
              className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium px-3 py-2 rounded-xl transition-all"
              title="Adicionar foto demonstrativa"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>Exemplo</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPicker}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Fotos Reais</span>
            </button>
          </div>
        </div>

        {/* Progress Bar for Package Completion */}
        {photos.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Progresso do Pacote ({selectedKit.name}):</span>
              <span className={`font-bold ${photos.length >= selectedKit.photoCount ? 'text-emerald-400' : 'text-cyan-300'}`}>
                {photos.length} / {selectedKit.photoCount} fotos ({Math.min(100, Math.round((photos.length / selectedKit.photoCount) * 100))}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  photos.length >= selectedKit.photoCount ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${Math.min(100, (photos.length / selectedKit.photoCount) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Live Product Preview Card (Fridge / Board Simulation) */}
        <div 
          className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 transition-all border-dashed hover:border-cyan-500/50"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const files = (Array.from(e.dataTransfer.files) as File[]).filter((f) => f.type.startsWith('image/'));
              files.forEach((file, idx) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const dataUrl = event.target?.result as string;
                  if (dataUrl) {
                    setPhotos((prev) => [
                      ...prev,
                      {
                        id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
                        url: dataUrl,
                        caption: file.name.replace(/\.[^/.]+$/, ''),
                      },
                    ]);
                  }
                };
                reader.readAsDataURL(file);
              });
            }
          }}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
            <span className="font-semibold text-slate-300">Simulação Visual no Produto Final (Arraste fotos aqui)</span>
            <span className="text-cyan-400 font-bold">AutoCrop AI Ativado</span>
          </div>

          {/* Photo Grid Mockup or Empty State */}
          {photos.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
              <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-300">Nenhuma foto adicionada ainda</p>
                <p className="text-[11px] text-slate-500">Selecione arquivos reais do seu computador para simular seu pedido completo.</p>
              </div>
              <button
                type="button"
                onClick={handleOpenPicker}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Selecionar Minhas Fotos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((p, idx) => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2 group">
                  <div className={`relative aspect-square ${selectedTemplate.isRound || selectedTemplate.productType === 'botton' || selectedTemplate.productType === 'corte_redondo' ? 'rounded-full border-2 border-cyan-500/50 ring-2 ring-cyan-500/20' : 'rounded-lg border border-slate-800'} overflow-hidden bg-slate-950`}>
                    <img src={p.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-slate-950/80 text-cyan-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <div className="absolute top-1 right-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleDuplicatePhoto(p.id)}
                        className="bg-cyan-600/90 hover:bg-cyan-500 text-white p-1 rounded-md shadow"
                        title="Duplicar foto (+1 cópia)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="bg-rose-600/90 hover:bg-rose-600 text-white p-1 rounded-md shadow"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                      <Type className="w-3 h-3 text-cyan-400" />
                      <span>Legenda da Foto:</span>
                    </label>
                    <input
                      type="text"
                      value={p.caption}
                      onChange={(e) => handleCaptionChange(p.id, e.target.value)}
                      placeholder="Sua legenda personalizada..."
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Select Package / Photo Kit */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <span>4. Escolha o Pacote de Fotos</span>
            </h2>
          </div>

          <span className="text-xs text-slate-300 bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
            Selecionado: <strong className="text-cyan-300 font-bold">{selectedKit.starred ? '⭐ ' : ''}{selectedKit.name} — R$ {selectedKit.price.toFixed(2).replace('.', ',')}</strong>
          </span>
        </div>


        <div className="space-y-3 pt-2">
          {activeKits.map((kit) => {
            const isSelected = selectedKit.id === kit.id;
            return (
              <button
                key={kit.id}
                type="button"
                onClick={() => setSelectedKit(kit)}
                className={`w-full relative flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                    : 'bg-slate-950/50 hover:bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-cyan-400 bg-cyan-950' : 'border-slate-600'}`}>
                     {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
                  </div>
                  <div className="text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {kit.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {kit.starred && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                        {kit.tag && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                            {kit.tag}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Rende até <span className="font-semibold text-slate-400">{kit.photoCount} fotos</span></p>
                  </div>
                </div>
                
                <div className="text-right pl-3 border-l border-slate-800/60">
                  <span className={`text-lg font-black tracking-tight ${isSelected ? 'text-cyan-400' : 'text-slate-300'}`}>
                    R$ {kit.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Total and Submit Action */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400">Total do Pedido ({photos.length} fotos — {selectedKit.starred ? '⭐ ' : ''}{selectedKit.name}):</span>
            <span className="text-2xl font-extrabold text-cyan-300 ml-2">R$ {selectedKit.price.toFixed(2).replace('.', ',')}</span>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>{isSubmitting ? 'Enviando Pedido...' : 'Aprovar e Enviar para Produção Instantânea'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

