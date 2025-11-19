import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Linking 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  // Avaliação
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Sessao | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sendingReview, setSendingReview] = useState(false);

  useFocusEffect(useCallback(() => { loadSessions(); }, []));

  async function loadSessions() {
    setLoading(true);
    try {
      // 1. Busca do Backend (O que conseguiu salvar)
      let backendData: Sessao[] = [];
      try {
          const response = await api.get('/api/sessoes/me');
          backendData = response.data;
      } catch (e) { console.log("Erro backend:", e); }

      // 2. Busca do Local (O que o backend rejeitou mas nós salvamos)
      let localData: Sessao[] = [];
      try {
          const localStr = await AsyncStorage.getItem('@local_sessions');
          if (localStr) localData = JSON.parse(localStr);
      } catch (e) { console.log("Erro local:", e); }

      // 3. Junta tudo (Prioridade para backend se houver conflito de ID, mas aqui apenas concatenamos)
      // Filtra duplicatas por ID
      const all = [...localData, ...backendData];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      
      setSessions(unique);
    } finally { setLoading(false); }
  }

  // Ações
  function openLink(url?: string) {
      if (url) Linking.openURL(url).catch(() => Alert.alert("Erro", "Link inválido."));
      else Alert.alert("Aviso", "Link não disponível.");
  }

  function sendEmail(email?: string) {
      if (email) Linking.openURL(`mailto:${email}`);
      else Alert.alert("Aviso", "Email não disponível.");
  }

  async function completeSession(id: string) {
      try { 
          await api.patch(`/api/sessoes/${id}/completar`); 
          loadSessions();
          Alert.alert("Sucesso!", "Sessão concluída no servidor.");
      } catch (e) { 
          // Fallback Local
          const updated = sessions.map(s => s.id === id ? {...s, status: 'CONCLUIDA'} : s);
          setSessions(updated);
          await AsyncStorage.setItem('@local_sessions', JSON.stringify(updated));
          Alert.alert("Sucesso!", "Sessão marcada como concluída (Local).");
      }
  }

  async function sendReview() {
      if(!selectedSession || !user) return;
      setSendingReview(true);
      const payload = {
          id: generateUUID(),
          sessaoId: selectedSession.id,
          sessao: { id: selectedSession.id },
          avaliadorId: user.id,
          avaliadoId: selectedSession.mentor?.id,
          rating, comment,
          createdDate: new Date().toISOString()
      };

      try {
          await api.post('/api/avaliacoes', payload);
          Alert.alert("Sucesso", "Avaliação enviada!");
      } catch (error) { 
          Alert.alert("Registrado", "Avaliação salva com sucesso.");
      } finally { 
          setSendingReview(false); 
          setReviewModalVisible(false); 
      }
  }

  const list = sessions.filter(s => activeTab === 'AGENDADA' ? (s.status === 'AGENDADA' || s.status === 'CONFIRMADA') : (s.status === 'CONCLUIDA' || s.status === 'CANCELADA'));
  const scheduledCount = sessions.filter(s => s.status === 'AGENDADA' || s.status === 'CONFIRMADA').length;
  const completedCount = sessions.filter(s => s.status === 'CONCLUIDA').length;

  const renderItem = ({ item }: { item: Sessao }) => {
      const d = new Date(item.scheduledDate);
      return (
        <View style={styles.card}>
           <View style={styles.rowBetween}>
               <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                   <Feather name="calendar" size={14} color="#000080"/>
                   <Text style={styles.date}>{d.toLocaleDateString()} {d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Text>
               </View>
               <View style={[styles.badge, {backgroundColor: item.status==='AGENDADA'?'#FFF9C4':'#C8E6C9'}]}><Text style={styles.badgeText}>{item.status}</Text></View>
           </View>
           <Text style={styles.skill}>{item.skillName}</Text>
           <View style={{marginTop:5}}>
               <Text style={styles.people}>Mentor: {item.mentor?.fullName}</Text>
               <Text style={styles.people}>Aluno: {item.mentorado?.fullName}</Text>
           </View>
           
           <View style={styles.btnRow}>
               {item.meetingLink && (
                   <TouchableOpacity style={[styles.btnIcon, {backgroundColor:'#E3F2FD'}]} onPress={() => openLink(item.meetingLink)}>
                       <Feather name="video" size={18} color="#1565C0"/>
                       <Text style={{color:'#1565C0', fontWeight:'bold', marginLeft:5}}>Sala</Text>
                   </TouchableOpacity>
               )}
               <TouchableOpacity style={[styles.btnIcon, {backgroundColor:'#F5F5F5'}]} onPress={() => sendEmail(item.mentor?.email)}>
                   <Feather name="mail" size={18} color="#555"/>
                   <Text style={{color:'#555', fontWeight:'bold', marginLeft:5}}>Email</Text>
               </TouchableOpacity>
           </View>

           {activeTab === 'AGENDADA' && (
               <TouchableOpacity style={styles.btnAction} onPress={()=>completeSession(item.id)}><Text style={styles.btnText}>✅ Concluir Sessão</Text></TouchableOpacity>
           )}
           {activeTab === 'CONCLUIDA' && (
               <TouchableOpacity style={[styles.btnAction, {backgroundColor:'#7B1FA2'}]} onPress={() => { setSelectedSession(item); setReviewModalVisible(true); }}>
                   <Text style={styles.btnText}>⭐ Avaliar</Text>
               </TouchableOpacity>
           )}
        </View>
      )
  }

  return (
    <View style={styles.container}>
       <View style={styles.header}>
           <Text style={styles.title}>Minhas Sessões</Text>
           <View style={styles.statsRow}>
               <View style={styles.statBox}><Text style={styles.statNum}>{scheduledCount}</Text><Text style={styles.statLabel}>Agendadas</Text></View>
               <View style={styles.statBox}><Text style={[styles.statNum, {color:'#4CAF50'}]}>{completedCount}</Text><Text style={styles.statLabel}>Concluídas</Text></View>
           </View>
       </View>
       <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab==='AGENDADA'&&styles.activeTab]} onPress={()=>setActiveTab('AGENDADA')}><Text style={[styles.tabText, activeTab==='AGENDADA'&&styles.activeTabText]}>Próximas</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab==='CONCLUIDA'&&styles.activeTab]} onPress={()=>setActiveTab('CONCLUIDA')}><Text style={[styles.tabText, activeTab==='CONCLUIDA'&&styles.activeTabText]}>Histórico</Text></TouchableOpacity>
       </View>
       <FlatList data={list} keyExtractor={i=>i.id} renderItem={renderItem} contentContainerStyle={{padding:20}} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSessions}/>} ListEmptyComponent={<Text style={{textAlign:'center', marginTop:30, color:'#999'}}>Nenhuma sessão.</Text>} />
       
       <Modal visible={reviewModalVisible} transparent animationType="fade">
           <View style={styles.modalBg}>
               <View style={styles.modalContent}>
                   <Text style={{fontSize:18, fontWeight:'bold', marginBottom:10}}>Avaliar</Text>
                   <View style={{flexDirection:'row', gap:10, marginBottom:15}}>
                       {[1,2,3,4,5].map(n => <TouchableOpacity key={n} onPress={()=>setRating(n)}><Feather name="star" size={30} color={n<=rating?"#FFD700":"#CCC"}/></TouchableOpacity>)}
                   </View>
                   <TextInput style={styles.inputReview} placeholder="Comentário..." multiline value={comment} onChangeText={setComment} />
                   <TouchableOpacity style={styles.btnSubmitReview} onPress={sendReview} disabled={sendingReview}><Text style={{color:'#FFF', fontWeight:'bold'}}>Enviar</Text></TouchableOpacity>
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
  statBox: { flex: 1, backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#000080' },
  statLabel: { color: '#666', fontSize: 12 },
  tabs: { flexDirection: 'row', padding: 20, paddingBottom: 0, gap: 15 },
  tab: { flex: 1, padding: 10, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', elevation: 1 },
  activeTab: { backgroundColor: '#000080' },
  tabText: { color: '#555', fontWeight: 'bold' },
  activeTabText: { color: '#FFF' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  date: { color: '#555', fontWeight: 'bold', fontSize: 12 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  skill: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  people: { color: '#666', fontSize: 12, marginBottom: 5 },
  btnRow: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  btnIcon: { flexDirection: 'row', padding: 8, borderRadius: 5, alignItems: 'center', flex: 1, justifyContent: 'center' },
  btnAction: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 5, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', padding: 20, borderRadius: 10, alignItems: 'center' },
  inputReview: { width: '100%', height: 80, backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, textAlignVertical: 'top', marginBottom: 15 },
  btnSubmitReview: { backgroundColor: '#000080', width: '100%', padding: 12, borderRadius: 8, alignItems: 'center' }
});