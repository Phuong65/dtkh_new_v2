import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { Observable, Subject, distinctUntilChanged, firstValueFrom, forkJoin, map, takeUntil } from 'rxjs';
import { OvicQueryCondition } from '@core/models/dto';
import { APP_CONFIGS, key_server } from '@env';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { NotificationService } from '@core-new/service/notification.service';
import { AuthService } from '@core/services/auth.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { SharedModule } from '@modules/shared/shared.module';
import { Configs } from '@modules/shared/models/configs';
import { CourseConfig } from '@modules/shared/models/course-config';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CourseConfigService } from '@modules/shared/services/course-config.service';
import { ConfigsService } from '@shared/services/configs.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { getTestType, ROLES, ROUTERS } from '@modules/shared/utils/syscat';

@Component({
    selector: 'app-monhoc-cauhinh',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        TableModule,
        TooltipModule,
        MatButtonModule,
        LoadingProgressComponent
    ],
    templateUrl: './monhoc-cauhinh.component.html',
    styleUrls: ['./monhoc-cauhinh.component.css']
})
export class MonhocCauhinhComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly auth = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly elnKhoaHocService = inject(ElnKhoaHocService);
    private readonly elngUserProfileService = inject(ElngUserProfileService);
    private readonly coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private readonly configsService = inject(ConfigsService);
    private readonly courseConfigService = inject(CourseConfigService);
    private readonly cancelLoad$ = new Subject<void>();

    readonly state = signal<AppState>('loading');
    readonly isSaving = signal(false);
    readonly errorMessage = signal('');

    loadingHeading = 'Đang tải cấu hình học phần...';
    private loadVersion = 0;

    readonly isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt]
        .some(role => this.auth.userHasRole(role));
    readonly routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/monhoc-cauhinh');
    readonly routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/monhoc-cauhinh');
    readonly routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/monhoc-cauhinh');
    readonly routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/monhoc-cauhinh');
    readonly routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/monhoc-cauhinh');
    readonly userId = this.auth.user.id;

    readonly key_server = key_server;
    readonly isDttx = APP_CONFIGS.isDttx;
    readonly THUONGXUYEN_TEST_TYPE = getTestType();

    selectedCourse: ElnKhoaHoc | null = null;
    canAdded = false;
    list_config: Configs[] = [];
    list_plan: CoursePlanActivities[] = [];
    plan_kiemtra: CoursePlanActivities | null = null;
    course_config_object: Record<string, CourseConfig[]> = {};

    ngOnInit(): void {
        this.activatedRoute.queryParamMap.pipe(
            map(params => params.get('code')),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(code => void this.loadData(code));
        this.destroyRef.onDestroy(() => this.cancelLoad$.complete());
    }

    reloadData(): void {
        if (this.isSaving()) return;
        void this.loadData(this.activatedRoute.snapshot.queryParamMap.get('code'));
    }

    private condition(column: string, value: string, limit = '-1', ordered = false): ConditionOption {
        return {
            condition: [{ conditionName: column, condition: OvicQueryCondition.equal, value, orWhere: 'and' }],
            set: [
                { label: 'limit', value: limit },
                ...(ordered ? [{ label: 'order', value: 'ASC' }, { label: 'orderby', value: 'ordering' }] : [])
            ],
            page: null
        };
    }

    private async request<T>(source: Observable<T>): Promise<T> {
        const version = this.loadVersion;
        const result = await firstValueFrom(source.pipe(takeUntil(this.cancelLoad$), takeUntilDestroyed(this.destroyRef)));
        if (this.destroyRef.destroyed || version !== this.loadVersion) throw new Error('Request cancelled');
        return result;
    }

    get canEdit(): boolean {
        return this.isManager || this.canAdded;
    }

    get busy(): boolean {
        return this.state() !== 'success' || this.isSaving();
    }

    private async loadData(code: string | null): Promise<void> {
        const version = ++this.loadVersion;
        this.cancelLoad$.next();
        this.isSaving.set(false);
        this.selectedCourse = null;
        this.plan_kiemtra = null;
        this.list_config = [];
        this.list_plan = [];
        this.course_config_object = {};
        this.canAdded = false;
        this.errorMessage.set('');
        this.loadingHeading = 'Đang tải cấu hình học phần...';
        this.state.set('loading');

        if (!code || !Number.isSafeInteger(Number(code)) || Number(code) <= 0) {
            this.errorMessage.set('ID học phần không hợp lệ.');
            this.state.set('error');
            return;
        }

        try {
            const courseCondition = this.condition('id', code, '1');
            if (this.routerGiangvien) {
                courseCondition.condition.push({
                    conditionName: 'creator_plan_id',
                    condition: OvicQueryCondition.equal,
                    value: String(this.userId),
                    orWhere: 'and'
                });
            }

            const configCondition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include_by', value: 'config_key' },
                    { label: 'include', value: 'PERCENT_SCORE_SUMMARY,PERCENT_OF_LEAVE_ALLOWED,NUMOF_TEST_CCTX,PRACTICE_TIME_FOR_A_TEST' }
                ],
                page: null
            };

            const [course, profile, plan, config, courseConfig] = await this.request(forkJoin([
                this.elnKhoaHocService.getKhoaHocByPageNew_2(courseCondition),
                this.elngUserProfileService.getUserProfileByPageNewV2(this.condition('user_id', String(this.userId), '1')),
                this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew({
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: code, orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'PLAN', orWhere: 'and' },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' },
                        { label: 'select', value: 'week' }
                    ],
                    page: null
                }),
                this.configsService.getConfigsByPageNew(configCondition),
                this.courseConfigService.getCourseConfigByPageNew(this.condition('course_id', code, '-1', true))
            ]));

            if (this.destroyRef.destroyed || version !== this.loadVersion) return;
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
            this.canAdded = this.routerDaotao || this.routerLanhdaobomon || this.routerLanhdaokhoa
                || this.userId === selected.creator_plan_id;
            this.list_config = config.data || [];
            this.list_plan = plan.data || [];
            this.convertDataCourseConfig(courseConfig.data || []);
            await this.loadKiemtrathuongxuyen();
            if (!this.destroyRef.destroyed && version === this.loadVersion) this.state.set('success');
        } catch {
            if (this.destroyRef.destroyed || version !== this.loadVersion) return;
            this.errorMessage.set('Không thể tải cấu hình học phần. Vui lòng thử lại.');
            this.state.set('error');
        }
    }

    private async runOperation(heading: string, action: () => Promise<boolean | void>, successMessage: string): Promise<void> {
        if (this.isSaving() || this.state() !== 'success' || !this.selectedCourse) return;
        const version = this.loadVersion;
        this.loadingHeading = heading;
        this.isSaving.set(true);
        try {
            const completed = await action();
            if (completed !== false && !this.destroyRef.destroyed && version === this.loadVersion) {
                this.notificationService.toastSuccess(successMessage);
            }
        } catch {
            if (!this.destroyRef.destroyed && version === this.loadVersion) {
                this.notificationService.toastError('Thao tác thất bại. Vui lòng thử lại.');
            }
        } finally {
            if (!this.destroyRef.destroyed && version === this.loadVersion) this.isSaving.set(false);
        }
    }

    private async loadKiemtrathuongxuyen(): Promise<void> {
        const response = await this.request(this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew({
            condition: [
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '1000', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: String(this.selectedCourse.id), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }));

        const parent = response.data?.find(item => item.parent_id === 0);
        if (parent) {
            parent.children = response.data.filter(item => item.parent_id === parent.id);
            this.plan_kiemtra = parent;
        } else {
            this.plan_kiemtra = {
                course_id: this.selectedCourse.id,
                week: 1000,
                title: this.isDttx ? 'Kiểm tra giữa kỳ' : 'Kiểm tra thường xuyên',
                desc: null,
                video: null,
                files: null,
                ordering: 1000,
                status: 1,
                course_lesson_id: 0,
                parent_id: 0,
                type: 'PLAN',
                desc_title: null,
                edit: 1,
                slides: null,
                children: [],
                exam_type: this.selectedCourse.params?.exam_type
            };
        }
        this.createTestTx();
    }

    onChangeTypeTest(event: any, test: CoursePlanActivities): void {
        if (!event) return;
        test.type = event.key;
        test.exam_type = event.id;
    }

    addTestTx(): void {
        if (!this.plan_kiemtra || !this.selectedCourse) return;
        const type = this.getTestTypeByFormat(this.selectedCourse.params?.exam_format);
        const children = this.plan_kiemtra.children || (this.plan_kiemtra.children = []);
        const ordering = Math.max(0, ...children
            .filter(item => item.ordering > 0 && item.ordering < 100)
            .map(item => item.ordering)) + 1;
        const title = this.isDttx ? `Bài kiểm tra giữa kỳ số ${ordering}` : `Bài kiểm tra thường xuyên ${ordering}`;
        const child: CoursePlanActivities = {
            course_id: this.selectedCourse.id,
            week: 1000,
            title,
            desc: null,
            video: null,
            files: null,
            ordering,
            status: 1,
            course_lesson_id: 0,
            parent_id: this.plan_kiemtra.id,
            type,
            desc_title: null,
            edit: 1,
            slides: null,
            exam_type: this.selectedCourse.params?.exam_type
        };
        const index = children.findIndex(item => item.ordering === ordering - 1);
        if (index === -1) children.push(child);
        else children.splice(index + 1, 0, child);
        if (this.selectedCourse.params?.exam_format === 'DUAN') this.plan_kiemtra.children = this.addDuan(children, type);
    }

    private getTestTypeByFormat(format: string): CoursePlanActivities['type'] {
        switch (format) {
            case 'DUAN': return 'THUONGXUYEN_DUAN';
            case 'THUCHANH': return 'THUONGXUYEN_TULUAN';
            case 'TRACNGHIEM': return 'THUONGXUYEN_TRACNGHIEM';
            default: return null;
        }
    }

    createTestTx(): void {
        if (!this.selectedCourse || !this.plan_kiemtra) return;
        const sotinchi = this.selectedCourse.params?.sotinchi;
        if (!sotinchi) {
            this.notificationService.toastWarning('Môn học này chưa được cài đặt số tín chỉ');
            return;
        }
        let maxTest = 1;
        if (key_server === 'ictu') maxTest = sotinchi;
        if (key_server === 'hvu' && Number(sotinchi) > 2) maxTest = 2;
        const children = this.plan_kiemtra.children || (this.plan_kiemtra.children = []);
        if (!children.length) {
            while (children.filter(item => item.ordering > 0 && item.ordering < 100).length < maxTest) this.addTestTx();
        }
        if (this.selectedCourse.params?.exam_format === 'DUAN') this.plan_kiemtra.children = this.addDuan(children, this.getTestTypeByFormat(this.selectedCourse.params.exam_format));
    }

    addDuan(data: CoursePlanActivities[], type: CoursePlanActivities['type']): CoursePlanActivities[] {
        if (!this.plan_kiemtra || !this.selectedCourse) return data;
        if (!data.some(item => item.ordering === 0)) data.unshift(this.createPlanItem('Danh sách dự án', 0, type));
        if (!data.some(item => item.ordering === 100)) data.push(this.createPlanItem('Thi kết thúc học phần', 100, type));
        return data;
    }

    private createPlanItem(title: string, ordering: number, type: CoursePlanActivities['type']): CoursePlanActivities {
        return {
            course_id: this.selectedCourse.id,
            week: 1000,
            title,
            desc: null,
            video: null,
            files: null,
            ordering,
            status: 1,
            course_lesson_id: 0,
            parent_id: this.plan_kiemtra.id,
            type,
            desc_title: null,
            edit: 1,
            slides: null,
            exam_type: this.selectedCourse.params?.exam_type
        };
    }

    async deleteItemKynang(item: CoursePlanActivities, index: number): Promise<void> {
        if (!this.plan_kiemtra || this.busy || !this.canEdit) return;
        if (!item.id) {
            this.plan_kiemtra.children.splice(index, 1);
            return;
        }
        const title = (item.title || '').replace(/<[^>]*>/g, '');
        const version = this.loadVersion;
        const confirmed = await firstValueFrom(this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa bài kiểm tra',
            htmlMessage: `<p class="m-0 f-roboto f-14 lh-base text-center">Bạn có chắc muốn xóa <b>${this.escapeHtml(title)}</b>?</p>`
        }));
        if (!confirmed || version !== this.loadVersion) return;
        await this.runOperation('Đang xóa bài kiểm tra...', async () => {
            await this.request(this.coursePlanActivitiesService.deleteCoursePlanActivities(item.id));
            await this.loadKiemtrathuongxuyen();
        }, 'Xóa thành công');
    }

    private escapeHtml(value: string): string {
        return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
    }

    async saveTestKynang(): Promise<void> {
        if (!this.plan_kiemtra?.children?.length || !this.canEdit) return;
        await this.runOperation('Đang lưu bài kiểm tra...', async () => {
            if (this.plan_kiemtra.children.filter(item => item.ordering > 0).length > 4) {
                this.notificationService.toastWarning('Số lượng bài kiểm tra tối đa là 4');
                return false;
            }
            if (this.plan_kiemtra.children.some(item => !item.type)) {
                this.notificationService.toastWarning('Vui lòng chọn loại kiểm tra');
                return false;
            }
            let parentId = this.plan_kiemtra.id;
            if (!parentId) {
                const parent = { ...this.plan_kiemtra };
                delete parent.children;
                parentId = await this.request(this.coursePlanActivitiesService.addCoursePlanActivities(parent));
                this.plan_kiemtra.id = parentId;
            }
            for (const item of this.plan_kiemtra.children) {
                const data = { ...item, parent_id: parentId };
                delete data.disabled_type;
                if (item.id) {
                    delete data.id;
                    await this.request(this.coursePlanActivitiesService.updateCoursePlanActivities(item.id, data));
                } else {
                    item.id = await this.request(this.coursePlanActivitiesService.addCoursePlanActivities(data));
                }
            }
            await this.loadKiemtrathuongxuyen();
            return true;
        }, 'Lưu thành công');
    }

    checkDeletePlan(ordering: number): boolean {
        const data = this.plan_kiemtra?.children?.filter(item => item.ordering > 0 && item.ordering < 100) || [];
        return data.length > 0 && ordering === Math.max(...data.map(item => item.ordering));
    }

    async loadConfig(): Promise<void> {
        if (!this.selectedCourse) return;
        await this.runOperation('Đang tải cấu hình...', async () => {
            const response = await this.request(this.courseConfigService.getCourseConfigByPageNew(this.condition('course_id', String(this.selectedCourse.id), '-1', true)));
            this.convertDataCourseConfig(response.data || []);
        }, 'Đã tải lại cấu hình');
    }

    convertDataCourseConfig(courseConfig: CourseConfig[]): void {
        const result: Record<string, CourseConfig[]> = {};
        if (courseConfig?.length) {
            courseConfig.forEach(item => (result[item.group] ||= []).push(item));
            this.course_config_object = result;
            return;
        }
        this.list_config.forEach(config => {
            const items: CourseConfig[] = [];
            if (config.config_key === 'PERCENT_SCORE_SUMMARY') {
                Object.keys(config.params || {}).forEach((key, index) => items.push({
                    course_id: this.selectedCourse.id, group: config.config_key, key,
                    title: this.getScoreTitle(key), ordering: index + 1, value: config.params[key]
                }));
                items.push({ course_id: this.selectedCourse.id, group: config.config_key, key: 'thi',
                    title: 'Kiểm tra kết thúc học phần', ordering: 4, value: 50 });
            } else if (config.config_key === 'NUMOF_TEST_CCTX') {
                Object.keys(config.params || {}).forEach((key, index) => items.push({
                    course_id: this.selectedCourse.id, group: config.config_key, key,
                    title: this.getTestCountTitle(key), ordering: index + 1, value: config.params[key]
                }));
            } else if (config.config_key === 'PRACTICE_TIME_FOR_A_TEST') {
                items.push({ course_id: this.selectedCourse.id, group: config.config_key, key: 'DEFAULT',
                    title: 'Thời hạn làm bài tính theo ngày (mặc định)', ordering: 0, value: config.value });
                const params = {};
                this.list_plan.forEach(plan => params[plan.week] = config.value);
                items.push({ course_id: this.selectedCourse.id, group: config.config_key, key: 'EXCEPT',
                    title: 'Thời hạn theo từng bài (ngày)', ordering: 1, value: 0, params });
                items.push({ course_id: this.selectedCourse.id, group: config.config_key, key: 'NUMOF_EXTDATE_FORTEST',
                    title: 'Tối đa số ngày cho phép gia hạn', ordering: 100, value: 7 });
                items.push({ course_id: this.selectedCourse.id, group: config.config_key, key: 'TIME_OF_TEST',
                    title: 'Thời gian làm bài luyện tập (phút)', ordering: 200, value: 15 });
            } else if (config.config_key === 'PERCENT_OF_LEAVE_ALLOWED') {
                items.push({ course_id: this.selectedCourse.id, group: config.config_key, key: 'DEFAULT',
                    title: 'Số ngày sinh viên được phép nghỉ (%)', ordering: 1, value: config.value });
            }
            result[config.config_key] = items;
        });
        this.course_config_object = result;
    }

    private getScoreTitle(key: string): string {
        if (key === 'cc') return 'Điểm chuyên cần';
        if (key === 'daugio') return 'Kiểm tra 15 phút';
        if (key === 'kynang') return this.isDttx ? 'Kiểm tra giữa kỳ' : 'Kiểm tra thường xuyên';
        if (key === 'bttn') return 'Luyện tập tại nhà';
        return key;
    }

    private getTestCountTitle(key: string): string {
        if (key === 'CC_TEST') return this.isDttx ? 'Luyện tập tại nhà' : 'Luyện tập tại nhà & Kiểm tra 15 phút';
        if (key === 'TX_TEST') return this.isDttx ? 'Kiểm tra giữa kỳ' : 'Kiểm tra thường xuyên';
        return key;
    }

    async saveCourseConfig(): Promise<void> {
        if (!this.canEdit) return;
        const requests: Observable<any>[] = [];
        Object.values(this.course_config_object).flat().forEach(item => {
            const data = { ...item };
            if (data.id) {
                const id = data.id;
                delete data.id;
                requests.push(this.courseConfigService.updateCourseConfig(id, data));
            } else {
                requests.push(this.courseConfigService.addCourseConfig(data));
            }
        });
        if (!requests.length) return;
        await this.runOperation('Đang lưu cấu hình học phần...', async () => {
            await this.request(forkJoin(requests));
            await this.loadConfigWithoutOperation();
        }, 'Cập nhật thành công');
    }

    private async loadConfigWithoutOperation(): Promise<void> {
        const response = await this.request(this.courseConfigService.getCourseConfigByPageNew(this.condition('course_id', String(this.selectedCourse.id), '-1', true)));
        this.convertDataCourseConfig(response.data || []);
    }

    pointQuestionKeyDown(event: KeyboardEvent): void {
        if (event.ctrlKey || event.metaKey || event.altKey || /^[0-9]$/.test(event.key)
            || ['Backspace', 'Delete', 'Tab', 'Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
    }

    sanitizeNumericValue(event: Event, item: CourseConfig, week?: number): void {
        const input = event.target as HTMLInputElement;
        const value = input.value.replace(/\D/g, '');
        if (input.value !== value) input.value = value;
        if (week === undefined) item.value = value ? Number(value) : null;
        else {
            item.params ||= {};
            item.params[week] = value ? Number(value) : null;
        }
    }

    onChangeValueInput(item: CourseConfig): void {
        if (item.key !== 'DEFAULT') return;
        const except = this.course_config_object['PRACTICE_TIME_FOR_A_TEST']?.find(config => config.key === 'EXCEPT');
        if (!except) return;
        except.params ||= {};
        this.list_plan.forEach(plan => except.params[plan.week] = item.value);
    }
}
