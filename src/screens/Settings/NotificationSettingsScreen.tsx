import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Switch } from 'react-native-paper';
import { getNotificationSettings, saveNotificationSettings, NotificationSettings } from '../../services/notificationSettings';
import { useTranslation } from '../../i18n';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettings>({
    medicineEnabled: true,
    medicineWarnEnabled: true,
    appointmentEnabled: true,
    appointmentWarnEnabled: true,
  });

  useEffect(() => {
    getNotificationSettings().then(setSettings);
  }, []);

  async function toggle(key: keyof NotificationSettings) {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await saveNotificationSettings(updated);
  }

  function Row({ label, desc, settingKey }: { label: string; desc?: string; settingKey: keyof NotificationSettings }) {
    return (
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text variant="bodyLarge" style={styles.rowLabel}>{label}</Text>
          {desc ? <Text variant="bodySmall" style={styles.rowDesc}>{desc}</Text> : null}
        </View>
        <Switch value={settings[settingKey]} onValueChange={() => toggle(settingKey)} color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="titleMedium" style={styles.section}>{t('settings.medicines')}</Text>
      <View style={styles.card}>
        <Row label={t('settings.medicineEnabled')} settingKey="medicineEnabled" />
        <View style={styles.divider} />
        <Row
          label={t('settings.medicineWarn')}
          desc={t('settings.medicineWarnDesc')}
          settingKey="medicineWarnEnabled"
        />
      </View>

      <Text variant="titleMedium" style={styles.section}>{t('settings.appointments')}</Text>
      <View style={styles.card}>
        <Row label={t('settings.appointmentEnabled')} settingKey="appointmentEnabled" />
        <View style={styles.divider} />
        <Row
          label={t('settings.appointmentWarn')}
          desc={t('settings.appointmentWarnDesc')}
          settingKey="appointmentWarnEnabled"
        />
      </View>

      <Text variant="bodySmall" style={styles.hint}>{t('settings.hint')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  content: { padding: 16, paddingBottom: 40 },
  section: { fontWeight: 'bold', color: '#2563eb', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowText: { flex: 1, marginRight: 12 },
  rowLabel: { color: '#1e293b' },
  rowDesc: { color: '#64748b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
  hint: { color: '#94a3b8', textAlign: 'center', marginTop: 24 },
});
