import { BaseModel } from '@core/models/base-model';

export interface SubjectMuctieuChitiet extends BaseModel {
    id: number;
    subject_id: number;
    ordering: number;
    kyhieu: string | null;
    noidung: string | null;
}