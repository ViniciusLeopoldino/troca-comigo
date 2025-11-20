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
import { useTheme } from '../../contexts/ThemeContext'; // <---

export default function Sessoes() {
  const { user } = useAuth();
  const { theme } = useTheme(); // <---
  const colors = theme.colors;

  const [activeTab, setActiveTab] = useState<'AGENDADA' | 'CONCLUIDA'>('AGENDADA');
  const [sessions, setSessions] = useState<Sessao[]>([]);
  const [loading, setLoading] = useState(false);
  const [myRatings, setMyRatings] = useState<{[key: string]: number}>({});

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Sessao | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sendingReview, setSendingReview] = useState(false);

  useFocusEffect(useCallback(() => { loadSessions(); }, []));

  async function loadSessions() {
    setLoading(true);
    try {
      let backendData: Sessao[] = [];
      try {
          const res = await api.get('/api/sessoes/me');
          if (Array.isArray(res.data)) backendData = res.data;
      } catch (e) {}

      let localData: Sessao[] = [];
      try {
          const localStr = await AsyncStorage.getItem('@local_sessions');
          if (localStr) localData = JSON.parse(localStr);
      } catch (e) {}

      const all = [...localData, ...backendData];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      setSessions(unique);

      try {
          const ratingsStr = await AsyncStorage.getItem('@local_ratings_map');
          if (ratingsStr) setMyRatings(JSON.parse(ratingsStr));
      } catch (e) {}

    } finally { setLoading(false); }
  }

  function openLink(url?: string) {
      if (url && url.startsWith('http')) Linking.openURL(url).catch(() => Alert.alert("Erro", "Link inválido."));
      else Alert.alert("Aviso", "Link não disponível.");
  }

  function sendEmail(email?: string) {
      if (email) Linking.openURL(`mailto:${email}`);
      else Alert.alert("Aviso", "Email não disponível.");
  }

  async function cancelSession(id: string) {
      Alert.alert("Cancelar", "Deseja cancelar?", [
          { text: "Não", style: "cancel" },
          { text: "Sim", style: 'destructive', onPress: async () => {
              try {
                  await api.patch(`/api/sessoes/${id}/cancelar`);
                  loadSessions();
              } catch (e) {
                  const updated = sessions.map(s => s.id === id ? {...s, status: 'CANCELADA'} : s);
                  setSessions(updated);
                  await AsyncStorage.setItem('@local_sessions', JSON.stringify(updated));
              }
          }}
      ]);
  }

  async function deleteFromHistory(id: string) {
      Alert.alert("Apagar", "Remover do histórico?", [
        { text: "Não", style: "cancel" },
        { text: "Sim", onPress: async () => {
            const newSessions = sessions.filter(s => s.id !== id);
            setSessions(newSessions);
            try {
                const localStr = await AsyncStorage.getItem('@local_sessions');
                if (localStr) {
                    const localData = JSON.parse(localStr);
                    const newLocalData = localData.filter((s: any) => s.id !== id);
                    await AsyncStorage.setItem('@local_sessions', JSON.stringify(newLocalData));
                }
            } catch (e) {}
        }}
      ]);
  }

  async function completeSession(id: string) {
      try { 
          await api.patch(`/api/sessoes/${id}/completar`); 
          loadSessions();
          Alert.alert("Sucesso!", "Sessão concluída.");
      } catch (e) { 
          const updated = sessions.map(s => s.id === id ? {...s, status: 'CONCLUIDA'} : s);
          setSessions(updated);
          await AsyncStorage.setItem('@local_sessions', JSON.stringify(updated));
          Alert.alert("Sucesso!", "Concluída (Local).");
      }
  }

  async function sendReview() {
      if(!selectedSession || !user) return;
      setSendingReview(true);
      const payload = {
          id: generateUUID(),
          sessao: { id: selectedSession.id }, sessaoId: selectedSession.id,
          avaliador: { id: user.id }, avaliadorId: user.id,
          avaliado: { id: selectedSession.mentor?.id }, avaliadoId: selectedSession.mentor?.id,
          rating, comment, createdDate: new Date().toISOString().split('.')[0]
      };
      try {
          await api.post('/api/avaliacoes', payload);
          Alert.alert("Sucesso", "Avaliação enviada!");
      } catch (error) { console.log("API Falhou"); } 
      finally { 
          try {
              const currentMap = { ...myRatings, [selectedSession.id]: rating };
              setMyRatings(currentMap);
              await AsyncStorage.setItem('@local_ratings_map', JSON.stringify(currentMap));
          } catch (e) {}
          setSendingReview(false); 
          setReviewModalVisible(false); 
      }
  }

  const SmallStars = ({ score }: { score: number }) => (
      <View style={{flexDirection:'row'}}>
          {[1,2,3,4,5].map(i => <Feather key={i} name="star" size={14} color={i<=score?"#FFD700":"#CCC"}/>)}
      </View>
  );

  const list = sessions.filter(s => activeTab === 'AGENDADA' ? (s.status === 'AGENDADA' || s.status === 'CONFIRMADA') : (s.status === 'CONCLUIDA' || s.status === 'CANCELADA'));
  const scheduledCount = sessions.filter(s => s.status === 'AGENDADA' || s.status === 'CONFIRMADA').length;
  const completedCount = sessions.filter(s => s.status === 'CONCLUIDA').length;

  const renderItem = ({ item }: { item: Sessao }) => {
      const d = new Date(item.scheduledDate);
      const statusColor = item.status === 'CANCELADA' ? colors.danger + '20' : (item.status === 'AGENDADA' ? '#FFF9C4' : '#C8E6C9');
      const statusTextColor = item.status === 'CANCELADA' ? colors.danger : '#333';

      const myId = String(user?.id);
      const isMentor = String(item.mentor?.id || item.mentorId) === myId;
      const userRating = myRatings[item.id];

      return (
        <View style={[styles.card, {backgroundColor: colors.card}]}>
           {activeTab === 'CONCLUIDA' && (
               <TouchableOpacity style={styles.deleteIcon} onPress={() => deleteFromHistory(item.id)}>
                   <Feather name="x" size={18} color={colors.textSecondary} />
               </TouchableOpacity>
           )}

           <View style={styles.roleContainer}>
               <View style={[styles.roleBadge, {backgroundColor: isMentor ? colors.primary + '20' : colors.secondary + '20'}]}>
                   <Feather name={isMentor ? "award" : "book-open"} size={12} color={isMentor ? colors.primary : colors.secondary} />
                   <Text style={[styles.roleText, {color: isMentor ? colors.primary : colors.secondary}]}>{isMentor ? "VOCÊ É O MENTOR" : "VOCÊ É O ALUNO"}</Text>
               </View>
           </View>

           <View style={styles.rowBetween}>
               <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                   <Feather name="calendar" size={14} color={colors.textSecondary}/>
                   <Text style={[styles.date, {color: colors.textSecondary}]}>{d.toLocaleDateString()} {d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Text>
               </View>
               <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
                   <Text style={[styles.statusText, {color: statusTextColor}]}>{item.status}</Text>
               </View>
           </View>
           
           <Text style={[styles.skill, {color: colors.text}]}>{item.skillName}</Text>
           <View style={styles.peopleContainer}>
               <Text style={[styles.people, {color: colors.textSecondary}]}>Mentor: {item.mentor?.fullName || 'Desconhecido'}</Text>
               <Text style={[styles.people, {color: colors.textSecondary}]}>Aluno: {item.mentorado?.fullName || 'Desconhecido'}</Text>
           </View>
           
           <View style={styles.btnRow}>
               {item.meetingLink && activeTab === 'AGENDADA' && (
                   <TouchableOpacity style={[styles.btnIcon, {backgroundColor: colors.primary + '20'}]} onPress={() => openLink(item.meetingLink)}>
                       <Feather name="video" size={18} color={colors.primary}/><Text style={[styles.btnLinkText, {color: colors.primary}]}>Sala</Text>
                   </TouchableOpacity>
               )}
               <TouchableOpacity style={[styles.btnIcon, {backgroundColor: colors.inputBg}]} onPress={() => sendEmail(item.mentor?.email)}>
                   <Feather name="mail" size={18} color={colors.textSecondary}/><Text style={[styles.btnLinkText, {color: colors.textSecondary}]}>Email</Text>
               </TouchableOpacity>
           </View>

           {activeTab === 'AGENDADA' && (
               <View style={{flexDirection:'row', gap: 10, marginTop: 5}}>
                   <TouchableOpacity style={[styles.btnAction, {backgroundColor: colors.danger, flex: 0.4}]} onPress={() => cancelSession(item.id)}><Text style={styles.btnText}>✕</Text></TouchableOpacity>
                   <TouchableOpacity style={[styles.btnAction, {backgroundColor: colors.secondary, flex: 1}]} onPress={() => completeSession(item.id)}><Text style={styles.btnText}>✅ Concluir</Text></TouchableOpacity>
               </View>
           )}
           
           {activeTab === 'CONCLUIDA' && item.status === 'CONCLUIDA' && (
               <View style={{marginTop:10}}>
                   {userRating ? (
                       <View style={[styles.ratedBadge, {backgroundColor: colors.inputBg}]}>
                           <Text style={{fontSize:12, color: colors.textSecondary, marginRight:5}}>Sua avaliação:</Text>
                           <SmallStars score={userRating} />
                       </View>
                   ) : (
                       <TouchableOpacity style={[styles.btnAction, {backgroundColor: colors.primary}]} onPress={() => { setSelectedSession(item); setReviewModalVisible(true); }}>
                           <Text style={styles.btnText}>⭐ Avaliar</Text>
                       </TouchableOpacity>
                   )}
               </View>
           )}
        </View>
      )
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
       <View style={[styles.header, {backgroundColor: colors.card}]}>
           <Text style={[styles.title, {color: colors.primary}]}>Minhas Sessões</Text>
           <View style={styles.statsRow}>
               <View style={[styles.statBox, {backgroundColor: colors.inputBg}]}><Text style={[styles.statNum, {color: colors.primary}]}>{scheduledCount}</Text><Text style={[styles.statLabel, {color: colors.textSecondary}]}>Agendadas</Text></View>
               <View style={[styles.statBox, {backgroundColor: colors.inputBg}]}><Text style={[styles.statNum, {color: colors.secondary}]}>{completedCount}</Text><Text style={[styles.statLabel, {color: colors.textSecondary}]}>Histórico</Text></View>
           </View>
       </View>
       <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, {backgroundColor: colors.card}, activeTab==='AGENDADA' && {backgroundColor: colors.primary}]} onPress={()=>setActiveTab('AGENDADA')}><Text style={[styles.tabText, {color: colors.textSecondary}, activeTab==='AGENDADA'&&{color: '#FFF'}]}>Próximas</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, {backgroundColor: colors.card}, activeTab==='CONCLUIDA' && {backgroundColor: colors.primary}]} onPress={()=>setActiveTab('CONCLUIDA')}><Text style={[styles.tabText, {color: colors.textSecondary}, activeTab==='CONCLUIDA'&&{color: '#FFF'}]}>Histórico</Text></TouchableOpacity>
       </View>
       <FlatList data={list} keyExtractor={i=>i.id} renderItem={renderItem} contentContainerStyle={{padding:20}} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSessions} tintColor={colors.primary}/>} ListEmptyComponent={<Text style={{textAlign:'center', marginTop:30, color:colors.textSecondary}}>Nenhuma sessão encontrada.</Text>} />
       
       <Modal visible={reviewModalVisible} transparent animationType="fade">
           <View style={styles.modalBg}>
               <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
                   <Text style={{fontSize:18, fontWeight:'bold', marginBottom:10, color: colors.text}}>Avaliar Experiência</Text>
                   <View style={{flexDirection:'row', gap:10, marginBottom:15}}>
                       {[1,2,3,4,5].map(n => <TouchableOpacity key={n} onPress={()=>setRating(n)}><Feather name="star" size={30} color={n<=rating?"#FFD700":"#CCC"}/></TouchableOpacity>)}
                   </View>
                   <TextInput style={[styles.inputReview, {backgroundColor: colors.inputBg, color: colors.text}]} placeholder="Comentário..." placeholderTextColor={colors.textSecondary} multiline value={comment} onChangeText={setComment} />
                   <TouchableOpacity style={[styles.btnSubmitReview, {backgroundColor: colors.primary}]} onPress={sendReview} disabled={sendingReview}><Text style={{color:'#FFF', fontWeight:'bold'}}>Enviar</Text></TouchableOpacity>
                   <TouchableOpacity onPress={()=>setReviewModalVisible(false)} style={{marginTop:10}}><Text style={{color: colors.danger}}>Cancelar</Text></TouchableOpacity>
               </View>
           </View>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 50, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  statsRow: { flexDirection: 'row', gap: 15 },
  statBox: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12 },
  tabs: { flexDirection: 'row', padding: 20, paddingBottom: 0, gap: 15 },
  tab: { flex: 1, padding: 10, borderRadius: 20, alignItems: 'center', elevation: 1 },
  tabText: { fontWeight: 'bold' },
  
  card: { padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  deleteIcon: { position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 5 },

  roleContainer: { alignItems: 'flex-start', marginBottom: 10 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  roleText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  date: { fontWeight: 'bold', fontSize: 12 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  skill: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  peopleContainer: { marginTop: 0, gap: 2 },
  people: { fontSize: 12 },

  btnRow: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  btnIcon: { flexDirection: 'row', padding: 8, borderRadius: 5, alignItems: 'center', flex: 1, justifyContent: 'center' },
  btnLinkText: { fontWeight:'bold', marginLeft:5, fontSize:12 },
  btnAction: { padding: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center', flex:1 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  ratedBadge: { flexDirection:'row', alignItems:'center', padding:10, borderRadius:5, alignSelf:'flex-start' },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 20, borderRadius: 10, alignItems: 'center' },
  inputReview: { width: '100%', height: 80, borderRadius: 8, padding: 10, textAlignVertical: 'top', marginBottom: 15 },
  btnSubmitReview: { width: '100%', padding: 12, borderRadius: 8, alignItems: 'center' }
});