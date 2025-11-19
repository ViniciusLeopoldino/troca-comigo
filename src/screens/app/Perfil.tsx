import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Alert, ActivityIndicator, Image, Platform, KeyboardAvoidingView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { gerarBioLocalmente } from '../../services/fakeIA';
import { generateUUID } from '../../utils/uuid';
import { Habilidade } from '../../@types';

export default function Perfil() {
  const { user, signOut, updateUser } = useAuth();
  
  // --- DADOS DO USUÁRIO (tb_usuarios) ---
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState('São Paulo, Brasil');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); 
  
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // --- DADOS DA HABILIDADE (tb_habilidades) ---
  const [skills, setSkills] = useState<Habilidade[]>([]);
  const [skillName, setSkillName] = useState('');
  const [isOffering, setIsOffering] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('INTERMEDIARIO');
  const [selectedCategory, setSelectedCategory] = useState('TECNOLOGIA');

  // Listas para Dropdown/Chips
  const niveisSQL = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO', 'EXPERT'];
  const categoriasSQL = ['TECNOLOGIA', 'DESIGN', 'NEGOCIOS', 'IDIOMAS', 'MARKETING', 'DADOS', 'SOFT_SKILLS'];

  useFocusEffect(useCallback(() => { loadProfileData(); }, []));

  async function loadProfileData() {
    setLoadingData(true);
    try {
      const userRes = await api.get('/api/users/me');
      const u = userRes.data;
      setFullName(u.fullName);
      setBio(u.bio || '');
      setLocation(u.location || 'São Paulo, Brasil');
      setLinkedinUrl(u.linkedinUrl || '');
      setAvatarUrl(u.avatarUrl || `https://ui-avatars.com/api/?name=${u.fullName}&background=0D8ABC&color=fff`);

      const skillRes = await api.get('/api/habilidades/me');
      setSkills(skillRes.data);
    } catch (error) { console.log("Erro load", error); } finally { setLoadingData(false); }
  }

  // --- SALVAR PERFIL ---
  async function handleSaveProfile() {
    setSaving(true);
    try {
      const payload = {
        fullName, email, bio, location, linkedinUrl, avatarUrl,
        timezone: "America/Sao_Paulo",
        timeCredits: user?.timeCredits || 10,
        userRole: user?.userRole || 'ADMIN'
      };
      await api.put('/api/users/me', payload);
      await updateUser(); 
      Alert.alert("Sucesso", "Perfil atualizado!");
    } catch (error) { Alert.alert("Erro", "Falha ao salvar perfil."); } finally { setSaving(false); }
  }

  // --- CRIAR HABILIDADE ---
  async function handleAddSkill() {
    if (!skillName.trim()) return Alert.alert("Erro", "Nome obrigatório");
    if (!user?.id) return Alert.alert("Erro", "Relogue no app");

    try {
      const novoId = generateUUID(); 
      const payload = {
        id: novoId,
        name: skillName,
        level: selectedLevel,       
        category: selectedCategory, 
        description: `Habilidade de ${skillName} nível ${selectedLevel}`,
        hourlyRate: 1, 
        isOffering: isOffering,
        isSeeking: !isOffering,
        usuarioId: user.id,
        usuario: { id: user.id } 
      };

      await api.post('/api/habilidades', payload);
      Alert.alert("Sucesso", "Habilidade criada!");
      setSkillName('');
      loadProfileData(); 
    } catch (error: any) {
      console.error("Erro Add Skill:", error.response?.data || error.message);
      Alert.alert("Erro", "Falha ao criar habilidade (403/500).");
    }
  }

  async function handleDeleteSkill(id: string) {
    try { await api.delete(`/api/habilidades/${id}`); loadProfileData(); } catch (e) {}
  }

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <Text style={styles.headerSubtitle}>Gerencie suas informações e habilidades</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- CARD 1: INFORMAÇÕES PESSOAIS --- */}
        <View style={styles.card}>
           <View style={styles.cardHeader}>
               <Feather name="user" size={20} color="#000080" />
               <Text style={styles.sectionTitle}>Informações Pessoais</Text>
           </View>

           <View style={styles.avatarRow}>
              <Image source={{uri: avatarUrl || 'https://via.placeholder.com/150'}} style={styles.avatarImage} />
              <View style={{flex:1}}>
                  <Text style={styles.label}>URL do Avatar</Text>
                  <TextInput style={styles.inputSmall} value={avatarUrl} onChangeText={setAvatarUrl} placeholder="http://..." />
              </View>
           </View>

           <Text style={styles.label}>Nome Completo</Text>
           <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
           
           <View style={styles.rowInput}>
               <View style={{flex:1, marginRight:10}}>
                   <Text style={styles.label}>Localização</Text>
                   <TextInput style={styles.input} value={location} onChangeText={setLocation} />
               </View>
               <View style={{flex:1}}>
                   <Text style={styles.label}>LinkedIn</Text>
                   <TextInput style={styles.input} value={linkedinUrl} onChangeText={setLinkedinUrl} autoCapitalize="none" />
               </View>
           </View>

           <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:10, marginBottom: 5}}>
               <Text style={styles.label}>Biografia</Text>
               <TouchableOpacity style={styles.iaBadge} onPress={() => setBio(gerarBioLocalmente(fullName, skills.map(s=>s.name)))}>
                   <Feather name="cpu" color="#FFF" size={12}/>
                   <Text style={{color:'#FFF', fontWeight:'bold', fontSize:12, marginLeft:5}}>Gerar com IA</Text>
               </TouchableOpacity>
           </View>
           <TextInput style={[styles.input, {height:80, textAlignVertical:'top'}]} multiline value={bio} onChangeText={setBio} placeholder="Conte um pouco sobre suas experiências..." />

           <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={saving}>
               {saving ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>💾 Salvar Alterações</Text>}
           </TouchableOpacity>
        </View>

        {/* --- CARD 2: NOVA HABILIDADE --- */}
        <View style={styles.card}>
           <View style={styles.cardHeader}>
               <Feather name="plus-circle" size={20} color="#000080" />
               <Text style={styles.sectionTitle}>Adicionar Nova Habilidade</Text>
           </View>
           
           <TextInput style={styles.input} placeholder="Nome da Habilidade (Ex: Java, Marketing)" value={skillName} onChangeText={setSkillName} />
           
           <Text style={styles.label}>Categoria</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:15}}>
              {categoriasSQL.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.chip, selectedCategory === cat && styles.chipSelected]} onPress={() => setSelectedCategory(cat)}>
                    <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>{cat}</Text>
                  </TouchableOpacity>
              ))}
           </ScrollView>

           <Text style={styles.label}>Nível de Experiência</Text>
           <View style={styles.rowWrap}>
              {niveisSQL.map(lvl => (
                  <TouchableOpacity key={lvl} style={[styles.chip, selectedLevel === lvl && styles.chipSelected]} onPress={() => setSelectedLevel(lvl)}>
                    <Text style={[styles.chipText, selectedLevel === lvl && styles.chipTextSelected]}>{lvl}</Text>
                  </TouchableOpacity>
              ))}
           </View>
           
           <View style={styles.typeContainer}>
              <TouchableOpacity onPress={()=>setIsOffering(true)} style={[styles.typeOption, isOffering && {backgroundColor:'#E8F5E9', borderColor:'#4CAF50'}]}>
                  <Feather name={isOffering?"check-circle":"circle"} size={20} color={isOffering?"#4CAF50":"#CCC"} />
                  <Text style={{marginLeft:10, color: isOffering?'#2E7D32':'#555'}}>Quero Ensinar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setIsOffering(false)} style={[styles.typeOption, !isOffering && {backgroundColor:'#E3F2FD', borderColor:'#000080'}]}>
                  <Feather name={!isOffering?"check-circle":"circle"} size={20} color={!isOffering?"#000080":"#CCC"} />
                  <Text style={{marginLeft:10, color: !isOffering?'#1565C0':'#555'}}>Quero Aprender</Text>
              </TouchableOpacity>
           </View>

           <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}><Text style={styles.btnText}>+ Adicionar Habilidade</Text></TouchableOpacity>
        </View>
        
        {/* --- CARD 3: LISTA DE SKILLS --- */}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
               <Feather name="list" size={20} color="#000080" />
               <Text style={styles.sectionTitle}>Minhas Habilidades ({skills.length})</Text>
           </View>
            {skills.length === 0 && <Text style={{color:'#999', fontStyle:'italic'}}>Nenhuma habilidade cadastrada.</Text>}
            {skills.map(s => (
                <View key={s.id} style={styles.skillItem}>
                    <View>
                        <Text style={styles.skillName}>{s.name}</Text>
                        <Text style={styles.skillDetail}>{s.category} • {s.level}</Text>
                        <View style={[styles.badge, {backgroundColor: s.isOffering ? '#E8F5E9' : '#E3F2FD'}]}>
                            <Text style={{fontSize:10, fontWeight:'bold', color: s.isOffering ? '#2E7D32' : '#1565C0'}}>
                                {s.isOffering ? 'OFERECENDO' : 'BUSCANDO'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteSkill(s.id)} style={{padding:5}}>
                        <Feather name="trash-2" color="#EF5350" size={20}/>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}><Text style={{color:'#D32F2F', fontWeight:'bold'}}>Sair do App</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex:1, backgroundColor:'#D6EFFF'},
  header: {paddingTop:50, paddingBottom:15, paddingHorizontal:20, backgroundColor:'#FFF', borderBottomWidth:1, borderColor:'#EEE'},
  headerTitle: {fontSize:22, fontWeight:'bold', color:'#000080'},
  headerSubtitle: {fontSize:14, color:'#666'},
  scrollContent: {padding:20, paddingBottom:40},
  card: {backgroundColor:'#FFF', borderRadius:15, padding:20, marginBottom:20, elevation:2, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:5},
  cardHeader: {flexDirection:'row', alignItems:'center', gap:10, marginBottom:15},
  sectionTitle: {fontSize:16, fontWeight:'bold', color:'#333'},
  avatarRow: {flexDirection:'row', gap:15, alignItems:'center', marginBottom:15},
  avatarImage: {width:60, height:60, borderRadius:30, backgroundColor:'#EEE'},
  label: {fontSize:13, color:'#666', marginBottom:5, marginTop:5, fontWeight:'500'},
  input: {backgroundColor:'#F9F9F9', borderRadius:10, padding:12, borderWidth:1, borderColor:'#E0E0E0', fontSize:16, marginBottom:10},
  inputSmall: {backgroundColor:'#F9F9F9', borderRadius:10, padding:10, borderWidth:1, borderColor:'#E0E0E0', flex:1},
  rowInput: {flexDirection:'row'},
  iaBadge: {backgroundColor:'#7B1FA2', flexDirection:'row', alignItems:'center', paddingVertical:4, paddingHorizontal:10, borderRadius:15},
  saveButton: {backgroundColor:'#000080', padding:15, borderRadius:10, alignItems:'center', marginTop:10},
  addButton: {backgroundColor:'#000080', padding:12, borderRadius:8, alignItems:'center', marginTop:15},
  btnText: {color:'#FFF', fontWeight:'bold', fontSize:16},
  rowWrap: {flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:15},
  chip: {paddingVertical:6, paddingHorizontal:12, borderRadius:20, borderWidth:1, borderColor:'#CCC', backgroundColor:'#FFF'},
  chipSelected: {backgroundColor:'#000080', borderColor:'#000080'},
  chipText: {fontSize:12, color:'#666'},
  chipTextSelected: {color:'#FFF', fontWeight:'bold'},
  typeContainer: {gap:10},
  typeOption: {flexDirection:'row', alignItems:'center', padding:12, borderWidth:1, borderColor:'#EEE', borderRadius:10},
  skillItem: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderColor:'#F0F0F0'},
  skillName: {fontSize:16, fontWeight:'bold', color:'#333'},
  skillDetail: {fontSize:12, color:'#888', marginTop:2},
  badge: {alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:3, borderRadius:5, marginTop:5},
  logoutButton: {padding:15, alignItems:'center', backgroundColor:'#FFEBEE', borderRadius:10, marginBottom:20}
});