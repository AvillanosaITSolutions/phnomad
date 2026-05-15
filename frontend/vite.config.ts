import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function resolveHttpsConfig() {
  if (String(process.env.VITE_DEV_HTTPS ?? 'true').toLowerCase() === 'false') {
    return undefined
  }

  const candidateDirs = [
    path.resolve(__dirname, '../certs'),
    path.resolve(__dirname, './certs'),
  ]

  for (const certDir of candidateDirs) {
    const keyPath = path.join(certDir, 'key.pem')
    const certPath = path.join(certDir, 'cert.pem')
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      }
    }
  }

  return undefined
}

function resolveAllowedHosts() {
  const fromEnv = String(process.env.VITE_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (fromEnv.some((value) => value === '*' || value.toLowerCase() === 'all')) {
    return true
  }

  if (fromEnv.length > 0) {
    return fromEnv
  }

  return [
    'localhost',
    '127.0.0.1',
    'expatvisareminders.com',
    'www.expatvisareminders.com',
  ]
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: resolveHttpsConfig(),
    port: 5173,
    host: true,
    allowedHosts: resolveAllowedHosts(),
  },
})
