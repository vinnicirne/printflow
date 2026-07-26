import React, { useState } from 'react';
import { PhotoKit } from '../types';
import { Plus, Trash2, Edit2, Save, X, Star, RotateCcw, Package, DollarSign, Tag, Hash } from 'lucide-react';
import { INITIAL_PHOTO_KITS } from '../data/initialData';

interface PackagePricingManagerProps {
  photoKits: PhotoKit[];
  onSaveKits: (kits: PhotoKit[]) => void;
  onClose?: () => void;
}

export const PackagePricingManager: React.FC<PackagePricingManagerProps> = ({
  photoKits,
  onSaveKits,
  onClose,
}) => {
  const [kits, setKits] = useState<PhotoKit[]>(photoKits);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for creating or editing
  const [formData, setFormData] = useState<Partial<PhotoKit>>({
    name: '',
    photoCount: 1,
    price: 10.0,
    starred: false,
    tag: '',
  });

  const handleStartCreate = () => {
    setEditingId('NEW');
    setFormData({
      id: 'kit_' + Date.now(),
      name: 'Novo Pacote',
      photoCount: 10,
      price: 49.90,
      starred: false,
      tag: '',
    });
  };

  const handleStartEdit = (kit: PhotoKit) => {
    setEditingId(kit.id);
    setFormData({ ...kit });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.photoCount || formData.price === undefined) {
      alert('Por favor preencha Nome, Quantidade de fotos e Valor R$.');
      return;
    }

    let updated: PhotoKit[];
    if (editingId === 'NEW') {
      const newKit: PhotoKit = {
        id: formData.id || 'kit_' + Date.now(),
        name: formData.name,
        photoCount: Number(formData.photoCount),
        price: Number(formData.price),
        starred: !!formData.starred,
        tag: formData.tag || undefined,
        isCustomUnit: !!formData.isCustomUnit,
      };
      updated = [...kits, newKit];
    } else {
      updated = kits.map((k) =>
        k.id === editingId
          ? ({
              ...k,
              name: formData.name,
              photoCount: Number(formData.photoCount),
              price: Number(formData.price),
              starred: !!formData.starred,
              tag: formData.tag || undefined,
              isCustomUnit: !!formData.isCustomUnit,
            } as PhotoKit)
          : k
      );
    }

    setKits(updated);
    onSaveKits(updated);
    setEditingId(null);
  };

  const handleDeleteItem = (id: string) => {
    if (kits.length <= 1) {
      alert('Você deve manter ao menos um pacote/preço configurado.');
      return;
    }
    if (confirm('Tem certeza que deseja remover este pacote/valor?')) {
      const updated = kits.filter((k) => k.id !== id);
      setKits(updated);
      onSaveKits(updated);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar a tabela padrão de pacotes e preços?')) {
      setKits(INITIAL_PHOTO_KITS);
      onSaveKits(INITIAL_PHOTO_KITS);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-slate-100 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span>Configuração de Pacotes, Preços e Avulsos</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie os valores cobrados por quantidade de fotos no portal do cliente e no balcão.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-all"
            title="Restaurar Pacotes Padrões"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={handleStartCreate}
            className="flex items-center space-x-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 font-bold text-white px-3.5 py-2 rounded-lg transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Pacote / Valor</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Editing / Form Modal or Inline Panel */}
      {editingId && (
        <div className="bg-slate-950 border border-cyan-500/50 rounded-xl p-4 space-y-4 shadow-lg animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              {editingId === 'NEW' ? 'Criar Novo Pacote de Preço' : 'Editar Pacote'}
            </span>
            <button onClick={handleCancelEdit} className="text-slate-400 hover:text-white text-xs">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nome do Produto / Pacote</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: ⭐ Kit Família (12)"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center space-x-1">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quantidade de Fotos</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.photoCount || 1}
                onChange={(e) => setFormData({ ...formData, photoCount: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span>Valor Total (R$)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-cyan-500 focus:outline-none font-bold text-cyan-300"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Tag / Destaque Visual</label>
              <input
                type="text"
                value={formData.tag || ''}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                placeholder="Ex: Mais Vendido, Promoção"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.starred}
                onChange={(e) => setFormData({ ...formData, starred: e.target.checked })}
                className="rounded border-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Marcar como Destaque ⭐</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.isCustomUnit}
                onChange={(e) => setFormData({ ...formData, isCustomUnit: e.target.checked })}
                className="rounded border-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <span>É cobrança por unidade/avulso</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveItem}
              className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Pacote</span>
            </button>
          </div>
        </div>
      )}

      {/* Table / Grid List of Kits */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="p-3">Destaque</th>
              <th className="p-3">Nome do Pacote</th>
              <th className="p-3 text-center">Qtd. Fotos</th>
              <th className="p-3 text-right">Valor Total (R$)</th>
              <th className="p-3 text-right">Preço por Foto</th>
              <th className="p-3 text-center">Tag Banner</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {kits.map((kit) => {
              const unitPrice = kit.photoCount > 0 ? kit.price / kit.photoCount : kit.price;
              return (
                <tr key={kit.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    {kit.starred ? (
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-slate-100">
                    {kit.name}
                  </td>
                  <td className="p-3 text-center font-mono text-cyan-300 font-bold">
                    {kit.photoCount} {kit.photoCount === 1 ? 'foto' : 'fotos'}
                  </td>
                  <td className="p-3 text-right font-extrabold text-emerald-400 text-sm">
                    R$ {kit.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-3 text-right text-slate-400 font-mono">
                    R$ {unitPrice.toFixed(2).replace('.', ',')} /un
                  </td>
                  <td className="p-3 text-center">
                    {kit.tag ? (
                      <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {kit.tag}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(kit)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Editar Pacote"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(kit.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Excluir Pacote"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
