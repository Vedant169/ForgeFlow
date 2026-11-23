'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const seedAdmin = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/etl_pipeline';
  const adminName = process.env.ADMIN_NAME || 'Admin User';
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@flowforge.local').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'FlowForge2026!';

  console.log(`[seed] Connecting to MongoDB: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    const existing = await User.findOne({ email: adminEmail });
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    if (existing) {
      existing.name = adminName;
      existing.password = hashedPassword;
      existing.role = 'admin';
      await existing.save();
      console.log(`[seed] Updated existing administrator account: ${adminEmail}`);
    } else {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log(`[seed] Created new administrator account: ${adminEmail}`);
    }
  } catch (err) {
    console.error('[seed] Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('[seed] Database connection closed.');
  }
};

seedAdmin();
