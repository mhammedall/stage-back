require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedRooms() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    console.log('Connected to database. Seeding rooms...');

    await connection.query('DELETE FROM rooms');
    console.log('Cleared existing rooms');

    const sampleRooms = [
      {
        name: 'Salle de Réunion Alpha',
        capacity: 8,
        floor: 1,
        room_type: 'meeting',
        location: 'Aile Est, 1er étage',
        amenities: 'Écran TV 55", Tableau blanc, Système de visioconférence, WiFi, Climatisation',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500'
      },
      {
        name: 'Salle de Conférence Beta',
        capacity: 20,
        floor: 2,
        room_type: 'conference',
        location: 'Aile Ouest, 2ème étage',
        amenities: 'Projecteur 4K, Système audio, Microphones, Écran géant, Éclairage modulable',
        image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=500'
      },
      {
        name: 'Salle de Formation Gamma',
        capacity: 15,
        floor: 1,
        room_type: 'training',
        location: 'Aile Nord, 1er étage',
        amenities: 'Tables modulables, Écran interactif, Ordinateurs portables, Tableau blanc',
        image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500'
      },
      {
        name: 'Bureau Exécutif Delta',
        capacity: 4,
        floor: 3,
        room_type: 'office',
        location: 'Aile Sud, 3ème étage',
        amenities: 'Bureau en bois, Fauteuils en cuir, Écran 32", Téléphone, Coffre-fort',
        image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=500'
      },
      {
        name: 'Espace Détente Epsilon',
        capacity: 12,
        floor: 1,
        room_type: 'break_room',
        location: 'Centre, 1er étage',
        amenities: 'Canapés, Machine à café, Réfrigérateur, Micro-ondes, TV, Jeux de société',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500'
      },
      {
        name: 'Salle de Réunion Zeta',
        capacity: 6,
        floor: 2,
        room_type: 'meeting',
        location: 'Aile Est, 2ème étage',
        amenities: 'Écran TV 43", Tableau blanc, Téléphone de conférence, WiFi',
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500'
      },
      {
        name: 'Auditorium Eta',
        capacity: 50,
        floor: 0,
        room_type: 'conference',
        location: 'Rez-de-chaussée, Hall principal',
        amenities: 'Scène, Projecteur haute définition, Système audio professionnel, Éclairage scénique',
        image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=500'
      },
      {
        name: 'Salle de Créativité Theta',
        capacity: 10,
        floor: 2,
        room_type: 'meeting',
        location: 'Aile Créative, 2ème étage',
        amenities: 'Murs d\'écriture, Matériel de brainstorming, Écran tactile, Mobilier modulable',
        image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500'
      }
    ];

    for (const room of sampleRooms) {
      await connection.query(
        'INSERT INTO rooms (name, capacity, floor, room_type, location, amenities, image, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [room.name, room.capacity, room.floor, room.room_type, room.location, room.amenities, room.image, true]
      );
      console.log(`✓ Inserted room: ${room.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${sampleRooms.length} rooms!`);
    await connection.end();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedRooms();
