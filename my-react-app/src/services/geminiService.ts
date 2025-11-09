import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ComplianceAnalysisResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  findings: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface AuditReportSummary {
  executiveSummary: string;
  keyFindings: string[];
  riskAssessment: string;
  requiredActions: string[];
  timeline: string;
}

export class GeminiService {
  private static client: GoogleGenerativeAI | null = null;
  private static model: any = null;

  private static initialize() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env.local file'
      );
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
  }

  /**
   * Analyze document content for compliance issues
   * This is called with document text extracted from uploaded files
   */
  static async analyzeDocumentCompliance(
    documentContent: string,
    documentType: 'cybersecurity' | 'criminal' | 'financial' | 'risk'
  ): Promise<ComplianceAnalysisResult> {
    this.initialize();

    const prompt = this.buildCompliancePrompt(documentContent, documentType);

    try {
      console.log(`Analyzing ${documentType} document with Gemini...`);
      const response = await this.model?.generateContent(prompt);
      const text = response?.response?.text();

      if (!text) {
        throw new Error('No response from Gemini API');
      }

      // Parse the JSON response from Gemini
      const result = this.parseComplianceResponse(text);
      console.log('Compliance analysis result:', result);
      return result;
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw error;
    }
  }

  /**
   * Generate a comprehensive audit report based on all compliance findings
   */
  static async generateAuditSummary(
    companyName: string,
    allFindings: ComplianceAnalysisResult[]
  ): Promise<AuditReportSummary> {
    this.initialize();

    const prompt = this.buildAuditPrompt(companyName, allFindings);

    try {
      console.log('Generating audit summary with Gemini...');
      const response = await this.model?.generateContent(prompt);
      const text = response?.response?.text();

      if (!text) {
        throw new Error('No response from Gemini API');
      }

      // Parse the JSON response from Gemini
      const result = this.parseAuditResponse(text);
      console.log('Audit summary result:', result);
      return result;
    } catch (error) {
      console.error('Error generating audit summary:', error);
      throw error;
    }
  }

  /**
   * Extract text from a file for analysis
   * Note: In production, you might want to use a PDF extraction library
   */
  static async extractTextFromFile(file: File): Promise<string> {
    try {
      // For text and basic files
      if (file.type === 'text/plain' || file.type === 'application/json') {
        return await file.text();
      }

      // For other file types, return a placeholder
      // In production, use pdf.js for PDFs, etc.
      if (file.type === 'application/pdf') {
        return `[PDF Document: ${file.name} - Please extract text using a PDF library]`;
      }

      if (file.type.includes('word')) {
        return `[Word Document: ${file.name} - Please extract text using a Word extraction library]`;
      }

      return `[Document: ${file.name}]`;
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw error;
    }
  }

  private static buildCompliancePrompt(
    documentContent: string,
    documentType: string
  ): string {
    return `You are a compliance and risk assessment expert. Analyze the following ${documentType} document and provide a detailed compliance assessment.

Document Content:
${documentContent}

Please analyze this document and return a JSON response with the following structure (and ONLY JSON, no other text):
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "score": number between 0-100,
  "findings": ["finding1", "finding2", ...],
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}

Focus on:
- Regulatory compliance
- Security practices
- Risk management
- Industry standards
- Best practices adherence

Respond ONLY with the JSON object, no markdown formatting or code blocks.`;
  }

  private static buildAuditPrompt(
    companyName: string,
    findings: ComplianceAnalysisResult[]
  ): string {
    const findingsSummary = findings
      .map(
        (f, i) => `
Section ${i + 1}:
- Risk Level: ${f.riskLevel}
- Score: ${f.score}/100
- Key Findings: ${f.findings.join(', ')}
- Strengths: ${f.strengths.join(', ')}
- Weaknesses: ${f.weaknesses.join(', ')}
`
      )
      .join('\n');

    return `You are a senior compliance auditor. Generate a comprehensive audit report summary for "${companyName}" based on the following findings:

${findingsSummary}

Please generate a JSON response with the following structure (and ONLY JSON, no other text):
{
  "executiveSummary": "A 2-3 sentence summary of the overall compliance status",
  "keyFindings": ["finding1", "finding2", "finding3", ...],
  "riskAssessment": "A paragraph describing the overall risk assessment",
  "requiredActions": ["action1", "action2", "action3", ...],
  "timeline": "A suggested timeline for addressing issues"
}

Respond ONLY with the JSON object, no markdown formatting or code blocks.`;
  }

  private static parseComplianceResponse(responseText: string): ComplianceAnalysisResult {
    try {
      // Try to extract JSON from the response
      let jsonStr = responseText.trim();

      // If wrapped in markdown code blocks, extract the JSON
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);

      return {
        riskLevel: parsed.riskLevel || 'medium',
        score: typeof parsed.score === 'number' ? parsed.score : 50,
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    } catch (error) {
      console.error('Error parsing compliance response:', error, 'Response:', responseText);
      // Return a default response if parsing fails
      return {
        riskLevel: 'medium',
        score: 50,
        findings: ['Unable to parse AI response - manual review recommended'],
        strengths: [],
        weaknesses: [],
        recommendations: ['Please contact support for manual review'],
      };
    }
  }

  private static parseAuditResponse(responseText: string): AuditReportSummary {
    try {
      // Try to extract JSON from the response
      let jsonStr = responseText.trim();

      // If wrapped in markdown code blocks, extract the JSON
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);

      return {
        executiveSummary: parsed.executiveSummary || 'Audit completed.',
        keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
        riskAssessment: parsed.riskAssessment || 'Risk assessment pending.',
        requiredActions: Array.isArray(parsed.requiredActions) ? parsed.requiredActions : [],
        timeline: parsed.timeline || 'Timeline to be determined.',
      };
    } catch (error) {
      console.error('Error parsing audit response:', error, 'Response:', responseText);
      // Return a default response if parsing fails
      return {
        executiveSummary: 'Audit completed with manual review recommended.',
        keyFindings: ['Unable to parse AI response'],
        riskAssessment: 'Manual review required',
        requiredActions: ['Contact support for manual audit review'],
        timeline: 'Immediate',
      };
    }
  }
}