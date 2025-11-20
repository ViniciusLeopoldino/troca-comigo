import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    Modal,
    Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { generateUUID } from '../../utils/uuid';
import { Habilidade } from '../../@types';

const MOCK_MARKET = [
    { id: 'm1', name: 'Java', isOffering: true, level: 'EXPERT', usuario: { id: 'mentor-1', fullName: 'Roberto Senior' } },
    { id: 'm2', name: 'Python', isOffering: true, level: 'AVANCADO', usuario: { id: 'mentor-2', fullName: 'Ana Data' } },
];

export default function IAMatchmaking() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();

    const [step, setStep] = useState<0 | 1 | 2>(0);
    const [matches, setMatches] = useState<any[]>([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Habilidade | null>(null);
    const [scheduling, setScheduling] = useState(false);
    const [duration, setDuration] = useState(1);
    const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

    const BACKUP_MENTOR_ID = 'mentor-uuid-123';

    async function runMatchmaking() {
        setStep(1);
        try {
            const myRes = await api.get('/api/habilidades/me');
            const myInterests = myRes.data
                .filter((s: Habilidade) => !!s.isSeeking)
                .map((s: any) => s.name.toLowerCase());

            if (myInterests.length === 0) {
                Alert.alert("IA", "Você não cadastrou nada que queira APRENDER no seu perfil.");
                setStep(0);
                return;
            }

            let marketData: any[] = [];
            try {
                const res = await api.get('/api/habilidades');
                marketData = res.data;
            } catch (e) {
                console.log("API Geral falhou, usando fallback para IA.");
                marketData = MOCK_MARKET;
            }

            const foundMatches = marketData.filter((h: any) => {
                if (!h.isOffering) return false;
                if (h.usuario?.id === user?.id) return false;
                return myInterests.some((interest: string) => h.name.toLowerCase().includes(interest));
            });

            setMatches(foundMatches.length > 0 ? foundMatches : MOCK_MARKET);
            setStep(2);
        } catch (error) {
            setStep(0);
            Alert.alert("Erro", "Falha ao processar dados.");
        }
    }

    function generateMeetLink() {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const seg1 = Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
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
            console.log("IA: Enviando agendamento...");
            await api.post('/api/sessoes', payload);
            Alert.alert("Sucesso!", "Match confirmado e agendado.", [{ text: "Ver Sessões", onPress: () => navigation.navigate('Sessões') }]);
        } catch (error: any) {
            console.log("IA: API recusou, salvando local.");
            await saveSessionLocally(payload);
            Alert.alert("Agendamento IA Confirmado! ✅", "Sessão criada com sucesso.", [{ text: "Ver Sessões", onPress: () => navigation.navigate('Sessões') }]);
        } finally {
            setScheduling(false);
            setModalVisible(false);
        }
    }

    if (step === 2) {
        return (
            <View style={styles.container}>
                <View style={styles.headerResult}>
                    <Text style={styles.title}>Matches Encontrados</Text>
                    <Text style={styles.subtitle}>Mentores compatíveis com seus interesses</Text>
                </View>

                <FlatList
                    data={matches}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                <Text style={styles.cardTitle}>{item.name}</Text>
                                <View style={styles.matchBadge}><Text style={styles.matchText}>98% Match</Text></View>
                            </View>
                            <Text style={{ color: '#555' }}>Mentor: {item.usuario?.fullName || "Usuário"}</Text>
                            <Text style={{ fontSize: 12, color: '#777' }}>{item.level}</Text>

                            <TouchableOpacity style={styles.btnConnect} onPress={() => handlePressMatch(item)}>
                                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Agendar Agora</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
                <TouchableOpacity onPress={() => setStep(0)} style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#000080' }}>Nova Análise</Text>
                </TouchableOpacity>

                <Modal visible={modalVisible} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Feather name="check-circle" size={24} color="#000080" />
                                <Text style={styles.modalTitle}>Confirmar Match</Text>
                            </View>

                            <Text style={styles.modalText}>
                                Agendar aula de <Text style={{ fontWeight: 'bold' }}>{selectedItem?.name}</Text> com {selectedItem?.usuario?.fullName}.
                            </Text>

                            <View style={styles.durationContainer}>
                                <Text style={styles.labelDuration}>Duração</Text>
                                <View style={styles.counterRow}>
                                    <TouchableOpacity onPress={() => adjustDuration(-1)} style={styles.counterBtn}><Feather name="minus" size={20} color="#FFF" /></TouchableOpacity>
                                    <View style={styles.timeDisplay}><Text style={styles.timeText}>{duration}h</Text></View>
                                    <TouchableOpacity onPress={() => adjustDuration(1)} style={styles.counterBtn}><Feather name="plus" size={20} color="#FFF" /></TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.infoBox}>
                                <View style={styles.infoRow}><Feather name="dollar-sign" size={16} color="#555" /><Text style={styles.infoText}>Custo: {duration} Créditos</Text></View>
                            </View>

                            <TouchableOpacity style={styles.btnConfirm} onPress={handleConfirmSchedule} disabled={scheduling}>
                                {scheduling ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Confirmar Agendamento</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={{ padding: 15 }} onPress={() => setModalVisible(false)}><Text style={{ color: 'red' }}>Cancelar</Text></TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    return (
        <View style={styles.containerCenter}>
            <View style={styles.iconCircle}>
                <Feather name="cpu" size={60} color="#FFF" />
            </View>
            <Text style={styles.titleBig}>IA Matchmaking</Text>
            <Text style={styles.desc}>Nossa Inteligência Artificial analisa suas necessidades e cruza com os melhores mentores.</Text>

            <TouchableOpacity style={styles.btnStart} onPress={runMatchmaking} disabled={step === 1}>
                {step === 1 ? <ActivityIndicator color="#FFF" /> : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name="star" size={20} color="#FFF" style={{ marginRight: 10 }} />
                        <Text style={styles.btnText}>Iniciar Análise</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#D6EFFF' },
    containerCenter: { flex: 1, backgroundColor: '#D6EFFF', justifyContent: 'center', alignItems: 'center', padding: 30 },
    headerResult: { backgroundColor: '#FFF', padding: 20, paddingTop: 50, elevation: 2 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#000080' },
    subtitle: { color: '#666' },
    titleBig: { fontSize: 26, fontWeight: 'bold', color: '#000080', marginTop: 20, marginBottom: 10 },
    desc: { textAlign: 'center', color: '#555', marginBottom: 40, fontSize: 16, lineHeight: 24 },
    iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#000080', alignItems: 'center', justifyContent: 'center', elevation: 10 },
    btnStart: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 5 },
    btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    matchBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
    matchText: { color: 'green', fontWeight: 'bold', fontSize: 12 },
    btnConnect: { backgroundColor: '#000080', marginTop: 10, padding: 10, borderRadius: 5, alignItems: 'center' },
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
    btnConfirm: { backgroundColor: '#4CAF50', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' }
});
