import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function Login({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
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
      
      const response = await api.post('/auth/login', { email, password: senha });
      const token = response.data.token || response.data.accessToken;

      if (token) {
        await signIn(token);
      } else {
        Alert.alert("Erro", "Token inválido recebido do servidor.");
      }
      
    } catch (error: any) {
      console.error("[LOGIN] Erro:", error.response?.data || error.message);
      Alert.alert("Erro no Login", "Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require('../../../assets/logo.png')}
            style={{ width: 250, height: 250 }}
            resizeMode="contain"
          />
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#D6EFFF' 
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  header: { 
    alignItems: 'center',
    marginBottom: 20 
  },
  form: { 
    width: '85%', 
    alignItems: 'center' 
  },
  input: { 
    width: '100%', 
    backgroundColor: '#F5F5F5', 
    borderRadius: 25, 
    padding: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#CCC', 
    textAlign: 'center',
    fontSize: 16 
  },
  button: { 
    width: '100%', 
    backgroundColor: '#66BB6A', 
    borderRadius: 25, 
    padding: 15, 
    alignItems: 'center', 
    marginBottom: 20,
    elevation: 2 
  },
  buttonText: { 
    color: '#FFF', 
    fontWeight: 'bold',
    fontSize: 16 
  },
  linkText: { 
    color: '#000080', 
    textDecorationLine: 'underline',
    fontSize: 16 
  },
});