import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import type { ComplianceCheckResult } from './complianceService';
import { GeminiService } from './geminiService';

interface AuditReport {
  userId: string;
  timestamp: Timestamp | Date;
  status: 'passed' | 'failed';
  complianceResult: ComplianceCheckResult;
  recommendations?: string[];
  requiredActions?: string[];
  geminiSummary?: {
    executiveSummary: string;
    keyFindings: string[];
    riskAssessment: string;
    timeline: string;
  };
}

export class AuditService {
  private static readonly AUDIT_COLLECTION = 'auditReports';

  // Generate an audit report based on compliance results
  static async generateAuditReport(
    userId: string,
    complianceResult: ComplianceCheckResult,
    companyName?: string
  ): Promise<AuditReport> {
    const report: AuditReport = {
      userId,
      timestamp: Timestamp.now(),
      status: complianceResult.passed ? 'passed' : 'failed',
      complianceResult,
      recommendations: complianceResult.recommendations
    };

    if (!complianceResult.passed) {
      report.requiredActions = this.generateRequiredActions(complianceResult);
    }

    // Use Gemini to generate a comprehensive audit summary
    if (complianceResult.geminiAnalysis && complianceResult.geminiAnalysis.length > 0) {
      try {
        console.log('Generating Gemini audit summary...');
        const geminiSummary = await GeminiService.generateAuditSummary(
          companyName || 'Organization',
          complianceResult.geminiAnalysis
        );
        report.geminiSummary = {
          executiveSummary: geminiSummary.executiveSummary,
          keyFindings: geminiSummary.keyFindings,
          riskAssessment: geminiSummary.riskAssessment,
          timeline: geminiSummary.timeline
        };
        // Use Gemini's required actions if available
        if (!complianceResult.passed && geminiSummary.requiredActions.length > 0) {
          report.requiredActions = geminiSummary.requiredActions;
        }
      } catch (error) {
        console.warn('Gemini audit summary generation failed, using basic analysis:', error);
      }
    }
    // Store the report
    await this.storeAuditReport(report);

    return report;
  }

  // Generate required actions based on compliance issues
  private static generateRequiredActions(result: ComplianceCheckResult): string[] {
    const actions: string[] = [];

    result.issues.forEach((issue: string) => {
      switch (true) {
        case issue.includes('Missing required documents'):
          actions.push('Submit all required compliance documents');
          break;
        case issue.includes('over 1 year old'):
          actions.push('Update outdated compliance documents');
          break;
        default:
          actions.push('Address compliance issues identified in the report');
      }
    });

    return actions;
  }

  // Store the audit report in Firestore
  private static async storeAuditReport(report: AuditReport): Promise<void> {
    const timestampMs = report.timestamp instanceof Timestamp 
      ? report.timestamp.toDate().getTime() 
      : report.timestamp.getTime();
    const reportRef = doc(db, this.AUDIT_COLLECTION, `${report.userId}_${timestampMs}`);
    await setDoc(reportRef, report);
  }

  // Get the latest audit report for a user
  static async getLatestAuditReport(userId: string): Promise<AuditReport | null> {
    const reportsRef = collection(db, this.AUDIT_COLLECTION);
    const userReportDoc = await getDoc(doc(reportsRef, userId));
    
    if (!userReportDoc.exists()) {
      return null;
    }

    const data = userReportDoc.data() as AuditReport;
    return data;
  }
}