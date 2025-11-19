import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { generateUUID } from '../../utils/uuid'; 
import { Sessao } from '../../@types';
import { useAuth } from '../../contexts/AuthContext';

export default function Sessoes() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'AGENDADA' | 'CONCLUIDA'>('AGENDADA');
  const [sessions, setSessions] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(false);

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Sessao | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sendingReview, setSendingReview] = useState(false);

  useFocusEffect(useCallback(() => { loadSessions(); }, []));

  async function loadSessions() {
    setLoading(true);
    try {
      const response = await api.get('/api/sessoes/me');
      setSessions(response.data);
    } catch (error) { console.log("Erro sessões", error); } finally { setLoading(false); }
  }

  async function completeSession(sessao: Sessao) {
      try {
          await api.patch(`/api/sessoes/${sessao.id}/completar`);
          Alert.alert("Sucesso", "Sessão concluída!");
          loadSessions();
      } catch (error) { Alert.alert("Erro", "Falha ao concluir."); }
  }

  async function sendReview() {
      if(!selectedSession || !user) return;
      setSendingReview(true);
      try {
          const avaliadoId = user.id === selectedSession.mentor.id ? selectedSession.mentorado.id : selectedSession.mentor.id;
          const payload = {
              id: generateUUID(),
              sessaoId: selectedSession.id,
              sessao: { id: selectedSession.id },
              avaliadorId: user.id,
              avaliador: { id: user.id },
              avaliadoId: avaliadoId,
              avaliado: { id: avaliadoId },
              rating: rating,
              comment: comment || "Sem comentários",
              createdDate: new Date().toISOString()
          };
          await api.post('/api/avaliacoes', payload);
          Alert.alert("Sucesso", "Avaliação enviada!");
          setReviewModalVisible(false);
          setComment('');
      } catch (error) { Alert.alert("Erro", "Falha ao enviar avaliação."); } finally { setSendingReview(false); }
  }

  const filteredSessions = sessions.filter(s => {
      if (activeTab === 'AGENDADA') return s.status === 'AGENDADA' || s.status === 'CONFIRMADA' || s.status === 'EM_ANDAMENTO';
      return s.status === 'CONCLUIDA' || s.status === 'CANCELADA';
  });

  // Estatísticas (Mockadas ou calculadas)
  const totalAgendadas = sessions.filter(s => s.status === 'AGENDADA').length;
  const totalConcluidas = sessions.filter(s => s.status === 'CONCLUIDA').length;

  const renderItem = ({ item }: { item: Sessao }) => {
      const date = new Date(item.scheduledDate);
      return (
        <View style={styles.card}>
           <View style={styles.rowHeader}>
               <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                   <Feather name="calendar" size={14} color="#000080"/>
                   <Text style={styles.dateText}>{date.toLocaleDateString()} - {date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Text>
               </View>
               <View style={[styles.badge, {backgroundColor: item.status === 'AGENDADA' ? '#FFF9C4' : '#C8E6C9'}]}>
                   <Text style={{fontSize:10, fontWeight:'bold', color:'#333'}}>{item.status}</Text>
               </View>
           </View>
           
           <Text style={styles.skillTitle}>{item.skillName}</Text>
           <View style={styles.peopleRow}>
               <Feather name="user" size={14} color="#666"/>
               <Text style={styles.people}>Mentor: {item.mentor?.fullName}</Text>
           </View>
           <View style={styles.peopleRow}>
               <Feather name="user" size={14} color="#666"/>
               <Text style={styles.people}>Aluno: {item.mentorado?.fullName}</Text>
           </View>
           
           <View style={styles.actions}>
               {activeTab === 'AGENDADA' && (
                   <TouchableOpacity style={styles.btnAction} onPress={() => completeSession(item)}>
                       <Text style={{color:'#FFF', fontWeight:'bold'}}>✅ Concluir</Text>
                   </TouchableOpacity>
               )}
               {activeTab === 'CONCLUIDA' && item.status === 'CONCLUIDA' && (
                   <TouchableOpacity style={[styles.btnAction, {backgroundColor:'#7B1FA2'}]} onPress={() => { setSelectedSession(item); setReviewModalVisible(true); }}>
                       <Text style={{color:'#FFF', fontWeight:'bold'}}>⭐ Avaliar</Text>
                   </TouchableOpacity>
               )}
           </View>
        </View>
      );
  };

  return (
    <View style={styles.container}>
       <View style={styles.header}>
           <Text style={styles.title}>Minhas Sessões</Text>
           {/* Cards de Estatística no Topo */}
           <View style={styles.statsRow}>
               <View style={styles.statCard}>
                   <Text style={styles.statNumber}>{totalAgendadas}</Text>
                   <Text style={styles.statLabel}>Agendadas</Text>
                   <Feather name="clock" size={20} color="#000080" style={styles.statIcon}/>
               </View>
               <View style={styles.statCard}>
                   <Text style={[styles.statNumber, {color:'#4CAF50'}]}>{totalConcluidas}</Text>
                   <Text style={styles.statLabel}>Concluídas</Text>
                   <Feather name="check-circle" size={20} color="#4CAF50" style={styles.statIcon}/>
               </View>
           </View>
       </View>

       <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab==='AGENDADA'&&styles.activeTab]} onPress={()=>setActiveTab('AGENDADA')}><Text style={[styles.tabText, activeTab==='AGENDADA'&&styles.activeTabText]}>Próximas</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab==='CONCLUIDA'&&styles.activeTab]} onPress={()=>setActiveTab('CONCLUIDA')}><Text style={[styles.tabText, activeTab==='CONCLUIDA'&&styles.activeTabText]}>Histórico</Text></TouchableOpacity>
       </View>

       <FlatList data={filteredSessions} keyExtractor={item=>item.id} renderItem={renderItem} contentContainerStyle={{padding:20}} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSessions}/>} ListEmptyComponent={<Text style={{textAlign:'center', marginTop:50, color:'#999'}}>Nenhuma sessão encontrada.</Text>} />

       <Modal visible={reviewModalVisible} transparent animationType="fade">
           <View style={styles.modalBg}>
               <View style={styles.modalContent}>
                   <Text style={{fontSize:18, fontWeight:'bold', marginBottom:10}}>Avaliar Sessão</Text>
                   <View style={{flexDirection:'row', gap:10, marginBottom:15}}>
                       {[1,2,3,4,5].map(n => (
                           <TouchableOpacity key={n} onPress={()=>setRating(n)}><Feather name="star" size={30} color={n<=rating?"#FFD700":"#CCC"}/></TouchableOpacity>
                       ))}
                   </View>
                   <TextInput style={styles.inputReview} placeholder="Comentário..." multiline value={comment} onChangeText={setComment} />
                   <TouchableOpacity style={styles.btnSubmitReview} onPress={sendReview} disabled={sendingReview}>
                       {sendingReview ? <ActivityIndicator color="#FFF"/> : <Text style={{color:'#FFF', fontWeight:'bold'}}>Enviar</Text>}
                   </TouchableOpacity>
                   <TouchableOpacity onPress={()=>setReviewModalVisible(false)} style={{marginTop:10}}><Text style={{color:'red'}}>Cancelar</Text></TouchableOpacity>
               </View>
           </View>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6EFFF' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#FFF', borderBottomRightRadius: 20, borderBottomLeftRadius: 20, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000080', marginBottom: 15 },
  statsRow: { flexDirection: 'row', gap: 15 },
  statCard: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 15, position: 'relative' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#000080' },
  statLabel: { fontSize: 12, color: '#666' },
  statIcon: { position: 'absolute', right: 10, top: 15, opacity: 0.5 },
  tabs: { flexDirection: 'row', padding: 20, paddingBottom: 0, gap: 15 },
  tab: { flex: 1, padding: 10, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', elevation: 1 },
  activeTab: { backgroundColor: '#000080' },
  tabText: { color: '#555', fontWeight: 'bold' },
  activeTabText: { color: '#FFF' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateText: { color: '#555', fontWeight: 'bold', fontSize: 12 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  skillTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  peopleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  people: { color: '#666', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btnAction: { flex: 1, backgroundColor: '#4CAF50', padding: 8, borderRadius: 5, alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', padding: 20, borderRadius: 10, alignItems: 'center' },
  inputReview: { width: '100%', height: 80, backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, textAlignVertical: 'top', marginBottom: 15 },
  btnSubmitReview: { backgroundColor: '#000080', width: '100%', padding: 12, borderRadius: 8, alignItems: 'center' }
});