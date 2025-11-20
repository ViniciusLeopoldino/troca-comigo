import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext'; // Importe o ThemeProvider
import Routes from './src/routes';
import { View } from 'react-native';

// Componente auxiliar para controlar a StatusBar baseada no tema
function AppContent() {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
      <Routes />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <ThemeProvider> 
           <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}