import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const VerificationGateway = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Configuração dos Apps e suas Coleções
  const APPS = {
    // ID da coleção de usuários do AMAR (extraído do token anterior)
    'ho05j8lytez7c8q': {
      name: 'AMAR - Acompanhamento da Mulher',
      // Em dev: localhost, em prod: a URL do seu site
      // Usa Query Param: /confirm-verification?token=XYZ
      urlBuilder: (token: string) => {
        // Usa a URL atual como base se estivermos no mesmo domínio, ou força a URL de produção se for redirecionamento cruzado
        // Como o Gateway roda no próprio AMAR, window.location.origin é seguro para manter o contexto (dev/prod)
        return `${window.location.origin}/confirm-verification?token=${token}`;
      }
    },
    // Adicione aqui o ID da coleção da Agenda Cap 5.3 se for diferente
    'j3sajam11bwd8ow': {
      name: 'Agenda Cap 5.3',
      // Agenda usa Path Param: /#/verify-email/XYZ
      urlBuilder: (token: string) => `https://agenda-cap53.pages.dev/#/verify-email/${token}`
    }
  };

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Token não fornecido.');
      return;
    }

    try {
      console.log('Token recebido:', token);
      
      let payload: any = {};
      let collectionId = '';

      // Tentar decodificar como JWT
      try {
          payload = jwtDecode(token);
          collectionId = payload.collectionId || payload.collection_id;
          console.log('Token JWT Decodificado:', payload);
      } catch (jwtError) {
          console.warn('O token não é um JWT válido:', jwtError);
          // Se falhar, pode ser um token opaco (não JWT). 
          // Nesse caso, não temos como saber a collectionId pelo token.
          // Vamos assumir que é para o App atual (AMAR) como fallback seguro
          collectionId = 'ho05j8lytez7c8q'; 
      }

      console.log('Collection ID identificado:', collectionId);

      // Identificar o App
      const app = APPS[collectionId as keyof typeof APPS];

      if (app) {
        // Redirecionar para a URL correta do App
        const redirectUrl = app.urlBuilder(token);
        console.log(`Redirecionando para ${app.name}: ${redirectUrl}`);
        window.location.href = redirectUrl;
      } else {
        // Se não encontrar, tenta adivinhar ou mostra erro
        // Como fallback, se o ID não estiver mapeado, assume que é para o App atual se o token for válido
        // Mas se for Agenda Cap 5.3 e o ID for desconhecido, precisamos saber o ID.
        
        console.warn(`Coleção desconhecida: ${collectionId}`);
        setStatus('error');
        setErrorMsg(`Aplicativo desconhecido para a coleção: ${collectionId}. Contate o suporte.`);
      }

    } catch (e) {
      console.error('Erro ao decodificar token:', e);
      setStatus('error');
      setErrorMsg('Token inválido ou corrompido.');
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Verificando...</h2>
            <p className="text-gray-500 mt-2">Redirecionando para o aplicativo correto.</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800">Erro de Redirecionamento</h2>
            <p className="text-gray-600 mt-2">{errorMsg}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationGateway;
