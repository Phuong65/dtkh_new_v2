import { APP_CONFIGS, key_server } from '@env';
import { CourseQuestionsService } from '@shared/services/course-questions.service';
import { CoursePlanActivitiesService } from '@shared/services/course-plan-activities.service';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { CHUAN_DAU_RA, LARGE_MODAL_OPTIONS, ROUTERS } from '@modules/shared/utils/syscat';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { catchError, concatMap, forkJoin, from, map, mergeMap, Observable, of, throwError, toArray } from 'rxjs';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { SharedModule } from '@modules/shared/shared.module';
import { DonVi } from '@modules/shared/models/don-vi';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { TableModule } from 'primeng/table';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { DragDropModule } from "@angular/cdk/drag-drop";
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { NgbModal, NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CheckboxModule } from 'primeng/checkbox';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import {
    DeleteQuestionsResult,
    XoaCauHoiTheoBaiCdrComponent
} from '../xoa-cau-hoi-theo-bai-cdr/xoa-cau-hoi-theo-bai-cdr.component';

interface CoursePlanActivityTracNghiem extends CoursePlanActivities {
    question_inserted?: QuestionInserted;
}

interface DeleteQuestionsPreview extends DeleteQuestionsResult {
    ids: number[];
}

interface QuestionInserted {
    private: { [T: number]: number };
    public: { [T: number]: number };
    approved: { [T: number]: number };
    pending: { [T: number]: number };
}

const DELETE_QUESTIONS_BATCH_SIZE = 100;

@Component({
    selector: 'app-cauhoi-tracnghiem-manager',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        PaginatorModule,
        MatListModule,
        MatSelectModule,
        TableModule,
        DragDropModule,
        NgbModalModule,
        CheckboxModule,
        NgbTooltipModule
    ],
    templateUrl: './cauhoi-tracnghiem-manager.component.html',
    styleUrls: ['./cauhoi-tracnghiem-manager.component.css']
})
export class CauhoiTracnghiemManagerComponent implements OnInit {
    @ViewChild('paginator', { static: true }) paginator: Paginator;

    @ViewChild("autoCdrQuestion") autoCdrQuestion: ElementRef;

    dmKhoahoc: ElnKhoaHoc[];

    canAdd: boolean = false;

    canUpdate: boolean = false;

    canDelete: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerKhaothi: boolean = false;

    routerLanhdaobomon: boolean = false;

    closeLeft: boolean = false;

    searchCourse: string;

    userId: number;

    donviId: number;

    limitCourse: number = 20;

    user_profile: ElngUserProfile;

    categoryFilter: number;

    my_course: boolean = false;

    totalCourse: number = 0;

    pageCourseIndex: number = 1;

    list_donvi_chuyenmon: DonVi[];

    courseSelected: ElnKhoaHoc;

    chuan_dau_ra = CHUAN_DAU_RA;

    list_plan: CoursePlanActivityTracNghiem[];

    label_week = "Bài";

    show_button_create_week_100: boolean = false;

    cdr_cauhoi_kthp = {};

    cdr_cauhoi_kthp_require: any = {};

    selectLesson: CoursePlanActivityTracNghiem;

    isUpdate_cdr_exam: boolean = false;

    checkboxCdrCauhoi: boolean = false;

    keyServer = key_server;

    unLimitQuestion: boolean = false;

    courseQuestions: CourseQuestions[] = [];

    constructor(
        private elnKhoaHocService: ElnKhoaHocService,
        private auth: AuthService,
        private noitifi: NotificationService,
        private elngUserProfileService: ElngUserProfileService,
        private donViService: DonViService,
        private router: Router,
        private helperService: HelperService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private courseQuestionsService: CourseQuestionsService,
        private modalService: NgbModal,
        private cdr: ChangeDetectorRef
    ) {
        const url = this.router.url.substring(7).split('?')[0];

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin);

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao);

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa);

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien);

        this.routerKhaothi = this.auth.hasRouter(ROUTERS.khaothi);

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon);

        this.canAdd = this.auth.userCanAdd(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.canUpdate = this.auth.userCanEdit(url);

        this.userId = this.auth.user.id;

        this.donviId = this.auth.user.donvi_id;
    }

    ngOnInit(): void {

        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const setting = config.find(m => m.config_key === 'SETTING')['params'];

        this.unLimitQuestion =  setting && setting['form_question'] ? setting['form_question']['unlimit'] : false;

        this.initData();
    }

    initData() {
        this.noitifi.isProcessing(true);

        const condition_profile: ConditionOption = {
            condition: [
                {
                    conditionName: 'user_id',
                    condition: OvicQueryCondition.equal,
                    value: this.userId.toString(),
                },
            ],
            set: [],
            page: null,
        };

        const condition_donvi: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.donvi_id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.greaterThan,
                    value: '0',
                    orWhere: 'and',
                },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'title' }
            ],

            page: null,
        };

        forkJoin([
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_profile),
            this.donViService.getDonviByPageNew(condition_donvi),
        ]).subscribe({
            next: ([_userProfile, _donvi]) => {

                this.list_donvi_chuyenmon = _donvi.data;

                if (_userProfile.recordsFiltered) {
                    this.user_profile = _userProfile.data[0];
                    if (this.routerLanhdaokhoa)
                        this.categoryFilter = this.user_profile.donvi_chuyenmon_id;
                }

                this.noitifi.isProcessing(false);

                this.loadPageData_course(this.pageCourseIndex);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
            },
        });
    }

    loadPageData_course(page: number) {
        this.dmKhoahoc = [];
        const condition_course: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and', },
            ],
            set: [
                { label: 'orderby', value: 'title' },
                { label: 'limit', value: this.limitCourse.toString() },
                { label: 'with', value: 'creatorPlan' }
            ],
            page: page.toString()
        }

        if (this.routerLanhdaokhoa && (!this.user_profile || !this.user_profile.donvi_chuyenmon_id)) {
            this.noitifi.isProcessing(false)
            return this.noitifi.toastInfo("Thầy/Cô chưa được phân vào khoa trong hệ thống, vui lòng liên hệ phòng đào tạo");
        }

        if (this.categoryFilter || this.routerLanhdaokhoa) {
            condition_course.condition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.categoryFilter.toString(), orWhere: 'and' });
        }

        if (this.routerLanhdaobomon) {
            if (this.user_profile.bomon_id) {
                condition_course.condition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.user_profile.bomon_id.toString(), orWhere: 'and' });
            } else {
                this.noitifi.isProcessing(false)
                return this.noitifi.toastInfo("Thầy/Cô chưa được phân vào bộ môn trong hệ thống, vui lòng liên hệ phòng đào tạo");
            }
        }

        if (this.routerGiangvien) {
            this.my_course = true;
        }

        if (this.my_course) {
            condition_course.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.user_profile.user_id.toString(), orWhere: 'and' });
        }

        if (this.searchCourse) {
            condition_course.condition.push({ conditionName: 'title', condition: OvicQueryCondition.like, value: '%' + this.searchCourse.toString() + '%', orWhere: 'and' });
        }

        this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course).subscribe({
            next: (_course) => {
                _course.data.forEach(f => {
                    f['creator_name'] = f.creatorPlan ? f.creatorPlan.display_name : 'Chưa có giảng viên';

                    f['info_'] = '';

                    if (f.params) {
                        if (!f.params.exam_type) {
                            const index = EXAMFORMAT.findIndex((m) => m.key === f.params.exam_format);
                            if (index !== -1) {
                                f['hinhthucthi'] = EXAMFORMAT[index].label;
                            }
                        } else {
                            const index = EXAMFORMAT.findIndex((m) => m.id === f.params.exam_type);
                            if (index !== -1) {
                                f['hinhthucthi'] = EXAMFORMAT[index].label;
                            }
                        }

                        const sotinchi = f.params.sotinchi ? f.params.sotinchi : 0;

                        const sotinchi_th = f.params['sotinchi_th'] ? f.params['sotinchi_th'] : 0;

                        f['info_'] = ' - TC: ' + sotinchi.toString().concat('-', sotinchi_th.toString(), ' - ', f['hinhthucthi']);
                    }
                })

                this.dmKhoahoc = _course.data;

                this.totalCourse = _course.recordsFiltered;

                this.noitifi.isProcessing(false);
                if (!(this.cdr as any).destroyed) {
                    this.cdr.detectChanges();
                }
            },

            error: () => {
                this.noitifi.isProcessing(false);
            }
        })

    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    onSearchByTitle() {
        if (!this.paginator.empty()) {
            this.paginator.changePage(0);
        } else {
            this.loadPageData_course(1);
        }
    }

    changePage(event) {
        this.pageCourseIndex = event.page + 1;
        this.loadPageData_course(event.page + 1);
    }

    onChangeFilterChuyenmon(event) {
        if (event) {
            this.categoryFilter = event.id;
        } else {
            this.categoryFilter = null;
        }
        this.onSearchByTitle();
    }

    onSelectCourse(event: MatSelectionListChange) {
        this.courseSelected = event.options[0].value;
        this.loadCdrAndQuestion();
    }

    loadCdrAndQuestion() {
        this.noitifi.isProcessing(true);
        const condition_cdr: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '1000', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'PLAN,ACTIVITY_CDR' },
                { label: 'include_by', value: 'type' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'select', value: 'type,id,course_id,status,week,kyhieu,parent_id,cdr_cauhoi,ordering,params' }
            ],
            page: null
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,status,old_status,week,reference_id,private,group_id,cdr' }
            ],
            page: null
        }

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_cdr),
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
        ]).subscribe({
            next: ([_plan_activity, _question]) => {
                const expandedPlanIds = new Set((this.list_plan || []).filter(m => m['isExpanded']).map(m => m.id));
                const plan_parent = _plan_activity.data.filter(m => m.parent_id === 0);

                this.courseQuestions = _question.data;

                const index_week = plan_parent.findIndex(m => m.week === 100);

                if (index_week !== -1) {
                    this.show_button_create_week_100 = false;
                } else {
                    this.show_button_create_week_100 = true;
                }

                plan_parent.forEach(f => {
                    const child = _plan_activity.data.filter(m => m.parent_id === f.id);
                    f['isExpanded'] = expandedPlanIds.has(f.id);
                    child.forEach(c => {
                        if (c.params && c.params.cdr && c.params.cdr.cdr_info) {
                            const index = c.params.cdr.cdr_info.findIndex(m => m.id === 'level_require');
                            if (index !== -1) {
                                c['cdr_name'] = c.params.cdr.cdr_info[index].value;
                                c['cdr_level'] = c.params.cdr.cdr_info[index].key;
                            }
                        }

                        const question_plan_child = _question.data.filter(m => m.reference_id === c.id && m.group_id === 0);

                        c['question_inserted'] = {
                            private: {},
                            public: {},
                            approved: {},
                            pending: {},
                        }

                        c['question_inserted_total'] = question_plan_child.length;

                        if (this.courseSelected.av === 1) {
                            let s_child = 0;
                            question_plan_child.forEach(p => {
                                s_child = s_child + _question.data.filter(m => m.group_id === p.id).length;
                            })
                            c['question_inserted_total'] = s_child;
                        }

                        this.chuan_dau_ra.forEach(cdr => {
                            const question_cdr = question_plan_child.filter(m => m.cdr === cdr.id);
                            if (question_cdr.length) {
                                if (this.courseSelected.av === 1) {
                                    c['question_inserted']['private'][cdr.id] = this.getQuestionAvKey(question_cdr.filter(m => m.private === 1), _question.data);
                                    c['question_inserted']['public'][cdr.id] = this.getQuestionAvKey(question_cdr.filter(m => m.private === 0), _question.data);
                                    c['question_inserted']['approved'][cdr.id] = this.getQuestionAvKey(question_cdr.filter(m => m.status === 1), _question.data);
                                    c['question_inserted']['pending'][cdr.id] = this.getQuestionAvKey(question_cdr.filter(m => m.status !== 1), _question.data);
                                } else {
                                    c['question_inserted']['private'][cdr.id] = question_cdr.filter(m => m.private === 1).length;
                                    c['question_inserted']['public'][cdr.id] = question_cdr.filter(m => m.private === 0).length;
                                    c['question_inserted']['approved'][cdr.id] = question_cdr.filter(m => m.status === 1).length;
                                    c['question_inserted']['pending'][cdr.id] = question_cdr.filter(m => m.status !== 1).length;
                                }
                            }
                        })

                        c['stt'] = c.kyhieu.replace(/\D/g, '');
                    })

                    f.children = this.helperService.sort(child, 'stt');
                    f.children.forEach(c => {
                        c['deleteQuestionPreview'] = this.buildDeleteQuestionsPreview([c.id], _question.data);
                    });
                    f['deleteQuestionPreview'] = this.buildDeleteQuestionsPreview(f.children.map(c => c.id), _question.data);
                })
                this.list_plan = plan_parent;
                this.noitifi.isProcessing(false);
                if (!(this.cdr as any).destroyed) {
                    this.cdr.detectChanges();
                }
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
            }
        })
    }

    getQuestionAvKey(data: CourseQuestions[], question: CourseQuestions[]) {
        let result = 0;
        data.forEach(f => {
            result = result + question.filter(m => m.group_id === f.id).length;
        })
        return result;
    }

    buildDeleteQuestionsPreview(referenceIds: number[], questions: CourseQuestions[] = this.courseQuestions): DeleteQuestionsPreview {
        const referenceIdSet = new Set(referenceIds.map(id => Number(id)));
        const parentQuestions = questions.filter(question =>
            Number(question.group_id) === 0 &&
            referenceIdSet.has(Number(question.reference_id)) &&
            Number.isFinite(Number(question.id))
        );
        const deletableParents = parentQuestions.filter(question =>
            Number(question.status) !== 1 && Number(question.old_status) !== 1
        );
        const protectedParents = parentQuestions.filter(question =>
            Number(question.status) === 1 || Number(question.old_status) === 1
        );
        const deletableParentIds = new Set(deletableParents.map(question => Number(question.id)));
        const protectedParentIds = new Set(protectedParents.map(question => Number(question.id)));
        const deletableChildren = questions.filter(question =>
            deletableParentIds.has(Number(question.group_id)) && Number.isFinite(Number(question.id))
        );
        const protectedChildren = questions.filter(question =>
            protectedParentIds.has(Number(question.group_id)) && Number.isFinite(Number(question.id))
        );
        const ids = Array.from(new Set([
            ...deletableChildren.map(question => Number(question.id)),
            ...deletableParents.map(question => Number(question.id))
        ]));

        return {
            ids,
            deletedGroupCount: deletableParents.length,
            deletedRecordCount: ids.length,
            protectedGroupCount: protectedParents.length,
            protectedRecordCount: protectedParents.length + protectedChildren.length
        };
    }

    openDeleteQuestionsByLesson(event: Event, plan: CoursePlanActivityTracNghiem): void {
        event.stopPropagation();
        const referenceIds = (plan.children || []).map(child => child.id);
        const preview = this.buildDeleteQuestionsPreview(referenceIds);
        const targetLabel = plan.week === 100
            ? 'Câu hỏi thi kết thúc học phần'
            : `${this.label_week} ${plan.week}`;

        this.openDeleteQuestionsModal('bài', targetLabel, preview);
    }

    openDeleteQuestionsByCdr(event: Event, cdr: CoursePlanActivityTracNghiem): void {
        event.stopPropagation();
        const preview = this.buildDeleteQuestionsPreview([cdr.id]);
        const targetLabel = cdr['cdr_name']
            ? `${cdr.kyhieu} - ${cdr['cdr_name']}`
            : cdr.kyhieu;

        this.openDeleteQuestionsModal('CDR', targetLabel, preview);
    }

    private openDeleteQuestionsModal(scopeLabel: string, targetLabel: string, preview: DeleteQuestionsPreview): void {
        if (!this.canDelete) {
            return;
        }

        if (!preview.deletedGroupCount) {
            this.noitifi.toastInfo('Không có nhóm câu hỏi chưa duyệt đủ điều kiện xóa');
            return;
        }

        const modal = this.modalService.open(XoaCauHoiTheoBaiCdrComponent, {
            backdrop: 'static',
            centered: true,
            keyboard: false,
            size: 'lg',
            windowClass: 'modal-custom modal-xoa-cau-hoi-theo-bai-cdr'
           
        });
        const component = modal.componentInstance as XoaCauHoiTheoBaiCdrComponent;

        component.courseTitle = `${this.courseSelected.title} (${this.courseSelected.maso})`;
        component.scopeLabel = scopeLabel;
        component.targetLabel = targetLabel;
        component.deletableGroupCount = preview.deletedGroupCount;
        component.deletableRecordCount = preview.deletedRecordCount;
        component.protectedGroupCount = preview.protectedGroupCount;
        component.protectedRecordCount = preview.protectedRecordCount;
        component.confirmAction = () => this.deleteQuestionsInBatches(preview);

        modal.result.then((result: DeleteQuestionsResult) => {
            this.noitifi.toastSuccess(`Đã xóa ${result.deletedGroupCount} nhóm, ${result.deletedRecordCount} bản ghi câu hỏi`);
            if (result.protectedGroupCount) {
                this.noitifi.toastInfo(`Đã giữ lại ${result.protectedGroupCount} nhóm đang hoặc từng được duyệt`);
            }
            this.loadCdrAndQuestion();
        }, () => undefined);
    }

    private deleteQuestionsInBatches(preview: DeleteQuestionsPreview): Observable<DeleteQuestionsResult> {
        if (!preview.ids.length) {
            return throwError(() => new Error('Không có câu hỏi đủ điều kiện xóa'));
        }

        const batches: number[][] = [];
        for (let index = 0; index < preview.ids.length; index += DELETE_QUESTIONS_BATCH_SIZE) {
            batches.push(preview.ids.slice(index, index + DELETE_QUESTIONS_BATCH_SIZE));
        }

        let completedBatchCount = 0;

        return from(batches).pipe(
            concatMap(ids => this.courseQuestionsService.deleteCourseQuestions(ids.toString()).pipe(
                map(result => {
                    completedBatchCount++;
                    return result;
                })
            )),
            toArray(),
            map(() => ({
                deletedGroupCount: preview.deletedGroupCount,
                deletedRecordCount: preview.deletedRecordCount,
                protectedGroupCount: preview.protectedGroupCount,
                protectedRecordCount: preview.protectedRecordCount
            })),
            catchError(error => {
                if (completedBatchCount > 0) {
                    this.loadCdrAndQuestion();
                }
                return throwError(() => error);
            })
        );
    }

    toggleLesson(plan: CoursePlanActivities) {
        plan['isExpanded'] = !plan['isExpanded'];
    }

    getTotalCdrQuestionLimit(plan: CoursePlanActivities) {
        let s = 0;
        if (plan.cdr_cauhoi && Object.keys(plan.cdr_cauhoi).length) {
            Object.keys(plan.cdr_cauhoi).forEach(f => {
                if (!isNaN(parseInt(f))) {
                    s = s + plan.cdr_cauhoi[f];
                }
            })
        }
        return s;
    }

    getTotalPlanQuestionLimit(plan: CoursePlanActivities) {
        let s = 0;
        plan.children.forEach(f => {
            s = s + this.getTotalCdrQuestionLimit(f);
        })
        return s;
    }

    getTotalQuestionInsetedCdr(child: CoursePlanActivityTracNghiem, cdr_id: number) {
        return child.question_inserted.private[cdr_id] + child.question_inserted.public[cdr_id];
    }

    getTotalQuestionByKey(child: CoursePlanActivityTracNghiem, key: string) {
        let result = 0;
        if (child['question_inserted']) {
            const sum = Number(Object.values(child['question_inserted'][key]).reduce((acc: number, val: number) => acc + val, 0));
            result = sum;
        }
        return result;
    }

    getTotalQuestionPlan(plan: CoursePlanActivityTracNghiem) {
        return plan.children.reduce((acc, item) => acc + (item['question_inserted_total'] || 0), 0);
    }

    getTotalQuestionPlanByKey(plan: CoursePlanActivityTracNghiem, key) {
        let result = 0;
        plan.children.forEach(f => {
            result = result + this.getTotalQuestionByKey(f, key);
        })
        return result;
    }

    addQuestionLastExam(lesson?: CoursePlanActivityTracNghiem) {
        this.selectLesson = null;

        this.isUpdate_cdr_exam = false;

        this.checkboxCdrCauhoi = false;

        this.cdr_cauhoi_kthp = {};

        this.cdr_cauhoi_kthp_require = {};
        if (lesson) {
            this.selectLesson = lesson;
            this.isUpdate_cdr_exam = true;
        }
        this.modalService.open(this.autoCdrQuestion, LARGE_MODAL_OPTIONS);
    }

    closeForm(d) {
        d(true);
    }

    returnOrtherLvlCdr(name: string) {
        const total_less = [];

        const total_greater = [];

        console.log(this.courseSelected);

        this.chuan_dau_ra.forEach(cdr => {
            if (!cdr.disabled) {
                if (cdr.id < this.courseSelected.params.cdr) {
                    total_less.push("<strong>" + cdr.label + "</strong>");
                } else if (cdr.id > this.courseSelected.params.cdr) {
                    total_greater.push("<strong>" + cdr.label + "</strong>");
                }
            }
        })

        if (name === "less") {
            return total_less.join(" + ");
        }

        return total_greater.join(" + ");
    }

    changeCdrCauhoi() {
        let total_percent_less = 0;

        let total_percent_greater = 0;

        const total_less = [];

        const total_greater = [];

        const s = Object.keys(this.cdr_cauhoi_kthp).map(m => this.cdr_cauhoi_kthp[m]).reduce((total, current) => total + current, 0);

        this.chuan_dau_ra.forEach(cdr => {
            if (!cdr.disabled) {
                if (!this.cdr_cauhoi_kthp[cdr.id]) {
                    this.cdr_cauhoi_kthp[cdr.id] = 0;
                }
                const percent = s !== 0 ? this.cdr_cauhoi_kthp[cdr.id] / s * 100 : 100;
                if (cdr.id < this.courseSelected.params.cdr) {
                    total_percent_less = total_percent_less + percent;
                    total_less.push(cdr.id);
                } else if (cdr.id > this.courseSelected.params.cdr) {
                    total_percent_greater = total_percent_greater + percent;
                    total_greater.push(cdr.id);
                }
            }
        })

        if (total_percent_greater > 10) {
            total_greater.forEach(f => {
                this.cdr_cauhoi_kthp_require[f] = true;
            })
        } else {
            total_greater.forEach(f => {
                this.cdr_cauhoi_kthp_require[f] = false;
            })
        }

        if (total_percent_less > 40) {
            total_less.forEach(f => {
                this.cdr_cauhoi_kthp_require[f] = true;
            })
        } else {
            total_less.forEach(f => {
                this.cdr_cauhoi_kthp_require[f] = false;
            })
        }

        const number = Number(this.returnPercentOnCdrItem(this.cdr_cauhoi_kthp[this.courseSelected.params.cdr]));

        if (number < 50) {
            this.cdr_cauhoi_kthp_require[this.courseSelected.params.cdr] = true;
        } else {
            this.cdr_cauhoi_kthp_require[this.courseSelected.params.cdr] = false;
        }
    }

    returnPercentOnCdrItem(cdr_number: number) {
        if (!cdr_number) {
            return 0;
        }

        const s = Object.keys(this.cdr_cauhoi_kthp).map(m => this.cdr_cauhoi_kthp[m]).reduce((total, current) => total + current, 0);

        return s === 0 ? 0 : (cdr_number / s * 100).toFixed(1);
    }

    pointQuestionKeyDown(event, inputPoint_quest) {
        if (event) {
            if (/[0-9]/.test(event.key) || event.key === 'Backspace') {
                if (inputPoint_quest.value.replace(/\d/gi, '').length > 0 && event.key === '.') {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    returnTotalCdrLastExam() {
        return Object.keys(this.cdr_cauhoi_kthp).map(m => this.cdr_cauhoi_kthp[m]).reduce((total, current) => total + current, 0);
    }

    returnPercent() {
        if (!this.selectLesson) {
            return 100;
        }

        if (Object.keys(this.cdr_cauhoi_kthp).length === 0) {
            return 0;
        }

        if (this.selectLesson && this.selectLesson.children && this.selectLesson.children[0] && this.selectLesson.children[0].cdr_cauhoi) {
            const cdr_cauhoi = this.selectLesson.children[0].cdr_cauhoi;

            let s = 0;

            Object.keys(cdr_cauhoi).forEach(f => {
                if (!isNaN(parseFloat(f))) {
                    s = cdr_cauhoi[f] + s;
                }
            })

            const total = Object.keys(this.cdr_cauhoi_kthp).map(m => this.cdr_cauhoi_kthp[m]).reduce((total, current) => total + current, 0);

            return s !== 0 ? (total / s * 100).toFixed(1) : 100;
        }

        return 0;
    }

    addBS20(d) {
        const index_ = Object.keys(this.cdr_cauhoi_kthp_require).map(m => this.cdr_cauhoi_kthp_require[m]).findIndex(m => m === true);

        if (index_ !== -1) {
            return this.noitifi.toastWarning("Vui lòng kiểm tra lại phân bổ câu hỏi");
        }

        const number_check = Number(this.returnPercentOnCdrItem(this.cdr_cauhoi_kthp[this.courseSelected.params.cdr]));

        if (number_check < 50) {
            return this.noitifi.toastError("Số lượng câu hỏi dạng " + this.chuan_dau_ra.find(m => m.id === this.courseSelected.params.cdr).label + " của môn học phải lớn 50%")
        }

        d(true);

        this.checkboxCdrCauhoi = false;

        this.noitifi.isProcessing(true);

        if (!this.isUpdate_cdr_exam) {
            const data_parent = {
                week: 100,
                parent_id: 0,
                course_id: this.courseSelected.id,
                title: this.keyServer == 'huv' ? 'Ngân hàng câu hỏi thi KTHP' : 'Bổ sung câu hỏi thi KTHP',
                type: 'PLAN',
                ordering: 100,
                status: 1
            }


            this.coursePlanActivitiesService.addCoursePlanActivities(data_parent).pipe(mergeMap(a => {
                const cdr_cauhoi = this.cdr_cauhoi_kthp;

                this.chuan_dau_ra.forEach(f => {
                    if (!f.disabled) {
                        if (!cdr_cauhoi[f.id]) {
                            cdr_cauhoi[f.id] = 0;
                        }
                    }
                })

                cdr_cauhoi['status'] = 1;

                const data = {
                    week: 100,
                    parent_id: a,
                    course_id: this.courseSelected.id,
                    title: this.keyServer == 'hvu' ? 'Ngân hàng câu hỏi thi KTHP' : 'Bổ sung câu hỏi thi KTHP',
                    kyhieu: this.keyServer == 'hvu' ? 'KTHP' : 'BS',
                    ma_cdr: 'BS',
                    type: 'ACTIVITY_CDR',
                    ordering: 100,
                    cdr_cauhoi: cdr_cauhoi,
                    status: 1
                }

                return this.coursePlanActivitiesService.addCoursePlanActivities(data).pipe(mergeMap(s => {
                    return of(s);
                }))
            })).subscribe({
                next: () => {
                    this.noitifi.toastSuccess('Thêm thành công');
                    this.noitifi.isProcessing(false);
                    this.loadCdrAndQuestion();
                },
                error: () => {
                    this.noitifi.toastError("Thêm thất bại, vui lòng thử lại");
                }
            })
        } else {
            if (this.selectLesson) {
                if (this.selectLesson.children && this.selectLesson.children[0]) {

                    const cdr_cauhoi = this.cdr_cauhoi_kthp;

                    this.chuan_dau_ra.forEach(f => {
                        if (!f.disabled) {
                            if (!cdr_cauhoi[f.id]) {
                                cdr_cauhoi[f.id] = 0;
                            }
                        }
                    })

                    Object.keys(cdr_cauhoi).forEach(f => {
                        if (!this.selectLesson.children[0].cdr_cauhoi[f]) {
                            this.selectLesson.children[0].cdr_cauhoi[f] = 0;
                        }
                        cdr_cauhoi[f] = cdr_cauhoi[f] + this.selectLesson.children[0].cdr_cauhoi[f];
                    })

                    cdr_cauhoi['status'] = 1;

                    this.coursePlanActivitiesService.updateCoursePlanActivities(this.selectLesson.children[0].id, { cdr_cauhoi: cdr_cauhoi }).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Thiết lập thành công');
                            this.noitifi.isProcessing(false);
                            this.loadCdrAndQuestion();
                        },
                        error: () => {
                            this.noitifi.toastError("Thiết lập thất bại, vui lòng thử lại");
                        }
                    })

                } else {
                    const cdr_cauhoi = this.cdr_cauhoi_kthp;

                    this.chuan_dau_ra.forEach(f => {
                        if (!f.disabled) {
                            if (!cdr_cauhoi[f.id]) {
                                cdr_cauhoi[f.id] = 0;
                            }
                        }
                    })

                    cdr_cauhoi['status'] = 1;

                    const data = {
                        week: this.selectLesson.week,
                        parent_id: this.selectLesson.id,
                        course_id: this.selectLesson.course_id,
                        title: this.keyServer == 'hvu' ? 'Ngân hàng câu hỏi thi KTHP' : 'Bổ sung câu hỏi thi KTHP',
                        kyhieu: this.keyServer == 'hvu' ? 'KTHP' : 'BS',
                        ma_cdr: 'BS',
                        type: 'ACTIVITY_CDR',
                        ordering: this.selectLesson.ordering,
                        cdr_cauhoi: cdr_cauhoi,
                        status: 1
                    }

                    this.coursePlanActivitiesService.addCoursePlanActivities(data).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Thiết lập thành công');
                            this.noitifi.isProcessing(false);
                            this.loadCdrAndQuestion();
                        },
                        error: () => {
                            this.noitifi.toastError("Thiết lập thất bại, vui lòng thử lại");
                        }
                    })
                }
            }
        }
    }

    resetToMinCdrCauhoi(lesson: CoursePlanActivityTracNghiem) {
        this.noitifi.confirm("Thầy/Cô có chắc chắn muốn thực hiện thao tác này?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === "yes") {
                if (lesson.children && lesson.children[0]) {
                    const cdr_cauhoi = {};
                    this.chuan_dau_ra.forEach(f => {
                        if (!f.disabled) {
                            cdr_cauhoi[f.id] = this.getTotalQuestionInsetedCdr(lesson.children[0], f.id);
                        }
                    })

                    cdr_cauhoi["status"] = 1;

                    this.coursePlanActivitiesService.updateCoursePlanActivities(lesson.children[0].id, { cdr_cauhoi: cdr_cauhoi }).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Thiết lập thành công');
                            this.noitifi.isProcessing(false);
                            this.loadCdrAndQuestion();
                        },
                        error: () => {
                            this.noitifi.toastError("Thiết lập thất bại, vui lòng thử lại");
                        }
                    })
                }
            }
        })
    }

    moveToAddQuestion(plan: CoursePlanActivities) {
        console.log(this.router.url);
        const url = this.router.serializeUrl(
            this.router.createUrlTree([this.router.url.concat('/cauhoi-tracnghiem-chitiet')], {
                queryParams: { code: this.courseSelected.id, node: plan.id }
            })
        );

        window.open(url, '_blank');
    }
}
