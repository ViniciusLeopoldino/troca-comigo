import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, TextInput, Image 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext'; // <---
import { generateUUID } from '../../utils/uuid';
import { Habilidade } from '../../@types';

export default function Marketplace() {
  const { user } = useAuth(); 
  const navigation = useNavigation<any>();
  const { theme } = useTheme(); // <---
  const colors = theme.colors;
  
  const [items, setItems] = useState<Habilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'MENTORES' | 'ALUNOS'>('MENTORES');
  const [searchText, setSearchText] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Habilidade | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [duration, setDuration] = useState(1);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const BACKUP_MENTOR_ID = 'mentor-uuid-123'; 

  useEffect(() => { loadMarketplaceData(); }, [filterMode]);

  function generateMeetLink() {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const seg1 = Array(3).fill(0).map(()=>chars[Math.floor(Math.random()*chars.length)]).join('');
      return `https://meet.google.com/${seg1}-troca-skill`;
  }

  function formatDateForJava(date: Date) {
      return date.toISOString().split('.')[0];
  }

  async function loadMarketplaceData() {
    setLoading(true);
    try {
      const response = await api.get('/api/habilidades');
      const filtered = response.data.filter((h: Habilidade) => 
        filterMode === 'MENTORES' ? !!h.isOffering : !!h.isSeeking
      );
      setItems(filtered);
    } catch (error: any) {
      if (error.response?.status === 403) {
          try { const myRes = await api.get('/api/habilidades/me'); setItems(myRes.data); } catch (e) {}
      }
    } finally { setLoading(false); }
  }

  async function saveSessionLocally(payload: any) {
      try {
          const existingData = await AsyncStorage.getItem('@local_sessions');
          const sessions = existingData ? JSON.parse(existingData) : [];
          sessions.push(payload);
          await AsyncStorage.setItem('@local_sessions', JSON.stringify(sessions));
      } catch (e) {}
  }

  async function handlePressCard(item: Habilidade) {
      setLoadingDetailId(item.id);
      try {
          const response = await api.get(`/api/habilidades/${item.id}`);
          const fullData = response.data;
          if (fullData.usuario || fullData.usuarioId) {
              setSelectedItem(fullData);
          } else {
              setSelectedItem(item);
          }
          setDuration(1);
          setModalVisible(true);
      } catch (error) {
          setSelectedItem(item);
          setDuration(1);
          setModalVisible(true);
      } finally {
          setLoadingDetailId(null);
      }
  }

  function adjustDuration(amount: number) {
      const newDuration = duration + amount;
      if (newDuration >= 1 && newDuration <= 5) setDuration(newDuration);
  }

  async function handleScheduleSession() {
    if (!selectedItem || !user) return;
    
    if (filterMode === 'MENTORES') {
        const cost = duration;
        const myBalance = user.timeCredits || 0; // Aqui poderia usar a função global de saldo se quisesse ser mais preciso
        if (myBalance < cost) {
            Alert.alert("Saldo Insuficiente", `Você tem ${myBalance.toFixed(1)}h, mas a aula custa ${cost}h.`);
            return;
        }
    }

    let mentorId = selectedItem.usuario?.id || selectedItem.usuarioId || (selectedItem as any).usuario_id;
    let mentorName = selectedItem.usuario?.fullName || "Mentor";

    if (!mentorId || String(mentorId) === String(user.id)) {
        mentorId = BACKUP_MENTOR_ID; 
        mentorName = "Mestre dos Magos";
    }

    let finalMentorId, finalMentoradoId, finalMentorName, finalMentoradoName;

    if (filterMode === 'MENTORES') {
        finalMentorId = mentorId; finalMentorName = mentorName;
        finalMentoradoId = user.id; finalMentoradoName = user.fullName;
    } else {
        finalMentorId = user.id; finalMentorName = user.fullName;
        finalMentoradoId = mentorId; finalMentoradoName = mentorName;
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
        mentorId: finalMentorId,
        mentor: { id: finalMentorId, fullName: finalMentorName },
        mentoradoId: finalMentoradoId,
        mentorado: { id: finalMentoradoId, fullName: finalMentoradoName },
        scheduledDate: dataFormatada, 
        durationHours: duration, 
        status: 'AGENDADA', 
        creditsValue: totalCredits,
        meetingLink: meetingLink, 
        notes: `Sessão Mobile`
    };

    try {
       await api.post('/api/sessoes', payload);
       setModalVisible(false);
       Alert.alert("Sucesso!", "Sessão agendada.", [{ text: "Ver Sessões", onPress: () => navigation.navigate('Sessões') }]);
    } catch (error: any) {
       await saveSessionLocally(payload);
       setModalVisible(false);
       Alert.alert("Agendamento Realizado! ✅", "Sessão salva (Modo Híbrido).", [{ text: "Ver Sessões", onPress: () => navigation.navigate('Sessões') }]);
    } finally { setScheduling(false); }
  }

  const displayedItems = items.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase()));

  const renderCard = ({ item }: { item: any }) => {
      const mentorName = item.usuario?.fullName || "Ver Detalhes";
      const initial = mentorName.charAt(0);
      const isLoading = loadingDetailId === item.id;
      const roleLabel = filterMode === 'MENTORES' ? 'Mentor' : 'Aluno';

      return (
        <TouchableOpacity style={[styles.card, {backgroundColor: colors.card}]} onPress={() => handlePressCard(item)} disabled={isLoading}>
          <View style={[styles.avatarContainer, {backgroundColor: colors.inputBg}]}>
             {isLoading ? <ActivityIndicator size="small" color={colors.text}/> : <Text style={[styles.avatarText, {color: colors.textSecondary}]}>{initial}</Text>}
          </View>
          <View style={{flex:1}}>
            <Text style={[styles.cardTitle, {color: colors.text}]}>{item.name}</Text>
            <Text style={[styles.cardSubtitle, {color: colors.textSecondary}]}>{item.category} • {item.level}</Text>
            <Text style={[styles.cardUser, {color: colors.textSecondary}]}>{roleLabel}: {mentorName}</Text>
          </View>
          <Feather name="arrow-right-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
       <View style={[styles.header, {backgroundColor: colors.card}]}>
          <Text style={[styles.headerTitle, {color: colors.primary}]}>Marketplace</Text>
          <View style={styles.filterRow}>
             <TouchableOpacity style={[styles.filterBtn, {backgroundColor: colors.inputBg}, filterMode==='MENTORES' && {backgroundColor: colors.secondary}]} onPress={()=>setFilterMode('MENTORES')}>
                <Feather name="award" size={18} color={filterMode==='MENTORES'?'#FFF':colors.textSecondary}/>
                <Text style={[styles.filterText, {color: filterMode==='MENTORES'?'#FFF':colors.textSecondary}]}>Mentores</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.filterBtn, {backgroundColor: colors.inputBg}, filterMode==='ALUNOS' && {backgroundColor: colors.primary}]} onPress={()=>setFilterMode('ALUNOS')}>
                <Feather name="users" size={18} color={filterMode==='ALUNOS'?'#FFF':colors.textSecondary}/>
                <Text style={[styles.filterText, {color: filterMode==='ALUNOS'?'#FFF':colors.textSecondary}]}>Alunos</Text>
             </TouchableOpacity>
          </View>
          <View style={[styles.searchContainer, {backgroundColor: colors.inputBg}]}>
              <Feather name="search" size={20} color={colors.textSecondary} />
              <TextInput 
                style={[styles.input, {color: colors.text}]} 
                placeholder="Buscar..." 
                placeholderTextColor={colors.textSecondary}
                value={searchText} 
                onChangeText={setSearchText} 
              />
          </View>
       </View>

       {loading ? <ActivityIndicator color={colors.primary} style={{marginTop:50}}/> : (
          <FlatList
             data={displayedItems}
             keyExtractor={item => String(item.id)}
             contentContainerStyle={{padding:20}}
             renderItem={renderCard}
             ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:colors.textSecondary}}>Nenhum resultado.</Text>}
          />
       )}

       <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
             <View style={[styles.modalContent, {backgroundColor: colors.card}]}>
                <View style={styles.modalHeader}>
                    <Feather name="calendar" size={24} color={colors.primary} />
                    <Text style={[styles.modalTitle, {color: colors.text}]}>
                        {filterMode === 'MENTORES' ? 'Agendar Aula' : 'Oferecer Aula'}
                    </Text>
                </View>
                
                <Text style={[styles.modalText, {color: colors.textSecondary}]}>
                    {filterMode === 'MENTORES' 
                        ? `Aprender com ${selectedItem?.usuario?.fullName}.`
                        : `Ensinar para ${selectedItem?.usuario?.fullName}.`
                    }
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
                    <View style={styles.infoRow}>
                        <Feather name="dollar-sign" size={16} color={colors.textSecondary}/>
                        <Text style={[styles.infoText, {color: colors.text}]}>{filterMode === 'MENTORES' ? `Custo: ${duration} Créditos` : `Ganho: ${duration} Créditos`}</Text>
                    </View>
                </View>

                <TouchableOpacity style={[styles.btnConfirm, {backgroundColor: colors.secondary}]} onPress={handleScheduleSession} disabled={scheduling}>
                    {scheduling ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Confirmar</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={{padding:15}} onPress={()=>setModalVisible(false)}><Text style={{color: colors.danger}}>Cancelar</Text></TouchableOpacity>
             </View>
          </View>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 50, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, elevation: 4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  filterRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  filterBtn: { flex: 1, flexDirection: 'row', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  filterText: { fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 15, height: 45 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  card: { padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 15, elevation: 2 },
  avatarContainer: { width: 45, height: 45, borderRadius: 22.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 12, marginBottom: 2 },
  cardUser: { fontSize: 12 },
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
  btnConfirm: { width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});