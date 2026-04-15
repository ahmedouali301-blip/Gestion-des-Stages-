import api from './axiosConfig';
 
export const creerEvaluation    = (data)  => api.post('/evaluations', data);
export const modifierEvaluation = (id, data) => api.put(`/evaluations/${id}`, data);
export const getEvalsByStagiaire = (id)   => api.get(`/evaluations/stagiaire/${id}`);
export const getMoyenne          = (id)   => api.get(`/evaluations/stagiaire/${id}/moyenne`);
export const getEvalBySprint     = (id)   => api.get(`/evaluations/sprint/${id}`);