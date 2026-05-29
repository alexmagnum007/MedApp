export interface User {
  uid: string;
  email: string;
  name: string;
}

export interface Medicine {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: number; // hours between doses
  startTime: string; // ISO string
  startDate: string; // ISO string
  endDate?: string;
  prescriptionImageUrl?: string;
  diseaseId?: string;
  doctorId?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface Reminder {
  medicineId: string;
  medicineName: string;
  nextDoseTime: string;
}

export interface Disease {
  id: string;
  userId: string;
  name: string;
  symptoms: string[];
  diagnosedAt: string;
  doctorId?: string;
  imageUrl?: string;
  imageUrls?: string[];
  notes?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialty: string;
  hospital: string;
  phone?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  date: string; // ISO string
  notes?: string;
  prescriptionIds: string[];
  createdAt: string;
}

export interface ExamResult {
  id: string;
  userId: string;
  name: string;
  date: string;
  doctorId?: string;
  imageUrl?: string;
  imageUrls?: string[];
  notes?: string;
  createdAt: string;
}
