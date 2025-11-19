import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext'; // Importar useAuth para pegar ID do aluno
import { Habilidade } from '../../@types';

export default function Marketplace() {
  const { user } = useAuth(); // Pegamos o usuário logado (Mentorado)
  const [items, setItems] = useState<Habilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'MENTORES' | 'ALUNOS'>('MENTORES');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Habilidade | null>(null);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    loadMarketplaceData();
  }, [filterMode]);

  // Função para gerar UUID (igual fizemos no Perfil)
  function generateUUID() { 
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async function loadMarketplaceData() {
    setLoading(true);
    try {
      const response = await api.get('/api/habilidades');
      const allSkills = response.data;
      
      const filtered = allSkills.filter((h: Habilidade) => 
        filterMode === 'MENTORES' ? !!h.isOffering : !!h.isSeeking
      );
      setItems(filtered);
    } catch (error: any) {
      console.log("Erro Marketplace:", error.response?.status);
      // Fallback se o GET ALL falhar (403)
      if (error.response?.status === 403) {
          try {
             const myRes = await api.get('/api/habilidades/me');
             setItems(myRes.data);
          } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleScheduleSession() {
    if (!selectedItem || !user) return;
    
    // Prevenção: Não agendar com si mesmo
    if (selectedItem.usuario?.id === user.id) {
        Alert.alert("Ação Inválida", "Você não pode agendar uma sessão com você mesmo.");
        return;
    }

    setScheduling(true);
    
    try {
       const sessionId = generateUUID();
       
       // PAYLOAD BLINDADO PARA TB_SESSOES
       const payload = {
           id: sessionId,
           habilidadeId: selectedItem.id,
           skillName: selectedItem.name, // tb_sessoes tem skill_name
           
           mentorId: selectedItem.usuario?.id, // Dono da Habilidade
           mentor: { id: selectedItem.usuario?.id },
           
           mentoradoId: user.id, // Eu (Logado)
           mentorado: { id: user.id },
           
           scheduledDate: new Date().toISOString(),
           durationHours: 1, // Default 1h
           status: 'AGENDADA',
           creditsValue: 1, // Valor padrão
           notes: "Agendamento via App Mobile"
       };

       console.log("🚀 Enviando Sessão Blindada:", JSON.stringify(payload));

       await api.post('/api/sessoes', payload);
       
       Alert.alert("Sucesso", "Sessão agendada! Veja na aba 'Sessões'.");
       setModalVisible(false);
    } catch (error: any) {
       console.error("Erro Agendamento:", error.response?.data || error.message);
       Alert.alert("Erro", "Falha ao agendar. Verifique os logs.");
    } finally {
       setScheduling(false);
    }
  }

  const renderCard = ({ item }: { item: Habilidade }) => (
    <TouchableOpacity style={styles.card} onPress={() => { setSelectedItem(item); setModalVisible(true); }}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.usuario?.fullName?.charAt(0) || '?'}</Text>
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>{item.category} • {item.level}</Text>
        <Text style={styles.cardUser}>Mentor: {item.usuario?.fullName || 'Desconhecido'}</Text>
      </View>
      <Feather name="arrow-right-circle" size={24} color="#000080" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
       <View style={styles.header}>
          <Text style={styles.headerTitle}>Marketplace</Text>
          
          <View style={styles.tabs}>
             <TouchableOpacity 
                style={[styles.tab, filterMode === 'MENTORES' && styles.activeTab]}
                onPress={() => setFilterMode('MENTORES')}
             >
                <Text style={[styles.tabText, filterMode === 'MENTORES' && styles.activeTabText]}>Mentores</Text>
             </TouchableOpacity>
             <TouchableOpacity 
                style={[styles.tab, filterMode === 'ALUNOS' && styles.activeTab]}
                onPress={() => setFilterMode('ALUNOS')}
             >
                <Text style={[styles.tabText, filterMode === 'ALUNOS' && styles.activeTabText]}>Alunos</Text>
             </TouchableOpacity>
          </View>
       </View>

       {loading ? <ActivityIndicator color="#000080" style={{marginTop: 20}}/> : (
          <FlatList
             data={items}
             keyExtractor={item => String(item.id)}
             renderItem={renderCard}
             contentContainerStyle={{padding: 20}}
             ListEmptyComponent={
                 <Text style={{textAlign: 'center', marginTop: 20, color: '#888'}}>
                     Nenhuma habilidade encontrada.
                 </Text>
             }
          />
       )}

       {/* MODAL */}
       <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Confirmar Sessão</Text>
                <Text style={styles.modalText}>
                    Solicitar troca de conhecimento em <Text style={{fontWeight:'bold'}}>{selectedItem?.name}</Text>?
                </Text>
                
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>Mentor: {selectedItem?.usuario?.fullName}</Text>
                    <Text style={styles.infoText}>Custo: 1 Crédito</Text>
                    <Text style={styles.infoText}>Duração: 1 Hora</Text>
                </View>
                
                <TouchableOpacity style={styles.btnConfirm} onPress={handleScheduleSession} disabled={scheduling}>
                    {scheduling ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Confirmar Agendamento</Text>}
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                    <Text style={styles.btnCancelText}>Cancelar</Text>
                </TouchableOpacity>
             </View>
          </View>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6EFFF' },
  header: { backgroundColor: '#FFF', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderColor: '#EEE' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000080' },
  tabs: { flexDirection: 'row', marginTop: 15, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#000080' },
  tabText: { color: '#555', fontWeight: '600' },
  activeTabText: { color: '#FFF' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#555' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { fontSize: 12, color: '#777' },
  cardUser: { fontSize: 12, color: '#555', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', padding: 20, borderRadius: 15, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalText: { textAlign: 'center', marginBottom: 15, color: '#666' },
  infoBox: { backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8, width: '100%', marginBottom: 20 },
  infoText: { color: '#555', marginBottom: 5 },
  btnConfirm: { backgroundColor: '#4CAF50', width: '100%', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  btnCancel: { padding: 10 },
  btnCancelText: { color: 'red' }
});