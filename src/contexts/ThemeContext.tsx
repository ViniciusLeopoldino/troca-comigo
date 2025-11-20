import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definição das Cores
export const lightTheme = {
  name: 'light',
  colors: {
    background: '#D6EFFF',
    card: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    primary: '#000080',
    secondary: '#4CAF50',
    inputBg: '#F5F5F5',
    border: '#E0E0E0',
    icon: '#555555',
    danger: '#D32F2F',
    tabBar: '#FFFFFF',
  }
};

export const darkTheme = {
  name: 'dark',
  colors: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    primary: '#90CAF9', // Azul mais claro para contraste no escuro
    secondary: '#81C784', // Verde mais claro
    inputBg: '#2C2C2C',
    border: '#333333',
    icon: '#DDDDDD',
    danger: '#EF9A9A',
    tabBar: '#1E1E1E',
  }
};

interface ThemeContextData {
  theme: typeof lightTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    const savedTheme = await AsyncStorage.getItem('@user_theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(deviceTheme === 'dark');
    }
  }

  async function toggleTheme() {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem('@user_theme', newMode ? 'dark' : 'light');
  }

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}