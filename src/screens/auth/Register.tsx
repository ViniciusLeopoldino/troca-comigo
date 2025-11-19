// Cole isso no Register.tsx e no Dashboard.tsx (mude apenas o Text)
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth } from '../../contexts/AuthContext'; // Apenas no Dashboard

export default function PlaceholderScreen() {
  // Se for o Dashboard, descomente a linha abaixo para testar o logout
  // const { signOut } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Tela em Construção</Text>
      {/* <Button title="Sair" onPress={signOut} /> */}
    </View>
  );
}