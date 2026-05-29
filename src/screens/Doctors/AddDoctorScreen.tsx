import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { addDoctor } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from '../../i18n';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function AddDoctorScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospital, setHospital] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    if (!name || !specialty || !hospital) { setError(t('doctors.fillRequired')); return; }
    setLoading(true);
    try {
      await addDoctor({ name, specialty, hospital, phone: phone || undefined });
      navigation.goBack();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput label={t('doctors.doctorName')} value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <TextInput label={t('doctors.specialty')} value={specialty} onChangeText={setSpecialty} mode="outlined" style={styles.input} />
      <TextInput label={t('doctors.hospitalClinic')} value={hospital} onChangeText={setHospital} mode="outlined" style={styles.input} />
      <TextInput label={t('doctors.phone')} value={phone} onChangeText={setPhone} mode="outlined"
        keyboardType="phone-pad" style={styles.input} />

      {error ? <HelperText type="error" visible>{error}</HelperText> : null}
      <Button mode="contained" onPress={handleSave} loading={loading} style={styles.saveButton}>
        {t('doctors.saveDoctor')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  content: { padding: 16 },
  input: { marginBottom: 12 },
  saveButton: { marginTop: 16, backgroundColor: '#2563eb' },
});
