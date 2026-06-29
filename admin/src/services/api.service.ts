import type { User, Stats } from '../types';

const API_BASE = 'http://localhost:5000/api';

class ApiService {
  private getHeaders(token: string | null): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }


  async getProfile(token: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      throw new Error('Failed to retrieve profile');
    }

    return res.json();
  }

  async updateLocation(token: string, location: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/location`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({ location }),
    });

    if (!res.ok) {
      throw new Error('Failed to update weather location');
    }

    return res.json();
  }

  async getAdminUsers(token: string): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch user list');
    }

    return res.json();
  }

  async getAdminStats(token: string): Promise<Stats> {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch stats');
    }

    return res.json();
  }

  async updateUserStatus(token: string, userId: string, status: 'approved' | 'rejected'): Promise<User> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error('Failed to update user status');
    }

    return res.json();
  }

  async localRegister(email: string, name: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(null),
      body: JSON.stringify({ email, name, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Registration failed');
    }

    return res.json();
  }

  async localLogin(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(null),
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }

    return res.json();
  }

  async unlinkTelegram(token: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/telegram/unlink`, {
      method: 'PUT',
      headers: this.getHeaders(token),
    });

    if (!res.ok) {
      throw new Error('Failed to unlink Telegram bot');
    }

    return res.json();
  }
}

export const apiService = new ApiService();
