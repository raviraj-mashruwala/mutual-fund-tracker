// src/contexts/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Define all color themes
export const themes = {
  winterChill: {
    name: 'Winter Chill',
    primary: '#B8E3E9',
    primaryMedium: '#93B1B5',
    primaryDark: '#4F7C82',
    primaryDeepDark: '#0B2E33',
    background: '#F8FAFB',
    cardBg: '#FFFFFF',
    text: '#2C3E40',
    textSecondary: '#5A6D70',
    border: '#E8EDED',
    success: '#6BC4A6',
    danger: '#E57373',
    warning: '#FFB74D'
  },

  sunsetGlow: {
    name: 'Sunset Glow',
    primary: '#FEDCD2',
    primaryMedium: '#DF6951',
    primaryDark: '#E0563F',
    primaryDeepDark: '#8B3A2C',
    background: '#FFFAF5',
    cardBg: '#FFFFFF',
    text: '#2C1810',
    textSecondary: '#7D5A50',
    border: '#F5E6DD',
    success: '#6BC4A6',
    danger: '#D84A38',
    warning: '#FFA726'
  },

  oceanBlue: {
    name: 'Ocean Blue',
    primary: '#D1F4FF',
    primaryMedium: '#3F5F7F',
    primaryDark: '#2C4A6B',
    primaryDeepDark: '#1A2F47',
    background: '#F5F9FC',
    cardBg: '#FFFFFF',
    text: '#1E3A52',
    textSecondary: '#5B7A94',
    border: '#DDE8F0',
    success: '#4CAF50',
    danger: '#E57373',
    warning: '#FFB74D'
  },

  lavenderDream: {
    name: 'Lavender Dream',
    primary: '#E8DEF8',
    primaryMedium: '#A179C9',
    primaryDark: '#7B4FA3',
    primaryDeepDark: '#4A2E6B',
    background: '#F9F7FC',
    cardBg: '#FFFFFF',
    text: '#2D1B44',
    textSecondary: '#6B5580',
    border: '#E8E0F0',
    success: '#81C784',
    danger: '#E57373',
    warning: '#FFB74D'
  }
};

export const ThemeProvider = ({ children }) => {
  // Load saved theme from localStorage or default to winterChill
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('appTheme');
    return saved || 'winterChill';
  });

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('appTheme', currentTheme);
  }, [currentTheme]);

  const changeTheme = (themeName) => {
    setCurrentTheme(themeName);
  };

  const theme = themes[currentTheme];

  const value = {
    currentTheme,
    theme,
    themes,
    changeTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
