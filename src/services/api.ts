import axios from 'axios';

const api = axios.create({
  baseURL: 'https://troca-comigo-global-2-2025-n89g.onrender.com',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Variável local para o Token
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token ? token.trim() : null;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    // @ts-ignore
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  // console.log(`[API] 🚀 ${config.method?.toUpperCase()} ${config.url}`); // Descomente se quiser ver logs no terminal
  return config;
}, (error) => {
  return Promise.reject(error);
});

// INTERCEPTADOR SILENCIOSO
// Removemos os console.error que faziam o erro pular na tela
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Apenas loga no terminal (invisível para o usuário), não usa console.error
      console.log(`[API] Status ${error.response.status} (Tratado internamente)`);
    } 
    // Retorna o erro para que o Marketplace.tsx possa ativar o Fallback
    return Promise.reject(error);
  }
);

export default api;