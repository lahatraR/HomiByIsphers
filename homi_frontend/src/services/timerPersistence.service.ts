/**
 * Service de persistance du timer dans localStorage.
 *
 * Stocke l'état complet du chronomètre pour qu'il survive aux :
 *  - Rafraîchissements de page / fermetures d'onglet
 *  - Pertes de connexion réseau
 *  - Navigations accidentelles
 *
 * Le temps effectif est calculé comme :
 *   accumulatedSeconds + (now - lastResumedAt)   [si le timer tourne]
 *   accumulatedSeconds                            [si le timer est en pause / figé]
 */

const STORAGE_KEY = 'homi_active_timer';

export interface PersistedTimer {
  /** ID de l'utilisateur propriétaire du timer */
  userId: number;
  /** ID de la tâche en cours */
  taskId: number;
  /** Timestamp ISO du démarrage initial */
  startedAt: string;
  /** Secondes accumulées (figées) avant la dernière reprise */
  accumulatedSeconds: number;
  /** Timestamp ISO de la dernière reprise (quand le timer est actif) */
  lastResumedAt: string | null;
  /** Le timer est-il en pause volontaire ? */
  isPaused: boolean;
  /** Le timer a-t-il été figé automatiquement (perte réseau, tab hidden…) ? */
  isFrozen: boolean;
  /** Timestamp ISO de la dernière sauvegarde (pour diagnostic) */
  savedAt: string;
}

// ─── Lecture / écriture ────────────────────────────────────────────────

/**
 * Lit le timer persisté. Si userId est fourni, ne retourne le timer
 * QUE s'il appartient à cet utilisateur (sécurité multi-utilisateur).
 */
export function getPersistedTimer(userId?: number): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const timer = JSON.parse(raw) as PersistedTimer;
    // Filtre par userId si spécifié
    if (userId !== undefined && timer.userId !== userId) return null;
    return timer;
  } catch {
    return null;
  }
}

function save(timer: PersistedTimer): void {
  timer.savedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
}

export function clearPersistedTimer(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Actions ───────────────────────────────────────────────────────────

/** Créer un nouveau timer pour une tâche (écrase tout timer existant) */
export function startPersistedTimer(taskId: number, userId: number): PersistedTimer {
  const now = new Date().toISOString();
  const timer: PersistedTimer = {
    userId,
    taskId,
    startedAt: now,
    accumulatedSeconds: 0,
    lastResumedAt: now,
    isPaused: false,
    isFrozen: false,
    savedAt: now,
  };
  save(timer);
  return timer;
}

/**
 * Restaurer un timer à partir des données serveur (actualStartTime).
 * Utilisé quand le localStorage est vide (autre navigateur, cache vidé)
 * mais qu'une tâche IN_PROGRESS existe côté API.
 */
export function restorePersistedTimerFromServer(
  taskId: number,
  userId: number,
  actualStartTime: string
): PersistedTimer {
  const now = new Date().toISOString();
  const elapsedMs = Date.now() - new Date(actualStartTime).getTime();
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const timer: PersistedTimer = {
    userId,
    taskId,
    startedAt: actualStartTime,
    accumulatedSeconds: elapsedSeconds,
    lastResumedAt: now,
    isPaused: false,
    isFrozen: false,
    savedAt: now,
  };
  save(timer);
  return timer;
}

/** Reprendre un timer existant (après pause ou freeze) */
export function resumePersistedTimer(): PersistedTimer | null {
  const timer = getPersistedTimer();
  if (!timer) return null;
  timer.lastResumedAt = new Date().toISOString();
  timer.isPaused = false;
  timer.isFrozen = false;
  save(timer);
  return timer;
}

/** Mettre en pause volontaire — fige le compteur */
export function pausePersistedTimer(): PersistedTimer | null {
  const timer = getPersistedTimer();
  if (!timer) return null;
  // Accumuler le temps écoulé depuis la dernière reprise
  timer.accumulatedSeconds = computeElapsedSeconds(timer);
  timer.lastResumedAt = null;
  timer.isPaused = true;
  timer.isFrozen = false;
  save(timer);
  return timer;
}

/** Figer automatiquement (perte réseau, tab caché…) — même mécanique que pause */
export function freezePersistedTimer(): PersistedTimer | null {
  const timer = getPersistedTimer();
  if (!timer || timer.isPaused || timer.isFrozen) return null;
  timer.accumulatedSeconds = computeElapsedSeconds(timer);
  timer.lastResumedAt = null;
  timer.isFrozen = true;
  save(timer);
  return timer;
}

/** Mettre à jour accumulatedSeconds périodiquement (heartbeat) pour limiter la perte en cas de crash */
export function tickPersistedTimer(): void {
  const timer = getPersistedTimer();
  if (!timer || timer.isPaused || timer.isFrozen) return;
  timer.accumulatedSeconds = computeElapsedSeconds(timer);
  timer.lastResumedAt = new Date().toISOString();
  save(timer);
}

// ─── Calcul du temps écoulé ────────────────────────────────────────────

/** Calcule le nombre total de secondes écoulées pour ce timer */
export function computeElapsedSeconds(timer: PersistedTimer): number {
  let total = timer.accumulatedSeconds;
  if (timer.lastResumedAt && !timer.isPaused && !timer.isFrozen) {
    const diff = (Date.now() - new Date(timer.lastResumedAt).getTime()) / 1000;
    total += Math.max(0, Math.floor(diff));
  }
  return total;
}

/** Vérifie s'il y a un timer actif pour une tâche donnée (ou n'importe quelle tâche) */
export function hasActiveTimer(taskId?: number, userId?: number): boolean {
  const timer = getPersistedTimer(userId);
  if (!timer) return false;
  if (taskId !== undefined) return timer.taskId === taskId;
  return true;
}

/** Retourne le taskId du timer actif, ou null */
export function getActiveTimerTaskId(userId?: number): number | null {
  const timer = getPersistedTimer(userId);
  return timer?.taskId ?? null;
}
