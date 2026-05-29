import { getToken } from './authService';

const IS_WEB = typeof window !== 'undefined' && typeof document !== 'undefined';
const BASE_URL = IS_WEB ? 'http://localhost:3001' : 'http://10.55.75.217:3001';

async function getHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) throw new Error('Usuário não autenticado');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data as T;
}

// ---------- Medicines ----------
export const getMedicines = (active?: boolean) =>
  request<any[]>('GET', active ? '/medicines?active=true' : '/medicines');

export const addMedicine = (body: Record<string, any>) =>
  request<any>('POST', '/medicines', body);

export const deleteMedicine = (id: string) =>
  request<void>('DELETE', `/medicines/${id}`);

// ---------- Diseases ----------
export const getDiseases = () => request<any[]>('GET', '/diseases');

export const addDisease = (body: Record<string, any>) =>
  request<any>('POST', '/diseases', body);

export const deleteDisease = (id: string) =>
  request<void>('DELETE', `/diseases/${id}`);

// ---------- Doctors ----------
export const getDoctors = () => request<any[]>('GET', '/doctors');

export const addDoctor = (body: Record<string, any>) =>
  request<any>('POST', '/doctors', body);

export const deleteDoctor = (id: string) =>
  request<void>('DELETE', `/doctors/${id}`);

// ---------- Appointments ----------
export const getAppointments = (upcoming?: boolean) =>
  request<any[]>('GET', upcoming ? '/appointments?upcoming=true' : '/appointments');

export const addAppointment = (body: Record<string, any>) =>
  request<any>('POST', '/appointments', body);

// ---------- Exams ----------
export const getExams = (doctorId?: string) =>
  request<any[]>('GET', doctorId ? `/exams?doctorId=${doctorId}` : '/exams');

export const addExam = (body: Record<string, any>) =>
  request<any>('POST', '/exams', body);

export const deleteExam = (id: string) =>
  request<void>('DELETE', `/exams/${id}`);
