import axios from 'axios'
import api from './axios'

export const authApi = {
  register: (data) => axios.post('/api/auth/register/', data),
  login: (data) => axios.post('/api/auth/login/', data),
  refresh: (refresh) => axios.post('/api/auth/refresh/', { refresh }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  getCompany: () => api.get('/auth/company/'),
  updateCompany: (data) => {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== null && v !== undefined) formData.append(k, v)
    })
    return api.patch('/auth/company/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}
