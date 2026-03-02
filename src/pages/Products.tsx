import { useEffect, useState } from 'react';
import { getProducts, addProduct, deleteProduct, Product } from '@/lib/inventory';
import AppLayout from '@/components/AppLayout';
import { Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<'kg' | 'barra'>('kg');
  const [category, setCategory] = useState<'ferro_redondo' | 'tubo_aco'>('ferro_redondo');

  const reload = () => setProducts(getProducts());
  useEffect(() => { reload(); }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addProduct({ code: code.trim(), description: description.trim(), unit, category });
      toast.success('Produto cadastrado com sucesso!');
      setCode(''); setDescription(''); setShowForm(false);
      reload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = (id: string, desc: string) => {
    if (!confirm(`Excluir produto "${desc}"?`)) return;
    deleteProduct(id);
    toast.success('Produto excluído');
    reload();
  };

  const filtered = products.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">Produtos Cadastrados</h2>
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
            <h3 className="font-semibold text-foreground">Cadastrar Novo Produto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Código</label>
                <input value={code} onChange={e => setCode(e.target.value)} className="input-steel w-full font-mono" required placeholder="Ex: FR-001" />
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

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-steel w-full pl-10"
            placeholder="Buscar por código ou descrição..."
          />
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
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cadastro</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
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
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(p.id, p.description)} className="text-destructive hover:text-destructive/80 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Products;
