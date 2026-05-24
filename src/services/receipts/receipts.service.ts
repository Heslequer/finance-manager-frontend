import { supabase } from '../../lib/supabase';

const RECEIPTS_BUCKET = 'heavenace_receipts';

export type ReceiptListItem = {
  name: string;
  path: string;
  signedUrl: string;
};

export class ReceiptsService {

  async listReceiptsWithSignedUrls(
    userId: string,
    transactionId: string,
    expiresInSeconds = 3600,
  ): Promise<ReceiptListItem[]> {
    const folderPath = `${userId}/${transactionId}`;
    const { data: items, error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error('listReceiptsWithSignedUrls', error);
      return [];
    }
    if (!items?.length) {
      return [];
    }

    const results: ReceiptListItem[] = [];
    for (const item of items) {
      if (!item.name) continue;
      const path = `${folderPath}/${item.name}`;
      const { data: signed, error: signError } = await supabase.storage
        .from(RECEIPTS_BUCKET)
        .createSignedUrl(path, expiresInSeconds);
      if (signError || !signed?.signedUrl) {
        continue;
      }
      results.push({ name: item.name, path, signedUrl: signed.signedUrl });
    }
    return results;
  }

  async uploadReceipt(
    userId: string,
    transactionId: string,
    file: File
  ): Promise<{ data: { path: string } | null; error: Error | null }> {
    const filePath = `${userId}/${transactionId}/${file.name}`;
    const { data, error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(filePath, file);

    if (error) {
      return { data: null, error };
    }
    return { data: data as { path: string }, error: null };
  }

  async uploadReceipts(
    userId: string,
    transactionId: string,
    files: File[]
  ): Promise<{ paths: string[]; errors: Error[] }> {
    const paths: string[] = [];
    const errors: Error[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${userId}/${transactionId}/${file.name}`;

      const { data, error } = await supabase.storage
        .from(RECEIPTS_BUCKET)
        .upload(filePath, file);

      if (error) {
        errors.push(error as Error);
      } else if (data?.path) {
        paths.push(data.path);
      }
    }

    return { paths, errors };
  }

  /**
   * Removes objects by path (relative to bucket root, e.g. userId/transactionId/file.png).
   * Requires Storage RLS DELETE policy for authenticated users on that prefix.
   */
  async removeReceipts(paths: string[]): Promise<{ errors: Error[] }> {
    if (paths.length === 0) {
      return { errors: [] };
    }
    const { error } = await supabase.storage.from(RECEIPTS_BUCKET).remove(paths);
    if (error) {
      return { errors: [error as Error] };
    }
    return { errors: [] };
  }
}

export const receiptsService = new ReceiptsService();
