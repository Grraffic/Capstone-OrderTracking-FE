import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // User roles based on the system requirements
  const USER_ROLES = {
    STUDENT: 'student',
    FINANCE: 'finance',
    PSAS: 'psas',
    STUDENT_ORG: 'student_org',
    ADMIN: 'admin'
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // In a real implementation, you would fetch the user role from your backend
        // For now, we'll determine role based on email domain or other criteria
        const role = await determineUserRole(user);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const determineUserRole = async (user) => {
    // This is a placeholder implementation
    // In a real app, you would call your backend API to get the user's role
    const email = user.email.toLowerCase();
    
    if (email.includes('finance')) {
      return USER_ROLES.FINANCE;
    } else if (email.includes('psas')) {
      return USER_ROLES.PSAS;
    } else if (email.includes('admin')) {
      return USER_ROLES.ADMIN;
    } else if (email.includes('org')) {
      return USER_ROLES.STUDENT_ORG;
    } else {
      return USER_ROLES.STUDENT;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const hasRole = (role) => {
    return userRole === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(userRole);
  };

  const value = {
    user,
    userRole,
    loading,
    USER_ROLES,
    signInWithGoogle,
    logout,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
