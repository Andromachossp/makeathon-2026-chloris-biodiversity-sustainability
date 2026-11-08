/** What /api/photo/[slug] returns. Nothing else (no coordinates, no record IDs, no occurrence links). */
export interface PhotoResponse {
  url: string;
  creator: string;
  licence: string;
  licenceUrl: string;
}
