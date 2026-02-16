import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

/** Dev-only middleware that proxies /api/realtime-token to OpenAI */
function realtimeTokenPlugin(): Plugin {
  let resolvedApiKey: string | undefined

  return {
    name: 'realtime-token-dev',
    configResolved(config) {
      // Load ALL env vars (including those without VITE_ prefix) for server-side use
      const env = loadEnv(config.mode, process.cwd(), '')
      resolvedApiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    },
    configureServer(server) {
      server.middlewares.use('/api/realtime-token', async (_req, res) => {
        const apiKey = resolvedApiKey || process.env.OPENAI_API_KEY
        console.log("[v0] Token endpoint hit. API key present:", !!apiKey, "resolved:", !!resolvedApiKey, "env:", !!process.env.OPENAI_API_KEY)
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing OPENAI_API_KEY. Add it in the Vars section of the sidebar.' }))
          return
        }
        try {
          const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini-realtime-preview-2024-12-17',
              voice: 'verse',
              modalities: ['text'],
              instructions:
                'You are a silent transcription assistant. Listen to the user speaking Spanish and transcribe what they say. Do not reply, just transcribe.',
            }),
          })
          const data = await resp.text()
          res.writeHead(resp.status, { 'Content-Type': 'application/json' })
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
  plugins: [react(), realtimeTokenPlugin()]
})
