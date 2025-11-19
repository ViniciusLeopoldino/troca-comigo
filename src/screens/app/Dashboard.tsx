import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Image 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Habilidade } from '../../@types';

export default function Dashboard() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Habilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estatísticas (pode vir da API ou ser calculado)
  const [stats, setStats] = useState({ dadas: 0, recebidas: 0 });

  async function fetchDashboardData() {
    try {
      const skillRes = await api.get('/api/habilidades/me');
      setSkills(skillRes.data);

      // Tenta buscar sessões para estatísticas
      try {
          const sessaoRes = await api.get('/api/sessoes/me');
          const sessoes = sessaoRes.data || [];
          const dadas = sessoes.filter((s: any) => s.mentor?.id === user?.id).length;
          const recebidas = sessoes.filter((s: any) => s.mentorado?.id === user?.id).length;
          setStats({ dadas, recebidas });
      } catch (e) { console.log("Sem sessões ainda"); }

    } catch (error) {
      console.log("Erro Dashboard", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const offering = skills.filter(s => s.isOffering);
  const seeking = skills.filter(s => s.isSeeking);

  const StatCard = ({ title, value, icon, color, bg }: any) => (
    <View style={[styles.cardStat, {backgroundColor: bg}]}>
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.cardValue, { color }]}>{value}</Text>
      </View>
      <View style={[styles.iconContainer, {backgroundColor: color + '20'}]}>
         <Feather name={icon} size={24} color={color} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Expandido */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.fullName?.split(' ')[0] || "Usuário"}!</Text>
          <Text style={styles.subGreeting}>
             Créditos disponíveis: <Text style={styles.highlight}>{user?.timeCredits?.toFixed(1) || 10}h</Text>
          </Text>
        </View>
        <View style={styles.logoContainer}>
             <Feather name="cpu" size={24} color="#000080" />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchDashboardData()}} />}
      >
        
        {/* Cards de Estatística */}
        <View style={styles.statsRow}>
            <StatCard title="Sessões Dadas" value={stats.dadas} icon="book-open" color="#000080" bg="#FFF" />
            <StatCard title="Recebidas" value={stats.recebidas} icon="users" color="#4CAF50" bg="#FFF" />
        </View>

        <View style={styles.ratingCard}>
            <View>
                <Text style={styles.cardTitle}>Avaliação Média</Text>
                <View style={{flexDirection:'row', marginTop:5}}>
                    {[1,2,3,4,5].map(i => <Feather key={i} name="star" size={18} color="#FFD700" />)}
                </View>
            </View>
            <Feather name="award" size={30} color="#555" />
        </View>
        
        {/* Minhas Habilidades */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Minhas Habilidades</Text>
            
            {loading ? <ActivityIndicator color="#000080" /> : (
                <View>
                    {skills.length === 0 && <Text style={styles.emptyText}>Nenhuma habilidade cadastrada.</Text>}
                    
                    {offering.length > 0 && (
                        <View style={{marginBottom: 20}}>
                            <Text style={styles.subTitle}>Oferecendo ({offering.length})</Text>
                            <View style={styles.badgesRow}>
                                {offering.map(s => (
                                    <View key={s.id} style={[styles.badge, {backgroundColor: '#E8F5E9'}]}>
                                        <Text style={[styles.badgeText, {color:'#2E7D32'}]}>{s.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {seeking.length > 0 && (
                        <View>
                            <Text style={styles.subTitle}>Buscando Aprender ({seeking.length})</Text>
                            <View style={styles.badgesRow}>
                                {seeking.map(s => (
                                    <View key={s.id} style={[styles.badge, {backgroundColor: '#E3F2FD'}]}>
                                        <Text style={[styles.badgeText, {color:'#1565C0'}]}>{s.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6EFFF' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subGreeting: { fontSize: 16, color: '#666', marginTop: 5 },
  highlight: { color: '#4CAF50', fontWeight: 'bold' },
  logoContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 15 },
  cardStat: { flex: 1, borderRadius: 15, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  iconContainer: { padding: 8, borderRadius: 10 },
  cardTitle: { fontSize: 14, color: '#666', marginBottom: 5 },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  ratingCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  sectionContainer: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, minHeight: 200, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  subTitle: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  badgeText: { fontWeight: 'bold', fontSize: 12 },
  emptyText: { color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }
});