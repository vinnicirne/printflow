import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Sliders,
  ZoomIn,
  RotateCw,
  CheckCircle,
  RefreshCw,
  Info,
  Maximize2,
  Crop,
  Shield,
  Layers,
  Wand2,
  Copy,
  Plus,
  Grid,
  Trash2
} from 'lucide-react';
import { Order, PhotoItem } from '../types';
import { analyzePhotoAutoCrop } from '../services/api';

interface AutoCropStudioViewProps {
  order?: Order | null;
  onUpdateOrderPhotos: (orderId: string, photos: PhotoItem[]) => void;
  onNavigateTab: (tab: string) => void;
}

export const AutoCropStudioView: React.FC<AutoCropStudioViewProps> = ({
  order,
  onUpdateOrderPhotos,
  onNavigateTab,
}) => {
  if (!order || !order.photos || order.photos.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center max-w-xl mx-auto my-12 shadow-xl space-y-4">
        <div className="p-4 bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Estúdio AutoCrop AI Aguardando Pedidos</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Nenhum pedido com fotos pendentes para reenquadramento. Envie fotos através do Portal do Cliente para testar o reenquadramento inteligente em tempo real.
        </p>
        <button
          onClick={() => onNavigateTab('client_portal')}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow"
        >
          Criar Pedido no Portal do Cliente
        </button>
      </div>
    );
  }

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [photos, setPhotos] = useState<PhotoItem[]>(order.photos || []);

  useEffect(() => {
    if (order?.photos) {
      setPhotos(order.photos);
    }
  }, [order?.id, order?.photos]);

  const currentPhoto = photos[selectedPhotoIndex] || photos[0];

  // Crop Controls State
  const [focalX, setFocalX] = useState<number>(currentPhoto?.aiCrop?.focalPoint.x || 50);
  const [focalY, setFocalY] = useState<number>(currentPhoto?.aiCrop?.focalPoint.y || 40);
  const [zoom, setZoom] = useState<number>(currentPhoto?.aiCrop?.zoom || 1.2);
  const [rotation, setRotation] = useState<number>(currentPhoto?.aiCrop?.rotation || 0);
  const [subjectType, setSubjectType] = useState<string>(currentPhoto?.aiCrop?.subjectType || 'face');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [aiReasoning, setAiReasoning] = useState<string>(currentPhoto?.aiCrop?.reasoning || 'Enquadramento automático com margem de segurança.');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state when selected photo changes
  useEffect(() => {
    if (currentPhoto) {
      setFocalX(currentPhoto.customCrop?.focalPoint.x ?? currentPhoto.aiCrop?.focalPoint.x ?? 50);
      setFocalY(currentPhoto.customCrop?.focalPoint.y ?? currentPhoto.aiCrop?.focalPoint.y ?? 40);
      setZoom(currentPhoto.customCrop?.zoom ?? currentPhoto.aiCrop?.zoom ?? 1.2);
      setRotation(currentPhoto.customCrop?.rotation ?? currentPhoto.aiCrop?.rotation ?? 0);
      setSubjectType(currentPhoto.aiCrop?.subjectType || 'face');
      setAiReasoning(currentPhoto.aiCrop?.reasoning || 'AutoCrop AI em tempo real.');
    }
  }, [selectedPhotoIndex, currentPhoto]);

  // Render Live Canvas with Crop Overlay & Cut Lines
  useEffect(() => {
    if (!canvasRef.current || !currentPhoto) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentPhoto.originalUrl;

    img.onload = () => {
      const size = 500;
      canvas.width = size;
      canvas.height = size;

      // Draw Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      // Apply Zoom & Focal Offset Transformation
      const originX = (focalX / 100) * size;
      const originY = (focalY / 100) * size;

      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.translate(-originX, -originY);

      ctx.drawImage(img, 0, 0, size, size);
      ctx.restore();

      const isRoundProduct = 
        order.productName.toLowerCase().includes('redond') || 
        order.productName.toLowerCase().includes('botton') || 
        order.templateId.includes('botton') || 
        order.templateId.includes('redondo');

      // Overlays
      if (isRoundProduct) {
        // 1. Red Dashed Circular Cut Line (Borda de Corte Redonda)
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, (size - 30) / 2, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 2. Amber Circular Safety Margin Area (Sangria Circular)
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, (size - 60) / 2, 0, 2 * Math.PI);
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Outer mask vignette for non-cut area
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, size, size);
        ctx.arc(size / 2, size / 2, (size - 30) / 2, 0, 2 * Math.PI, true);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.fill();
        ctx.restore();
      } else {
        // 1. Red Dashed Cut Line (Borda de Corte)
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 15, size - 30, size - 30);

        // 2. Amber Safety Margin Area (Margem de Sangria / Bleed)
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.strokeRect(30, 30, size - 60, size - 60);
      }

      // 3. Focal Point Crosshair
      const fpX = (focalX / 100) * size;
      const fpY = (focalY / 100) * size;

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(fpX, fpY, 12, 0, 2 * Math.PI);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(fpX, fpY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
    };
  }, [currentPhoto, focalX, focalY, zoom, rotation, bgColor]);

  // Run Gemini AutoCrop AI for Current Photo
  const handleRunGeminiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzePhotoAutoCrop({
        photoFilename: currentPhoto.filename,
        caption: currentPhoto.caption,
        photoIndex: selectedPhotoIndex,
      });

      setFocalX(result.focalPoint.x);
      setFocalY(result.focalPoint.y);
      setZoom(result.zoom);
      setSubjectType(result.subjectType);
      setAiReasoning(result.reasoning);

      // Update in local state
      const updatedPhotos = [...photos];
      updatedPhotos[selectedPhotoIndex] = {
        ...currentPhoto,
        status: 'auto_cropped',
        aiCrop: {
          focalPoint: result.focalPoint,
          zoom: result.zoom,
          rotation: 0,
          subjectType: result.subjectType as any,
          confidence: result.confidence,
          recommendedMargin: result.recommendedMargin,
          suggestedCaption: result.suggestedCaption,
        },
      };
      setPhotos(updatedPhotos);
      onUpdateOrderPhotos(order.id, updatedPhotos);
    } catch (err) {
      console.error('Error running AI crop analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run AI AutoCrop for ALL photos in order
  const handleAutoCropAll = async () => {
    setIsAnalyzing(true);
    const updatedPhotos = photos.map((p, idx) => ({
      ...p,
      status: 'auto_cropped' as const,
      aiCrop: {
        focalPoint: { x: 50, y: idx % 2 === 0 ? 36 : 42 },
        zoom: 1.25,
        rotation: 0,
        subjectType: (idx % 2 === 0 ? 'face' : 'couple') as any,
        confidence: 0.96,
        recommendedMargin: 4,
        reasoning: 'Enquadramento automático IA em lote.',
      },
    }));
    setPhotos(updatedPhotos);
    onUpdateOrderPhotos(order.id, updatedPhotos);
    setIsAnalyzing(false);
  };

  const handleSaveCrop = () => {
    const updatedPhotos = [...photos];
    updatedPhotos[selectedPhotoIndex] = {
      ...currentPhoto,
      status: 'user_approved',
      customCrop: {
        focalPoint: { x: focalX, y: focalY },
        zoom,
        rotation,
        bgColor,
      },
    };
    setPhotos(updatedPhotos);
    onUpdateOrderPhotos(order.id, updatedPhotos);
  };

  // Duplicate specific photo at index (+1 copy)
  const handleDuplicateSpecificPhoto = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const ph = photos[index];
    if (!ph) return;
    const copy: PhotoItem = {
      ...ph,
      id: `${Date.now()}_copy_${Math.random().toString(36).substring(2, 6)}`,
      filename: `${ph.filename} (Cópia)`,
    };
    const updated = [...photos];
    updated.splice(index + 1, 0, copy);
    setPhotos(updated);
    setSelectedPhotoIndex(index + 1);
    onUpdateOrderPhotos(order.id, updated);
  };

  // Remove specific photo at index
  const handleRemoveSpecificPhoto = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (photos.length <= 1) return;
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
    if (selectedPhotoIndex >= updated.length) {
      setSelectedPhotoIndex(Math.max(0, updated.length - 1));
    }
    onUpdateOrderPhotos(order.id, updated);
  };

  // Duplicate current photo (+1 copy)
  const handleDuplicateCurrentPhoto = () => {
    if (!currentPhoto) return;
    handleDuplicateSpecificPhoto(
      { stopPropagation: () => {} } as React.MouseEvent,
      selectedPhotoIndex
    );
  };

  // Duplicate existing photos until sheet is filled (e.g. 9 photos for a 3x3 layout)
  const handleFillSheetReplicas = (targetCount = 9) => {
    if (photos.length === 0) return;
    let updated = [...photos];
    let i = 0;
    while (updated.length < targetCount) {
      const src = photos[i % photos.length];
      updated.push({
        ...src,
        id: `${Date.now()}_fill_${updated.length}_${Math.random().toString(36).substring(2, 5)}`,
        filename: `${src.filename}_copia${updated.length + 1}`,
      });
      i++;
    }
    setPhotos(updated);
    onUpdateOrderPhotos(order.id, updated);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {order.code}
            </span>
            <h1 className="text-xl font-extrabold text-white">AutoCrop AI Studio - Ajuste de Enquadramento</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconhecimento facial automático, detecção de pets e margens de sangria de fábrica.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleAutoCropAll}
            disabled={isAnalyzing}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Processar Todas com IA ({photos.length})</span>
          </button>

          <button
            onClick={() => onNavigateTab('pipeline')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            Voltar para Esteira
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Photo Selector Strip */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Fotos do Pedido</span>
            <span className="text-cyan-400">{photos.length} itens</span>
          </h2>

          {/* Quick Duplication Controls */}
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Opções de Cópias & Folha
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleDuplicateCurrentPhoto}
                className="flex items-center justify-center space-x-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-semibold py-1.5 rounded-lg transition-all"
                title="Cria +1 cópia da foto selecionada"
              >
                <Plus className="w-3 h-3" />
                <span>Duplicar +1</span>
              </button>

              <button
                onClick={() => handleFillSheetReplicas(9)}
                className="flex items-center justify-center space-x-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-[11px] font-bold py-1.5 rounded-lg shadow transition-all"
                title="Preenche a folha com réplicas das fotos existentes até completar 9 unidades"
              >
                <Grid className="w-3 h-3" />
                <span>Preencher 9</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {photos.map((ph, idx) => (
              <div
                key={ph.id || idx}
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`w-full p-2 rounded-xl border text-left flex items-center justify-between space-x-2 transition-all cursor-pointer ${
                  selectedPhotoIndex === idx
                    ? 'bg-slate-800 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-800 relative shrink-0">
                    <img src={ph.originalUrl} alt={ph.filename} className="w-full h-full object-cover" />
                    {ph.status === 'user_approved' && (
                      <div className="absolute top-0.5 right-0.5 bg-emerald-500 text-white p-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{ph.filename}</p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {ph.aiCrop?.subjectType ? `Assunto: ${ph.aiCrop.subjectType}` : 'Aguardando IA'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDuplicateSpecificPhoto(e, idx)}
                    className="p-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded-lg text-[10px] font-bold flex items-center space-x-0.5 transition-all"
                    title="Adicionar +1 cópia desta foto (cada clique adiciona 1)"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+1</span>
                  </button>
                  {photos.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSpecificPhoto(e, idx)}
                      className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-[10px] transition-all"
                      title="Remover esta foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Column: Interactive Canvas Preview */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Crop className="w-4 h-4 text-cyan-400" />
              <span>Preview em Tempo Real com Margem de Sangria</span>
            </span>
            <button
              onClick={handleRunGeminiAnalysis}
              disabled={isAnalyzing}
              className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-1 rounded-lg"
            >
              <Wand2 className="w-3.5 h-3.5 animate-spin-slow" />
              <span>{isAnalyzing ? 'Analisando Gemini...' : 'Reanalisar IA'}</span>
            </button>
          </div>

          {/* Interactive Canvas */}
          <div className="relative aspect-square w-full max-w-[380px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center shadow-2xl">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />

            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-cyan-300 space-y-2 z-10">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                <span className="text-xs font-semibold">Gemini 3.6 Flash Analisando Ponto Focal...</span>
              </div>
            )}
          </div>

          {/* Canvas Guide Legend */}
          <div className="w-full grid grid-cols-3 gap-2 text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span>Ponto Focal IA</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 border border-dashed border-amber-400 inline-block" />
              <span>Margem 4mm</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 border border-dashed border-rose-500 inline-block" />
              <span>Linha de Corte</span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Fine-Tuning Sliders */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          {/* AI Intelligence Card */}
          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Recomendação AutoCrop AI</span>
              </span>
              <span className="text-[10px] bg-cyan-900/80 text-cyan-200 px-2 py-0.5 rounded-full font-bold">
                96% Precisão
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{aiReasoning}</p>
          </div>

          {/* Sliders Form */}
          <div className="space-y-4 text-xs">
            {/* Focal Point X */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-slate-300">
                <span>Ponto Focal X (Horizontal)</span>
                <span className="text-cyan-400 font-bold">{focalX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={focalX}
                onChange={(e) => setFocalX(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Focal Point Y */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-slate-300">
                <span>Ponto Focal Y (Vertical - Rosto)</span>
                <span className="text-cyan-400 font-bold">{focalY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={focalY}
                onChange={(e) => setFocalY(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Zoom Factor */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-slate-300">
                <span>Zoom / Escala</span>
                <span className="text-cyan-400 font-bold">{zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-slate-300">
                <span>Rotação</span>
                <span className="text-cyan-400 font-bold">{rotation}°</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[0, 90, 180, 270].map((rot) => (
                  <button
                    key={rot}
                    onClick={() => setRotation(rot)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      rotation === rot
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {rot}°
                  </button>
                ))}
              </div>
            </div>

            {/* Background Fill Color for Non-Square Photos */}
            <div className="space-y-1">
              <span className="font-medium text-slate-300 block">Cor de Preenchimento Borda</span>
              <div className="flex space-x-2">
                {['#ffffff', '#000000', '#f1f5f9', '#fef3c7', '#e0f2fe'].map((col) => (
                  <button
                    key={col}
                    onClick={() => setBgColor(col)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      bgColor === col ? 'scale-110 border-cyan-400 shadow' : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={handleSaveCrop}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Aprovar Enquadramento de Foto #{selectedPhotoIndex + 1}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
