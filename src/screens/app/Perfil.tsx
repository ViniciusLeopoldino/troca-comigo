import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Alert, ActivityIndicator, Image, Switch 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext'; // <--- NOVO IMPORT
import api from '../../services/api';
import { gerarBioLocalmente } from '../../services/fakeIA';
import { generateUUID } from '../../utils/uuid';
import { Habilidade } from '../../@types';

export default function Perfil() {
  const { user, signOut, updateUser } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme(); // <--- USANDO O TEMA
  const colors = theme.colors; // Atalho para as cores

  // --- DADOS ---
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState('São Paulo, Brasil');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); 
  
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // --- HABILIDADES ---
  const [skills, setSkills] = useState<Habilidade[]>([]);
  const [skillName, setSkillName] = useState('');
  const [isOffering, setIsOffering] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('INTERMEDIARIO');
  const [selectedCategory, setSelectedCategory] = useState('TECNOLOGIA');

  const niveisSQL = ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO', 'EXPERT'];
  const categoriasSQL = ['TECNOLOGIA', 'DESIGN', 'NEGOCIOS', 'IDIOMAS', 'MARKETING', 'DADOS'];

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
      setAvatarUrl(u.avatarUrl || '');

      const skillRes = await api.get('/api/habilidades/me');
      setSkills(skillRes.data);
    } catch (error) { console.log("Erro load", error); } finally { setLoadingData(false); }
  }

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permissão necessária", "É preciso permitir acesso à galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!result.canceled) setAvatarUrl(result.assets[0].uri);
  };

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const payload = {
        fullName, email, bio, location, linkedinUrl, avatarUrl,
        timezone: "America/Sao_Paulo", timeCredits: user?.timeCredits || 10, userRole: 'ADMIN'
      };
      await api.put('/api/users/me', payload);
      await updateUser(); 
      Alert.alert("Sucesso", "Perfil atualizado!");
    } catch (error) { Alert.alert("Erro", "Falha ao salvar perfil."); } finally { setSaving(false); }
  }

  async function handleAddSkill() {
    if (!skillName.trim()) return Alert.alert("Erro", "Nome obrigatório");
    try {
      const novoId = generateUUID(); 
      const payload = {
        id: novoId, name: skillName, level: selectedLevel, category: selectedCategory, 
        description: `Skill ${skillName}`, hourlyRate: 1, 
        isOffering: isOffering, isSeeking: !isOffering, 
        usuarioId: user?.id, usuario: { id: user?.id } 
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
    <View style={[styles.container, {backgroundColor: colors.background}]}> 
      <View style={[styles.header, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[styles.headerTitle, {color: colors.primary}]}>Meu Perfil</Text>
          <Text style={[styles.headerSubtitle, {color: colors.textSecondary}]}>Gerencie suas informações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- CARD 0: TEMA --- */}
        <View style={[styles.card, {backgroundColor: colors.card}]}>
             <View style={styles.rowBetween}>
                 <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                     <Feather name={isDarkMode ? "moon" : "sun"} size={20} color={colors.primary} />
                     <Text style={[styles.label, {color: colors.text, marginTop:0, marginBottom:0}]}>Modo Escuro</Text>
                 </View>
                 <Switch 
                    value={isDarkMode} 
                    onValueChange={toggleTheme}
                    trackColor={{false: '#767577', true: colors.primary}}
                    thumbColor={'#f4f3f4'}
                 />
             </View>
        </View>

        {/* --- CARD 1: INFORMAÇÕES PESSOAIS --- */}
        <View style={[styles.card, {backgroundColor: colors.card}]}>
           <View style={styles.cardHeader}>
               <Feather name="user" size={20} color={colors.primary} />
               <Text style={[styles.sectionTitle, {color: colors.text}]}>Informações Pessoais</Text>
           </View>

           <View style={styles.avatarRow}>
              <TouchableOpacity onPress={pickImage}>
                  <Image source={{uri: avatarUrl || 'https://via.placeholder.com/150'}} style={styles.avatarImage} />
                  <View style={[styles.editIconBadge, {backgroundColor: colors.primary}]}>
                      <Feather name="camera" size={14} color="#FFF" />
                  </View>
              </TouchableOpacity>
              <View style={{flex:1}}>
                  <Text style={[styles.label, {color: colors.textSecondary}]}>URL do Avatar</Text>
                  <TextInput 
                    style={[styles.inputSmall, {backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text}]} 
                    value={avatarUrl} 
                    onChangeText={setAvatarUrl} 
                    placeholderTextColor="#999"
                    placeholder="http://..." 
                  />
              </View>
           </View>

           <Text style={[styles.label, {color: colors.textSecondary}]}>Nome Completo</Text>
           <TextInput 
             style={[styles.input, {backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text}]} 
             value={fullName} 
             onChangeText={setFullName}
             placeholderTextColor="#999"
           />
           
           <View style={styles.rowInput}>
               <View style={{flex:1, marginRight:10}}>
                   <Text style={[styles.label, {color: colors.textSecondary}]}>Localização</Text>
                   <TextInput 
                     style={[styles.input, {backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text}]} 
                     value={location} 
                     onChangeText={setLocation} 
                     placeholderTextColor="#999"
                   />
               </View>
               <View style={{flex:1}}>
                   <Text style={[styles.label, {color: colors.textSecondary}]}>LinkedIn</Text>
                   <TextInput 
                     style={[styles.input, {backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text}]} 
                     value={linkedinUrl} 
                     onChangeText={setLinkedinUrl} 
                     placeholderTextColor="#999"
                     autoCapitalize="none" 
                   />
               </View>
           </View>

           <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:10, marginBottom: 5}}>
               <Text style={[styles.label, {color: colors.textSecondary}]}>Biografia</Text>
               <TouchableOpacity style={styles.iaBadge} onPress={() => setBio(gerarBioLocalmente(fullName, skills.map(s=>s.name)))}>
                   <Feather name="cpu" color="#FFF" size={12}/>
                   <Text style={{color:'#FFF', fontWeight:'bold', fontSize:12, marginLeft:5}}>Gerar com IA</Text>
               </TouchableOpacity>
           </View>
           <TextInput 
             style={[styles.input, {backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, height:80, textAlignVertical:'top'}]} 
             multiline value={bio} onChangeText={setBio} 
             placeholder="Conte um pouco sobre suas experiências..." 
             placeholderTextColor="#999"
           />

           <TouchableOpacity style={[styles.saveButton, {backgroundColor: colors.primary}]} onPress={handleSaveProfile} disabled={saving}>
               {saving ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Salvar Alterações</Text>}
           </TouchableOpacity>
        </View>

        {/* --- CARD 2: NOVA HABILIDADE --- */}
        <View style={[styles.card, {backgroundColor: colors.card}]}>
           <View style={styles.cardHeader}>
               <Feather name="plus-circle" size={20} color={colors.primary} />
               <Text style={[styles.sectionTitle, {color: colors.text}]}>Adicionar Nova Habilidade</Text>
           </View>
           
           <TextInput 
             style={[styles.input, {backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text}]} 
             placeholder="Nome da Habilidade (Ex: Java)" 
             placeholderTextColor="#999"
             value={skillName} 
             onChangeText={setSkillName} 
           />
           
           <Text style={[styles.label, {color: colors.textSecondary}]}>Categoria</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:15}}>
              {categoriasSQL.map(cat => (
                  <TouchableOpacity key={cat} 
                    style={[styles.chip, {borderColor: colors.border, backgroundColor: colors.inputBg}, selectedCategory === cat && {backgroundColor: colors.primary, borderColor: colors.primary}]} 
                    onPress={() => setSelectedCategory(cat)}>
                    <Text style={[styles.chipText, {color: colors.textSecondary}, selectedCategory === cat && {color: '#FFF', fontWeight:'bold'}]}>{cat}</Text>
                  </TouchableOpacity>
              ))}
           </ScrollView>

           <Text style={[styles.label, {color: colors.textSecondary}]}>Nível</Text>
           <View style={styles.rowWrap}>
              {niveisSQL.map(lvl => (
                  <TouchableOpacity key={lvl} 
                    style={[styles.chip, {borderColor: colors.border, backgroundColor: colors.inputBg}, selectedLevel === lvl && {backgroundColor: colors.primary, borderColor: colors.primary}]} 
                    onPress={() => setSelectedLevel(lvl)}>
                    <Text style={[styles.chipText, {color: colors.textSecondary}, selectedLevel === lvl && {color: '#FFF', fontWeight:'bold'}]}>{lvl}</Text>
                  </TouchableOpacity>
              ))}
           </View>
           
           <View style={styles.typeContainer}>
              <TouchableOpacity onPress={()=>setIsOffering(true)} style={[styles.typeOption, {borderColor: colors.border}, isOffering && {backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9', borderColor:'#4CAF50'}]}>
                  <Feather name={isOffering?"check-circle":"circle"} size={20} color={isOffering?"#4CAF50":colors.icon} />
                  <Text style={{marginLeft:10, color: isOffering ? (isDarkMode ? '#A5D6A7' : '#2E7D32') : colors.textSecondary}}>Ensinar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setIsOffering(false)} style={[styles.typeOption, {borderColor: colors.border}, !isOffering && {backgroundColor: isDarkMode ? '#0D47A1' : '#E3F2FD', borderColor: colors.primary}]}>
                  <Feather name={!isOffering?"check-circle":"circle"} size={20} color={!isOffering? colors.primary : colors.icon} />
                  <Text style={{marginLeft:10, color: !isOffering ? (isDarkMode ? '#90CAF9' : '#1565C0') : colors.textSecondary}}>Aprender</Text>
              </TouchableOpacity>
           </View>

           <TouchableOpacity style={[styles.addButton, {backgroundColor: colors.secondary}]} onPress={handleAddSkill}><Text style={styles.btnText}>+ Adicionar Habilidade</Text></TouchableOpacity>
        </View>
        
        {/* --- CARD 3: LISTA --- */}
        <View style={[styles.card, {backgroundColor: colors.card}]}>
            <View style={styles.cardHeader}>
               <Feather name="list" size={20} color={colors.primary} />
               <Text style={[styles.sectionTitle, {color: colors.text}]}>Minhas Habilidades ({skills.length})</Text>
           </View>
            {skills.length === 0 && <Text style={{color: colors.textSecondary, fontStyle:'italic'}}>Nenhuma habilidade.</Text>}
            {skills.map(s => (
                <View key={s.id} style={[styles.skillItem, {borderBottomColor: colors.border}]}>
                    <View>
                        <Text style={[styles.skillName, {color: colors.text}]}>{s.name}</Text>
                        <Text style={[styles.skillDetail, {color: colors.textSecondary}]}>{s.category} • {s.level}</Text>
                        <View style={[styles.badge, {backgroundColor: s.isOffering ? (isDarkMode ? '#1B5E20' : '#E8F5E9') : (isDarkMode ? '#0D47A1' : '#E3F2FD')}]}>
                            <Text style={{fontSize:10, fontWeight:'bold', color: s.isOffering ? (isDarkMode ? '#A5D6A7' : '#2E7D32') : (isDarkMode ? '#90CAF9' : '#1565C0')}}>
                                {s.isOffering ? 'OFERECENDO' : 'BUSCANDO'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteSkill(s.id)} style={{padding:5}}>
                        <Feather name="trash-2" color={colors.danger} size={20}/>
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
  container: {flex:1},
  header: {paddingTop:50, paddingBottom:15, paddingHorizontal:20, borderBottomWidth:1},
  headerTitle: {fontSize:22, fontWeight:'bold'},
  headerSubtitle: {fontSize:14},
  scrollContent: {padding:20, paddingBottom:40},
  card: {borderRadius:15, padding:20, marginBottom:20, elevation:2},
  cardHeader: {flexDirection:'row', alignItems:'center', gap:10, marginBottom:15},
  sectionTitle: {fontSize:16, fontWeight:'bold'},
  rowBetween: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  
  avatarRow: {flexDirection:'row', gap:20, alignItems:'center', marginBottom:20},
  avatarImage: {width:80, height:80, borderRadius:40, backgroundColor:'#EEE'},
  editIconBadge: {position:'absolute', bottom:0, right:0, borderRadius:12, padding:4},
  uploadBtn: {padding:10, borderRadius:8, alignItems:'center', marginTop:5},
  uploadText: {fontWeight:'600', fontSize:12},

  label: {fontSize:13, marginBottom:5, marginTop:5, fontWeight:'500'},
  input: {borderRadius:10, padding:12, borderWidth:1, fontSize:16, marginBottom:10},
  inputSmall: {borderRadius:10, padding:10, borderWidth:1, flex:1},
  rowInput: {flexDirection:'row'},
  iaBadge: {backgroundColor:'#7B1FA2', flexDirection:'row', alignItems:'center', paddingVertical:4, paddingHorizontal:10, borderRadius:15},
  saveButton: {padding:15, borderRadius:10, alignItems:'center', marginTop:10},
  addButton: {padding:12, borderRadius:8, alignItems:'center', marginTop:15},
  btnText: {color:'#FFF', fontWeight:'bold', fontSize:16},
  rowWrap: {flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:15},
  chip: {paddingVertical:6, paddingHorizontal:12, borderRadius:20, borderWidth:1},
  chipText: {fontSize:12},
  typeContainer: {flexDirection:'row', gap:10},
  typeOption: {flex:1, flexDirection:'row', alignItems:'center', padding:12, borderWidth:1, borderRadius:10},
  skillItem: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12, borderBottomWidth:1},
  skillName: {fontSize:16, fontWeight:'bold'},
  skillDetail: {fontSize:12, marginTop:2},
  badge: {alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:3, borderRadius:5, marginTop:5},
  logoutButton: {padding:15, alignItems:'center', backgroundColor:'#FFEBEE', borderRadius:10, marginBottom:20}
});