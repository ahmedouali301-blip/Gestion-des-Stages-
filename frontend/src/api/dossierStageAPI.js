import api from './axiosConfig';

export const getDossiersByResponsable = (id, annee) =>
  api.get(`/folders-stage/responsable/${id}${annee && annee !== 'TOUTES' ? `?annee=${annee}` : ''}`);
export const getDossiersByStagiaire   = (id)  => api.get(`/folders-stage/stagiaire/${id}`);
export const getAnneesByResponsable   = (id)  => api.get(`/folders-stage/responsable/${id}/annees`);
export const creerDossier             = (data)=> api.post('/folders-stage', data);
export const deleteDossier            = (id)  => api.delete(`/folders-stage/${id}`);