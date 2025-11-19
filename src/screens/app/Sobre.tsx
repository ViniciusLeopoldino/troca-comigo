import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function Sobre() {
  // Função para abrir o GitHub (opcional, mas agrega valor)
  const handleOpenLink = () => {
    Linking.openURL('https://github.com/seu-usuario/troca-comigo');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Logo e Título */}
        <View style={styles.header}>
        <View>
                            <Image
                              source={require('../../../assets/logo.png')}
                              style={{ width: 200, height: 200 }}
                              resizeMode="contain"
                            />  
        </View>
          {/* <Text style={styles.title}>Troca <Text style={{color: '#4CAF50'}}>Comigo</Text></Text> */}
          
        </View>

        {/* Card: O Projeto */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="info" size={24} color="#000080" />
            <Text style={styles.cardTitle}>Sobre o Projeto</Text>
          </View>
          <Text style={styles.text}>
            O Troca-Comigo é uma plataforma inovadora de economia colaborativa onde o tempo é a moeda. 
            Conectamos mentores e aprendizes para democratizar o conhecimento através da troca de habilidades.
          </Text>
        </View>

        {/* Card: Integrantes (Requisito Obrigatório) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="users" size={24} color="#000080" />
            <Text style={styles.cardTitle}>Desenvolvedores</Text>
          </View>
          
          <View style={styles.member}>
            <Text style={styles.memberName}>Guilherme</Text>
            <Text style={styles.memberRm}>RM: 12345</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.member}>
            <Text style={styles.memberName}>Pablo</Text>
            <Text style={styles.memberRm}>RM: 67890</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.member}>
            <Text style={styles.memberName}>Vinicius</Text>
            <Text style={styles.memberRm}>RM: 11223</Text>
          </View>
        </View>

        {/* Versão e Hash (Requisito Obrigatório) */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Versão 1.0.0</Text>
          <Text style={styles.hashText}>Commit Hash: 8f2a1b (Main)</Text>
          <Text style={styles.copyright}>© 2025 FIAP Global Solution</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6EFFF' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  // logoContainer: { 
  //   width: 100, height: 100, backgroundColor: '#FFF', borderRadius: 50, 
  //   justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  //   elevation: 5
  // },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000080' },
  subtitle: { fontSize: 16, color: '#666' },
  
  card: {
    backgroundColor: '#FFF', borderRadius: 15, padding: 20, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  text: { fontSize: 15, color: '#555', lineHeight: 22, textAlign: 'justify' },
  
  member: { paddingVertical: 5 },
  memberName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  memberRm: { fontSize: 14, color: '#777' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  
  footer: { alignItems: 'center', marginTop: 20 },
  footerText: { fontSize: 14, color: '#555', fontWeight: 'bold' },
  hashText: { fontSize: 12, color: '#888', fontFamily: 'monospace', marginTop: 2 },
  copyright: { fontSize: 12, color: '#AAA', marginTop: 10 }
});