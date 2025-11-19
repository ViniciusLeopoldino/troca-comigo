import axios from 'axios';

const api = axios.create({
  baseURL: 'https://troca-comigo-global-2-2025-n89g.onrender.com',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Variável local
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  // Remove espaços em branco que podem vir do copy/paste ou do backend
  authToken = token ? token.trim() : null;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    // FORMA MAIS SEGURA DE INJETAR O HEADER NO AXIOS
    // @ts-ignore
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  console.log(`[API] 🚀 Enviando ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, (error) => {
  return Promise.reject(error);
});

// INTERCEPTADOR DE RESPOSTA (PARA VER O ERRO REAL DO BACKEND)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // O servidor respondeu, mas com erro (403, 401, 500)
      console.error(`[API] ❌ Erro ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('[API] ❌ Sem resposta do servidor. Verifique a internet.');
    } else {
      console.error('[API] ❌ Erro na configuração:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;