import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Alert, ActivityIndicator, Linking 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { gerarBioLocalmente } from '../../services/fakeIA';
import { Habilidade } from '../../@types';

export default function Perfil() {
  const { user, signOut, updateUser } = useAuth();
  
  // --- DADOS DO USUÁRIO (Espelho da tb_usuarios) ---
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email] = useState(user?.email || ''); // Email geralmente não edita
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState('São Paulo, Brasil'); // tb_usuarios.location
  const [linkedinUrl, setLinkedinUrl] = useState(''); // tb_usuarios.linkedin_url
  
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // --- DADOS DA NOVA HABILIDADE ---
  const [skills, setSkills] = useState<Habilidade[]>([]);
  const [skillName, setSkillName] = useState('');
  const [isOffering, setIsOffering] = useState(true);
  
  // Mapeamento Visual -> Banco de Dados (Constraint SQL)
  const niveisSQL = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO', 'EXPERT'];
  const [selectedLevel, setSelectedLevel] = useState('INTERMEDIARIO');

  const categoriasSQL = ['TECNOLOGIA', 'DESIGN', 'NEGOCIOS', 'IDIOMAS', 'MARKETING', 'DADOS', 'SOFT_SKILLS'];
  const [selectedCategory, setSelectedCategory] = useState('TECNOLOGIA');

  // Carrega dados ao entrar na tela
  useFocusEffect(useCallback(() => {
    loadProfileData();
  }, []));

  async function loadProfileData() {
    setLoadingData(true);
    try {
      // 1. Carrega Perfil Completo
      const userRes = await api.get('/api/users/me');
      const u = userRes.data;
      setFullName(u.fullName);
      setBio(u.bio || '');
      setLocation(u.location || '');
      setLinkedinUrl(u.linkedinUrl || '');

      // 2. Carrega Habilidades
      const skillRes = await api.get('/api/habilidades/me');
      setSkills(skillRes.data);
    } catch (error) {
      console.log("Erro ao carregar dados", error);
    } finally {
      setLoadingData(false);
    }
  }

  // --- AÇÃO: SALVAR PERFIL (PUT) ---
  async function handleSaveProfile() {
    setSaving(true);
    try {
      const payload = {
        fullName,
        email, // Alguns backends exigem que mande o email de volta
        bio,
        location,     // Campo novo
        linkedinUrl,  // Campo novo
      };
      
      console.log("Enviando Update User:", payload);
      await api.put('/api/users/me', payload);
      await updateUser(); 
      Alert.alert("Sucesso", "Dados atualizados no banco!");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", "Falha ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  // --- AÇÃO: ADICIONAR HABILIDADE (POST) ---
// Função auxiliar para gerar ID único (UUID v4 simples)
  function generateUUID() { 
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async function handleAddSkill() {
    if (!skillName.trim()) {
       Alert.alert("Erro", "Digite o nome da habilidade.");
       return;
    }

    // Prevenção: Garante que temos o ID do usuário
    if (!user || !user.id) {
       Alert.alert("Erro", "Sessão inválida. Faça login novamente.");
       return;
    }

    try {
      const novoId = generateUUID(); // Geramos o ID aqui no front
      
      // Payload COMPLETO batendo com todas as colunas da tabela tb_habilidades
      const payload = {
        id: novoId, // <--- TENTATIVA 1: Enviar o ID gerado manualmente
        name: skillName,
        level: selectedLevel, // 'INTERMEDIARIO' (Maiúsculo)
        category: selectedCategory, // 'TECNOLOGIA'
        description: `Habilidade de ${skillName} nível ${selectedLevel}`, // <--- Preenchemos a descrição
        hourlyRate: 1, // <--- Preenchemos valor padrão (hourly_rate)
        isOffering: isOffering,
        isSeeking: !isOffering,
        usuarioId: user.id,
        usuario: { 
            id: user.id 
        } 
      };

      console.log("🚀 Enviando Payload BLINDADO:", JSON.stringify(payload)); 

      await api.post('/api/habilidades', payload);
      
      Alert.alert("Sucesso", "Habilidade criada com sucesso!");
      setSkillName('');
      loadProfileData(); 
    } catch (error: any) {
      console.error("Erro Detalhado:", error.response?.data || error.message);
      
      // Se der erro 403 de novo, o problema pode ser a URL. 
      // Vamos tentar uma URL alternativa que é comum em padrões REST
      if (error.response?.status === 403 || error.response?.status === 404) {
          console.log("Tentando rota alternativa...");
          try {
             // Tentativa 2: POST na rota aninhada (comum em Spring Data REST)
             await api.post(`/api/users/${user.id}/habilidades`, payload);
             Alert.alert("Sucesso", "Habilidade criada (Rota Alternativa)!");
             setSkillName('');
             loadProfileData();
             return;
          } catch (e) {
             console.log("Rota alternativa falhou também.");
          }
      }
      
      Alert.alert("Erro Fatal", `O Backend rejeitou com status ${error.response?.status}. Verifique os logs.`);
    }
  }

  async function handleDeleteSkill(id: string) {
    try {
      await api.delete(`/api/habilidades/${id}`);
      loadProfileData();
    } catch (error) { Alert.alert("Erro", "Não foi possível deletar."); }
  }

  function handleIA() {
      const text = gerarBioLocalmente(fullName, skills.map(s => s.name));
      setBio(text);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Meu Perfil Completo</Text>

        {/* --- CARD 1: DADOS PESSOAIS (tb_usuarios) --- */}
        <View style={styles.card}>
           <Text style={styles.sectionTitle}>👤 Informações</Text>
           
           <Text style={styles.label}>Nome Completo</Text>
           <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
           
           <Text style={styles.label}>Localização (Cidade/País)</Text>
           <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Ex: São Paulo, SP" />

           <Text style={styles.label}>LinkedIn (URL)</Text>
           <TextInput style={styles.input} value={linkedinUrl} onChangeText={setLinkedinUrl} placeholder="https://linkedin.com/in/..." autoCapitalize="none" />

           <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:10}}>
               <Text style={styles.label}>Biografia</Text>
               <TouchableOpacity onPress={handleIA}>
                   <Text style={{color:'#7B1FA2', fontWeight:'bold'}}>✨ Gerar com IA</Text>
               </TouchableOpacity>
           </View>
           <TextInput 
              style={[styles.input, {height:80, textAlignVertical:'top'}]} 
              multiline value={bio} onChangeText={setBio} 
           />

           <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={saving}>
               {saving ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>💾 Atualizar Dados</Text>}
           </TouchableOpacity>
        </View>

        {/* --- CARD 2: HABILIDADES (tb_habilidades) --- */}
        <View style={styles.card}>
           <Text style={styles.sectionTitle}>🏆 Nova Habilidade</Text>
           
           <TextInput 
             style={styles.input} 
             placeholder="Nome (Ex: Java, Photoshop)" 
             value={skillName} 
             onChangeText={setSkillName} 
           />

           {/* Categoria SQL */}
           <Text style={styles.label}>Categoria (Obrigatório)</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:10}}>
              {categoriasSQL.map(cat => (
                  <TouchableOpacity key={cat} 
                    style={[styles.chip, selectedCategory === cat && styles.chipSelected]}
                    onPress={() => setSelectedCategory(cat)}>
                    <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>{cat}</Text>
                  </TouchableOpacity>
              ))}
           </ScrollView>

           {/* Nível SQL */}
           <Text style={styles.label}>Nível (Obrigatório)</Text>
           <View style={styles.rowWrap}>
              {niveisSQL.map(lvl => (
                  <TouchableOpacity key={lvl} 
                    style={[styles.chip, selectedLevel === lvl && styles.chipSelected]}
                    onPress={() => setSelectedLevel(lvl)}>
                    <Text style={[styles.chipText, selectedLevel === lvl && styles.chipTextSelected]}>{lvl}</Text>
                  </TouchableOpacity>
              ))}
           </View>
           
           {/* Tipo */}
           <View style={styles.rowWrap}>
              <TouchableOpacity onPress={()=>setIsOffering(true)} style={[styles.typeBtn, isOffering && {backgroundColor:'#4CAF50'}]}>
                  <Text style={{color: isOffering?'#FFF':'#333'}}>Ensinar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setIsOffering(false)} style={[styles.typeBtn, !isOffering && {backgroundColor:'#000080'}]}>
                  <Text style={{color: !isOffering?'#FFF':'#333'}}>Aprender</Text>
              </TouchableOpacity>
           </View>

           <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}>
               <Text style={styles.btnText}>+ Cadastrar Habilidade</Text>
           </TouchableOpacity>
        </View>

        {/* --- LISTA DE HABILIDADES --- */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lista de Skills</Text>
            {loadingData ? <ActivityIndicator/> : skills.map(s => (
                <View key={s.id} style={styles.skillItem}>
                    <View>
                        <Text style={{fontWeight:'bold'}}>{s.name}</Text>
                        <Text style={{fontSize:10, color:'#555'}}>{s.category} • {s.level}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteSkill(s.id)}>
                        <Feather name="trash-2" size={18} color="red"/>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
        
        <TouchableOpacity style={styles.logout} onPress={signOut}><Text style={{color:'red'}}>Sair</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, backgroundColor:'#D6EFFF'},
  scrollContent: {padding:20, paddingBottom:40},
  headerTitle: {fontSize:24, fontWeight:'bold', color:'#000080', marginBottom:20, marginTop:30},
  card: {backgroundColor:'#FFF', borderRadius:15, padding:15, marginBottom:20, elevation:2},
  sectionTitle: {fontSize:16, fontWeight:'bold', marginBottom:15, color:'#333'},
  label: {fontSize:12, color:'#666', marginBottom:5, marginTop:5},
  input: {backgroundColor:'#F5F5F5', borderRadius:8, padding:10, borderWidth:1, borderColor:'#E0E0E0', fontSize:15},
  saveButton: {backgroundColor:'#000080', padding:12, borderRadius:8, alignItems:'center', marginTop:15},
  addButton: {backgroundColor:'#4CAF50', padding:12, borderRadius:8, alignItems:'center', marginTop:15},
  btnText: {color:'#FFF', fontWeight:'bold'},
  rowWrap: {flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:10},
  chip: {padding:6, borderRadius:20, borderWidth:1, borderColor:'#CCC', marginBottom:5},
  chipSelected: {backgroundColor:'#000080', borderColor:'#000080'},
  chipText: {fontSize:10, color:'#555'},
  chipTextSelected: {color:'#FFF'},
  typeBtn: {flex:1, padding:10, borderWidth:1, borderColor:'#CCC', borderRadius:8, alignItems:'center'},
  skillItem: {flexDirection:'row', justifyContent:'space-between', paddingVertical:10, borderBottomWidth:1, borderColor:'#EEE'},
  logout: {alignItems:'center', padding:20}
});