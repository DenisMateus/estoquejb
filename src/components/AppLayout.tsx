import { ReactNode, useState } from 'react';
import logoHeader from '@/assets/logo_header.png';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { logout } from '@/lib/inventory';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  FileSpreadsheet,
  Scissors,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Cog,
  Fan,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { path: '/products', label: 'Usinagem', icon: Package },
  { path: '/guilhotina', label: 'Guilhotina', icon: Scissors },
  { path: '/motorredutores', label: 'MTD', icon: Cog },
  { path: '/ventiladores', label: 'Ventiladores', icon: Fan },
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
      <header className="steel-gradient text-foreground shadow-lg sticky top-0 z-40 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <img src={logoHeader} alt="Jhonrob" className="h-8" />
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
                      ? 'bg-foreground/15 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/10'
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
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <span className="text-sm text-muted-foreground font-mono hidden sm:block">PCP4</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border px-4 py-2 space-y-1">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                    ${active ? 'bg-foreground/15 text-foreground' : 'text-muted-foreground'}`}
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
