import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, UnidadeData, translateError } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [unidade, setUnidade] = useState('');
  const [equipe, setEquipe] = useState('');
  const [microArea, setMicroArea] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  // Dados brutos da API para os selects
  const [allData, setAllData] = useState<UnidadeData[]>([]);
  const [isLoadingUnidades, setIsLoadingUnidades] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Listas derivadas para os selects (Lógica idêntica ao Login)
  const unidadesDisponiveis = useMemo(() => {
    const unique = new Set(allData.map(d => d.unidade));
    return Array.from(unique).sort();
  }, [allData]);

  const equipesDisponiveis = useMemo(() => {
    if (!unidade) return [];
    const filtered = allData.filter(d => d.unidade === unidade);
    const unique = new Set(filtered.map(d => d.equipe).filter(Boolean));
    return Array.from(unique).sort();
  }, [allData, unidade]);

  const microAreasDisponiveis = useMemo(() => {
    if (!unidade || !equipe) return [];
    const filtered = allData.filter(d => d.unidade === unidade && d.equipe === equipe);
    const unique = new Set(filtered.map(d => d.microArea).filter(Boolean));
    return Array.from(unique).sort();
  }, [allData, unidade, equipe]);

  // Resetar campos dependentes quando o pai mudar
  useEffect(() => {
    setEquipe('');
    setMicroArea('');
  }, [unidade]);

  useEffect(() => {
    setMicroArea('');
  }, [equipe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    try {
      await api.auth.register({
        email,
        password,
        passwordConfirm,
        name,
        unidade,
        equipe,
        micro_area: microArea
      });

      setSuccess(true);
        // Não redireciona imediatamente, deixa o usuário ler sobre o e-mail
        // setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
      console.error(err);
      setError(translateError(err) || 'Falha ao realizar cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadUnidades = async () => {
      setIsLoadingUnidades(true);
      try {
        const data = await api.unidades.list();
        if (data && data.length > 0) {
          setAllData(data);
        }
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
      } finally {
        setIsLoadingUnidades(false);
      }
    };
    
    loadUnidades();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
            <span className="material-symbols-outlined text-white text-4xl">person_add</span>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
            Criar sua Conta
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Acompanhamento da Mulher nas Ações de Rastreio
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-6 rounded-xl border border-green-100 flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-4xl text-green-500">mark_email_read</span>
            <div>
              <h3 className="font-bold text-lg mb-1">Verifique seu e-mail!</h3>
              <p className="text-sm">Um link de confirmação foi enviado. Sua conta só será ativada após a confirmação do e-mail.</p>
            </div>
            <Link to="/login" className="mt-2 text-sm font-bold text-green-800 hover:underline">
              Ir para o Login
            </Link>
          </div>
        )}

        {!success && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400">person</span>
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Endereço de Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400">mail</span>
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400">lock</span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <span className="material-symbols-outlined text-gray-400 hover:text-gray-600 cursor-pointer select-none">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400">lock_reset</span>
                  </div>
                  <input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type={showPasswordConfirm ? "text" : "password"}
                    required
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <span className="material-symbols-outlined text-gray-400 hover:text-gray-600 cursor-pointer select-none">
                      {showPasswordConfirm ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 mt-4">
              <label htmlFor="unidade" className="block text-sm font-medium text-gray-700 mb-1">
                Unidade de Saúde
              </label>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400">local_hospital</span>
                </div>
                <select
                  id="unidade"
                  name="unidade"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  disabled={isLoadingUnidades}
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="" disabled>
                    {isLoadingUnidades ? 'Carregando unidades...' : 'Selecione uma Unidade'}
                  </option>
                  {unidadesDisponiveis.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="equipe" className="block text-sm font-medium text-gray-700 mb-1">
                    Equipe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400">groups</span>
                    </div>
                    <select
                      id="equipe"
                      name="equipe"
                      value={equipe}
                      onChange={(e) => setEquipe(e.target.value)}
                      disabled={!unidade || equipesDisponiveis.length === 0}
                      required
                      className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="" disabled>Selecione</option>
                      {equipesDisponiveis.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="micro-area" className="block text-sm font-medium text-gray-700 mb-1">
                    Microárea
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-gray-400">map</span>
                    </div>
                    <select
                      id="micro-area"
                      name="micro-area"
                      value={microArea}
                      onChange={(e) => setMicroArea(e.target.value)}
                      disabled={!equipe || microAreasDisponiveis.length === 0}
                      required
                      className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="" disabled>Selecione</option>
                      {microAreasDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || success}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Processando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Criar Conta
                </span>
              )}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Faça login aqui
              </Link>
            </p>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default Register;
