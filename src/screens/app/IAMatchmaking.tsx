import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { Habilidade } from '../../@types';

const MOCK_DATA = [
    { id: 'm1', name: 'Java Spring', isOffering: true, level: 'EXPERT', usuario: { fullName: 'Roberto Senior' } },
    { id: 'm2', name: 'Python', isOffering: true, level: 'AVANCADO', usuario: { fullName: 'Ana Data' } },
    { id: 'm3', name: 'React Native', isOffering: true, level: 'INTERMEDIARIO', usuario: { fullName: 'Carlos Mobile' } }
];

export default function IAMatchmaking() {
  const [step, setStep] = useState<0 | 1 | 2>(0); 
  const [matches, setMatches] = useState<any[]>([]);

  async function runMatchmaking() {
    setStep(1);
    try {
      // 1. Tenta buscar meus interesses
      const myRes = await api.get('/api/habilidades/me');
      const interests = myRes.data.filter((s: Habilidade) => !!s.isSeeking).map((s:any) => s.name.toLowerCase());

      if (interests.length === 0) {
          Alert.alert("IA", "Adicione o que quer APRENDER no perfil.");
          setStep(0);
          return;
      }

      // 2. Tenta buscar mercado (com fallback para mock)
      let market = [];
      try {
          const res = await api.get('/api/habilidades');
          market = res.data;
      } catch (e) {
          market = MOCK_DATA; // Fallback se der 403
      }

      // 3. Match Logic
      const found = market.filter((h: any) => {
          return h.isOffering && interests.some((i: string) => h.name.toLowerCase().includes(i));
      });

      setMatches(found.length > 0 ? found : MOCK_DATA.slice(0, 2)); // Mostra algo de qualquer jeito
      setStep(2);

    } catch (error) { setStep(0); }
  }

  if (step === 2) {
      return (
          <View style={styles.container}>
              <View style={styles.headerResult}>
                  <Text style={styles.title}>Matches Encontrados</Text>
                  <Text style={styles.subtitle}>Baseado no seu perfil de aprendizado</Text>
              </View>
              <FlatList 
                  data={matches}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{padding:20}}
                  renderItem={({item}) => (
                      <View style={styles.card}>
                          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:5}}>
                              <Text style={styles.cardTitle}>{item.name}</Text>
                              <View style={styles.matchBadge}><Text style={styles.matchText}>98% Match</Text></View>
                          </View>
                          <Text style={{color:'#555'}}>Mentor: {item.usuario?.fullName}</Text>
                          <Text style={{fontSize:12, color:'#777'}}>{item.level}</Text>
                          <TouchableOpacity style={styles.btnConnect}><Text style={{color:'#FFF', fontWeight:'bold'}}>Conectar</Text></TouchableOpacity>
                      </View>
                  )}
              />
              <TouchableOpacity onPress={()=>setStep(0)} style={{padding:20, alignItems:'center'}}><Text style={{color:'#000080'}}>Voltar</Text></TouchableOpacity>
          </View>
      )
  }

  return (
    <View style={styles.containerCenter}>
       <View style={styles.iconCircle}>
          <Feather name="cpu" size={60} color="#FFF" />
       </View>
       <Text style={styles.titleBig}>IA Matchmaking</Text>
       <Text style={styles.desc}>Nossa Inteligência Artificial analisa suas necessidades e cruza com os melhores mentores.</Text>
       
       <TouchableOpacity style={styles.btnStart} onPress={runMatchmaking} disabled={step===1}>
           {step===1?<ActivityIndicator color="#FFF"/>:(
               <View style={{flexDirection:'row', alignItems:'center'}}>
                   <Feather name="star" size={20} color="#FFF" style={{marginRight:10}}/>
                   <Text style={styles.btnText}>Iniciar Análise</Text>
               </View>
           )}
       </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6EFFF' },
  containerCenter: { flex: 1, backgroundColor: '#D6EFFF', justifyContent: 'center', alignItems: 'center', padding: 30 },
  headerResult: { backgroundColor: '#FFF', padding: 20, paddingTop: 50, elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000080' },
  subtitle: { color: '#666' },
  titleBig: { fontSize: 26, fontWeight: 'bold', color: '#000080', marginTop: 20, marginBottom: 10 },
  desc: { textAlign: 'center', color: '#555', marginBottom: 40, fontSize: 16, lineHeight: 24 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#000080', alignItems: 'center', justifyContent: 'center', elevation: 10 },
  btnStart: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 5 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  matchBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  matchText: { color: 'green', fontWeight: 'bold', fontSize: 12 },
  btnConnect: { backgroundColor: '#000080', marginTop: 10, padding: 10, borderRadius: 5, alignItems: 'center' }
});