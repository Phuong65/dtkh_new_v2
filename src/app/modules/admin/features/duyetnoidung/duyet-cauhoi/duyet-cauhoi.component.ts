import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { CourseQuestionsService } from '@shared/services/course-questions.service';
import { Component, Directive, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin, mergeMap, of } from 'rxjs';
import { HoidongThamdinhMonhocThanhvienService } from '@modules/shared/services/hoidong-thamdinh-monhoc-thanhvien.service';
import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { AuthService } from '@core/services/auth.service';
import { HoidongThamdinhMonhoc } from '@modules/shared/models/hoidong-thamdinh-monhoc';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { HelperService } from '@core/services/helper.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ROLES } from '@modules/shared/utils/syscat';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { DuyetCauhoiTnComponent } from '../duyet-cauhoi-tn/duyet-cauhoi-tn.component';
import { DuyetThuongxuyenTuluanComponent } from "../duyet-thuongxuyen-tuluan/duyet-thuongxuyen-tuluan.component";
import { DuyetThuongxuyenDuanComponent } from "../duyet-thuongxuyen-duan/duyet-thuongxuyen-duan.component";
import { DuyetCauhoiThuchanhKthpComponent } from "../duyet-cauhoi-thuchanh-kthp/duyet-cauhoi-thuchanh-kthp.component";
import { FormDeManagerComponent } from "../form-de-manager/form-de-manager.component";

interface PlanItemVm {
    icon: string;
    statusLabel: string;
    statusClass: string;
    progressPercent: number | undefined;
}

@Directive({ selector: 'container-element', standalone: true })
class ContainerElementDirective {}

@Component({
    selector: 'app-duyet-cauhoi',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        DuyetCauhoiTnComponent,
        DuyetThuongxuyenTuluanComponent,
        DuyetThuongxuyenDuanComponent,
        DuyetCauhoiThuchanhKthpComponent,
        FormDeManagerComponent,
        ContainerElementDirective
    ],
    templateUrl: './duyet-cauhoi.component.html',
    styleUrls: ['./duyet-cauhoi.component.css']
})
export class DuyetCauhoiComponent implements OnInit {
    private notificationService = inject(NotificationService);
    private activatedRoute = inject(ActivatedRoute);
    private hoidongThamdinhMonhocThanhvienService = inject(HoidongThamdinhMonhocThanhvienService);
    private hoidongThamdinhMonhocService = inject(HoidongThamdinhMonhocService);
    private auth = inject(AuthService);
    private router = inject(Router);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private helperService = inject(HelperService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private coursePlanActivityTuluanService = inject(CoursePlanActivityTuluanService);
    private elngUserProfileService = inject(ElngUserProfileService);

    list_thanhvien: HoidongThamdinhMonhocThanhvien[];

    selectedMonhocThamdinh: HoidongThamdinhMonhoc;

    isManager: boolean;

    isKhaothi: boolean;

    kd_uyvien: boolean = false;

    kd_hoidong: boolean = false;

    list_plan: CoursePlanActivities[];

    selectPlan: CoursePlanActivities;

    selectedPlanActivity: CoursePlanActivities;

    userId: number;

    rejectRole: boolean = false;

    isLanhdaokhoa: boolean = false;

    label_parent_kehoach: string = "Bài";

    closeLeft: boolean = false;

    courseSelected: ElnKhoaHoc;

    // Phase 7: View-model & States
    isLoading: boolean = false;

    hasError: boolean = false;

    roleBadgeLabel: string = '';

    planVm: { [key: number]: PlanItemVm } = {};

    constructor() {
        this.isManager = this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.manager) ? true : false;

        this.isKhaothi = this.auth.userHasRole(ROLES.hoidongthi_lanhdao);

        this.isLanhdaokhoa = this.auth.userHasRole(ROLES.lanhdaokhoa) ? true : false;

        this.rejectRole = this.isManager || this.isKhaothi || this.isLanhdaokhoa ? true : false;

        this.userId = this.auth.user.id;

        this.roleBadgeLabel = this.computeRoleBadge();
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {

                this.isLoading = true;
                this.hasError = false;
                this.notificationService.isProcessing(true);

                const hoidong_thamdinh_monhoc_id = params['code'];

                const contition: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: hoidong_thamdinh_monhoc_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '1' },
                        { label: 'with', value: 'course' }
                    ],
                    page: null
                }

                const condition_thanhvien: ConditionOption = {
                    condition: [
                        { conditionName: 'hoidong_thamdinh_monhoc_id', condition: OvicQueryCondition.equal, value: hoidong_thamdinh_monhoc_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'with', value: 'user' },
                        { label: 'order', value: 'DESC' },
                        { label: 'orderby', value: 'chutich' }
                    ],
                    page: null
                }

                const condition_user_profile: ConditionOption = {
                    condition: [
                        { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                forkJoin([
                    this.hoidongThamdinhMonhocThanhvienService.getHoidongThamdinhMonhocThanhvienByPageNew(condition_thanhvien),
                    this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew(contition),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user_profile)
                ]).subscribe({
                    next: ([_thanhvien, _course, _user_profile]) => {
                        if (_course.recordsFiltered && _course.data[0].course) {

                            const index = _thanhvien.data.findIndex(m => m.user_id === this.auth.user.id);

                            this.list_thanhvien = _thanhvien.data;

                            if (!this.isManager && !this.isKhaothi && this.isLanhdaokhoa && _user_profile.recordsFiltered && _user_profile.data[0].donvi_chuyenmon_id !== _course.data[0].course.category_ids && _course.data[0].course.creator_plan_id !== this.auth.user.id) {
                                this.isLoading = false;
                                this.notificationService.isProcessing(false);
                                this.router.navigate(['/admin/content-none']);
                            }

                            if (index === -1 && !this.isManager && !this.isKhaothi && !this.isLanhdaokhoa) {
                                this.isLoading = false;
                                this.notificationService.isProcessing(false);
                                this.router.navigate(['/admin/content-none']);
                            } else {
                                if (index !== -1) {
                                    this.kd_uyvien = true;
                                    this.kd_hoidong = _thanhvien.data[index].chutich ? true : false;
                                }
                            }

                            this.auth.setFeatureSecondary("Duyệt Câu hỏi");

                            this.selectedMonhocThamdinh = _course.data[0];

                            if (this.selectedMonhocThamdinh.course && this.selectedMonhocThamdinh.course.params) {
                                const params = this.selectedMonhocThamdinh.course.params;
                                if (typeof params === 'string') {
                                    this.selectedMonhocThamdinh.course.params = JSON.parse(params);
                                } else if (typeof params === 'object') {
                                    // params đã là object, giữ nguyên
                                }
                            }

                            this.courseSelected = this.selectedMonhocThamdinh.course;

                            this.loadCelo();
                        } else {
                            this.isLoading = false;
                            this.hasError = true;
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Không tìm thấy môn học");
                            this.router.navigate(['/admin/content-none']);
                        }
                    },
                    error: () => {
                        this.isLoading = false;
                        this.hasError = true;
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Không tìm thấy môn học");
                        this.router.navigate(['/admin/content-none']);
                    }
                })
            }
        })
    }

    loadCelo() {
        this.isLoading = true;
        this.hasError = false;
        this.notificationService.isProcessing(true);

        let questions_tuluan: CoursePlanActivityTuluan[] = [];

        let questions_duan: CoursePlanActivityTuluan[] = [];

        let questions_tuluan_kthp: CoursePlanActivityTuluan[] = [];

        const condition_plan: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedMonhocThamdinh.course_id.toString(),
                },
                {
                    conditionName: 'week',
                    condition: OvicQueryCondition.notEqual,
                    value: '0',
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'week' },
            ],
            page: null,
        };

        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan).pipe(mergeMap(a => {
            const ids = a.data.filter(m => m.type === 'ACTIVITY_CDR').map(m => m.id);
            const ids_tuluan = a.data.filter(m => m.type === 'THUONGXUYEN_TULUAN').map(m => m.id);
            const ids_duan = a.data.filter(m => m.type === 'THUONGXUYEN_DUAN' && m.ordering === 0).map(m => m.id);
            if (ids.length || ids_tuluan.length || ids_duan.length) {
                const condition_question: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedMonhocThamdinh.course_id.toString(), orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                        { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'status,week' },
                        { label: 'include', value: ids.toString().concat(",-1") },
                        { label: 'include_by', value: 'reference_id' },
                    ],
                    page: null,
                }

                const condition_tuluan: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedMonhocThamdinh.course_id.toString(), orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'status' },
                        { label: 'include', value: ids_tuluan.toString().concat(",-1") },
                        { label: 'include_by', value: 'course_plan_activity_id' },
                    ],
                    page: null,
                }

                const condition_duan: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedMonhocThamdinh.course_id.toString(), orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'status' },
                        { label: 'include', value: ids_duan.toString().concat(",-1") },
                        { label: 'include_by', value: 'course_plan_activity_id' },
                    ],
                    page: null,
                }

                const condition_tuluan_kthp: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedMonhocThamdinh.course_id.toString(), orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'status' },
                    ],
                    page: null,
                }

                return forkJoin([
                    this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question),
                    this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan),
                    this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_duan),
                    this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan_kthp)
                ]).pipe(mergeMap(([_question, _tuluan, _duan, _tuluan_kthp]) => {
                    a.data.forEach(f => {
                        if (f.type === "PLAN" && f.parent_id === 0) {
                            f['questions_duyet'] = _question.data.filter(m => m.status === 1 && m.week === f.week).length;
                            f['questions_tong'] = _question.data.filter(m => m.week === f.week).length;
                        }
                    })

                    questions_tuluan = _tuluan.data;

                    questions_duan = _duan.data;

                    questions_tuluan_kthp = _tuluan_kthp.data;
                    return of(a)
                }))
            }
            return of(a)
        })).subscribe({
            next: (_plan) => {

                let _data: CoursePlanActivities[] = [];

                const parent_plan = _plan.data.filter(m => m.parent_id === 0);

                parent_plan.forEach(f => {
                    f.children = _plan.data.filter(m => m.parent_id === f.id);
                })

                _data = parent_plan.filter(m => m.week > 0 && m.week < 100);

                const index_th = _plan.data.findIndex(m => m.type === 'THUONGXUYEN_TULUAN');

                if (index_th !== -1) {
                    const index_1000 = parent_plan.findIndex(m => m.week === 1000);
                    if (index_1000 !== -1) {
                        parent_plan[index_1000].title = "KTTX - Thực hành";
                        parent_plan[index_1000]['questions_duyet'] = questions_tuluan.filter(m => m.status === 1).length;
                        parent_plan[index_1000]['questions_tong'] = questions_tuluan.length;
                        _data.push(parent_plan[index_1000]);
                    }
                }

                const index_duan = _plan.data.findIndex(m => m.type === 'THUONGXUYEN_DUAN' && m.ordering === 0);

                if (index_duan !== -1) {
                    _plan.data[index_duan].title = "Dự án";
                    _plan.data[index_duan]['questions_duyet'] = questions_duan.filter(m => m.status === 1).length;
                    _plan.data[index_duan]['questions_tong'] = questions_duan.length;
                    _data.push(_plan.data[index_duan]);
                }

                const index_kthp_tn = parent_plan.findIndex(m => m.week === 100);

                if (index_kthp_tn !== -1) {
                    parent_plan[index_kthp_tn].title = "KTHP - Trắc nghiệm";
                    _data.push(parent_plan[index_kthp_tn]);
                }

                this.courseSelected['hinhthucthi'] = "Thực hành";

                if (!this.selectedMonhocThamdinh.course.params.exam_type) {
                    const index = EXAMFORMAT.findIndex((m) => m.key === this.selectedMonhocThamdinh.course.params.exam_format);
                    if (index !== -1) {
                        this.courseSelected['hinhthucthi'] = EXAMFORMAT[index].label;
                    }
                } else {
                    const index = EXAMFORMAT.findIndex((m) => m.id === this.selectedMonhocThamdinh.course.params.exam_type);
                    if (index !== -1) {
                        this.courseSelected['hinhthucthi'] = EXAMFORMAT[index].label;
                    }
                }

                if (this.selectedMonhocThamdinh && this.selectedMonhocThamdinh.course && this.selectedMonhocThamdinh.course.params && this.selectedMonhocThamdinh.course.params.exam_format === 'THUCHANH') {
                    const kthp_th: CoursePlanActivities = {
                        id: 0,
                        course_id: this.selectedMonhocThamdinh.course_id,
                        week: 100,
                        title: 'KTHP - '.concat(this.courseSelected['hinhthucthi']),
                        desc: '',
                        video: undefined,
                        files: [],
                        ordering: 0,
                        status: 0,
                        course_lesson_id: 0,
                        parent_id: 0,
                        type: 'PLAN',
                        desc_title: '',
                        edit: 0,
                        slides: [],
                    }

                    kthp_th['questions_duyet'] = questions_tuluan_kthp.filter(m => m.status === 1).length;

                    kthp_th['questions_tong'] = questions_tuluan_kthp.length;

                    _data.push(kthp_th);
                }

                const form_de: CoursePlanActivities = {
                    id: -1000,
                    course_id: this.selectedMonhocThamdinh.course_id,
                    week: 100,
                    title: 'Cấu trúc đề',
                    desc: '',
                    video: undefined,
                    files: [],
                    ordering: 0,
                    status: 0,
                    course_lesson_id: 0,
                    parent_id: 0,
                    type: 'FORM',
                    desc_title: '',
                    edit: 0,
                    slides: [],
                }

                _data.push(form_de);

                this.list_plan = _data;

                // Build view-model
                this.buildPlanVm();

                this.isLoading = false;
                this.hasError = false;
                this.notificationService.isProcessing(false);
            },

            error: () => {
                this.isLoading = false;
                this.hasError = true;
                this.notificationService.isProcessing(false);
            }
        })
    }

    // ===== Phase 7: View-model builders =====

    private buildPlanVm(): void {
        this.planVm = {};
        if (!this.list_plan) return;

        this.list_plan.forEach(plan => {
            const duyet = plan['questions_duyet'];
            const tong = plan['questions_tong'];
            const hasProgress = duyet !== undefined && tong !== undefined;

            let progressPercent: number | undefined = undefined;
            let statusLabel = '';
            let statusClass = '';

            if (hasProgress && tong > 0) {
                progressPercent = Math.round((duyet / tong) * 100);
                if (progressPercent === 100) {
                    statusLabel = 'Hoàn thành';
                    statusClass = 'complete';
                } else if (progressPercent > 0) {
                    statusLabel = 'Đang xử lý';
                    statusClass = 'processing';
                } else {
                    statusLabel = 'Chưa có';
                    statusClass = 'empty-status';
                }
            } else if (hasProgress && tong === 0) {
                progressPercent = 0;
                statusLabel = 'Chưa có';
                statusClass = 'empty-status';
            }

            this.planVm[plan.id] = {
                icon: this.getPlanIcon(plan),
                statusLabel,
                statusClass,
                progressPercent
            };
        });
    }

    private getPlanIcon(plan: CoursePlanActivities): string {
        if (plan.type === 'FORM') return '📐';
        if (plan.type === 'THUONGXUYEN_DUAN') return '🎯';
        if (plan.week === 1000) return '📄';
        if (plan.week === 100) return '📋';
        return '📝';
    }

    private computeRoleBadge(): string {
        if (this.isManager) return 'Admin';
        if (this.isKhaothi) return 'Khảo thí';
        if (this.kd_hoidong) return 'Chủ tịch HĐ';
        if (this.kd_uyvien) return 'Thành viên HĐ';
        return 'Thành viên';
    }

    // ===== trackBy =====

    trackByPlanId(index: number, item: CoursePlanActivities): number {
        return item.id;
    }

    // ===== Actions =====

    onChangePlan(parent: CoursePlanActivities) {
        this.selectPlan = parent;
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    selectNextPending(): void {
        if (!this.list_plan || this.list_plan.length === 0) return;

        const currentIndex = this.selectPlan ? this.list_plan.findIndex(p => p.id === this.selectPlan.id) : -1;

        // Find next item with incomplete progress
        for (let i = 1; i <= this.list_plan.length; i++) {
            const idx = (currentIndex + i) % this.list_plan.length;
            const plan = this.list_plan[idx];
            const vm = this.planVm[plan.id];
            if (!vm || vm.progressPercent === undefined || vm.progressPercent < 100) {
                this.selectPlan = plan;
                return;
            }
        }

        // Fallback: select next item cyclically
        const nextIdx = (currentIndex + 1) % this.list_plan.length;
        this.selectPlan = this.list_plan[nextIdx];
    }

    refreshCurrentPlan(): void {
        this.loadCelo();
    }

    retryLoad(): void {
        this.loadCelo();
    }
}
