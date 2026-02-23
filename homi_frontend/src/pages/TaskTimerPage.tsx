import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card, Button, LoadingSpinner, IconActivity, IconCheckCircle, IconAlertTriangle, IconPause, IconPlay, IconHourglass, IconXCircle } from '../components/common';
import { useTaskStore } from '../stores/taskStore';
import { useAuthStore } from '../stores/authStore';
import { submitTimeLog } from '../services/timeTracking.service';
import { useTranslation } from 'react-i18next';
import {
  getPersistedTimer,
  startPersistedTimer,
  restorePersistedTimerFromServer,
  resumePersistedTimer,
  pausePersistedTimer,
  freezePersistedTimer,
  tickPersistedTimer,
  clearPersistedTimer,
  computeElapsedSeconds,
} from '../services/timerPersistence.service';
import { smartEstimateService, type SmartEstimateResult } from '../services/smartEstimate.service';

export const TaskTimerPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks, isLoading, fetchTasks, startTask, completeTask, cancelTask } = useTaskStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [taskStarted, setTaskStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wasFrozen, setWasFrozen] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'save' | 'cancel' | null>(null);
  const initDone = useRef(false);

  // SmartEstimate state
  const [estimate, setEstimate] = useState<SmartEstimateResult | null>(null);
  const [overrunWarning, setOverrunWarning] = useState(false);
  const [overrunPercent, setOverrunPercent] = useState(0);

  const task = tasks.find(t => t.id === Number(taskId));

  // ─── 1. Restaurer le timer persisté au montage ────────────────────────
  useEffect(() => {
    const persisted = getPersistedTimer(user?.id);
    if (persisted && persisted.taskId === Number(taskId)) {
      const elapsed = computeElapsedSeconds(persisted);
      setTimerSeconds(elapsed);

      if (persisted.isFrozen) {
        // Le timer avait été figé (perte réseau / onglet fermé)
        setWasFrozen(true);
        setIsTimerRunning(false);
      } else if (persisted.isPaused) {
        setIsTimerRunning(false);
      } else {
        setIsTimerRunning(true);
      }
      setTaskStarted(true);
      initDone.current = true;
    }
  }, [taskId]);

  // ─── 2. Charger les tâches si nécessaire ──────────────────────────────
  useEffect(() => {
    if (!task && !isLoading) {
      fetchTasks();
    }
  }, [task, isLoading, fetchTasks]);

  // ─── 3. Démarrer la tâche côté API + créer le timer persisté ─────────
  useEffect(() => {
    if (initDone.current) return; // Déjà restauré depuis le localStorage

    const initializeTask = async () => {
      if (!task) return;

      if (task.status === 'TODO') {
        try {
          await startTask(task.id);
          startPersistedTimer(task.id, user!.id);
          setTaskStarted(true);
          setIsTimerRunning(true);
          initDone.current = true;
        } catch (error: any) {
          setSubmitError(error?.message || t('timer.errorStart'));
        }
      } else if (task.status === 'IN_PROGRESS') {
        // La tâche est déjà démarrée côté serveur
        const persisted = getPersistedTimer(user?.id);
        if (!persisted || persisted.taskId !== task.id) {
          // Pas de timer local → restaurer depuis actualStartTime serveur
          if (task.actualStartTime) {
            restorePersistedTimerFromServer(task.id, user!.id, task.actualStartTime);
            const restored = getPersistedTimer(user?.id);
            if (restored) {
              setTimerSeconds(computeElapsedSeconds(restored));
            }
          } else {
            startPersistedTimer(task.id, user!.id);
          }
        }
        setTaskStarted(true);
        setIsTimerRunning(true);
        initDone.current = true;
      }
    };

    initializeTask();
  }, [task, startTask, t]);

  // ─── 4. Tick du timer (1 s) ───────────────────────────────────────────
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      const persisted = getPersistedTimer();
      if (persisted) {
        setTimerSeconds(computeElapsedSeconds(persisted));
      } else {
        setTimerSeconds(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // ─── 5. Heartbeat : sauvegarder toutes les 10 s ──────────────────────
  useEffect(() => {
    if (!isTimerRunning) return;
    const hb = setInterval(() => tickPersistedTimer(), 10_000);
    return () => clearInterval(hb);
  }, [isTimerRunning]);

  // ─── 6. Visibility change → freeze / unfreeze ────────────────────────
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') {
        freezePersistedTimer();
      } else {
        // L'utilisateur revient sur l'onglet
        const persisted = getPersistedTimer();
        if (persisted && persisted.isFrozen) {
          setTimerSeconds(computeElapsedSeconds(persisted));
          setWasFrozen(true);
          setIsTimerRunning(false);
        }
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // ─── 7. Perte de réseau → freeze ─────────────────────────────────────
  useEffect(() => {
    const offlineHandler = () => {
      freezePersistedTimer();
      setIsTimerRunning(false);
      setWasFrozen(true);
    };
    const onlineHandler = () => {
      // Ne pas reprendre automatiquement — l'utilisateur doit cliquer "Reprendre"
      const persisted = getPersistedTimer();
      if (persisted) {
        setTimerSeconds(computeElapsedSeconds(persisted));
      }
    };
    window.addEventListener('offline', offlineHandler);
    window.addEventListener('online', onlineHandler);
    return () => {
      window.removeEventListener('offline', offlineHandler);
      window.removeEventListener('online', onlineHandler);
    };
  }, []);

  // ─── 8. beforeunload → freeze le timer ────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTimerRunning || taskStarted) {
        // Figer le timer dans le localStorage avant de quitter
        freezePersistedTimer();
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTimerRunning, taskStarted]);

  // ─── 9. SmartEstimate — charger l'estimation au montage ─────────────
  useEffect(() => {
    if (!task) return;
    smartEstimateService
      .getEstimate({ domicileId: task.domicile?.id, executorId: task.assignedTo?.id })
      .then(setEstimate)
      .catch(() => {}); // silently ignore
  }, [task]);

  // ─── 10. Overrun check — toutes les 60 s ──────────────────────────────
  useEffect(() => {
    if (!isTimerRunning || !task) return;
    const check = () => {
      smartEstimateService
        .checkOverrun(task.id, timerSeconds)
        .then(res => {
          setOverrunWarning(res.overrun);
          setOverrunPercent(res.percentOver ?? 0);
        })
        .catch(() => {});
    };
    check(); // initial
    const iv = setInterval(check, 60_000);
    return () => clearInterval(iv);
  }, [isTimerRunning, task, timerSeconds]);

  // ─── Helpers ──────────────────────────────────────────────────────────

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ─── Actions ──────────────────────────────────────────────────────────

  const handleToggleTimer = useCallback(() => {
    if (isTimerRunning) {
      pausePersistedTimer();
      setIsTimerRunning(false);
    } else {
      resumePersistedTimer();
      setIsTimerRunning(true);
      setWasFrozen(false);
    }
  }, [isTimerRunning]);

  const handleResumeAfterFreeze = useCallback(() => {
    resumePersistedTimer();
    setIsTimerRunning(true);
    setWasFrozen(false);
  }, []);

  /** Arrêter le chronomètre et afficher le panneau de confirmation */
  const handleStopTimer = useCallback(() => {
    pausePersistedTimer();
    setIsTimerRunning(false);
    setWasFrozen(false);
    setShowConfirm('save');
  }, []);

  /** Reprendre après avoir annulé la confirmation */
  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(null);
    resumePersistedTimer();
    setIsTimerRunning(true);
  }, []);

  const handleCompleteTask = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const persisted = getPersistedTimer();
      const totalSeconds = persisted ? computeElapsedSeconds(persisted) : timerSeconds;

      const taskEndDate = new Date();
      const taskStartDate = new Date(taskEndDate.getTime() - (totalSeconds * 1000));

      await submitTimeLog(task!.id, taskStartDate, taskEndDate);
      await completeTask(task!.id);
      setIsTimerRunning(false);
      clearPersistedTimer();
      setShowConfirm(null);

      setTimeout(() => navigate('/tasks'), 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('timer.errorSubmit');
      setSubmitError(errorMessage);
      console.error('Failed to complete task', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTask = async () => {
    setIsTimerRunning(false);
    try {
      await cancelTask(task!.id);
    } catch (error) {
      console.error('Failed to cancel task on server', error);
    }
    clearPersistedTimer();
    setShowConfirm(null);
    navigate('/tasks');
  };

  // ─── Rendu ────────────────────────────────────────────────────────────

  if (isLoading || !task) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  // Vérifier que l'utilisateur accède à sa propre tâche
  if (task.assignedTo?.id !== user?.id) {
    return (
      <MainLayout>
        <Card className="p-8 max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('common.accessDenied')}</h1>
          <p className="text-gray-600 mb-4">{t('timer.accessDeniedDesc')}</p>
          <Button onClick={() => navigate('/tasks')} className="bg-primary-600 hover:bg-primary-700 text-white">
            {t('timer.returnToTasks')}
          </Button>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="p-8 mb-6 bg-gradient-to-br from-primary-50 to-primary-100">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{task.title}</h1>
          <p className="text-gray-600">{task.description}</p>
        </Card>

        {/* SmartEstimate Banner */}
        {estimate && estimate.confidence !== 'none' && (
          <Card className="p-4 mb-6 bg-indigo-50 border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-800 font-medium flex items-center gap-1"><IconActivity className="w-5 h-5" /> Estimation intelligente</p>
                <p className="text-indigo-600 text-sm">
                  ~{estimate.estimatedHours !== null ? Math.round(estimate.estimatedHours * 60) : '?'} min en moyenne
                  {estimate.medianHours !== undefined && ` (médiane ${Math.round(estimate.medianHours * 60)} min)`} — basé sur {estimate.basedOn} tâch{estimate.basedOn > 1 ? 'es' : 'e'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                estimate.confidence === 'high' ? 'bg-green-100 text-green-700' :
                estimate.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {estimate.confidence === 'high' ? <><IconCheckCircle className="w-4 h-4 inline text-green-600" /> Confiance élevée</> :
                 estimate.confidence === 'medium' ? <><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span> Confiance moyenne</> : <><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> Peu de données</>}
              </span>
            </div>
          </Card>
        )}

        {/* Overrun Warning */}
        {overrunWarning && (
          <Card className="p-4 mb-6 bg-red-50 border border-red-300 animate-pulse">
            <div className="flex items-center">
              <span className="mr-3"><IconAlertTriangle className="w-7 h-7 text-red-600" /></span>
              <div>
                <p className="text-red-800 font-bold">Dépassement détecté !</p>
                <p className="text-red-600 text-sm">
                  Le temps écoulé dépasse de {overrunPercent}% la durée moyenne habituelle.
                  Pensez à vérifier la progression de la tâche.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Frozen banner — shown when returning after leaving */}
        {wasFrozen && (
          <Card className="p-4 mb-6 bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 font-medium flex items-center gap-1"><IconPause className="w-5 h-5" /> {t('timer.frozenTitle')}</p>
                <p className="text-blue-600 text-sm">{t('timer.frozenDesc')}</p>
              </div>
              <Button
                onClick={handleResumeAfterFreeze}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <span className="inline-flex items-center gap-1"><IconPlay className="w-4 h-4" /> {t('timer.resume')}</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {submitError && (
          <Card className="p-4 mb-6 bg-red-50 border border-red-200">
            <p className="text-red-800">{submitError}</p>
          </Card>
        )}

        {/* Timer Section */}
        <Card className="p-12 mb-6 text-center">
          <p className="text-gray-600 text-lg mb-4">{t('timer.elapsed')}</p>
          <div className="mb-8">
            <p className={`text-7xl font-bold font-mono ${
              wasFrozen ? 'text-blue-500' : isTimerRunning ? 'text-primary-600' : 'text-yellow-600'
            }`}>
              {formatTime(timerSeconds)}
            </p>
          </div>

          {/* Timer Status */}
          <div className="mb-8">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              wasFrozen
                ? 'bg-blue-100 text-blue-800'
                : isTimerRunning
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}>
              {wasFrozen
                ? <><IconPause className="w-4 h-4 inline" /> {t('timer.frozen')}</>
                : isTimerRunning
                  ? <><IconHourglass className="w-4 h-4 inline" /> {t('timer.running')}</>
                  : <><IconPause className="w-4 h-4 inline" /> {t('timer.paused')}</>}
            </span>
          </div>

          {/* Controls */}
          {showConfirm ? (
            /* ── Panneau de confirmation intégré (remplace window.confirm) ── */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <p className="text-lg font-semibold text-gray-800 mb-1">
                  {showConfirm === 'save' ? t('timer.confirmSave') : t('timer.confirmDiscard')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('timer.elapsed')}: <span className="font-mono font-bold">{formatTime(timerSeconds)}</span>
                </p>
              </div>

              {showConfirm === 'save' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    onClick={handleCompleteTask}
                    disabled={timerSeconds === 0 || isSubmitting}
                    size="lg"
                    className="bg-success-600 hover:bg-success-700 text-white min-h-[56px] text-base"
                  >
                    {isSubmitting
                      ? <><IconHourglass className="w-5 h-5 inline" /> {t('timer.saving')}</>
                      : <><IconCheckCircle className="w-5 h-5 inline" /> {t('timer.save')}</>}
                  </Button>
                  <Button
                    onClick={handleCancelConfirm}
                    size="lg"
                    className="bg-surface-200 hover:bg-surface-300 text-gray-700 min-h-[56px] text-base"
                  >
                    <IconPlay className="w-5 h-5 inline" /> {t('timer.resume')}
                  </Button>
                  <Button
                    onClick={() => { setShowConfirm('cancel'); }}
                    size="lg"
                    className="bg-red-100 hover:bg-red-200 text-red-700 min-h-[56px] text-base sm:col-span-2"
                  >
                    <IconXCircle className="w-5 h-5 inline" /> {t('timer.discard')}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    onClick={handleCancelTask}
                    disabled={isSubmitting}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white min-h-[56px] text-base"
                  >
                    <IconXCircle className="w-5 h-5 inline" /> {t('timer.confirmDiscardBtn')}
                  </Button>
                  <Button
                    onClick={() => { setShowConfirm('save'); }}
                    size="lg"
                    className="bg-surface-200 hover:bg-surface-300 text-gray-700 min-h-[56px] text-base"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* ── Contrôles normaux du chronomètre ── */
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {!wasFrozen && (
                <Button
                  onClick={handleToggleTimer}
                  size="lg"
                  className={`${
                    isTimerRunning
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white min-h-[56px] text-base`}
                >
                  {isTimerRunning
                    ? <><IconPause className="w-5 h-5 inline" /> {t('timer.pause')}</>
                    : <><IconPlay className="w-5 h-5 inline" /> {t('timer.resume')}</>}
                </Button>
              )}

              {isTimerRunning && (
                <Button
                  onClick={handleStopTimer}
                  size="lg"
                  disabled={timerSeconds === 0}
                  className="bg-red-600 hover:bg-red-700 text-white min-h-[56px] text-base"
                >
                  <IconXCircle className="w-5 h-5 inline" /> {t('timer.stop')}
                </Button>
              )}

              {!isTimerRunning && !wasFrozen && timerSeconds > 0 && (
                <>
                  <Button
                    onClick={() => { setShowConfirm('save'); }}
                    size="lg"
                    disabled={timerSeconds === 0}
                    className="bg-success-600 hover:bg-success-700 text-white min-h-[56px] text-base"
                  >
                    <IconCheckCircle className="w-5 h-5 inline" /> {t('timer.save')}
                  </Button>
                  <Button
                    onClick={() => { setShowConfirm('cancel'); }}
                    size="lg"
                    className="bg-surface-200 hover:bg-surface-300 text-gray-700 min-h-[56px] text-base"
                  >
                    <IconXCircle className="w-5 h-5 inline" /> {t('timer.discard')}
                  </Button>
                </>
              )}
            </div>
          )}
        </Card>

        {/* Task Details */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('timer.task')}</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">{t('common.domicile')}</p>
              <p className="text-lg font-medium text-gray-900">
                {task.domicile?.name} - {task.domicile?.address}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('timeLogs.status')}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                task.status === 'COMPLETED' ? 'bg-success-100 text-success-700' :
                task.status === 'IN_PROGRESS' ? 'bg-primary-100 text-primary-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('timer.plannedDuration')}</p>
              {task.startTime && task.endTime ? (
                <p className="text-lg font-medium text-gray-900">
                  {new Date(task.startTime).toLocaleString()} - {new Date(task.endTime).toLocaleString()}
                </p>
              ) : (
                <p className="text-gray-500">{t('timer.noDuration')}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Warning */}
        {(isTimerRunning || taskStarted) && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <IconAlertTriangle className="w-4 h-4 inline text-amber-600" /> {t('timer.warningLeave')}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
