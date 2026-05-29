import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { I18nProvider } from './src/i18n';

export default function App() {
  return (
    <PaperProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </I18nProvider>
    </PaperProvider>
  );
}
