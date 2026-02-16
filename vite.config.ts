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
          // Collect raw body without using Buffer type directly
          const chunks: Uint8Array[] = []
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : new Uint8Array(chunk))
          }
          const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
          const body = new Uint8Array(totalLength)
          let offset = 0
          for (const chunk of chunks) {
            body.set(chunk, offset)
            offset += chunk.length
          }

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

/**
 * Dev-only middleware that proxies /api/classify to OpenAI Chat for LLM intent classification.
 */
function classifyPlugin(): Plugin {
  let apiKey: string | undefined

  return {
    name: 'classify-dev',
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), '')
      apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    },
    configureServer(server) {
      server.middlewares.use('/api/classify', async (req: IncomingMessage, res) => {
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
          const chunks: Uint8Array[] = []
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : new Uint8Array(chunk))
          }
          const bodyStr = new TextDecoder().decode(
            chunks.reduce((acc, c) => {
              const merged = new Uint8Array(acc.length + c.length)
              merged.set(acc, 0)
              merged.set(c, acc.length)
              return merged
            }, new Uint8Array())
          )

          const { transcript, systemPromptOverride } = JSON.parse(bodyStr)

          const systemPrompt = systemPromptOverride as string

          const userPrompt = `Transcript: "${transcript}"\nTone: Neutral`

          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              temperature: 0.2,
              max_tokens: 300,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
            }),
          })

          if (!resp.ok) {
            const errText = await resp.text()
            res.writeHead(resp.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: `OpenAI: ${errText.slice(0, 200)}` }))
            return
          }

          const data = await resp.json() as { choices?: { message?: { content?: string } }[] }
          const content = data.choices?.[0]?.message?.content
          if (!content) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'No response from model' }))
            return
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(content)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Classification failed'
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: msg }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), transcribePlugin(), classifyPlugin()]
})
