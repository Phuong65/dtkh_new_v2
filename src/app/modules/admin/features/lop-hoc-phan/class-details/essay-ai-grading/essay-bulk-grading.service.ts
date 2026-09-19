import { Injectable } from '@angular/core';
import { OvicQueryCondition } from '@core/models/dto';
import { ClassPlanActivityStudentAnswers } from '@modules/shared/models/class-plan-activity-student-answers';
import { ClassPlanActivityStudentTests } from '@modules/shared/models/class-plan-activity-student-tests';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { ApiAiService } from '@modules/shared/services/api-ai.service';
import { ClassPlanActivityStudentAnswersService } from '@modules/shared/services/class-plan-activity-student-answers.service';
import { ClassPlanActivityStudentTestsService } from '@modules/shared/services/class-plan-activity-student-tests.service';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { catchError, concatMap, delay, forkJoin, from, map, Observable, of, tap, toArray } from 'rxjs';
import {
    buildEssayAiGradingPrompt,
    containsEssayAiImageReference,
    getValidEssayAiMaxScore,
    mapEssayAiGradingResult,
    normalizeEssayAiPromptContent,
    parseEssayAiGradingResponse,
    truncateEssayAiAnswer
} from './essay-ai-grading.utils';

const BULK_AI_TEST_PACK_SIZE = 20;
const BULK_AI_MAX_PACK_BLOCKS = 40;
const BULK_AI_MAX_ANSWER_CHARS = 3000;
const BULK_AI_MAX_RETRY_DEPTH = 3;
const BULK_AI_RETRY_BACKOFF_MS = 400;
const BULK_AI_WEIGHT_GRADING = 0.4;
const BULK_AI_WEIGHT_SAVING = 0.35;
const BULK_AI_WEIGHT_COMPLETING = 0.25;

export type EssayBulkGradingPhase = 'loading' | 'grading' | 'saving' | 'completing' | 'done';

export interface EssayBulkGradingProgress {
    phase: EssayBulkGradingPhase;
    message: string;
    percent: number;
    summary: string;
}

export interface EssayBulkGradingSummary {
    totalTests: number;
    completedTests: number;
    failedTests: number;
    failedTestIds: number[];
    failedReasons: Record<number, string>;
    savedAnswers: number;
    failedAnswers: number;
    blankTests: number;
    summary: string;
}

export type EssayBulkGradingEvent =
    | { type: 'progress'; progress: EssayBulkGradingProgress }
    | { type: 'result'; result: EssayBulkGradingSummary };

interface EssayBulkPromptItem {
    key: string;
    testId: number;
    questionId: number;
    answerId: number;
    question: CoursePlanActivityTuluan;
    answer: ClassPlanActivityStudentAnswers;
    maxPoint: number;
}

interface EssayBulkSaveItem {
    testId: number;
    questionId: number;
    answerId: number;
    point: number;
    feedback: string;
}

interface EssayBulkPackResult {
    saveItems: EssayBulkSaveItem[];
}

interface EssayBulkRunContext {
    totalTests: number;
    completedPacks: number;
    totalPacks: number;
    savedAnswers: number;
    failedAnswers: number;
    completedTests: number;
    isRetry: boolean;
    errorReasons: Map<number, string>;
    blankTests: number;
    expectedAnswerIds: Map<number, Set<number>>;
    successfulAnswerIds: Set<number>;
}

@Injectable({ providedIn: 'root' })
export class EssayBulkGradingService {
    constructor(
        private apiAiService: ApiAiService,
        private studentTestsService: ClassPlanActivityStudentTestsService,
        private studentAnswersService: ClassPlanActivityStudentAnswersService,
        private essayQuestionsService: CoursePlanActivityTuluanService
    ) { }

    gradeClassTests(
        classId: number,
        week: number,
        retryTestIds: number[] = []
    ): Observable<EssayBulkGradingEvent> {
        return new Observable<EssayBulkGradingEvent>(subscriber => {
            const context = this.createContext();
            const retryIds = new Set(retryTestIds.filter(id => Number.isFinite(id) && id > 0));
            context.isRetry = retryIds.size > 0;
            const progressHandler = (progress: EssayBulkGradingProgress): void => {
                subscriber.next({ type: 'progress', progress });
            };
            progressHandler(this.createProgress('loading', 'Đang tải các bài tự luận chưa chấm', 0));
            const subscription = this.studentTestsService.getClassPlanActivityStudentTestsByPageNew(
                this.createStudentTestCondition(classId, week)
            ).pipe(
                map(response => (response.data || [])
                    .filter(test => Number(test.trangthai_cham) !== 1)
                    .filter(test => this.getQuestionIds(test).length > 0)
                    .filter(test => !retryIds.size || retryIds.has(Number(test.id)))
                    .sort((first, second) => Number(first.id) - Number(second.id))),
                concatMap(tests => this.run(tests, context, progressHandler))
            ).subscribe({
                next: result => subscriber.next({ type: 'result', result }),
                error: error => subscriber.error(error),
                complete: () => subscriber.complete()
            });
            return () => subscription.unsubscribe();
        });
    }

    private run(
        tests: ClassPlanActivityStudentTests[],
        context: EssayBulkRunContext,
        progressHandler: (progress: EssayBulkGradingProgress) => void
    ): Observable<EssayBulkGradingSummary> {
        context.totalTests = tests.length;
        if (!tests.length) {
            const summary = 'Không có bài tự luận đã nộp cần chấm';
            this.report(progressHandler, 'done', summary, 100, summary);
            return of({
                totalTests: 0,
                completedTests: 0,
                failedTests: 0,
                failedTestIds: [],
                failedReasons: {},
                savedAnswers: 0,
                failedAnswers: 0,
                blankTests: 0,
                summary
            });
        }

        tests.forEach(test => context.expectedAnswerIds.set(Number(test.id), new Set<number>()));
        const packs = this.chunkTests(tests);
        context.totalPacks = packs.length;
        this.report(progressHandler, 'grading', `Đang chấm pack 1/${packs.length}`, 0);

        return from(packs).pipe(
            concatMap((pack, index) => this.processPack(pack, index, context, progressHandler)),
            toArray(),
            concatMap(results => this.saveAnswers(
                results.flatMap(result => result.saveItems),
                context,
                progressHandler
            )),
            concatMap(() => this.markAiGradedTests(tests, context, progressHandler))
        );
    }

    private processPack(
        pack: ClassPlanActivityStudentTests[],
        packIndex: number,
        context: EssayBulkRunContext,
        progressHandler: (progress: EssayBulkGradingProgress) => void
    ): Observable<EssayBulkPackResult> {
        const testIds = pack.map(test => Number(test.id));
        const questionIds = [...new Set(pack.flatMap(test => this.getQuestionIds(test)))];
        const questionCondition: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: questionIds.join(',') },
                { label: 'include_by', value: 'id' }
            ],
            page: null
        };
        const answerCondition: ConditionOption = {
            condition: [{
                conditionName: 'class_plan_activity_student_test_id',
                condition: OvicQueryCondition.equal,
                value: testIds.join(','),
                orWhere: 'in'
            }],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'cursor', value: '0' },
                {
                    label: 'select',
                    value: 'id,class_plan_activity_student_test_id,course_plan_activity_tuluan_id,student_answer,point,feedback'
                }
            ],
            page: null
        };

        return this.essayQuestionsService.getCoursePlanActivityTuluanByPageNew(questionCondition).pipe(
            concatMap(questionResponse => this.studentAnswersService
                .getClassPlanActivityStudentAnswersByPageNew(answerCondition)
                .pipe(map(answerResponse => ({
                    questions: questionResponse.data || [],
                    answers: answerResponse.data || []
                })))
            ),
            concatMap(({ questions, answers }) => {
                this.countBlankTests(pack, answers, context);
                const promptItems = this.createPromptItems(pack, questions, answers, context);
                if (!promptItems.length) {
                    this.completePack(packIndex, context, progressHandler);
                    return of({ saveItems: [] });
                }

                return this.gradePromptItems(promptItems, context, 0).pipe(
                    map(saveItems => {
                        this.completePack(packIndex, context, progressHandler);
                        return { saveItems };
                    })
                );
            }),
            catchError(() => {
                pack.forEach(test => this.markTestError(
                    context,
                    Number(test.id),
                    'Tải câu hỏi hoặc bài làm của pack thất bại'
                ));
                this.completePack(packIndex, context, progressHandler);
                return of({ saveItems: [] });
            })
        );
    }

    private gradePromptItems(
        items: EssayBulkPromptItem[],
        context: EssayBulkRunContext,
        depth: number
    ): Observable<EssayBulkSaveItem[]> {
        if (!items.length) {
            return of([]);
        }
        const startedAt = Date.now();
        const prompt = buildEssayAiGradingPrompt(items.map(item => ({
            key: item.key,
            question: item.question.desc,
            studentAnswer: truncateEssayAiAnswer(item.answer.student_answer, BULK_AI_MAX_ANSWER_CHARS),
            rubricMarkdown: item.question.rubric_markdown || '',
            maxScore: item.maxPoint
        })));

        return this.apiAiService.getChamDiemAi(prompt).pipe(
            concatMap(response => {
                console.info(
                    `[EssayBulkGrading] AI request items=${items.length} promptChars=${prompt.length} elapsedMs=${Date.now() - startedAt}`
                );
                const responseItems = parseEssayAiGradingResponse(response);
                const saveItems: EssayBulkSaveItem[] = [];
                const missingItems: EssayBulkPromptItem[] = [];

                if (!responseItems) {
                    missingItems.push(...items);
                } else {
                    this.validateResponseKeys(responseItems, items);
                    items.forEach(item => {
                        const matches = responseItems.filter(result => result['question_key'] === item.key);
                        const result = matches.length === 1
                            ? mapEssayAiGradingResult(matches[0], item.maxPoint, { enforceMaxScore: true })
                            : null;
                        if (!result) {
                            missingItems.push(item);
                            return;
                        }
                        saveItems.push({
                            testId: item.testId,
                            questionId: item.questionId,
                            answerId: item.answerId,
                            point: result.score,
                            feedback: result.feedback
                        });
                    });
                }

                if (!missingItems.length) {
                    return of(saveItems);
                }
                if (depth >= BULK_AI_MAX_RETRY_DEPTH) {
                    missingItems.forEach(item => this.markTestError(
                        context,
                        item.testId,
                        'AI trả thiếu/invalid kết quả sau nhiều lần thử'
                    ));
                    return of(saveItems);
                }
                return of(null).pipe(
                    delay(BULK_AI_RETRY_BACKOFF_MS),
                    concatMap(() => this.gradePromptItems(missingItems, context, depth + 1)),
                    map(extraSaveItems => saveItems.concat(extraSaveItems))
                );
            }),
            catchError(() => {
                if (items.length <= 1 || depth >= BULK_AI_MAX_RETRY_DEPTH) {
                    items.forEach(item => this.markTestError(context, item.testId, 'Lỗi kết nối/đáp ứng từ AI server'));
                    return of([] as EssayBulkSaveItem[]);
                }
                const mid = Math.ceil(items.length / 2);
                return of(null).pipe(
                    delay(BULK_AI_RETRY_BACKOFF_MS),
                    concatMap(() => forkJoin([
                        this.gradePromptItems(items.slice(0, mid), context, depth + 1),
                        this.gradePromptItems(items.slice(mid), context, depth + 1)
                    ])),
                    map(([leftSaveItems, rightSaveItems]) => leftSaveItems.concat(rightSaveItems))
                );
            })
        );
    }

    private countBlankTests(
        pack: ClassPlanActivityStudentTests[],
        answers: ClassPlanActivityStudentAnswers[],
        context: EssayBulkRunContext
    ): void {
        const answerMap = new Map<string, ClassPlanActivityStudentAnswers>();
        answers.forEach(answer => {
            const testId = Number(answer.class_plan_activity_student_test_id);
            const questionId = Number(answer.course_plan_activity_tuluan_id);
            if (Number.isFinite(testId) && Number.isFinite(questionId)) {
                answerMap.set(this.getAnswerKey(testId, questionId), answer);
            }
        });
        pack.forEach(test => {
            const testId = Number(test.id);
            const questionIds = this.getQuestionIds(test);
            if (!questionIds.length) {
                return;
            }
            const allBlank = questionIds.every(questionId => {
                const answer = answerMap.get(this.getAnswerKey(testId, questionId));
                return !answer?.id || !normalizeEssayAiPromptContent(answer.student_answer);
            });
            if (allBlank) {
                context.blankTests++;
            }
        });
    }

    private createPromptItems(
        pack: ClassPlanActivityStudentTests[],
        questions: CoursePlanActivityTuluan[],
        answers: ClassPlanActivityStudentAnswers[],
        context: EssayBulkRunContext
    ): EssayBulkPromptItem[] {
        const questionMap = new Map<number, CoursePlanActivityTuluan>();
        questions.forEach(question => question.id && questionMap.set(Number(question.id), question));
        const answerMap = this.createAnswerMap(answers);
        const items: EssayBulkPromptItem[] = [];

        pack.forEach((test, testIndex) => {
            const testId = Number(test.id);
            // Bài đã bị lỗi dữ liệu (vd: trùng bản ghi answer) → bỏ qua toàn bộ,
            // không gửi AI và không để lại điểm lẻ tẻ trên bài lỗi.
            if (this.isTestError(context, testId)) {
                return;
            }
            let essayIndex = 0;
            this.getQuestionIds(test).forEach(questionId => {
                if (this.isTestError(context, testId)) {
                    return;
                }
                const answer = answerMap.get(this.getAnswerKey(testId, questionId));
                const question = questionMap.get(questionId);
                if (!answer?.id || !normalizeEssayAiPromptContent(answer.student_answer)) {
                    return;
                }
                const answerId = Number(answer.id);
                context.expectedAnswerIds.get(testId)?.add(answerId);
                const maxPoint = question ? getValidEssayAiMaxScore(question.point) : null;
                if (
                    !question
                    || !normalizeEssayAiPromptContent(question.desc)
                    || !question.rubric_markdown?.trim()
                    || maxPoint === null
                    || containsEssayAiImageReference(question.desc)
                    || containsEssayAiImageReference(answer.student_answer)
                ) {
                    this.markTestError(context, testId, 'Câu hỏi/rubric/max điểm không hợp lệ hoặc chứa hình ảnh');
                    return;
                }
                if (context.isRetry && answer.point !== null && answer.point !== undefined && String(answer.point) !== '') {
                    context.successfulAnswerIds.add(answerId);
                    return;
                }
                essayIndex++;
                items.push({
                    key: `test_${testIndex + 1}_essay_${essayIndex}`,
                    testId,
                    questionId,
                    answerId,
                    question,
                    answer,
                    maxPoint
                });
            });
        });
        // Loại items của các bài bị đánh dấu lỗi trong quá trình duyệt
        // (vd: một câu không hợp lệ khiến cả bài lỗi) — không để sót câu nào được chấm/lưu.
        return items.filter(item => !this.isTestError(context, item.testId));
    }

    private saveAnswers(
        items: EssayBulkSaveItem[],
        context: EssayBulkRunContext,
        progressHandler: (progress: EssayBulkGradingProgress) => void
    ): Observable<unknown> {
        if (!items.length) {
            this.report(
                progressHandler,
                'saving',
                'Không có kết quả AI hợp lệ cần lưu',
                this.scalePercent(1, BULK_AI_WEIGHT_GRADING * 100, 0)
            );
            return of([]);
        }
        this.report(
            progressHandler,
            'saving',
            `Đang lưu 0/${items.length} câu`,
            this.scalePercent(0, BULK_AI_WEIGHT_GRADING * 100, BULK_AI_WEIGHT_SAVING * 100)
        );
        let processed = 0;
        return from(items).pipe(
            concatMap(item => this.studentAnswersService.updateClassPlanActivityStudentAnswers(item.answerId, {
                point: item.point,
                feedback: item.feedback
            }).pipe(
                map(() => ({ item, success: true as const })),
                catchError(() => of({ item, success: false as const }))
            )),
            tap(result => {
                processed++;
                if (result.success) {
                    context.successfulAnswerIds.add(result.item.answerId);
                    context.savedAnswers++;
                } else {
                    this.markTestError(context, result.item.testId, `Lưu điểm câu ${result.item.questionId} thất bại`);
                    context.failedAnswers++;
                }
                this.report(
                    progressHandler,
                    'saving',
                    `Đang lưu ${processed}/${items.length} câu`,
                    this.scalePercent(
                        this.safeRatio(processed, items.length),
                        BULK_AI_WEIGHT_GRADING * 100,
                        BULK_AI_WEIGHT_SAVING * 100
                    )
                );
            }),
            toArray()
        );
    }

    private markAiGradedTests(
        tests: ClassPlanActivityStudentTests[],
        context: EssayBulkRunContext,
        progressHandler: (progress: EssayBulkGradingProgress) => void
    ): Observable<EssayBulkGradingSummary> {
        const eligible = tests
            .map(test => Number(test.id))
            .filter(testId => {
                if (!Number.isFinite(testId) || this.isTestError(context, testId)) {
                    return false;
                }
                const expectedIds = context.expectedAnswerIds.get(testId) || new Set<number>();
                return [...expectedIds].every(answerId => context.successfulAnswerIds.has(answerId));
            });

        if (!eligible.length) {
            return of(this.finish(tests, context, progressHandler));
        }
        this.report(
            progressHandler,
            'completing',
            `Đang đánh dấu đang chấm 0/${eligible.length} bài`,
            this.scalePercent(
                0,
                (BULK_AI_WEIGHT_GRADING + BULK_AI_WEIGHT_SAVING) * 100,
                BULK_AI_WEIGHT_COMPLETING * 100
            )
        );
        let processed = 0;
        return from(eligible).pipe(
            concatMap(testId => this.studentTestsService.updateClassPlanActivityStudentTests(testId, { trangthai_cham: -1 }).pipe(
                map(() => ({ testId, success: true as const })),
                catchError(() => of({ testId, success: false as const }))
            )),
            tap(result => {
                processed++;
                if (result.success) {
                    context.completedTests++;
                } else {
                    this.markTestError(context, result.testId, 'Cập nhật trạng thái đang chấm (trangthai_cham = -1) thất bại');
                }
                this.report(
                    progressHandler,
                    'completing',
                    `Đang cập nhật trạng thái ${processed}/${eligible.length} bài`,
                    this.scalePercent(
                        this.safeRatio(processed, eligible.length),
                        (BULK_AI_WEIGHT_GRADING + BULK_AI_WEIGHT_SAVING) * 100,
                        BULK_AI_WEIGHT_COMPLETING * 100
                    )
                );
            }),
            toArray(),
            map(() => this.finish(tests, context, progressHandler))
        );
    }

    private finish(
        tests: ClassPlanActivityStudentTests[],
        context: EssayBulkRunContext,
        progressHandler: (progress: EssayBulkGradingProgress) => void
    ): EssayBulkGradingSummary {
        const failedTests = tests.length - context.completedTests;
        const summary = `Đã chấm thành công ${context.completedTests}/${tests.length} bài`;
        this.report(progressHandler, 'done', 'Đã hoàn tất chấm điểm AI tất cả', 100, summary);
        const failedReasons: Record<number, string> = {};
        context.errorReasons.forEach((reason, testId) => {
            failedReasons[testId] = reason;
        });
        return {
            totalTests: tests.length,
            completedTests: context.completedTests,
            failedTests,
            failedTestIds: [...context.errorReasons.keys()].sort((first, second) => first - second),
            failedReasons,
            savedAnswers: context.savedAnswers,
            failedAnswers: context.failedAnswers,
            blankTests: context.blankTests,
            summary
        };
    }

    private createStudentTestCondition(classId: number, week: number): ConditionOption {
        return {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: classId.toString() },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: week.toString(), orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_DAUGIO', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,questions_tuluan,trangthai_cham,status' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'id' }
            ],
            page: null
        };
    }

    private createAnswerMap(
        answers: ClassPlanActivityStudentAnswers[]
    ): Map<string, ClassPlanActivityStudentAnswers> {
        const map = new Map<string, ClassPlanActivityStudentAnswers>();
        answers.forEach(answer => {
            const testId = Number(answer.class_plan_activity_student_test_id);
            const questionId = Number(answer.course_plan_activity_tuluan_id);
            if (!Number.isFinite(testId) || !Number.isFinite(questionId)) {
                return;
            }
            const key = this.getAnswerKey(testId, questionId);
            if (map.has(key)) {
                // Dữ liệu trùng (cùng bài + cùng câu tự luận có nhiều bản ghi answer).
                // Hành vi khớp luồng chấm riêng (gradeSelectedWithAi): giữ BẢN GHI CUỐI làm đại diện
                // để chấm tất cả và chấm riêng cho cùng một kết quả — không chặn cả bài.
                // Vẫn cảnh báo để dọn dữ liệu trùng về sau.
                console.warn(
                    `[EssayBulkGrading] Phát hiện trùng bản ghi answer cho test ${testId}, question ${questionId} `
                    + `(answers ${map.get(key)?.id} → ${answer.id}); giữ bản ghi cuối ${answer.id}`
                );
            }
            map.set(key, answer);
        });
        return map;
    }

    private completePack(
        packIndex: number,
        context: EssayBulkRunContext,
        progressHandler: (progress: EssayBulkGradingProgress) => void
    ): void {
        context.completedPacks++;
        const nextPack = Math.min(packIndex + 2, context.totalPacks);
        const message = context.completedPacks < context.totalPacks
            ? `Đang chấm pack ${nextPack}/${context.totalPacks}`
            : `Đã chấm xong ${context.completedPacks}/${context.totalPacks} pack`;
        this.report(
            progressHandler,
            'grading',
            message,
            this.scalePercent(
                this.safeRatio(context.completedPacks, context.totalPacks),
                0,
                BULK_AI_WEIGHT_GRADING * 100
            )
        );
    }

    private report(
        handler: (progress: EssayBulkGradingProgress) => void,
        phase: EssayBulkGradingPhase,
        message: string,
        percent: number,
        summary: string = ''
    ): void {
        handler(this.createProgress(phase, message, percent, summary));
    }

    private createProgress(
        phase: EssayBulkGradingPhase,
        message: string,
        percent: number,
        summary: string = ''
    ): EssayBulkGradingProgress {
        return { phase, message, percent, summary };
    }

    private createContext(): EssayBulkRunContext {
        return {
            totalTests: 0,
            completedPacks: 0,
            totalPacks: 0,
            savedAnswers: 0,
            failedAnswers: 0,
            completedTests: 0,
            isRetry: false,
            errorReasons: new Map<number, string>(),
            blankTests: 0,
            expectedAnswerIds: new Map<number, Set<number>>(),
            successfulAnswerIds: new Set<number>()
        };
    }

    private chunkTests(tests: ClassPlanActivityStudentTests[]): ClassPlanActivityStudentTests[][] {
        const packs: ClassPlanActivityStudentTests[][] = [];
        let currentPack: ClassPlanActivityStudentTests[] = [];
        let currentBlocks = 0;
        for (const test of tests) {
            const blocks = this.getQuestionIds(test).length;
            if (
                currentPack.length
                && (currentPack.length >= BULK_AI_TEST_PACK_SIZE || currentBlocks + blocks > BULK_AI_MAX_PACK_BLOCKS)
            ) {
                packs.push(currentPack);
                currentPack = [];
                currentBlocks = 0;
            }
            currentPack.push(test);
            currentBlocks += blocks;
        }
        if (currentPack.length) {
            packs.push(currentPack);
        }
        return packs;
    }

    private getQuestionIds(test: ClassPlanActivityStudentTests): number[] {
        if (!Array.isArray(test.questions_tuluan)) {
            return [];
        }
        return [...new Set(test.questions_tuluan
            .map(id => Number(id))
            .filter(id => Number.isFinite(id) && id > 0))];
    }

    private getAnswerKey(testId: number, questionId: number): string {
        return `${testId}_${questionId}`;
    }

    private markTestError(context: EssayBulkRunContext, testId: number, reason: string): void {
        if (!context.errorReasons.has(testId)) {
            context.errorReasons.set(testId, reason);
        }
    }

    private isTestError(context: EssayBulkRunContext, testId: number): boolean {
        return context.errorReasons.has(testId);
    }

    private safeRatio(completed: number, total: number): number {
        return total ? completed / total : 1;
    }

    private scalePercent(ratio: number, startPercent: number, spanPercent: number): number {
        return Math.min(100, Math.max(0, Math.round(startPercent + ratio * spanPercent)));
    }

    private validateResponseKeys(
        responseItems: Record<string, unknown>[],
        promptItems: EssayBulkPromptItem[]
    ): void {
        const returnedKeys = new Set<string>();
        const duplicatedKeys = new Set<string>();
        responseItems.forEach(result => {
            const key = String(result['question_key'] ?? '');
            if (!key) {
                return;
            }
            if (returnedKeys.has(key)) {
                duplicatedKeys.add(key);
            }
            returnedKeys.add(key);
        });
        const expectedKeys = new Set(promptItems.map(item => item.key));
        const unexpectedKeys = [...returnedKeys].filter(key => !expectedKeys.has(key));
        const missingKeys = [...expectedKeys].filter(key => !returnedKeys.has(key));

        if (unexpectedKeys.length) {
            console.warn(`[EssayBulkGrading] AI trả về ${unexpectedKeys.length} key không thuộc kỳ vọng:`, unexpectedKeys);
        }
        if (duplicatedKeys.size) {
            console.warn(`[EssayBulkGrading] AI trả về trùng ${duplicatedKeys.size} key:`, [...duplicatedKeys]);
        }
        if (missingKeys.length) {
            console.warn(`[EssayBulkGrading] AI THIẾU ${missingKeys.length} key kỳ vọng:`, missingKeys);
        }
    }

    private percent(completed: number, total: number): number {
        return total ? Math.round(completed * 100 / total) : 100;
    }
}
