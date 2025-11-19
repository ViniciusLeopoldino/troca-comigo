import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert, TextInput 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { generateUUID } from '../../utils/uuid';
import { Habilidade } from '../../@types';

export default function Marketplace() {
  const { user } = useAuth(); 
  const [items, setItems] = useState<Habilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'MENTORES' | 'ALUNOS'>('MENTORES');
  const [searchText, setSearchText] = useState('');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Habilidade | null>(null);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => { loadMarketplaceData(); }, [filterMode]);

  async function loadMarketplaceData() {
    setLoading(true);
    try {
      const response = await api.get('/api/habilidades');
      const filtered = response.data.filter((h: Habilidade) => 
        filterMode === 'MENTORES' ? !!h.isOffering : !!h.isSeeking
      );
      setItems(filtered);
    } catch (error: any) {
      console.log("Erro Marketplace:", error.response?.status);
      if (error.response?.status === 403) {
          try { const myRes = await api.get('/api/habilidades/me'); setItems(myRes.data); } catch (e) {}
      }
    } finally { setLoading(false); }
  }

  async function handleScheduleSession() {
    if (!selectedItem || !user) return;
    if (selectedItem.usuario?.id === user.id) return Alert.alert("Erro", "Você não pode agendar com você mesmo.");

    setScheduling(true);
    try {
       const sessionId = generateUUID();
       const payload = {
           id: sessionId,
           habilidadeId: selectedItem.id,
           skillName: selectedItem.name, 
           mentorId: selectedItem.usuario?.id,
           mentor: { id: selectedItem.usuario?.id },
           mentoradoId: user.id,
           mentorado: { id: user.id },
           scheduledDate: new Date().toISOString(), 
           durationHours: 1.0, 
           status: 'AGENDADA',
           creditsValue: 1.0,
           meetingLink: "https://meet.google.com/pending", 
           notes: "Sessão criada via App Mobile"
       };
       await api.post('/api/sessoes', payload);
       Alert.alert("Sucesso", "Sessão agendada com sucesso!");
       setModalVisible(false);
    } catch (error: any) {
       Alert.alert("Erro", "Falha ao agendar (403).");
    } finally { setScheduling(false); }
  }

  // Filtra localmente pela busca
  const displayedItems = items.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase()));

  const renderCard = ({ item }: { item: Habilidade }) => (
    <TouchableOpacity style={styles.card} onPress={() => { setSelectedItem(item); setModalVisible(true); }}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.usuario?.fullName?.charAt(0) || '?'}</Text>
      </View>
      <View style={{flex:1}}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>{item.category} • {item.level}</Text>
        <Text style={styles.cardUser}>{filterMode === 'MENTORES' ? 'Mentor' : 'Aluno'}: {item.usuario?.fullName}</Text>
      </View>
      <Feather name="arrow-right-circle" size={24} color="#000080" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
       <View style={styles.header}>
          <Text style={styles.headerTitle}>Marketplace</Text>
          <Text style={styles.headerSubtitle}>Encontre conexões para trocar skills</Text>

          {/* Botões de Filtro Grandes */}
          <View style={styles.filterRow}>
             <TouchableOpacity style={[styles.filterBtn, filterMode==='MENTORES' && {backgroundColor:'#66BB6A'}]} onPress={()=>setFilterMode('MENTORES')}>
                <Feather name="award" color={filterMode==='MENTORES'?'#FFF':'#555'} size={18}/>
                <Text style={[styles.filterText, filterMode==='MENTORES' && {color:'#FFF'}]}>Mentores</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.filterBtn, filterMode==='ALUNOS' && {backgroundColor:'#000080'}]} onPress={()=>setFilterMode('ALUNOS')}>
                <Feather name="users" color={filterMode==='ALUNOS'?'#FFF':'#555'} size={18}/>
                <Text style={[styles.filterText, filterMode==='ALUNOS' && {color:'#FFF'}]}>Alunos</Text>
             </TouchableOpacity>
          </View>

          {/* Barra de Busca */}
          <View style={styles.searchBar}>
              <Feather name="search" size={20} color="#999"/>
              <TextInput 
                  style={styles.searchInput} 
                  placeholder="Buscar habilidades (ex: Java)..." 
                  value={searchText}
                  onChangeText={setSearchText}
              />
          </View>
       </View>

       {loading ? <ActivityIndicator color="#000080" style={{marginTop:20}}/> : (
          <FlatList
             data={displayedItems}
             keyExtractor={item => String(item.id)}
             renderItem={renderCard}
             contentContainerStyle={{padding:20}}
             ListEmptyComponent={
                 <View style={{alignItems:'center', marginTop:30}}>
                    <Feather name="inbox" size={40} color="#CCC"/>
                    <Text style={{marginTop:10, color:'#888'}}>Nenhuma habilidade encontrada.</Text>
                 </View>
             }
          />
       )}

       <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Solicitar Sessão</Text>
                <Text style={styles.modalText}>Deseja iniciar uma troca de conhecimento em <Text style={{fontWeight:'bold'}}>{selectedItem?.name}</Text>?</Text>
                
                <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                        <Feather name="user" size={16} color="#555"/>
                        <Text style={styles.infoText}>{selectedItem?.usuario?.fullName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Feather name="clock" size={16} color="#555"/>
                        <Text style={styles.infoText}>Duração: 1 Hora</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Feather name="dollar-sign" size={16} color="#555"/>
                        <Text style={styles.infoText}>Custo: 1 Crédito</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.btnConfirm} onPress={handleScheduleSession} disabled={scheduling}>
                    {scheduling ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Confirmar Agendamento</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={{padding:10}} onPress={()=>setModalVisible(false)}><Text style={{color:'red'}}>Cancelar</Text></TouchableOpacity>
             </View>
          </View>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6EFFF' },
  header: { backgroundColor: '#FFF', padding: 20, paddingTop: 50, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, elevation: 3 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000080' },
  headerSubtitle: { fontSize: 14, color: '#666', marginBottom: 15 },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, backgroundColor: '#F0F0F0', gap: 8 },
  filterText: { fontWeight: 'bold', color: '#555' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 15, borderRadius: 10, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#555' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { fontSize: 12, color: '#777', marginBottom: 2 },
  cardUser: { fontSize: 12, color: '#555' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', padding: 25, borderRadius: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  modalText: { textAlign: 'center', marginBottom: 20, color: '#666', fontSize: 16 },
  infoBox: { width: '100%', backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoText: { color: '#333', fontSize: 14 },
  btnConfirm: { backgroundColor: '#4CAF50', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});