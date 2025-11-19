// ARQUIVO COMPLETO: src/screens/app/Marketplace.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { Habilidade } from '../../@types';

export default function Marketplace() {
  const [items, setItems] = useState<Habilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'MENTORES' | 'ALUNOS'>('MENTORES');
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Habilidade | null>(null);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => {
    loadMarketplaceData();
  }, [filterMode]);

async function loadMarketplaceData() {
    setLoading(true);
    try {
      // Tenta buscar todas as habilidades
      const response = await api.get('/api/habilidades');
      
      const allSkills = response.data;
      const filtered = allSkills.filter((h: Habilidade) => 
        filterMode === 'MENTORES' ? !!h.isOffering : !!h.isSeeking
      );
      setItems(filtered);

    } catch (error: any) {
      console.log("Erro Marketplace:", error.response?.status);
      
      if (error.response?.status === 403) {
          // Se der 403, tenta um fallback: Mostra apenas as SUAS habilidades (Melhor que nada)
          // Isso prova que a tela funciona, mas a permissão do backend barrou o geral
          try {
              const myRes = await api.get('/api/habilidades/me');
              setItems(myRes.data); 
              Alert.alert("Aviso de Permissão", "Você está vendo apenas suas habilidades pois o endpoint público retornou 403 (Proibido).");
          } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleScheduleSession() {
    if (!selectedItem) return;
    setScheduling(true);
    
    try {
       // Post para criar sessão (tb_sessoes)
       // Ajuste os campos conforme seu SessionDTO Java
       await api.post('/api/sessoes', {
           habilidadeId: selectedItem.id,
           mentorId: selectedItem.usuario?.id, 
           scheduledDate: new Date().toISOString(), // Simplificação: agenda para "agora"
           status: 'AGENDADA'
       });
       
       Alert.alert("Sucesso", "Sessão solicitada com sucesso!");
       setModalVisible(false);
    } catch (error) {
       Alert.alert("Erro", "Não foi possível agendar. Verifique se você não está tentando agendar com você mesmo.");
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
        <Text style={styles.cardUser}>Usuário: {item.usuario?.fullName || 'Desconhecido'}</Text>
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
                <Text style={[styles.tabText, filterMode === 'MENTORES' && styles.activeTabText]}>Mentores (Oferecendo)</Text>
             </TouchableOpacity>
             <TouchableOpacity 
                style={[styles.tab, filterMode === 'ALUNOS' && styles.activeTab]}
                onPress={() => setFilterMode('ALUNOS')}
             >
                <Text style={[styles.tabText, filterMode === 'ALUNOS' && styles.activeTabText]}>Alunos (Buscando)</Text>
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
                     Nenhuma habilidade encontrada neste filtro.
                 </Text>
             }
          />
       )}

       {/* MODAL DE CONFIRMAÇÃO */}
       <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Confirmar Agendamento</Text>
                <Text style={styles.modalText}>
                    Deseja solicitar uma sessão sobre <Text style={{fontWeight:'bold'}}>{selectedItem?.name}</Text> com {selectedItem?.usuario?.fullName}?
                </Text>
                
                <TouchableOpacity style={styles.btnConfirm} onPress={handleScheduleSession} disabled={scheduling}>
                    {scheduling ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Confirmar Solicitação</Text>}
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
  modalText: { textAlign: 'center', marginBottom: 20, color: '#666' },
  btnConfirm: { backgroundColor: '#4CAF50', width: '100%', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  btnCancel: { padding: 10 },
  btnCancelText: { color: 'red' }
});