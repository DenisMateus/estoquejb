import { ReactNode, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { logout } from '@/lib/inventory';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { path: '/products', label: 'Produtos', icon: Package },
  { path: '/movements', label: 'Movimentações', icon: ArrowLeftRight },
  { path: '/reports', label: 'Relatórios', icon: FileSpreadsheet },
];

interface Props {
  children: ReactNode;
}

const AppLayout = ({ children }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="steel-gradient text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-lg font-bold tracking-tight">
              Estoque <span className="text-accent">Jhonrob</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${active
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <span className="text-sm text-white/70 font-mono hidden sm:block">PCP4</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-2 space-y-1">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                    ${active ? 'bg-white/15 text-white' : 'text-white/70'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
