import { BaseModel } from "@core/models/base-model";
import { Subject } from "./subject";

export interface SubjectCourse extends BaseModel {
    id: number;
    subject_id: number;
    ctdt_bo_id: number;
}

export interface SubjectCourseExtend extends SubjectCourse {
    subjects?: Subject[] | Subject;
}