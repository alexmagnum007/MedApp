import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Image, View, TouchableOpacity, Modal } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { getDoctors, addDoctor, addExam } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { uploadImage } from '../../services/storage';
import * as ImagePicker from 'expo-image-picker';
import { Doctor } from '../../types';
import dayjs from 'dayjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import DateInput from '../../components/DateInput';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../i18n';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function AddExamScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');

  const [newDoctorModal, setNewDoctorModal] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');
  const [newDoctorHospital, setNewDoctorHospital] = useState('');
  const [savingDoctor, setSavingDoctor] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, [user?.uid]);

  async function loadDoctors() {
    if (!user) return;
    const data = await getDoctors();
    setDoctors(data as Doctor[]);
  }

  async function handleAddDoctor() {
    setModalError('');
    if (!newDoctorName.trim()) { setModalError(t('exams.newDoctorModal.fillName')); return; }
    setSavingDoctor(true);
    try {
      const newDoctor = await addDoctor({
        name: newDoctorName.trim(),
        specialty: newDoctorSpecialty.trim() || t('exams.notInformed'),
        hospital: newDoctorHospital.trim() || t('exams.notInformed'),
      }) as Doctor;
      setDoctors((prev) => [...prev, newDoctor]);
      setSelectedDoctor(newDoctor.id);
      setNewDoctorModal(false);
      setNewDoctorName('');
      setNewDoctorSpecialty('');
      setNewDoctorHospital('');
    } catch (e: any) {
      setModalError(e.message);
    } finally {
      setSavingDoctor(false);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris]);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setError('');
    if (!name || !date) { setError(t('exams.fillRequired')); return; }
    setLoading(true);
    try {
      const imageUrls: string[] = [];
      for (const uri of images) {
        const url = await uploadImage(uri, `exams/${user!.uid}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
        imageUrls.push(url);
      }
      await addExam({
        name,
        date,
        ...(selectedDoctor ? { doctorId: selectedDoctor } : {}),
        ...(imageUrls.length > 0 ? { imageUrls } : {}),
        ...(notes ? { notes } : {}),
      });
      navigation.goBack();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput label={t('exams.examName')} value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <DateInput label={t('exams.date')} value={date} onChange={setDate} style={styles.input} />

      <View style={styles.doctorHeader}>
        <Text variant="bodyMedium" style={styles.label}>{t('exams.requestingDoctor')}</Text>
        <TouchableOpacity style={styles.addDoctorBtn} onPress={() => setNewDoctorModal(true)}>
          <MaterialIcons name="add" size={16} color="#2563eb" />
          <Text variant="bodySmall" style={styles.addDoctorText}>{t('exams.newDoctor')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.picker}>
        <Picker selectedValue={selectedDoctor} onValueChange={setSelectedDoctor}>
          <Picker.Item label={t('exams.noneDoctor')} value="" />
          {doctors.map((d) => (
            <Picker.Item key={d.id} label={`Dr(a). ${d.name}${d.specialty !== t('exams.notInformed') ? ` — ${d.specialty}` : ''}`} value={d.id} />
          ))}
        </Picker>
      </View>

      <Button mode="outlined" onPress={pickImage} icon="image-plus" style={styles.imageButton}>
        {images.length === 0 ? t('exams.addImages') : t('exams.addMoreImages')}
      </Button>

      {images.length > 0 && (
        <View style={styles.previewGrid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.previewWrapper}>
              <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <MaterialIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TextInput label={t('common.observations')} value={notes} onChangeText={setNotes} mode="outlined"
        multiline numberOfLines={3} style={styles.input} />

      {error ? <HelperText type="error" visible>{error}</HelperText> : null}
      <Button mode="contained" onPress={handleSave} loading={loading} style={styles.saveButton}>
        {t('exams.saveExam')}
      </Button>

      <Modal visible={newDoctorModal} transparent animationType="slide" onRequestClose={() => setNewDoctorModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={styles.modalTitle}>{t('exams.newDoctorModal.title')}</Text>
              <TouchableOpacity onPress={() => setNewDoctorModal(false)}>
                <MaterialIcons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TextInput label={t('exams.newDoctorModal.name')} value={newDoctorName} onChangeText={setNewDoctorName}
              mode="outlined" style={styles.modalInput} />
            <TextInput label={t('exams.newDoctorModal.specialty')} value={newDoctorSpecialty} onChangeText={setNewDoctorSpecialty}
              mode="outlined" style={styles.modalInput} />
            <TextInput label={t('exams.newDoctorModal.hospitalClinic')} value={newDoctorHospital} onChangeText={setNewDoctorHospital}
              mode="outlined" style={styles.modalInput} />

            {modalError ? <HelperText type="error" visible>{modalError}</HelperText> : null}
            <Button mode="contained" onPress={handleAddDoctor} loading={savingDoctor} style={styles.modalSaveBtn}>
              {t('exams.newDoctorModal.addDoctor')}
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  content: { padding: 16, paddingBottom: 40 },
  label: { color: '#475569' },
  input: { marginBottom: 12 },
  doctorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  addDoctorBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  addDoctorText: { color: '#2563eb', fontWeight: '600' },
  picker: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, marginBottom: 12, backgroundColor: '#fff' },
  imageButton: { marginBottom: 12 },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  previewWrapper: { position: 'relative', width: '47%' },
  preview: { width: '100%', height: 130, borderRadius: 8 },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 2,
  },
  saveButton: { marginTop: 16, backgroundColor: '#2563eb' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontWeight: 'bold', color: '#1e293b' },
  modalInput: { marginBottom: 10 },
  modalSaveBtn: { marginTop: 8, backgroundColor: '#2563eb' },
});
