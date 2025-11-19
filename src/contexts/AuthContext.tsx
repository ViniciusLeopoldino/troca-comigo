import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken } from '../services/api'; // <--- Importe o setAuthToken
import { User } from '../@types';

interface AuthContextData {
  signed: boolean;
  user: User | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
  updateUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storageToken = await AsyncStorage.getItem('@troca_token');
      
      if (storageToken) {
        // 1. Injeta na memória IMEDIATAMENTE
        setAuthToken(storageToken);
        
        try {
          // 2. Valida o token buscando o user
          const response = await api.get('/api/users/me');
          setUser(response.data);
        } catch (error) {
          console.log("Sessão expirada");
          setAuthToken(null);
          await AsyncStorage.removeItem('@troca_token');
        }
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  async function signIn(token: string) {
    // 1. Injeta na memória (Isso resolve o 403 instantaneamente)
    setAuthToken(token);
    
    // 2. Salva no disco (Para quando fechar e abrir o app)
    await AsyncStorage.setItem('@troca_token', token);
    
    // 3. Busca dados do usuário
    try {
      const response = await api.get('/api/users/me');
      setUser(response.data);
    } catch (error) {
      console.log("Erro ao buscar usuário no login", error);
    }
  }

  async function signOut() {
    setAuthToken(null); // Limpa memória
    await AsyncStorage.removeItem('@troca_token'); // Limpa disco
    setUser(null);
  }
  
  async function updateUser() {
      try {
          const response = await api.get('/api/users/me');
          setUser(response.data);
      } catch (error) { console.log(error); }
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}