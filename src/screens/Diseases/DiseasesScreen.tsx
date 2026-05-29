import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, Platform, Image, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Text, Card, FAB, Chip, IconButton } from 'react-native-paper';
import { getDiseases, getDoctors, deleteDisease } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Disease, Doctor } from '../../types';
import dayjs from 'dayjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from '../../i18n';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function DiseasesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [doctors, setDoctors] = useState<Record<string, Doctor>>({});
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation, user?.uid]);

  async function loadData() {
    if (!user) return;
    const [diseasesData, doctorsData] = await Promise.all([getDiseases(), getDoctors()]);
    setDiseases(diseasesData as Disease[]);
    const map: Record<string, Doctor> = {};
    (doctorsData as Doctor[]).forEach((d) => { map[d.id] = d; });
    setDoctors(map);
  }

  async function handleDelete(id: string, name: string) {
    const doDelete = async () => { await deleteDisease(id); loadData(); };
    if (Platform.OS === 'web') {
      if (!window.confirm(t('diseases.deleteConfirm', { name }))) return;
      doDelete().catch((e) => window.alert(t('common.error') + ': ' + e.message));
    } else {
      Alert.alert(t('diseases.deleteTitle'), t('diseases.deleteConfirm', { name }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={diseases}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('diseases.noDiseasesRegistered')}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.row}>
                <Text variant="titleMedium" style={styles.name}>{item.name}</Text>
                <IconButton icon="delete" iconColor="#ef4444" size={20} onPress={() => handleDelete(item.id, item.name)} />
              </View>
              <Text variant="bodySmall" style={styles.date}>
                {t('diseases.diagnosedAtLabel', { date: dayjs(item.diagnosedAt).format('DD/MM/YYYY') })}
              </Text>
              {item.doctorId && doctors[item.doctorId] && (
                <Text variant="bodySmall" style={styles.doctor}>
                  {t('diseases.doctorLabel', { name: doctors[item.doctorId].name, specialty: doctors[item.doctorId].specialty })}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.label}>{t('diseases.symptoms')}:</Text>
              <View style={styles.chips}>
                {item.symptoms.map((s, i) => (
                  <Chip key={i} compact style={styles.chip}>{s}</Chip>
                ))}
              </View>
              {item.notes && <Text variant="bodySmall" style={styles.notes}>{item.notes}</Text>}
              {[...(item.imageUrls ?? []), ...(item.imageUrl && !item.imageUrls ? [item.imageUrl] : [])].map((url, i) => (
                <TouchableOpacity key={i} onPress={() => setZoomImage(url)}>
                  <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}
      />
      <Modal visible={!!zoomImage} transparent animationType="fade" onRequestClose={() => setZoomImage(null)}>
        <TouchableWithoutFeedback onPress={() => setZoomImage(null)}>
          <View style={styles.modalOverlay}>
            <Image source={{ uri: zoomImage! }} style={styles.modalImage} resizeMode="contain" />
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('AddDisease')} label={t('diseases.disease')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  list: { padding: 16, paddingBottom: 80 },
  card: { marginBottom: 12, borderRadius: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: 'bold', flex: 1 },
  date: { color: '#64748b', marginBottom: 4 },
  doctor: { color: '#2563eb', marginBottom: 4 },
  label: { color: '#475569', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  chip: { backgroundColor: '#fef3c7' },
  notes: { color: '#64748b', marginTop: 8, fontStyle: 'italic' },
  image: { width: '100%', height: 180, borderRadius: 8, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '95%', height: '80%' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2563eb' },
});
