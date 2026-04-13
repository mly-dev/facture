import { useState, useEffect } from 'react'
import { invoicesApi } from '../api/invoices'

export function useInvoices(params = {}) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null })

  const fetchInvoices = async (p = params) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await invoicesApi.list(p)
      setInvoices(data.results || data)
      if (data.count !== undefined) {
        setPagination({ count: data.count, next: data.next, previous: data.previous })
      }
    } catch (e) {
      setError(e.response?.data || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoices() }, [JSON.stringify(params)])

  return { invoices, loading, error, pagination, refetch: fetchInvoices }
}
