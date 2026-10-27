export interface BoCtdtCdr {
    id?: number;
    ctdt_bo_id: number;
    kyhieu?: string | null;
    ordering?: number | null;
    noidung: string;
    parent_id: number;
    percent_pi: number;
}

export type BoCtdtCdrPayload = Pick<BoCtdtCdr, 'ctdt_bo_id' | 'noidung' | 'parent_id' | 'percent_pi'>;
