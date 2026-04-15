import api from './axiosConfig';
 
export const getSprintsByStage  = (stageId)          => api.get(`/sprints/stage/${stageId}`);
export const getSprintById      = (id)               => api.get(`/sprints/${id}`);
export const creerSprint        = (data)             => api.post('/sprints', data);
export const demarrerSprint     = (id)               => api.patch(`/sprints/${id}/demarrer`);
export const cloturerSprint     = (id, force=false)  => api.patch(`/sprints/${id}/cloturer?force=${force}`);
export const deleteSprint       = (id)               => api.delete(`/sprints/${id}`);