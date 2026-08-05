import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { WaitlistPage } from '@/features/waitlist/WaitlistPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function OnboardingPage() {
  return <OnboardingWizard />
}

function AppRoutes() {
  const { loadUser, isLoading } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-500">Loading...</div>
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<WaitlistPage />} />
      <Route path="/waitlist" element={<WaitlistPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Onboarding (authenticated but no sidebar) */}
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      {/* Authenticated app with sidebar layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
