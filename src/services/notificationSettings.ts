import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@medapp_notif_settings';

export interface NotificationSettings {
  medicineEnabled: boolean;
  medicineWarnEnabled: boolean;
  appointmentEnabled: boolean;
  appointmentWarnEnabled: boolean;
}

const defaults: NotificationSettings = {
  medicineEnabled: true,
  medicineWarnEnabled: true,
  appointmentEnabled: true,
  appointmentWarnEnabled: true,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return defaults;
  return { ...defaults, ...JSON.parse(raw) };
}

export async function saveNotificationSettings(s: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}
