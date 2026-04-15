// ── src/api/stagiaireIdentiteAPI.js ─────────────────────────
import api from './axiosConfig';

export const getAllIdentites          = ()    => api.get('/stagiaires-identites');
export const getIdentitesSansCompte   = ()    => api.get('/stagiaires-identites/sans-compte');
export const getIdentitesByResponsable= (id)  => api.get(`/stagiaires-identites/responsable/${id}`);
export const creerIdentite            = (data)=> api.post('/stagiaires-identites', data);
export const marquerCompteCreer       = (id)  => api.patch(`/stagiaires-identites/${id}/compte-creer`);
export const modifierIdentite       = (id, data)=> api.put(`/stagiaires-identites/${id}`, data);
export const deleteIdentite           = (id)  => api.delete(`/stagiaires-identites/${id}`);


