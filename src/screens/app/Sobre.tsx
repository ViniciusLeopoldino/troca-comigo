import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../../contexts/ThemeContext';

export default function Sobre() {
  const commitHash = Constants.expoConfig?.extra?.commitHash || 'N/A';
  const { theme } = useTheme(); 
  const colors = theme.colors; // Usando as cores do contexto

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <View style={{ alignItems: 'center' }}>
            <Image
              source={require('../../../assets/logo.png')}
              style={{ width: 150, height: 150 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* CARD SOBRE O PROJETO */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Feather name="info" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Sobre o Projeto</Text>
          </View>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            O Troca-Comigo é uma plataforma inovadora colaborativa onde o tempo é a moeda. Conectamos mentores e
            aprendizes para democratizar o conhecimento através da troca de habilidades.
          </Text>
        </View>

        {/* CARD DESENVOLVEDORES */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Feather name="users" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Desenvolvedores</Text>
          </View>

          {/* MEMBRO 1 */}
          <View style={styles.member}>
            <Text style={[styles.memberName, { color: colors.text }]}>Guilherme Felipe da Silva Souza</Text>
            <Text style={[styles.memberRm, { color: colors.textSecondary }]}>RM: 558282</Text>
            <TouchableOpacity
              onPress={handleOpenLinkUser1}
              style={styles.githubLink}
            >
              <Feather name="github" size={20} color={colors.text} />
              <Text style={[styles.githubText, { color: colors.text }]}>GitHub</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* MEMBRO 2 */}
          <View style={styles.member}>
            <Text style={[styles.memberName, { color: colors.text }]}>Pablo Lopes Doria de Andrade</Text>
            <Text style={[styles.memberRm, { color: colors.textSecondary }]}>RM: 556834</Text>
            <TouchableOpacity
              onPress={handleOpenLinkUser2}
              style={styles.githubLink}
            >
              <Feather name="github" size={20} color={colors.text} />
              <Text style={[styles.githubText, { color: colors.text }]}>GitHub</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* MEMBRO 3 */}
          <View style={styles.member}>
            <Text style={[styles.memberName, { color: colors.text }]}>Vinicius Leopoldino de Oliveira</Text>
            <Text style={[styles.memberRm, { color: colors.textSecondary }]}>RM: 557047</Text>
            <TouchableOpacity
              onPress={handleOpenLinkUser3}
              style={styles.githubLink}
            >
              <Feather name="github" size={20} color={colors.text} />
              <Text style={[styles.githubText, { color: colors.text }]}>GitHub</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Versão 1.0.0</Text>
          <Text style={[styles.hashText, { color: colors.textSecondary, backgroundColor: colors.inputBg }]}>
            Build: {commitHash}
          </Text>
          <Text style={[styles.copyright, { color: colors.textSecondary }]}>
            © 2025 FIAPEIROS. Todos os direitos reservados.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 20 },
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  text: { fontSize: 15, lineHeight: 22, textAlign: 'justify' },
  member: { paddingVertical: 1 },
  memberName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  memberRm: { fontSize: 14 },
  githubLink: { flexDirection: 'row', alignItems: 'center', marginTop: 5, padding: 5 },
  githubText: { marginLeft: 8, fontWeight: 'bold' },
  divider: { height: 1, marginVertical: 5 },
  footer: { alignItems: 'center', marginTop: 5 },
  footerText: { fontSize: 16, fontWeight: 'bold' },
  hashText: { fontSize: 14, fontFamily: 'monospace', marginTop: 5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  copyright: { fontSize: 12, marginTop: 5 },
});