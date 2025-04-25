import { useState, useEffect } from 'react';
// import { auth, googleProvider } from '../firebase';
// import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export default function Auth() {
  // const [user, setUser] = useState(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   // Questo monitorizza lo stato di autenticazione
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     console.log('Auth state changed:', user);  // Log di debug
  //     setUser(user);
  //     setLoading(false);  // Caricamento finito
  //   });

  //   // Cleanup dell'effetto
  //   return () => unsubscribe();
  // }, []);

  // const handleGoogleSignIn = async () => {
  //   try {
  //     console.log("Attempting Google sign-in...");
  //     await signInWithPopup(auth, googleProvider);
  //     console.log("Sign-in successful!");
  //   } catch (error) {
  //     console.error('Error signing in with Google:', error);
  //   }
  // };

  // const handleSignOut = async () => {
  //   try {
  //     await signOut(auth);
  //     console.log("Sign-out successful!");
  //   } catch (error) {
  //     console.error('Error signing out:', error);
  //   }
  // };

  // if (loading) {
  //   return <div>Loading...</div>;  // Mostra "Loading..." mentre l'autenticazione è in corso
  // }

  return (
    <>
      <div className="auth-container">
        {/* {user ? (
          <div className="user-info">
            <img src={user.photoURL} alt="User avatar" className="user-avatar" />
            <span className="user-name">{user.displayName}</span>
            <button onClick={handleSignOut} className="sign-out-btn">
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={handleGoogleSignIn} className="google-sign-in-btn">
            Sign in with Google
          </button>
        )} */}
        
      </div>
      <p>Prova</p>
    </>
    
  );
}
