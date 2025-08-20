require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seedUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    console.log('Connected to database. Seeding users...');

    await connection.query('DELETE FROM users');
    console.log('Cleared existing users');

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
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'michael.chen@company.com',
        username: 'michael.admin',
        password: 'admin123',
        role: 'admin',
        num_tel: '+1-555-0003',
        entreprise: 'Operations'
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
      },
      {
        first_name: 'David',
        last_name: 'Brown',
        email: 'david.brown@company.com',
        username: 'david.brown',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1005',
        entreprise: 'Finance'
      },
      {
        first_name: 'Lisa',
        last_name: 'Garcia',
        email: 'lisa.garcia@company.com',
        username: 'lisa.garcia',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1006',
        entreprise: 'Design'
      },
      {
        first_name: 'James',
        last_name: 'Martinez',
        email: 'james.martinez@company.com',
        username: 'james.martinez',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1007',
        entreprise: 'Product Management'
      },
      {
        first_name: 'Maria',
        last_name: 'Rodriguez',
        email: 'maria.rodriguez@company.com',
        username: 'maria.rodriguez',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1008',
        entreprise: 'Customer Support'
      },
      {
        first_name: 'Thomas',
        last_name: 'Anderson',
        email: 'thomas.anderson@company.com',
        username: 'thomas.anderson',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1009',
        entreprise: 'Quality Assurance'
      },
      {
        first_name: 'Jennifer',
        last_name: 'Taylor',
        email: 'jennifer.taylor@company.com',
        username: 'jennifer.taylor',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1010',
        entreprise: 'Legal'
      },
      {
        first_name: 'Christopher',
        last_name: 'White',
        email: 'christopher.white@company.com',
        username: 'christopher.white',
        password: 'user123',
        role: 'user',
        num_tel: '+1-555-1011',
        entreprise: 'Research & Development'
      }
    ];

    console.log('Hashing passwords and inserting users...');

    for (const user of sampleUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await connection.query(
        `INSERT INTO users (first_name, last_name, email, username, password, role, num_tel, entreprise) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.first_name,
          user.last_name,
          user.email,
          user.username,
          hashedPassword,
          user.role,
          user.num_tel,
          user.entreprise
        ]
      );
      console.log(`✓ Inserted ${user.role}: ${user.first_name} ${user.last_name} (${user.username})`);
    }

    const adminCount = sampleUsers.filter(u => u.role === 'admin').length;
    const userCount = sampleUsers.filter(u => u.role === 'user').length;

    console.log(`\n🎉 Successfully seeded ${sampleUsers.length} users!`);
    console.log(`   👑 ${adminCount} Administrators`);
    console.log(`   👤 ${userCount} Regular Users`);
    console.log('\n📋 Login Credentials:');
    console.log('   Admins: username/admin123');
    console.log('   Users:  username/user123');
    console.log('\n🔐 Example logins:');
    console.log('   admin / admin123 (System Admin)');
    console.log('   john.doe / user123 (Regular User)');

    await connection.end();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedUsers();