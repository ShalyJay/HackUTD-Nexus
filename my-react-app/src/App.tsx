import React, { useState, useEffect } from "react";
import type { FormEvent, ChangeEvent } from "react";
import Dashboard from "./dashboard";
import AuditWaiting from "./AuditWaiting";
import { UserService } from "./services/userService";
import type { AuditResult } from "./services/auditResultService";
import { ComplianceService } from "./services/complianceService";
import { AuditService } from "./services/auditService";
import { seedFirebase } from "./seedFirebase";
import { AnimatePresence, motion } from "framer-motion";

// Theme configuration
const theme = {
  maroon: "#500000",
  gold: "#d4af37",
  warmWhite: "#FFF9F7",
  text: "#2D2D2D"
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

type LoginPayload = {
  email: string;
  password: string;
};

// Hardcoded admin credentials (for demo purposes)
const ADMIN_USER = {
  email: "admin@hackutd.com",
  password: "AdminPassword123!",
  firstName: "Admin",
  lastName: "User",
  companyName: "HackUTD-Nexus",
  accountType: "admin" as const
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

  const [view, setView] = useState<"signup" | "login" | "dashboard" | "audit-waiting">("signup");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [loginForm, setLoginForm] = useState<LoginPayload>({
    email: "",
    password: ""
  });
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [step, setStep] = useState<1 | 2>(1);

  // Seed Firebase on first load
  useEffect(() => {
    const hasSeeded = localStorage.getItem("firebaseSeeded");
    if (!hasSeeded) {
      console.log("First load detected, seeding Firebase with mock data...");
      seedFirebase()
        .then(() => {
          localStorage.setItem("firebaseSeeded", "true");
          console.log("Firebase seeding completed");
        })
        .catch((err) => {
          console.error("Failed to seed Firebase:", err);
          // Still mark as seeded to avoid repeated attempts
          localStorage.setItem("firebaseSeeded", "true");
        });
    }
  }, []);

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

  const handleRetryUpload = () => {
    // Reset audit result and show dashboard again for re-upload
    console.log("Retrying file upload");
    setAuditResult(null);
    setIsAnalyzing(false);
  };

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const { email, password } = loginForm;

      // Check if this is the hardcoded admin user
      if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
        console.log("Admin login successful");
        
        // Store/update admin data in Firebase
        const { db } = await import("./firebase");
        const { doc, setDoc, Timestamp } = await import("firebase/firestore");
        
        const adminUserId = "admin_001";
        const now = Timestamp.now();
        
        const adminUserData = {
          userId: adminUserId,
          firstName: ADMIN_USER.firstName,
          lastName: ADMIN_USER.lastName,
          email: ADMIN_USER.email,
          companyName: ADMIN_USER.companyName,
          accountType: ADMIN_USER.accountType,
          status: "active",
          onboardingComplete: true,
          createdAt: now,
          lastUpdated: now
        };
        
        // Save admin to Firebase
        await setDoc(doc(db, "users", adminUserId), adminUserData);
        console.log("Admin user data stored in Firebase");
        
        // Create admin user session
        const adminUser = {
          userId: adminUserId,
          password: password,
          userData: adminUserData
        };

        setCurrentUser(adminUser);
        setStatus("success");
        setView("dashboard");
        return;
      }

      // Try to authenticate with Firebase for non-admin users
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const { auth } = await import("./firebase");
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await UserService.getUserProfile(userCredential.user.uid);
      
      if (!userProfile) {
        throw new Error("User profile not found");
      }

      // Set current user and go to dashboard
      setCurrentUser({
        userId: userCredential.user.uid,
        userData: userProfile
      });

      setStatus("success");
      setView("dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setStatus("error");

      let errorMessage = "Login failed. Please check your credentials.";

      if (err instanceof Error) {
        const errorCode = (err as any).code;

        if (errorCode === "auth/user-not-found") {
          errorMessage = "No account found with this email address.";
        } else if (errorCode === "auth/wrong-password") {
          errorMessage = "Incorrect password. Please try again.";
        } else if (errorCode === "auth/invalid-email") {
          errorMessage = "Please enter a valid email address.";
        } else if (errorCode === "auth/user-disabled") {
          errorMessage = "This account has been disabled.";
        } else if (errorCode === "auth/network-request-failed") {
          errorMessage = "Network error. Please check your internet connection.";
        }
      }

      setErrorMessage(errorMessage);
    }
  }

  const handleLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  async function handleUploadDocuments(e: FormEvent) {
    e.preventDefault();
    
    // Collect all uploaded files
    const uploadedFiles: File[] = [];
    if (form.documents.soc2Report) uploadedFiles.push(form.documents.soc2Report);
    if (form.documents.iso27001Cert) uploadedFiles.push(form.documents.iso27001Cert);
    if (form.documents.auditReports) uploadedFiles.push(form.documents.auditReports);
    if (form.documents.insuranceCert) uploadedFiles.push(form.documents.insuranceCert);

    if (uploadedFiles.length === 0) {
      setErrorMessage("Please upload at least one document");
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);

      // Store documents and check compliance
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check compliance with Gemini analysis
      const complianceResult = await ComplianceService.checkComplianceAndStore(tempUserId, uploadedFiles);

      // Generate audit report with Gemini summary
      const auditReport = await AuditService.generateAuditReport(
        tempUserId,
        complianceResult,
        currentUser?.userData?.companyName || form.companyName
      );

      // Create AuditResult object combining the audit report data
      const auditResultData: AuditResult = {
        tempUserId,
        status: auditReport.status,
        complianceScore: complianceResult.score,
        complianceResult: complianceResult,
        geminiSummary: auditReport.geminiSummary,
        requiredActions: auditReport.requiredActions || [],
        timestamp: auditReport.timestamp
      };

      setAuditResult(auditResultData);
      setIsAnalyzing(false);
      // Transition to audit-waiting view to show results
      setView("audit-waiting");
    } catch (err) {
      console.error('Upload failed:', err);
      setIsAnalyzing(false);
      const errorMsg = err instanceof Error ? err.message : 'Failed to process documents. Please try again.';
      setErrorMessage(errorMsg);
    }
  }

  // 🔀 If we're in audit-waiting mode, show the audit result screen
  if (view === "audit-waiting") {
    // Show audit result waiting screen with compliance analysis results
    return (
      <AuditWaiting
        onCompliancePassed={handleCompliancePassed}
        onRetryUpload={handleRetryUpload}
        auditResult={auditResult}
        isAnalyzing={isAnalyzing}
      />
    );
  }

  // 🔀 If we're in dashboard mode, show the dashboard instead of signup
  if (view === "dashboard") {
    return (
      <Dashboard
        userId={currentUser?.userId || "unknown"}
        userProfile={{
          firstName: currentUser?.userData?.firstName || form.firstName,
          lastName: currentUser?.userData?.lastName || form.lastName,
          email: currentUser?.userData?.email || form.email,
          companyName: currentUser?.userData?.companyName || form.companyName,
          accountType: currentUser?.userData?.accountType || form.accountType,
          documents: {
            soc2Cert: form.documents.soc2Report || undefined,
            iso27001Cert: form.documents.iso27001Cert || undefined,
            auditReports: form.documents.auditReports || undefined,
            insuranceCert: form.documents.insuranceCert || undefined
          },
          lastAuditScore: currentUser?.userData?.lastAuditScore,
          lastAuditDate: currentUser?.userData?.lastAuditDate
        }}
      />
    );
  }

  // � If we're in login mode, show the login form
  if (view === "login" || authMode === "login") {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.warmWhite,
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "2rem",
            background: "white",
            borderRadius: 16,
            boxShadow: "0 20px 50px rgba(15,23,42,0.4)",
            zIndex: 10,
          }}
        >
          <h1 style={{ textAlign: "center", color: theme.text, marginBottom: "0.5rem", fontSize: 28 }}>
            Welcome Back
          </h1>
          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "1.5rem", fontSize: 14 }}>
            Log in to your account
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.text, fontWeight: 500, fontSize: 14 }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                placeholder="Enter your email"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", color: theme.text, fontWeight: 500, fontSize: 14 }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {errorMessage && (
              <div style={{
                marginBottom: "1rem",
                padding: "0.75rem",
                background: "#fee2e2",
                color: "#dc2626",
                borderRadius: 8,
                fontSize: 14,
              }}>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: theme.maroon,
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: status === "loading" ? "default" : "pointer",
                opacity: status === "loading" ? 0.7 : 1,
                marginBottom: "1rem",
              }}
            >
              {status === "loading" ? "Logging in..." : "Log In"}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setLoginForm({ email: "", password: "" });
                setErrorMessage(null);
                setStatus("idle");
              }}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "transparent",
                color: theme.maroon,
                border: `1px solid ${theme.maroon}`,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Create New Account
            </button>
          </form>
        </div>
      </div>
    );
  }

  // �📝 Default: signup view
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  marginBottom: 0,
                  color: theme.maroon,
                }}
              >
                {step === 1 ? "Create your account" : "Upload Documents"}
              </h1>
              {step === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setView("login");
                  }}
                  style={{
                    background: "transparent",
                    color: theme.maroon,
                    border: `1px solid ${theme.maroon}`,
                    borderRadius: 8,
                    padding: "0.5rem 1rem",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Have an account? Log In
                </button>
              )}
            </div>
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

                  {/* File Upload Preview Section */}
                  {(form.documents.soc2Report || form.documents.iso27001Cert || form.documents.auditReports || form.documents.insuranceCert) && (
                    <div style={{
                      background: `${theme.maroon}08`,
                      border: `2px solid ${theme.gold}`,
                      borderRadius: 12,
                      padding: "1.5rem",
                      marginTop: "1.5rem"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "1rem"
                      }}>
                        <span style={{ fontSize: 24 }}>✅</span>
                        <h3 style={{ color: theme.maroon, fontSize: 16, fontWeight: 600, margin: 0 }}>
                          Files Ready for Review
                        </h3>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {form.documents.soc2Report && (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.75rem",
                            background: "white",
                            borderRadius: 8,
                            borderLeft: `4px solid ${theme.maroon}`
                          }}>
                            <span style={{ fontSize: 18 }}>📄</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: theme.text }}>
                                SOC 2 Report
                              </p>
                              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                                {form.documents.soc2Report.name} ({(form.documents.soc2Report.size / 1024).toFixed(2)} KB)
                              </p>
                            </div>
                            <span style={{ fontSize: 16, color: "#16a34a" }}>✓</span>
                          </div>
                        )}
                        
                        {form.documents.iso27001Cert && (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.75rem",
                            background: "white",
                            borderRadius: 8,
                            borderLeft: `4px solid ${theme.maroon}`
                          }}>
                            <span style={{ fontSize: 18 }}>📄</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: theme.text }}>
                                ISO 27001 Certificate
                              </p>
                              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                                {form.documents.iso27001Cert.name} ({(form.documents.iso27001Cert.size / 1024).toFixed(2)} KB)
                              </p>
                            </div>
                            <span style={{ fontSize: 16, color: "#16a34a" }}>✓</span>
                          </div>
                        )}
                        
                        {form.documents.auditReports && (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.75rem",
                            background: "white",
                            borderRadius: 8,
                            borderLeft: `4px solid ${theme.maroon}`
                          }}>
                            <span style={{ fontSize: 18 }}>📄</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: theme.text }}>
                                Audit Reports
                              </p>
                              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                                {form.documents.auditReports.name} ({(form.documents.auditReports.size / 1024).toFixed(2)} KB)
                              </p>
                            </div>
                            <span style={{ fontSize: 16, color: "#16a34a" }}>✓</span>
                          </div>
                        )}
                        
                        {form.documents.insuranceCert && (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.75rem",
                            background: "white",
                            borderRadius: 8,
                            borderLeft: `4px solid ${theme.maroon}`
                          }}>
                            <span style={{ fontSize: 18 }}>📄</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: theme.text }}>
                                Certificate of Insurance
                              </p>
                              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                                {form.documents.insuranceCert.name} ({(form.documents.insuranceCert.size / 1024).toFixed(2)} KB)
                              </p>
                            </div>
                            <span style={{ fontSize: 16, color: "#16a34a" }}>✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                      type="button"
                      onClick={handleUploadDocuments}
                      disabled={isAnalyzing}
                      style={{
                        padding: "0.75rem",
                        background: theme.maroon,
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: isAnalyzing ? "default" : "pointer",
                        fontSize: 16,
                        fontWeight: 500,
                        flex: 2,
                        opacity: isAnalyzing ? 0.7 : 1,
                      }}
                    >
                      {isAnalyzing ? "Analyzing Documents..." : "Submit for Compliance Review"}
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
