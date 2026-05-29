import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Surface } from 'react-native-paper';
import { getMedicines, getAppointments } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Medicine, Appointment } from '../../types';
import dayjs from 'dayjs';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../i18n';

export default function HomeScreen() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    try {
      const [meds, appts] = await Promise.all([
        getMedicines(true),
        getAppointments(true),
      ]);
      setMedicines(meds as Medicine[]);
      setAppointments(appts as Appointment[]);
    } catch (e: any) {
      console.error('Erro ao carregar home:', e.message);
    }
  }

  function getNextDose(medicine: Medicine): string {
    const start = dayjs(medicine.startTime);
    const now = dayjs();
    if (start.isAfter(now)) return start.format('HH:mm');
    const diffHours = now.diff(start, 'hour');
    const nextDose = start.add(Math.ceil(diffHours / medicine.frequency) * medicine.frequency, 'hour');
    return nextDose.format('HH:mm');
  }

  const languages = [
    { code: 'pt', label: 'PT' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineSmall" style={styles.greeting}>{t('home.greeting', { name: user?.name })}</Text>
        <Text variant="bodyMedium" style={styles.date}>{dayjs().format('DD/MM/YYYY')}</Text>

        {/* Language selector */}
        <View style={styles.langSelector}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langButton,
                i18n.language === lang.code && styles.langButtonActive,
              ]}
              onPress={() => changeLanguage(lang.code as any)}
            >
              <Text style={[
                styles.langButtonText,
                i18n.language === lang.code && styles.langButtonTextActive,
              ]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Surface>

      <Text variant="titleMedium" style={styles.sectionTitle}>{t('home.nextDoses')}</Text>
      {medicines.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>{t('home.noMedicines')}</Text>
          </Card.Content>
        </Card>
      ) : (
        medicines.map((med) => (
          <Card key={med.id} style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <MaterialIcons name="medication" size={28} color="#2563eb" />
              <View style={styles.cardText}>
                <Text variant="titleSmall">{med.name}</Text>
                <Text variant="bodySmall" style={styles.dosage}>{med.dosage}</Text>
              </View>
              <View style={styles.timeContainer}>
                <Text variant="bodySmall" style={styles.timeLabel}>{t('home.nextDoseLabel')}</Text>
                <Text variant="titleMedium" style={styles.time}>{getNextDose(med)}</Text>
              </View>
            </Card.Content>
          </Card>
        ))
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>{t('home.upcomingAppointments')}</Text>
      {appointments.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>{t('home.noAppointments')}</Text>
          </Card.Content>
        </Card>
      ) : (
        appointments.slice(0, 3).map((appt) => (
          <Card key={appt.id} style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <MaterialIcons name="event" size={28} color="#16a34a" />
              <View style={styles.cardText}>
                <Text variant="titleSmall">{dayjs(appt.date).format('DD/MM/YYYY HH:mm')}</Text>
                <Text variant="bodySmall" style={styles.dosage}>{appt.notes}</Text>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  header: { padding: 20, marginBottom: 8, backgroundColor: '#2563eb' },
  greeting: { color: '#fff', fontWeight: 'bold' },
  date: { color: '#bfdbfe', marginBottom: 8 },
  langSelector: { flexDirection: 'row', gap: 8, marginTop: 4 },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  langButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  langButtonText: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 13 },
  langButtonTextActive: { color: '#2563eb' },
  sectionTitle: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, fontWeight: 'bold', color: '#1e293b' },
  card: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardText: { flex: 1 },
  dosage: { color: '#64748b' },
  timeContainer: { alignItems: 'flex-end' },
  timeLabel: { color: '#64748b', fontSize: 10 },
  time: { color: '#2563eb', fontWeight: 'bold' },
  emptyCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  emptyText: { color: '#94a3b8', textAlign: 'center' },
});
