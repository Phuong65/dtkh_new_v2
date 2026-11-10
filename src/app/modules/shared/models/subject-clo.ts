import { BaseModel } from '@core/models/base-model';

export interface SubjectClo extends BaseModel {
    id: number;
    subject_id: number;
    subject_muctieu_chitiet_id: number | null;
    kyhieu: string | null;
    ordering: number;
    noidung: string | null;
}