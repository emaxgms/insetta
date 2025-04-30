import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile   } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      console.log('Utente attuale:', currentUser);
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Errore durante il login:', error);
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login riuscito:', userCredential.user);
      setUser(userCredential.user);
      return { success: true, created: false };
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          console.log('Utente registrato:', userCredential.user);
          setUser(userCredential.user);
          return { success: true, created: true };
        } catch (signupError) {
          console.error('Errore durante la registrazione:', JSON.stringify(signupError));
          return { success: false, message: signupError.message };
        }
      } else if (error.code === 'auth/weak-password'){
        console.error('La password deve contenere almeno 6 caratteri.');
        return { success: false, message: 'La password deve contenere almeno 6 caratteri.' };
      } else {
        console.error('Errore login:', error);
        return { success: false, message: error.message };
      }
    }
  };
  
  const updateUserProfile = async (profileUpdates) => {
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          ...profileUpdates,
        });
        setUser(prev => ({
          ...prev,
          ...profileUpdates // solo i campi che hai cambiato, es. displayName, photoURL
        }));
        console.log('Profilo aggiornato:', profileUpdates);
        console.log(user);
      } catch (error) {
        console.error('Errore durante l\'aggiornamento del profilo:', error);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signInWithEmail, logout, loading, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);