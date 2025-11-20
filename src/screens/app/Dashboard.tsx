import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Habilidade } from '../../@types';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [skills, setSkills] = useState<Habilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ dadas: 0, recebidas: 0 });
  const [currentRating, setCurrentRating] = useState(5.0);
  const [displayCredits, setDisplayCredits] = useState(10);

  async function fetchDashboardData() {
    try {
      let serverBalance = 10;
      let serverRating = 0;
      try {
        const userRes = await api.get('/api/users/me');
        const u = userRes.data;
        serverRating = u.averageRating || 0;
        serverBalance = u.timeCredits !== undefined ? u.timeCredits : 10;
      } catch (e) {
        serverBalance = user?.timeCredits || 10;
      }

      try {
        const localRatingsJson = await AsyncStorage.getItem('@local_ratings_map');
        const localMap = localRatingsJson ? JSON.parse(localRatingsJson) : {};
        const localValues: number[] = Object.values(localMap);

        if (localValues.length > 0) {
          const localSum = localValues.reduce((a, b) => a + b, 0);
          const localAvg = localSum / localValues.length;
          const finalAvg = serverRating > 0 ? (serverRating + localAvg) / 2 : localAvg;
          setCurrentRating(finalAvg);
        } else {
          setCurrentRating(serverRating > 0 ? serverRating : 5.0);
        }
      } catch (e) {
        console.log('Erro rating');
      }

      try {
        const skillRes = await api.get('/api/habilidades/me');
        setSkills(skillRes.data);
      } catch (e) {}

      let allSessions: any[] = [];
      try {
        const res = await api.get('/api/sessoes/me');
        if (Array.isArray(res.data)) allSessions = [...res.data];
      } catch (e) {}
      try {
        const localStr = await AsyncStorage.getItem('@local_sessions');
        if (localStr) allSessions = [...allSessions, ...JSON.parse(localStr)];
      } catch (e) {}

      const uniqueSessions = Array.from(new Map(allSessions.map(item => [item.id, item])).values());
      const myId = String(user?.id);

      const dadas = uniqueSessions.filter((s: any) => {
        const mentorId = s.mentor?.id || s.mentorId;
        return String(mentorId) === myId && s.status === 'CONCLUIDA';
      }).length;

      const recebidas = uniqueSessions.filter((s: any) => {
        const alunoId = s.mentorado?.id || s.mentoradoId;
        return String(alunoId) === myId && s.status === 'CONCLUIDA';
      }).length;

      setStats({ dadas, recebidas });

      let adjustment = 0;
      uniqueSessions.forEach((s: any) => {
        if (s.status === 'CONCLUIDA') {
          const val = Number(s.creditsValue || 1);
          const mId = String(s.mentor?.id || s.mentorId);
          const aId = String(s.mentorado?.id || s.mentoradoId);
          if (mId === myId) adjustment += val;
          if (aId === myId) adjustment -= val;
        }
      });

      setDisplayCredits(10 + adjustment);
    } catch (error) {
      console.log('Erro Geral', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => {
    fetchDashboardData();
  }, [user]));

  const offering = skills.filter(s => s.isOffering);
  const seeking = skills.filter(s => s.isSeeking);

  const RatingStars = ({ rating }: { rating: number }) => (
    <View style={{ flexDirection: 'row', marginTop: 5, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={18} color={i <= Math.round(rating) ? '#FFD700' : '#CCC'} />
      ))}
      <Text style={{ marginLeft: 8, color: '#666', fontWeight: 'bold', fontSize: 16 }}>{rating.toFixed(1)}</Text>
    </View>
  );

  const StatCard = ({ title, value, icon, color, bg }: any) => (
    <View style={[styles.cardStat, { backgroundColor: bg }]}>
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[styles.cardValue, { color }]}>{value}</Text>
      </View>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.fullName?.split(' ')[0] || 'Usuário'}!</Text>
          <Text style={styles.subGreeting}>
            Créditos disponíveis:{' '}
            <Text style={{ fontWeight: 'bold', color: displayCredits < 0 ? '#D32F2F' : '#4CAF50' }}>
              {displayCredits.toFixed(1)}h
            </Text>
          </Text>
        </View>
        <View>
          <Image source={require('../../../assets/logo.png')} style={{ width: 80, height: 80 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboardData(); }} />}
      >
        <View style={styles.statsRow}>
          <StatCard title="Sessões Dadas" value={stats.dadas} icon="upload" color="#D32F2F" bg="#FFF" />
          <StatCard title="Recebidas" value={stats.recebidas} icon="download" color="#388E3C" bg="#FFF" />
        </View>

        <View style={styles.ratingCard}>
          <View>
            <Text style={styles.cardTitle}>Sua Reputação</Text>
            <RatingStars rating={currentRating} />
          </View>
          <Feather name="award" size={30} color="#FFA000" />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Minhas Habilidades</Text>
          {loading ? (
            <ActivityIndicator color="#000080" />
          ) : (
            <View>
              {skills.length === 0 && <Text style={styles.emptyText}>Nenhuma habilidade cadastrada.</Text>}

              {offering.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.subTitle}>Oferecendo ({offering.length})</Text>
                  <View style={styles.badgesRow}>
                    {offering.map(s => (
                      <View key={s.id} style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                        <Text style={[styles.badgeText, { color: '#2E7D32' }]}>{s.name}</Text>
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
                      <View key={s.id} style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
                        <Text style={[styles.badgeText, { color: '#1565C0' }]}>{s.name}</Text>
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