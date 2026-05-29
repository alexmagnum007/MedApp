import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Image, Alert, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { Text, Chip, Button, Divider } from 'react-native-paper';
import { deleteMedicine } from '../../services/api';
import { cancelMedicineReminders } from '../../services/notifications';
import { Medicine } from '../../types';
import dayjs from 'dayjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ MedicineDetail: { medicine: Medicine } }, 'MedicineDetail'>;
};

export default function MedicineDetailScreen({ navigation, route }: Props) {
  const { medicine } = route.params;
  const { t } = useTranslation();
  const [zoomImage, setZoomImage] = useState(false);

  async function handleDelete() {
    const doDelete = async () => {
      await cancelMedicineReminders(medicine.id);
      await deleteMedicine(medicine.id);
      navigation.goBack();
    };
    if (Platform.OS === 'web') {
      if (!window.confirm(t('medicines.deleteDetailConfirm', { name: medicine.name }))) return;
      doDelete();
      return;
    }
    Alert.alert(t('medicines.deleteDetailTitle'), t('medicines.deleteDetailConfirm', { name: medicine.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: doDelete },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.name}>{medicine.name}</Text>
        <View style={styles.statusRow}>
          {medicine.active ? (
            <Chip icon="check-circle" style={styles.activeChip}>{t('medicines.active')}</Chip>
          ) : (
            <Chip icon="close-circle" style={styles.inactiveChip}>{t('medicines.inactive')}</Chip>
          )}
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Row label={t('medicines.dosageRow')} value={medicine.dosage} />
        <Row label={t('medicines.frequencyRow')} value={t('medicines.frequencyValue', { hours: medicine.frequency })} />
        <Row label={t('medicines.startDateRow')} value={dayjs(medicine.startDate).format('DD/MM/YYYY')} />
        {medicine.endDate && (
          <Row label={t('medicines.endDateRow')} value={dayjs(medicine.endDate).format('DD/MM/YYYY')} />
        )}
        <Row
          label={t('medicines.nextDose')}
          value={calcNextDose(medicine.startTime, medicine.frequency)}
        />
      </View>

      {medicine.notes ? (
        <>
          <Divider style={styles.divider} />
          <Text variant="titleSmall" style={styles.sectionTitle}>{t('common.observations')}</Text>
          <Text style={styles.notes}>{medicine.notes}</Text>
        </>
      ) : null}

      <Divider style={styles.divider} />
      <Text variant="titleSmall" style={styles.sectionTitle}>{t('medicines.prescription')}</Text>
      {medicine.prescriptionImageUrl ? (
        <TouchableOpacity onPress={() => setZoomImage(true)}>
          <Image
            source={{ uri: medicine.prescriptionImageUrl }}
            style={styles.image}
            resizeMode="contain"
            onError={() => console.warn('Erro ao carregar imagem:', medicine.prescriptionImageUrl)}
          />
        </TouchableOpacity>
      ) : (
        <Text style={styles.noImage}>{t('medicines.noImage')}</Text>
      )}

      <Modal visible={zoomImage} transparent animationType="fade" onRequestClose={() => setZoomImage(false)}>
        <TouchableWithoutFeedback onPress={() => setZoomImage(false)}>
          <View style={styles.modalOverlay}>
            <Image
              source={{ uri: medicine.prescriptionImageUrl }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        icon="delete"
        textColor="#ef4444"
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        {t('medicines.deleteMedicine')}
      </Button>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function calcNextDose(startTime: string, frequencyHours: number): string {
  const start = dayjs(startTime);
  const now = dayjs();
  if (start.isAfter(now)) return start.format('DD/MM HH:mm');
  const diffHours = now.diff(start, 'hour');
  const passedCycles = Math.floor(diffHours / frequencyHours);
  const next = start.add((passedCycles + 1) * frequencyHours, 'hour');
  return next.format('DD/MM HH:mm');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 8 },
  name: { fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 },
  statusRow: { flexDirection: 'row' },
  activeChip: { backgroundColor: '#dcfce7' },
  inactiveChip: { backgroundColor: '#fee2e2' },
  divider: { marginVertical: 16 },
  section: { gap: 12 },
  sectionTitle: { color: '#475569', marginBottom: 8, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: '#64748b', flex: 1 },
  rowValue: { color: '#1e293b', fontWeight: '500', flex: 1, textAlign: 'right' },
  notes: { color: '#334155', lineHeight: 22 },
  image: { width: '100%', height: 220, borderRadius: 8, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '95%', height: '80%' },
  deleteButton: { borderColor: '#ef4444' },
  noImage: { color: '#94a3b8', fontStyle: 'italic', marginTop: 4 },
});
