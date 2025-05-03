import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithCredential,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { createOrUpdateUserProfile } from '../utils/db';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const user = result.user;
          console.log("✅ Utente autenticato:", user);
        }
      })
      .catch((error) => {
        console.error("❌ Errore durante il redirect:", error);
      });
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      console.log('Utente attuale:', currentUser);
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log('isMobile:', isMobile);
    setLoading(true);
    try {
      if (true) {
        await signInGoogleCredentials();
        // await signInWithRedirect(auth, googleProvider);
      }else{
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
    }
  };
  const signInGoogleCredentials = async () => {
    window.google.accounts.id.disableAutoSelect();
    window.google.accounts.id.cancel(); // Resetta sessione pendente
    window.google.accounts.id.initialize({
      client_id: "752286225974-v4oh45b80n5mq9i22uhjdu2b4n77l49s.apps.googleusercontent.com", // <-- Sostituisci con il tuo client ID
      callback: handleCredentialResponse,
      ux_mode: 'redirect',
      login_uri: 'https://intzetta.ema.lat/login-callback',
      auto_select: false,
      // log_level: 'debug'
    });
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        setLoading(false);
        console.warn("⚠️ Login non mostrato:", notification.getNotDisplayedReason());
      } else if (notification.isSkippedMoment()) {
        console.warn("⚠️ Login saltato:", notification.getSkippedReason());
        setLoading(false);
      } else if (notification.isDismissedMoment()) {
        console.warn("⚠️ Login chiuso:", notification.getDismissedReason());
        setLoading(false);
      }
    });
  };
  const handleCredentialResponse = async (response) => {
    try {
      console.log("✅ Response:", response);
      const idToken = response.credential;
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      console.log("✅ Login riuscito:", result.user);
      await createOrUpdateUserProfile(user.uid,{username: user.displayName, photoURL: user.photoURL});
    } catch (error) {
      console.error("❌ Errore login Firebase:", error);
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
      {loading && (
        <div className="overlay">
          <div className="spinner">Caricamento...</div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);