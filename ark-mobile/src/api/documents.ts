import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File, UploadTask, UploadType } from 'expo-file-system';

import { api } from '@/lib/api';
import type { Document, DocumentType } from '@/lib/types';
import { unwrapList, type Paginated } from './_paginated';

const KEY = ['documents'] as const;

const ALLOWED_CONTENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB — mirrors backend
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / 1024 / 1024;

export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

/** List of (non-deleted) documents for the current user. */
export function useDocuments() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Document[] | Paginated<Document>>('/documents/');
      return unwrapList<Document>(data);
    },
  });
}

/**
 * Two-step upload:
 *   1. POST /documents/upload/ with metadata → presigned PUT URL + Document row
 *   2. PUT the file bytes via `expo-file-system`'s native UploadTask, which
 *      streams directly from disk (vs `fetch(uri).blob()` which is unreliable
 *      on RN — known Content-Length / 0-byte issues on Android in particular).
 *
 * If the S3 PUT fails after the row is created, we best-effort soft-delete
 * the orphan so the user never sees a "phantom" document in the list.
 */
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: PickedFile; documentType: DocumentType }) => {
      const file = normalizeMime(input.file);
      validateFile(file);

      const { data } = await api.post<{
        id: number;
        upload_url: string;
        document: Document;
      }>('/documents/upload/', {
        filename: file.name,
        content_type: file.mimeType,
        file_size: file.size,
        document_type: input.documentType,
      });

      try {
        const localFile = new File(file.uri);
        const task = new UploadTask(localFile, data.upload_url, {
          httpMethod: 'PUT',
          uploadType: UploadType.BINARY_CONTENT,
          headers: { 'Content-Type': file.mimeType },
        });
        const result = await task.uploadAsync();
        if (result.status < 200 || result.status >= 300) {
          throw new Error(`Upload rejected by storage (${result.status}).`);
        }
      } catch (e) {
        // Roll back the DB row so the list doesn't show a phantom document.
        // We swallow the cleanup error — the user-facing error is the PUT's.
        await api.delete(`/documents/${data.id}/`).catch(() => undefined);
        throw e;
      }

      return data.document;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

/**
 * Plain async function (not a mutation) so each call is independent:
 * rapid taps on different rows can't replace an in-flight call, and the
 * presigned URL doesn't sit in TanStack mutation state for an hour.
 */
export async function fetchDownloadUrl(id: number): Promise<string> {
  const { data } = await api.get<{ download_url: string }>(`/documents/${id}/download/`);
  return data.download_url;
}

/** Soft-delete a document (server flips deleted_at; row drops from the list). */
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/documents/${id}/`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

/**
 * Android's document picker sometimes returns `image/jpg` (and rarely an
 * empty mime). Normalize to what the backend's ChoiceField accepts.
 */
function normalizeMime(file: PickedFile): PickedFile {
  let mime = (file.mimeType || '').toLowerCase();
  if (mime === 'image/jpg') mime = 'image/jpeg';
  if (!mime && /\.pdf$/i.test(file.name)) mime = 'application/pdf';
  if (!mime && /\.(jpg|jpeg)$/i.test(file.name)) mime = 'image/jpeg';
  if (!mime && /\.png$/i.test(file.name)) mime = 'image/png';
  return { ...file, mimeType: mime };
}

function validateFile(file: PickedFile): void {
  if (!ALLOWED_CONTENT_TYPES.includes(file.mimeType as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    throw new Error('Only PDF, JPG, and PNG files are supported.');
  }
  if (file.size <= 0) {
    throw new Error('That file appears to be empty.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Files must be ${MAX_UPLOAD_MB} MB or smaller.`);
  }
}
