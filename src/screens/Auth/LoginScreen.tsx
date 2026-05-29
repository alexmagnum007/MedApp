import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!email || !password) { setError(t('common.fillAllFields')); return; }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Surface style={styles.card} elevation={4}>
        <Text variant="headlineMedium" style={styles.title}>MedApp</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>{t('auth.subtitle')}</Text>

        <TextInput label={t('auth.emailLabel')} value={email} onChangeText={setEmail} keyboardType="email-address"
          autoCapitalize="none" style={styles.input} mode="outlined" />
        <TextInput label={t('auth.passwordLabel')} value={password} onChangeText={setPassword} secureTextEntry
          style={styles.input} mode="outlined" />

        {error ? <HelperText type="error" visible>{error}</HelperText> : null}
        <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.button}>
          {t('auth.login')}
        </Button>
        <Button mode="text" onPress={() => navigation.navigate('Register')}>
          {t('auth.createAccount')}
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f0f4ff' },
  card: { padding: 24, borderRadius: 16 },
  title: { textAlign: 'center', fontWeight: 'bold', color: '#2563eb' },
  subtitle: { textAlign: 'center', marginBottom: 24, color: '#64748b' },
  input: { marginBottom: 12 },
  button: { marginTop: 8, marginBottom: 8 },
});
