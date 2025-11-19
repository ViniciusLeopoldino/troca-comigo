import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Tipagem rápida para as habilidades
interface Skill {
  id: number;
  nome: string;
  nivel: string; // ex: "Iniciante", "Avançado"
  tipo?: string; // "OFERECENDO" ou "BUSCANDO" (Depende de como seu backend retorna)
}

export default function Dashboard() {
  const { user } = useAuth(); // Pegamos o user já carregado no login
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Função para buscar dados atualizados
  async function fetchDashboardData() {
    try {
      // Vamos supor que o endpoint de habilidades retorna um array
      const response = await api.get('/api/habilidades/me'); 
      setSkills(response.data); 
    } catch (error) {
      console.log("Erro ao buscar dashboard", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // useFocusEffect garante que os dados atualizem sempre que você voltar para essa tela
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Componente simples para os Cards de Estatística
  const StatCard = ({ title, value, icon }: any) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={[
            styles.cardValue, 
            { color: title.includes('Dadas') ? '#000080' : (title.includes('Recebidas') ? '#4CAF50' : '#333') }
        ]}>
          {value}
        </Text>
      </View>
      <Feather name={icon} size={24} color="#555" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.nome || "Usuário"}!</Text>
          <Text style={styles.subGreeting}>Você tem <Text style={{color: '#4CAF50', fontWeight: 'bold'}}>10h disponíveis</Text>.</Text>
        </View>
        <View>
          <Image
            source={require('../../../assets/logo.png')}
            style={{ width: 75, height: 75 }}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Cards de Estatísticas */}
        <StatCard title="Sessões Dadas" value="0" icon="book-open" />
        <StatCard title="Sessões Recebidas" value="0" icon="users" />
        
        <View style={styles.card}>
           <View>
              <Text style={styles.cardTitle}>Avaliação média</Text>
              <View style={{flexDirection: 'row', marginTop: 5}}>
                  {[1,2,3,4].map(i => <Feather key={i} name="star" size={18} color="#FFD700" />)}
                  <Feather name="star" size={18} color="#CCC" />
              </View>
           </View>
           <Feather name="award" size={24} color="#555" />
        </View>

        {/* Seção Minhas Habilidades */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Minhas Habilidades</Text>
            
            {loading ? (
                <ActivityIndicator color="#000080" />
            ) : (
                <View style={styles.skillsContainer}>
                    {/* Renderização Condicional: Se não tiver skills */}
                    {skills.length === 0 && (
                        <Text style={{color: '#999', fontStyle: 'italic'}}>Nenhuma habilidade cadastrada.</Text>
                    )}

                    {/* Exemplo de renderização das skills */}
                    {skills.map((skill) => (
                        <View key={skill.id} style={styles.skillBadge}>
                           <Text style={styles.skillText}>{skill.nome}</Text>
                        </View>
                    ))}
                    
                    {/* Dados Mockados Visuais para ficar igual ao print se a API estiver vazia */}
                    <View>
                        <Text style={styles.subSectionTitle}>Oferecendo (1)</Text>
                        <View style={[styles.badge, {backgroundColor: '#66BB6A'}]}>
                            <Text style={styles.badgeText}>python</Text>
                        </View>

                        <Text style={[styles.subSectionTitle, {marginTop: 15}]}>Buscando Aprender (1)</Text>
                        <View style={[styles.badge, {backgroundColor: '#000080'}]}>
                            <Text style={styles.badgeText}>banco de dados</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D6EFFF', // Fundo azul claro
  },
  header: {
    paddingTop: 60, // Espaço para status bar
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#D6EFFF'
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  // logoSmall: {
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  //   backgroundColor: '#FFF',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2, // Sombra no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    minHeight: 200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  skillsContainer: {
    marginTop: 5,
  },
  subSectionTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  skillBadge: {
      marginBottom: 10, 
      backgroundColor: '#EEE', 
      padding: 5
  },
  skillText: {
      color: '#333'
  }
});