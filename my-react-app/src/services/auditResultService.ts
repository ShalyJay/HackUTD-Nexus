import { db } from '../firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import type { ComplianceCheckResult } from './complianceService';

export interface AuditResult {
  tempUserId: string;
  timestamp: Timestamp | Date;
  status: 'passed' | 'failed';
  complianceScore: number;
  complianceResult: ComplianceCheckResult;
  geminiSummary?: {
    executiveSummary: string;
    keyFindings: string[];
    riskAssessment: string;
    timeline: string;
  };
  recommendations?: string[];
  requiredActions?: string[];
}

export class AuditResultService {
  private static readonly AUDIT_RESULTS_COLLECTION = 'auditResults';

  // Store audit result temporarily (before user is created)
  static async storeTemporaryAuditResult(
    tempUserId: string,
    complianceResult: ComplianceCheckResult,
    geminiSummary?: any
  ): Promise<AuditResult> {
    const result: AuditResult = {
      tempUserId,
      timestamp: Timestamp.now(),
      status: complianceResult.passed ? 'passed' : 'failed',
      complianceScore: complianceResult.score,
      complianceResult,
      geminiSummary
    };

    if (!complianceResult.passed) {
      result.requiredActions = this.generateRequiredActions(complianceResult);
      result.recommendations = complianceResult.recommendations;
    }

    // Store temporarily in Firestore (will be deleted or moved after user creation)
    const resultRef = doc(
      db,
      this.AUDIT_RESULTS_COLLECTION,
      `temp_${tempUserId}_${Date.now()}`
    );
    await setDoc(resultRef, result);

    return result;
  }

  // Store permanent audit result for an active user
  static async storePermanentAuditResult(
    userId: string,
    auditResult: AuditResult
  ): Promise<void> {
    const permanentResult = {
      ...auditResult,
      userId, // Replace tempUserId with actual userId
      tempUserId: undefined // Remove temporary ID
    };

    const resultRef = doc(
      db,
      this.AUDIT_RESULTS_COLLECTION,
      `${userId}_${Date.now()}`
    );
    await setDoc(resultRef, permanentResult);
  }

  // Get temporary audit result
  // Note: During compliance process, audit result is kept in React state/sessionStorage
  // only creating Firestore entry after user is created
  static async getTemporaryAuditResult(): Promise<AuditResult | null> {
    return null; // Handled in state management
  }

  private static generateRequiredActions(result: ComplianceCheckResult): string[] {
    const actions: string[] = [];

    if (result.issues && result.issues.length > 0) {
      actions.push('Address the identified compliance issues');
    }

    if (result.score && result.score < 50) {
      actions.push('Significantly improve compliance documentation');
    }

    if (result.recommendations) {
      actions.push(...result.recommendations.slice(0, 3));
    }

    return actions.length > 0
      ? actions
      : ['Resubmit compliance documents after addressing issues'];
  }
}