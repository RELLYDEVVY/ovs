import { create } from 'zustand';
import api from '../lib/axios';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AdminState {
  isLoading: boolean;
  users: User[];
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  isLoading: false,
  users: [],

  fetchUsers: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/admin/users');
      set({ users: response.data });
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserRole: async (userId: string, role: string) => {
    try {
      set({ isLoading: true });
      await api.put(`/admin/users/${userId}/role`, { role });
      // Refresh the users list after update
      const response = await api.get('/admin/users');
      set({ users: response.data });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteUser: async (userId: string) => {
    try {
      set({ isLoading: true });
      await api.delete(`/admin/users/${userId}`);
      // Remove the deleted user from the state
      set((state) => ({
        users: state.users.filter((user) => user.id !== userId)
      }));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }
}));
