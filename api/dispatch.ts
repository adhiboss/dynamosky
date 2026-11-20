export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { candidates, baselineMetrics } = body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({ hasApiKey: false });
    }

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
Total delay minutes: ${baselineMetrics?.total_delay_minutes}
Stranded passengers: ${baselineMetrics?.stranded_passengers}
Crew breaches: ${baselineMetrics?.crew_breaches}

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
      return res.status(200).json({ hasApiKey: true, error: errText, fallback: true });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text || '{}');

    return res.status(200).json({ hasApiKey: true, result: parsed });
  } catch (err: any) {
    return res.status(200).json({ hasApiKey: false, error: err.message, fallback: true });
  }
}
