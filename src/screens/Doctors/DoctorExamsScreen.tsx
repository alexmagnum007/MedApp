import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { getExams } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ExamResult } from '../../types';
import dayjs from 'dayjs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ImageViewer from '../../components/ImageViewer';
import { useTranslation } from '../../i18n';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params: { doctor: { id: string; name: string } } };
};

export default function DoctorExamsScreen({ route }: Props) {
  const { doctor } = route.params;
  const { user } = useAuth();
  const { t } = useTranslation();
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    loadExams();
  }, [user?.uid]);

  async function loadExams() {
    if (!user) return;
    const data = await getExams(doctor.id);
    setExams((data as ExamResult[]).sort((a, b) => dayjs(b.date).diff(dayjs(a.date))));
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={exams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{t('exams.noExamLinked')}</Text>
        }
        renderItem={({ item }) => {
          const urls = item.imageUrls && item.imageUrls.length > 0
            ? item.imageUrls
            : item.imageUrl ? [item.imageUrl] : [];
          return (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">{item.name}</Text>
                <Text variant="bodySmall" style={styles.date}>
                  {dayjs(item.date).format('DD/MM/YYYY')}
                </Text>
                {item.notes && (
                  <Text variant="bodySmall" style={styles.notes}>{item.notes}</Text>
                )}
                {urls.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    {urls.map((url, i) => (
                      <TouchableOpacity key={i} onPress={() => setViewer({ images: urls, index: i })}>
                        <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </Card.Content>
            </Card>
          );
        }}
      />

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
  list: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 12, borderRadius: 12 },
  date: { color: '#64748b', marginTop: 2 },
  notes: { color: '#64748b', marginTop: 4, fontStyle: 'italic' },
  imageScroll: { marginTop: 8 },
  image: { width: 200, height: 150, borderRadius: 8, marginRight: 8 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 15 },
});
