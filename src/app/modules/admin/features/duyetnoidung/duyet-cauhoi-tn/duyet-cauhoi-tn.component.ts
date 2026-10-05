import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { CourseQuestionCommentService } from './../../../../shared/services/course-question-comment.service';
import { Component, NgZone, OnDestroy, OnInit, SimpleChanges, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CourseTesterResultsDucService } from '@modules/shared/services/course-tester-results-duc.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { CHUAN_DAU_RA, ROLES } from '@modules/shared/utils/syscat';
import { concatMap, firstValueFrom, forkJoin, from, mergeMap, Observable, of, toArray } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from "primeng/tooltip";
import { map } from "rxjs/operators";
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';

@Component({
    selector: 'app-duyet-cauhoi-tn',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        MatChipsModule,
        TableModule,
        FormsModule,
        ReactiveFormsModule,
        TooltipModule,
        DialogModule,
        MatProgressBarModule
    ],
    templateUrl: './duyet-cauhoi-tn.component.html',
    styleUrls: ['./duyet-cauhoi-tn.component.css']
})
export class DuyetCauhoiTnComponent implements OnInit, OnDestroy {
    private helperService = inject(HelperService);
    private auth = inject(AuthService);
    private noitifi = inject(NotificationService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private configsService = inject(ConfigsService);
    private ovicDateTimeService = inject(OvicDateTimeService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private courseTesterResultsDucService = inject(CourseTesterResultsDucService);
    private courseQuestionCommentService = inject(CourseQuestionCommentService);
    private router = inject(Router);
    private ngZone = inject(NgZone);


    readonly courseSelected = input<ElnKhoaHoc>(undefined);

    readonly activity = input<CoursePlanActivities>(undefined);

    readonly hoidong = input<HoidongThamdinhMonhocThanhvien[]>(undefined);

    selectedCourse: ElnKhoaHoc;

    selectedActivity: CoursePlanActivities;

    list_cdr: CoursePlanActivities[];

    list_question: CourseQuestions[];

    // selectedCdr: CoursePlanActivities;

    CHUAN_DAU_RA = CHUAN_DAU_RA;

    object_chuandaura = {};

    kd_hoidong: boolean = false;

    kd_uyvien: boolean = false;

    userId: number;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    isManager: boolean = false;

    rejectRole: boolean = false;

    _chuanhanxet: any;

    _daduyet: number = null;

    list_check_status = [
        { id: 100, label: 'Tất cả' },
        { id: 0, label: 'Chờ duyệt' },
        { id: 1, label: 'Đã duyệt' },
        { id: -1, label: 'Chưa đạt' }
    ]

    displayModal: boolean = false;

    progressValue: number = 0;

    config_check_hoidong_by_chutich: boolean = false;

    isChutichHoidong: boolean = false;

    /* ── UI/UX Enhancement properties ── */
    isLoading: boolean = false;

    activeFilter: number = 100;

    stats: { total: number; approved: number; pending: number; rejected: number } = {
        total: 0, approved: 0, pending: 0, rejected: 0
    };

    constructor() {
        this.CHUAN_DAU_RA.forEach(f => {
            this.object_chuandaura[f.id] = f.label;
        })

        this.rejectRole = this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) ? true : false;
    }



    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseSelected']) {
            this.selectedCourse = this.courseSelected();
            const hoidong = this.hoidong();
            this.isChutichHoidong = hoidong && !!hoidong.find(f => f.user_id == this.auth.user.id && f.chutich === 1);

        }

        if (changes['activity']) {
            if (this.selectedCourse.id) {
                this.selectedActivity = this.activity();
                this.loadData();
                const hoidong = this.hoidong();
                this.isChutichHoidong = hoidong && !!hoidong.find(f => f.user_id == this.auth.user.id && f.chutich === 1);


            }
        }
    }

    ngOnInit(): void {
        this.userId = this.auth.user.id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
        const index = this.hoidong().findIndex(m => m.user_id === this.auth.user.id);
        if (index !== -1) {
            this.kd_hoidong = this.hoidong()[index].chutich === 1 ? true : false;
            this.kd_uyvien = this.hoidong()[index].chutich !== 1 ? true : false;
        }
        this.initDetailSync();
    }

    loadData() {
        this.isLoading = true;
        const condition_cdr: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString() },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                // { label: 'order_by', value: 'id' },
                // { label: 'order', value: 'ASC' },
            ],
            page: null
        }

        const activity = this.activity();
        if (activity.id !== 0) {
            condition_cdr.condition.push({ conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: activity.id.toString(), orWhere: 'and' })
        }

        this.noitifi.isProcessing(true);


        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_cdr).pipe(mergeMap(_plan_activity => {
            let _plan_activity_ids = [];
            _plan_activity.data.forEach(f => {
                _plan_activity_ids.push(f.id);
            })

            if (_plan_activity_ids.length) {
                const condition_question: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString() },
                        { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: [...new Set(_plan_activity_ids)].toString() },
                        { label: 'include_by', value: 'reference_id' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'cdr' }
                    ],
                    page: null
                }

                return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).pipe(mergeMap(_question => {
                    const question_ids = [];
                    const parent_question: CourseQuestions[] = [];

                    if (this.selectedCourse.av === 1) {

                        _question.data.forEach(f => {
                            question_ids.push(f.id);
                            if (f.group_id === 0) {
                                f.children = _question.data.filter(m => m.group_id === f.id);
                                parent_question.push(f);
                            }
                        })
                    } else {
                        _question.data.forEach(f => {
                            question_ids.push(f.id);
                            if (f.group_id === 0) {
                                f.children = _question.data.filter(m => m.group_id === f.id);
                                parent_question.push(f);
                            }
                        })
                    }

                    const referencedIds = new Set(
                        _question.data
                            .map(question => Number(question.question_root_id))
                            .filter(rootId => rootId > 0)
                    );
                    const currentParents = parent_question.filter(question => !referencedIds.has(Number(question.id)));
                    currentParents.forEach(parent => {
                        parent.children = (parent.children || []).filter(child => !referencedIds.has(Number(child.id)));
                    });
                    const countTargets = this.selectedCourse.av === 1
                        ? currentParents.reduce((result, parent) => result.concat(parent.children || []), [] as CourseQuestions[])
                        : currentParents;
                    this.selectedActivity['count_question'] = '('.concat(
                        countTargets.filter(question => question.status === 0).length.toString(),
                        ' + <span class="red">',
                        countTargets.filter(question => question.status === -1 || question.status === -2).length.toString(),
                        '</span> + <span class="blue">',
                        countTargets.filter(question => question.status === 1).length.toString(),
                        '</span> = ',
                        countTargets.length.toString(),
                        ')'
                    );

                    _plan_activity.data.forEach(f => {
                        f['cdr_cauhoi_label'] = '0';
                        if (f.cdr_cauhoi) {
                            const cauhoi_label = [];
                            let s = 0;
                            Object.keys(f.cdr_cauhoi).forEach(c => {
                                if (this.object_chuandaura[c]) {
                                    cauhoi_label.push(f.cdr_cauhoi[c]);
                                    s += f.cdr_cauhoi[c];
                                }
                            })
                            f['cdr_cauhoi_label'] = s.toString();
                        }
                        f['question_cdr'] = currentParents.filter(m => m.reference_id === f.id);
                    })

                    if (question_ids.length) {
                        const condition_result: ConditionOption = {
                            condition: [],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: [...new Set(question_ids)].toString() },
                                { label: 'include_by', value: 'question_id' }
                            ],
                            page: null
                        };
                        const condition_time_for_test: ConditionOption = {
                            condition: [
                                { conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'TIME_FOR_TEST' }
                            ],
                            set: [{ label: 'limit', value: '1' }],
                            page: '1'
                        };
                        const condition_getConfigChutich: ConditionOption = {
                            condition: [
                                { conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'CHECK_DUYET_HOIDONG_BY_CHUTICH' }
                            ],
                            set: [{ label: 'limit', value: '1' }],
                            page: '1'
                        };
                        const condition_comment: ConditionOption = {
                            condition: [],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: [...new Set(question_ids)].toString() },
                                { label: 'include_by', value: 'course_question_id' }
                            ],
                            page: null
                        };

                        return forkJoin([
                            this.courseTesterResultsDucService.getCourseTesterResultsDucByPageNew(condition_result),
                            this.configsService.getConfigsByPageNew(condition_time_for_test).pipe(map(m => m.data[0])),
                            this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_comment),
                            this.configsService.getConfigsByPageNew(condition_getConfigChutich).pipe(map(m => m.data[0])),
                        ]).pipe(mergeMap(([_result, _timeConfig, _comment, _configChutich]) => {
                            this.config_check_hoidong_by_chutich = !!_configChutich?.params?.['check'];
                            const timeConfig = Object.assign({ MONKHAC: {}, TIENGANH: {} }, _timeConfig?.params || {});
                            let question_list = [];
                            _plan_activity.data.forEach(f => {
                                if (f.question_cdr && f.question_cdr.length) {
                                    question_list = question_list.concat(f.question_cdr);
                                    f.question_cdr.forEach((q, key) => {
                                        q['index_question'] = key + 1;
                                        q['in_cdr'] = f.kyhieu;
                                        q['hoidong_comment'] = {};
                                        q['_chuanhanxet'] = 1;
                                        q['_daduyet'] = q.status;
                                        this.applyTestSummary(q, _result.data || [], timeConfig);
                                        this.hoidong().forEach(h => {
                                            q['hoidong_comment'][h.user_id] = false;
                                            const index = _comment.data.findIndex(m => m.course_question_id === q.id && m.user_id === h.user_id);
                                            if (index !== -1) {
                                                q['hoidong_comment'][h.user_id] = true;
                                                if (h.user_id === this.auth.user.id) {
                                                    q['_chuanhanxet'] = 0;
                                                }
                                            }
                                        });
                                    });
                                }
                            });
                            this.list_question = question_list;
                            return of(_plan_activity);
                        }));
                    }
                    return of(_plan_activity);
                }))
            }
            return of(_plan_activity);
        })).subscribe({
            next: (_activity) => {
                this.noitifi.isProcessing(false);
                this.isLoading = false;
                this.list_cdr = _activity.data.sort((a, b) => a.kyhieu.localeCompare(b.kyhieu));
                this.computeStats();
            },
            error: (e) => {
                this.noitifi.isProcessing(false);
                this.isLoading = false;
                this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    private applyTestSummary(question: CourseQuestions, results: any[], timeConfig: any): void {
        const targets = this.selectedCourse.av === 1 && question.children?.length
            ? question.children
            : [question];
        const thresholdMap = this.selectedCourse.av === 1
            ? timeConfig.TIENGANH || {}
            : timeConfig.MONKHAC || {};
        const answers = results.filter(result => targets.some(target => target.id === result.question_id));

        question.count_teacher = answers.length;
        question.count_answer_true = answers.filter(result => result.result === 1).length;
        question.count_answer_false = answers.filter(result => result.result === 0).length;
        question.count_answer_later = answers.filter(result => {
            const target = targets.find(item => item.id === result.question_id) || question;
            const threshold = Number(thresholdMap[target.cdr ?? question.cdr]);
            return threshold > 0 && result.time_to_answer > threshold;
        }).length;
    }

    private openQuestionDetail(question: CourseQuestions): void {
        const currentUrlTree = this.router.parseUrl(this.router.url);
        const backCode = currentUrlTree.queryParams['code'] || null;
        const url = this.router.serializeUrl(this.router.createUrlTree([
            '/admin/hoi-dong/duyetnoidung/duyet-cauhoi-tn-detail',
            question.id
        ], {
            queryParams: {
                courseId: this.courseSelected()?.id,
                activityId: this.selectedActivity?.id,
                cdrId: question.reference_id,
                code: backCode
            }
        }));
        window.open(url, '_blank', 'noopener,noreferrer');
    }











    async chooseQuestion(question: CourseQuestions, index_question: number): Promise<void> {
        this.noitifi.isProcessing(true);
        try {
            const latestQuestion = await firstValueFrom(this.courseQuestionsService.resolveLatestQuestion(question));
            this.noitifi.isProcessing(false);
            if (!latestQuestion || latestQuestion.status === -3) {
                this.loadData();
                this.noitifi.toastInfo('Câu hỏi không còn hiệu lực');
                return;
            }
            if (latestQuestion.status === 1 && !this.isManager) {
                this.noitifi.toastWarning('Câu hỏi đã được duyệt, không có quyền mở');
                return;
            }
            this.openQuestionDetail(latestQuestion);
        } catch {
            this.noitifi.isProcessing(false);
            this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
        }
    }

    private getQuestionGroup(question: CourseQuestions): CourseQuestions[] {
        if (this.selectedCourse.av !== 1) {
            return [question];
        }
        return [question, ...(question.children || [])]
            .filter(item => item.status !== -3);
    }

    async reDoAction(event, question: CourseQuestions, status: number): Promise<void> {
        event.preventDefault();
        event.stopPropagation();
        this.noitifi.isProcessing(true);
        try {
            const latestQuestion = await firstValueFrom(this.courseQuestionsService.resolveLatestQuestion(question));
            if (!latestQuestion || latestQuestion.status === -3) {
                this.noitifi.isProcessing(false);
                this.loadData();
                this.noitifi.toastInfo('Câu hỏi không còn hiệu lực');
                return;
            }
            if (latestQuestion.id !== question.id) {
                this.noitifi.isProcessing(false);
                this.openQuestionDetail(latestQuestion);
                this.loadData();
                this.noitifi.toastInfo('Đã chuyển đến phiên bản câu hỏi mới nhất');
                return;
            }

            const targets = this.getQuestionGroup(question);
            if (status === 1 && targets.some(item => item.old_status !== 1)) {
                this.noitifi.isProcessing(false);
                this.noitifi.toastWarning('Có nội dung trong nhóm chưa từng được duyệt, không thể khóa');
                return;
            }
            const date = await firstValueFrom(this.ovicDateTimeService.getCurrentDateTime());
            await firstValueFrom(from(targets).pipe(
                concatMap(item => this.courseQuestionsService.updateCourseQuestions(item.id, {
                    old_status: status === 0 ? item.status : item.old_status,
                    status,
                    accept_edit_id: this.userId,
                    accept_edit_at: this.helperService.stringToDateSql(date.toString())
                })),
                toArray()
            ));
            this.noitifi.isProcessing(false);
            this.loadData();
            this.noitifi.toastSuccess('Cập nhật thành công');
        } catch {
            this.noitifi.isProcessing(false);
            this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
        }
    }

    checkValue(event, key: string) {
        if (key !== '_chuanhanxet') {
            return;
        }

        this._chuanhanxet = event.checked === true ? 1 : null;
    }

    onSelectStatus(event) {
        if (event === 100) {
            this._daduyet = null
        } else {
            this._daduyet = event;
        }
    }

    getFilteredQuestions(questions: CourseQuestions[] = []): CourseQuestions[] {
        return questions.filter(question => {
            if (this._chuanhanxet === 1 && question['_chuanhanxet'] !== 1) {
                return false;
            }
            if (this._daduyet === null || this._daduyet === undefined) {
                return true;
            }
            const targets = this.selectedCourse.av === 1 ? question.children || [] : [question];
            if (this._daduyet === -1) {
                return targets.some(item => item.status === -1 || item.status === -2);
            }
            return targets.some(item => item.status === this._daduyet);
        });
    }

    /* ── UI/UX Enhancement methods ── */
    computeStats() {
        let total = 0, approved = 0, pending = 0, rejected = 0;
        if (this.list_cdr) {
            this.list_cdr.forEach(cdr => {
                if (cdr['question_cdr']) {
                    cdr['question_cdr'].forEach(q => {
                        const targets = this.selectedCourse.av === 1 ? q.children || [] : [q];
                        targets.forEach(item => {
                            total++;
                            if (item.status === 1) approved++;
                            else if (item.status === 0) pending++;
                            else if (item.status === -1 || item.status === -2) rejected++;
                        });
                    });
                }
            });
        }
        this.stats = { total, approved, pending, rejected };
    }

    onFilterChipClick(filterId: number) {
        this.activeFilter = filterId;
        this.onSelectStatus(filterId);
    }

    toggleChuaNhanXet() {
        this._chuanhanxet = this._chuanhanxet === 1 ? null : 1;
    }

    private getFreshQuestions(): Observable<CourseQuestions[]> {
        const condition: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString() },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: [...new Set(this.list_cdr.map(m => m.id))].toString() },
                { label: 'include_by', value: 'reference_id' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'cdr' }
            ],
            page: null
        };
        return this.courseQuestionsService.getCourseQuestionsByPageNew(condition).pipe(map(result => result.data || []));
    }

    private getFreshGroups(questions: CourseQuestions[]): CourseQuestions[][] {
        const referencedIds = new Set(
            questions
                .map(question => Number(question.question_root_id))
                .filter(rootId => rootId > 0)
        );
        const currentQuestions = questions.filter(question => !referencedIds.has(Number(question.id)));
        return currentQuestions
            .filter(question => question.group_id === 0)
            .map(parent => this.selectedCourse.av === 1
                ? [parent, ...currentQuestions.filter(child => child.group_id === parent.id)]
                : [parent]);
    }

    btnUpdateLockQuestion(type: 1 | 0): void {
        this.noitifi.isProcessing(true);
        this.noitifi.loadingAnimationV2({ process: { percent: 0 } });
        forkJoin([
            this.ovicDateTimeService.getCurrentDateTime(),
            this.getFreshQuestions()
        ]).pipe(
            mergeMap(([date, questions]) => {
                const groups = this.getFreshGroups(questions)
                    .filter(group => group.some(item => item.status >= 0 && item.status !== type))
                    .filter(group => type === 0 || group.every(item => item.old_status === 1));
                const targets = groups.flat().filter(item => item.status >= 0 && item.status !== type);
                if (!targets.length) {
                    return of([]);
                }
                return from(targets).pipe(
                    concatMap((item, index) => this.courseQuestionsService.updateCourseQuestions(item.id, {
                        old_status: type === 0 ? item.status : item.old_status,
                        status: type,
                        accept_edit_id: this.auth.user.id,
                        accept_edit_at: this.helperService.stringToDateSql(date.toString())
                    }).pipe(map(result => {
                        this.noitifi.loadingAnimationV2({ process: { percent: (index + 1) / targets.length * 100 } });
                        return result;
                    }))),
                    toArray()
                );
            })
        ).subscribe({
            next: result => {
                this.noitifi.disableLoadingAnimationV2();
                this.noitifi.isProcessing(false);
                if (!result.length) {
                    this.noitifi.toastWarning(type === 1
                        ? 'Không có nhóm câu hỏi đủ điều kiện khóa'
                        : 'Không có nhóm câu hỏi đang bị khóa');
                    return;
                }
                this.loadData();
                this.noitifi.toastSuccess('Cập nhật thành công');
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.disableLoadingAnimationV2();
                this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
            }
        });
    }


    approvedAll(): void {
        this.noitifi.confirm('Thầy/Cô có chắc chắn muốn duyệt tất cả không?', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(answer => {
            if (answer.name !== 'yes') {
                return;
            }
            this.displayModal = true;
            this.progressValue = 0;
            forkJoin([
                this.ovicDateTimeService.getCurrentDateTime(),
                this.getFreshQuestions()
            ]).pipe(
                mergeMap(([date, questions]) => {
                    const targets = this.getFreshGroups(questions)
                        .flat()
                        .filter(question => question.status !== 1 && question.status !== -3);
                    if (!targets.length) {
                        return of([]);
                    }
                    return from(targets).pipe(
                        concatMap((question, index) => this.courseQuestionsService.updateCourseQuestions(question.id, {
                            old_status: question.status,
                            status: 1,
                            approved_by: this.userId,
                            approved_at: this.helperService.stringToDateSql(date.toString())
                        }).pipe(map(result => {
                            this.progressValue = (index + 1) / targets.length * 100;
                            return result;
                        }))),
                        toArray()
                    );
                })
            ).subscribe({
                next: result => {
                    this.displayModal = false;
                    if (!result.length) {
                        this.noitifi.toastInfo('Không có câu hỏi chờ duyệt');
                        return;
                    }
                    this.loadData();
                    this.noitifi.toastSuccess('Cập nhật thành công');
                },
                error: () => {
                    this.displayModal = false;
                    this.noitifi.toastError('Cập nhật thất bại, vui lòng thử lại');
                }
            });
        });
    }


    // ── BroadcastChannel / localStorage sync ─────────────
    private _syncListener?: (e: Event) => void;
    private _detailSyncChannel?: BroadcastChannel;

    initDetailSync() {
        const shouldReload = (payload: any) => {
            return payload?.type === 'QUESTION_REVIEW_UPDATED'
                && payload.courseId === this.courseSelected()?.id?.toString()
                && payload.activityId === this.selectedActivity?.id?.toString();
        };

        try {
            this._detailSyncChannel = new BroadcastChannel('duyet-cauhoi-tn-detail-sync');
            this._detailSyncChannel.onmessage = (event: MessageEvent) => {
                if (shouldReload(event.data)) {
                    this.ngZone.run(() => this.loadData());
                }
            };
        } catch { /* BroadcastChannel fallback uses storage event */ }

        this._syncListener = (e: Event) => {
            const storageEvent = e as StorageEvent;
            if (storageEvent.key === 'duyet-cauhoi-tn-detail-updated' && storageEvent.newValue) {
                try {
                    const payload = JSON.parse(storageEvent.newValue);
                    if (shouldReload(payload)) {
                        this.ngZone.run(() => this.loadData());
                    }
                } catch { /* ignore parse errors */ }
            }
        };
        window.addEventListener('storage', this._syncListener);
    }

    ngOnDestroy(): void {
        if (this._syncListener) {
            window.removeEventListener('storage', this._syncListener);
        }
        if (this._detailSyncChannel) {
            this._detailSyncChannel.close();
        }
    }
}
