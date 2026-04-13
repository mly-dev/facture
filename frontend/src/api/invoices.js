import api from './axios'

export const invoicesApi = {
  list: (params) => api.get('/invoices/', { params }),
  get: (id) => api.get(`/invoices/${id}/`),
  create: (data) => api.post('/invoices/', data),
  update: (id, data) => api.put(`/invoices/${id}/`, data),
  patch: (id, data) => api.patch(`/invoices/${id}/`, data),
  delete: (id) => api.delete(`/invoices/${id}/`),
  send: (id) => api.post(`/invoices/${id}/send/`),
  cancel: (id) => api.post(`/invoices/${id}/cancel/`),
  pdfUrl: (id) => `/api/invoices/${id}/pdf/`,
  addPayment: (id, data) => api.post(`/invoices/${id}/payment/`, data),
  deletePayment: (invoiceId, paymentId) => api.delete(`/invoices/${invoiceId}/payment/${paymentId}/`),
}
