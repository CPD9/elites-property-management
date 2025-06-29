#!/usr/bin/env node

// Simple build script that bypasses problematic dependencies
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting custom build process...');

try {
  // Set environment variables
  process.env.CI = 'false';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  
  console.log('📦 Installing dependencies...');
  execSync('npm install --legacy-peer-deps --silent', { stdio: 'inherit' });
  
  console.log('🔨 Building project...');
  execSync('npx react-scripts build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}