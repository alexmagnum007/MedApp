import { getToken } from './authService';

const IS_WEB = typeof window !== 'undefined' && typeof document !== 'undefined';
const BASE_URL = IS_WEB ? 'http://localhost:3001' : 'http://10.55.75.217:3001';

export async function uploadImage(uri: string, _path: string): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error('Usuário não autenticado');

  const formData = new FormData();

  if (IS_WEB) {
    const res = await fetch(uri);
    const blob = await res.blob();
    formData.append('file', blob, 'image.jpg');
  } else {
    formData.append('file', { uri, name: 'image.jpg', type: 'image/jpeg' } as any);
  }

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro no upload');
  return data.url;
}
