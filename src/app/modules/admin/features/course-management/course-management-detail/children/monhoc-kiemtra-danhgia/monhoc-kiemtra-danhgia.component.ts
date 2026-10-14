import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, Subject, distinctUntilChanged, firstValueFrom, forkJoin, map, mergeMap, of, takeUntil } from 'rxjs';
import { OvicQueryCondition } from '@core/models/dto';
import { APP_CONFIGS, key_server } from '@env';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { NotificationService } from '@core-new/service/notification.service';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { CourseFormDgService } from '@modules/shared/services/course-form-dg.service';
import { CourseFormTxService, SINHDETX } from '@modules/shared/services/course-form-tx.service';
import { CoursePlanBankService } from '@modules/shared/services/course-plan-bank.service';
import { CourseFormCcService, SINHDECC } from '@modules/shared/services/course-form-cc.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { ThuongxuyenTuluanV2Component } from '../thuongxuyen-tuluan-v2/thuongxuyen-tuluan-v2.component';
import { ThuongxuyenDuanComponent } from '../thuongxuyen-duan/thuongxuyen-duan.component';
import { CauhoiTuluan15pComponent } from '../cauhoi-tuluan-15p/cauhoi-tuluan-15p.component';

@Component({
    selector: 'app-monhoc-kiemtra-danhgia',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        TableModule,
        TooltipModule,
        MatButtonModule,
        LoadingProgressComponent,
        ThuongxuyenTuluanV2Component,
        ThuongxuyenDuanComponent,
        CauhoiTuluan15pComponent
    ],
    templateUrl: './monhoc-kiemtra-danhgia.component.html',
    styleUrls: ['./monhoc-kiemtra-danhgia.component.css']
})
export class MonhocKiemtraDanhgiaComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);
    private readonly helperService = inject(HelperService);
    private readonly notificationService = inject(NotificationService);
    private readonly elnKhoaHocService = inject(ElnKhoaHocService);
    private readonly elngUserProfileService = inject(ElngUserProfileService);
    private readonly courseFormTxService = inject(CourseFormTxService);
    private readonly courseFormDgService = inject(CourseFormDgService);
    private readonly coursePlanBankService = inject(CoursePlanBankService);
    private readonly courseFormCcService = inject(CourseFormCcService);
    private readonly courseQuestionsService = inject(CourseQuestionsService);
    private readonly coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private readonly cancelLoad$ = new Subject<void>();

    readonly state = signal<AppState>('loading');
    readonly isSaving = signal(false);
    readonly errorMessage = signal('');
    loadingHeading = 'Đang tải kiểm tra và đánh giá...';
    private loadVersion = 0;

    readonly isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt]
        .some(role => this.auth.userHasRole(role));
    readonly routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/monhoc-kiemtra-danhgia');
    readonly routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/monhoc-kiemtra-danhgia');
    readonly routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/monhoc-kiemtra-danhgia');
    readonly routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/monhoc-kiemtra-danhgia');
    readonly userId = this.auth.user.id;
    readonly key_server = key_server;
    readonly isDttx = APP_CONFIGS.isDttx;

    selectedCourse: ElnKhoaHoc | null = null;
    canAdded = false;
    list_week: CoursePlanActivities[] = [];
    list_plan: CoursePlanActivities[] = [];
    selectPlan: CoursePlanActivities | null = null;
    number_test_config: Record<string, number> = {};
    label_week = 'Bài';
    tabIndex = 0;
    closeLeft = false;
    showTests = false;

    get busy(): boolean {
        return this.state() !== 'success' || this.isSaving();
    }

    ngOnInit(): void {
        this.number_test_config = this.loadTestConfig();
        this.activatedRoute.queryParamMap.pipe(
            map(params => params.get('code')),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(code => void this.loadData(code));
        this.destroyRef.onDestroy(() => this.cancelLoad$.complete());
    }

    reloadData(): void {
        if (!this.isSaving()) void this.loadData(this.activatedRoute.snapshot.queryParamMap.get('code'));
    }

    private loadTestConfig(): Record<string, number> {
        try {
            const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm) || '[]');
            return config.find(item => item.config_key === 'NUMOF_TEST_CCTX')?.params || {};
        } catch {
            return {};
        }
    }

    private async request<T>(source: Observable<T>): Promise<T> {
        const version = this.loadVersion;
        const result = await firstValueFrom(source.pipe(takeUntil(this.cancelLoad$), takeUntilDestroyed(this.destroyRef)));
        if (this.destroyRef.destroyed || version !== this.loadVersion) throw new Error('Request cancelled');
        return result;
    }

    private condition(column: string, value: string, limit = '-1'): ConditionOption {
        return { condition: [{ conditionName: column, condition: OvicQueryCondition.equal, value, orWhere: 'and' }], set: [{ label: 'limit', value: limit }], page: null };
    }

    private async loadData(code: string | null): Promise<void> {
        const version = ++this.loadVersion;
        this.cancelLoad$.next();
        this.isSaving.set(false);
        this.selectedCourse = null;
        this.list_week = [];
        this.list_plan = [];
        this.selectPlan = null;
        this.showTests = false;
        this.errorMessage.set('');
        this.loadingHeading = 'Đang tải kiểm tra và đánh giá...';
        this.state.set('loading');
        if (!code || !Number.isSafeInteger(Number(code)) || Number(code) <= 0) {
            this.errorMessage.set('ID học phần không hợp lệ.');
            this.state.set('error');
            return;
        }
        try {
            const courseCondition = this.condition('id', code, '1');
            if (this.routerGiangvien) courseCondition.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: String(this.userId), orWhere: 'and' });
            const [course, profile] = await this.request(forkJoin([
                this.elnKhoaHocService.getKhoaHocByPageNew_2(courseCondition),
                this.elngUserProfileService.getUserProfileByPageNewV2(this.condition('user_id', String(this.userId), '1'))
            ]));
            if (version !== this.loadVersion) return;
            const selected = course.data?.[0];
            if (!selected) {
                this.errorMessage.set('Không tìm thấy học phần.');
                this.state.set('error');
                return;
            }
            if ((this.routerLanhdaokhoa && (!profile.data?.[0] || selected.category_ids !== profile.data[0].donvi_chuyenmon_id))
                || (this.routerLanhdaobomon && (!profile.data?.[0] || selected.nganh_bomon_id !== profile.data[0].bomon_id))) {
                this.errorMessage.set('Không có quyền truy cập học phần.');
                this.state.set('error');
                void this.router.navigate(['/admin/content-none']);
                return;
            }
            this.selectedCourse = selected;
            this.canAdded = this.isManager || this.routerDaotao || this.routerLanhdaobomon || this.routerLanhdaokhoa || this.userId === selected.creator_plan_id;
            if (this.tabIndex === 1) await this.loadThuongxuyen();
            else if (this.tabIndex === 0) await this.loadTest();
            if (version === this.loadVersion && !this.destroyRef.destroyed) this.state.set('success');
        } catch {
            if (version !== this.loadVersion || this.destroyRef.destroyed) return;
            this.errorMessage.set('Không thể tải kiểm tra và đánh giá. Vui lòng thử lại.');
            this.state.set('error');
        }
    }

    private async runOperation(heading: string, operation: () => Promise<void>, successMessage: string): Promise<void> {
        if (this.busy || !this.selectedCourse || !this.canAdded) return;
        const version = this.loadVersion;
        this.loadingHeading = heading;
        this.isSaving.set(true);
        try {
            await operation();
            if (version === this.loadVersion && !this.destroyRef.destroyed) this.notificationService.toastSuccess(successMessage);
        } catch {
            if (version === this.loadVersion && !this.destroyRef.destroyed) this.notificationService.toastError('Thao tác thất bại. Vui lòng thử lại.');
        } finally {
            if (version === this.loadVersion && !this.destroyRef.destroyed) this.isSaving.set(false);
        }
    }

    async loadTest(): Promise<void> {
        if (!this.selectedCourse) return;
        const courseId = String(this.selectedCourse.id);
        const planActivity: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId, orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }, { label: 'include', value: 'ACTIVITY_CDR,PLAN' }, { label: 'include_by', value: 'type' }, { label: 'orderby', value: 'week' }, { label: 'order', value: 'ASC' }], page: null
        };
        const planBank: ConditionOption = {
            condition: [{ conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId, orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }, { label: 'select', value: 'week,id,bank_type' }, { label: 'include', value: 'CC,DG' }, { label: 'include_by', value: 'bank_type' }], page: null
        };
        const formWeek: ConditionOption = {
            condition: [{ conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId, orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }, { label: 'select', value: 'week,id' }, { label: 'groupby', value: 'week' }], page: null
        };
        const result = await this.request(forkJoin({
            plan_activity: this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(planActivity),
            bank: this.coursePlanBankService.getCoursePlanBankByPageNew(planBank),
            form_cc: this.courseFormCcService.getCourseFormCcByPage(formWeek),
            form_dg: this.courseFormDgService.getCourseFormDgByPage(formWeek),
            question: this.loadQuestions(courseId)
        }));
        const bankDgWeeks = new Set(result.bank.data.filter(item => item.bank_type === 'DG').map(item => item.week));
        const bankCcWeeks = new Set(result.bank.data.filter(item => item.bank_type === 'CC').map(item => item.week));
        const formCcWeeks = new Set(result.form_cc.data.map(item => item.week));
        const formDgWeeks = new Set(result.form_dg.data.map(item => item.week));
        const parents = result.plan_activity.data.filter(item => item.parent_id === 0);
        parents.forEach(parent => {
            parent['datuyet_question'] = result.question.data.filter(item => item.week === parent.week).length;
            parent.children = this.helperService.sort(result.plan_activity.data.filter(item => item.parent_id === parent.id), 'stt_cdr');
            parent['has_form_cc'] = formCcWeeks.has(parent.week);
            parent['has_form_dg'] = formDgWeeks.has(parent.week);
            parent['has_test_cc'] = bankCcWeeks.has(parent.week);
            parent['has_test_dg'] = bankDgWeeks.has(parent.week);
        });
        this.list_week = parents;
    }

    private loadQuestions(courseId: string): Observable<any> {
        const parent: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId, orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'group_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }, { label: 'select', value: 'status,id,cdr,reference_id,week,created_at' }], page: null
        };
        return this.courseQuestionsService.getCourseQuestionsByPageNew(parent).pipe(mergeMap(response => {
            if (this.selectedCourse?.av !== 1 || !response.data?.length) return of(response);
            const child: ConditionOption = {
                condition: [{ conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId, orWhere: 'and' }],
                set: [{ label: 'limit', value: '-1' }, { label: 'include', value: [...response.data.map(item => item.id), -1].toString() }, { label: 'include_by', value: 'group_id' }, { label: 'select', value: 'status,id,cdr,reference_id,week' }], page: null
            };
            return this.courseQuestionsService.getCourseQuestionsByPageNew(child);
        }));
    }

    async sinhDeByWeek(row: CoursePlanActivities): Promise<void> {
        if (!await this.confirmAction(`Sinh đề luyện tập ${this.label_week} ${row.week}?`)) return;
        await this.runOperation('Đang sinh đề luyện tập...', async () => {
            const data: SINHDECC = { course_id: this.selectedCourse.id, week: row.week, limit: this.number_test_config['CC_TEST'] };
            await this.request(this.courseFormCcService.sinhde(data));
            await this.loadTest();
        }, 'Đã sinh đề xong');
    }

    async sinhDe15pByWeek(row: CoursePlanActivities): Promise<void> {
        if (!await this.confirmAction(`Sinh đề kiểm tra 15 phút ${this.label_week} ${row.week}?`)) return;
        await this.runOperation('Đang sinh đề kiểm tra 15 phút...', async () => {
            const data: SINHDECC = { course_id: this.selectedCourse.id, week: row.week, limit: this.number_test_config['CC_TEST'] };
            await this.request(this.courseFormDgService.sinhde(data));
            await this.loadTest();
        }, 'Đã sinh đề xong');
    }

    async deleteDeWeek(row: CoursePlanActivities): Promise<void> {
        if (!await this.confirmDelete(`Bạn có chắc muốn xóa toàn bộ đề luyện tập ${this.label_week} ${row.week}?`)) return;
        await this.deleteBank(row, 'CC', 'Đang xóa đề luyện tập...');
    }

    async delete15pDeByWeek(row: CoursePlanActivities): Promise<void> {
        if (!await this.confirmDelete(`Bạn có chắc muốn xóa toàn bộ đề kiểm tra 15 phút ${this.label_week} ${row.week}?`)) return;
        await this.deleteBank(row, 'DG', 'Đang xóa đề kiểm tra 15 phút...');
    }

    private async deleteBank(row: CoursePlanActivities, bankType: string, heading: string): Promise<void> {
        await this.runOperation(heading, async () => {
            const option: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: String(this.selectedCourse.id), orWhere: 'and' },
                    { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: bankType, orWhere: 'and' },
                    { conditionName: 'week', condition: OvicQueryCondition.equal, value: String(row.week), orWhere: 'and' }
                ],
                set: [{ label: 'limit', value: '-1' }, { label: 'select', value: 'id' }], page: null
            };
            const tests = await this.request(this.coursePlanBankService.getCoursePlanBankByPageNew(option));
            const ids = tests.data.map(item => item.id);
            if (ids.length) await this.request(this.coursePlanBankService.deleteCoursePlanBank(ids.toString()));
            await this.loadTest();
        }, 'Xóa thành công');
    }

    onTabIndexChange(index: number): void {
        if (this.busy || this.tabIndex === index) return;
        this.tabIndex = index;
        if (index === 0) void this.refreshTests();
        if (index === 1) void this.refreshThuongxuyen();
    }

    private async refreshTests(): Promise<void> {
        this.loadingHeading = 'Đang tải danh sách luyện tập...';
        this.isSaving.set(true);
        try { await this.loadTest(); } catch { this.notificationService.toastError('Không thể tải danh sách luyện tập.'); }
        finally { if (!this.destroyRef.destroyed) this.isSaving.set(false); }
    }

    private async refreshThuongxuyen(): Promise<void> {
        this.loadingHeading = 'Đang tải kiểm tra thường xuyên...';
        this.isSaving.set(true);
        try { await this.loadThuongxuyen(); } catch { this.notificationService.toastError('Không thể tải kiểm tra thường xuyên.'); }
        finally { if (!this.destroyRef.destroyed) this.isSaving.set(false); }
    }

    private async loadThuongxuyen(): Promise<void> {
        const option: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: String(this.selectedCourse.id), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '1000', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'ordering' }, { label: 'order', value: 'ASC' }], page: null
        };
        const response = await this.request(this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(option));
        const parents = response.data.filter(item => item.parent_id === 0);
        parents.forEach(parent => {
            parent.children = response.data.filter(item => item.parent_id === parent.id);
            parent.children.forEach(child => child.icon = this.getTestIcon(child.type));
        });
        this.list_plan = parents;
        this.showTests = parents.some(parent => parent.children?.length);
        if (!this.showTests) this.selectPlan = null;
    }

    private getTestIcon(type: string): string {
        if (type === 'THUONGXUYEN_TRACNGHIEM') return 'ti ti-clock';
        if (type === 'THUONGXUYEN_TULUAN') return 'ti ti-pencil';
        if (type === 'THUONGXUYEN_DUAN') return 'ti ti-book';
        return 'ti ti-file';
    }

    closeLeftBody(): void {
        this.closeLeft = !this.closeLeft;
    }

    onChangePlan(plan: CoursePlanActivities): void {
        if (this.busy) return;
        this.selectPlan = plan;
        if (plan.type === 'THUONGXUYEN_TRACNGHIEM') void this.loadTestTracnghiem();
    }

    private async loadTestTracnghiem(manageLoading = true): Promise<void> {
        if (!this.selectedCourse || !this.selectPlan) return;
        const selected = this.selectPlan;
        this.loadingHeading = 'Đang tải thông tin đề trắc nghiệm...';
        if (manageLoading) this.isSaving.set(true);
        try {
            const form: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: String(this.selectedCourse.id), orWhere: 'and' },
                    { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: String(selected.ordering), orWhere: 'and' },
                    { conditionName: 'av', condition: OvicQueryCondition.equal, value: String(this.selectedCourse.av), orWhere: 'and' }
                ], set: [{ label: 'limit', value: '-1' }], page: null
            };
            const bank: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: String(this.selectedCourse.id), orWhere: 'and' },
                    { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'TX', orWhere: 'and' },
                    { conditionName: 'week', condition: OvicQueryCondition.equal, value: '100', orWhere: 'and' },
                    { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: String(selected.ordering), orWhere: 'and' }
                ], set: [{ label: 'limit', value: '1' }], page: null
            };
            const [questions, plan] = await this.request(forkJoin([
                this.courseFormTxService.getCoursePlansByPageNew(form).pipe(mergeMap(forms => {
                    const ids = forms.data.flatMap(item => item.course_plan_activity_id.split(','));
                    if (!ids.length) return of(null);
                    const question: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: String(this.selectedCourse.id), orWhere: 'and' },
                            { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
                        ], set: [{ label: 'limit', value: '-1' }, { label: 'include', value: ids.toString() }, { label: 'include_by', value: 'reference_id' }, { label: 'select', value: 'id,status,group_id' }], page: null
                    };
                    return this.courseQuestionsService.getCourseQuestionsByPageNew(question).pipe(map(result => {
                        if (this.selectedCourse.av !== 1) return result;
                        const parents = new Map(result.data.filter(item => +item.group_id === 0).map(item => [item.id, item.status]));
                        result.data = result.data.filter(item => +item.group_id !== 0).map(item => ({ ...item, status: parents.get(item.group_id) ?? item.status }));
                        return result;
                    }));
                })),
                this.coursePlanBankService.getCoursePlanBankByPageNew(bank)
            ]));
            selected['has_form_test'] = !!questions;
            selected['has_question'] = questions ? `${questions.data.filter(item => item.status === 1).length}/${questions.data.length}` : '0/0';
            selected['_question_dat'] = questions?.data.filter(item => item.status === 1).length || 0;
            selected['has_test'] = !!plan.data.length;
        } catch (error) {
            if (!manageLoading) throw error;
            this.notificationService.toastError('Không thể tải thông tin đề trắc nghiệm.');
        } finally {
            if (manageLoading && !this.destroyRef.destroyed) this.isSaving.set(false);
        }
    }

    async sinhDeByKynang(row: CoursePlanActivities): Promise<void> {
        if (!await this.confirmAction(`Sinh đề ${row.title}?`)) return;
        await this.runOperation('Đang sinh đề trắc nghiệm...', async () => {
            const data: SINHDETX = { course_id: this.selectedCourse.id, ordering: row.ordering, limit: this.number_test_config['TX_TEST'] };
            await this.request(this.courseFormTxService.sinhde(data));
            await this.loadTestTracnghiem(false);
        }, 'Đã sinh đề xong');
    }

    async deleteDeKynang(row: CoursePlanActivities): Promise<void> {
        if (!await this.confirmDelete(`Bạn có chắc muốn xóa toàn bộ đề ${row.title}?`)) return;
        await this.runOperation('Đang xóa đề trắc nghiệm...', async () => {
            const option: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: String(this.selectedCourse.id), orWhere: 'and' },
                    { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'TX', orWhere: 'and' },
                    { conditionName: 'week', condition: OvicQueryCondition.equal, value: '100', orWhere: 'and' },
                    { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: String(row.ordering), orWhere: 'and' }
                ], set: [{ label: 'limit', value: '-1' }, { label: 'select', value: 'id' }], page: null
            };
            const tests = await this.request(this.coursePlanBankService.getCoursePlanBankByPageNew(option));
            if (tests.data.length) await this.request(this.coursePlanBankService.deleteCoursePlanBank(tests.data.map(item => item.id).toString()));
            await this.loadTestTracnghiem(false);
        }, 'Xóa thành công');
    }

    private async confirmAction(message: string): Promise<boolean> {
        const result = await firstValueFrom(this.notificationService.confirm({
            heading: 'Xác nhận hành động', message,
            buttons: [
                { name: 'yes', label: 'Xác nhận', icon: 'ti ti-check', class: 'p-button-primary p-button-rounded' },
                { name: 'no', label: 'Hủy', icon: 'ti ti-x', class: 'p-button-secondary p-button-rounded' }
            ]
        }));
        return result?.name === 'yes';
    }

    private async confirmDelete(message: string): Promise<boolean> {
        return firstValueFrom(this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa',
            htmlMessage: `<p class="m-0 f-roboto f-14 lh-base text-center">${this.escapeHtml(message)}</p>`
        }));
    }

    private escapeHtml(value: string): string {
        return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
    }
}
