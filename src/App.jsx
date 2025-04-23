import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import citiesData from './data/sardinian-cities.json';
// import Leaderboard from './components/Leaderboard';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TOTAL_ROUNDS = 5;

function MapClickHandler({ onClick }) {
  useMapEvents({
    click: onClick,
  });
  return null;
}

function StartPage({ onStart }) {
  return (
    <div className="start-page">
      <h1 onClick={onStart}>Insetta</h1>
      {/* <Leaderboard maxPlayers={5} /> */}
    </div>
  );
}

function EndPage({ score, onRestart }) {
  return (
    <div className="end-page">
      <h1>Game Over!</h1>
      <h2>Final Score: {score}</h2>
      <button className="button" onClick={onRestart}>
        Play Again
      </button>
      {/* <Leaderboard maxPlayers={10} /> */}
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
  const [usedCities, setUsedCities] = useState([]);

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

    let points = 0;
    if (distanceInKm <= 2) points = 1000;
    else if (distanceInKm <= 5) points = 800;
    else if (distanceInKm <= 10) points = 500;
    else points = 100;

    setScore(prevScore => prevScore + points);
    setShowResult(true);
  };

  const handleNextRound = () => {
    if (currentRound < TOTAL_ROUNDS) {
      setCurrentRound(prev => prev + 1);
      selectNewCity();
    } else {
      onGameEnd(score);
    }
  };

  return (
    <>
      <div className="game-overlay">
        <div className="city-prompt">
          {currentCity ? currentCity.name : 'Loading...'}
        </div>
        
        <div className="score-display">
          {score}
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
          <Marker position={selectedPosition} />
        )}

        {showResult && currentCity && (
          <>
            <Marker position={currentCity.coordinates} />
            <Circle
              center={currentCity.coordinates}
              radius={2000}
              pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.2 }}
            />
          </>
        )}
      </MapContainer>
    </>
  );
}

function App() {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'end'
  const [finalScore, setFinalScore] = useState(0);

  const startGame = () => {
    setGameState('playing');
  };

  const endGame = (score) => {
    setFinalScore(score);
    setGameState('end');
  };

  const restartGame = () => {
    setGameState('start');
  };

  return (
    <div className="game-container">
      {gameState === 'start' && <StartPage onStart={startGame} />}
      {gameState === 'playing' && <Game onGameEnd={endGame} />}
      {gameState === 'end' && <EndPage score={finalScore} onRestart={restartGame} />}
    </div>
  );
}

export default App; 