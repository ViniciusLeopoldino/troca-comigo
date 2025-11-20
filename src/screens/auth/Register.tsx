import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';

export default function Register({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    // 1. Validação Básica
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Senha Fraca", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    
    try {
      // 2. Payload para o Backend Java (/auth/register)
      const payload = {
        fullName: fullName,
        email: email,
        password: password
        // O backend cria com role USER e créditos iniciais automaticamente
      };

      console.log("Enviando registro:", payload);
      
      await api.post('/auth/register', payload);

      // 3. Sucesso
      Alert.alert(
        "Conta Criada! 🎉", 
        "Seu cadastro foi realizado com sucesso. Faça login para começar.",
        [
          { text: "Ir para Login", onPress: () => navigation.goBack() }
        ]
      );

    } catch (error: any) {
      console.error("Erro no registro:", error.response?.data || error.message);
      
      // Tratamento de erro específico (ex: Email duplicado)
      const message = error.response?.data?.message || "Não foi possível criar a conta. Verifique se o email já existe.";
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER / LOGO */}
        <View style={styles.header}>
          <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
          />
          <Text style={styles.title}>Crie sua conta</Text>
          <Text style={styles.subtitle}>Comece a trocar conhecimentos hoje!</Text>
        </View>

        {/* FORMULÁRIO */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Feather name="user" size={20} color="#666" style={styles.icon} />
            <TextInput 
              style={styles.input}
              placeholder="Nome Completo"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color="#666" style={styles.icon} />
            <TextInput 
              style={styles.input}
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color="#666" style={styles.icon} />
            <TextInput 
              style={styles.input}
              placeholder="Senha"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#777"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="check-circle" size={20} color="#666" style={styles.icon} />
            <TextInput 
              style={styles.input}
              placeholder="Confirmar Senha"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#777"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>CADASTRAR</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.linkText}>Fazer Login</Text>
            </TouchableOpacity>
          </View>
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
    paddingVertical: 40,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 10 
  },
  logoImage: { 
    width: 250, 
    height: 250
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#000080' 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    marginTop: 5 
  },
  form: { 
    width: '85%', 
    alignItems: 'center' 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#CCC',
    marginBottom: 15,
    paddingHorizontal: 15,
    width: '100%',
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  button: { 
    width: '100%', 
    backgroundColor: '#66BB6A', 
    borderRadius: 25, 
    padding: 12, 
    alignItems: 'center', 
    marginBottom: 15 
  },
  buttonText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 16,
  },
  linkText: { 
    color: '#000080', 
    fontWeight: 'bold', 
    fontSize: 16,
    textDecorationLine: 'underline', 
  }
});