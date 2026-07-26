import React, { useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Save,
  Copy,
  Sliders,
  CheckCircle2,
  FileCode,
  Grid,
  Maximize,
  ChevronDown,
  Package,
  Settings2
} from 'lucide-react';
import { PrintTemplate, PhotoKit } from '../types';
import { PackagePricingManager } from './PackagePricingManager';

interface TemplateEngineViewProps {
  templates: PrintTemplate[];
  onSaveTemplate: (template: Partial<PrintTemplate>) => void;
  photoKits?: PhotoKit[];
  onSaveKits?: (kits: PhotoKit[]) => void;
}

export const TemplateEngineView: React.FC<TemplateEngineViewProps> = ({
  templates,
  onSaveTemplate,
  photoKits = [],
  onSaveKits = (_kits: PhotoKit[]) => {},
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'pricing'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate>(templates[0]);
  const [jsonView, setJsonView] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState(selectedTemplate.name);
  const [columns, setColumns] = useState(selectedTemplate.columns);
  const [rows, setRows] = useState(selectedTemplate.rows);
  const [marginTop, setMarginTop] = useState(selectedTemplate.marginTopMM);
  const [marginLeft, setMarginLeft] = useState(selectedTemplate.marginLeftMM);
  const [spacingX, setSpacingX] = useState(selectedTemplate.spacingXMM);
  const [spacingY, setSpacingY] = useState(selectedTemplate.spacingYMM);
  const [itemWidth, setItemWidth] = useState(selectedTemplate.itemWidthMM);
  const [itemHeight, setItemHeight] = useState(selectedTemplate.itemHeightMM);
  const [innerFaceWidth, setInnerFaceWidth] = useState(selectedTemplate.innerFaceWidthMM || selectedTemplate.itemWidthMM - selectedTemplate.bleedMM * 2);
  const [innerFaceHeight, setInnerFaceHeight] = useState(selectedTemplate.innerFaceHeightMM || selectedTemplate.itemHeightMM - selectedTemplate.bleedMM * 2);
  const [bleed, setBleed] = useState(selectedTemplate.bleedMM);
  const [showCutLines, setShowCutLines] = useState(selectedTemplate.showCutLines);

  const handleSelectTemplate = (t: PrintTemplate) => {
    setSelectedTemplate(t);
    setName(t.name);
    setColumns(t.columns);
    setRows(t.rows);
    setMarginTop(t.marginTopMM);
    setMarginLeft(t.marginLeftMM);
    setSpacingX(t.spacingXMM);
    setSpacingY(t.spacingYMM);
    setItemWidth(t.itemWidthMM);
    setItemHeight(t.itemHeightMM);
    setInnerFaceWidth(t.innerFaceWidthMM || t.itemWidthMM - t.bleedMM * 2);
    setInnerFaceHeight(t.innerFaceHeightMM || t.itemHeightMM - t.bleedMM * 2);
    setBleed(t.bleedMM);
    setShowCutLines(t.showCutLines);
  };

  const handleSave = () => {
    const updated = {
      ...selectedTemplate,
      name,
      columns,
      rows,
      marginTopMM: marginTop,
      marginLeftMM: marginLeft,
      spacingXMM: spacingX,
      spacingYMM: spacingY,
      itemWidthMM: itemWidth,
      itemHeightMM: itemHeight,
      innerFaceWidthMM: innerFaceWidth,
      innerFaceHeightMM: innerFaceHeight,
      bleedMM: bleed,
      showCutLines,
      maxItemsPerPage: columns * rows,
    };
    onSaveTemplate(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const currentJsonSpec = {
    id: selectedTemplate.id,
    name,
    productType: selectedTemplate.productType,
    pageSize: selectedTemplate.pageSize,
    pageWidthMM: selectedTemplate.pageWidthMM,
    pageHeightMM: selectedTemplate.pageHeightMM,
    columns,
    rows,
    marginTopMM: marginTop,
    marginLeftMM: marginLeft,
    spacingXMM: spacingX,
    spacingYMM: spacingY,
    itemWidthMM: itemWidth,
    itemHeightMM: itemHeight,
    bleedMM: bleed,
    showCutLines,
    showBarcodes: true,
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('templates')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'templates'
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/60 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>1. Gabaritos e Impressão A4</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pricing')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'pricing'
              ? 'border-cyan-400 text-cyan-400 bg-slate-900/60 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>2. Tabela de Pacotes, Preços e Avulsos</span>
        </button>
      </div>

      {activeSubTab === 'pricing' ? (
        <PackagePricingManager
          photoKits={photoKits}
          onSaveKits={onSaveKits}
        />
      ) : (
        <>
          {/* Header */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
                <LayoutGrid className="w-5 h-5 text-cyan-400" />
                <span>Motor Universal de Templates (Engine JSON)</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Gabarito reutilizável para Foto Ímã, Polaroid, Caneca, Mousepad, Chaveiro e Quadros.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setJsonView(!jsonView)}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium px-3.5 py-2 rounded-xl transition-all"
              >
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>{jsonView ? 'Visualizar Formulário' : 'Visualizar JSON'}</span>
              </button>

              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Gabarito</span>
              </button>
            </div>
          </div>

      {savedSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs p-3 rounded-xl flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Template atualizado no Motor Universal com sucesso!</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Selector of Templates */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Selecione o Gabarito</span>
            <span className="text-xs text-cyan-400 font-bold">{templates.length} opções</span>
          </div>

          <div className="relative">
            <select
              value={selectedTemplate.id}
              onChange={(e) => {
                const found = templates.find((t) => t.id === e.target.value);
                if (found) handleSelectTemplate(found);
              }}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer pr-8"
            >
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id} className="bg-slate-900 text-slate-200">
                  {tmpl.name} ({tmpl.badgeTag})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-200">
              <span>{selectedTemplate.name}</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                {selectedTemplate.badgeTag}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">{selectedTemplate.description}</p>
            <div className="pt-1 text-[11px] font-semibold text-cyan-400">
              Grade: {columns}x{rows} • {columns * rows} por folha {selectedTemplate.pageSize}
            </div>
          </div>
        </div>

        {/* Middle Column: Visual Interactive Sheet Canvas */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Grid className="w-4 h-4 text-cyan-400" />
              <span>Simulador de Folha A4 (210x297 mm)</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-bold">
              {columns * rows} itens por folha
            </span>
          </div>

          {/* Simulated A4 Paper */}
          <div className="w-full aspect-[210/297] max-w-[340px] bg-white rounded-lg shadow-2xl p-4 relative border border-slate-300 overflow-hidden flex flex-col justify-between text-slate-900">
            {/* Sheet Header Banner */}
            <div className="border border-slate-300 bg-slate-100 p-1.5 rounded text-[8px] font-bold text-slate-800 flex justify-between items-center mb-2">
              <span>PRINTFLOW AI - GABARITO A4</span>
              <span>{name}</span>
            </div>

            {/* Grid Items */}
            <div
              className="grid gap-1 flex-1 w-full h-full"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columns * rows }).map((_, idx) => {
                const isRound = selectedTemplate.isRound || selectedTemplate.productType === 'botton' || selectedTemplate.productType === 'corte_redondo';
                return (
                  <div
                    key={idx}
                    className={`bg-cyan-50/80 border border-cyan-500/80 ${isRound ? 'rounded-full' : 'rounded'} relative flex items-center justify-center text-[9px] font-bold text-cyan-900`}
                  >
                    <span>#{idx + 1}</span>
                    {showCutLines && (
                      <span className={`absolute inset-0 border border-dashed border-red-500 pointer-events-none opacity-70 ${isRound ? 'rounded-full' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sheet Footer Barcodes */}
            <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between text-[7px] text-slate-500">
              <span>Sangria: {bleed}mm</span>
              <span>Item: {itemWidth}x{itemHeight}mm</span>
            </div>
          </div>
        </div>

        {/* Right Column: Parameters Form / JSON Editor */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
            {jsonView ? 'Especificação JSON do Template' : 'Parâmetros do Gabarito'}
          </h2>

          {jsonView ? (
            <pre className="bg-slate-950 p-4 rounded-xl text-cyan-300 text-[11px] font-mono overflow-x-auto max-h-[420px] border border-slate-800">
              {JSON.stringify(currentJsonSpec, null, 2)}
            </pre>
          ) : (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nome do Produto / Gabarito</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Colunas</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={columns}
                    onChange={(e) => setColumns(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Linhas</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Corte Total Largura (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={itemWidth}
                    onChange={(e) => setItemWidth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Corte Total Altura (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={itemHeight}
                    onChange={(e) => setItemHeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-cyan-400 mb-1 font-medium">Área Útil Visível (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={innerFaceWidth}
                    onChange={(e) => setInnerFaceWidth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-cyan-800/80 rounded-lg p-2 text-cyan-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Borda de Dobra / Sangria (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bleed}
                    onChange={(e) => setBleed(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Margem Topo (mm)</label>
                  <input
                    type="number"
                    value={marginTop}
                    onChange={(e) => setMarginTop(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Margem Esquerda (mm)</label>
                  <input
                    type="number"
                    value={marginLeft}
                    onChange={(e) => setMarginLeft(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Sangria / Bleed (mm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={bleed}
                    onChange={(e) => setBleed(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCutLines}
                      onChange={(e) => setShowCutLines(e.target.checked)}
                      className="accent-cyan-500 rounded"
                    />
                    <span>Linhas de Corte</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
