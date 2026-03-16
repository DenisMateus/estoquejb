import { useEffect, useState } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, Product, CategoryType, CATEGORY_LABELS } from '@/lib/inventory';
import AppLayout from '@/components/AppLayout';
import { Plus, Trash2, Search, Filter, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

const Guilhotina = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'todos' | CategoryType>('todos');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<'kg' | 'barra'>('kg');
  const [category, setCategory] = useState<'ferro_redondo' | 'tubo_aco'>('ferro_redondo');
  const [weightPerUnit, setWeightPerUnit] = useState('');

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editUnit, setEditUnit] = useState<'kg' | 'barra'>('kg');
  const [editCategory, setEditCategory] = useState<'ferro_redondo' | 'tubo_aco'>('ferro_redondo');
  const [editWeight, setEditWeight] = useState('');

  const reload = async () => {
    try {
      setProducts(await getProducts('guilhotina'));
    } catch (err: any) {
      toast.error('Erro ao carregar produtos');
    }
  };
  useEffect(() => { reload(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addProduct({
        code: code.trim(),
        description: description.trim(),
        unit,
        category,
        weightPerUnit: parseFloat(weightPerUnit) || 0,
        sector: 'guilhotina',
      });
      toast.success('Produto cadastrado com sucesso!');
      setCode(''); setDescription(''); setWeightPerUnit(''); setShowForm(false);
      reload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!confirm(`Excluir produto "${desc}"?`)) return;
    try {
      await deleteProduct(id);
      toast.success('Produto excluído');
      reload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setEditCode(p.code);
    setEditDescription(p.description);
    setEditUnit(p.unit);
    setEditCategory(p.category);
    setEditWeight(p.weightPerUnit > 0 ? String(p.weightPerUnit) : '');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    try {
      await updateProduct(editProduct.id, {
        code: editCode.trim(),
        description: editDescription.trim(),
        unit: editUnit,
        category: editCategory,
        weightPerUnit: parseFloat(editWeight) || 0,
      });
      toast.success('Produto atualizado!');
      setEditProduct(null);
      reload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterCategory('todos');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const filtered = products.filter(p => {
    const matchesSearch = search === '' ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'todos' || p.category === filterCategory;
    const createdDate = p.createdAt.split('T')[0];
    const matchesDateFrom = !filterDateFrom || createdDate >= filterDateFrom;
    const matchesDateTo = !filterDateTo || createdDate <= filterDateTo;
    return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const hasActiveFilters = filterCategory !== 'todos' || filterDateFrom || filterDateTo;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">Guilhotina — Produtos</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-card border rounded-lg p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Cadastrar Novo Produto — Guilhotina</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Código</label>
                <input value={code} onChange={e => setCode(e.target.value)} className="input-steel w-full font-mono" required placeholder="Ex: GH-001" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Descrição</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="input-steel w-full" required placeholder="Descrição do produto" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Unidade</label>
                <select value={unit} onChange={e => setUnit(e.target.value as any)} className="input-steel w-full">
                  <option value="kg">Quilograma (kg)</option>
                  <option value="barra">Barra</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Categoria</label>
                <select value={category} onChange={e => setCategory(e.target.value as any)} className="input-steel w-full">
                  <option value="ferro_redondo">Ferro Redondo</option>
                  <option value="tubo_aco">Tubo de Aço</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Peso/unidade (kg)</label>
                <input type="number" step="0.01" min="0" value={weightPerUnit} onChange={e => setWeightPerUnit(e.target.value)} className="input-steel w-full font-mono" placeholder="0.00" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm">
                Salvar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Filtros */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="w-4 h-4" />
            Filtros
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Código / Descrição</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="input-steel w-full pl-10" placeholder="Buscar..." />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Categoria</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className="input-steel w-full">
                <option value="todos">Todas</option>
                <option value="ferro_redondo">Ferro Redondo</option>
                <option value="tubo_aco">Tubo de Aço</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Cadastro de</label>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="input-steel w-full font-mono" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Cadastro até</label>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="input-steel w-full font-mono" />
            </div>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-primary hover:underline">
              Limpar filtros
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Código</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Unidade</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Estoque</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Peso/un (kg)</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Peso Total (kg)</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cadastro</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const totalWeight = p.weightPerUnit > 0 ? (p.quantity * p.weightPerUnit) : null;
                  return (
                    <tr key={p.id} className="border-b last:border-0 table-row-alt hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono font-semibold text-primary">{p.code}</td>
                      <td className="px-5 py-3">{p.description}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium
                          ${p.category === 'ferro_redondo' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                          {p.category === 'ferro_redondo' ? 'Ferro Redondo' : 'Tubo de Aço'}
                        </span>
                      </td>
                      <td className="px-5 py-3 uppercase font-mono text-xs">{p.unit}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold">{p.quantity}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs">
                        {p.weightPerUnit > 0 ? p.weightPerUnit.toFixed(2) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-primary">
                        {totalWeight !== null ? totalWeight.toFixed(2) : '—'}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)} className="text-muted-foreground hover:text-primary transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id, p.description)} className="text-destructive hover:text-destructive/80 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditProduct(null)}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-lg">Editar Produto</h3>
              <button onClick={() => setEditProduct(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Código</label>
                  <input value={editCode} onChange={e => setEditCode(e.target.value)} className="input-steel w-full font-mono" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Descrição</label>
                  <input value={editDescription} onChange={e => setEditDescription(e.target.value)} className="input-steel w-full" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Unidade</label>
                  <select value={editUnit} onChange={e => setEditUnit(e.target.value as any)} className="input-steel w-full">
                    <option value="kg">Quilograma (kg)</option>
                    <option value="barra">Barra</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Categoria</label>
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value as any)} className="input-steel w-full">
                    <option value="ferro_redondo">Ferro Redondo</option>
                    <option value="tubo_aco">Tubo de Aço</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1">Peso por unidade (kg)</label>
                  <input type="number" step="0.01" min="0" value={editWeight} onChange={e => setEditWeight(e.target.value)} className="input-steel w-full font-mono" placeholder="0.00" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditProduct(null)} className="px-4 py-2 rounded-md border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Guilhotina;
