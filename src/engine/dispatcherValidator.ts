import { ActionCandidate, NetworkMetrics, RecoveryAction } from './types';

export interface DispatcherRawResponse {
  chosen_action_ids: string[];
  explanation: string;
}

export interface HydratedDispatcherResponse {
  chosen_actions: RecoveryAction[];
  explanation: string;
  isFallback: boolean;
  isVerified: boolean;
  rawExplanation: string;
}

const ALLOWED_PLACEHOLDERS = new Set([
  'stranded_before',
  'stranded_after',
  'delay_saved',
  'stranded_saved',
  'connections_saved',
  'crew_breaches_resolved',
  'shift_score_delta',
  'airport',
]);

/**
 * Validates AI Dispatcher output according to the strict rule:
 * "Reject and regenerate (max 2 retries, then template fallback) if the text contains:
 *  - any digit outside a placeholder
 *  - an unknown placeholder
 *  - an action id that is not in the candidate list."
 */
export function validateDispatcherResponse(
  raw: DispatcherRawResponse,
  candidates: ActionCandidate[]
): { valid: boolean; error?: string } {
  if (!raw || !Array.isArray(raw.chosen_action_ids) || typeof raw.explanation !== 'string') {
    return { valid: false, error: 'Invalid response structure: expected chosen_action_ids array and explanation string.' };
  }

  const validActionIds = new Set(candidates.map((c) => c.action.id));

  // 1. Check action IDs
  for (const id of raw.chosen_action_ids) {
    if (!validActionIds.has(id)) {
      return { valid: false, error: `Action ID '${id}' is not in the valid candidate list.` };
    }
  }

  // 2. Check for unknown placeholders
  const placeholderRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = placeholderRegex.exec(raw.explanation)) !== null) {
    const token = match[1];
    if (!ALLOWED_PLACEHOLDERS.has(token)) {
      return { valid: false, error: `Unknown placeholder '{{${token}}}' in explanation.` };
    }
  }

  // 3. Strict Check: ZERO digits outside placeholders
  // Strip all valid placeholders from the explanation
  const textWithoutPlaceholders = raw.explanation.replace(placeholderRegex, '');
  if (/\d/.test(textWithoutPlaceholders)) {
    return {
      valid: false,
      error: `Explanation contains raw numbers or digits outside a placeholder: "${textWithoutPlaceholders.match(/\d+/)?.[0]}". The AI is strictly prohibited from computing or writing numbers.`,
    };
  }

  return { valid: true };
}

/**
 * Deterministic template fallback generator used offline or when AI validation fails
 */
export function generateFallbackDispatcherResponse(
  candidates: ActionCandidate[],
  baselineMetrics: NetworkMetrics
): DispatcherRawResponse {
  if (candidates.length === 0) {
    return {
      chosen_action_ids: [],
      explanation:
        'All current network operations are within acceptable tolerance. No immediate tactical mitigations are recommended at this time.',
    };
  }

  // Pick up to 2 best candidates
  const best = candidates.slice(0, 2);
  const chosenIds = best.map((c) => c.action.id);

  const hasSpare = best.some((c) => c.action.type === 'ASSIGN_SPARE');
  const hasCancel = best.some((c) => c.action.type === 'CANCEL_FLIGHT');

  let template = '';
  if (hasSpare && hasCancel) {
    template =
      'Immediate crisis dispatch order: Deploying standby reserve aircraft to protect priority hub routes, combined with targeted tactical flight cancellation to arrest cascading delays. This strategy reduces stranded passengers from {{stranded_before}} to {{stranded_after}}, saving {{delay_saved}} total delay minutes and recovering {{crew_breaches_resolved}} crew duty breaches.';
  } else if (hasSpare) {
    template =
      'Immediate reserve deployment: Activating hot standby aircraft from base apron to replace disrupted rotation. This action protects downstream itineraries, reducing stranded passengers from {{stranded_before}} to {{stranded_after}} and recovering {{delay_saved}} minutes of system delay.';
  } else {
    template =
      'Tactical schedule containment: Applying targeted cancellations to arrest knock-on propagation into evening hub banks. This preserves network connectivity, preventing {{stranded_saved}} passenger disruptions and recovering {{delay_saved}} delay minutes.';
  }

  return {
    chosen_action_ids: chosenIds,
    explanation: template,
  };
}

/**
 * Hydrates validated placeholders with verified engine numbers
 */
export function hydrateDispatcherResponse(
  raw: DispatcherRawResponse,
  candidates: ActionCandidate[],
  baselineMetrics: NetworkMetrics,
  isFallback = false
): HydratedDispatcherResponse {
  const candidateMap = new Map(candidates.map((c) => [c.action.id, c]));
  const chosenActions = raw.chosen_action_ids
    .map((id) => candidateMap.get(id)?.action)
    .filter(Boolean) as RecoveryAction[];

  // Calculate projected combined metrics
  let totalDelaySaved = 0;
  let totalStrandedSaved = 0;
  let totalBreachesResolved = 0;
  let totalScoreDelta = 0;

  raw.chosen_action_ids.forEach((id) => {
    const cand = candidateMap.get(id);
    if (cand) {
      totalDelaySaved += cand.delay_saved;
      totalStrandedSaved += cand.stranded_saved;
      totalBreachesResolved += cand.crew_breaches_resolved;
      totalScoreDelta += cand.net_score_delta;
    }
  });

  const strandedBefore = baselineMetrics.stranded_passengers;
  const strandedAfter = Math.max(0, strandedBefore - totalStrandedSaved);

  const replacements: Record<string, string> = {
    stranded_before: strandedBefore.toLocaleString(),
    stranded_after: strandedAfter.toLocaleString(),
    delay_saved: totalDelaySaved.toLocaleString(),
    stranded_saved: totalStrandedSaved.toLocaleString(),
    connections_saved: totalStrandedSaved.toLocaleString(),
    crew_breaches_resolved: totalBreachesResolved.toString(),
    shift_score_delta: totalScoreDelta.toString(),
  };

  const hydrated = raw.explanation.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => {
    return replacements[key] ?? `{{${key}}}`;
  });

  return {
    chosen_actions: chosenActions,
    explanation: hydrated,
    isFallback,
    isVerified: true,
    rawExplanation: raw.explanation,
  };
}
