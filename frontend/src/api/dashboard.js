import api from './axios'

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats/'),
}
