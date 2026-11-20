import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function aiDispatcherProxyPlugin(): Plugin {
  return {
    name: 'ai-dispatcher-proxy',
    configureServer(server) {
      server.middlewares.use('/api/dispatch', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { candidates, baselineMetrics } = JSON.parse(body);
            const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

            if (!apiKey) {
              // No API key present: return offline flag so client runs deterministic template
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ hasApiKey: false }));
              return;
            }

            // Call Gemini API through the server-side proxy
            const systemPrompt = `You are an airline network crisis recovery dispatcher for Domino Sky.
Given the candidate recovery actions and baseline impact metrics, select up to 3 best action IDs.
CRITICAL MANDATORY RULE:
YOU MUST NEVER PRODUCE ANY DIGITS (0-9) OR NUMBERS IN YOUR EXPLANATION TEXT.
All metrics must strictly be represented with placeholders:
- {{stranded_before}}
- {{stranded_after}}
- {{delay_saved}}
- {{stranded_saved}}
- {{connections_saved}}
- {{crew_breaches_resolved}}
- {{shift_score_delta}}
Do not write "100" or "45 minutes" or "two" - write {{delay_saved}} minutes.
Respond with pure valid JSON matching this schema:
{
  "chosen_action_ids": ["ACT-..."],
  "explanation": "Tactical summary using placeholders only..."
}`;

            const userPrompt = `Baseline metrics:
Total delay minutes: ${baselineMetrics.total_delay_minutes}
Stranded passengers: ${baselineMetrics.stranded_passengers}
Crew breaches: ${baselineMetrics.crew_breaches}

Available candidates:
${JSON.stringify(candidates, null, 2)}`;

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            const response = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                  response_mime_type: 'application/json',
                  temperature: 0.2,
                },
              }),
            });

            if (!response.ok) {
              const errText = await response.text();
              console.warn('Gemini proxy error:', errText);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ hasApiKey: true, error: errText, fallback: true }));
              return;
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = JSON.parse(text || '{}');

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ hasApiKey: true, result: parsed }));
          } catch (err: any) {
            console.error('AI dispatch proxy error:', err);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ hasApiKey: false, error: err.message, fallback: true }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), aiDispatcherProxyPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
