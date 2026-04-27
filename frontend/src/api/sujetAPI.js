import api from './axiosConfig';
 
// Master Sujets (Library)
export const getMastersByResponsable = ()              => api.get('/sujets/masters');
export const creerSujet             = (data)           => api.post('/sujets', data);
export const modifierSujet          = (id, data)       => api.put(`/sujets/${id}`, data);
export const deleteSujet            = (id)             => api.delete(`/sujets/${id}`);
 
// Session Sujets (Occurrences)
export const getSessionsByResponsable = (annee)        => api.get(`/sujets/session/all?annee=${annee}`);
export const publierSujet             = (data)         => api.post('/sujets/publier', data);
export const depublierSujet           = (id)           => api.delete(`/sujets/session/${id}`);
export const validerSessionSujet      = (id)           => api.patch(`/sujets/session/${id}/valider`);
export const getSujetsDisponibles     = (annee)        => api.get(`/sujets/disponibles?annee=${annee}`);
export const choisirSujet             = (sessionId, stagiaireId) => api.post(`/sujets/session/${sessionId}/choisir/${stagiaireId}`);
export const annulerChoix             = (stagiaireId)  => api.delete(`/sujets/choix/${stagiaireId}`);
export const getMonChoix              = (stagiaireId)  => api.get(`/sujets/choix/stagiaire/${stagiaireId}`);
export const getChoixBySession         = (sessionId)    => api.get(`/sujets/session/${sessionId}/choix`);