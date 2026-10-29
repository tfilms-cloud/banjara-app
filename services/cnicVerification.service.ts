import { apiRequest } from '@/services/api';

export type CnicExtractResult = {
  cnicNumber: string | null;
  fatherName: string | null;
  expiryDate: string | null;
  confidence: {
    cnicNumber: number | null;
    fatherName: number | null;
    expiryDate: number | null;
  };
  filled?: boolean;
  note?: string;
};

export type CnicVerifyResult = {
  verified: boolean;
  status: 'verified' | 'failed' | 'manual_review';
  message: string;
  fields: {
    cnicNumber: { entered: string; extracted: string | null; matched: boolean };
    fatherName: {
      entered: string;
      extracted: string | null;
      matched: boolean;
      similarity: number;
    };
    expiryDate: {
      entered: string;
      extracted: string | null;
      matched: boolean;
      expired: boolean;
    };
  };
  identityVerification?: {
    verificationStatus: string;
    cnicVerified: boolean;
    cnicNumberMasked: string;
    fatherNameVerified: boolean;
    expiryDateVerified: boolean;
    verificationFailureReason: string | null;
  };
};

function appendImage(form: FormData, field: string, uri: string, fileName: string) {
  form.append(field, {
    uri,
    name: fileName,
    type: 'image/jpeg',
  } as unknown as Blob);
}

/** Prefill fields from CNIC front image (backend OCR). */
export async function extractCnicFromImage(frontUri: string): Promise<CnicExtractResult> {
  const form = new FormData();
  appendImage(form, 'front', frontUri, `cnic-front-${Date.now()}.jpg`);
  return apiRequest<CnicExtractResult>({
    method: 'POST',
    url: '/verification/cnic/extract',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: [(data) => data],
    timeout: 120000,
  });
}

/** Final verification — backend decides match status. */
export async function verifyCnic(input: {
  cnicNumber: string;
  fatherName: string;
  expiryDate: string;
  frontUri: string;
  backUri?: string;
}): Promise<CnicVerifyResult> {
  const form = new FormData();
  form.append('cnicNumber', input.cnicNumber);
  form.append('fatherName', input.fatherName);
  form.append('expiryDate', input.expiryDate);
  appendImage(form, 'front', input.frontUri, `cnic-front-${Date.now()}.jpg`);
  if (input.backUri) {
    appendImage(form, 'back', input.backUri, `cnic-back-${Date.now()}.jpg`);
  }

  return apiRequest<CnicVerifyResult>({
    method: 'POST',
    url: '/verification/cnic',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: [(data) => data],
    timeout: 180000,
  });
}

export async function getCnicVerificationStatus() {
  return apiRequest<CnicVerifyResult['identityVerification'] | null>({
    method: 'GET',
    url: '/verification/cnic',
  });
}
