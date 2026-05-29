import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Medicine } from '../types';
import dayjs from 'dayjs';

export interface AppointmentReminder {
  id: string;
  date: string;
  doctorName: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('remedio', {
      name: 'Lembretes de Remédio',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    await Notifications.setNotificationChannelAsync('consulta', {
      name: 'Lembretes de Consulta',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
    });
  }

  return true;
}

// iOS allows at most 64 scheduled notifications per app across all medicines.
// We cap each medicine to 50 future doses to leave headroom for other medicines.
const MAX_REMINDERS_PER_MEDICINE = 50; // shared across both "5min before" + "on time" notifications

export async function scheduleMedicineReminders(medicine: Medicine): Promise<void> {
  await cancelMedicineReminders(medicine.id);

  const start = dayjs(medicine.startTime);
  const end = medicine.endDate ? dayjs(medicine.endDate) : dayjs().add(30, 'day');
  const frequencyHours = medicine.frequency;
  let count = 0;

  let current = start;
  while (current.isBefore(end) && count < MAX_REMINDERS_PER_MEDICINE) {
    const now = dayjs();
    const fiveMinBefore = current.subtract(5, 'minute');

    if (fiveMinBefore.isAfter(now)) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${medicine.id}_${current.valueOf()}_warn`,
        content: {
          title: '💊 Remédio em 5 minutos!',
          body: `Prepare-se para tomar ${medicine.name} - ${medicine.dosage}`,
          data: { medicineId: medicine.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fiveMinBefore.toDate(),
          channelId: 'remedio',
        },
      });
      count++;
    }

    if (current.isAfter(now) && count < MAX_REMINDERS_PER_MEDICINE) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${medicine.id}_${current.valueOf()}`,
        content: {
          title: '💊 Hora do remédio!',
          body: `Tomar ${medicine.name} - ${medicine.dosage}`,
          data: { medicineId: medicine.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: current.toDate(),
          channelId: 'remedio',
        },
      });
      count++;
    }

    current = current.add(frequencyHours, 'hour');
  }
}

export async function cancelMedicineReminders(medicineId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) => n.identifier.startsWith(medicineId));
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function scheduleAppointmentReminders(appt: AppointmentReminder): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelAppointmentReminders(appt.id);

  const apptTime = dayjs(appt.date);
  const now = dayjs();
  const reminderMinus30 = apptTime.subtract(30, 'minute');

  if (reminderMinus30.isAfter(now)) {
    await Notifications.scheduleNotificationAsync({
      identifier: `appt_${appt.id}_30min`,
      content: {
        title: '🏥 Consulta em 30 minutos!',
        body: `Sua consulta com Dr(a). ${appt.doctorName} começa em 30 minutos.`,
        data: { appointmentId: appt.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderMinus30.toDate(),
        channelId: 'consulta',
      },
    });
  }

  if (apptTime.isAfter(now)) {
    await Notifications.scheduleNotificationAsync({
      identifier: `appt_${appt.id}_now`,
      content: {
        title: '🏥 Hora da consulta!',
        body: `Sua consulta com Dr(a). ${appt.doctorName} começa agora.`,
        data: { appointmentId: appt.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: apptTime.toDate(),
        channelId: 'consulta',
      },
    });
  }
}

export async function cancelAppointmentReminders(appointmentId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) => n.identifier.startsWith(`appt_${appointmentId}`));
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}
