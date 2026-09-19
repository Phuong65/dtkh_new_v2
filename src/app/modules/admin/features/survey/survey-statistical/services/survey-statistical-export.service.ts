import { Injectable } from '@angular/core';
import { FileService } from '@core/services/file.service';
import { UserService } from '@core/services/user.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { CategoriesService } from '@modules/shared/services/categories.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { Workbook, Worksheet } from 'exceljs';
import * as FileSaver from 'file-saver';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
    SURVEY_EXPORT_ALL,
    SURVEY_EXPORT_UNGROUPED,
    SurveyExportCandidate,
    SurveyExportContext,
    SurveyExportFilter,
    SurveyExportOption,
    SurveyExportRow
} from '../models/survey-export.model';
import { QuestionStat, SurveyAnswerRaw } from '@modules/shared/models/survey-statistics.model';
import { Survey } from '@modules/shared/models/survey';
import { SurveyPlan } from '@modules/shared/models/survey-plan';
import { ConditionOption } from '@modules/shared/models/condition-option';

interface ExportQuestionColumn {
    question: QuestionStat;
    children: Array<{
        key: string;
        answerLabel: string;
        metricLabel: string;
        type: 'option-count' | 'option-rate' | 'rate' | 'text-count';
    }>;
}

@Injectable({ providedIn: 'root' })
export class SurveyStatisticalExportService {
    private readonly templateUrl = 'assets/files/survey/PL01_Xuat_du_lieu_khao_sat_theo_lop_hoc_phan_GV.xlsx';

    constructor(
        private fileService: FileService,
        private userService: UserService,
        private classesService: ClassesService,
        private elnKhoaHocService: ElnKhoaHocService,
        private categoriesService: CategoriesService,
        private donViService: DonViService
    ) { }

    async prepareContext(survey: Survey, plan: SurveyPlan, questions: QuestionStat[]): Promise<SurveyExportContext> {
        const answers = questions.flatMap(item => item.rawAnswers || []);
        const teacherIds = this.uniqueNumbers(answers.map(item => item.teacher_id));
        const classIds = this.uniqueNumbers(answers.map(item => item.class_id));
        const answerCourseIds = this.uniqueNumbers(answers.map(item => item.course_id));

        const base = await firstValueFrom(forkJoin({
            users: teacherIds.length
                ? this.userService.getUserByItem(teacherIds.join(','), 'id').pipe(catchError(() => of([])))
                : of([]),
            classes: classIds.length
                ? this.classesService.getDataClassesByCol('id', classIds.join(',')).pipe(catchError(() => of([])))
                : of([])
        }).pipe(
            switchMap(result => {
                const users = Array.isArray(result.users) ? result.users : [];
                const classes = Array.isArray(result.classes) ? result.classes : [];
                const classCourseIds = this.uniqueNumbers(classes.map(item => item.course_id));
                const courseIds = Array.from(new Set([...answerCourseIds, ...classCourseIds]));
                const programIds = this.uniqueNumbers(classes.map(item => item.nganh_bomon_id));
                return forkJoin({
                    base: of({ users, classes }),
                    courses: courseIds.length
                        ? this.elnKhoaHocService.get<ElnKhoaHoc>([], {
                            include: courseIds.join(','),
                            include_by: 'id',
                            limit: -1
                        }).pipe(
                            map(result => Array.isArray(result.data) ? result.data : []),
                            catchError(() => of([]))
                        )
                        : of([]),
                    programs: programIds.length
                        ? this.categoriesService.getCategoriesOfIds(programIds).pipe(catchError(() => of([])))
                        : of([])
                });
            }),
            switchMap(result => {
                const courses = Array.isArray(result.courses) ? result.courses : [];
                const programs = Array.isArray(result.programs) ? result.programs : [];
                const classFacultyIds = this.uniqueNumbers(result.base.classes.map(item => item.donvi_chuyenmon_id));
                const courseFacultyIds = courses.flatMap(course => this.normalizeIds(course.category_ids));
                const planFacultyIds = this.uniqueNumbers(Array.isArray(plan.danh_muc_khoa) ? plan.danh_muc_khoa : []);
                const facultyIds = Array.from(new Set([...planFacultyIds, ...classFacultyIds, ...courseFacultyIds]));
                return forkJoin({
                    metadata: of({ ...result, courses, programs }),
                    faculties: facultyIds.length
                        ? this.donViService.getDonviByPageNew({
                            condition: [],
                            page: null,
                            set: [
                                { label: 'include', value: facultyIds.join(',') },
                                { label: 'include_by', value: 'id' },
                                { label: 'limit', value: '-1' },
                                { label: 'orderby', value: 'title' },
                                { label: 'order', value: 'ASC' }
                            ]
                        } as ConditionOption).pipe(
                            map(result => Array.isArray(result.data) ? result.data : []),
                            catchError(() => of([]))
                        )
                        : of([])
                });
            })
        ));

        return {
            survey,
            plan,
            questions,
            classes: new Map(base.metadata.base.classes.filter(item => item.id != null).map(item => [Number(item.id), item])),
            teachers: new Map(base.metadata.base.users.map(item => [item.id, item.display_name])),
            teacherDetails: new Map(base.metadata.base.users.map(item => [item.id, item])),
            courses: new Map(base.metadata.courses.filter(item => item.id != null).map(item => [Number(item.id), item])),
            faculties: new Map((Array.isArray(base.faculties) ? base.faculties : []).map(item => [item.id, item])),
            programs: new Map(base.metadata.programs.map(item => [item.id, item.title]))
        };
    }

    buildFacultyOptions(context: SurveyExportContext): SurveyExportOption<number | string>[] {
        const planFacultyIds = this.uniqueNumbers(
            Array.isArray(context.plan.danh_muc_khoa) ? context.plan.danh_muc_khoa : []
        );
        const courseFacultyIds = Array.from(context.courses.values())
            .flatMap(course => this.normalizeIds(course.category_ids));
        const ids = planFacultyIds.length
            ? planFacultyIds
            : Array.from(new Set(courseFacultyIds));
        return [
            { label: 'Tất cả', value: SURVEY_EXPORT_ALL },
            ...ids.map(id => ({ label: context.faculties.get(id)?.title || `Khoa #${id}`, value: id }))
                .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
        ];
    }

    buildCohortOptions(context: SurveyExportContext): SurveyExportOption<string>[] {
        const candidates = this.buildCandidates(context, { facultyIds: [SURVEY_EXPORT_ALL], cohorts: [SURVEY_EXPORT_ALL], groupIds: [SURVEY_EXPORT_ALL] });
        const cohorts = Array.from(new Set(candidates.map(item => item.cohort).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        return [{ label: 'Tất cả', value: SURVEY_EXPORT_ALL }, ...cohorts.map(value => ({ label: `K${value.replace(/^K/i, '')}`, value }))];
    }

    buildGroupOptions(context: SurveyExportContext): SurveyExportOption<string>[] {
        const groups = context.survey.group_info || [];
        const groupedIds = new Set(groups.flatMap(group => group.ids || []));
        const hasUngrouped = context.questions.some(item => !groupedIds.has(item.question.id));
        return [
            { label: 'Tất cả', value: SURVEY_EXPORT_ALL },
            ...groups.map(group => ({ label: group.name, value: group.id })),
            ...(hasUngrouped ? [{ label: 'Chưa phân nhóm', value: SURVEY_EXPORT_UNGROUPED }] : [])
        ];
    }

    countRows(context: SurveyExportContext, filter: SurveyExportFilter): number {
        return this.buildRows(context, filter).length;
    }

    async export(context: SurveyExportContext, filter: SurveyExportFilter, defaultFacultyName: string = ''): Promise<number> {
        const questions = this.filterQuestions(context, filter);
        const rows = this.buildRows(context, filter, questions);
        if (!rows.length || !questions.length) return 0;

        const blob = await firstValueFrom(this.fileService.getFileLocalAsBlob(this.templateUrl));
        const workbook = new Workbook();
        await workbook.xlsx.load(await blob.arrayBuffer());
        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error('Không tìm thấy sheet trong mẫu PL01');

        this.fillWorkbook(worksheet, context, questions, rows);
        const buffer = await workbook.xlsx.writeBuffer();
        const file = new Blob([buffer as any], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        FileSaver.saveAs(file, this.buildFileName(context, filter, defaultFacultyName));
        return rows.length;
    }

    private buildCandidates(context: SurveyExportContext, filter: SurveyExportFilter, selectedQuestions?: QuestionStat[]): SurveyExportCandidate[] {
        const questions = selectedQuestions || this.filterQuestions(context, filter);
        const map = new Map<string, SurveyExportCandidate>();
        questions.flatMap(question => question.rawAnswers || []).forEach(answer => {
            if (answer.class_id == null || answer.teacher_id == null) return;
            const classId = Number(answer.class_id);
            const teacherId = Number(answer.teacher_id);
            const classInfo = context.classes.get(classId);
            const courseId = Number(answer.course_id ?? classInfo?.course_id);
            const course = context.courses.get(courseId);
            const facultyId = this.getFacultyId(classInfo, course);
            const cohort = String(classInfo?.khoa || '');
            const key = `${classId}|${teacherId}`;
            if (!map.has(key)) map.set(key, { key, classId, teacherId, facultyId, cohort });
        });
        return Array.from(map.values()).filter(item => this.matchesRowFilter(item, filter));
    }

    private buildRows(context: SurveyExportContext, filter: SurveyExportFilter, selectedQuestions?: QuestionStat[]): SurveyExportRow[] {
        const questions = selectedQuestions || this.filterQuestions(context, filter);
        return this.buildCandidates(context, filter, questions).map(candidate => {
            const classInfo = context.classes.get(candidate.classId);
            const course = context.courses.get(Number(classInfo?.course_id));
            const answersByQuestion = new Map<number, SurveyAnswerRaw[]>();
            questions.forEach(question => {
                answersByQuestion.set(question.question.id, (question.rawAnswers || []).filter(answer =>
                    Number(answer.class_id) === candidate.classId && Number(answer.teacher_id) === candidate.teacherId
                ));
            });
            return {
                ...candidate,
                facultyName: candidate.facultyId != null ? context.faculties.get(candidate.facultyId)?.title || `Khoa #${candidate.facultyId}` : '',
                courseCode: course?.maso || '',
                courseTitle: course?.title || this.getCourseInfoTitle(classInfo?.course_info),
                programName: classInfo ? context.programs.get(Number(classInfo.nganh_bomon_id)) || '' : '',
                className: classInfo?.name || `Lớp #${candidate.classId}`,
                classSymbol: classInfo?.kyhieu || '',
                subjectType: String((classInfo as any)?.type || (classInfo as any)?.loai_mon || ''),
                teacherName: context.teachers.get(candidate.teacherId) || `Giảng viên #${candidate.teacherId}`,
                answersByQuestion
            };
        }).sort((a, b) =>
            a.facultyName.localeCompare(b.facultyName, 'vi') ||
            a.cohort.localeCompare(b.cohort) ||
            a.courseCode.localeCompare(b.courseCode) ||
            a.className.localeCompare(b.className, 'vi') ||
            a.teacherName.localeCompare(b.teacherName, 'vi')
        );
    }

    private filterQuestions(context: SurveyExportContext, filter: SurveyExportFilter): QuestionStat[] {
        if (filter.groupIds.includes(SURVEY_EXPORT_ALL)) return context.questions;
        const groups = context.survey.group_info || [];
        const selectedIds = new Set(groups.filter(group => filter.groupIds.includes(group.id)).flatMap(group => group.ids || []));
        if (filter.groupIds.includes(SURVEY_EXPORT_UNGROUPED)) {
            const allGrouped = new Set(groups.flatMap(group => group.ids || []));
            context.questions.forEach(item => {
                if (!allGrouped.has(item.question.id)) selectedIds.add(item.question.id);
            });
        }
        return context.questions.filter(item => selectedIds.has(item.question.id));
    }

    private fillWorkbook(worksheet: Worksheet, context: SurveyExportContext, questions: QuestionStat[], rows: SurveyExportRow[]): void {
        const originalColumnCount = worksheet.columnCount; 
        const questionColumns = this.buildQuestionColumns(questions); 
        const headerStyle = this.clone(worksheet.getCell('I8').style);
        const subHeaderStyle = this.clone(worksheet.getCell('I9').style);
        const dataStyle = this.clone(worksheet.getCell('I10').style);
        const fixedDataStyles = Array.from({ length: 8 }, (_, index) => this.clone(worksheet.getCell(10, index + 1).style));
        const dataHeight = worksheet.getRow(10).height;

        // Dòng 8–10 là header 3 tầng: Câu hỏi → Đáp án → Số phiếu/Tỷ lệ.
        const mergedRanges = (
            worksheet.model as typeof worksheet.model & { merges?: string[] }
        ).merges ?? [];
        [...mergedRanges].forEach(range => {
            const startCell = String(range).split(':')[0];
            const columnLetters = startCell.match(/[A-Z]+/)?.[0] || 'A';
            const rowNumber = Number(startCell.match(/\d+/)?.[0] || 0);
            if (this.columnNumber(columnLetters) >= 9 || rowNumber === 8) {
                worksheet.unMergeCells(String(range));
            }
        });
        if (originalColumnCount > 8) worksheet.spliceColumns(9, originalColumnCount - 8);
        for (let rowNumber = 10; rowNumber <= worksheet.rowCount; rowNumber++) {
            worksheet.getRow(rowNumber).eachCell({ includeEmpty: true }, cell => cell.value = null);
        }
        for (let fixedColumn = 1; fixedColumn <= 8; fixedColumn++) {
            worksheet.mergeCells(8, fixedColumn, 10, fixedColumn);
        }

        worksheet.getCell('C5').value = context.plan.title;
        worksheet.getCell('C6').value = context.plan.semester;
        worksheet.getCell('F6').value = context.plan.school_year;

        let column = 9;
        questionColumns.forEach(group => {
            const questionStart = column;
            let childIndex = 0;
            while (childIndex < group.children.length) {
                const answerLabel = group.children[childIndex].answerLabel;
                const answerStart = column;
                while (childIndex < group.children.length && group.children[childIndex].answerLabel === answerLabel) {
                    const child = group.children[childIndex];
                    const questionCell = worksheet.getCell(8, column);
                    const answerCell = worksheet.getCell(9, column);
                    const metricCell = worksheet.getCell(10, column);
                    questionCell.style = this.clone(headerStyle);
                    answerCell.style = this.clone(subHeaderStyle);
                    metricCell.style = this.clone(subHeaderStyle);
                    metricCell.value = child.metricLabel;
                    worksheet.getColumn(column).width = child.type === 'option-rate' ? 10 : 9;
                    column++;
                    childIndex++;
                }
                const answerEnd = column - 1;
                worksheet.getCell(9, answerStart).value = answerLabel;
                if (answerEnd > answerStart) worksheet.mergeCells(9, answerStart, 9, answerEnd);
            }
            const questionEnd = column - 1;
            worksheet.getCell(8, questionStart).value = group.question.question.title;
            if (questionEnd > questionStart) worksheet.mergeCells(8, questionStart, 8, questionEnd);
        });

        rows.forEach((item, rowIndex) => {
            const rowNumber = 11 + rowIndex;
            const row = worksheet.getRow(rowNumber);
            row.height = dataHeight;
            const teacher = context.teacherDetails.get(item.teacherId);
            const fixedValues = [
                rowIndex + 1,
                item.className || item.classSymbol,
                item.programName || item.courseTitle,
                item.cohort ? `K${item.cohort.replace(/^K/i, '')}` : '',
                teacher?.username || '',
                item.teacherName,
                item.facultyName,
                item.subjectType
            ];
            fixedValues.forEach((value, index) => {
                const cell = row.getCell(index + 1);
                cell.style = this.clone(fixedDataStyles[index]);
                cell.value = value as any;
            });

            let dataColumn = 9;
            questionColumns.forEach(group => {
                const answers = item.answersByQuestion.get(group.question.question.id) || [];
                group.children.forEach(child => {
                    const cell = row.getCell(dataColumn++);
                    cell.style = this.clone(dataStyle);
                    const denominator = this.countQuestionResponses(answers);
                    if (child.type === 'option-count') {
                        cell.value = this.countOption(answers, child.key);
                    }
                    if (child.type === 'option-rate') {
                        cell.value = denominator > 0 ? this.countOption(answers, child.key) / denominator : 0;
                        cell.numFmt = '0.0%';
                    }
                    if (child.type === 'rate') {
                        cell.value = this.averageRate(answers);
                        cell.numFmt = '0.0';
                    }
                    if (child.type === 'text-count') {
                        cell.value = this.countText(answers);
                    }
                });
            });
        });

        const lastColumn = 8 + questionColumns.reduce((total, group) => total + group.children.length, 0);
        const lastRow = Math.max(10, 10 + rows.length);

        // ExcelJS có thể giữ các column definitions/style rỗng của mẫu đến cột BW.
        // Cắt cứng mọi cột sau câu hỏi cuối để file không còn hàng chục cột trắng.
        const trailingColumnCount = worksheet.columnCount - lastColumn;
        if (trailingColumnCount > 0) {
            worksheet.spliceColumns(lastColumn + 1, trailingColumnCount);
        }
        worksheet.eachRow({ includeEmpty: true }, row => {
            for (let columnIndex = row.cellCount; columnIndex > lastColumn; columnIndex--) {
                row.getCell(columnIndex).value = null;
            }
        });

        worksheet.pageSetup.printArea = `A1:${worksheet.getColumn(lastColumn).letter}${lastRow}`;
        worksheet.pageSetup.printTitlesRow = '8:10';
    }

    private buildQuestionColumns(questions: QuestionStat[]): ExportQuestionColumn[] {
        return questions.map((question): ExportQuestionColumn => {
            if (question.data.type === 'option') {
                const children: ExportQuestionColumn['children'] = [];
                (question.question.answer_options || []).forEach(option => {
                    children.push(
                        { key: String(option.id), answerLabel: option.label, metricLabel: 'Số phiếu', type: 'option-count' },
                        { key: String(option.id), answerLabel: option.label, metricLabel: 'Tỷ lệ', type: 'option-rate' }
                    );
                });
                const hasOther = question.question.allow_other_answer === 1 || (question.rawAnswers || []).some(answer => answer.has_other_answer === 1);
                if (hasOther) {
                    children.push(
                        { key: '__OTHER__', answerLabel: 'Khác', metricLabel: 'Số phiếu', type: 'option-count' },
                        { key: '__OTHER__', answerLabel: 'Khác', metricLabel: 'Tỷ lệ', type: 'option-rate' }
                    );
                }
                return { question, children };
            }
            if (question.data.type === 'rate') {
                return {
                    question,
                    children: [{ key: '__RATE__', answerLabel: 'Trung bình sao', metricLabel: 'Giá trị', type: 'rate' }]
                };
            }
            return {
                question,
                children: [
                    { key: '__TEXT_COUNT__', answerLabel: 'Câu trả lời', metricLabel: 'Số phiếu', type: 'text-count' }
                ]
            };
        }).filter(group => group.children.length > 0);
    }

    private countOption(answers: SurveyAnswerRaw[], key: string): number {
        const matched = key === '__OTHER__'
            ? answers.filter(answer => answer.has_other_answer === 1)
            : answers.filter(answer => String(answer.answer_id) === key && answer.has_other_answer !== 1);
        return this.countDistinctResponses(matched);
    }

    private averageRate(answers: SurveyAnswerRaw[]): number {
        const scores = answers.map(answer => Number(answer.answer_id ?? answer.answer_text)).filter(value => Number.isFinite(value));
        return scores.length ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10 : 0;
    }

    private countText(answers: SurveyAnswerRaw[]): number {
        return this.countDistinctResponses(
            answers.filter(answer => String(answer.answer_text ?? answer.answer_id ?? '').trim() !== '')
        );
    }

    private countQuestionResponses(answers: SurveyAnswerRaw[]): number {
        return this.countDistinctResponses(answers);
    }

    private countDistinctResponses(answers: SurveyAnswerRaw[]): number {
        const keys = new Set<string>();
        answers.forEach(answer => {
            const key = answer.student_id != null
                ? `student:${answer.student_id}`
                : answer.code
                    ? `code:${answer.code}`
                    : `answer:${answer.id}`;
            keys.add(key);
        });
        return keys.size;
    }

    private matchesRowFilter(item: SurveyExportCandidate, filter: SurveyExportFilter): boolean {
        const facultyMatch = filter.facultyIds.includes(SURVEY_EXPORT_ALL) || (item.facultyId != null && filter.facultyIds.includes(item.facultyId));
        const cohortMatch = filter.cohorts.includes(SURVEY_EXPORT_ALL) || filter.cohorts.includes(item.cohort);
        return facultyMatch && cohortMatch;
    }

    private getFacultyId(classInfo: any, course: any): number | null {
        const classId = Number(classInfo?.donvi_chuyenmon_id);
        if (Number.isFinite(classId) && classId > 0) return classId;
        return this.normalizeIds(course?.category_ids)[0] ?? null;
    }

    private buildFileName(
        context: SurveyExportContext,
        filter: SurveyExportFilter,
        defaultFacultyName: string = ''
    ): string {
        const segments = [
            'Thong_ke_khao_sat',
            context.plan.school_year,
            `HK${context.plan.semester}`
        ];

        if (!filter.facultyIds.includes(SURVEY_EXPORT_ALL)) {
            const names = filter.facultyIds
                .filter((id): id is number => typeof id === 'number')
                .map(id => context.faculties.get(id)?.title || `Khoa-${id}`);
            if (names.length) segments.push(`Khoa-${names.join('-')}`);
        } else if (defaultFacultyName) {
            // Route lãnh đạo khoa ẩn bộ lọc Khoa nhưng tên file vẫn cần ghi rõ phạm vi.
            segments.push(`Khoa-${defaultFacultyName}`);
        }

        if (!filter.cohorts.includes(SURVEY_EXPORT_ALL)) {
            const cohorts = filter.cohorts
                .filter(value => value !== SURVEY_EXPORT_ALL)
                .map(value => `K${String(value).replace(/^K/i, '')}`);
            if (cohorts.length) segments.push(`KhoaHoc-${cohorts.join('-')}`);
        }

        if (!filter.groupIds.includes(SURVEY_EXPORT_ALL)) {
            const groups = context.survey.group_info || [];
            const names = filter.groupIds
                .filter(value => value !== SURVEY_EXPORT_ALL)
                .map(value => value === SURVEY_EXPORT_UNGROUPED
                    ? 'Chua-phan-nhom'
                    : groups.find(group => group.id === value)?.name || value);
            if (names.length) segments.push(`NhomCauHoi-${names.join('-')}`);
        }

        const safeName = segments
            .map(segment => this.slugFileSegment(String(segment)))
            .filter(Boolean)
            .join('_')
            .slice(0, 190);
        return `${safeName}.xlsx`;
    }

    private slugFileSegment(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .replace(/[<>:"/\\|?*]+/g, '-')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    private normalizeIds(value: any): number[] {
        if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
        if (value == null || value === '') return [];
        try {
            const parsed = JSON.parse(String(value));
            return (Array.isArray(parsed) ? parsed : [parsed]).map(Number).filter(Number.isFinite);
        } catch {
            return String(value).split(',').map(Number).filter(Number.isFinite);
        }
    }

    private uniqueNumbers(values: any[]): number[] {
        return Array.from(new Set(values.map(Number).filter(value => Number.isFinite(value) && value > 0)));
    }

    private getCourseInfoTitle(value: any): string {
        if (!value) return '';
        if (typeof value === 'object') return String(value.title || '');
        try { return String(JSON.parse(value)?.title || ''); } catch { return ''; }
    }

    private clone<T>(value: T): T {
        return value ? JSON.parse(JSON.stringify(value)) : value;
    }

    private columnNumber(letters: string): number {
        return letters.split('').reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0);
    }
}
