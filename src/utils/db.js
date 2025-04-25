import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Crea o aggiorna il profilo utente
export const createOrUpdateUserProfile = async (userId, userData) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    lastUpdated: new Date(),
  }, { merge: true });
};

// Ottieni il profilo utente
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

// Aggiorna il punteggio massimo dell'utente
export const updateUserHighScore = async (userId, newScore) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    throw new Error('User profile not found');
  }

  const currentHighScore = userSnap.data().highScore || 0;
  
  if (newScore > currentHighScore) {
    await updateDoc(userRef, {
      highScore: newScore,
      highScoreDate: new Date(),
    });
    return newScore;
  }
  
  return currentHighScore;
};

// Ottieni la classifica dei migliori punteggi
export const getLeaderboard = async (limit = 10) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('highScore', 'desc'), limit(limit));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}; 

// Recupera i migliori punteggi di un utente
export const getUserBestScores = async (userId) => {
  try {
    const q = query(
      collection(db, "scores"),
      where("userId", "==", userId),
      orderBy("score", "desc"),
      limit(10)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Errore nel recupero dei punteggi:", error);
    return [];
  }
};