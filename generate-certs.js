const pem = require('pem');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

pem.createCertificate(
  {
    days: 365,
    selfSigned: true,
    commonName: 'localhost',
    country: 'PH',
    state: 'Manila',
    locality: 'Manila',
    organization: 'Visa Reminder',
  },
  (err, keys) => {
    if (err) {
      console.error('Error generating certificate:', err);
      process.exit(1);
    }

    // Write certificate
    fs.writeFileSync(path.join(certsDir, 'cert.pem'), keys.certificate);

    // Write key
    fs.writeFileSync(path.join(certsDir, 'key.pem'), keys.serviceKey);

    console.log('✓ SSL certificates generated successfully');
    console.log(`  - Certificate: ${path.join(certsDir, 'cert.pem')}`);
    console.log(`  - Private Key: ${path.join(certsDir, 'key.pem')}`);
  }
);
