import api from './axiosConfig';

export const getDossiersByResponsable = (id, annee) =>
  api.get(`/dossiers-stage/responsable/${id}${annee && annee !== 'TOUTES' ? `?annee=${annee}` : ''}`);
export const getAnneesByResponsable   = (id)  => api.get(`/dossiers-stage/responsable/${id}/annees`);
export const creerDossier             = (data)=> api.post('/dossiers-stage', data);
export const deleteDossier            = (id)  => api.delete(`/dossiers-stage/${id}`);