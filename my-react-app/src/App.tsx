import React, { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import Dashboard from "./dashboard";
import AuditWaiting from "./AuditWaiting";
import { UserService } from "./services/userService";
import type { AuditResult } from "./services/auditResultService";
import { AnimatePresence, motion } from "framer-motion";

// Theme configuration
const theme = {
  maroon: "#500000",
  gold: "#d4af37",
  warmWhite: "#FFF9F7",
  text: "#2D2D2D"
};

// Shared styles
const styles = {
  input: {
    width: "100%",
    padding: "0.9rem",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    background: "white",
    color: theme.text,
    fontSize: "15px",
    transition: "all 0.2s ease",
    outline: "none"
  },
  label: {
    color: theme.text,
    fontSize: "13px",
    marginBottom: "6px",
    display: "block",
    fontWeight: 500
  },
  radioContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  },
  radioLabel: (isSelected: boolean) => ({
    display: "flex",
    alignItems: "center",
    padding: "0.7rem 1rem",
    border: `2px solid ${isSelected ? theme.maroon : "#E5E7EB"}`,
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: isSelected ? `${theme.maroon}08` : "white"
  })
};

type SignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  accountType: "vendors" | "clients" | "admin";
  documents: {
    soc2Report: File | null;
    iso27001Cert: File | null;
    auditReports: File | null;
    insuranceCert: File | null;
  };
};

// Shared styles
const inputStyles = {
  width: "100%",
  padding: "0.9rem",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  background: "white",
  color: "#2D2D2D",
  fontSize: "15px",
  transition: "all 0.2s ease",
  outline: "none"
};

const labelStyles = {
  fontSize: 13,
  marginBottom: 6,
  display: "block",
  fontWeight: 500,
  color: "#2D2D2D"
};

function App() {
  const [form, setForm] = useState<SignupPayload>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: "",
    accountType: "admin",
    documents: {
      soc2Report: null,
      iso27001Cert: null,
      auditReports: null,
      insuranceCert: null
    }
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [view, setView] = useState<"signup" | "dashboard" | "audit-waiting">("signup");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [step, setStep] = useState<1 | 2>(1);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files) {
      const documentType = name as keyof SignupPayload['documents'];
      setForm(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [documentType]: files[0]
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      // Create temporary user session (NO Firebase writes yet)
      const { firstName, lastName, email, password, companyName, accountType } = form;
      
      const userData = {
        firstName,
        lastName,
        email,
        companyName,
        accountType,
      };

      console.log("Creating temporary user session with:", userData);
      const tempUser = await UserService.createTemporaryUserSession(userData, password);
      console.log("Temporary user session created:", tempUser);
      
      // Store temp user ID and user data in state
      setCurrentUser(tempUser);
      
      setStatus("success");
      // Move to audit waiting view (dashboard will trigger compliance check)
      setView("audit-waiting");
    } catch (err) {
      console.error("Error creating temporary account:", err);
      setStatus("error");
      
      let errorMessage = "Failed to create account. Please try again.";
      
      if (err instanceof Error) {
        const errorCode = (err as any).code;
        const errorMsg = err.message;
        
        if (errorCode === 'auth/email-already-in-use') {
          errorMessage = "This email is already registered. Please use a different email.";
        } else if (errorCode === 'auth/weak-password') {
          errorMessage = "Password is too weak. Use at least 6 characters.";
        } else if (errorCode === 'auth/invalid-email') {
          errorMessage = "Please enter a valid email address.";
        } else if (errorCode === 'auth/operation-not-allowed') {
          errorMessage = "Email/Password authentication is not enabled. Please contact support.";
        } else if (errorCode === 'auth/network-request-failed') {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (errorMsg.includes('PERMISSION_DENIED')) {
          errorMessage = "Permission denied. Please check Firestore security rules.";
        } else {
          errorMessage = `Error: ${errorCode || errorMsg}`;
        }
      }
      
      setErrorMessage(errorMessage);
    }
  }

  const handleCompliancePassed = async (userId: string) => {
    try {
      // Create permanent Firebase user after compliance passes
      console.log("Creating permanent user after compliance pass for:", userId);
      await UserService.createPermanentUserAfterCompliance(
        currentUser.userData,
        currentUser.password
      );
      console.log("Permanent user created successfully");
      setView("dashboard");
    } catch (err) {
      console.error("Error creating permanent account:", err);
      setErrorMessage("Failed to create account after compliance. Please try again.");
    }
  };

  // 🔀 If we're in audit-waiting mode, show the audit waiting screen
  if (view === "audit-waiting") {
    // Show dashboard for file upload while waiting for compliance check
    if (!auditResult) {
      return (
        <Dashboard
          companyName={currentUser?.userData?.companyName || form.companyName}
          firstName={currentUser?.userData?.firstName || form.firstName}
          onAuditResult={(result) => {
            console.log("Audit result received:", result);
            setAuditResult(result);
            setIsAnalyzing(false);
          }}
          onAnalysisStart={() => {
            console.log("Analysis starting");
            setIsAnalyzing(true);
          }}
        />
      );
    }
    
    // Show audit result waiting screen once analysis is done
    return (
      <AuditWaiting
        onCompliancePassed={handleCompliancePassed}
        auditResult={auditResult}
        isAnalyzing={isAnalyzing}
      />
    );
  }

  // 🔀 If we're in dashboard mode, show the dashboard instead of signup
  if (view === "dashboard") {
    return (
      <Dashboard
        companyName={currentUser?.userData?.companyName || form.companyName}
        firstName={currentUser?.userData?.firstName || form.firstName}
      />
    );
  }

  // 📝 Default: signup view
  // Don't show signup form if we're in other views
  if (view !== "signup") {
    return null;
  }

  return (
    <div
      className="app-root"
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingLeft: "8%",
        background: theme.warmWhite,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Spline Background */}
      <div style={{
        position: "fixed",
        top: 0,
        left: "40%",
        width: "60vw",
        height: "100vh",
        zIndex: 0,
        background: "transparent",
        pointerEvents: "none",
      }}>
        <iframe 
          src='https://my.spline.design/retrofuturismbganimation-M6WKO4dauCYq95VkTOzjYgRt/' 
          frameBorder='0' 
          width='100%' 
          height='100%'
          style={{ 
            pointerEvents: "none",
            transform: "scale(1.2)",
            opacity: 0.8,
          }}
        />
      </div>

      {/* Form Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`step-${step}`}
          className="signup-card"
          style={{
            width: step === 1 ? "580px" : "720px",
            maxWidth: "90vw",
            background: theme.warmWhite,
            borderRadius: 24,
            padding: "3rem",
            boxShadow: "0 20px 60px rgba(81, 0, 0, 0.15)",
            overflow: "hidden",
            zIndex: 1,
            position: "relative",
            margin: "2rem",
          }}
          initial={{ opacity: 0, x: step === 1 ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: step === 1 ? 50 : -50 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          {/* Form Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
                color: theme.maroon,
              }}
            >
              {step === 1 ? "Create your account" : "Upload Documents"}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#666",
                marginBottom: "1.5rem",
              }}
            >
              {step === 1 
                ? "Start by setting up your login credentials"
                : "Please provide the following compliance documents"}
            </p>
          </motion.div>

          {/* Progress Indicator */}
          <div style={{ 
            display: "flex", 
            gap: "8px", 
            marginBottom: "2rem" 
          }}>
            <div
              style={{
                flex: 1,
                height: "4px",
                borderRadius: "2px",
                background: theme.maroon,
                opacity: step === 1 ? 1 : 0.3,
                transition: "opacity 0.3s ease",
              }}
            />
            <div
              style={{
                flex: 1,
                height: "4px",
                borderRadius: "2px",
                background: theme.maroon,
                opacity: step === 2 ? 1 : 0.3,
                transition: "opacity 0.3s ease",
              }}
            />
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
                {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "grid", gap: "1.5rem" }}
                >
                  {/* Personal Info Fields */}
                  <div style={{ display: "grid", gap: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div>
                        <label style={{ 
                          color: theme.text, 
                          fontSize: 13, 
                          marginBottom: 6, 
                          display: "block",
                          fontWeight: 500 
                        }}>
                          First Name
                        </label>
                        <input
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          required
                          style={{
                            width: "100%",
                            padding: "0.9rem",
                            border: "1px solid #E5E7EB",
                            borderRadius: 12,
                            background: "white",
                            color: theme.text,
                            fontSize: "15px",
                            transition: "all 0.2s ease",
                            outline: "none"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ 
                          color: theme.text, 
                          fontSize: 13, 
                          marginBottom: 6, 
                          display: "block",
                          fontWeight: 500 
                        }}>
                          Last Name
                        </label>
                        <input
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          required
                          style={{
                            width: "100%",
                            padding: "0.9rem",
                            border: "1px solid #E5E7EB",
                            borderRadius: 12,
                            background: "white",
                            color: theme.text,
                            fontSize: "15px",
                            transition: "all 0.2s ease",
                            outline: "none"
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ 
                        color: theme.text, 
                        fontSize: 13, 
                        marginBottom: 6, 
                        display: "block",
                        fontWeight: 500 
                      }}>
                        Company Name
                      </label>
                      <input
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        required
                        placeholder="Enter your company name"
                        style={{
                          width: "100%",
                          padding: "0.9rem",
                          border: "1px solid #E5E7EB",
                          borderRadius: 12,
                          background: "white",
                          color: theme.text,
                          fontSize: "15px",
                          transition: "all 0.2s ease",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ 
                        color: theme.text, 
                        fontSize: 13, 
                        marginBottom: 8, 
                        display: "block",
                        fontWeight: 500 
                      }}>
                        Account Type
                      </label>
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem" 
                      }}>
                        <label style={{ 
                          display: "flex",
                          alignItems: "center",
                          padding: "0.7rem 1rem",
                          border: `2px solid ${form.accountType === "vendors" ? theme.maroon : "#E5E7EB"}`,
                          borderRadius: 12,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          background: form.accountType === "vendors" ? `${theme.maroon}08` : "white",
                          color: theme.text
                        }}>
                          <input
                            type="radio"
                            name="accountType"
                            value="vendors"
                            checked={form.accountType === "vendors"}
                            onChange={handleChange}
                            style={{
                              marginRight: "8px",
                              accentColor: theme.maroon
                            }}
                          />
                          Vendor
                        </label>
                        <label style={{ 
                          display: "flex",
                          alignItems: "center",
                          padding: "0.7rem 1rem",
                          border: `2px solid ${form.accountType === "clients" ? theme.maroon : "#E5E7EB"}`,
                          borderRadius: 12,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          background: form.accountType === "clients" ? `${theme.maroon}08` : "white",
                          color: theme.text
                        }}>
                          <input
                            type="radio"
                            name="accountType"
                            value="clients"
                            checked={form.accountType === "clients"}
                            onChange={handleChange}
                            style={{
                              marginRight: "8px",
                              accentColor: theme.maroon
                            }}
                          />
                          Client
                        </label>
                      </div>
                    </div>

                    <div>
                      <label style={{ 
                        color: theme.text, 
                        fontSize: 13, 
                        marginBottom: 6, 
                        display: "block",
                        fontWeight: 500 
                      }}>
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="you@company.com"
                        style={{
                          width: "100%",
                          padding: "0.9rem",
                          border: "1px solid #E5E7EB",
                          borderRadius: 12,
                          background: "white",
                          color: theme.text,
                          fontSize: "15px",
                          transition: "all 0.2s ease",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ 
                        color: theme.text, 
                        fontSize: 13, 
                        marginBottom: 6, 
                        display: "block",
                        fontWeight: 500 
                      }}>
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        placeholder="Create a secure password"
                        style={{
                          width: "100%",
                          padding: "0.9rem",
                          border: "1px solid #E5E7EB",
                          borderRadius: 12,
                          background: "white",
                          color: theme.text,
                          fontSize: "15px",
                          transition: "all 0.2s ease",
                          outline: "none"
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      marginTop: "1rem",
                      padding: "0.75rem",
                      background: theme.maroon,
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 16,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    Continue to Documents
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                  {/* Document Upload Fields */}
                  <div>
                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ color: theme.maroon, fontSize: 14, marginBottom: 4, display: "block" }}>
                        SOC 2 Report (Type I or II)
                      </label>
                      <input
                        type="file"
                        name="soc2Report"
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${theme.maroon}`,
                          borderRadius: 8,
                          background: "white",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ color: theme.maroon, fontSize: 14, marginBottom: 4, display: "block" }}>
                        ISO 27001 Certificate
                      </label>
                      <input
                        type="file"
                        name="iso27001Cert"
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${theme.maroon}`,
                          borderRadius: 8,
                          background: "white",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ color: theme.maroon, fontSize: 14, marginBottom: 4, display: "block" }}>
                        Audit Reports
                      </label>
                      <input
                        type="file"
                        name="auditReports"
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${theme.maroon}`,
                          borderRadius: 8,
                          background: "white",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ color: theme.maroon, fontSize: 14, marginBottom: 4, display: "block" }}>
                        Certificate of Insurance
                      </label>
                      <input
                        type="file"
                        name="insuranceCert"
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx"
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: `1px solid ${theme.maroon}`,
                          borderRadius: 8,
                          background: "white",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{
                        padding: "0.75rem",
                        background: "transparent",
                        color: theme.maroon,
                        border: `1px solid ${theme.maroon}`,
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 16,
                        fontWeight: 500,
                        flex: 1,
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      style={{
                        padding: "0.75rem",
                        background: theme.maroon,
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: status === "loading" ? "default" : "pointer",
                        fontSize: 16,
                        fontWeight: 500,
                        flex: 2,
                        opacity: status === "loading" ? 0.7 : 1,
                      }}
                    >
                      {status === "loading" ? "Creating..." : "Create Workspace"}
                    </button>
                  </div>

                  {status === "error" && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        color: "#dc2626",
                        fontSize: 14,
                        textAlign: "center",
                        marginTop: "1rem",
                      }}
                    >
                      {errorMessage}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );

}

export default App;
