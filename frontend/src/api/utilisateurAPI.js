import api from './axiosConfig';
 
export const getAllUtilisateurs  = ()          => api.get('/utilisateurs');
export const getUtilisateurById  = (id)        => api.get(`/utilisateurs/${id}`);
export const getByRole           = (role)      => api.get(`/utilisateurs/role/${role}`);
export const createUtilisateur   = (data)      => api.post('/utilisateurs', data);
export const updateUtilisateur   = (id, data)  => api.put(`/utilisateurs/${id}`, data);
export const toggleActif         = (id)        => api.patch(`/utilisateurs/${id}/toggle-actif`);
export const resetPassword       = (id, mdp)   => api.patch(`/utilisateurs/${id}/reset-password`, { motDePasse: mdp });
export const deleteUtilisateur   = (id)        => api.delete(`/utilisateurs/${id}`);