import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, IconButton } from 'react-native-paper';
import { getDoctors, getAppointments, getExams, deleteDoctor } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Doctor, Appointment, ExamResult } from '../../types';
import dayjs from 'dayjs';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from '../../i18n';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function DoctorsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [examsCount, setExamsCount] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation, user?.uid]);

  async function loadData() {
    if (!user) return;
    const [doctorsData, appointmentsData, examsData] = await Promise.all([
      getDoctors(), getAppointments(), getExams(),
    ]);
    setDoctors(doctorsData as Doctor[]);
    setAppointments(appointmentsData as Appointment[]);
    const count: Record<string, number> = {};
    (examsData as ExamResult[]).forEach((exam) => {
      if (exam.doctorId) count[exam.doctorId] = (count[exam.doctorId] ?? 0) + 1;
    });
    setExamsCount(count);
  }

  function getNextAppointment(doctorId: string): string {
    const upcoming = appointments
      .filter((a) => a.doctorId === doctorId && dayjs(a.date).isAfter(dayjs()))
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
    return upcoming[0]
      ? dayjs(upcoming[0].date).format('DD/MM/YYYY HH:mm')
      : t('doctors.noAppointmentScheduled');
  }

  async function handleDelete(id: string, name: string) {
    const doDelete = async () => { await deleteDoctor(id); loadData(); };
    if (Platform.OS === 'web') {
      if (!window.confirm(t('doctors.deleteConfirm', { name }))) return;
      doDelete().catch((e) => window.alert(t('common.error') + ': ' + e.message));
    } else {
      Alert.alert(t('doctors.deleteTitle'), t('doctors.deleteConfirm', { name }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('doctors.noDoctor')}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => navigation.navigate('AddAppointment', { doctor: item })}>
            <Card.Content>
              <View style={styles.row}>
                <MaterialIcons name="person" size={28} color="#2563eb" />
                <View style={styles.info}>
                  <Text variant="titleMedium">{t('doctors.doctorTitle', { name: item.name })}</Text>
                  <Text variant="bodySmall" style={styles.sub}>{item.specialty} — {item.hospital}</Text>
                  {item.phone && <Text variant="bodySmall" style={styles.sub}>{item.phone}</Text>}
                  <Text variant="bodySmall" style={styles.next}>
                    {t('doctors.nextAppointment', { date: getNextAppointment(item.id) })}
                  </Text>
                  {(examsCount[item.id] ?? 0) > 0 && (
                    <TouchableOpacity
                      style={styles.examsLink}
                      onPress={() => navigation.navigate('DoctorExams', { doctor: item })}
                    >
                      <MaterialIcons name="science" size={13} color="#7c3aed" />
                      <Text variant="bodySmall" style={styles.examsLinkText}>
                        {t('doctors.examsLinked', { count: examsCount[item.id] })}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <IconButton icon="delete" iconColor="#ef4444" size={20} onPress={() => handleDelete(item.id, item.name)} />
              </View>
            </Card.Content>
          </Card>
        )}
      />
      <FAB icon="calendar-plus" style={styles.fabAppointment}
        onPress={() => navigation.navigate('AddAppointment', {})} label={t('doctors.consult')} />
      <FAB icon="plus" style={styles.fab}
        onPress={() => navigation.navigate('AddDoctor')} label={t('doctors.doctor')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  list: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 12, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  info: { flex: 1 },
  sub: { color: '#64748b' },
  next: { color: '#16a34a', marginTop: 4 },
  examsLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  examsLinkText: { color: '#7c3aed' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2563eb' },
  fabAppointment: { position: 'absolute', right: 16, bottom: 80, backgroundColor: '#16a34a' },
});
