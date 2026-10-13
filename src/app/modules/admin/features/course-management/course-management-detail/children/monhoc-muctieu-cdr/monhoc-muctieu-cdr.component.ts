import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Drawer } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { Observable, Subject, distinctUntilChanged, firstValueFrom, forkJoin, map, takeUntil } from 'rxjs';
import { SafeHtmlDecodePipe } from '@modules/shared/pipes/safe-html-decode';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core-new/service/notification.service';
import { OvicQueryCondition } from '@core/models/dto';
import { SharedModule } from '@modules/shared/shared.module';
import { ShowLabelData } from '@modules/shared/pipes/show-label-data.pipe';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CourseMuctieuChitiet } from '@modules/shared/models/course-muctieu-chitiet';
import { CourseClo } from '@modules/shared/models/course-clo';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtCdr } from '@modules/shared/models/ctdt-cdr';
import { ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { CourseMuctieuChitietService } from '@modules/shared/services/course-muctieu-chitiet.service';
import { CourseCloService } from '@modules/shared/services/course-clo.service';
import { CourseCloContributeService } from '@modules/shared/services/course-clo-contribute.service';
import { CtdtHocphanService } from '@modules/shared/services/ctdt-hocphan.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { CtdtCdrService } from '@modules/shared/services/ctdt-cdr.service';

interface CtdtCdrExtend extends CtdtCdr {
    items?: CtdtCdr[];
}

@Component({
    selector: 'app-monhoc-muctieu-cdr',
    standalone: true,
    imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule, TableModule,
        ShowLabelData, SafeHtmlDecodePipe, MatButtonModule, Drawer, LoadingProgressComponent],
    templateUrl: './monhoc-muctieu-cdr.component.html',
    styleUrls: ['./monhoc-muctieu-cdr.component.css']
})
export class MonhocMuctieuCdrComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly notificationService = inject(NotificationService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);
    private readonly helperService = inject(HelperService);
    private readonly elnKhoaHocService = inject(ElnKhoaHocService);
    private readonly elngUserProfileService = inject(ElngUserProfileService);
    private readonly courseMuctieuChitietService = inject(CourseMuctieuChitietService);
    private readonly courseCloService = inject(CourseCloService);
    private readonly courseCloContributeService = inject(CourseCloContributeService);
    private readonly ctdtHocphanService = inject(CtdtHocphanService);
    private readonly ctdtService = inject(CtdtService);
    private readonly ctdtCdrService = inject(CtdtCdrService);
    private readonly cancelLoad$ = new Subject<void>();
    private loadVersion = 0;

    readonly state = signal<AppState>('loading');
    readonly isSaving = signal(false);
    readonly errorMessage = signal('');
    readonly generalObjectiveControl = new FormControl('', { nonNullable: true });
    readonly editingGoalId = signal<number | null>(null);
    @ViewChild('goalEditor') goalEditor?: ElementRef<HTMLTextAreaElement>;
    loadingHeading = 'Đang tải mục tiêu và chuẩn đầu ra...';
    piDrawerVisible = false;

    selectedCourse: ElnKhoaHoc | null = null;
    list_course_muctieu: CourseMuctieuChitiet[] = [];
    list_course_clo: CourseClo[] = [];
    list_ctdt: Ctdt[] = [];
    list_ctdt_cdr: CtdtCdrExtend[] = [];
    selectedClo: CourseClo | null = null;
    selectedCtdt: Ctdt | null = null;
    selectedStates: Record<number, boolean> = {};

    readonly isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt]
        .some(role => this.auth.userHasRole(role));
    readonly routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/monhoc-muctieu');
    readonly routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/monhoc-muctieu');
    readonly routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/monhoc-muctieu');
    readonly userId = this.auth.user.id;

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

    private request<T>(source: Observable<T>): Promise<T> {
        return firstValueFrom(source.pipe(takeUntil(this.cancelLoad$), takeUntilDestroyed(this.destroyRef)));
    }

    private async loadData(code: string | null): Promise<void> {
        const version = ++this.loadVersion;
        this.cancelLoad$.next();
        this.isSaving.set(false);
        this.closeForm();
        this.selectedCourse = null;
        this.list_ctdt = [];
        this.list_ctdt_cdr = [];
        this.errorMessage.set('');
        this.loadingHeading = 'Đang tải mục tiêu và chuẩn đầu ra...';
        this.state.set('loading');
        if (!code || !Number.isSafeInteger(Number(code)) || Number(code) <= 0) {
            this.errorMessage.set('ID học phần không hợp lệ.');
            this.state.set('error');
            return;
        }

        try {
            const courseCondition = this.condition('id', code, '1');
            if (this.routerGiangvien) {
                courseCondition.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal,
                    value: String(this.userId), orWhere: 'and' });
            }
            const [course, profile, goals, clos, links] = await this.request(forkJoin([
                this.elnKhoaHocService.getKhoaHocByPageNew_2(courseCondition),
                this.elngUserProfileService.getUserProfileByPageNewV2(this.condition('user_id', String(this.userId), '1')),
                this.courseMuctieuChitietService.getCourseMuctieuChitietByPageNew(this.condition('course_id', code, '-1', true)),
                this.courseCloService.getCourseCloByPageNew(this.condition('course_id', code, '-1', true)),
                this.ctdtHocphanService.getCtdtHocphanByPageNew(this.condition('course_id', code, '-1', true))
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
                this.state.set('error');
                this.errorMessage.set('Không có quyền truy cập học phần.');
                void this.router.navigate(['/admin/content-none']);
                return;
            }
            this.selectedCourse = selected;
            this.generalObjectiveControl.setValue(selected.muctieu || '');
            this.list_course_muctieu = goals.data || [];
            this.list_course_clo = clos.data || [];
            const ids = links.data.map(item => item.ctdt_id);
            if (ids.length) {
                const programmeCondition: ConditionOption = {
                    condition: [], set: [{ label: 'limit', value: '-1' }, { label: 'include', value: ids.toString() },
                        { label: 'include_by', value: 'id' }], page: null
                };
                const cdrCondition: ConditionOption = {
                    condition: [], set: [{ label: 'limit', value: '-1' }, { label: 'include', value: ids.toString() },
                        { label: 'include_by', value: 'ctdt_id' }, { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }], page: null
                };
                const [programmes, cdrs] = await this.request(forkJoin([
                    this.ctdtService.getCtdtByPageNew(programmeCondition),
                    this.ctdtCdrService.getCtdtCdrByPageNew(cdrCondition)
                ]));
                if (this.destroyRef.destroyed || version !== this.loadVersion) return;
                this.list_ctdt_cdr = cdrs.data;
                this.list_ctdt_cdr.forEach(cdr => cdr['kyhieu_number'] = (cdr.kyhieu || '').replace(/\D/gi, ''));
                const parents = this.list_ctdt_cdr.filter(cdr => cdr.parent_id === 0);
                parents.forEach(parent => parent.items = this.list_ctdt_cdr.filter(cdr => cdr.parent_id === parent.id));
                this.list_ctdt = programmes.data;
                this.list_ctdt.forEach(ctdt => ctdt['ctdt_cdr'] = parents.filter(cdr => cdr.ctdt_id === ctdt.id));
            }
            await this.loadCourseCloPi();
            if (!this.destroyRef.destroyed && version === this.loadVersion) this.state.set('success');
        } catch {
            if (this.destroyRef.destroyed || version !== this.loadVersion) return;
            this.errorMessage.set('Không thể tải mục tiêu và chuẩn đầu ra. Vui lòng thử lại.');
            this.state.set('error');
        }
    }

    private async runOperation(heading: string, action: () => Promise<void>, successMessage: string): Promise<void> {
        if (this.isSaving() || this.state() !== 'success' || !this.selectedCourse) return;
        const version = this.loadVersion;
        this.loadingHeading = heading;
        this.isSaving.set(true);
        try {
            await action();
            if (!this.destroyRef.destroyed && version === this.loadVersion) this.notificationService.toastSuccess(successMessage);
        } catch {
            if (!this.destroyRef.destroyed && version === this.loadVersion) this.notificationService.toastError('Thao tác thất bại. Vui lòng thử lại.');
        } finally {
            if (!this.destroyRef.destroyed && version === this.loadVersion) this.isSaving.set(false);
        }
    }

    async loadMuctieu(): Promise<void> {
        const response = await this.request(this.courseMuctieuChitietService.getCourseMuctieuChitietByPageNew(
            this.condition('course_id', String(this.selectedCourse.id), '-1', true)));
        this.list_course_muctieu = response.data || [];
    }

    async loadCoureClo(): Promise<void> {
        const response = await this.request(this.courseCloService.getCourseCloByPageNew(
            this.condition('course_id', String(this.selectedCourse.id), '-1', true)));
        this.list_course_clo = response.data || [];
        await this.loadCourseCloPi();
    }

    async loadCourseCloPi(): Promise<void> {
        const response = await this.request(this.courseCloContributeService.getCourseCloContributeByPageNew(
            this.condition('course_id', String(this.selectedCourse.id))));
        this.list_course_clo.forEach(clo => {
            const links = response.data.filter(link => link.course_clo_id === clo.id);
            const pis = this.list_ctdt_cdr.filter(pi => links.some(link => link.ctdt_cdr_id === pi.id));
            this.list_ctdt.forEach(ctdt => {
                clo['ctdt_cdr_' + ctdt.id] = this.helperService.sort(pis.filter(pi => pi.ctdt_id === ctdt.id), 'kyhieu_number');
            });
        });
    }

    saveMucTieuChung(value: string): void {
        void this.runOperation('Đang lưu mục tiêu chung...', async () => {
            await this.request(this.elnKhoaHocService.updateElnKhoaHoc(this.selectedCourse.id, { muctieu: value }));
            this.selectedCourse.muctieu = value;
        }, 'Lưu thành công');
    }

    addMuctieu(): void {
        void this.runOperation('Đang thêm mục tiêu...', async () => {
            const ordering = this.list_course_muctieu.length + 1;
            await this.request(this.courseMuctieuChitietService.addCourseMuctieuChitiet({
                ordering, kyhieu: 'CO' + ordering, course_id: this.selectedCourse.id
            }));
            await this.loadMuctieu();
        }, 'Thêm thành công');
    }

    async deleteCourseMuctieuchitiet(goal: CourseMuctieuChitiet): Promise<void> {
        if (this.isSaving()) return;
        const version = this.loadVersion;
        const confirmed = await firstValueFrom(this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa mục tiêu',
            htmlMessage: `<p class="m-0 f-roboto f-14 lh-base text-center">Bạn có chắc muốn xóa mục tiêu <b>${goal.kyhieu}</b>?</p>`
        }));
        if (!confirmed || this.destroyRef.destroyed || version !== this.loadVersion) return;
        await this.runOperation('Đang xóa mục tiêu...', async () => {
            const requests: Observable<any>[] = [this.courseMuctieuChitietService.deleteCourseMuctieuChitiet(goal.id)];
            let ordering = goal.ordering;
            this.list_course_muctieu.filter(item => item.ordering > goal.ordering).forEach(item => {
                requests.push(this.courseMuctieuChitietService.updateCourseMuctieuChitiet(item.id, { ordering, kyhieu: 'CO' + ordering }));
                ordering++;
            });
            await this.request(forkJoin(requests));
            await this.loadMuctieu();
        }, 'Xóa thành công');
    }

    editMuctieu(goal: CourseMuctieuChitiet): void {
        if (this.isSaving()) return;
        this.editingGoalId.set(goal.id);
        setTimeout(() => {
            const editor = this.goalEditor?.nativeElement;
            if (!editor) return;
            editor.focus();
            editor.style.height = 'auto';
            editor.style.height = editor.scrollHeight + 'px';
        });
    }

    finishEditMuctieu(): void {
        this.editingGoalId.set(null);
    }

    saveMuctieuChitiet(): void {
        if (!this.list_course_muctieu.length) return;
        void this.runOperation('Đang lưu mục tiêu chi tiết...', async () => {
            await this.request(forkJoin(this.list_course_muctieu.map((goal, index) =>
                this.courseMuctieuChitietService.updateCourseMuctieuChitiet(goal.id, {
                    noidung: goal.noidung, ordering: index + 1, kyhieu: 'CO' + (index + 1)
                }))));
            await this.loadMuctieu();
        }, 'Lưu thành công');
    }

    addClo(): void {
        void this.runOperation('Đang thêm chuẩn đầu ra...', async () => {
            const ordering = this.list_course_clo.length + 1;
            await this.request(this.courseCloService.addCourseClo({ ordering, kyhieu: 'CLO' + ordering, course_id: this.selectedCourse.id }));
            await this.loadCoureClo();
        }, 'Thêm thành công');
    }

    saveClo(): void {
        if (!this.list_course_clo.length) return;
        void this.runOperation('Đang lưu chuẩn đầu ra...', async () => {
            await this.request(forkJoin(this.list_course_clo.map((clo, index) => this.courseCloService.updateCourseClo(clo.id, {
                noidung: clo.noidung, ordering: index + 1, kyhieu: 'CLO' + (index + 1),
                course_muctieu_chitiet_id: clo.course_muctieu_chitiet_id
            }))));
            await this.loadCoureClo();
        }, 'Lưu thành công');
    }

    async deleteClo(clo: CourseClo): Promise<void> {
        if (this.isSaving()) return;
        const version = this.loadVersion;
        const confirmed = await firstValueFrom(this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa chuẩn đầu ra',
            htmlMessage: `<p class="m-0 f-roboto f-14 lh-base text-center">Bạn có chắc muốn xóa chuẩn đầu ra <b>${clo.kyhieu}</b>?</p>`
        }));
        if (!confirmed || this.destroyRef.destroyed || version !== this.loadVersion) return;
        await this.runOperation('Đang xóa chuẩn đầu ra...', async () => {
            const requests: Observable<any>[] = [this.courseCloService.deleteCourseClo(clo.id)];
            let ordering = clo.ordering;
            this.list_course_clo.filter(item => item.ordering > clo.ordering).forEach(item => {
                requests.push(this.courseCloService.updateCourseClo(item.id, { ordering, kyhieu: 'CLO' + ordering }));
                ordering++;
            });
            await this.request(forkJoin(requests));
            await this.loadCoureClo();
        }, 'Xóa thành công');
    }

    autoResize(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    blockArrowKeys(event: KeyboardEvent): void {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(event.key)) event.stopPropagation();
    }

    chooseMuctieuForClo(clo: CourseClo, goal: CourseMuctieuChitiet): void {
        if (!this.isSaving()) clo.course_muctieu_chitiet_id = goal.id;
    }

    openLayoutCtdtCdr(clo: CourseClo, ctdt: Ctdt): void {
        if (this.isSaving()) return;
        this.selectedClo = clo;
        this.selectedCtdt = ctdt;
        this.selectedStates = {};
        (clo['ctdt_cdr_' + ctdt.id] || []).forEach(pi => this.selectedStates[pi.id] = true);
        this.piDrawerVisible = true;
    }

    closeForm(): void {
        this.piDrawerVisible = false;
        this.onHideOp();
    }

    onHideOp(): void {
        this.selectedClo = null;
        this.selectedCtdt = null;
    }

    toggleAllChildren(plo: CtdtCdrExtend, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        (plo.items || []).forEach(pi => this.selectedStates[pi.id] = checked);
        this.addToClo();
    }

    onItemSelect(): void {
        this.addToClo();
    }

    isAllSelected(plo: CtdtCdrExtend): boolean {
        return !!plo.items?.length && plo.items.every(pi => this.selectedStates[pi.id]);
    }

    isIndeterminate(plo: CtdtCdrExtend): boolean {
        const count = (plo.items || []).filter(pi => this.selectedStates[pi.id]).length;
        return count > 0 && count < (plo.items?.length || 0);
    }

    addToClo(): void {
        if (!this.selectedClo || !this.selectedCtdt) return;
        const pis = (this.selectedCtdt['ctdt_cdr'] || []).flatMap(plo => (plo.items || []).filter(pi => this.selectedStates[pi.id]));
        this.selectedClo['ctdt_cdr_' + this.selectedCtdt.id] = this.helperService.sort(pis, 'kyhieu_number');
    }

    savePiOnClo(): void {
        const requests: Observable<any>[] = [];
        this.list_course_clo.forEach(clo => this.list_ctdt.forEach(ctdt => {
            (clo['ctdt_cdr_' + ctdt.id] || []).forEach(pi => requests.push(this.courseCloContributeService.addCourseCloContribute({
                course_id: this.selectedCourse.id, course_clo_id: clo.id, ctdt_id: ctdt.id,
                ctdt_cdr_parent_id: pi.parent_id, ctdt_cdr_id: pi.id
            })));
        }));
        if (!requests.length) {
            this.notificationService.toastWarning('Không tìm thấy PI');
            return;
        }
        void this.runOperation('Đang lưu liên kết CLO – PI...', async () => {
            await this.request(this.courseCloContributeService.deleteCourseCloContributeByCol(String(this.selectedCourse.id), 'course_id'));
            for (let index = 0; index < requests.length; index++) {
                await this.request(requests[index]);
                this.loadingHeading = `Đang lưu liên kết CLO – PI (${index + 1}/${requests.length})...`;
            }
            this.closeForm();
            await this.loadCourseCloPi();
        }, 'Lưu thành công');
    }
}
