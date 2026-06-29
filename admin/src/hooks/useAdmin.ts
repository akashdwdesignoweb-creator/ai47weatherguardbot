import { useState, useCallback } from 'react';
import type { User, Stats } from '../types';
import { apiService } from '../services/api.service';

export function useAdmin(token: string | null) {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, pendingUsers: 0, approvedUsers: 0, telegramLinkedUsers: 0 });
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    if (!token) return;
    setIsAdminLoading(true);
    setAdminError(null);
    try {
      const [fetchedUsers, fetchedStats] = await Promise.all([
        apiService.getAdminUsers(token),
        apiService.getAdminStats(token),
      ]);
      setUsers(fetchedUsers);
      setStats(fetchedStats);
    } catch (err) {
      setAdminError('Failed to fetch admin console data');
    } finally {
      setIsAdminLoading(false);
    }
  }, [token]);

  const updateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    if (!token) return;
    setAdminError(null);
    try {
      await apiService.updateUserStatus(token, userId, status);
      await fetchAdminData(); // refresh table & stats cards
    } catch (err) {
      setAdminError('Failed to update status');
    }
  };

  return {
    users,
    stats,
    isAdminLoading,
    adminError,
    fetchAdminData,
    updateStatus,
  };
}
