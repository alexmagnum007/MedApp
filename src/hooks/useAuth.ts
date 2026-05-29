import { useState, useEffect } from 'react';
import { registerUser, loginUser, logoutUser, getSavedUser } from '../services/authService';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedUser().then(saved => {
      if (saved) setUser({ uid: String(saved.id), email: saved.email, name: saved.name });
      setLoading(false);
    });
  }, []);

  async function register(name: string, email: string, password: string) {
    const { user: u } = await registerUser(name, email, password);
    setUser({ uid: String(u.id), email: u.email, name: u.name });
  }

  async function login(email: string, password: string) {
    const { user: u } = await loginUser(email, password);
    setUser({ uid: String(u.id), email: u.email, name: u.name });
  }

  async function logout() {
    await logoutUser();
    setUser(null);
  }

  return { user, loading, register, login, logout };
}
