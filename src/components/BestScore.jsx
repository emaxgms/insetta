import { useState, useEffect } from 'react';
import { getUserBestScore } from '../utils/db';
import { useAuth } from '../context/AuthContext'; // Usa il contesto

export default function BestScore(refreshData) {
  const { user } = useAuth(); // Ottieni l'utente dal contesto
  const [bestScore, setBestScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBestScore = async () => {
      if (!user) {
        setBestScore(0); // Nessun utente autenticato
        setLoading(false);
        return;
      }

      try {
        const score = await getUserBestScore(user.uid); // Usa l'UID dell'utente
        setBestScore(score);
        setLoading(false);
      } catch (err) {
        setError('Errore nel caricamento del miglior punteggio: ' + err.message);
        setLoading(false);
      }
    };

    fetchBestScore();
  }, [user, refreshData]);

  if (loading) {
    return (
      <div className="best-score loading">
        <h2>Miglior Punteggio</h2>
        <div className="loading-spinner">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="best-score error">
        <h2>Miglior Punteggio</h2>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!user) {
    return null; // Non mostrare nulla se l'utente non è autenticato
  }

  return (
    <div className="best-score">
      <h2>Miglior Punteggio</h2>
      <p className="score">{bestScore !== null ? bestScore : 'Nessun punteggio registrato'}</p>
    </div>
  );
}