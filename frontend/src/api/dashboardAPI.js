import api from './axiosConfig';
 
export const getStatsGlobales     = ()   => api.get('/dashboard/stats');
export const getDashboardComplet  = ()   => api.get('/dashboard/complet');
export const getStatsByEncadrant  = (id) => api.get(`/dashboard/stats/encadrant/${id}`);
 
// Export PDF — retourne un blob
export const exporterRapportGlobal = () =>
  api.get('/dashboard/export/global', { responseType: 'blob' });
 
export const exporterRapportStagiaire = (id) =>
  api.get(`/dashboard/export/stagiaire/${id}`, { responseType: 'blob' });
 
// Helper — télécharger un blob PDF
export const telechargerPdf = (blob, nomFichier) => {
  const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nomFichier);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};