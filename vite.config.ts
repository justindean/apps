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
  return {
    name: 'classify-dev',
    configureServer(server) {
      server.middlewares.use('/api/classify', async (req: IncomingMessage, res) => {
        console.log(`[classify] HIT: ${req.method} ${req.url}`)
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'POST required' }))
          return
        }

        // Try multiple ways to get the key
        const env = loadEnv('development', process.cwd(), '')
        const key = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
        console.log(`[classify] key found: ${key ? key.slice(0, 8) + '...' : 'NONE'} (env: ${!!env.OPENAI_API_KEY}, process: ${!!process.env.OPENAI_API_KEY})`)
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

          console.log(`[classify] transcript: "${transcript}"`)

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
            console.log(`[classify] LLM ERROR: ${resp.status} ${errText.slice(0, 200)}`)
            res.writeHead(resp.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: `LLM ${resp.status}: ${errText.slice(0, 200)}` }))
            return
          }

          const data = await resp.json() as { choices?: { message?: { content?: string } }[] }
          const content = data.choices?.[0]?.message?.content
          console.log(`[classify] LLM response: ${content?.slice(0, 300)}`)
          if (!content) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'No response from model' }))
            return
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(content)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Classification failed'
          console.log(`[classify] CATCH error: ${msg}`)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: msg }))
        }
      })
    },
  }
}

/**
 * Dev-only middleware: /api/generate-reply — Step 2 of 2-step LLM flow.
 * Takes a known intent + transcript, picks the best reply from allowed set.
 */
function replyGeneratorPlugin(): Plugin {
  let apiKey: string | undefined

  return {
    name: 'reply-generator-dev',
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), '')
      apiKey = env.AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY || env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    },
    configureServer(server) {
      server.middlewares.use('/api/generate-reply', async (req: IncomingMessage, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'POST required' }))
          return
        }

        const key = apiKey || process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY
        if (!key) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Missing API key' }))
          return
        }

        const isGateway = !key.startsWith('sk-')
        const baseUrl = isGateway ? 'https://api.vercel.ai/v1' : 'https://api.openai.com/v1'
        const model = isGateway ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'

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

          const { systemPrompt, userPrompt } = JSON.parse(bodyStr)

          const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              temperature: 0.15,
              max_tokens: 200,
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
            res.end(JSON.stringify({ error: `LLM: ${errText.slice(0, 200)}` }))
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
          const msg = err instanceof Error ? err.message : 'Reply generation failed'
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: msg }))
        }
      })
    },
  }
}

/**
 * Dev-only middleware: /api/debug/openai-ping
 * Makes a tiny OpenAI call to verify connectivity and key validity.
 * Returns { ok, model, usage } so we can confirm tokens are flowing.
 */
function openaiPingPlugin(): Plugin {
  let apiKey: string | undefined

  return {
    name: 'openai-ping-dev',
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), '')
      apiKey = env.AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY || env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
    },
    configureServer(server) {
      server.middlewares.use('/api/debug/openai-ping', async (_req: IncomingMessage, res) => {
        const key = apiKey || process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY
        if (!key) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: 'No API key set (checked AI_GATEWAY_API_KEY and OPENAI_API_KEY)' }))
          return
        }

        const isGateway = !key.startsWith('sk-')
        const baseUrl = isGateway ? 'https://api.vercel.ai/v1' : 'https://api.openai.com/v1'
        const model = isGateway ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'

        try {
          console.log(`[openai-ping] Sending ping to ${model} via ${isGateway ? 'AI Gateway' : 'OpenAI direct'}...`)

          const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              temperature: 0,
              max_tokens: 5,
              messages: [
                { role: 'system', content: 'Reply with exactly: OK' },
                { role: 'user', content: 'ping' },
              ],
            }),
          })

          if (!resp.ok) {
            const errText = await resp.text()
            console.log(`[openai-ping] FAILED: ${resp.status} ${errText.slice(0, 200)}`)
            res.writeHead(resp.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: false, error: `OpenAI ${resp.status}: ${errText.slice(0, 200)}` }))
            return
          }

          const data = await resp.json() as {
            model?: string;
            usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
            choices?: { message?: { content?: string } }[];
          }

          const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
          const reply = data.choices?.[0]?.message?.content ?? '(no reply)'

          console.log(`[openai-ping] SUCCESS: model=${data.model} tokens=${usage.total_tokens} reply="${reply}"`)

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            ok: true,
            model: data.model,
            reply,
            usage,
            keyPrefix: `${key.slice(0, 7)}...${key.slice(-4)}`,
          }))
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Ping failed'
          console.log(`[openai-ping] ERROR: ${msg}`)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: msg }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), transcribePlugin(), classifyPlugin(), replyGeneratorPlugin(), openaiPingPlugin()],
})
