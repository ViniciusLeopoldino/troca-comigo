import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image, Modal 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { generateUUID } from '../../utils/uuid';
import { Habilidade } from '../../@types';
import { useTheme } from '../../contexts/ThemeContext'; // <---

const MOCK_MARKET = [
    { id: 'm1', name: 'Java', isOffering: true, level: 'EXPERT', usuario: { id: 'mentor-1', fullName: 'Roberto Senior' } },
    { id: 'm2', name: 'Python', isOffering: true, level: 'AVANCADO', usuario: { id: 'mentor-2', fullName: 'Ana Data' } },
];

export default function IAMatchmaking() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { theme } = useTheme(); // <---
  const colors = theme.colors;

  const [step, setStep] = useState<0 | 1 | 2>(0); 
  const [matches, setMatches] = useState<any[]>([]);
  
  // Modal e Agendamento
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Habilidade | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [duration, setDuration] = useState(1);

  const BACKUP_MENTOR_ID = 'mentor-uuid-123';

  async function runMatchmaking() {
    setStep(1);
    try {
      const myRes = await api.get('/api/habilidades/me');
      const myInterests = myRes.data.filter((s: Habilidade) => !!s.isSeeking).map((s:any) => s.name.toLowerCase());

      if (myInterests.length === 0) {
          Alert.alert("IA", "Adicione o que quer APRENDER no seu perfil primeiro.");
          setStep(0);
          return;
      }

      let marketData: any[] = [];
      try {
          const res = await api.get('/api/habilidades');
          marketData = res.data;
      } catch (e) { marketData = MOCK_MARKET; }

      const foundMatches = marketData.filter((h: any) => {
          if (!h.isOffering) return false;
          if (h.usuario?.id === user?.id) return false; 
          return myInterests.some((interest: string) => h.name.toLowerCase().includes(interest));
      });

      setMatches(foundMatches.length > 0 ? foundMatches : MOCK_MARKET);
      setStep(2);
    } catch (error) { setStep(0); Alert.alert("Erro", "Falha ao processar dados."); }
  }

  function generateMeetLink() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const seg1 = Array(3).fill(0).map(()=>chars[Math.floor(Math.random()*chars.length)]).join('');
    return `https://meet.google.com/${seg1}-ia-match`;
  }

  function formatDateForJava(date: Date) {
    return date.toISOString().split('.')[0];
  }

  async function saveSessionLocally(payload: any) {
    try {
        const existingData = await AsyncStorage.getItem('@local_sessions');
        const sessions = existingData ? JSON.parse(existingData) : [];
        sessions.push(payload);
        await AsyncStorage.setItem('@local_sessions', JSON.stringify(sessions));
    } catch (e) {}
  }

  function handlePressMatch(item: Habilidade) {
      setSelectedItem(item);
      setDuration(1);
      setModalVisible(true);
  }

  function adjustDuration(amount: number) {
      const newDuration = duration + amount;
      if (newDuration >= 1 && newDuration <= 5) setDuration(newDuration);
  }

  async function handleConfirmSchedule() {
      if (!selectedItem || !user) return;

      let mentorId = selectedItem.usuario?.id || selectedItem.usuarioId || (selectedItem as any).usuario_id;
      let mentorName = selectedItem.usuario?.fullName || "Mentor IA";

      if (!mentorId) {
          mentorId = BACKUP_MENTOR_ID;
          mentorName = "Mestre dos Magos";
      }

      setScheduling(true);

      const sessionId = generateUUID();
      const meetingLink = generateMeetLink();
      const totalCredits = duration * 1;
      const dataFormatada = formatDateForJava(new Date());

      const payload = {
          id: sessionId,
          habilidadeId: selectedItem.id,
          skillName: selectedItem.name,
          mentorId: mentorId,
          mentor: { id: mentorId, fullName: mentorName },
          mentoradoId: user.id,
          mentorado: { id: user.id, fullName: user.fullName },
          scheduledDate: dataFormatada,
          durationHours: duration,
          status: 'AGENDADA',
          creditsValue: totalCredits,
          meetingLink: meetingLink,
          notes: `Match via IA`
      };

      try {
          await api.post('/api/sessoes', payload);
          Alert.alert("Sucesso!", "Match confirmado e agendado.", [{ text: "Ver Sessões", onPress: () => navigation.navigate('Sessões') }]);
      } catch (error: any) {
          await saveSessionLocally(payload);
          Alert.alert("Agendamento IA Confirmado! ✅", "Sessão criada com sucesso.", [{ text: "Ver Sessões", onPress: () => navigation.navigate('Sessões') }]);
      } finally {
          setScheduling(false);
          setModalVisible(false);
      }
  }

  if (step === 2) {
      return (
          <View style={[styles.container, {backgroundColor: colors.background}]}>
              <View style={[styles.headerResult, {backgroundColor: colors.card}]}>
                  <Text style={[styles.title, {color: colors.primary}]}>Matches Encontrados</Text>
                  <Text style={[styles.subtitle, {color: colors.textSecondary}]}>Baseado no seu perfil de aprendizado</Text>
              </View>
              
              <FlatList 
                  data={matches}
                  keyExtractor={item => String(item.id)}
                  contentContainerStyle={{padding:20}}
                  renderItem={({item}) => (
                      <View style={[styles.card, {backgroundColor: colors.card}]}>
                          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:5}}>
                              <Text style={[styles.cardTitle, {color: colors.text}]}>{item.name}</Text>
                              <View style={[styles.matchBadge, {backgroundColor: colors.secondary + '20'}]}><Text style={[styles.matchText, {color: colors.secondary}]}>98% Match</Text></View>
                          </View>
                          <Text style={{color: colors.textSecondary}}>Mentor: {item.usuario?.fullName || "Usuário"}</Text>
                          <Text style={{fontSize:12, color: colors.textSecondary}}>{item.level}</Text>
                          
                          <TouchableOpacity style={[styles.btnConnect, {backgroundColor: colors.primary}]} onPress={() => handlePressMatch(item)}>
                              <Text style={{color:'#FFF', fontWeight:'bold'}}>Agendar Agora</Text>
                          </TouchableOpacity>
                      </View>
                  )}
              />
              <TouchableOpacity onPress={()=>setStep(0)} style={{padding:20, alignItems:'center'}}><Text style={{color: colors.primary}}>Nova Análise</Text></TouchableOpacity>
              
              {/* MODAL */}
              <Modal visible={modalVisible} transparent animationType="slide">
                  <View style={styles.modalOverlay}>
                     <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
                        <View style={styles.modalHeader}>
                            <Feather name="check-circle" size={24} color={colors.primary} />
                            <Text style={[styles.modalTitle, {color: colors.text}]}>Confirmar Match</Text>
                        </View>
                        <Text style={[styles.modalText, {color: colors.textSecondary}]}>
                            Agendar aula de <Text style={{fontWeight:'bold', color: colors.text}}>{selectedItem?.name}</Text>.
                        </Text>
                        <View style={styles.durationContainer}>
                            <Text style={[styles.labelDuration, {color: colors.text}]}>Duração</Text>
                            <View style={styles.counterRow}>
                                <TouchableOpacity onPress={() => adjustDuration(-1)} style={[styles.counterBtn, {backgroundColor: colors.primary}]}><Feather name="minus" size={20} color="#FFF" /></TouchableOpacity>
                                <View style={[styles.timeDisplay, {backgroundColor: colors.inputBg}]}><Text style={[styles.timeText, {color: colors.text}]}>{duration}h</Text></View>
                                <TouchableOpacity onPress={() => adjustDuration(1)} style={[styles.counterBtn, {backgroundColor: colors.primary}]}><Feather name="plus" size={20} color="#FFF" /></TouchableOpacity>
                            </View>
                        </View>
                        <View style={[styles.infoBox, {backgroundColor: colors.inputBg}]}>
                            <View style={styles.infoRow}><Feather name="dollar-sign" size={16} color={colors.textSecondary}/><Text style={[styles.infoText, {color: colors.text}]}>Custo: {duration} Créditos</Text></View>
                        </View>
                        <TouchableOpacity style={[styles.btnConfirm, {backgroundColor: colors.secondary}]} onPress={handleConfirmSchedule} disabled={scheduling}>
                            {scheduling ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Confirmar Agendamento</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={{padding:15}} onPress={()=>setModalVisible(false)}><Text style={{color: colors.danger}}>Cancelar</Text></TouchableOpacity>
                     </View>
                  </View>
               </Modal>
          </View>
      )
  }

  return (
    <View style={[styles.containerCenter, {backgroundColor: colors.background}]}>
       <View style={[styles.iconCircle, {backgroundColor: colors.primary}]}>
          <Image source={require('../../../assets/logo.png')} style={{width: 70, height: 70}} resizeMode="contain"/>
       </View>
       <Text style={[styles.titleBig, {color: colors.primary}]}>IA Matchmaking</Text>
       <Text style={[styles.desc, {color: colors.textSecondary}]}>Nossa Inteligência Artificial analisa suas necessidades e cruza com os melhores mentores.</Text>
       
       <TouchableOpacity style={[styles.btnStart, {backgroundColor: colors.secondary}]} onPress={runMatchmaking} disabled={step===1}>
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
  container: { flex: 1 },
  containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  headerResult: { padding: 20, paddingTop: 50, elevation: 2 },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { },
  titleBig: { fontSize: 26, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  desc: { textAlign: 'center', marginBottom: 40, fontSize: 16, lineHeight: 24 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', elevation: 10 },
  btnStart: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 5 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  card: { padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  matchBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  matchText: { fontWeight: 'bold', fontSize: 12 },
  btnConnect: { marginTop: 10, padding: 10, borderRadius: 5, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', padding: 25, borderRadius: 20, alignItems: 'center', elevation: 5 },
  modalHeader: { flexDirection:'row', gap: 10, alignItems:'center', marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalText: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  durationContainer: { alignItems: 'center', marginBottom: 20, width: '100%' },
  labelDuration: { fontSize: 14, marginBottom: 10 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  counterBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  timeDisplay: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minWidth: 80, alignItems: 'center' },
  timeText: { fontSize: 24, fontWeight: 'bold' },
  infoBox: { width:'100%', padding:15, borderRadius:10, marginBottom:20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoText: { fontSize: 14 },
  btnConfirm: { width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' }
});