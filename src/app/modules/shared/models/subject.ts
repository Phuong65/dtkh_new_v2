import { BaseModel } from "@core/models/base-model";

export interface Subject extends BaseModel {
    id: number;
    name: string;
    code: string;
    desc: string;
    sotinchi: number;
    sotinchi_th: number;
}