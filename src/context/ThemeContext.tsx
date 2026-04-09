import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

interface ThemeContextData {
  themeMode: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useDeviceColorScheme() || 'light';
  const [themeMode, setThemeMode] = useState<ThemeType>('light');

  useEffect(() => {
    AsyncStorage.getItem('@nutryon_theme').then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setThemeMode(stored);
      } else {
        setThemeMode(deviceTheme);
      }
    });
  }, [deviceTheme]);

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    await AsyncStorage.setItem('@nutryon_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
