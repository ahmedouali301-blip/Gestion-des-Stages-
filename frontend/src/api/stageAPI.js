import api from './axiosConfig';
 
export const getAllStages         = ()                    => api.get('/stages');
export const getStageById         = (id)                  => api.get(`/stages/${id}`);
export const getStagesByEncadrant = (encadrantId)         => api.get(`/stages/encadrant/${encadrantId}`);
export const getStagesByStagiaire = (stagiaireId)         => api.get(`/stages/stagiaire/${stagiaireId}`);
export const createStage          = (data)                => api.post('/stages', data);
export const changerStatutStage   = (id, statut)          => api.patch(`/stages/${id}/statut`, { statut });
export const affecterEncadrant    = (id, encadrantId)     => api.patch(`/stages/${id}/encadrant`, { encadrantId });
export const deleteStage          = (id)                  => api.delete(`/stages/${id}`);