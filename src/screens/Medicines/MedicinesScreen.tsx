import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import { Text, Card, FAB, Chip, IconButton, Snackbar } from 'react-native-paper';
import { getMedicines, deleteMedicine } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Medicine } from '../../types';
import { cancelMedicineReminders } from '../../services/notifications';
import dayjs from 'dayjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function MedicinesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [user?.uid])
  );

  async function loadMedicines() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMedicines();
      setMedicines(data as Medicine[]);
    } catch (e: any) {
      console.error('Erro ao carregar remédios:', e);
      setSnackbar(t('common.error') + ': ' + (e.message ?? String(e)));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(medicine: Medicine) {
    const doDelete = async () => {
      await cancelMedicineReminders(medicine.id);
      await deleteMedicine(medicine.id);
      loadMedicines();
    };
    if (Platform.OS === 'web') {
      if (!window.confirm(t('medicines.deleteConfirm', { name: medicine.name }))) return;
      doDelete().catch((e) => window.alert(t('common.error') + ': ' + e.message));
    } else {
      Alert.alert(t('medicines.deleteTitle'), t('medicines.deleteConfirm', { name: medicine.name }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{t('medicines.noMedicines')}</Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => navigation.navigate('MedicineDetail', { medicine: item })}>
            <Card.Content>
              <View style={styles.row}>
                <Text variant="titleMedium" style={styles.name}>{item.name}</Text>
                <IconButton icon="delete" iconColor="#ef4444" size={20} onPress={() => handleDelete(item)} />
              </View>
              <Text variant="bodySmall" style={styles.dosage}>{item.dosage}</Text>
              <View style={styles.chips}>
                <Chip icon="clock" compact style={styles.chip}>
                  {t('medicines.frequencyChip', { hours: item.frequency })}
                </Chip>
                <Chip icon="calendar" compact style={styles.chip}>
                  {t('medicines.startLabel', { date: dayjs(item.startTime).format('DD/MM/YY HH:mm') })}
                </Chip>
                {item.endDate && (
                  <Chip icon="calendar-remove" compact style={styles.chip}>
                    {t('medicines.endLabel', { date: dayjs(item.endDate).format('DD/MM/YY HH:mm') })}
                  </Chip>
                )}
                {item.active ? (
                  <Chip icon="check-circle" compact style={[styles.chip, styles.activeChip]}>{t('medicines.active')}</Chip>
                ) : (
                  <Chip compact style={styles.chip}>{t('medicines.inactive')}</Chip>
                )}
              </View>
            </Card.Content>
          </Card>
        )}
      />
      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('AddMedicine')} label={t('medicines.medicine')} />
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={4000}>{snackbar}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  list: { padding: 16, paddingBottom: 80 },
  card: { marginBottom: 12, borderRadius: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: 'bold', flex: 1 },
  dosage: { color: '#64748b', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { backgroundColor: '#e0e7ff' },
  activeChip: { backgroundColor: '#dcfce7' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2563eb' },
});
