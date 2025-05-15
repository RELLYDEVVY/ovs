import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.ts';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  isFingerprintVerified?: boolean;
}

interface AuthContextType {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, password: string, role: string, name?: string) => Promise<void>;
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  recordVote: (electionId: string, candidateId: string) => Promise<void>;
  hasUserVoted: (electionId: string) => boolean; // Added to check if user voted
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { login, logout, register, isAuthenticated, user, loading, recordVote, hasUserVoted } = useAuthStore();

  const handleLogin = async (username: string, password: string) => {
    try {
      await login(username, password);
      navigate('/elections');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRegister = async (username: string, password: string, role: string, name?: string) => {
    try {
      await register(username, password, role, name);
      navigate('/elections');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const handleRecordVote = async (electionId: string, candidateId: string) => {
    try {
      await recordVote(electionId, candidateId);
      // Optionally, navigate or show a success message after voting
      // For example, navigate back to the elections list or show a toast
      // navigate('/elections'); 
      console.log('Vote handled by AuthContext, needs actual implementation in store for API call');
    } catch (error) {
      console.error('AuthContext: Failed to record vote:', error);
      // Potentially show a user-facing error message here
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        login: handleLogin,
        logout: handleLogout,
        register: handleRegister,
        isAuthenticated,
        user,
        loading,
        recordVote: handleRecordVote,
        hasUserVoted, // Pass hasUserVoted to context
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
