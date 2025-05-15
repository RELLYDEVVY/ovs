import { create } from 'zustand';
import api from '../lib/axios';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  isFingerprintVerified?: boolean;
  votedElections?: string[]; // Added to track elections user voted in
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  fetchUser: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role: string, name?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void; // Add updateUser to interface
  recordVote: (electionId: string, candidateId: string) => Promise<void>;
  hasUserVoted: (electionId: string) => boolean; // Added to check if user voted in a specific election
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: !!localStorage.getItem('token'),

  fetchUser: async () => {
    const token = get().token;
    if (!token) {
      set({ user: null, isAuthenticated: false, loading: false });
      return;
    }
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      }); 
      const userData = response.data as User;
      const user = {
        ...userData,
        votedElections: userData.votedElections || [], // Initialize if undefined
      };
      set({ user, isAuthenticated: true, loading: false });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (username: string, password: string) => {
    set({ loading: true });
    try {
      const response = await api.post('/auth/login', { username, password });
      const responseData = response.data;

      const token = responseData.token;
      const user = {
        id: responseData._id, // Map _id to id
        username: responseData.username,
        email: responseData.email, // Add email to user object
        role: responseData.role,
        isFingerprintVerified: responseData.isFingerprintVerified,
        votedElections: responseData.votedElections || [], // Initialize if undefined
      };
      
      localStorage.setItem('token', token);
      // Ensure the constructed user object matches the User interface (or update interface)
      set({ user: user as User, token, isAuthenticated: true, loading: false });
    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('token'); // Ensure token is cleared from storage on login failure
      set({ user: null, token: null, isAuthenticated: false, loading: false });
      throw error;
    }
  },

  register: async (username: string, password: string, role: string, name?: string) => {
    try {
      await api.post('/auth/register', { email: username, username, password, role, name }); // Send email as 'email', and also as 'username'
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, loading: false });
  },

  updateUser: (updates: Partial<User>) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null, // Merge updates with existing user
    })),

  hasUserVoted: (electionId: string) => {
    const user = get().user;
    return !!user?.votedElections?.includes(electionId);
  },

  recordVote: async (electionId: string, candidateId: string) => {
    console.log(`Attempting to record vote for election ${electionId}, candidate ${candidateId} by user ${get().user?.id}`);
    // TODO: Implement actual API call to record the vote
    // Example structure:
    // const token = get().token;
    // if (!token) {
    //   console.error('Authentication token not found');
    //   throw new Error('User not authenticated');
    // }
    // try {
    //   await api.post(`/votes`, 
    //     { electionId, candidateId }, 
    //     { headers: { Authorization: `Bearer ${token}` } }
    //   );
    //   // Optionally, update user state or fetch updated user/election data
    //   // get().fetchUser(); // For example, if voting status is part of user data
    //   console.log('Vote recorded successfully (placeholder)');
    // } catch (error) {
    //   console.error('Failed to record vote:', error);
    //   throw error;
    // }
    // For now, update client-side state. Ideally, this state comes from backend post-vote.
    set((state) => {
      if (state.user && state.user.votedElections && !state.user.votedElections.includes(electionId)) {
        return {
          user: {
            ...state.user,
            votedElections: [...state.user.votedElections, electionId],
          },
        };
      }
      return {}; // No change if user not found or already voted (though API should prevent double voting)
    });
    return Promise.resolve(); // Placeholder implementation for API call
  },
}));

if (useAuthStore.getState().token) {
  useAuthStore.getState().fetchUser();
}
