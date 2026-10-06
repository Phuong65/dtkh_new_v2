export interface BaseModel {
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  created_by?: number;
  updated_by?: number;
  is_deleted?: number | boolean;
  deleted_by?: number;
  deleted_at?: string | Date | null;
}