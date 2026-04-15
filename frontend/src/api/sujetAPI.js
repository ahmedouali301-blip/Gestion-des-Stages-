import api from './axiosConfig';
 
export const getSujetsByResponsable = (id)                   => api.get(`/sujets/responsable/${id}`);
export const creerSujet             = (data)                 => api.post('/sujets', data);
export const modifierSujet          = (id, data)             => api.put(`/sujets/${id}`, data);
export const archiverSujet          = (id)                   => api.patch(`/sujets/${id}/archiver`);
export const validerSujet           = (id)                   => api.patch(`/sujets/${id}/valider`);
export const deleteSujet            = (id)                   => api.delete(`/sujets/${id}`);
export const getSujetDuStagiaire    = (stagiaireId)          => api.get(`/sujets/stagiaire/${stagiaireId}`);
export const getSujetsDisponibles   = ()                     => api.get('/sujets/disponibles');
export const choisirSujet           = (sujetId, stagiaireId) => api.post(`/sujets/${sujetId}/choisir/${stagiaireId}`);
export const annulerChoix           = (stagiaireId)          => api.delete(`/sujets/choix/${stagiaireId}`);
export const getMonChoix            = (stagiaireId)          => api.get(`/sujets/choix/stagiaire/${stagiaireId}`);
export const getTousLesChoix        = ()                     => api.get('/sujets/tous-les-choix');