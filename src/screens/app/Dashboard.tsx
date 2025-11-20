import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Image 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext'; // <--- IMPORTANTE
import { Habilidade, Sessao } from '../../@types';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme(); // <--- HOOK DO TEMA
  const colors = theme.colors;  // ATALHO

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
      } catch (e) { serverBalance = user?.timeCredits || 10; }

      try {
          const localRatingsJson = await AsyncStorage.getItem('@local_ratings_map');
          const localMap = localRatingsJson ? JSON.parse(localRatingsJson) : {};
          const localValues: number[] = Object.values(localMap); 
          if (localValues.length > 0) {
              const sum = localValues.reduce((a, b) => a + b, 0);
              const avg = sum / localValues.length;
              const finalAvg = serverRating > 0 ? (serverRating + avg) / 2 : avg;
              setCurrentRating(finalAvg);
          } else {
              setCurrentRating(serverRating > 0 ? serverRating : 5.0);
          }
      } catch (e) {}

      try {
        const skillRes = await api.get('/api/habilidades/me');
        setSkills(skillRes.data);
      } catch (e) {}

      let allSessions: any[] = [];
      try {
          const res = await api.get('/api/sessoes/me');
          if(Array.isArray(res.data)) allSessions = [...res.data];
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
      uniqueSessions.forEach((s:any) => {
           if (s.status === 'CONCLUIDA') {
               const val = Number(s.creditsValue || 1);
               const mId = String(s.mentor?.id || s.mentorId);
               const aId = String(s.mentorado?.id || s.mentoradoId);
               if (mId === myId) adjustment += val;
               if (aId === myId) adjustment -= val;
           }
      });
      setDisplayCredits(10 + adjustment);

    } catch (error) { console.log(error); } finally {
      setLoading(false); setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, [user]));

  const offering = skills.filter(s => s.isOffering);
  const seeking = skills.filter(s => s.isSeeking);

  const RatingStars = ({ rating }: { rating: number }) => (
      <View style={{flexDirection:'row', marginTop:5, alignItems:'center'}}>
          {[1,2,3,4,5].map(i => <Feather key={i} name="star" size={18} color={i <= Math.round(rating) ? "#FFD700" : "#CCC"} />)}
          <Text style={{marginLeft: 8, color: colors.textSecondary, fontWeight: 'bold', fontSize:16}}>{rating.toFixed(1)}</Text>
      </View>
  );

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.cardStat, {backgroundColor: colors.card}]}>
      <View>
        <Text style={[styles.cardTitle, {color: colors.textSecondary}]}>{title}</Text>
        <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
      </View>
      <View style={[styles.iconContainer, {backgroundColor: color + '20'}]}>
         <Feather name={icon} size={24} color={color} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.header, {backgroundColor: colors.card}]}>
        <View>
          <Text style={[styles.greeting, {color: colors.text}]}>Olá, {user?.fullName?.split(' ')[0] || "Usuário"}!</Text>
          <Text style={[styles.subGreeting, {color: colors.textSecondary}]}>
             Créditos: <Text style={{fontWeight: 'bold', color: displayCredits < 0 ? colors.danger : colors.secondary}}>
                 {displayCredits.toFixed(1)}h
             </Text>
          </Text>
        </View>
        <View>
             <Image source={require('../../../assets/logo.png')} style={{width:80, height:80}} resizeMode="contain"/>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchDashboardData()}} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <View style={styles.statsRow}>
            <StatCard title="Sessões Dadas" value={stats.dadas} icon="upload" color={colors.primary} />
            <StatCard title="Recebidas" value={stats.recebidas} icon="download" color={colors.secondary} />
        </View>

        <View style={[styles.ratingCard, {backgroundColor: colors.card}]}>
            <View>
                <Text style={[styles.cardTitle, {color: colors.textSecondary}]}>Sua Reputação</Text>
                <RatingStars rating={currentRating} />
            </View>
            <Feather name="award" size={30} color="#FFA000" />
        </View>
        
        <View style={[styles.sectionContainer, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>Minhas Habilidades</Text>
            {loading ? <ActivityIndicator color={colors.primary} /> : (
                <View>
                    {skills.length === 0 && <Text style={[styles.emptyText, {color: colors.textSecondary}]}>Nenhuma habilidade cadastrada.</Text>}
                    
                    {offering.length > 0 && (
                        <View style={{marginBottom: 20}}>
                            <Text style={[styles.subTitle, {color: colors.textSecondary}]}>Oferecendo ({offering.length})</Text>
                            <View style={styles.badgesRow}>
                                {offering.map(s => (
                                    <View key={s.id} style={[styles.badge, {backgroundColor: colors.background, borderColor: colors.border, borderWidth:1}]}>
                                        <Text style={[styles.badgeText, {color: colors.secondary}]}>{s.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {seeking.length > 0 && (
                        <View>
                            <Text style={[styles.subTitle, {color: colors.textSecondary}]}>Buscando ({seeking.length})</Text>
                            <View style={styles.badgesRow}>
                                {seeking.map(s => (
                                    <View key={s.id} style={[styles.badge, {backgroundColor: colors.background, borderColor: colors.border, borderWidth:1}]}>
                                        <Text style={[styles.badgeText, {color: colors.primary}]}>{s.name}</Text>
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
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomRightRadius: 20, borderBottomLeftRadius: 20, elevation: 3 },
  greeting: { fontSize: 24, fontWeight: 'bold' },
  subGreeting: { fontSize: 16, marginTop: 5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 15 },
  cardStat: { flex: 1, borderRadius: 15, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  iconContainer: { padding: 8, borderRadius: 10 },
  cardTitle: { fontSize: 14, marginBottom: 5 },
  cardValue: { fontSize: 24, fontWeight: 'bold' },
  ratingCard: { borderRadius: 15, padding: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  sectionContainer: { borderRadius: 15, padding: 20, minHeight: 200, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  subTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  badgeText: { fontWeight: 'bold', fontSize: 12 },
  emptyText: { fontStyle: 'italic', textAlign: 'center', marginTop: 20 }
});