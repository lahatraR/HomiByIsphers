import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { UserRoles } from '../types';
import { getActiveTimerTaskId, getPersistedTimer, restorePersistedTimerFromServer } from '../services/timerPersistence.service';

export const PrivateRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { tasks, fetchTasks } = useTaskStore();
  const location = useLocation();
  const [restoredTaskId, setRestoredTaskId] = useState<number | null>(null);
  const [checkDone, setCheckDone] = useState(false);

  // Si l'utilisateur est authentifié mais n'a pas de timer local,
  // vérifier côté serveur s'il a une tâche IN_PROGRESS et restaurer le timer.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCheckDone(true);
      return;
    }

    // Si un timer local existe déjà pour cet utilisateur, pas besoin de vérifier le serveur
    if (getActiveTimerTaskId(user.id)) {
      setCheckDone(true);
      return;
    }

    // Charger les tâches pour vérifier s'il y a une tâche IN_PROGRESS
    const checkServerTasks = async () => {
      try {
        if (tasks.length === 0) {
          await fetchTasks();
        }
      } catch {
        // Ignorer les erreurs
      } finally {
        setCheckDone(true);
      }
    };

    checkServerTasks();
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quand les tâches sont chargées, chercher une tâche IN_PROGRESS
  useEffect(() => {
    if (!checkDone || !user || !isAuthenticated) return;
    if (getActiveTimerTaskId(user.id)) return; // Timer déjà présent

    const inProgressTask = tasks.find(
      t => t.status === 'IN_PROGRESS' && t.assignedTo?.id === user.id
    );

    if (inProgressTask && inProgressTask.actualStartTime) {
      restorePersistedTimerFromServer(inProgressTask.id, user.id, inProgressTask.actualStartTime);
      setRestoredTaskId(inProgressTask.id);
    }
  }, [checkDone, tasks, user, isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Attendre que la vérification serveur soit terminée avant de décider
  if (!checkDone) return null;

  // Si un timer est actif (local ou restauré) et pas déjà sur la page timer → rediriger
  const activeTaskId = getActiveTimerTaskId(user?.id) ?? restoredTaskId;
  const timerPath = activeTaskId ? `/tasks/${activeTaskId}/timer` : null;
  const isAlreadyOnTimer = location.pathname.includes('/timer');

  if (timerPath && !isAlreadyOnTimer) {
    return <Navigate to={timerPath} replace />;
  }

  return <Outlet />;
};

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    // Si authentifié et qu'un timer est actif, aller directement au timer
    const activeTaskId = getActiveTimerTaskId(user?.id);
    if (activeTaskId) {
      return <Navigate to={`/tasks/${activeTaskId}/timer`} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== UserRoles.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
