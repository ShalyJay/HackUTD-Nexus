import React, { useState } from "react";
import { ComplianceService } from "./services/complianceService";
import { AuditService } from "./services/auditService";
import type { AuditResult } from "./services/auditResultService";

type DashboardProps = {
  companyName: string;
  firstName: string;
  onAuditResult?: (result: AuditResult) => void;
  onAnalysisStart?: () => void;
};

export default function Dashboard({ 
  companyName, 
  firstName,
  onAuditResult,
  onAnalysisStart
}: DashboardProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(e.target.files);
  }

  async function handleUpload() {
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      // Notify parent that analysis is starting
      onAnalysisStart?.();

      // Convert FileList to array for easier handling
      const files = Array.from(selectedFiles);

      // Create metadata for each file
      const metadata = files.map(file => ({
        type: getDocumentType(file.name),
      }));

      // Store documents temporarily (these will be deleted if compliance fails)
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await ComplianceService.storeTemporaryDocuments(
        tempUserId,
        files,
        metadata
      );

      // Check compliance with Gemini analysis
      const complianceResult = await ComplianceService.checkComplianceAndStore(tempUserId, files);

      // Generate audit report with Gemini summary
      const auditReport = await AuditService.generateAuditReport(
        tempUserId,
        complianceResult,
        companyName
      );

      // Create AuditResult object combining the audit report data
      const auditResult: AuditResult = {
        tempUserId,
        status: auditReport.status,
        complianceScore: complianceResult.score,
        complianceResult: complianceResult,
        geminiSummary: auditReport.geminiSummary,
        requiredActions: auditReport.requiredActions || [],
        timestamp: auditReport.timestamp
      };

      // Callback with audit result
      onAuditResult?.(auditResult);
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to process documents. Please try again.';
      alert(errorMsg);
    }
  }

  // Helper function to determine document type from filename
  function getDocumentType(filename: string): string {
    const lowercased = filename.toLowerCase();
    if (lowercased.includes('cyber') || lowercased.includes('security')) return 'cybersecurity';
    if (lowercased.includes('criminal') || lowercased.includes('investigation')) return 'criminal';
    if (lowercased.includes('financial') || lowercased.includes('finance')) return 'financial';
    if (lowercased.includes('risk')) return 'risk';
    return 'other';
  }
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          width: "100%",
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: "1.5rem",
          color: "white",
        }}
      >
        {/* Left side: welcome */}
        <div
          style={{
            borderRadius: 16,
            padding: "1.75rem",
            background:
              "radial-gradient(circle at top left, #4f46e5, #0f172a)",
            boxShadow: "0 18px 40px rgba(15,23,42,0.7)",
          }}
        >
          <p style={{ fontSize: 14, opacity: 0.8 }}>Welcome, {firstName}</p>
          <h1 style={{ marginTop: 8, fontSize: 24, fontWeight: 600 }}>
            {companyName || "Your company"} dashboard
          </h1>
          <p
            style={{
              marginTop: 12,
              fontSize: 14,
              opacity: 0.9,
              maxWidth: 320,
            }}
          >
            To finish setting up your workspace, upload your security and
            compliance documents. We&apos;ll analyze them and surface risks
            automatically.
          </p>

          <ul style={{ marginTop: 16, fontSize: 13, opacity: 0.9 }}>
            <li>• SOC 2 reports</li>
            <li>• ISO 27001 certificates</li>
            <li>• DPAs, MSAs, and security policies</li>
          </ul>
        </div>

        {/* Right side: upload card */}
        <div
          style={{
            background: "white",
            color: "#020617",
            borderRadius: 16,
            padding: "1.75rem",
            boxShadow: "0 18px 40px rgba(15,23,42,0.5)",
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Complete your profile
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 16,
            }}
          >
            Upload at least one document so your vendor/client profile can be
            reviewed.
          </p>

          <label
            style={{
              display: "block",
              borderRadius: 12,
              border: "1px dashed #cbd5f5",
              padding: "1.5rem",
              background: "#f9fafb",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 500, color: "#4f46e5" }}>
              Click to choose files
            </p>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              PDF, DOCX, or TXT · You can select multiple files
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>

          {selectedFiles && selectedFiles.length > 0 && (
            <div style={{ marginTop: 16, fontSize: 12 }}>
              <p style={{ fontWeight: 500, marginBottom: 4 }}>Selected files:</p>
              <ul
                style={{
                  maxHeight: 120,
                  overflowY: "auto",
                  paddingLeft: 16,
                  listStyle: "disc",
                }}
              >
                {Array.from(selectedFiles).map((file) => (
                  <li key={file.name}>
                    {file.name}{" "}
                    <span style={{ color: "#9ca3af" }}>
                      ({Math.round(file.size / 1024)} KB)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFiles || selectedFiles.length === 0}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "0.6rem 0.75rem",
              borderRadius: 9999,
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              color: "white",
              background:
                !selectedFiles || selectedFiles.length === 0
                  ? "#9ca3af"
                  : "#4f46e5",
              cursor:
                !selectedFiles || selectedFiles.length === 0
                  ? "default"
                  : "pointer",
            }}
          >
            Upload and continue
          </button>

          <p
            style={{
              marginTop: 10,
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            (For now this just logs files to the console so the backend can later
            connect the real upload endpoint.)
          </p>
        </div>
      </div>
    </div>
  );
}
