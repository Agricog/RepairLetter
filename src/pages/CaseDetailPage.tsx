import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Download,
  Camera,
  Mail,
  AlertTriangle,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Case, Evidence, Letter } from '../types';
import { DEFECT_TYPE_LABELS } from '../types';

interface CaseDetail {
  case_: Case;
  evidence: Evidence[];
  letters: Letter[];
}

export function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!caseId) return;
      const res = await api.get<CaseDetail>(`/api/cases/${caseId}`);
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }
    load();
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 border-2 border-shield border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate">Case not found.</p>
        <button onClick={() => navigate('/dashboard')} className="text-shield text-sm font-medium mt-2">
          Back to dashboard
        </button>
      </div>
    );
  }

  const { case_: c, evidence, letters } = data;

  const daysLeft = c.deadlineAt
    ? Math.max(0, Math.ceil((new Date(c.deadlineAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="p-1 -ml-1 text-slate hover:text-navy" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-navy truncate">
            {DEFECT_TYPE_LABELS[c.defectType]}
          </h1>
          <p className="text-xs text-slate font-mono">{c.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <StatusIndicator status={c.status} />
          <span className="text-xs text-slate">
            Severity {c.defectSeverity}/5
          </span>
        </div>
        {c.hhsrsCategory && (
          <p className="text-xs text-slate mb-2">
            <span className="font-semibold">HHSRS:</span> {c.hhsrsCategory}
          </p>
        )}
        {daysLeft !== null && c.status === 'sent' && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-navy">
              {daysLeft > 0 ? `${daysLeft} days until landlord deadline` : 'Deadline has passed'}
            </span>
          </div>
        )}
        {c.status === 'escalated' && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-sm font-medium text-danger">
              Council complaint ready — review and submit
            </span>
          </div>
        )}
      </div>

      {/* Evidence photos */}
      {evidence.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-navy mb-2 flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-slate" />
            Evidence Photos
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {evidence
              .filter((e) => e.contentType.startsWith('image/'))
              .map((e) => (
                <div key={e.id} className="aspect-square rounded-lg bg-slate-100 overflow-hidden">
                  {/* Photo loaded via signed URL from API */}
                  <div className="w-full h-full flex items-center justify-center text-slate-light">
                    <Camera className="h-6 w-6" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Letters */}
      {letters.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-navy mb-2 flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-slate" />
            Letters Sent
          </h3>
          <div className="flex flex-col gap-2">
            {letters.map((l) => (
              <div key={l.id} className="bg-white border border-border rounded-lg p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy capitalize">
                    {l.letterType.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate">
                    {new Date(l.sentAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <button className="p-2 text-shield hover:text-shield-dark" aria-label="Download PDF">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-6">
        {c.status !== 'resolved' && (
          <button className="w-full bg-white border border-border hover:border-shield text-navy font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
            <Camera className="h-4 w-4" />
            Add more evidence
          </button>
        )}
        <button className="w-full bg-white border border-border hover:border-shield text-navy font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
          <Download className="h-4 w-4" />
          Download evidence pack (PDF)
        </button>
        {c.status === 'sent' && (
          <button className="w-full bg-shield-light text-shield-dark font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Mark as resolved
          </button>
        )}
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: Case['status'] }) {
  const config = {
    draft: { label: 'Draft', color: 'text-slate', bg: 'bg-slate-100' },
    sent: { label: 'Letter Sent', color: 'text-info', bg: 'bg-info-light' },
    escalated: { label: 'Escalated', color: 'text-danger', bg: 'bg-danger-light' },
    resolved: { label: 'Resolved', color: 'text-shield-dark', bg: 'bg-shield-light' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${c.bg} ${c.color}`}>
      {status === 'resolved' ? <Shield className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {c.label}
    </span>
  );
}
