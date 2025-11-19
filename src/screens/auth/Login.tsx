import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function Login({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(''); // Dica: Preencha com um email válido do seu banco para testar rápido
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !senha) {
      Alert.alert("Atenção", "Preencha email e senha.");
      return;
    }

    setLoading(true);
    try {
      console.log(`[LOGIN] Tentando logar com: ${email}`);
      
      // 1. Faz o POST
      const response = await api.post('/auth/login', { email, password: senha });
      
      console.log("[LOGIN] Resposta do Backend:", response.data); // VAMOS VER O QUE O BACKEND DEVOLVE

      // 2. Identifica o token (Seu backend pode retornar 'token' ou 'accessToken')
      const token = response.data.token || response.data.accessToken;

      if (token) {
        console.log("[LOGIN] Token encontrado, salvando...");
        await signIn(token); // Chama o contexto para salvar
      } else {
        Alert.alert("Erro", "O Backend não retornou um token válido.");
        console.error("Resposta sem token:", response.data);
      }
      
    } catch (error: any) {
      console.error("[LOGIN] Erro:", error.response?.data || error.message);
      Alert.alert("Erro no Login", "Verifique email/senha ou se o backend está rodando.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.logoText}>Troca <Text style={{color: '#4CAF50'}}>Comigo</Text></Text>
        <Text style={{fontSize: 40}}> */}
                    <Image
                      source={require('../../../assets/logo.png')}
                      style={{ width: 250, height: 250 }}
                      resizeMode="contain"
                    />
        {/* </Text> */}
      </View>

      <View style={styles.form}>
        <TextInput 
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        
        <TextInput 
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>ENTRAR</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6EFFF', alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  // logoText: { fontSize: 32, fontWeight: 'bold', color: '#000080' },
  form: { width: '80%', alignItems: 'center' },
  input: { width: '100%', backgroundColor: '#F5F5F5', borderRadius: 25, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#CCC', textAlign: 'center' },
  button: { width: '100%', backgroundColor: '#66BB6A', borderRadius: 25, padding: 12, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  linkText: { color: '#333', textDecorationLine: 'underline' }
});