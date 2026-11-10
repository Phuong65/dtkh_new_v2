import { BaseModel } from "@core/models/base-model";
import type { DocumentFileAndLink } from "@modules/shared/components/form-document-file-and-link/form-document-file-and-link.component";

export interface SubjectParams {
    [key: string]: unknown;
    sotinchi?: number | null;
    sotinchi_th?: number | null;
    exam_format?: string | null;
    exam_type?: string | null;
    cdr?: number | null;
    tongsogio?: number | null;
    lythuyet?: number | null;
    thaoluan_baitap?: number | null;
    th_thinghiem?: number | null;
    kiemtra_dinhky?: number | null;
    tuhoc?: number | null;
}

export interface Subject extends BaseModel {
    id: number;
    name: string;
    code: string;
    desc: string;
    sotinchi: number;
    sotinchi_th: number;
    params?: SubjectParams;
    av?: number | null;
    muctieu?: string | null;
    yeucau_sinhvien?: string | null;
    tailieu_chinh?: DocumentFileAndLink[];
    tailieu_thamkhao?: DocumentFileAndLink[];
}