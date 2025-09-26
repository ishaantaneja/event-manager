import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Event from './models/Event.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = 'admin123';
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });

    // Create regular users
    const userPassword = 'user123';
    const regularUser1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: userPassword,
      preferences: {
        categories: ['Technology', 'Music'],
        locations: ['New York', 'San Francisco']
      }
    });

    const regularUser2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: userPassword,
      preferences: {
        categories: ['Sports', 'Food'],
        locations: ['Los Angeles', 'Chicago']
      }
    });

    console.log('Created users');

    // Create sample events
    const events = [
      {
        name: 'Tech Conference 2025',
        description: 'Join us for the biggest tech conference of the year featuring speakers from top tech companies.',
        category: 'Technology',
        location: 'San Francisco',
        date: new Date('2025-10-15'),
        price: 299,
        organizer: adminUser._id,
        attendees: [regularUser1._id]
      },
      {
        name: 'Summer Music Festival',
        description: 'A three-day music festival featuring top artists from around the world.',
        category: 'Music',
        location: 'Los Angeles',
        date: new Date('2025-07-20'),
        price: 150,
        organizer: adminUser._id,
        attendees: [regularUser1._id, regularUser2._id]
      },
      {
        name: 'Food & Wine Expo',
        description: 'Taste the best cuisine and wines from renowned chefs and wineries.',
        category: 'Food',
        location: 'Chicago',
        date: new Date('2025-09-05'),
        price: 75,
        organizer: adminUser._id,
        attendees: [regularUser2._id]
      },
      {
        name: 'Marathon Championship',
        description: 'Annual city marathon with participants from around the globe.',
        category: 'Sports',
        location: 'New York',
        date: new Date('2025-11-10'),
        price: 50,
        organizer: adminUser._id,
        attendees: []
      },
      {
        name: 'Art Gallery Opening',
        description: 'Exclusive opening of contemporary art exhibition featuring emerging artists.',
        category: 'Art',
        location: 'New York',
        date: new Date('2025-08-15'),
        price: 0,
        organizer: adminUser._id,
        attendees: [regularUser1._id]
      },
      {
        name: 'Business Networking Summit',
        description: 'Connect with entrepreneurs and business leaders at this exclusive networking event.',
        category: 'Business',
        location: 'San Francisco',
        date: new Date('2025-09-20'),
        price: 125,
        organizer: adminUser._id,
        attendees: []
      },
      {
        name: 'Health & Wellness Expo',
        description: 'Discover the latest in health, fitness, and wellness trends.',
        category: 'Health',
        location: 'Los Angeles',
        date: new Date('2025-10-01'),
        price: 45,
        organizer: adminUser._id,
        attendees: [regularUser2._id]
      },
      {
        name: 'Education Innovation Forum',
        description: 'Exploring the future of education with technology and innovative teaching methods.',
        category: 'Education',
        location: 'Chicago',
        date: new Date('2025-11-25'),
        price: 85,
        organizer: adminUser._id,
        attendees: []
      }
    ];

    await Event.insertMany(events);
    console.log('Created sample events');

    console.log('✅ Database seeded successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User 1: john@example.com / user123');
    console.log('User 2: jane@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
