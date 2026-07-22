import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

// Types
export interface PaymentSchedule {
  id: number
  cheque_number: number
  due_date: string
  amount: string
  status: 'pending' | 'ready' | 'completed'
  reminder_30d_sent: boolean
  reminder_7d_sent: boolean
  reminder_1d_sent: boolean
}

export interface Lease {
  id: number
  building_name: string
  area: string
  unit_number: string
  address: string
  cheque_pattern: number
  start_date: string
  rent_amount: string
  payment_schedules: PaymentSchedule[]
  created_at: string
  updated_at: string
}

// Leases
export function useLeases() {
  return useQuery({
    queryKey: ['leases'],
    queryFn: async () => {
      const { data } = await api.get('/leases/')
      return data.results as Lease[]
    },
  })
}

export function useLease(id: number) {
  return useQuery({
    queryKey: ['leases', id],
    queryFn: async () => {
      const { data } = await api.get(`/leases/${id}/`)
      return data as Lease
    },
    enabled: !!id,
  })
}

// Payments
export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data } = await api.get('/payment-schedules/')
      return data.results as PaymentSchedule[]
    },
  })
}

export function useMarkReady() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (paymentId: number) => {
      const { data } = await api.post(`/payment-schedules/${paymentId}/mark-ready/`)
      return data as PaymentSchedule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['leases'] })
    },
  })
}
