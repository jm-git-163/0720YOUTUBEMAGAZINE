import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth'
import { LocaleProvider } from '@/i18n/LocaleContext'
import { TopNav } from '@/components/TopNav'
import { Footer } from '@/components/Footer'
import { GlobalLoadingIndicator } from '@/components/GlobalLoadingIndicator'
import { AnalyticsBeacon } from '@/components/AnalyticsBeacon'
import { HomePage } from '@/pages/HomePage'
import { BriefPage } from '@/pages/BriefPage'
import { RankingsPage } from '@/pages/RankingsPage'
import { ChannelRankingsPage } from '@/pages/ChannelRankingsPage'
import { ArticlePage } from '@/pages/ArticlePage'
import { SearchPage } from '@/pages/SearchPage'
import { LoginPage } from '@/pages/LoginPage'
import { EditorPage } from '@/pages/EditorPage'
import { EditorAnalyticsPage } from '@/pages/EditorAnalyticsPage'
import { PrefetchOnMount } from '@/components/PrefetchOnMount'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      // Do NOT keepPreviousData globally — it keeps the previous language's
      // titles on screen when switching KO/EN/JA.
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-surface-pure">
              <GlobalLoadingIndicator />
              <TopNav />
              <PrefetchOnMount />
              <AnalyticsBeacon />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/brief" element={<BriefPage />} />
                <Route path="/channels" element={<ChannelRankingsPage />} />
                <Route path="/creators" element={<RankingsPage />} />
                <Route
                  path="/rankings"
                  element={<Navigate to="/creators" replace />}
                />
                <Route path="/article/:videoId" element={<ArticlePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/editor" element={<EditorPage />} />
                <Route path="/dashboard" element={<EditorAnalyticsPage />} />
                <Route
                  path="/editor/analytics"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  )
}
