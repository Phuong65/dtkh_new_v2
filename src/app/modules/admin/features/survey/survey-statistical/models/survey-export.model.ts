import { Classes } from '@modules/shared/models/classes';
import { DonVi } from '@modules/shared/models/don-vi';
import { QuestionStat, SurveyAnswerRaw } from '@modules/shared/models/survey-statistics.model';
import { Survey } from '@modules/shared/models/survey';
import { SurveyPlan } from '@modules/shared/models/survey-plan';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { User } from '@core/models/user';

export const SURVEY_EXPORT_ALL = '__ALL__';
export const SURVEY_EXPORT_UNGROUPED = '__UNGROUPED__';

export interface SurveyExportOption<T = string | number> {
    label: string;
    value: T;
}

export interface SurveyExportFilter {
    facultyIds: Array<number | typeof SURVEY_EXPORT_ALL>;
    cohorts: Array<string | typeof SURVEY_EXPORT_ALL>;
    groupIds: Array<string | typeof SURVEY_EXPORT_ALL | typeof SURVEY_EXPORT_UNGROUPED>;
}

export interface SurveyExportCandidate {
    key: string;
    classId: number;
    teacherId: number;
    facultyId: number | null;
    cohort: string;
}

export interface SurveyExportContext {
    survey: Survey;
    plan: SurveyPlan;
    questions: QuestionStat[];
    classes: Map<number, Classes>;
    teachers: Map<number, string>;
    teacherDetails: Map<number, User>;
    courses: Map<number, ElnKhoaHoc>;
    faculties: Map<number, DonVi>;
    programs: Map<number, string>;
}

export interface SurveyExportRow extends SurveyExportCandidate {
    facultyName: string;
    courseCode: string;
    courseTitle: string;
    programName: string;
    className: string;
    classSymbol: string;
    subjectType: string;
    teacherName: string;
    answersByQuestion: Map<number, SurveyAnswerRaw[]>;
}
