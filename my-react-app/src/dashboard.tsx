import React, { useState } from "react";
import { motion } from 'framer-motion';
import { ComplianceService } from "./services/complianceService";
import { AuditService } from "./services/auditService";
import type { AuditResult } from "./services/auditResultService";
import CircularProgress from './components/CircularProgress';
import ProgressBar from './components/ProgressBar';

// Theme configuration
const theme = {
  maroon: "#500000",
  gold: "#d4af37",
  warmWhite: "#FFF9F7",
  text: "#2D2D2D",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444"
};

type DashboardProps = {
  companyName: string;
  firstName: string;
  onAuditResult?: (result: AuditResult) => void;
  onAnalysisStart?: () => void;
};

type Vendor = {
  name: string;
  status: 'compliant' | 'pending' | 'review';
  date: string;
};

type Client = {
  name: string;
  documentCount: number;
  type: string;
  date: string;
};

const mockVendors: Vendor[] = [
  { name: 'HexaCloud Analytics', status: 'compliant', date: '2025-11-05' },
  { name: 'Aurora Ridge', status: 'pending', date: '2025-11-02' },
];

const mockClients: Client[] = [
  { name: 'Kiblicad Analytics', documentCount: 36, type: 'bol', date: '2025-11-09' },
  { name: 'DataBridge Co.', documentCount: 14, type: 'mtruteds', date: '2025-11-05' },
];

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
  const complianceScore = 82;
  
  return (
    <div className="dashboard" style={{
      minHeight: "100vh",
      background: theme.warmWhite,
      color: theme.text,
      padding: "2rem",
    }}>
      {/* Header */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
      }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Nexus One – Control Center
          </h1>
          <p style={{ color: "#666" }}>Managing: 12 Vendors • 5 Clients</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <input
            type="search"
            placeholder="Search vendors, clients, or documents..."
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #E5E7EB",
              width: "320px"
            }}
          />
          <button style={{
            padding: "0.5rem 1rem",
            background: theme.maroon,
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer"
          }}>
            {firstName}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "2rem",
        marginBottom: "2rem"
      }}>
        {/* Compliance Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "1rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <CircularProgress percentage={complianceScore} />
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>Overall</h2>
              <p style={{ color: "#666", marginBottom: "1rem" }}>Compliance Score</p>
              <p style={{ color: theme.danger }}>↓ 5.0% in last 30 days</p>
            </div>
          </div>
        </motion.div>

        {/* Risk Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "1rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)"
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Risk Overview</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span>Vendors</span>
                <span>75%</span>
              </div>
              <ProgressBar percentage={75} color={theme.success} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span>Clients</span>
                <span>90%</span>
              </div>
              <ProgressBar percentage={90} color={theme.success} />
            </div>
          </div>
          <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "1rem" }}>
            Based on last AI review of uploaded docs.
          </p>
        </motion.div>
      </div>

      {/* Vendors & Clients Section */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem" }}>
          Nexus AI – Compliance Insights
        </h2>
        
        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          gap: "2rem", 
          borderBottom: "1px solid #E5E7EB",
          marginBottom: "1.5rem"
        }}>
          {["All", "Vendors", "Clients", "Documents"].map((tab) => (
            <button
              key={tab}
              style={{
                padding: "0.5rem 0",
                background: "none",
                border: "none",
                borderBottom: tab === "All" ? `2px solid ${theme.maroon}` : "none",
                color: tab === "All" ? theme.maroon : "#666",
                fontWeight: tab === "All" ? 600 : 400,
                cursor: "pointer"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* High Priority Issues */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ 
            fontSize: "1.25rem", 
            fontWeight: 600, 
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <span style={{ color: theme.danger }}>⚠</span> High Priority
          </h3>
          
          <ul style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <li style={{
              padding: "1rem",
              background: "#FEF2F2",
              borderRadius: "0.5rem",
              border: `1px solid ${theme.danger}25`
            }}>
              HexaCloud's SOC 7 mentions "suprocessessors" not listed with your vendor inventory.
            </li>
            <li style={{
              padding: "1rem",
              background: "#FEF2F2",
              borderRadius: "0.5rem",
              border: `1px solid ${theme.danger}25`
            }}>
              Aurora Ridge's retention policy conflicts with your 7-year financial record requirement.
            </li>
          </ul>
        </div>

        {/* Vendors Table */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Vendors</h3>
          <div style={{
            background: "white",
            borderRadius: "0.5rem",
            overflow: "hidden"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#F9FAFB" }}>
                <tr>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {mockVendors.map((vendor) => (
                  <tr key={vendor.name} style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>{vendor.name}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "1rem",
                        fontSize: "0.875rem",
                        background: vendor.status === 'compliant' ? `${theme.success}15` : `${theme.warning}15`,
                        color: vendor.status === 'compliant' ? theme.success : theme.warning
                      }}>
                        {vendor.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>{vendor.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clients Table */}
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Clients</h3>
          <div style={{
            background: "white",
            borderRadius: "0.5rem",
            overflow: "hidden"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#F9FAFB" }}>
                <tr>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Documents</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {mockClients.map((client) => (
                  <tr key={client.name} style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>{client.name}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {client.documentCount} {client.type}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>{client.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Document Button */}
      <label
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          padding: "1rem 2rem",
          background: theme.maroon,
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}
      >
        + Upload new document
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept=".pdf,.docx,.txt"
        />
      </label>
    </div>
  );
}
