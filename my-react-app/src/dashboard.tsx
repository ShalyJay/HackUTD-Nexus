import React, { useState, useEffect } from "react";
import { ComplianceService } from "./services/complianceService";
import { AuditService } from "./services/auditService";
import { UserService } from "./services/userService";
import type { AuditResult } from "./services/auditResultService";
import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const theme = {
  maroon: "#500000",
  gold: "#d4af37",
  warmWhite: "#FFF9F7",
  text: "#2D2D2D",
  lightText: "#666666",
  gray: "#6b7280",
  lightGray: "#e5e7eb",
  veryLightGray: "#f3f4f6",
  green: "#16a34a",
  red: "#dc2626",
  orange: "#f97316"
};

interface Vendor {
  id: string;
  companyName: string;
  status: "Compliant" | "In review" | "Pending AI";
  lastDocument: string;
  riskLevel: "High Risk" | "Medium Risk" | "Low Risk";
  score: number;
  documents: {
    soc2: { status: string; date: string };
    pci: { status: string; date: string };
    iso: { status: string; date: string };
  };
}

interface Client {
  id: string;
  companyName: string;
  totalVendors: number;
  activeReviews: number;
  documents: {
    name: string;
    status: string;
    date: string;
  }[];
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  accountType: "vendors" | "clients" | "admin";
  documents: {
    soc2Cert?: File;
    iso27001Cert?: File;
    auditReports?: File;
    insuranceCert?: File;
  };
  lastAuditScore?: number;
  lastAuditDate?: string;
}

interface DashboardProps {
  userProfile: UserProfile;
  userId: string;
  onAuditResult?: (result: AuditResult) => void;
  onAnalysisStart?: () => void;
}

export default function Dashboard({ 
  userProfile,
  userId,
  onAuditResult,
  onAnalysisStart
}: DashboardProps) {
  const [selectedTab, setSelectedTab] = useState<"overview" | "profile" | "upload">("overview");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [complianceStandards, setComplianceStandards] = useState<FileList | null>(null);

  useEffect(() => {
    // Fetch data based on user role
    async function fetchData() {
      try {
        if (userProfile.accountType === "admin") {
          // Admin sees all data
          const [vendorData, clientData] = await Promise.all([
            ComplianceService.getAllVendors(),
            ComplianceService.getAllClients()
          ]);
          setVendors(vendorData);
          setClients(clientData);
        } else if (userProfile.accountType === "vendors") {
          // Vendors only see admin's client data
          const clientData = await ComplianceService.getAdminClients();
          setClients(clientData);
        } else {
          // Clients only see admin's vendor data
          const vendorData = await ComplianceService.getAdminVendors();
          setVendors(vendorData);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    }

    fetchData();
  }, [userProfile.accountType]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(e.target.files);
  }

  function handleComplianceStandardsChange(e: React.ChangeEvent<HTMLInputElement>) {
    setComplianceStandards(e.target.files);
  }

  async function handleUploadComplianceStandards() {
    if (!complianceStandards || complianceStandards.length === 0) return;

    try {
      const files = Array.from(complianceStandards);
      const standardsCollection = collection(db, "compliance_standards");
      
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const content = event.target?.result as string;
          await addDoc(standardsCollection, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            uploadedBy: userProfile.email,
            uploadedAt: Timestamp.now(),
            content: content,
            description: `Compliance standard uploaded by ${userProfile.firstName} ${userProfile.lastName}`
          });
        };
        reader.readAsText(file);
      }

      // Clear the selection after upload
      setComplianceStandards(null);
      const fileInput = document.querySelector('input[name="compliance-standards"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      alert(`Successfully uploaded ${files.length} compliance standard(s)!`);
    } catch (err) {
      console.error('Compliance standards upload failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload compliance standards.';
      alert(errorMsg);
    }
  }

  async function handleUpload() {
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      onAnalysisStart?.();
      const files = Array.from(selectedFiles);

      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const complianceResult = await ComplianceService.checkComplianceAndStore(tempUserId, files);
      const auditReport = await AuditService.generateAuditReport(
        tempUserId,
        complianceResult,
        userProfile.companyName
      );

      // Save user upload data to Firebase
      try {
        await UserService.updateUserWithUpload(userId, {
          documentNames: files.map(f => f.name),
          documentCount: files.length,
          lastUploadDate: Timestamp.now(),
          uploadedFiles: {
            soc2: files.find(f => f.name.toLowerCase().includes('soc2'))?.name,
            iso27001: files.find(f => f.name.toLowerCase().includes('iso'))?.name,
            auditReports: files.find(f => f.name.toLowerCase().includes('audit'))?.name,
            insurance: files.find(f => f.name.toLowerCase().includes('insurance'))?.name,
          }
        });
        console.log("User upload data saved to Firebase");
      } catch (fbErr) {
        console.error("Failed to save upload data to Firebase:", fbErr);
        // Don't fail the upload if Firebase save fails
      }

      const auditResult: AuditResult = {
        tempUserId,
        status: auditReport.status,
        complianceScore: complianceResult.score,
        complianceResult: complianceResult,
        geminiSummary: auditReport.geminiSummary,
        requiredActions: auditReport.requiredActions || [],
        timestamp: auditReport.timestamp
      };

      // If callback is provided (from signup flow), use it
      if (onAuditResult) {
        onAuditResult(auditResult);
      } else {
        // If no callback, show success message in dashboard
        alert(`Compliance analysis complete!\n\nScore: ${complianceResult.score}%\nStatus: ${auditReport.status}`);
        setSelectedFiles(null);
        // Reset file input
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
          (input as HTMLInputElement).value = '';
        });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to process documents. Please try again.';
      alert(errorMsg);
    }
  }

  return (
    <div className="dashboard-root" style={{
      minHeight: "100vh",
      width: "100%",
      background: theme.warmWhite,
      paddingBottom: "2rem"
    }}>
      {/* Header */}
      <header style={{
        background: "white",
        borderBottom: `1px solid ${theme.lightGray}`,
        padding: "1rem max(1rem, 2vw)",
        marginBottom: "0.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{ 
              fontSize: "1.75rem", 
              color: theme.maroon, 
              marginBottom: "0.25rem",
              marginTop: 0,
              fontWeight: 700
            }}>
              Nexus One
            </h1>
            <p style={{ 
              color: theme.lightText,
              fontSize: "0.95rem",
              margin: 0
            }}>
              {userProfile.companyName} • {userProfile.accountType.charAt(0).toUpperCase() + userProfile.accountType.slice(1)}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              background: theme.veryLightGray,
              borderRadius: 8
            }}>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: theme.maroon, color: "white", borderRadius: "50%" }}>U</div>
              <div>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500, color: theme.text }}>
                  {userProfile.firstName} {userProfile.lastName}
                </p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: theme.gray }}>
                  {userProfile.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        background: "white",
        borderBottom: `2px solid ${theme.lightGray}`,
        marginBottom: "1rem"
      }}>
        <nav style={{
          display: "flex",
          gap: "0",
          padding: "0 max(1rem, 2vw)"
        }}>
          {[
            { id: "overview", label: "Dashboard", icon: "" },
            { id: "profile", label: "Profile", icon: "" },
            { id: "upload", label: "Upload Documents", icon: "" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              style={{
                padding: "1rem 1.5rem",
                background: "transparent",
                border: "none",
                borderBottom: `3px solid ${selectedTab === tab.id ? theme.maroon : "transparent"}`,
                color: selectedTab === tab.id ? theme.maroon : theme.gray,
                fontWeight: selectedTab === tab.id ? 600 : 400,
                cursor: "pointer",
                fontSize: "1rem",
                transition: "all 0.2s ease"
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main style={{ 
        padding: "0 max(1rem, 2vw)"
      }}>
        {selectedTab === "overview" && (
          <div style={{ display: "grid", gap: "1.5rem" }}>
            {/* Compliance Score Card */}
            <div style={{
              background: "white",
              borderRadius: 12,
              padding: "1.5rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              borderLeft: `6px solid ${theme.maroon}`
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <div>
                  <p style={{ 
                    color: theme.lightText, 
                    fontSize: "0.95rem",
                    margin: "0 0 0.5rem 0",
                    fontWeight: 500
                  }}>
                    Overall Compliance Score
                  </p>
                  <div style={{
                    fontSize: "3.5rem",
                    fontWeight: 700,
                    color: theme.maroon,
                    marginBottom: "1rem"
                  }}>
                    82%
                  </div>
                  <div style={{
                    fontSize: "0.9rem",
                    color: theme.red,
                    fontWeight: 500
                  }}>
                    ▼ 50% change in last 30 days
                  </div>
                </div>

                <div>
                  <p style={{ 
                    color: theme.lightText, 
                    fontSize: "0.95rem",
                    margin: "0 0 1rem 0",
                    fontWeight: 500
                  }}>
                    Risk Overview
                  </p>
                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 500, color: theme.text }}>Vendors</span>
                      </div>
                      <div style={{
                        width: "100%",
                        height: 10,
                        background: theme.lightGray,
                        borderRadius: 4,
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: "60%",
                          height: "100%",
                          background: `linear-gradient(to right, ${theme.green}, ${theme.orange}, ${theme.red})`
                        }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 500, color: theme.text }}>Clients</span>
                      </div>
                      <div style={{
                        width: "100%",
                        height: 10,
                        background: theme.lightGray,
                        borderRadius: 4,
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: "85%",
                          height: "100%",
                          background: theme.green
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vendors Section */}
            {userProfile.accountType !== "vendors" && (
              <div>
                <h2 style={{ 
                  fontSize: "1.5rem", 
                  color: theme.maroon,
                  marginBottom: "0.75rem",
                  marginTop: 0
                }}>
                  Vendors
                </h2>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {vendors.length > 0 ? (
                    vendors.map(vendor => (
                      <div 
                        key={vendor.id} 
                        style={{
                          background: "white",
                          padding: "1.25rem",
                          borderRadius: 12,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "2rem",
                          borderLeft: `4px solid ${vendor.riskLevel === "High Risk" ? theme.red : vendor.riskLevel === "Medium Risk" ? theme.orange : theme.green}`
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: "0 0 0.25rem 0", color: theme.text, fontSize: "1rem" }}>
                            {vendor.companyName}
                          </h4>
                          <p style={{ margin: 0, color: theme.gray, fontSize: "0.9rem" }}>
                            Status: <strong>{vendor.status}</strong>
                          </p>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 0.25rem 0", color: theme.lightText, fontSize: "0.85rem", fontWeight: 500 }}>
                            SOC 2
                          </p>
                          <p style={{ margin: 0, color: theme.text, fontWeight: 600 }}>
                            {vendor.documents.soc2.status}
                          </p>
                          <p style={{ margin: "0.25rem 0 0 0", color: theme.gray, fontSize: "0.85rem" }}>
                            {vendor.documents.soc2.date}
                          </p>
                        </div>
                        <div style={{ textAlign: "right", minWidth: "fit-content" }}>
                          <div style={{
                            display: "inline-block",
                            padding: "0.5rem 1rem",
                            background: vendor.score >= 80 ? `${theme.green}15` : vendor.score >= 60 ? `${theme.orange}15` : `${theme.red}15`,
                            color: vendor.score >= 80 ? theme.green : vendor.score >= 60 ? theme.orange : theme.red,
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: "0.95rem"
                          }}>
                            {vendor.score}%
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      background: "white",
                      padding: "2rem",
                      borderRadius: 12,
                      textAlign: "center",
                      color: theme.gray
                    }}>
                      No vendors to display
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Clients Section */}
            {userProfile.accountType !== "clients" && (
              <div>
                <h2 style={{ 
                  fontSize: "1.5rem", 
                  color: theme.maroon,
                  marginBottom: "0.75rem",
                  marginTop: 0
                }}>
                  Clients
                </h2>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {clients.length > 0 ? (
                    clients.map(client => (
                      <div 
                        key={client.id}
                        style={{
                          background: "white",
                          padding: "1.25rem",
                          borderRadius: 12,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "2rem",
                          borderLeft: `4px solid ${theme.gold}`
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: "0 0 0.25rem 0", color: theme.text, fontSize: "1rem" }}>
                            {client.companyName}
                          </h4>
                          <p style={{ margin: 0, color: theme.gray, fontSize: "0.9rem" }}>
                            {client.totalVendors} vendors • {client.activeReviews} active reviews
                          </p>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 0.25rem 0", color: theme.lightText, fontSize: "0.85rem", fontWeight: 500 }}>
                            Latest Document
                          </p>
                          <p style={{ margin: 0, color: theme.text, fontWeight: 500, fontSize: "0.9rem" }}>
                            {client.documents[0]?.name || "—"}
                          </p>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 0.25rem 0", color: theme.lightText, fontSize: "0.85rem", fontWeight: 500 }}>
                            Status
                          </p>
                          <p style={{ margin: 0, color: theme.text, fontWeight: 500 }}>
                            {client.documents[0]?.status || "—"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right", minWidth: "fit-content" }}>
                          <span style={{ fontSize: "1.2rem" }}>→</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      background: "white",
                      padding: "2rem",
                      borderRadius: 12,
                      textAlign: "center",
                      color: theme.gray
                    }}>
                      No clients to display
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === "profile" && (
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: "2rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <h2 style={{ 
              fontSize: "1.5rem", 
              color: theme.maroon,
              marginBottom: "1.5rem",
              marginTop: 0
            }}>
              Company Profile
            </h2>
            
            <div style={{ display: "grid", gap: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                <div>
                  <p style={{ color: theme.lightText, fontSize: "0.9rem", fontWeight: 500, margin: "0 0 0.5rem 0" }}>
                    Company Name
                  </p>
                  <p style={{ color: theme.text, fontSize: "1rem", fontWeight: 500, margin: 0 }}>
                    {userProfile.companyName}
                  </p>
                </div>

                <div>
                  <p style={{ color: theme.lightText, fontSize: "0.9rem", fontWeight: 500, margin: "0 0 0.5rem 0" }}>
                    Account Type
                  </p>
                  <p style={{ color: theme.text, fontSize: "1rem", fontWeight: 500, margin: 0, textTransform: "capitalize" }}>
                    {userProfile.accountType}
                  </p>
                </div>

                <div>
                  <p style={{ color: theme.lightText, fontSize: "0.9rem", fontWeight: 500, margin: "0 0 0.5rem 0" }}>
                    Contact Name
                  </p>
                  <p style={{ color: theme.text, fontSize: "1rem", fontWeight: 500, margin: 0 }}>
                    {userProfile.firstName} {userProfile.lastName}
                  </p>
                </div>

                <div>
                  <p style={{ color: theme.lightText, fontSize: "0.9rem", fontWeight: 500, margin: "0 0 0.5rem 0" }}>
                    Email Address
                  </p>
                  <p style={{ color: theme.text, fontSize: "1rem", fontWeight: 500, margin: 0 }}>
                    {userProfile.email}
                  </p>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: `1px solid ${theme.lightGray}`, margin: "1rem 0" }} />

              <div>
                <h3 style={{ 
                  fontSize: "1.1rem", 
                  color: theme.maroon,
                  marginTop: 0,
                  marginBottom: "1rem"
                }}>
                  Documents
                </h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {Object.entries(userProfile.documents).map(([key, file]) => (
                    <div 
                      key={key} 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "1rem",
                        background: theme.veryLightGray,
                        borderRadius: 8,
                        gap: "1rem",
                        borderLeft: `3px solid ${file ? theme.green : theme.lightGray}`
                      }}
                    >
                      <span style={{ fontSize: 18, color: theme.maroon, fontWeight: "bold" }}>D</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, color: theme.text, fontWeight: 500, fontSize: "0.95rem" }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p style={{ margin: "0.25rem 0 0 0", color: theme.gray, fontSize: "0.85rem" }}>
                          {file?.name || "Not uploaded"}
                        </p>
                      </div>
                      {file && (
                        <span style={{ color: theme.green, fontSize: "1.2rem", fontWeight: "bold" }}>Ready</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <hr style={{ border: "none", borderTop: `1px solid ${theme.lightGray}`, margin: "1rem 0" }} />

              <div>
                <h3 style={{ 
                  fontSize: "1.1rem", 
                  color: theme.maroon,
                  marginTop: 0,
                  marginBottom: "1rem"
                }}>
                  Compliance Validation
                </h3>
                <div style={{ display: "grid", gap: "1rem" }}>
                  <div style={{
                    background: theme.veryLightGray,
                    padding: "1.25rem",
                    borderRadius: 8,
                    borderLeft: `4px solid ${theme.green}`
                  }}>
                    <p style={{ margin: "0 0 0.5rem 0", color: theme.text, fontWeight: 600, fontSize: "0.95rem" }}>
                      Standards Validation
                    </p>
                    <p style={{ margin: 0, color: theme.lightText, fontSize: "0.85rem" }}>
                      Your documents are validated against admin-provided compliance standards (SOC2, ISO27001, HIPAA, PCI-DSS, etc.)
                    </p>
                  </div>
                </div>
              </div>

              {userProfile.lastAuditScore && (
                <>
                  <hr style={{ border: "none", borderTop: `1px solid ${theme.lightGray}`, margin: "1rem 0" }} />
                  <div>
                    <h3 style={{ 
                      fontSize: "1.1rem", 
                      color: theme.maroon,
                      marginTop: 0,
                      marginBottom: "1rem"
                    }}>
                      Latest Audit Results
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                      <div>
                        <p style={{ margin: 0, color: theme.gray, fontSize: "0.9rem" }}>Compliance Score</p>
                        <p style={{ margin: "0.5rem 0 0 0", fontSize: "2rem", fontWeight: 700, color: theme.maroon }}>
                          {userProfile.lastAuditScore}%
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: theme.gray, fontSize: "0.9rem" }}>Last Updated</p>
                        <p style={{ margin: "0.5rem 0 0 0", fontSize: "1rem", fontWeight: 500, color: theme.text }}>
                          {userProfile.lastAuditDate}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {selectedTab === "upload" && (
          <div style={{
            background: "white",
            borderRadius: 12,
            padding: "2rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            {userProfile.accountType === "admin" && (
              <>
                <h2 style={{ 
                  fontSize: "1.5rem", 
                  color: theme.maroon,
                  marginBottom: "1.5rem",
                  marginTop: 0
                }}>
                  Manage Compliance Standards
                </h2>
                
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div style={{
                    background: theme.veryLightGray,
                    padding: "1.5rem",
                    borderRadius: 8,
                    borderLeft: `4px solid ${theme.maroon}`
                  }}>
                    <p style={{ 
                      color: theme.text, 
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      margin: "0 0 0.5rem 0"
                    }}>
                      Admin Compliance Standards
                    </p>
                    <p style={{ 
                      color: theme.lightText, 
                      fontSize: "0.9rem",
                      margin: 0
                    }}>
                      Upload SOC2, ISO27001, HIPAA, PCI-DSS and other compliance frameworks. These will be used to validate all user submissions.
                    </p>
                  </div>

                  <div>
                    <label style={{ 
                      display: "block", 
                      marginBottom: "1rem", 
                      color: theme.text,
                      fontWeight: 600,
                      fontSize: "0.95rem"
                    }}>
                      Upload Compliance Standards
                    </label>
                    <input
                      type="file"
                      multiple
                      name="compliance-standards"
                      onChange={handleComplianceStandardsChange}
                      accept=".pdf,.doc,.docx,.txt"
                      style={{
                        width: "100%",
                        padding: "2rem",
                        border: `2px dashed ${theme.maroon}`,
                        borderRadius: 8,
                        textAlign: "center",
                        cursor: "pointer",
                        background: theme.veryLightGray,
                        color: theme.text,
                        fontWeight: 500
                      }}
                    />
                    <p style={{ 
                      margin: "1rem 0 0 0", 
                      color: theme.gray, 
                      fontSize: "0.85rem",
                      textAlign: "center"
                    }}>
                      Supported formats: PDF, DOC, DOCX, TXT
                    </p>
                  </div>

                  {complianceStandards && complianceStandards.length > 0 && (
                    <div style={{
                      background: theme.veryLightGray,
                      padding: "1.5rem",
                      borderRadius: 8,
                      borderLeft: `4px solid ${theme.green}`
                    }}>
                      <h3 style={{ 
                        margin: "0 0 1rem 0", 
                        color: theme.green,
                        fontSize: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        Ready for Upload
                      </h3>
                      <div style={{ display: "grid", gap: "0.75rem" }}>
                        {Array.from(complianceStandards).map((file, idx) => (
                          <div 
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "0.75rem",
                              background: "white",
                              borderRadius: 6,
                              gap: "0.75rem"
                            }}
                          >
                            <span style={{ color: theme.maroon, fontWeight: "bold" }}>D</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, color: theme.text, fontWeight: 500, fontSize: "0.9rem" }}>
                                {file.name}
                              </p>
                              <p style={{ margin: "0.25rem 0 0 0", color: theme.gray, fontSize: "0.8rem" }}>
                                {(file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <span style={{ color: theme.green, fontWeight: "bold" }}>Ready</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUploadComplianceStandards}
                    disabled={!complianceStandards || complianceStandards.length === 0}
                    style={{
                      padding: "1rem",
                      background: !complianceStandards || complianceStandards.length === 0 ? theme.lightGray : theme.maroon,
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: !complianceStandards || complianceStandards.length === 0 ? "default" : "pointer",
                      fontSize: "1rem",
                      fontWeight: 600,
                      opacity: !complianceStandards || complianceStandards.length === 0 ? 0.6 : 1,
                      transition: "all 0.2s ease"
                    }}
                  >
                    Upload Compliance Standards
                  </button>

                  <hr style={{ border: "none", borderTop: `2px solid ${theme.lightGray}`, margin: "1rem 0" }} />

                  <h3 style={{ 
                    fontSize: "1.2rem", 
                    color: theme.maroon,
                    marginTop: "1.5rem",
                    marginBottom: "1rem"
                  }}>
                    Your Organization Documents
                  </h3>
                </div>
              </>
            )}

            {userProfile.accountType === "admin" && (
              <div style={{ display: "grid", gap: "1.5rem" }}>
                <p style={{ 
                  color: theme.lightText, 
                  fontSize: "0.9rem",
                  margin: 0
                }}>
                  Upload your organization's compliance documents to validate against the standards you manage.
                </p>
              </div>
            )}
            
            <div style={{ display: "grid", gap: "1.5rem" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "1rem", 
                  color: theme.text,
                  fontWeight: 600,
                  fontSize: "0.95rem"
                }}>
                  {userProfile.accountType === "admin" ? "Upload Organization Documents" : "Upload Documents for Compliance Review"}
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  style={{
                    width: "100%",
                    padding: "2rem",
                    border: `2px dashed ${theme.maroon}`,
                    borderRadius: 8,
                    textAlign: "center",
                    cursor: "pointer",
                    background: theme.veryLightGray,
                    color: theme.text,
                    fontWeight: 500
                  }}
                />
                <p style={{ 
                  margin: "1rem 0 0 0", 
                  color: theme.gray, 
                  fontSize: "0.85rem",
                  textAlign: "center"
                }}>
                  Supported formats: PDF, DOC, DOCX
                </p>
              </div>

              {selectedFiles && selectedFiles.length > 0 && (
                <div style={{
                  background: theme.veryLightGray,
                  padding: "1.5rem",
                  borderRadius: 8,
                  borderLeft: `4px solid ${theme.green}`
                }}>
                  <h3 style={{ 
                    margin: "0 0 1rem 0", 
                    color: theme.green,
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    Ready for Review
                  </h3>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {Array.from(selectedFiles).map((file, idx) => (
                      <div 
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "0.75rem",
                          background: "white",
                          borderRadius: 6,
                          gap: "0.75rem"
                        }}
                      >
                        <span style={{ color: theme.maroon, fontWeight: "bold" }}>D</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, color: theme.text, fontWeight: 500, fontSize: "0.9rem" }}>
                            {file.name}
                          </p>
                          <p style={{ margin: "0.25rem 0 0 0", color: theme.gray, fontSize: "0.8rem" }}>
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <span style={{ color: theme.green, fontWeight: "bold" }}>Ready</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!selectedFiles || selectedFiles.length === 0}
                style={{
                  padding: "1rem",
                  background: !selectedFiles || selectedFiles.length === 0 ? theme.lightGray : theme.maroon,
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: !selectedFiles || selectedFiles.length === 0 ? "default" : "pointer",
                  fontSize: "1rem",
                  fontWeight: 600,
                  opacity: !selectedFiles || selectedFiles.length === 0 ? 0.6 : 1,
                  transition: "all 0.2s ease"
                }}
              >
                Upload & Run Compliance Check
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}