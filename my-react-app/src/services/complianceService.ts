import { db, storage } from '../firebase';
import { collection, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GeminiService } from './geminiService';
import type { ComplianceAnalysisResult } from './geminiService';

export interface ComplianceCheckResult {
  passed: boolean;
  issues: string[];
  score: number;
  recommendations?: string[];
  geminiAnalysis?: ComplianceAnalysisResult[];
}

export interface ComplianceDocument {
  type: string;
  url: string;
  name: string;
  uploadDate: Timestamp | Date;
}

export class ComplianceService {
  private static readonly TEMP_COLLECTION = 'temporaryDocuments';
  private static readonly PERMANENT_COLLECTION = 'verifiedDocuments';
  
  // Check if all required document types are present
  private static checkRequiredDocuments(documents: ComplianceDocument[]): boolean {
    const requiredTypes = ['cybersecurity', 'criminal', 'financial', 'risk'];
    const uploadedTypes = documents.map(complianceDoc => complianceDoc.type);
    return requiredTypes.every(type => uploadedTypes.includes(type));
  }

  // Perform compliance checks on documents
  private static async analyzeDocuments(documents: ComplianceDocument[], files?: File[]): Promise<ComplianceCheckResult> {
    const issues: string[] = [];
    let score = 100; // Start with perfect score
    const geminiAnalysis: ComplianceAnalysisResult[] = [];
    
    // Check if all required document types are present
    if (!this.checkRequiredDocuments(documents)) {
      issues.push('Missing required documents');
      score -= 30;
    }

    // Check document age
    documents.forEach(complianceDoc => {
      const uploadDateMs = complianceDoc.uploadDate instanceof Date 
        ? complianceDoc.uploadDate.getTime() 
        : complianceDoc.uploadDate.toDate().getTime();
      const docAge = new Date().getTime() - uploadDateMs;
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
      if (docAge > maxAge) {
        issues.push(`Document ${complianceDoc.name} is over 1 year old`);
        score -= 10;
      }
    });

    // Use Gemini AI for deep compliance analysis if available
    if (files && files.length > 0) {
      try {
        console.log('Running Gemini analysis on documents...');
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const docType = documents[i]?.type as 'cybersecurity' | 'criminal' | 'financial' | 'risk';
          
          // Extract text from file
          const fileContent = await GeminiService.extractTextFromFile(file);
          
          // Analyze with Gemini
          const analysis = await GeminiService.analyzeDocumentCompliance(fileContent, docType);
          geminiAnalysis.push(analysis);

          // Adjust score based on Gemini analysis
          score = (score + analysis.score) / 2; // Average the scores
          
          // Add findings to issues if risk level is high or critical
          if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
            issues.push(...analysis.findings);
          }
        }
      } catch (error) {
        console.warn('Gemini analysis failed, continuing with basic checks:', error);
      }
    }

    const passed = score >= 70 && issues.length < 5;
    const recommendations = passed ? [] : geminiAnalysis.length > 0 
      ? geminiAnalysis.flatMap(a => a.recommendations).slice(0, 5)
      : [
          'Ensure all required documents are provided',
          'Update any outdated documents',
          'Provide more recent compliance certificates'
        ];

    return {
      passed,
      issues,
      score,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      geminiAnalysis: geminiAnalysis.length > 0 ? geminiAnalysis : undefined
    };
  }

  // Store documents temporarily for compliance checking
  static async storeTemporaryDocuments(
    userId: string,
    documents: File[],
    metadata: { type: string }[]
  ): Promise<ComplianceDocument[]> {
    const storedDocs: ComplianceDocument[] = [];

    for (let i = 0; i < documents.length; i++) {
      const file = documents[i];
      const type = metadata[i].type;
      
      // Upload to temporary storage
      const tempStorageRef = ref(storage, `temp/${userId}/${file.name}`);
      await uploadBytes(tempStorageRef, file);
      const url = await getDownloadURL(tempStorageRef);

      const docData: ComplianceDocument = {
        type,
        url,
        name: file.name,
        uploadDate: Timestamp.now()
      };

      // Store reference in temporary collection
      await setDoc(
        doc(db, this.TEMP_COLLECTION, `${userId}_${file.name}`),
        docData
      );

      storedDocs.push(docData);
    }

    return storedDocs;
  }

  // Check compliance and move to permanent storage if passed
  static async checkComplianceAndStore(userId: string, files?: File[]): Promise<ComplianceCheckResult> {
    // Get all temporary documents for this user
    const tempDocs = await this.getTemporaryDocuments(userId);
    
    // Perform compliance checks with optional files for AI analysis
    const result = await this.analyzeDocuments(tempDocs, files);
    
    if (result.passed) {
      // Move documents to permanent storage
      await this.moveToPermanentStorage(userId, tempDocs);
    }
    
    return result;
  }

  // Get temporary documents for a user
  private static async getTemporaryDocuments(userId: string): Promise<ComplianceDocument[]> {
    const tempDocsRef = collection(db, this.TEMP_COLLECTION);
    const userDocs = await getDoc(doc(tempDocsRef, userId));
    return userDocs.exists() ? Object.values(userDocs.data()) : [];
  }

  // Move verified documents to permanent storage
  private static async moveToPermanentStorage(userId: string, documents: ComplianceDocument[]): Promise<void> {
    // Move each document to permanent storage
    for (const complianceDoc of documents) {
      await setDoc(
        doc(db, this.PERMANENT_COLLECTION, `${userId}_${complianceDoc.name}`),
        complianceDoc
      );
    }
  }
}