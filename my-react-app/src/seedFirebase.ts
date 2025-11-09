import { db, auth } from './firebase';
import { collection, addDoc, setDoc, doc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Mock vendors data
const mockVendors = [
  {
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@techsecure.com",
    companyName: "TechSecure Solutions",
    accountType: "vendors",
    status: "active",
    onboardingComplete: true,
    score: 92,
    riskLevel: "Low Risk",
    lastAuditDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    documents: ["SOC2 Report", "ISO 27001 Certificate"],
    adminApproved: true,
    createdAt: Timestamp.now(),
    lastUpdated: Timestamp.now()
  },
  {
    firstName: "Michael",
    lastName: "Rodriguez",
    email: "michael.rodriguez@cloudinfra.io",
    companyName: "CloudInfra Inc",
    accountType: "vendors",
    status: "active",
    onboardingComplete: true,
    score: 87,
    riskLevel: "Low Risk",
    lastAuditDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    documents: ["SOC2 Report", "Audit Reports"],
    adminApproved: true,
    createdAt: Timestamp.now(),
    lastUpdated: Timestamp.now()
  },
  {
    firstName: "Jessica",
    lastName: "Patel",
    email: "jessica.patel@dataflow.ai",
    companyName: "DataFlow Analytics",
    accountType: "vendors",
    status: "pending",
    onboardingComplete: false,
    score: 0,
    riskLevel: "Medium Risk",
    lastAuditDate: "Pending Review",
    documents: [],
    adminApproved: false,
    createdAt: Timestamp.now(),
    lastUpdated: Timestamp.now()
  },
  {
    firstName: "David",
    lastName: "Kim",
    email: "david.kim@securenet.com",
    companyName: "SecureNet Technologies",
    accountType: "vendors",
    status: "active",
    onboardingComplete: true,
    score: 78,
    riskLevel: "Medium Risk",
    lastAuditDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    documents: ["ISO 27001 Certificate", "Certificate of Insurance"],
    adminApproved: true,
    createdAt: Timestamp.now(),
    lastUpdated: Timestamp.now()
  }
];

// Mock clients data
const mockClients = [
  {
    firstName: "Emily",
    lastName: "Watson",
    email: "emily.watson@enterprise.com",
    companyName: "Enterprise Corp",
    accountType: "clients",
    status: "active",
    onboardingComplete: true,
    activeReviews: 4,
    vendorCount: 12,
    adminApproved: true,
    createdAt: Timestamp.now(),
    lastUpdated: Timestamp.now()
  },
  {
    firstName: "James",
    lastName: "Miller",
    email: "james.miller@fintech.co",
    companyName: "FinTech Solutions",
    accountType: "clients",
    status: "active",
    onboardingComplete: true,
    activeReviews: 2,
    vendorCount: 8,
    adminApproved: true,
    createdAt: Timestamp.now(),
    lastUpdated: Timestamp.now()
  },
  {
    firstName: "Amanda",
    lastName: "Thompson",
    email: "amanda.thompson@healthcare.net",
    companyName: "HealthCare Plus",
    accountType: "clients",
    status: "active",
    onboardingComplete: true,
    activeReviews: 6,
    vendorCount: 15,
    adminApproved: true,
    createdAt: Timestamp.now(),
    lastUpdated: Timestamp.now()
  }
];

// Mock compliance standards
const mockComplianceStandards = [
  {
    fileName: "SOC2 Standards.pdf",
    fileSize: 2048000,
    fileType: "application/pdf",
    uploadedBy: "admin@hackutd.com",
    uploadedAt: Timestamp.now(),
    description: "SOC 2 Type II compliance framework and requirements",
    content: "SOC 2 Type II Control Objectives:\n1. Security - Controls that protect information\n2. Availability - Controls that ensure system availability\n3. Processing Integrity - Controls for accurate and complete processing"
  },
  {
    fileName: "ISO 27001 Standards.pdf",
    fileSize: 1856000,
    fileType: "application/pdf",
    uploadedBy: "admin@hackutd.com",
    uploadedAt: Timestamp.now(),
    description: "ISO 27001 Information Security Management standards",
    content: "ISO 27001 Requirements:\n1. Information Security Policies\n2. Organization of Information Security\n3. Human Resource Security\n4. Asset Management\n5. Access Control"
  },
  {
    fileName: "HIPAA Compliance Guide.pdf",
    fileSize: 3072000,
    fileType: "application/pdf",
    uploadedBy: "admin@hackutd.com",
    uploadedAt: Timestamp.now(),
    description: "HIPAA compliance requirements for healthcare data",
    content: "HIPAA Privacy and Security Rules:\n1. Administrative Safeguards\n2. Physical Safeguards\n3. Technical Safeguards\n4. Organizational, policies, and procedures"
  },
  {
    fileName: "PCI-DSS Standards.pdf",
    fileSize: 2560000,
    fileType: "application/pdf",
    uploadedBy: "admin@hackutd.com",
    uploadedAt: Timestamp.now(),
    description: "PCI DSS compliance standards for payment card handling",
    content: "PCI-DSS Requirements:\n1. Install and maintain firewall configuration\n2. Do not use vendor-supplied defaults\n3. Protect stored cardholder data\n4. Encrypt transmission of cardholder data"
  }
];

export async function seedFirebase() {
  try {
    console.log("Starting Firebase seeding...");

    // 1. Create or verify admin account in Firebase Auth
    const adminEmail = "admin@hackutd.com";
    const adminPassword = "AdminPassword123!";
    
    try {
      // Try to create admin if doesn't exist
      await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log("Admin account created in Firebase Auth");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        console.log("Admin account already exists in Firebase Auth");
      } else {
        throw err;
      }
    }

    // 2. Seed admin user document in Firestore
    const adminUserId = "admin_001";
    const adminUserRef = doc(db, "users", adminUserId);
    const adminUserData = {
      userId: adminUserId,
      firstName: "Admin",
      lastName: "User",
      email: adminEmail,
      companyName: "HackUTD-Nexus",
      accountType: "admin",
      status: "active",
      onboardingComplete: true,
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now()
    };

    await setDoc(adminUserRef, adminUserData, { merge: true });
    console.log("Admin user document created in Firestore");

    // 3. Seed mock vendors
    console.log("Seeding vendors...");
    const vendorsRef = collection(db, "users");
    for (const vendor of mockVendors) {
      try {
        // Check if vendor already exists
        const q = query(vendorsRef, where("email", "==", vendor.email));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          const vendorId = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await setDoc(doc(vendorsRef, vendorId), {
            userId: vendorId,
            ...vendor
          });
          console.log(`Created vendor: ${vendor.companyName}`);
        } else {
          console.log(`Vendor ${vendor.companyName} already exists, skipping`);
        }
      } catch (err) {
        console.error(`Error seeding vendor ${vendor.companyName}:`, err);
      }
    }

    // 4. Seed mock clients
    console.log("Seeding clients...");
    for (const client of mockClients) {
      try {
        // Check if client already exists
        const q = query(vendorsRef, where("email", "==", client.email));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await setDoc(doc(vendorsRef, clientId), {
            userId: clientId,
            ...client
          });
          console.log(`Created client: ${client.companyName}`);
        } else {
          console.log(`Client ${client.companyName} already exists, skipping`);
        }
      } catch (err) {
        console.error(`Error seeding client ${client.companyName}:`, err);
      }
    }

    // 5. Seed compliance standards
    console.log("Seeding compliance standards...");
    const standardsRef = collection(db, "compliance_standards");
    for (const standard of mockComplianceStandards) {
      try {
        // Check if standard already exists
        const q = query(standardsRef, where("fileName", "==", standard.fileName));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          await addDoc(standardsRef, standard);
          console.log(`Created compliance standard: ${standard.fileName}`);
        } else {
          console.log(`Compliance standard ${standard.fileName} already exists, skipping`);
        }
      } catch (err) {
        console.error(`Error seeding standard ${standard.fileName}:`, err);
      }
    }

    console.log("Firebase seeding completed successfully!");
    return {
      success: true,
      message: "Firebase seeded with mock data",
      summary: {
        vendorsCreated: mockVendors.length,
        clientsCreated: mockClients.length,
        standardsCreated: mockComplianceStandards.length
      }
    };
  } catch (err) {
    console.error("Error seeding Firebase:", err);
    throw err;
  }
}
