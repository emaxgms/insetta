import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import citiesData from './data/sardinian-cities-corrected.json';
import Auth from './components/Auth';
import { upsertBestScore } from './utils/db';
import { useAuth } from './context/AuthContext';
import Leaderboard from './components/Leaderboard';
import BestScore from './components/BestScore';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TOTAL_ROUNDS = process.env.NODE_ENV === 'development' ? 1 : 8;

function MapClickHandler({ onClick }) {
  useMapEvents({
    click: onClick,
  });
  return null;
}

function StartPage({ onStart }) {
  return (
    <div className="start-page">
      <header>
        <div className="logo">
          <img src="/logo-t.svg" alt="Logo" />
        </div>
        <Auth/>
      </header>
      <section className='intro'>
        <h1>SCOPRI LA SARDEGNA!</h1>
        <h2>Da Bitti a Teulada, trova ogni paese sulla mappa.<br />Gioca ora e scopri quante ne Intzetti!</h2>
        <button className='play' onClick={onStart} title='Inizia a Giocare'>INTZETTA!</button>
      </section>
      <section className="stats">
        <Leaderboard maxPlayers={5} />
        <BestScore />
      </section>
      <footer className="legal-links">
        <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        <span className='gap'> | </span>
        <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer">Termini di Servizio</a>
      </footer>
    </div>
  );
}

function EndPage({ score, onRestart, refreshData }) {
  return (
    <div className="end-page">
      <header>
        <div className="logo">
          <img src="/logo-t.svg" alt="Logo" />
        </div>
        <Auth/>
      </header>
      <div className="finalMessage">
        {score === 0 && <h1>No asi intzettau nudda!</h1>}
        {score > 0 && score <= 2500 && <h1>Caddu lanzu, musca meda!</h1>}
        {score > 2500 && score <= 5000 && <h1>Intzettare non è il tuo forte!</h1>}
        {score > 5000 && score <= 9000 && <h1>Bonu po fundi a Santu Ingiu!</h1>}
        {score > 9000 && score <= 20000 && <h1>Ndasi intzettau una pariga!</h1>}
        {score > 20000 && score <= 30000 && <h1>Bravu complimenti!</h1>}
        {score > 30000 && score < 40000 && <h1>Bravu Meda!</h1>}
        {score == 40000 && <h1>Ses un Intzettadori!</h1>}
      </div>
      <h2>Intzettati: {score}/{5000 * TOTAL_ROUNDS}</h2>
      <button className="button" onClick={onRestart}>
        Torra a Giogai
      </button>
      <section className="stats">
        <Leaderboard maxPlayers={10} refreshData={refreshData}/>
        <BestScore score={score} />
      </section>
    </div>
  );
}

function Game({ onGameEnd }) {
  const [currentCity, setCurrentCity] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [distance, setDistance] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [scoreRound, setScoreRound] = useState(0);
  const [usedCities, setUsedCities] = useState([]);
  const [resetMapView, setResetMapView] = useState(false);

  const markerIcon = L.icon({ 
    iconUrl: '/marker.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
  
  const sardiniaBounds = [
    [38.8, 8.1], // Southwest coordinates
    [41.3, 9.8]  // Northeast coordinates
  ];

  useEffect(() => {
    selectNewCity();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        if (!showResult && selectedPosition) {
          calculateScore();
        } else if (showResult) {
          if (currentRound < TOTAL_ROUNDS) {
            handleNextRound();
          } else {
            console.log('Game useEffect gameend');
            onGameEnd(score);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPosition, showResult, currentRound, score]);

  const selectNewCity = () => {
    const availableCities = citiesData.filter(city => !usedCities.includes(city.name));
    
    if (availableCities.length === 0) {
      setUsedCities([]);
      const randomCity = citiesData[Math.floor(Math.random() * citiesData.length)];
      setCurrentCity(randomCity);
    } else {
      const randomCity = availableCities[Math.floor(Math.random() * availableCities.length)];
      setCurrentCity(randomCity);
      setUsedCities(prev => [...prev, randomCity.name]);
    }
    
    setSelectedPosition(null);
    setShowResult(false);
    setDistance(null);
  };

  const handleMapClick = (e) => {
    if (!showResult) {
      setSelectedPosition(e.latlng);
    }
  };

  const calculateScore = () => {
    if (!selectedPosition || !currentCity) return;

    const from = turf.point([selectedPosition.lng, selectedPosition.lat]);
    const to = turf.point([currentCity.coordinates[1], currentCity.coordinates[0]]);
    const distanceInKm = turf.distance(from, to);
    setDistance(distanceInKm);
    console.log('Selected Position:', selectedPosition);
    console.log('Current City Coordinates:', currentCity.coordinates);
    console.log('Distance in Km:', distanceInKm);

    let points = calcScore(distanceInKm * 1000);
    console.log('Calculated Points:', points);
    
    setScoreRound(prev => prev + 1);
    setScore(prevScore => prevScore + points);
    setShowResult(true);
  };

  function calcScore(distanceInMeters) {
    const maxDistance = 50000;
  
    // Distanza minima per ottenere il punteggio massimo (50 metri)
    const perfectDistance = 1000;
    
    // Punteggio massimo possibile
    const maxScore = 5000;
    
    // Se la distanza è minore della perfectDistance, assegna il punteggio massimo
    if (distanceInMeters <= perfectDistance) {
      return maxScore;
    }
    // Se la distanza è maggiore della distanza massima, assegna punteggio minimo (0)
    if (distanceInMeters >= maxDistance) {
      return 0;
    }
    
    // Calcola il punteggio con decadimento esponenziale
    // Questo crea una curva che scende rapidamente all'inizio e poi più lentamente
    console.log('distanza: ' + distanceInMeters);
    const distanceRatio = (distanceInMeters - perfectDistance) / (maxDistance - perfectDistance);
    console.log('distanceRatio: ' + distanceRatio);
    const score = Math.round(maxScore * Math.pow(0.9, distanceRatio * 50));
    console.log('score: ' + score);
    
    // Assicurati che il punteggio sia tra 0 e maxScore
    return Math.max(0, Math.min(score, maxScore));
  };

  const handleNextRound = () => {
    if (currentRound < TOTAL_ROUNDS) {
      setResetMapView(true); // Attiva il reset della mappa
      setTimeout(() => setResetMapView(false), 0); // Disattiva subito dopo il rendering
      setCurrentRound(prev => prev + 1);
      selectNewCity();
    } else {
      onGameEnd(score);
    }
  };

  const CenterCity = ({ coordinates }) => {
    const map = useMap();
    
    useEffect(() => {
      map.setView(coordinates);
    }, [coordinates, map]);
    
    return null;
  };

  const CenterMap = ({}) => {
    const map = useMap();
    map.setView([40.1, 9.0], 8);
    
    return null;
  };

  return (
    <section className="game-page">
      <div className="game-overlay">
        <div className="city-prompt">
          {currentCity ? currentCity.name : 'Caricando...'}
        </div>
        
        <div className="score-display">
          {score}/{(scoreRound) * 5000}
          {distance && <div className="distance">{distance.toFixed(2)} km</div>}
        </div>

        <div className="round-display">
          {currentRound}/{TOTAL_ROUNDS}
        </div>

        <div className="game-controls">
          {!showResult && selectedPosition && (
            <button className="button" onClick={calculateScore}>
              Conferma
            </button>
          )}
          {showResult && (
            <button className="button" onClick={handleNextRound}>
              {currentRound < TOTAL_ROUNDS ? 'Prossimo' : 'Fine'}
            </button>
          )}
        </div>
      </div>
      <MapContainer
        center={[40.1, 9.0]}
        zoom={8}
        className="map-container"
        bounds={sardiniaBounds}
      >
        <MapClickHandler onClick={handleMapClick} />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        />
        
        {selectedPosition && (
          <Marker position={selectedPosition} icon={markerIcon} />
        )}

        {resetMapView && <CenterMap />}

        {showResult && currentCity && (
          <>
            <Marker position={currentCity.coordinates} icon={markerIcon} />
            <Circle
              center={currentCity.coordinates}
              radius={1000}
              pathOptions={{ color: 'purple', fillColor: 'purple', fillOpacity: 0.15 }}
            />
            <CenterCity coordinates={currentCity.coordinates} />
          </>
        )}
      </MapContainer>
    </section>
  );
}

function App() {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'end'
  const [finalScore, setFinalScore] = useState(0);
  const { user } = useAuth();
  const [refreshData, setRefreshData] = useState(false);

  const startGame = () => {
    setGameState('playing');
  };

  const endGame = async (score) => {
    setFinalScore(score);
    setGameState('end');
    if (user) {
      try {
        await upsertBestScore(user.uid, score);
        console.log('Punteggio salvato con successo!');
        setRefreshData((prev) => !prev); // Trigger a refresh of the leaderboard
      } catch (error) {
        console.error('Errore durante il salvataggio del punteggio:', error);
      }
    } else {
      console.log('Utente non autenticato, impossibile salvare il punteggio.');
    }
  };

  const restartGame = () => {
    setGameState('start');
  };

  return (
    <>
      {gameState === 'start' && <StartPage onStart={startGame} />}
      {gameState === 'playing' && <Game onGameEnd={endGame} />}
      {gameState === 'end' && <EndPage score={finalScore} onRestart={restartGame} refreshData={refreshData} />}
    </>
  );
}

export default App;