import SHA256 from 'crypto-js/sha256'; // Importing SHA-256 hashing from crypto-js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const hardcodedPasswordHash = SHA256('Pass@1205').toString();  // The hash of the hardcoded password

interface AuthContextType {
  login: (password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  user: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<string | null>(null);  // Track user state
  const navigate = useNavigate();

  useEffect(() => {
    const storedHashedPassword = localStorage.getItem('hashedPassword');
    if (storedHashedPassword) {
      if (storedHashedPassword === hardcodedPasswordHash) {
        setUser('authenticated');
        // Don't auto-redirect here, let the router handle it or only redirect if on login page
        if (window.location.pathname === '/') {
           navigate('/dashboard');
        }
      } else {
        // Invalid hash
        localStorage.removeItem('hashedPassword');
      }
    }
    setIsLoading(false);
  }, [navigate]);

  const login = async (password: string) => {
    try {
      const hashedPassword = SHA256(password).toString();
      if (hashedPassword === hardcodedPasswordHash) {
        localStorage.setItem('hashedPassword', hashedPassword);
        setUser('authenticated');
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      toast.error('Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('hashedPassword');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, user }}>
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
