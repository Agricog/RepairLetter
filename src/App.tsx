import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useAuth,
  useUser,
} from '@clerk/clerk-react';
import { api } from './lib/api';
import { setSentryUser, clearSentryUser } from './lib/sentry';
import { setPhotoTokenGetter } from './hooks/useEvidencePhotos';
import { AppLayout } from './components/layout/AppLayout';
import { ConsentModal } from './components/ui/ConsentModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportPage } from './pages/ReportPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export function App() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [checkingConsent, setCheckingConsent] = useState(true);

  // Wire Clerk auth token into API client and photo loader
  useEffect(() => {
    const tokenGetter = async () => getToken();
    api.setAuthTokenGetter(tokenGetter);
    setPhotoTokenGetter(tokenGetter);
  }, [getToken]);

  // Set Sentry user context
  useEffect(() => {
    if (isSignedIn && user?.id) {
      setSentryUser(user.id);
    } else {
      clearSentryUser();
    }
  }, [isSignedIn, user?.id]);

  // Check if user has given consent
  useEffect(() => {
    if (!isSignedIn) {
      setCheckingConsent(false);
      return;
    }

    async function checkConsent() {
      try {
        const res = await api.get<{ consented: boolean }>('/api/users/consent');
        if (res.success && res.data) {
          setConsentGiven(res.data.consented);
        } else {
          // If endpoint fails, assume first-time user
          setConsentGiven(false);
        }
      } catch {
        setConsentGiven(false);
      }
      setCheckingConsent(false);
    }

    checkConsent();
  }, [isSignedIn]);

  const handleConsentAccepted = () => {
    setConsentGiven(true);
  };

  return (
    <>
      {/* Consent modal — shown after auth, before app access */}
      {isSignedIn && !checkingConsent && consentGiven === false && (
        <ConsentModal onAccept={handleConsentAccepted} />
      )}

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Protected pages */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/case/:caseId" element={<CaseDetailPage />} />
        </Route>

        {/* Catch-all — prevents route enumeration */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
