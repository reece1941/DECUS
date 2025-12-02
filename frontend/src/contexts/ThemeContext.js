import React, { createContext, useState, useContext, useEffect } from 'react';
import { themeAPI } from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const { data } = await themeAPI.get();
      setTheme(data);
      applyTheme(data);
    } catch (error) {
      console.error('Failed to fetch theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (themeData) => {
    if (!themeData) return;

    const root = document.documentElement;
    
    // Apply colors as CSS variables
    Object.entries(themeData).forEach(([key, value]) => {
      if (typeof value === 'string' && !key.startsWith('anim_')) {
        root.style.setProperty(`--theme-${key}`, value);
      }
    });
  };

  const updateTheme = async (newTheme) => {
    try {
      await themeAPI.update(newTheme);
      await fetchTheme();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to update theme' };
    }
  };

  const value = {
    theme,
    loading,
    updateTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
