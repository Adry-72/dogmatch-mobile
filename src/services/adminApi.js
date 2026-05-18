import api from './api';

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getStatisticheComplete: () => api.get('/admin/statistiche'),
  getMatchRecenti: () => api.get('/admin/matches-recenti'),

  getUtenti: () => api.get('/admin/utenti'),
  getSingoloUtente: (id) => api.get(`/admin/utenti/${id}`),
  toggleVerifica: (id, isVerificato) => api.put(`/admin/utenti/${id}/verifica`, { isVerificato }),
  toggleBlocco: (id) => api.put(`/admin/utenti/${id}/blocco`),
  cambiaRuolo: (id, ruolo) => api.put(`/admin/utenti/${id}/ruolo`, { ruolo }),
  eliminaUtente: (id) => api.delete(`/admin/utenti/${id}`),

  getSegnalazioni: (stato) => api.get('/admin/segnalazioni', { params: stato ? { stato } : {} }),
  aggiornaSegnalazione: (id, stato, notaModerazione) => api.put(`/admin/segnalazioni/${id}/stato`, { stato, notaModerazione }),
  eliminaSegnalazione: (id) => api.delete(`/admin/segnalazioni/${id}`),

  getCani: () => api.get('/admin/cani'),
  getSingoloCane: (id) => api.get(`/admin/cani/${id}`),
  verificaPedigree: (id, isVerificato) => api.put(`/admin/cani/${id}/verifica-pedigree`, { isVerificato }),
  toggleSegnalazione: (id) => api.put(`/admin/cani/${id}/segnalazione`),
  eliminaCane: (id) => api.delete(`/admin/cani/${id}`),
};
