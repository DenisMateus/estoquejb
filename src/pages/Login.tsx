import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { login, isAuthenticated, registerUser } from '@/lib/inventory';
import { Lock, User, UserPlus } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister) {
      if (username.length < 3) {
        setError('Usuário deve ter pelo menos 3 caracteres');
        return;
      }
      if (password.length < 4) {
        setError('Senha deve ter pelo menos 4 caracteres');
        return;
      }
      if (registerUser(username, password)) {
        setSuccess('Usuário cadastrado com sucesso! Faça login.');
        setIsRegister(false);
        setPassword('');
      } else {
        setError('Usuário já existe');
      }
    } else {
      if (login(username, password)) {
        navigate('/dashboard');
      } else {
        setError('Usuário ou senha incorretos');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center steel-gradient">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-card rounded-xl shadow-2xl p-8 border">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              {isRegister ? <UserPlus className="w-8 h-8 text-primary" /> : <Lock className="w-8 h-8 text-primary" />}
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Estoque <span className="text-accent">Jhonrob</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isRegister ? 'Cadastro de Novo Usuário' : 'Sistema de Controle de Estoque'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-steel w-full pl-10" placeholder="Digite seu usuário" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-steel w-full pl-10" placeholder="Digite sua senha" required />
              </div>
            </div>
            {error && <p className="text-destructive text-sm font-medium">{error}</p>}
            {success && <p className="text-green-600 text-sm font-medium">{success}</p>}
            <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-md hover:bg-primary/90 transition-colors">
              {isRegister ? 'Cadastrar' : 'Entrar'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
              className="text-sm text-primary hover:underline"
            >
              {isRegister ? 'Já tenho conta, fazer login' : 'Cadastrar novo usuário'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
