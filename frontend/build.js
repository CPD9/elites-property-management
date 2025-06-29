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
  process.env.NODE_OPTIONS = '--max-old-space-size=4096 --openssl-legacy-provider';
  process.env.SKIP_PREFLIGHT_CHECK = 'true';
  
  console.log('🔧 Fixing dependencies...');
  
  // Remove problematic packages and reinstall
  try {
    execSync('rm -rf node_modules package-lock.json', { stdio: 'pipe' });
  } catch (e) {
    // Ignore if files don't exist
  }
  
  console.log('📦 Installing dependencies with legacy peer deps...');
  execSync('npm install --legacy-peer-deps --no-audit --no-fund', { stdio: 'inherit' });
  
  // Force install specific working versions
  console.log('🔧 Installing working dependency versions...');
  execSync('npm install ajv@8.12.0 --legacy-peer-deps --no-audit', { stdio: 'pipe' });
  
  console.log('🔨 Building project...');
  execSync('npx react-scripts build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // Fallback: try with different Node options
  console.log('🔄 Trying fallback build...');
  try {
    process.env.NODE_OPTIONS = '--max-old-space-size=4096';
    execSync('CI=false GENERATE_SOURCEMAP=false npx react-scripts build', { stdio: 'inherit' });
    console.log('✅ Fallback build succeeded!');
  } catch (fallbackError) {
    console.error('❌ Fallback build also failed:', fallbackError.message);
    process.exit(1);
  }
}