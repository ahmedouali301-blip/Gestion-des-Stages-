import api from './axiosConfig';

export const getNotificationsByUser = (userId) => api.get(`/notifications/user/${userId}`);
export const marquerCommeLue      = (id)     => api.patch(`/notifications/${id}/lire`);
export const marquerToutCommeLues = (userId) => api.patch(`/notifications/user/${userId}/lire-tout`);
export const supprimerNotif       = (id)     => api.delete(`/notifications/${id}`);
export const supprimerToutNotifs   = (userId) => api.delete(`/notifications/user/${userId}`);
