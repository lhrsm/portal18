import {
  FiscalIssueRequest,
  FiscalIssueResult,
  FiscalCancelRequest,
  FiscalCancelResult,
  FiscalEventStatus
} from './types';

export interface FiscalProvider {
  readonly name: string;

  /**
   * Validates server-only configuration and credentials presence without logging secrets.
   */
  validateConfiguration(): { configured: boolean; missingKeys?: string[] };

  /**
   * Issues an NFS-e document.
   */
  issue(request: FiscalIssueRequest): Promise<FiscalIssueResult>;

  /**
   * Directly queries the municipal status of an issued document.
   */
  getStatus(providerDocumentId: string): Promise<{
    status: FiscalEventStatus;
    municipalDocumentNumber?: string;
    verificationCode?: string;
    issuedAt?: string;
  }>;

  /**
   * Requests document cancellation.
   */
  cancel(request: FiscalCancelRequest): Promise<FiscalCancelResult>;

  /**
   * Performs an operational health check on the fiscal service.
   */
  healthCheck(): Promise<{ healthy: boolean; status: string; latencyMs: number }>;
}
