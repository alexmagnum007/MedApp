import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert, View, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { getDoctors, getMedicines, addAppointment } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Doctor, Medicine } from '../../types';
import dayjs from 'dayjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import DateInput from '../../components/DateInput';
import { useTranslation } from '../../i18n';

type Props = { navigation: NativeStackNavigationProp<any>; route: any };

export default function AddAppointmentScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const preselectedDoctor: Doctor | undefined = route.params?.doctor;
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState(preselectedDoctor?.id ?? '');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [time, setTime] = useState('08:00');
  const [notes, setNotes] = useState('');
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOptions();
  }, [user]);

  async function loadOptions() {
    if (!user) return;
    const [doctorsData, medicinesData] = await Promise.all([getDoctors(), getMedicines()]);
    setDoctors(doctorsData as Doctor[]);
    setMedicines(medicinesData as Medicine[]);
  }

  function toggleMedicine(id: string) {
    setSelectedMedicines((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function showAlert(title: string, message?: string) {
    if (Platform.OS === 'web') {
      window.alert(message ? `${title}\n${message}` : title);
    } else {
      Alert.alert(title, message);
    }
  }

  async function handleSave() {
    if (!selectedDoctor) return showAlert(t('appointments.selectDoctorAlert'));
    if (!date || !time) return showAlert(t('appointments.fillRequired'));
    setLoading(true);
    try {
      await addAppointment({
        doctorId: selectedDoctor,
        date: dayjs(`${date} ${time}`).toISOString(),
        ...(notes ? { notes } : {}),
        prescriptionIds: selectedMedicines,
      });
      navigation.goBack();
    } catch (e: any) {
      showAlert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="bodyMedium" style={styles.label}>{t('appointments.doctor')}</Text>
      <View style={styles.picker}>
        <Picker selectedValue={selectedDoctor} onValueChange={setSelectedDoctor}>
          <Picker.Item label={t('appointments.selectDoctor')} value="" />
          {doctors.map((d) => <Picker.Item key={d.id} label={`Dr(a). ${d.name} — ${d.specialty}`} value={d.id} />)}
        </Picker>
      </View>

      <DateInput label={t('appointments.date')} value={date} onChange={setDate} style={styles.input} />
      <TextInput label={t('appointments.time')} value={time} onChangeText={setTime} keyboardType="numeric" mode="outlined" style={styles.input} maxLength={5} />
      <TextInput label={t('common.observations')} value={notes} onChangeText={setNotes} mode="outlined"
        multiline numberOfLines={3} style={styles.input} />

      {medicines.length > 0 && (
        <>
          <Text variant="bodyMedium" style={styles.label}>{t('appointments.linkedMedicines')}</Text>
          {medicines.map((m) => (
            <Button
              key={m.id}
              mode={selectedMedicines.includes(m.id) ? 'contained' : 'outlined'}
              onPress={() => toggleMedicine(m.id)}
              style={styles.medButton}
              compact
            >
              {m.name} — {m.dosage}
            </Button>
          ))}
        </>
      )}

      <Button mode="contained" onPress={handleSave} loading={loading} style={styles.saveButton}>
        {t('appointments.saveAppointment')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  content: { padding: 16, paddingBottom: 40 },
  label: { color: '#475569', marginBottom: 4 },
  input: { marginBottom: 12 },
  picker: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, marginBottom: 12, backgroundColor: '#fff' },
  medButton: { marginBottom: 6 },
  saveButton: { marginTop: 16, backgroundColor: '#2563eb' },
});
