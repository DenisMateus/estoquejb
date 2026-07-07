import { useEffect, useRef, useState } from 'react';
import { X, Upload, Sparkles, Trash2, ImagePlus, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  addMtdProduct, addMtdMovement, MTD_TYPE_LABELS, MtdType, CONDICAO_OPTIONS,
} from '@/lib/mtd';

export interface ExtractedMotor {
  code: string;
  description: string;
  mtdType: MtdType;
  quantity: number;
  cliente: string;
  notaFiscal: string;
  ofNumber: string;
  portaria: string;
  condicao: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultDate: string;
}

export default function AdvancedEntryDialog({ open, onClose, onSaved, defaultDate }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [motors, setMotors] = useState<ExtractedMotor[]>([]);
  const [date, setDate] = useState(defaultDate);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) setDate(defaultDate); }, [open, defaultDate]);

  // Paste image from clipboard
  useEffect(() => {
    if (!open) return;
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => setImages(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
          }
        }
      }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [open]);

  if (!open) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => setImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleExtract = async () => {
    if (images.length === 0) { toast.error('Adicione ao menos uma imagem.'); return; }
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-mtd', { body: { images } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const extracted: ExtractedMotor[] = (data?.motors || []).map((m: any) => ({
        code: m.code || '',
        description: m.description || '',
        mtdType: (m.mtdType || 'REDLER') as MtdType,
        quantity: Math.max(1, Number(m.quantity) || 1),
        cliente: m.cliente || '',
        notaFiscal: m.notaFiscal || '',
        ofNumber: m.ofNumber || '',
        portaria: m.portaria || '',
        condicao: m.condicao || '',
      }));
      if (extracted.length === 0) { toast.warning('Nenhum motor identificado nas imagens.'); return; }
      setMotors(prev => [...prev, ...extracted]);
      toast.success(`${extracted.length} motor(es) extraído(s). Confira antes de salvar.`);
    } catch (err: any) {
      toast.error(err.message || 'Falha ao extrair dados.');
    } finally { setExtracting(false); }
  };

  const updateMotor = (i: number, patch: Partial<ExtractedMotor>) =>
    setMotors(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m));

  const removeMotor = (i: number) => setMotors(prev => prev.filter((_, idx) => idx !== i));

  const handleSaveAll = async () => {
    if (motors.length === 0) { toast.error('Nenhum motor para salvar.'); return; }
    for (const m of motors) {
      if (!m.code.trim() || !m.description.trim() || !m.cliente.trim() || !m.notaFiscal.trim() || !m.condicao.trim()) {
        toast.error('Preencha Código, Descrição, Cliente, NF e Condição em todos os motores.');
        return;
      }
    }
    setSaving(true);
    let created = 0;
    try {
      for (const m of motors) {
        const portariaToUse = m.portaria.trim() || date;
        const qty = Math.max(1, m.quantity || 1);
        for (let i = 0; i < qty; i++) {
          const newProduct = await addMtdProduct({
            code: m.code.trim(),
            description: m.description.trim(),
            mtdType: m.mtdType,
            quantity: 1,
            portaria: portariaToUse,
            notaFiscal: m.notaFiscal.trim(),
            ofNumber: m.ofNumber.trim(),
            cliente: m.cliente.trim(),
            condicao: m.condicao.trim(),
          });
          await addMtdMovement({
            mtdProductId: newProduct.id,
            mtdProductCode: newProduct.code,
            mtdProductDescription: newProduct.description,
            type: 'entrada',
            quantity: 1,
            clienteDestino: m.cliente.trim(),
            notaFiscal: m.notaFiscal.trim(),
            date,
            observacao: `Portaria: ${portariaToUse} | OF: ${m.ofNumber.trim()} (entrada avançada)`,
          }, true);
          created++;
        }
      }
      toast.success(`${created} motor(es) cadastrado(s) com sucesso!`);
      setMotors([]); setImages([]);
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(`Erro após criar ${created}: ${err.message}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-card border rounded-lg w-full max-w-6xl my-4 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10 rounded-t-lg">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Entrada Avançada de MTD (extrair de imagem)
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-muted-foreground">
            Anexe ou cole (<kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+V</kbd>) imagens de uma NF ou planilha Excel com os motores.
            A IA irá extrair os dados de todos os motores (5 a 30 por imagem). <strong>Nada é salvo automaticamente</strong> — você confere e edita antes de cadastrar.
          </p>

          {/* Image dropzone */}
          <div
            ref={dropRef}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed rounded-lg p-4 text-center bg-muted/30"
          >
            <div className="flex flex-wrap gap-3 justify-center items-center">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                <Upload className="w-4 h-4" /> Selecionar imagens
              </button>
              <span className="text-xs text-muted-foreground">ou arraste/cole aqui (Ctrl+V)</span>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
                {images.map((src, idx) => (
                  <div key={idx} className="relative group border rounded overflow-hidden bg-background">
                    <img src={src} alt={`img-${idx}`} className="w-full h-24 object-cover" />
                    <button onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button type="button" onClick={handleExtract} disabled={extracting || images.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-success text-white text-sm font-semibold hover:bg-success/90 disabled:opacity-50">
              {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {extracting ? 'Extraindo dados...' : 'Extrair dados da(s) imagem(ns)'}
            </button>
            {motors.length > 0 && (
              <button type="button" onClick={() => setMotors([])}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-muted">
                <Trash2 className="w-4 h-4" /> Limpar extraídos
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Data da entrada:</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-steel font-mono text-sm" />
            </div>
          </div>

          {/* Extracted motors table */}
          {motors.length > 0 && (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold">#</th>
                    <th className="px-2 py-2 text-left font-semibold">Código</th>
                    <th className="px-2 py-2 text-left font-semibold">Descrição</th>
                    <th className="px-2 py-2 text-left font-semibold">Equipamento</th>
                    <th className="px-2 py-2 text-left font-semibold">Condição</th>
                    <th className="px-2 py-2 text-left font-semibold">Qtd</th>
                    <th className="px-2 py-2 text-left font-semibold">Cliente</th>
                    <th className="px-2 py-2 text-left font-semibold">NF</th>
                    <th className="px-2 py-2 text-left font-semibold">OF</th>
                    <th className="px-2 py-2 text-left font-semibold">Portaria</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {motors.map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-1 py-1"><input value={m.code} onChange={e => updateMotor(i, { code: e.target.value })} className="input-steel w-28 font-mono text-xs" /></td>
                      <td className="px-1 py-1"><input value={m.description} onChange={e => updateMotor(i, { description: e.target.value })} className="input-steel w-56 text-xs" /></td>
                      <td className="px-1 py-1">
                        <select value={m.mtdType} onChange={e => updateMotor(i, { mtdType: e.target.value as MtdType })} className="input-steel text-xs w-36">
                          {Object.entries(MTD_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1">
                        <select value={m.condicao} onChange={e => updateMotor(i, { condicao: e.target.value })} className="input-steel text-xs w-32">
                          <option value="">Selecione...</option>
                          {CONDICAO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1"><input type="number" min={1} value={m.quantity} onChange={e => updateMotor(i, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="input-steel w-14 font-mono text-xs" /></td>
                      <td className="px-1 py-1"><input value={m.cliente} onChange={e => updateMotor(i, { cliente: e.target.value })} className="input-steel w-40 text-xs" /></td>
                      <td className="px-1 py-1"><input value={m.notaFiscal} onChange={e => updateMotor(i, { notaFiscal: e.target.value })} className="input-steel w-24 text-xs" /></td>
                      <td className="px-1 py-1"><input value={m.ofNumber} onChange={e => updateMotor(i, { ofNumber: e.target.value })} className="input-steel w-24 text-xs" /></td>
                      <td className="px-1 py-1"><input value={m.portaria} onChange={e => updateMotor(i, { portaria: e.target.value })} className="input-steel w-24 text-xs" /></td>
                      <td className="px-1 py-1">
                        <button onClick={() => removeMotor(i)} className="p-1 rounded hover:bg-destructive/10 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t sticky bottom-0 bg-card rounded-b-lg">
          <p className="text-xs text-muted-foreground">
            {motors.length > 0 ? `${motors.length} motor(es) prontos para cadastrar (total ${motors.reduce((s, m) => s + Math.max(1, m.quantity || 1), 0)} unidades).` : 'Nenhum motor extraído ainda.'}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Fechar</button>
            <button onClick={handleSaveAll} disabled={saving || motors.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-success text-white text-sm font-semibold hover:bg-success/90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Cadastrando...' : `Cadastrar ${motors.length} motor(es)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
