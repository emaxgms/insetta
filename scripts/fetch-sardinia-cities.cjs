const fs = require('fs');
const https = require('https');

async function fetchSardiniaCities() {
  // Query modificata per trovare i comuni della Sardegna usando il codice regionale italiano
  const overpassQuery = `
    [out:json];
    area["ISO3166-2"="IT-88"]->.sardinia;
    (
      relation["admin_level"="8"](area.sardinia);
    );
    out center;
  `;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SardiniaCitiesCollector/1.0 (emaxgms@gmail.com)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log("Risposta API ricevuta:", jsonData);
          
          // Estrai i dati dai risultati
          const cities = jsonData.elements.map(element => {
            // Per gli elementi way e relation, ottieni il centro
            let lat, lon, name;
            if (element.type === 'node') {
              lat = element.lat;
              lon = element.lon;
            } else if (element.center) {
              lat = element.center.lat;
              lon = element.center.lon;
            }
            
            name = element.tags ? element.tags.name : null;
            
            if (name && lat && lon) {
              return {
                name: name,
                coordinates: [lat, lon]
              };
            }
            return null;
          }).filter(city => city !== null);
          
          resolve(cities);
        } catch (error) {
          reject(`Errore durante il parsing dei dati: ${error.message}`);
        }
      });
    });

    req.on('error', (error) => {
      reject(`Errore durante la richiesta: ${error.message}`);
    });

    req.write(overpassQuery);
    req.end();
  });
}

async function main() {
  try {
    console.log("Scaricamento dei dati in corso...");
    const cities = await fetchSardiniaCities();
    console.log(`Scaricati ${cities.length} comuni della Sardegna.`);
    
    // Salva i dati in un file JSON
    fs.writeFileSync('sardinian-cities.json', JSON.stringify(cities, null, 2));
    console.log("File JSON creato con successo: sardinian-cities.json");
  } catch (error) {
    console.error("Si è verificato un errore:", error);
  }
}

main();