// ARQUIVO COMPLETO: src/screens/app/Sessoes.tsx
import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { Sessao } from '../../@types';

export default function Sessoes() {
  const [activeTab, setActiveTab] = useState<'AGENDADA' | 'CONCLUIDA'>('AGENDADA');
  const [sessions, setSessions] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadSessions() {
    setLoading(true);
    try {
      const response = await api.get('/api/sessoes/me');
      setSessions(response.data);
    } catch (error) {
      console.log("Erro ao buscar sessões", error);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => {
    loadSessions();
  }, []));

  // Filtra localmente
  const filteredSessions = sessions.filter(s => {
      if (activeTab === 'AGENDADA') return s.status === 'AGENDADA' || s.status === 'CONFIRMADA';
      return s.status === 'CONCLUIDA' || s.status === 'CANCELADA';
  });

  const renderItem = ({ item }: { item: Sessao }) => {
      const date = new Date(item.scheduledDate);
      return (
        <View style={styles.card}>
           <View style={styles.rowHeader}>
               <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                   <Feather name="calendar" size={16} color="#000080"/>
                   <Text style={styles.dateText}>
                       {date.toLocaleDateString()} às {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </Text>
               </View>
               <View style={[styles.badge, {backgroundColor: item.status === 'AGENDADA' ? '#FFF9C4' : '#E0E0E0'}]}>
                   <Text style={{fontSize:10, fontWeight:'bold'}}>{item.status}</Text>
               </View>
           </View>
           
           <Text style={styles.skillTitle}>{item.skillName || item.habilidade?.name}</Text>
           <Text style={styles.people}>
               Mentor: {item.mentor?.fullName} | Aprendiz: {item.mentorado?.fullName}
           </Text>
           
           {item.meetingLink && (
               <TouchableOpacity style={styles.linkBtn}>
                   <Text style={{color:'#FFF', fontSize:12}}>Acessar Link da Reunião</Text>
               </TouchableOpacity>
           )}
        </View>
      );
  };

  return (
    <View style={styles.container}>
       <View style={styles.header}>
          <Text style={styles.title}>Minhas Sessões</Text>
       </View>

       <View style={styles.tabs}>
          <TouchableOpacity 
              style={[styles.tab, activeTab === 'AGENDADA' && styles.activeTab]}
              onPress={() => setActiveTab('AGENDADA')}
          >
              <Text style={[styles.tabText, activeTab === 'AGENDADA' && styles.activeTabText]}>Agendadas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={[styles.tab, activeTab === 'CONCLUIDA' && styles.activeTab]}
              onPress={() => setActiveTab('CONCLUIDA')}
          >
              <Text style={[styles.tabText, activeTab === 'CONCLUIDA' && styles.activeTabText]}>Histórico</Text>
          </TouchableOpacity>
       </View>

       <FlatList
          data={filteredSessions}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{padding: 20}}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSessions}/>}
          ListEmptyComponent={
              <View style={{alignItems:'center', marginTop:50}}>
                  <Feather name="inbox" size={40} color="#CCC"/>
                  <Text style={{color:'#999', marginTop:10}}>Nenhuma sessão encontrada.</Text>
              </View>
          }
       />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6EFFF' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#FFF' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000080' },
  tabs: { flexDirection: 'row', padding: 15, gap: 10 },
  tab: { flex: 1, padding: 10, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center' },
  activeTab: { backgroundColor: '#000080' },
  tabText: { color: '#555', fontWeight: 'bold' },
  activeTabText: { color: '#FFF' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dateText: { color: '#555', fontWeight: 'bold' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  skillTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  people: { color: '#666', fontSize: 12, marginTop: 2 },
  linkBtn: { backgroundColor: '#4CAF50', marginTop: 10, padding: 8, borderRadius: 5, alignItems: 'center' }
});