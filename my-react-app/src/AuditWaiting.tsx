import { useEffect } from 'react';
import type { AuditResult } from './services/auditResultService';

interface AuditWaitingProps {
  onCompliancePassed: (userId: string) => void;
  onRetryUpload: () => void;
  auditResult: AuditResult | null;
  isAnalyzing: boolean;
}

export default function AuditWaiting({
  onCompliancePassed,
  onRetryUpload,
  auditResult,
  isAnalyzing,
}: AuditWaitingProps) {
  useEffect(() => {
    // Effect triggered when auditResult changes
  }, [auditResult]);

  if (isAnalyzing && !auditResult) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 600,
            width: '100%',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: '1.5rem',
              animation: 'pulse 2s infinite',
            }}
          >
            🔍
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: '0.5rem' }}>
            Analyzing Your Documents
          </h1>

          <p
            style={{
              fontSize: 16,
              opacity: 0.8,
              marginBottom: '2rem',
              maxWidth: 400,
            }}
          >
            Our AI is reviewing your compliance documents. This typically takes
            30-120 seconds.
          </p>

          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#4f46e5',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span>Scanning cybersecurity documentation...</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                opacity: 0.6,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(79,70,229,0.5)',
                }}
              />
              <span>Checking financial records...</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                opacity: 0.6,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(79,70,229,0.5)',
                }}
              />
              <span>Analyzing risk assessment...</span>
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            Please do not close this window
          </p>

          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (auditResult && auditResult.status === 'passed') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 600,
            width: '100%',
            background: 'white',
            borderRadius: 16,
            padding: '2rem',
            textAlign: 'center',
            color: '#020617',
            boxShadow: '0 20px 50px rgba(15,23,42,0.4)',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: '1rem' }}>✅</div>

          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: '0.5rem' }}>
            Compliance Approved!
          </h1>

          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: '1.5rem' }}>
            Your account has been verified and approved. You can now access your
            analytics dashboard.
          </p>

          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 12,
              padding: '1rem',
              marginBottom: '2rem',
              textAlign: 'left',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#16a34a' }}>
              Compliance Score: {auditResult.complianceScore}/100
            </p>
            {auditResult.geminiSummary && (
              <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>
                {auditResult.geminiSummary.executiveSummary}
              </p>
            )}
          </div>

          <button
            onClick={() => onCompliancePassed(auditResult.tempUserId)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 9999,
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              color: 'white',
              background: '#4f46e5',
              cursor: 'pointer',
            }}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (auditResult && auditResult.status === 'failed') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 700,
            width: '100%',
            background: 'white',
            borderRadius: 16,
            padding: '2rem',
            color: '#020617',
            boxShadow: '0 20px 50px rgba(15,23,42,0.4)',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: '1rem', textAlign: 'center' }}>
            ⚠️
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              marginBottom: '0.5rem',
              textAlign: 'center',
            }}
          >
            Compliance Review Required
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#6b7280',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            Your account did not meet all compliance requirements. Please address
            the issues below and resubmit.
          </p>

          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: 12,
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <p
              style={{
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#dc2626',
              }}
            >
              Compliance Score: {auditResult.complianceScore}/100
            </p>
            <p style={{ fontSize: 12, color: '#4b5563' }}>
              Score must be 70 or higher to pass
            </p>
          </div>

          {auditResult.geminiSummary && (
            <div
              style={{
                background: '#f9fafb',
                borderRadius: 12,
                padding: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                }}
              >
                Executive Summary
              </h3>
              <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
                {auditResult.geminiSummary.executiveSummary}
              </p>
            </div>
          )}

          {auditResult.complianceResult.issues &&
            auditResult.complianceResult.issues.length > 0 && (
              <div
                style={{
                  background: '#fef3c7',
                  borderRadius: 12,
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    color: '#d97706',
                  }}
                >
                  Issues Found
                </h3>
                <ul style={{ fontSize: 12, color: '#4b5563', paddingLeft: 20 }}>
                  {auditResult.complianceResult.issues.map(
                    (issue: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '0.5rem' }}>
                        {issue}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

          {auditResult.requiredActions && auditResult.requiredActions.length > 0 && (
            <div
              style={{
                background: '#f0f9ff',
                borderRadius: 12,
                padding: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: '#0369a1',
                }}
              >
                Required Actions
              </h3>
              <ol style={{ fontSize: 12, color: '#4b5563', paddingLeft: 20 }}>
                {auditResult.requiredActions.map((action: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p
            style={{
              fontSize: 12,
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}
          >
            Your information was not saved. Please gather the required
            documents and try again.
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onRetryUpload}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: 9999,
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                color: 'white',
                background: '#4f46e5',
                cursor: 'pointer',
              }}
            >
              Re-upload Documents
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: 9999,
                border: '1px solid #e5e7eb',
                fontSize: 14,
                fontWeight: 600,
                color: '#020617',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              Return to Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}