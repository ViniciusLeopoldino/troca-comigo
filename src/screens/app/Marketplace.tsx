import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Alert,
    TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { generateUUID } from '../../utils/uuid';
import { Habilidade } from '../../@types';

export default function Marketplace() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();

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

    useEffect(() => {
        loadMarketplaceData();
    }, [filterMode]);

    function generateMeetLink() {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const seg1 = Array(3)
            .fill(0)
            .map(() => chars[Math.floor(Math.random() * chars.length)])
            .join('');
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
                try {
                    const myRes = await api.get('/api/habilidades/me');
                    setItems(myRes.data);
                } catch (e) {}
            }
        } finally {
            setLoading(false);
        }
    }

    async function saveSessionLocally(payload: any) {
        try {
            const existingData = await AsyncStorage.getItem('@local_sessions');
            const sessions = existingData ? JSON.parse(existingData) : [];
            sessions.push(payload);
            await AsyncStorage.setItem('@local_sessions', JSON.stringify(sessions));
        } catch (e) {
            console.log('Erro ao salvar local', e);
        }
    }

    async function getEffectiveBalance() {
        const serverBalance = user?.timeCredits || 0;
        const myId = String(user?.id);
        let localAdjustment = 0;

        try {
            const localStr = await AsyncStorage.getItem('@local_sessions');
            if (localStr) {
                const localSessions = JSON.parse(localStr);
                localSessions.forEach((s: any) => {
                    if (s.status === 'CONCLUIDA') {
                        const val = Number(s.creditsValue || s.durationHours || 1);
                        if (String(s.mentoradoId || s.mentorado?.id) === myId) {
                            localAdjustment -= val;
                        } else if (String(s.mentorId || s.mentor?.id) === myId) {
                            localAdjustment += val;
                        }
                    }
                });
            }
        } catch (e) {}

        return serverBalance + localAdjustment;
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
            const myBalance = await getEffectiveBalance();
            console.log(`Saldo Atual: ${myBalance} | Custo: ${cost}`);

            if (myBalance < 0) {
                Alert.alert(
                    'Saldo Negativo 🛑',
                    `Você tem ${myBalance.toFixed(1)}h. Precisa ensinar alguém para recuperar seu saldo positivo.`
                );
                return;
            }

            if (myBalance < cost) {
                Alert.alert('Saldo Insuficiente 💸', `Você tem ${myBalance.toFixed(1)}h, mas a aula custa ${cost}h.`);
                return;
            }
        }

        let mentorId = selectedItem.usuario?.id || selectedItem.usuarioId || (selectedItem as any).usuario_id;
        let mentorName = selectedItem.usuario?.fullName || 'Mentor';

        if (!mentorId || String(mentorId) === String(user.id)) {
            mentorId = BACKUP_MENTOR_ID;
            mentorName = 'Mestre dos Magos';
        }

        let finalMentorId, finalMentoradoId, finalMentorName, finalMentoradoName;

        if (filterMode === 'MENTORES') {
            finalMentorId = mentorId;
            finalMentorName = mentorName;
            finalMentoradoId = user.id;
            finalMentoradoName = user.fullName;
        } else {
            finalMentorId = user.id;
            finalMentorName = user.fullName;
            finalMentoradoId = mentorId;
            finalMentoradoName = mentorName;
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
            Alert.alert('Sucesso!', 'Sessão agendada.', [
                { text: 'Ver Sessões', onPress: () => navigation.navigate('Sessões') }
            ]);
        } catch (error: any) {
            await saveSessionLocally(payload);
            setModalVisible(false);
            Alert.alert('Agendamento Realizado! ✅', 'Sessão salva no dispositivo.', [
                { text: 'Ver Sessões', onPress: () => navigation.navigate('Sessões') }
            ]);
        } finally {
            setScheduling(false);
        }
    }

    const displayedItems = items.filter(i => i.name.toLowerCase().includes(searchText.toLowerCase()));

    const renderCard = ({ item }: { item: any }) => {
        const ownerName = item.usuario?.fullName || 'Ver Detalhes';
        const initial = ownerName.charAt(0);
        const isLoading = loadingDetailId === item.id;
        const roleLabel = filterMode === 'MENTORES' ? 'Mentor' : 'Aluno';

        return (
            <TouchableOpacity style={styles.card} onPress={() => handlePressCard(item)} disabled={isLoading}>
                <View style={styles.avatarContainer}>
                    {isLoading ? <ActivityIndicator size="small" color="#555" /> : <Text style={styles.avatarText}>{initial}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>
                        {item.category} • {item.level}
                    </Text>
                    <Text style={styles.cardUser}>
                        {roleLabel}: {ownerName}
                    </Text>
                </View>
                <Feather name="arrow-right-circle" size={24} color="#000080" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Marketplace</Text>
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterBtn, filterMode === 'MENTORES' && styles.activeBtn]}
                        onPress={() => setFilterMode('MENTORES')}
                    >
                        <Feather name="award" size={18} color={filterMode === 'MENTORES' ? '#FFF' : '#555'} />
                        <Text style={[styles.filterText, filterMode === 'MENTORES' && styles.activeText]}>Mentores</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, filterMode === 'ALUNOS' && { backgroundColor: '#000080' }]}
                        onPress={() => setFilterMode('ALUNOS')}
                    >
                        <Feather name="users" size={18} color={filterMode === 'ALUNOS' ? '#FFF' : '#555'} />
                        <Text style={[styles.filterText, filterMode === 'ALUNOS' && styles.activeText]}>Alunos</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.searchContainer}>
                    <Feather name="search" size={20} color="#999" />
                    <TextInput style={styles.input} placeholder="Buscar..." value={searchText} onChangeText={setSearchText} />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator color="#000080" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={displayedItems}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={renderCard}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>Nenhum item encontrado.</Text>}
                />
            )}

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Feather name="calendar" size={24} color="#000080" />
                            <Text style={styles.modalTitle}>Agendar Aula</Text>
                        </View>
                        <Text style={styles.modalText}>
                            {filterMode === 'MENTORES' ? `Aprender com ${selectedItem?.usuario?.fullName}.` : `Ensinar para ${selectedItem?.usuario?.fullName}.`}
                        </Text>
                        <View style={styles.durationContainer}>
                            <Text style={styles.labelDuration}>Duração</Text>
                            <View style={styles.counterRow}>
                                <TouchableOpacity onPress={() => adjustDuration(-1)} style={styles.counterBtn}>
                                    <Feather name="minus" size={20} color="#FFF" />
                                </TouchableOpacity>
                                <View style={styles.timeDisplay}>
                                    <Text style={styles.timeText}>{duration}h</Text>
                                </View>
                                <TouchableOpacity onPress={() => adjustDuration(1)} style={styles.counterBtn}>
                                    <Feather name="plus" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.infoBox}>
                            <View style={styles.infoRow}>
                                <Feather name="dollar-sign" size={16} color="#555" />
                                <Text style={styles.infoText}>
                                    {filterMode === 'MENTORES' ? `Custo: ${duration} Créditos` : `Ganho: ${duration} Créditos`}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.btnConfirm} onPress={handleScheduleSession} disabled={scheduling}>
                            {scheduling ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Confirmar</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={{ padding: 15 }} onPress={() => setModalVisible(false)}>
                            <Text style={{ color: 'red' }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#D6EFFF' },
    header: { backgroundColor: '#FFF', padding: 20, paddingTop: 50, borderBottomRightRadius: 20, borderBottomLeftRadius: 20, elevation: 4 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000080', marginBottom: 5 },
    filterRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    filterBtn: { flex: 1, flexDirection: 'row', padding: 12, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', gap: 8 },
    activeBtn: { backgroundColor: '#66BB6A' },
    filterText: { fontWeight: 'bold', color: '#555' },
    activeText: { color: '#FFF' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 15, height: 45 },
    input: { flex: 1, marginLeft: 10, fontSize: 16 },
    card: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 15, elevation: 2 },
    avatarContainer: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: '#555' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    cardSubtitle: { fontSize: 12, color: '#777', marginBottom: 2 },
    cardUser: { fontSize: 12, color: '#555' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#FFF', padding: 25, borderRadius: 20, alignItems: 'center', elevation: 5 },
    modalHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    modalText: { textAlign: 'center', marginBottom: 20, color: '#666', fontSize: 16 },
    durationContainer: { alignItems: 'center', marginBottom: 20, width: '100%' },
    labelDuration: { fontSize: 14, color: '#555', marginBottom: 10 },
    counterRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    counterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000080', alignItems: 'center', justifyContent: 'center' },
    timeDisplay: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F5F5F5', borderRadius: 10, minWidth: 80, alignItems: 'center' },
    timeText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    infoBox: { width: '100%', backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    infoText: { color: '#333', fontSize: 14 },
    btnConfirm: { backgroundColor: '#4CAF50', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});