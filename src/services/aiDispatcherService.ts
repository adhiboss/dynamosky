import {
  ActionCandidate,
  NetworkMetrics,
  validateDispatcherResponse,
  generateFallbackDispatcherResponse,
  hydrateDispatcherResponse,
  HydratedDispatcherResponse,
  DispatcherRawResponse,
} from '../engine';

export async function requestAIDispatcherPlan(
  candidates: ActionCandidate[],
  baselineMetrics: NetworkMetrics
): Promise<HydratedDispatcherResponse> {
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidates: candidates.slice(0, 10), // Pass top 10 candidates
          baselineMetrics,
          attempt,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();

      // If server reported offline / no api key or fallback flag
      if (!json.hasApiKey || json.fallback || !json.result) {
        const fallback = generateFallbackDispatcherResponse(candidates, baselineMetrics);
        return hydrateDispatcherResponse(fallback, candidates, baselineMetrics, true);
      }

      const rawResult: DispatcherRawResponse = json.result;

      // Validate AI result strictly:
      // - Must not contain digits outside placeholders
      // - Must not contain unknown placeholders
      // - Must only contain actions from the candidate list
      const validation = validateDispatcherResponse(rawResult, candidates);

      if (validation.valid) {
        return hydrateDispatcherResponse(rawResult, candidates, baselineMetrics, false);
      }

      console.warn(`AI Dispatcher response validation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, validation.error);
    } catch (err) {
      console.warn(`AI Dispatcher network error on attempt ${attempt + 1}:`, err);
    }
  }

  // If retries exhausted or network unavailable: deterministic template fallback
  console.info('Switching to deterministic template fallback for AI dispatcher.');
  const fallback = generateFallbackDispatcherResponse(candidates, baselineMetrics);
  return hydrateDispatcherResponse(fallback, candidates, baselineMetrics, true);
}
