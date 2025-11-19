// ARQUIVO COMPLETO: src/screens/app/IAMatchmaking.tsx
import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { Habilidade } from '../../@types';

export default function IAMatchmaking() {
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0=Intro, 1=Loading, 2=Result
  const [matches, setMatches] = useState<Habilidade[]>([]);

  async function runMatchmaking() {
    setStep(1);
    try {
      // 1. Busca MEUS interesses (isSeeking = true)
      const mySkillsRes = await api.get('/api/habilidades/me');
      const myInterests = mySkillsRes.data
          .filter((s: Habilidade) => !!s.isSeeking)
          .map((s: Habilidade) => s.name.toLowerCase());

      if (myInterests.length === 0) {
          Alert.alert("Sem dados", "Adicione habilidades que você quer APRENDER no seu perfil para a IA encontrar mentores.");
          setStep(0);
          return;
      }

      // 2. Busca TODO o mercado
      const allSkillsRes = await api.get('/api/habilidades');
      const market = allSkillsRes.data;

      // 3. Lógica de Match (Fake IA)
      // Procura habilidades onde (isOffering = true) E (nome contem meu interesse)
      const foundMatches = market.filter((h: Habilidade) => {
          if (!h.isOffering) return false;
          // Verifica se o nome da habilidade do mercado bate com algum interesse meu
          return myInterests.some((interest: string) => h.name.toLowerCase().includes(interest));
      });

      setMatches(foundMatches);
      setStep(2);

    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha ao conectar com o servidor.");
      setStep(0);
    }
  }

  // TELA DE RESULTADOS
  if (step === 2) {
      return (
          <View style={styles.container}>
              <View style={styles.header}>
                  <Text style={styles.title}>Matches Encontrados</Text>
                  <Text style={styles.subtitle}>Mentores compatíveis com seu perfil</Text>
              </View>
              
              <FlatList 
                  data={matches}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{padding: 20}}
                  ListEmptyComponent={
                      <View style={{alignItems: 'center', marginTop: 50}}>
                          <Feather name="frown" size={40} color="#AAA"/>
                          <Text style={{marginTop: 10, color: '#666', textAlign:'center'}}>
                              Nenhum mentor encontrado para suas buscas no momento. Tente adicionar termos mais genéricos no seu perfil.
                          </Text>
                      </View>
                  }
                  renderItem={({item}) => (
                      <View style={styles.card}>
                          <View style={styles.cardHeader}>
                              <Text style={styles.cardTitle}>{item.name}</Text>
                              <View style={styles.matchBadge}>
                                  <Text style={styles.matchText}>98% Match</Text>
                              </View>
                          </View>
                          <Text style={{color: '#555'}}>Mentor: {item.usuario?.fullName}</Text>
                          <Text style={{color: '#777', fontSize: 12}}>{item.level}</Text>
                          
                          <TouchableOpacity style={styles.btnConnect}>
                              <Text style={{color: '#FFF', fontWeight: 'bold'}}>Conectar</Text>
                          </TouchableOpacity>
                      </View>
                  )}
              />
              
              <TouchableOpacity onPress={() => setStep(0)} style={styles.btnBack}>
                  <Text style={{color: '#000080', fontWeight: 'bold'}}>Nova Análise</Text>
              </TouchableOpacity>
          </View>
      );
  }

  // TELA DE INTRODUÇÃO
  return (
    <View style={styles.containerCenter}>
       <View style={styles.iconContainer}>
          <Feather name="cpu" size={50} color="#FFF" />
       </View>
       
       <Text style={styles.titleBig}>IA Matchmaking</Text>
       <Text style={styles.desc}>
           Nossa Inteligência Artificial analisa suas necessidades de aprendizado e cruza com os melhores mentores disponíveis na base de dados.
       </Text>

       <TouchableOpacity 
           style={styles.btnStart} 
           onPress={runMatchmaking}
           disabled={step === 1}
       >
           {step === 1 ? <ActivityIndicator color="#FFF"/> : (
               <>
                   <Feather name="cpu" size={20} color="#FFF" style={{marginRight: 10}}/>
                   <Text style={styles.btnStartText}>Iniciar Análise</Text>
               </>
           )}
       </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6EFFF' },
  containerCenter: { flex: 1, backgroundColor: '#D6EFFF', justifyContent: 'center', alignItems: 'center', padding: 30 },
  header: { backgroundColor: '#FFF', padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000080' },
  subtitle: { color: '#666' },
  titleBig: { fontSize: 28, fontWeight: 'bold', color: '#000080', marginTop: 20 },
  desc: { textAlign: 'center', color: '#555', marginTop: 10, marginBottom: 40, lineHeight: 22 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#000080', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  
  btnStart: { flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, elevation: 3 },
  btnStartText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  matchBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  matchText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
  btnConnect: { marginTop: 10, backgroundColor: '#000080', padding: 10, borderRadius: 5, alignItems: 'center' },
  btnBack: { padding: 20, alignItems: 'center', marginBottom: 20 }
});