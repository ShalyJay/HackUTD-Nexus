import React, { useState } from "react";
import type { FormEvent } from "react";
import Dashboard from "./dashboard";
import AuditWaiting from "./AuditWaiting";
import { UserService } from "./services/userService";
import type { AuditResult } from "./services/auditResultService";

type SignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  accountType: "vendors" | "clients" | "admin";
};

function App() {
  const [form, setForm] = useState<SignupPayload>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    companyName: "",
    accountType: "admin",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [view, setView] = useState<"signup" | "dashboard" | "audit-waiting">("signup");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
  return (
    <div
      className="app-root"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
      }}
    >
      <div
        className="signup-card"
        style={{
          maxWidth: 480,
          width: "100%",
          background: "white",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 20px 50px rgba(15,23,42,0.4)",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "0.25rem",
            color: "#020617",
          }}
        >
          Create your workspace
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginBottom: "1.5rem",
          }}
        >
          This signup form will eventually send data to{" "}
          <code>/api/signup</code> for the backend.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {/* First + last name */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#4b5563",
                }}
              >
                First name
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                style={{
                  marginTop: 4,
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#4b5563",
                }}
              >
                Last name
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                style={{
                  marginTop: 4,
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#4b5563",
              }}
            >
              Work email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@company.com"
              style={{
                marginTop: 4,
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#4b5563",
              }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              style={{
                marginTop: 4,
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
            <p
              style={{
                marginTop: 4,
                fontSize: 10,
                color: "#9ca3af",
              }}
            >
              At least 8 characters. Use a mix of letters, numbers, and symbols.
            </p>
          </div>

          {/* Company name */}
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#4b5563",
              }}
            >
              Company name
            </label>
            <input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
              placeholder="Acme Inc."
              style={{
                marginTop: 4,
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
          </div>

          {/* Account type radios */}
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#4b5563",
                marginBottom: 4,
              }}
            >
              We manage:
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                fontSize: 12,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="vendors"
                  checked={form.accountType === "vendors"}
                  onChange={handleChange}
                />
                Vendors
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="clients"
                  checked={form.accountType === "clients"}
                  onChange={handleChange}
                />
                Clients
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="both"
                  checked={form.accountType === "admin"}
                  onChange={handleChange}
                />
                Both
              </label>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "0.6rem 0.75rem",
              borderRadius: 9999,
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              color: "white",
              background: status === "loading" ? "#4f46e5aa" : "#4f46e5",
              cursor: status === "loading" ? "default" : "pointer",
            }}
          >
            {status === "loading" ? "Creating workspace..." : "Create workspace"}
          </button>

          {/* Status messages */}
          {status === "success" && (
            <p
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#16a34a",
              }}
            >
              Signup successful (simulated). Showing dashboard…
            </p>
          )}
          {status === "error" && (
            <p
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#dc2626",
              }}
            >
              {errorMessage || "Something went wrong."}
            </p>
          )}

          <p
            style={{
              marginTop: 8,
              fontSize: 10,
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
}

export default App;
