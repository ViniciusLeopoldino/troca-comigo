import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

// Importando as telas
import Dashboard from '../screens/app/Dashboard';
import Marketplace from '../screens/app/Marketplace';
import Sessoes from '../screens/app/Sessoes';
import IAMatchmaking from '../screens/app/IAMatchmaking';
import Perfil from '../screens/app/Perfil';
import Sobre from '../screens/app/Sobre';

const Tab = createBottomTabNavigator();

export default function AppRoutes() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Esconde o cabeçalho padrão (nós criamos os nossos nas telas)
        tabBarActiveTintColor: '#000080', // Azul quando selecionado
        tabBarInactiveTintColor: '#999',  // Cinza quando não selecionado
        tabBarStyle: { 
          backgroundColor: '#FFF', 
          height: 60, 
          paddingBottom: 10,
          paddingTop: 10
        }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={Dashboard} 
        options={{
          tabBarIcon: ({ size, color }) => <Feather name="home" size={size} color={color} />
        }}
      />
      
      <Tab.Screen 
        name="Buscar" 
        component={Marketplace} 
        options={{
          tabBarIcon: ({ size, color }) => <Feather name="search" size={size} color={color} />
        }}
      />

      <Tab.Screen 
        name="IA Match" 
        component={IAMatchmaking} 
        options={{
          tabBarLabel: 'IA',
          tabBarIcon: ({ size, color }) => <Feather name="cpu" size={size} color={color} />
        }}
      />

      <Tab.Screen 
        name="Sessões" 
        component={Sessoes} 
        options={{
          tabBarIcon: ({ size, color }) => <Feather name="calendar" size={size} color={color} />
        }}
      />

      <Tab.Screen 
        name="Perfil" 
        component={Perfil} 
        options={{
          tabBarIcon: ({ size, color }) => <Feather name="user" size={size} color={color} />
        }}
      />

      <Tab.Screen 
        name="Sobre" 
        component={Sobre} 
        options={{
          tabBarIcon: ({ size, color }) => <Feather name="info" size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}