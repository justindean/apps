import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import type { IncomingMessage } from 'http'

/**
 * Dev-only middleware that proxies /api/transcribe to OpenAI Whisper.
 * Used by iOS Safari "Capture Mode" during local development.
 */
function transcribePlugin(): Plugin {
  let apiKey: string | undefined

  return {
    name: 'transcribe-dev',
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), '')
      apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    },
    configureServer(server) {
      server.middlewares.use('/api/transcribe', async (req: IncomingMessage, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'POST required' }))
          return
        }

        const key = apiKey || process.env.OPENAI_API_KEY
        if (!key) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }))
          return
        }

        try {
          // Collect raw body
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
          }
          const body = Buffer.concat(chunks)

          // Parse multipart boundary from content-type header
          const contentType = req.headers['content-type'] ?? ''

          // Forward as-is to OpenAI Whisper (the browser sends multipart/form-data)
          const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': contentType,
            },
            body,
          })

          const data = await whisperResp.text()
          res.writeHead(whisperResp.status, { 'Content-Type': 'application/json' })
          res.end(data)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: msg }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), transcribePlugin()]
})
