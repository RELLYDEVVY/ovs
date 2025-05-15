import api from '../lib/axios';
import { User } from '../store/useAuthStore'; // Assuming User interface is defined here or can be imported

// Define a more complete User type if needed for admin views, 
// or ensure useAuthStore.User is sufficient.
// For example, it might include createdAt, etc.

export interface AdminUser extends User {
  // Add any additional fields that admins might see, e.g., createdAt
  createdAt?: string; 
  // email is already in User from our previous change
}

export const getAllUsers = async (): Promise<AdminUser[]> => {
  try {
    // The backend sends users with _id, role, username, email, isFingerprintVerified, createdAt
    // AdminUser expects id, username, email, role, isFingerPrintVerified, createdAt
    const response = await api.get<any[]>('/users'); // Get as any[] to handle _id initially
    const usersWithId = response.data.map(user => ({
      ...user,
      id: user._id, // Map _id to id
      // delete user._id; // Optionally remove _id if you want only id
    }));
    return usersWithId as AdminUser[];
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

// Delete a user by ID
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await api.delete(`/users/${userId}`);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    // Consider how to handle specific error types or messages if needed
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to delete user.');
  }
};

// Update user fingerprint verification status
export const updateUserFingerprintStatus = async (userId: string, isVerified: boolean): Promise<AdminUser> => {
  try {
    const response = await api.put<any>(`/users/${userId}/verify-fingerprint`, { isFingerprintVerified: isVerified });
    const user = response.data;
    return { ...user, id: user._id || user.id } as AdminUser;
  } catch (error) {
    console.error(`Error updating fingerprint status for user ${userId}:`, error);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to update fingerprint verification status.');
  }
};

// Update user role
export const updateUserRole = async (userId: string, role: 'admin' | 'user'): Promise<AdminUser> => {
  try {
    const response = await api.put<any>(`/users/${userId}/role`, { role });
    const user = response.data;
    return { ...user, id: user._id || user.id } as AdminUser;
  } catch (error) {
    console.error(`Error updating role for user ${userId}:`, error);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to update user role.');
  }
};
