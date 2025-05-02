import { useState, useEffect } from 'react';
import { getLeaderboard } from '../utils/db';
import { auth } from '../firebase';

export default function Leaderboard({ maxPlayers = 10, refreshData }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const topPlayers = await getLeaderboard(maxPlayers);
        console.log('Classifica:', topPlayers);
        setLeaderboard(topPlayers);
        setLoading(false);
      } catch (err) {
        setError('Errore nel caricamento della classifica: ' + err.message);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [maxPlayers, refreshData]);

  if (loading) {
    return (
      <div className="leaderboard loading">
        <h2>Classifica</h2>
        <div className="loading-spinner">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard error">
        <h2>Classifica</h2>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2>Classifica</h2>
      <div className="leaderboard-list">
        {leaderboard.length === 0 ? (
          <p className="no-scores">Nessun punteggio ancora registrato</p>
        ) : (
          leaderboard.map((player, index) => (
            <div 
              key={player.id} 
              className={`leaderboard-item ${player.id === auth.currentUser?.uid ? 'current-user' : ''}`}
            >
              <span className="rank">{index + 1}°</span>
              <div className="player-info">
                {player.photoURL ?
                  <img 
                    src={player.photoURL || '/default-avatar.png'} 
                    alt={player.username} 
                    className="player-avatar"
                  />
                  : <div className="default-avatar"></div>
                }
                <span className="player-name">{player.username}</span>
              </div>
              <span className="score">{player.bestScore}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 