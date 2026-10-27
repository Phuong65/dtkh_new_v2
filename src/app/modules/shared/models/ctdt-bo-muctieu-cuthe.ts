export interface CtdtBoMuctieuCuthe {
    id?: number;
    ctdt_bo_id: number;
    noidung: string;
}

export type CtdtBoMuctieuCuthePayload = Pick<CtdtBoMuctieuCuthe, 'ctdt_bo_id' | 'noidung'>;
