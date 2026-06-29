import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { apiService } from '../services/api.service';

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!localStorage.getItem('token'));

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSuccess('Logged out successfully');
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  const fetchProfile = useCallback(async (authToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await apiService.getProfile(authToken);
      setUser(profile);
    } catch (err) {
      logout();
      setError('Session expired or connection failed');
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      localStorage.setItem('token', tokenParam);
      setToken(tokenParam);
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      setSuccess('Successfully authenticated via OAuth');
      setTimeout(() => setSuccess(null), 3000);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setUser(null);
    }
  }, [token, fetchProfile]);

  const saveLocation = async (location: string) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await apiService.updateLocation(token, location);
      setUser(updatedUser);
      setSuccess('Weather location saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update weather location');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithCredentials = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.localLogin(email, password);
      localStorage.setItem('token', data.accessToken);
      setToken(data.accessToken);
      setUser(data.user);
      setSuccess(`Welcome back, ${data.user.name}!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithCredentials = async (email: string, name: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiService.localRegister(email, name, password);
      setSuccess('Account registered successfully! Attempting login...');
      // Automatically log in newly registered user
      await loginWithCredentials(email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setIsLoading(false);
    }
  };

  const unlinkTelegram = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await apiService.unlinkTelegram(token);
      setUser(updatedUser);
      setSuccess('Telegram bot unlinked successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to unlink Telegram bot');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    token,
    user,
    error,
    success,
    isLoading,
    logout,
    saveLocation,
    loginWithCredentials,
    registerWithCredentials,
    unlinkTelegram,
    fetchProfile: () => token && fetchProfile(token),
    setError,
    setSuccess,
  };
}
