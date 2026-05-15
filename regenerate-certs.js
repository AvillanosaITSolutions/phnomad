#!/usr/bin/env node

const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, 'certs');

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Generate RSA key pair
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Write key
fs.writeFileSync(path.join(certsDir, 'key.pem'), privateKey);
console.log('✓ Generated private key');

// For a self-signed cert, we'd need to use a library like node-forge or mkcert
// For now, we'll use a simpler approach with basic crypto
// This creates a minimal self-signed cert structure

const { execSync } = require('child_process');

try {
  // Try using wsl openssl
  execSync(`wsl openssl req -x509 -new -key ${path.join(certsDir, 'key.pem')} -out ${path.join(certsDir, 'cert.pem')} -days 365 -subj '/C=PH/ST=Manila/L=Manila/O=VisaReminder/CN=localhost'`, {
    stdio: 'inherit'
  });
  console.log('✓ Generated certificate with WSL openssl');
} catch (e) {
  console.error('Failed to generate certificate. Make sure WSL is installed or use: openssl req -x509 -new -key certs/key.pem -out certs/cert.pem -days 365 -subj "/C=PH/ST=Manila/L=Manila/O=VisaReminder/CN=localhost"');
  process.exit(1);
}
