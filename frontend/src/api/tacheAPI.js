// ── src/api/tacheAPI.js — VERSION FINALE ────────────────────
import api from './axiosConfig';

// Tâches d'un stage (toutes)
export const getTachesByStage       = (stageId)          => api.get(`/taches/stage/${stageId}`);
// Tâches disponibles (non affectées à un sprint)
export const getTachesDisponibles   = (stageId)          => api.get(`/taches/stage/${stageId}/disponibles`);
// Créer tâche pour un stage (sans sprint)
export const creerTachePourStage    = (data)             => api.post('/taches/stage', data);
// Supprimer tâche simple
export const deleteTacheSimple      = (tacheId)          => api.delete(`/taches/simple/${tacheId}`);
// Affecter tâche à un sprint
export const affecterTacheASprint   = (tacheId, sprintId)=> api.post(`/taches/${tacheId}/affecter/${sprintId}`);
// Retirer tâche d'un sprint
export const retirerTacheDuSprint   = (tacheSprintId)    => api.delete(`/taches/sprint-affectation/${tacheSprintId}`);
// Tâches d'un sprint
export const getTachesBySprint      = (sprintId)         => api.get(`/taches/sprint/${sprintId}`);
// Tâches du stagiaire
export const getTachesByStagiaire   = (stagiaireId)      => api.get(`/taches/stagiaire/${stagiaireId}`);
// Proposer
export const proposerTache          = (data, stagiaireId)=> api.post(`/taches/proposition?stagiaireId=${stagiaireId}`, data);
// Valider / Refuser
export const validerTache           = (id)               => api.patch(`/taches/${id}/valider`);
export const refuserTache           = (id, commentaire)  => api.patch(`/taches/${id}/refuser`, { commentaire });
// Mise à jour statut
export const mettreAJourTache       = (id, data)         => api.put(`/taches/${id}`, data);
// Supprimer tâche sprint
export const deleteTache            = (id)               => api.delete(`/taches/${id}`);