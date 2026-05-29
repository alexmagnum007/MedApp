import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, Image, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import ImageViewer from '../../components/ImageViewer';
import { getExams, getDoctors, deleteExam } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ExamResult, Doctor } from '../../types';
import dayjs from 'dayjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function ExamsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [doctorsMap, setDoctorsMap] = useState<Record<string, Doctor>>({});
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    loadData();
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation, user?.uid]);

  async function loadData() {
    if (!user) return;
    try {
      const [examsData, doctorsData] = await Promise.all([getExams(), getDoctors()]);
      setExams((examsData as ExamResult[]).sort((a, b) => dayjs(b.date).diff(dayjs(a.date))));
      const map: Record<string, Doctor> = {};
      (doctorsData as Doctor[]).forEach((d) => { map[d.id] = d; });
      setDoctorsMap(map);
    } catch (e: any) {
      console.error('Erro ao carregar exames:', e.message);
    }
  }

  async function handleDelete(id: string, name: string) {
    const doDelete = async () => { await deleteExam(id); loadData(); };
    if (Platform.OS === 'web') {
      if (!window.confirm(t('exams.deleteConfirm', { name }))) return;
      doDelete().catch((e) => window.alert(t('common.error') + ': ' + e.message));
    } else {
      Alert.alert(t('exams.deleteTitle'), t('exams.deleteConfirm', { name }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={exams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('exams.noExams')}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text variant="titleMedium">{item.name}</Text>
                  <Text variant="bodySmall" style={styles.date}>
                    {dayjs(item.date).format('DD/MM/YYYY')}
                  </Text>
                  {item.doctorId && doctorsMap[item.doctorId] && (
                    <View style={styles.doctorRow}>
                      <MaterialIcons name="local-hospital" size={13} color="#2563eb" />
                      <Text variant="bodySmall" style={styles.doctorName}>
                        Dr(a). {doctorsMap[item.doctorId].name}
                      </Text>
                    </View>
                  )}
                  {item.notes && <Text variant="bodySmall" style={styles.notes}>{item.notes}</Text>}
                </View>
                <IconButton icon="delete" iconColor="#ef4444" size={20} onPress={() => handleDelete(item.id, item.name)} />
              </View>
              {(() => {
                const urls = item.imageUrls && item.imageUrls.length > 0
                  ? item.imageUrls
                  : item.imageUrl ? [item.imageUrl] : [];
                if (urls.length === 0) return null;
                return (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    {urls.map((url, i) => (
                      <TouchableOpacity key={i} onPress={() => setViewer({ images: urls, index: i })}>
                        <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                );
              })()}
            </Card.Content>
          </Card>
        )}
      />
      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('AddExam')} label={t('exams.exam')} />

      {viewer && (
        <ImageViewer
          images={viewer.images}
          initialIndex={viewer.index}
          visible
          onClose={() => setViewer(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  list: { padding: 16, paddingBottom: 80 },
  card: { marginBottom: 12, borderRadius: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1 },
  date: { color: '#64748b' },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  doctorName: { color: '#2563eb' },
  notes: { color: '#64748b', marginTop: 4, fontStyle: 'italic' },
  imageScroll: { marginTop: 8 },
  image: { width: 220, height: 160, borderRadius: 8, marginRight: 8 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2563eb' },
});
