import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from '../../i18n';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    setError('');
    if (!name || !email || !password) { setError(t('common.fillAllFields')); return; }
    if (password.length < 6) { setError(t('auth.passwordMinLength')); return; }
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Surface style={styles.card} elevation={4}>
        <Text variant="headlineMedium" style={styles.title}>{t('auth.createAccount')}</Text>

        <TextInput label={t('auth.nameLabel')} value={name} onChangeText={setName} style={styles.input} mode="outlined" />
        <TextInput label={t('auth.emailLabel')} value={email} onChangeText={setEmail} keyboardType="email-address"
          autoCapitalize="none" style={styles.input} mode="outlined" />
        <TextInput label={t('auth.passwordLabel')} value={password} onChangeText={setPassword} secureTextEntry
          style={styles.input} mode="outlined" />

        {error ? <HelperText type="error" visible>{error}</HelperText> : null}

        <Button mode="contained" onPress={handleRegister} loading={loading} style={styles.button}>
          {t('auth.register')}
        </Button>
        <Button mode="text" onPress={() => navigation.goBack()}>
          {t('auth.alreadyHaveAccount')}
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f0f4ff' },
  card: { padding: 24, borderRadius: 16 },
  title: { textAlign: 'center', fontWeight: 'bold', color: '#2563eb', marginBottom: 24 },
  input: { marginBottom: 12 },
  button: { marginTop: 8, marginBottom: 8 },
});
