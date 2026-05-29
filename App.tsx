import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
// Initialize i18n (must be imported before any screen that uses useTranslation)
import './src/i18n';

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
