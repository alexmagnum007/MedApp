import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Switch } from 'react-native-paper';
import { getDiseases, getDoctors, addMedicine } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { uploadImage } from '../../services/storage';
import { scheduleMedicineReminders, requestNotificationPermission } from '../../services/notifications';
import * as ImagePicker from 'expo-image-picker';
import { Medicine, Disease, Doctor } from '../../types';
import dayjs from 'dayjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import DateInput from '../../components/DateInput';
import { useTranslation } from '../../i18n';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function AddMedicineScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('8');
  const [startTime, setStartTime] = useState(dayjs().format('HH:mm'));
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:59');
  const [notes, setNotes] = useState('');
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDisease, setSelectedDisease] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOptions();
    requestNotificationPermission();
  }, [user]);

  async function loadOptions() {
    if (!user) return;
    const [diseasesData, doctorsData] = await Promise.all([getDiseases(), getDoctors()]);
    setDiseases(diseasesData as Disease[]);
    setDoctors(doctorsData as Doctor[]);
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) setPrescriptionImage(result.assets[0].uri);
  }

  async function handleSave() {
    setError('');
    console.log('[handleSave] chamado | user:', user?.uid ?? 'NULL', '| name:', name, '| dosage:', dosage);
    if (!name || !dosage || !frequency || !startTime || !startDate) {
      setError(t('medicines.fillRequired'));
      return;
    }
    if (!user) {
      setError(t('medicines.notAuthenticated'));
      return;
    }
    setLoading(true);
    try {
      let prescriptionImageUrl: string | undefined;
      if (prescriptionImage) {
        try {
          prescriptionImageUrl = await uploadImage(
            prescriptionImage,
            `prescriptions/${user!.uid}/${Date.now()}.jpg`
          );
        } catch (uploadErr: any) {
          console.warn('[AddMedicine] Upload de imagem falhou:', uploadErr.message);
          setError(t('medicines.uploadError'));
        }
      }

      const startISO = dayjs(`${startDate} ${startTime}`).toISOString();
      console.log('[AddMedicine] Salvando para userId:', user!.uid);

      const medicineData: Record<string, any> = {
        name,
        dosage,
        frequency: Number(frequency),
        startTime: startISO,
        startDate,
      };
      if (endDate) medicineData.endDate = dayjs(`${endDate} ${endTime}`).toISOString();
      if (prescriptionImageUrl) medicineData.prescriptionImageUrl = prescriptionImageUrl;
      if (selectedDisease) medicineData.diseaseId = selectedDisease;
      if (selectedDoctor) medicineData.doctorId = selectedDoctor;
      if (notes) medicineData.notes = notes;

      const saved = await addMedicine(medicineData);
      navigation.goBack();
      scheduleMedicineReminders({ id: saved.id, ...(saved as Omit<Medicine, 'id'>) }).catch(() => {});
    } catch (e: any) {
      console.error('Erro ao salvar remédio:', e);
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <Text variant="titleMedium" style={styles.section}>{t('medicines.medicineInfo')}</Text>

      <TextInput label={t('medicines.medicineName')} value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <TextInput label={t('medicines.dosage')} value={dosage} onChangeText={setDosage} mode="outlined" style={styles.input} />

      <Text variant="bodyMedium" style={styles.label}>{t('medicines.frequency')}</Text>
      <SegmentedButtons
        value={frequency}
        onValueChange={setFrequency}
        buttons={[
          { value: '4', label: '4h' },
          { value: '6', label: '6h' },
          { value: '8', label: '8h' },
          { value: '12', label: '12h' },
          { value: '24', label: '24h' },
        ]}
        style={styles.segmented}
      />

      <DateInput label={t('medicines.startDate')} value={startDate} onChange={setStartDate} style={styles.input} />
      <TextInput label={t('medicines.startTime')} value={startTime} onChangeText={setStartTime} keyboardType="numeric" mode="outlined" style={styles.input} maxLength={5} />
      <DateInput label={t('medicines.endDate')} value={endDate} onChange={setEndDate} style={styles.input} />
      <TextInput label={t('medicines.endTime')} value={endTime} onChangeText={setEndTime} keyboardType="numeric" mode="outlined" style={styles.input} maxLength={5} />

      <Text variant="titleMedium" style={styles.section}>{t('medicines.prescription')}</Text>
      <Button mode="outlined" onPress={pickImage} icon="camera" style={styles.imageButton}>
        {prescriptionImage ? t('medicines.changePrescriptionPhoto') : t('medicines.addPrescriptionPhoto')}
      </Button>
      {prescriptionImage && (
        <Image source={{ uri: prescriptionImage }} style={styles.preview} resizeMode="cover" />
      )}

      <Text variant="titleMedium" style={styles.section}>{t('medicines.links')}</Text>

      {diseases.length > 0 && (
        <>
          <Text variant="bodyMedium" style={styles.label}>{t('medicines.relatedDisease')}</Text>
          <View style={styles.picker}>
            <Picker selectedValue={selectedDisease} onValueChange={setSelectedDisease}>
              <Picker.Item label={t('common.none_f')} value="" />
              {diseases.map((d) => <Picker.Item key={d.id} label={d.name} value={d.id} />)}
            </Picker>
          </View>
        </>
      )}

      {doctors.length > 0 && (
        <>
          <Text variant="bodyMedium" style={styles.label}>{t('medicines.responsibleDoctor')}</Text>
          <View style={styles.picker}>
            <Picker selectedValue={selectedDoctor} onValueChange={setSelectedDoctor}>
              <Picker.Item label={t('common.none')} value="" />
              {doctors.map((d) => <Picker.Item key={d.id} label={`Dr(a). ${d.name}`} value={d.id} />)}
            </Picker>
          </View>
        </>
      )}

      <TextInput label={t('common.observations')} value={notes} onChangeText={setNotes} mode="outlined"
        multiline numberOfLines={3} style={styles.input} />

      <Button mode="contained" onPress={handleSave} loading={loading} style={styles.saveButton}>
        {t('medicines.saveMedicine')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  content: { padding: 16, paddingBottom: 40 },
  section: { fontWeight: 'bold', color: '#2563eb', marginTop: 16, marginBottom: 8 },
  label: { color: '#475569', marginBottom: 4 },
  input: { marginBottom: 12 },
  segmented: { marginBottom: 12 },
  imageButton: { marginBottom: 12 },
  preview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  picker: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, marginBottom: 12, backgroundColor: '#fff' },
  saveButton: { marginTop: 16, backgroundColor: '#2563eb' },
  errorText: { color: '#ef4444', marginBottom: 8, textAlign: 'center' },
});
