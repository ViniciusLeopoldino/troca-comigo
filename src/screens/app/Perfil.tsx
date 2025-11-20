import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Alert, ActivityIndicator, Image, Platform 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker'; // <--- IMPORTAR
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { gerarBioLocalmente } from '../../services/fakeIA';
import { generateUUID } from '../../utils/uuid';
import { Habilidade } from '../../@types';

export default function Perfil() {
  const { user, signOut, updateUser } = useAuth();
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState('São Paulo, Brasil');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); 
  
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Skills
  const [skills, setSkills] = useState<Habilidade[]>([]);
  const [skillName, setSkillName] = useState('');
  const [isOffering, setIsOffering] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('INTERMEDIARIO');
  const [selectedCategory, setSelectedCategory] = useState('TECNOLOGIA');

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
      // Se não tiver foto, usa UI Avatars
      setAvatarUrl(u.avatarUrl || `https://ui-avatars.com/api/?name=${u.fullName}&background=0D8ABC&color=fff`);

      const skillRes = await api.get('/api/habilidades/me');
      setSkills(skillRes.data);
    } catch (error) { console.log("Erro load", error); } finally { setLoadingData(false); }
  }

  // --- FUNÇÃO PARA ESCOLHER IMAGEM ---
  const pickImage = async () => {
    // Pede permissão
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permissão necessária", "É preciso permitir acesso à galeria para mudar a foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Reduz qualidade para não ficar pesado
      base64: true, // Importante se for enviar como string base64 para API (se ela suportar)
    });

    if (!result.canceled) {
      // Se sua API aceita Base64, use: `data:image/jpeg;base64,${result.assets[0].base64}`
      // Se sua API aceita apenas URL pública, isso aqui só vai funcionar localmente no app
      // Como é um MVP, vamos usar o URI local para exibir.
      setAvatarUrl(result.assets[0].uri);
    }
  };

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const payload = {
        fullName, email, bio, location, linkedinUrl, 
        avatarUrl, // Envia a URI (se for web, precisaria upload real)
        timezone: "America/Sao_Paulo",
        timeCredits: user?.timeCredits || 10,
        userRole: user?.userRole || 'ADMIN'
      };
      await api.put('/api/users/me', payload);
      await updateUser(); 
      Alert.alert("Sucesso", "Perfil atualizado!");
    } catch (error) { Alert.alert("Erro", "Falha ao salvar perfil."); } finally { setSaving(false); }
  }

  // ... (handleAddSkill e handleDeleteSkill permanecem iguais) ...
  async function handleAddSkill() {
    if (!skillName.trim()) return Alert.alert("Erro", "Nome obrigatório");
    if (!user?.id) return Alert.alert("Erro", "Relogue no app");

    try {
      const novoId = generateUUID(); 
      const payload = {
        id: novoId, name: skillName, level: selectedLevel, category: selectedCategory, 
        description: `Habilidade de ${skillName}`, hourlyRate: 1, 
        isOffering: isOffering, isSeeking: !isOffering, 
        usuarioId: user.id, usuario: { id: user.id } 
      };
      await api.post('/api/habilidades', payload);
      Alert.alert("Sucesso", "Habilidade criada!");
      setSkillName(''); loadProfileData(); 
    } catch (error) { Alert.alert("Erro", "Falha ao criar habilidade."); }
  }

  async function handleDeleteSkill(id: string) {
    try { await api.delete(`/api/habilidades/${id}`); loadProfileData(); } catch (e) {}
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <Text style={styles.headerSubtitle}>Gerencie suas informações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
           <View style={styles.cardHeader}>
               <Feather name="user" size={20} color="#000080" />
               <Text style={styles.sectionTitle}>Informações Pessoais</Text>
           </View>

           {/* ÁREA DO AVATAR COM BOTÃO DE TROCAR */}
           <View style={styles.avatarRow}>
              <TouchableOpacity onPress={pickImage}>
                  <Image source={{uri: avatarUrl || 'https://via.placeholder.com/150'}} style={styles.avatarImage} />
                  <View style={styles.editIconBadge}>
                      <Feather name="camera" size={14} color="#FFF" />
                  </View>
              </TouchableOpacity>
              
              <View style={{flex:1}}>
                  <Text style={styles.label}>Foto de Perfil</Text>
                  <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                      <Text style={styles.uploadText}>Escolher da Galeria</Text>
                  </TouchableOpacity>
                  <Text style={{fontSize:10, color:'#999', marginTop:5}}>Toque na imagem ou botão</Text>
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
           <TextInput style={[styles.input, {height:80, textAlignVertical:'top'}]} multiline value={bio} onChangeText={setBio} />

           <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={saving}>
               {saving ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>💾 Salvar Alterações</Text>}
           </TouchableOpacity>
        </View>

        {/* CARD 2 e CARD 3 (Manter idênticos ao código anterior) */}
        <View style={styles.card}>
           <View style={styles.cardHeader}><Feather name="plus-circle" size={20} color="#000080" /><Text style={styles.sectionTitle}>Adicionar Nova Habilidade</Text></View>
           <TextInput style={styles.input} placeholder="Nome (Ex: Java)" value={skillName} onChangeText={setSkillName} />
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:10}}>{categoriasSQL.map(c=><TouchableOpacity key={c} style={[styles.chip,selectedCategory===c&&styles.chipSelected]} onPress={()=>setSelectedCategory(c)}><Text style={[styles.chipText,selectedCategory===c&&styles.chipTextSelected]}>{c}</Text></TouchableOpacity>)}</ScrollView>
           <View style={styles.rowWrap}>{niveisSQL.map(l=><TouchableOpacity key={l} style={[styles.chip,selectedLevel===l&&styles.chipSelected]} onPress={()=>setSelectedLevel(l)}><Text style={[styles.chipText,selectedLevel===l&&styles.chipTextSelected]}>{l}</Text></TouchableOpacity>)}</View>
           <View style={styles.typeContainer}>
               <TouchableOpacity onPress={()=>setIsOffering(true)} style={[styles.typeOption, isOffering&&{backgroundColor:'#E8F5E9',borderColor:'#4CAF50'}]}><Text style={{color:isOffering?'#2E7D32':'#555'}}>Ensinar</Text></TouchableOpacity>
               <TouchableOpacity onPress={()=>setIsOffering(false)} style={[styles.typeOption, !isOffering&&{backgroundColor:'#E3F2FD',borderColor:'#000080'}]}><Text style={{color:!isOffering?'#1565C0':'#555'}}>Aprender</Text></TouchableOpacity>
           </View>
           <TouchableOpacity style={styles.addButton} onPress={handleAddSkill}><Text style={styles.btnText}>+ Adicionar</Text></TouchableOpacity>
        </View>
        
        <View style={styles.card}>
             {skills.map(s => (
                 <View key={s.id} style={styles.skillItem}>
                     <Text>{s.name} ({s.level})</Text>
                     <TouchableOpacity onPress={()=>handleDeleteSkill(s.id)}><Feather name="trash-2" color="red" size={18}/></TouchableOpacity>
                 </View>
             ))}
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}><Text style={{color:'#D32F2F'}}>Sair</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (Mesmos estilos anteriores)
  container: {flex:1, backgroundColor:'#D6EFFF'},
  header: {paddingTop:50, paddingBottom:15, paddingHorizontal:20, backgroundColor:'#FFF', borderBottomWidth:1, borderColor:'#EEE'},
  headerTitle: {fontSize:22, fontWeight:'bold', color:'#000080'},
  headerSubtitle: {fontSize:14, color:'#666'},
  scrollContent: {padding:20, paddingBottom:40},
  card: {backgroundColor:'#FFF', borderRadius:15, padding:20, marginBottom:20, elevation:2},
  cardHeader: {flexDirection:'row', alignItems:'center', gap:10, marginBottom:15},
  sectionTitle: {fontSize:16, fontWeight:'bold', color:'#333'},
  
  // Estilos novos do Avatar
  avatarRow: {flexDirection:'row', gap:20, alignItems:'center', marginBottom:20},
  avatarImage: {width:80, height:80, borderRadius:40, backgroundColor:'#EEE'},
  editIconBadge: {position:'absolute', bottom:0, right:0, backgroundColor:'#000080', borderRadius:12, padding:4},
  uploadBtn: {backgroundColor:'#F0F0F0', padding:10, borderRadius:8, alignItems:'center', marginTop:5},
  uploadText: {color:'#333', fontWeight:'600', fontSize:12},

  label: {fontSize:13, color:'#666', marginBottom:5, marginTop:5, fontWeight:'500'},
  input: {backgroundColor:'#F9F9F9', borderRadius:10, padding:12, borderWidth:1, borderColor:'#E0E0E0', fontSize:16, marginBottom:10},
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
  typeContainer: {flexDirection:'row', gap:10},
  typeOption: {flex:1, alignItems:'center', padding:12, borderWidth:1, borderColor:'#EEE', borderRadius:10},
  skillItem: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderColor:'#F0F0F0'},
  skillName: {fontSize:16, fontWeight:'bold', color:'#333'},
  skillDetail: {fontSize:12, color:'#888', marginTop:2},
  badge: {alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:3, borderRadius:5, marginTop:5},
  logoutButton: {padding:15, alignItems:'center', backgroundColor:'#FFEBEE', borderRadius:10, marginBottom:20}
});