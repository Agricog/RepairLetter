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
import { LetterToLandlordAboutRepairsPage } from './pages/LetterToLandlordAboutRepairsPage';
import { LandlordNotFixingRepairsPage } from './pages/LandlordNotFixingRepairsPage';
import { DampAndMouldLandlordLetterPage } from './pages/DampAndMouldLandlordLetterPage';
import { LandlordRepairObligationsPage } from './pages/LandlordRepairObligationsPage';
import { HowToReportLandlordToCouncilPage } from './pages/HowToReportLandlordToCouncilPage';
import { EnvironmentalHealthComplaintPage } from './pages/EnvironmentalHealthComplaintPage';
import { Section11LandlordTenantActPage } from './pages/Section11LandlordTenantActPage';
import { RentersRightsAct2025Page } from './pages/RentersRightsAct2025Page';
import { Section21AbolishedPage } from './pages/Section21AbolishedPage';
import { AwaabsLawLandlordPage } from './pages/AwaabsLawLandlordPage';
import { DecentHomesStandardPage } from './pages/DecentHomesStandardPage';
import { LandlordWontFixBoilerPage } from './pages/LandlordWontFixBoilerPage';
import { LandlordWontFixDampPage } from './pages/LandlordWontFixDampPage';
import { NoHeatingRentalPropertyPage } from './pages/NoHeatingRentalPropertyPage';
import { LandlordNotRespondingRepairRequestPage } from './pages/LandlordNotRespondingRepairRequestPage';
import { HowLongLandlordFixHeatingPage } from './pages/HowLongLandlordFixHeatingPage';
import { RepairLetterTemplateUKPage } from './pages/RepairLetterTemplateUKPage';
import { HHSRSComplaintLetterPage } from './pages/HHSRSComplaintLetterPage';

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
        <Route path="/letter-to-landlord-about-repairs" element={<LetterToLandlordAboutRepairsPage />} />
        <Route path="/landlord-not-fixing-repairs" element={<LandlordNotFixingRepairsPage />} />
        <Route path="/damp-and-mould-landlord-letter" element={<DampAndMouldLandlordLetterPage />} />
        <Route path="/landlord-repair-obligations-uk" element={<LandlordRepairObligationsPage />} />
        <Route path="/how-to-report-landlord-to-council" element={<HowToReportLandlordToCouncilPage />} />
        <Route path="/environmental-health-complaint-landlord" element={<EnvironmentalHealthComplaintPage />} />
        <Route path="/section-11-landlord-tenant-act" element={<Section11LandlordTenantActPage />} />
        <Route path="/renters-rights-act-2025" element={<RentersRightsAct2025Page />} />
        <Route path="/section-21-abolished" element={<Section21AbolishedPage />} />
        <Route path="/awaabs-law-landlord" element={<AwaabsLawLandlordPage />} />
        <Route path="/decent-homes-standard-private-renting" element={<DecentHomesStandardPage />} />
        <Route path="/landlord-wont-fix-boiler" element={<LandlordWontFixBoilerPage />} />
        <Route path="/landlord-wont-fix-damp" element={<LandlordWontFixDampPage />} />
        <Route path="/no-heating-rental-property-rights" element={<NoHeatingRentalPropertyPage />} />
        <Route path="/landlord-not-responding-repair-request" element={<LandlordNotRespondingRepairRequestPage />} />
        <Route path="/how-long-landlord-fix-heating" element={<HowLongLandlordFixHeatingPage />} />
        <Route path="/repair-letter-template-uk" element={<RepairLetterTemplateUKPage />} />
        <Route path="/hhsrs-complaint-letter" element={<HHSRSComplaintLetterPage />} />

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
