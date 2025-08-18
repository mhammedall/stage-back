require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seedAll() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    console.log('🚀 Connected to database. Starting comprehensive seeding...\n');

    console.log('👥 SEEDING USERS...');
    
    await connection.query('DELETE FROM users');
    console.log('   Cleared existing users');

    const sampleUsers = [
      {
        first_name: 'Admin',
        last_name: 'System',
        email: 'admin@company.com',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        num_tel: '+1-555-0001',
        entreprise: 'System Administration'
      },
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@company.com',
        username: 'sarah.admin',
        password: 'admin123',
        role: 'admin',
        num_tel: '+1-555-0002',
        entreprise: 'IT Department'
      },
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
        username: 'john.doe',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1001',
        entreprise: 'Marketing'
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@company.com',
        username: 'jane.smith',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1002',
        entreprise: 'Sales'
      },
      {
        first_name: 'Robert',
        last_name: 'Wilson',
        email: 'robert.wilson@company.com',
        username: 'robert.wilson',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1003',
        entreprise: 'Engineering'
      },
      {
        first_name: 'Emily',
        last_name: 'Davis',
        email: 'emily.davis@company.com',
        username: 'emily.davis',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1004',
        entreprise: 'Human Resources'
      }
    ];

    for (const user of sampleUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await connection.query(
        `INSERT INTO users (first_name, last_name, email, username, password, role, num_tel, entreprise) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.first_name, user.last_name, user.email, user.username, hashedPassword, user.role, user.num_tel, user.entreprise]
      );
      console.log(`   ✓ ${user.role === 'admin' ? '👑' : '👤'} ${user.first_name} ${user.last_name} (${user.username})`);
    }

    const adminCount = sampleUsers.filter(u => u.role === 'admin').length;
    const userCount = sampleUsers.filter(u => u.role === 'user').length;
    console.log(`   📊 Inserted ${adminCount} admins and ${userCount} users\n`);

    console.log('🏢 SEEDING ROOMS...');
    
    await connection.query('DELETE FROM rooms');
    console.log('   Cleared existing rooms');

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
        name: 'Espace Formation Gamma',
        capacity: 15,
        floor: 1,
        room_type: 'training',
        location: 'Aile Sud, 1er étage',
        amenities: 'Tableaux interactifs, Ordinateurs portables, Projecteur, Système audio',
        image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500'
      },
      {
        name: 'Bureau Exécutif Delta',
        capacity: 4,
        floor: 3,
        room_type: 'office',
        location: 'Aile Nord, 3ème étage',
        amenities: 'Bureau en bois massif, Fauteuils en cuir, Écran 4K, Téléphone de conférence',
        image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500'
      },
      {
        name: 'Salle de Pause Epsilon',
        capacity: 12,
        floor: 2,
        room_type: 'break_room',
        location: 'Centre, 2ème étage',
        amenities: 'Machine à café, Réfrigérateur, Micro-ondes, Tables hautes, Canapés',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'
      }
    ];

    for (const room of sampleRooms) {
      await connection.query(
        'INSERT INTO rooms (name, capacity, floor, room_type, location, amenities, image, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [room.name, room.capacity, room.floor, room.room_type, room.location, room.amenities, room.image, true]
      );
      console.log(`   ✓ 🏠 ${room.name} (${room.capacity} places)`);
    }

    console.log(`   📊 Inserted ${sampleRooms.length} rooms\n`);

    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════');
    console.log(`👥 Users: ${sampleUsers.length} total (${adminCount} admins, ${userCount} users)`);
    console.log(`🏢 Rooms: ${sampleRooms.length} total`);
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('   👑 Admin: admin / admin123');
    console.log('   👤 User:  john.doe / user123');
    console.log('\n📝 All users follow the pattern:');
    console.log('   Admins: username / admin123');
    console.log('   Users:  username / user123');

    await connection.end();
  } catch (error) {
    console.error('❌ Comprehensive seeding failed:', error);
    process.exit(1);
  }
}

seedAll();
