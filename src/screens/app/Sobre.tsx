import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function Sobre() {
  const commitHash = Constants.expoConfig?.extra?.commitHash || 'N/A';

  const handleOpenLinkUser1 = () => {
    Linking.openURL('https://github.com/GuiFelSS');
  };

  const handleOpenLinkUser2 = () => {
    Linking.openURL('https://github.com/Pablo0703');
  };

  const handleOpenLinkUser3 = () => {
    Linking.openURL('https://github.com/ViniciusLeopoldino');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Image
              source={require('../../../assets/logo.png')}
              style={{ width: 150, height: 150 }}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="info" size={24} color="#000080" />
            <Text style={styles.cardTitle}>Sobre o Projeto</Text>
          </View>
          <Text style={styles.text}>
            O Troca-Comigo é uma plataforma inovadora colaborativa onde o tempo é a moeda. Conectamos mentores e
            aprendizes para democratizar o conhecimento através da troca de habilidades.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="users" size={24} color="#000000ff" />
            <Text style={styles.cardTitle}>Desenvolvedores</Text>
          </View>

          <View style={styles.member}>
            <Text style={styles.memberName}>Guilherme Felipe da Silva Souza</Text>
            <Text style={styles.memberRm}>RM: 558282</Text>
            <TouchableOpacity
              onPress={handleOpenLinkUser1}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
            >
              <Feather name="github" size={20} color="#000000ff" />
              <Text style={{ color: '#000000ff', marginLeft: 8, fontWeight: 'bold' }}>GitHub</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          <View style={styles.member}>
            <Text style={styles.memberName}>Pablo Lopes Doria de Andrade</Text>
            <Text style={styles.memberRm}>RM: 556834</Text>
            <TouchableOpacity
              onPress={handleOpenLinkUser2}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
            >
              <Feather name="github" size={20} color="#000000ff" />
              <Text style={{ color: '#000000ff', marginLeft: 8, fontWeight: 'bold' }}>GitHub</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          <View style={styles.member}>
            <Text style={styles.memberName}>Vinicius Leopoldino de Oliveira</Text>
            <Text style={styles.memberRm}>RM: 557047</Text>
            <TouchableOpacity
              onPress={handleOpenLinkUser3}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
            >
              <Feather name="github" size={20} color="#000000ff" />
              <Text style={{ color: '#000000ff', marginLeft: 8, fontWeight: 'bold' }}>GitHub</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Versão 1.0.0</Text>
          <Text style={styles.hashText}>Build: {commitHash}</Text>
          <Text style={styles.copyright}>© 2025 FIAPEIROS. Todos os direitos reservados.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6EFFF' },
  scrollContent: { padding: 20, paddingBottom: 30 },
  header: { alignItems: 'center', marginTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000080' },
  subtitle: { fontSize: 16, color: '#666' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  text: { fontSize: 15, color: '#555', lineHeight: 22, textAlign: 'justify' },
  member: { paddingVertical: 5 },
  memberName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  memberRm: { fontSize: 14, color: '#777' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  footer: { alignItems: 'center' },
  footerText: { fontSize: 16, color: '#555', fontWeight: 'bold' },
  hashText: { fontSize: 15, color: '#888', fontFamily: 'monospace', marginTop: 2, fontWeight: 'bold' },
  copyright: { fontSize: 15, color: '#AAA', marginTop: 10 },
});
