import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Chip } from 'react-native-paper';
import { getDoctors, addDisease } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { uploadImage } from '../../services/storage';
import * as ImagePicker from 'expo-image-picker';
import { Doctor } from '../../types';
import { Picker } from '@react-native-picker/picker';
import dayjs from 'dayjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateInput from '../../components/DateInput';
import { useTranslation } from '../../i18n';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function AddDiseaseScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [diagnosedAt, setDiagnosedAt] = useState(dayjs().format('YYYY-MM-DD'));
  const [symptomInput, setSymptomInput] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoctors().then((data) => setDoctors(data as Doctor[]));
  }, [user]);

  function addSymptom() {
    const s = symptomInput.trim();
    if (s && !symptoms.includes(s)) {
      setSymptoms([...symptoms, s]);
      setSymptomInput('');
    }
  }

  function removeSymptom(symptom: string) {
    setSymptoms(symptoms.filter((s) => s !== symptom));
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  }

  function removeImage(uri: string) {
    setImages((prev) => prev.filter((i) => i !== uri));
  }

  function showAlert(msg: string) {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert(msg);
  }

  async function handleSave() {
    if (!name || !diagnosedAt) return showAlert(t('common.fillRequired'));
    setLoading(true);
    try {
      const imageUrls = await Promise.all(
        images.map((uri, i) => uploadImage(uri, `diseases/${user!.uid}/${Date.now()}_${i}.jpg`))
      );
      await addDisease({
        name,
        symptoms,
        diagnosedAt,
        ...(selectedDoctor ? { doctorId: selectedDoctor } : {}),
        ...(imageUrls.length > 0 ? { imageUrls } : {}),
        notes: notes || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      showAlert(t('common.error') + ': ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput label={t('diseases.diseaseName')} value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <DateInput label={t('diseases.diagnosedAt')} value={diagnosedAt} onChange={setDiagnosedAt} style={styles.input} />

      {doctors.length > 0 && (
        <>
          <Text variant="bodyMedium" style={styles.label}>{t('diseases.responsibleDoctor')}</Text>
          <View style={styles.picker}>
            <Picker selectedValue={selectedDoctor} onValueChange={setSelectedDoctor}>
              <Picker.Item label={t('common.none')} value="" />
              {doctors.map((d) => (
                <Picker.Item key={d.id} label={`Dr(a). ${d.name} — ${d.specialty}`} value={d.id} />
              ))}
            </Picker>
          </View>
        </>
      )}

      <Text variant="bodyMedium" style={styles.label}>{t('diseases.symptoms')}</Text>
      <View style={styles.symptomRow}>
        <TextInput
          label={t('diseases.addSymptom')}
          value={symptomInput}
          onChangeText={setSymptomInput}
          mode="outlined"
          style={styles.symptomInput}
          onSubmitEditing={addSymptom}
        />
        <Button mode="contained" onPress={addSymptom} style={styles.addBtn}>+</Button>
      </View>
      <View style={styles.chips}>
        {symptoms.map((s) => (
          <Chip key={s} onClose={() => removeSymptom(s)} style={styles.chip}>{s}</Chip>
        ))}
      </View>

      <Button mode="outlined" onPress={pickImage} icon="camera" style={styles.imageButton}>
        {images.length > 0 ? t('diseases.addMorePhotos') : t('diseases.addPhotos')}
      </Button>
      {images.map((uri, i) => (
        <View key={i} style={styles.previewWrapper}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(uri)}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TextInput label={t('common.observations')} value={notes} onChangeText={setNotes} mode="outlined"
        multiline numberOfLines={4} style={styles.input} />

      <Button mode="contained" onPress={handleSave} loading={loading} style={styles.saveButton}>
        {t('diseases.saveDisease')}
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
  symptomRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  symptomInput: { flex: 1 },
  addBtn: { alignSelf: 'center', backgroundColor: '#2563eb' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: { backgroundColor: '#fef3c7' },
  imageButton: { marginBottom: 12 },
  previewWrapper: { position: 'relative', marginBottom: 12 },
  preview: { width: '100%', height: 200, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  saveButton: { marginTop: 16, backgroundColor: '#2563eb' },
});
