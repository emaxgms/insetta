const fs = require('fs');
const https = require('https');

// Funzione per ottenere coordinate tramite Nominatim
async function getCoordinatesFromNominatim(cityName, region) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(`${cityName}, ${region}, Italy`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
    
    https.get(url, { headers: { 'User-Agent': 'SardiniaCitiesApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results && results.length > 0) {
            resolve([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
    
    // Rispetta i limiti di utilizzo di Nominatim
    setTimeout(() => {}, 1000);
  });
}

// Funzione principale
async function createCorrectedDataset() {
  try {
    // Leggi il dataset attuale
    const rawData = fs.readFileSync('sardinian-cities.json', 'utf8');
    const cities = JSON.parse(rawData);
    
    const correctedCities = [];
    
    for (const city of cities) {
      console.log(`Verificando ${city.name}...`);
      
      try {
        // Ottieni coordinate corrette da Nominatim
        const coordinates = await getCoordinatesFromNominatim(city.name, "Sardegna");
        
        if (coordinates) {
          correctedCities.push({
            name: city.name,
            coordinates: coordinates
          });
          console.log(`  ✓ Coordinate aggiornate`);
        } else {
          // Se non troviamo coordinate nuove, manteniamo quelle originali
          correctedCities.push(city);
          console.log(`  ! Mantenute coordinate originali`);
        }
        
        // Attendi 1 secondo per rispettare i limiti di utilizzo
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`  ✗ Errore per ${city.name}: ${error.message}`);
        correctedCities.push(city); // Manteniamo i dati originali in caso di errore
      }
    }
    
    // Salva il dataset corretto
    fs.writeFileSync('sardinian-cities-corrected.json', JSON.stringify(correctedCities, null, 2));
    console.log(`Dataset corretto salvato con ${correctedCities.length} comuni.`);
  } catch (error) {
    console.error(`Errore generale: ${error.message}`);
  }
}

createCorrectedDataset();