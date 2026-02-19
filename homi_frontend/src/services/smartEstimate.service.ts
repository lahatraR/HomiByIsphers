import { api } from './api';
import type { SmartEstimateResult, OverrunCheck } from '../types/smartEstimate';

// Re-export for backward compatibility
export type { SmartEstimateResult, OverrunCheck };

export const smartEstimateService = {
  /**
   * Obtenir une estimation de durée pour une tâche.
   */
  getEstimate: async (params: {
    domicileId?: number;
    executorId?: number;
    taskId?: number;
  }): Promise<SmartEstimateResult> => {
    const query = new URLSearchParams();
    if (params.domicileId) query.set('domicileId', String(params.domicileId));
    if (params.executorId) query.set('executorId', String(params.executorId));
    if (params.taskId) query.set('taskId', String(params.taskId));
    const res = await api.get<SmartEstimateResult>(`/smart-estimate?${query}`);
    return res.data;
  },

  /**
   * Vérifier si le timer actuel dépasse l'estimation.
   */
  checkOverrun: async (taskId: number, currentSeconds: number): Promise<OverrunCheck> => {
    const res = await api.get<OverrunCheck>(
      `/smart-estimate/check-overrun?taskId=${taskId}&currentSeconds=${currentSeconds}`
    );
    return res.data;
  },
};
