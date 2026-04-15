import api from './axiosConfig';
 
export const planifierReunion     = (data)           => api.post('/reunions', data);
export const getReunionsByEncadrant = (id)           => api.get(`/reunions/encadrant/${id}`);
export const getReunionsByStagiaire = (id)           => api.get(`/reunions/stagiaire/${id}`);
export const getReunionsBySprint    = (id)           => api.get(`/reunions/sprint/${id}`);
export const changerStatutReunion   = (id, statut)   => api.patch(`/reunions/${id}/statut`, { statut });
export const ajouterNotes           = (id, notes)    => api.patch(`/reunions/${id}/notes`, notes);
export const redigerPv              = (data)         => api.post('/reunions/pv', data);
export const deleteReunion          = (id)           => api.delete(`/reunions/${id}`);

// Workflow Validation
export const accepterReunion       = (id, stagiaireId) => api.patch(`/reunions/${id}/accepter?stagiaireId=${stagiaireId}`);
export const accepterReunionEncadrant = (id)          => api.patch(`/reunions/${id}/accepter-encadrant`);
export const reporterReunionEncadrant = (id, motif, date) => api.patch(`/reunions/${id}/reporter-encadrant?motif=${motif}&nouvelleDate=${date}`);
export const reporterReunion       = (id, stagiaireId, data) => api.patch(`/reunions/${id}/reporter?stagiaireId=${stagiaireId}`, data);
export const deciderReportage      = (id, accepte)     => api.patch(`/reunions/${id}/decider-reportage?accepte=${accepte}`);