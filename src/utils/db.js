import { db } from '../firebase';
import { doc, setDoc, getDoc, addDoc, updateDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Crea o aggiorna il profilo utente
export const createOrUpdateUserProfile = async (userId, userData) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...userData,
    lastModifiedDate: new Date(),
  }, { merge: true });
};
export const checkIfUserExists = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists(); // Restituisce true se il documento esiste, false altrimenti
  } catch (error) {
    console.error('Errore durante il controllo dell\'esistenza del documento:', error);
    throw error;
  }
};
// Ottieni il profilo utente
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

// Aggiorna il punteggio massimo dell'utente
export const upsertBestScore = async (userId, newScore) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  console.log('dentro Upsert');
  if (!userSnap.exists()) {
    throw new Error('User profile not found');
  }

  const currentBestScore = userSnap.data().bestScore || 0;
  
  if (newScore > currentBestScore) {
    await updateDoc(userRef, {
      bestScore: newScore,
      bestScoreDate: new Date(),
    });
    return newScore;
  }
  
  return currentBestScore;
};

// Ottieni la classifica dei migliori punteggi
export const getLeaderboard = async (maxPlayers = 10) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('bestScore', 'desc'), limit(maxPlayers));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}; 

// Recupera i migliori punteggi di un utente
export const getUserBestScore = async (userId) => {
  try {
    const bestScoreRef = doc(db, 'users', userId);

    const docSnap = await getDoc(bestScoreRef);

    if (docSnap.exists()) {
      return docSnap.data().bestScore;
    }
    return null;
  } catch (error) {
    console.error('Error querying score: ', error);
  }
};