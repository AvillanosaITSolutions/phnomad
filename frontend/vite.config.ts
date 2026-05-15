import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function resolveHttpsConfig() {
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

  return false
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: resolveHttpsConfig(),
    port: 5173,
    host: true,
  },
})
