import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, WritableSignal, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Observable, Subject as RxSubject, concatMap, finalize, forkJoin, from, map, of, switchMap, takeUntil, tap, toArray } from 'rxjs';
import { IctuPaginatorComponent } from '@core-new/components/ictu-paginator/ictu-paginator.component';
import { IctuPaginatorControl } from '@core-new/components/ictu-paginator/ictu-paginator-control';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { IctuDataTable2 } from '@core-new/models/datatable';
import { IctuFormControl2 } from '@core-new/models/ictu-form-control';
import { IctuDeletingAnimationControl } from '@core-new/models/ictu-deleting-animation-control';
import { NotificationService } from '@core-new/service/notification.service';
import { OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { ROUTERS } from '@modules/shared/utils/syscat';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { DonVi } from '@modules/shared/models/don-vi';
import { Subject } from '@modules/shared/models/subject';
import { SubjectCourseExtend } from '@modules/shared/models/subject-course';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { BoCtdtService } from '@modules/shared/services/bo-ctdt.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { SubjectService } from '@modules/shared/services/subject.service';
import { SubjectCourseService } from '@modules/shared/services/subject-course.service';
import { BoCtdtCdrComponent } from './bo-ctdt-cdr/bo-ctdt-cdr.component';
import { BoCtdtPeoComponent } from './bo-ctdt-peo/bo-ctdt-peo.component';

@Component({
    selector: 'app-bo-ctdt',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, Drawer, InputText, Tooltip, MultiSelectModule,
        Select, MatButton, IctuPaginatorComponent, LoadingProgressComponent, BoCtdtCdrComponent, BoCtdtPeoComponent],
    templateUrl: './bo-ctdt.component.html',
    styleUrl: './bo-ctdt.component.css'
})
export class BoCtdtComponent implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly boService = inject(BoCtdtService);
    private readonly donViService = inject(DonViService);
    private readonly profileService = inject(ElngUserProfileService);
    private readonly subjectService = inject(SubjectService);
    private readonly subjectCourseService = inject(SubjectCourseService);
    private readonly courseService = inject(ElnKhoaHocService);
    private readonly helper = inject(HelperService);
    private readonly notification = inject(NotificationService);
    private readonly destroy$ = new RxSubject<void>();
    private readonly cancelLoad$ = new RxSubject<void>();
    private readonly cancelProfile$ = new RxSubject<void>();
    private readonly cancelSubject$ = new RxSubject<void>();
    private readonly cancelDepartments$ = new RxSubject<void>();
    private readonly pendingCourseIds = new Map<string, number>();
    private readonly selectedSubjectData = new Map<number, Subject>();
    private facultyCategoryId: number | null = null;
    private subjectSession = 0;
    private appliedSubjectSearch = '';
    private requestedSubjectPage = 1;
    private pendingSubjectSelection: ReadonlySet<number> | null = null;
    private requestedPage = 1;
    private destroyed = false;
    private readonly departmentTitles = new Map<number, string>();
    readonly selectedTemplateBo = signal<BoCtdt | null>(null);
    readonly selectedPeoBo = signal<BoCtdt | null>(null);

    readonly drawer = viewChild<Drawer>('drawer');
    readonly table = new IctuDataTable2<BoCtdt>({ rows: 20, pageLinkSize: 5 });
    readonly subjectPaginator = new IctuPaginatorControl({ rows: 15, pageLinkSize: 5, showFirstLastIcon: true });
    readonly state: WritableSignal<AppState> = signal('loading');
    readonly saving: WritableSignal<boolean> = signal(false);
    readonly deleting: WritableSignal<boolean> = signal(false);
    readonly formLoading: WritableSignal<boolean> = signal(false);
    readonly formLoadError: WritableSignal<boolean> = signal(false);
    readonly nameSearch = signal('');
    private appliedNameSearch = '';
    readonly facultyFilter = signal<number | null>(null);
    readonly subjectDrawerBo = signal<BoCtdt | null>(null);
    readonly subjectDrawerVisible: WritableSignal<boolean> = signal(false);
    readonly subjects = signal<Subject[]>([]);
    readonly subjectRelations = signal<SubjectCourseExtend[]>([]);
    readonly selectedSubjectIds = signal<ReadonlySet<number>>(new Set<number>());
    readonly subjectSearch = signal('');
    readonly subjectLoading: WritableSignal<boolean> = signal(false);
    readonly subjectSaving: WritableSignal<boolean> = signal(false);
    readonly subjectRelationsReady: WritableSignal<boolean> = signal(false);
    readonly subjectError = signal('');
    readonly subjectSaveError = signal('');
    readonly boForm = this.fb.group({
        name: ['', [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(255)]],
        code: ['', [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(50)]],
        year: [null as number | null, [Validators.required, Validators.pattern(/^[0-9]{4}$/), Validators.min(1900), Validators.max(9999)]],
        category_ids: [[] as number[], Validators.required]
    });
    readonly formControl = new IctuFormControl2<BoCtdt>({
        dropdownFields: [], formGroup: this.boForm, objectName: 'bộ chương trình đào tạo', drawer: this.drawer
    });
    readonly isFacultyRoute = this.auth.hasRouter(ROUTERS.lanhdao_khoa) && !this.auth.hasRouter(ROUTERS.daotao);
    boFormDonVi: DonVi[] = [];
    canAdd = false;
    canUpdate = false;
    canDelete = false;
    canSelectSubjects = false;

    ngOnInit(): void {
        this.checkPermissions();
        this.loadFormDonVi();
        this.loadBoCtdt(1, true);
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        [this.destroy$, this.cancelLoad$, this.cancelProfile$, this.cancelSubject$, this.cancelDepartments$]
            .forEach(subject => { subject.next(); subject.complete(); });
    }

    private checkPermissions(): void {
        const path = this.router.url.split('?')[0].replace(/^\/admin\//, '');
        this.canAdd = this.auth.userCanAdd(path) || this.auth.userCanAdd('bo-ctdt');
        this.canUpdate = this.auth.userCanEdit(path) || this.auth.userCanEdit('bo-ctdt');
        this.canDelete = this.auth.userCanDelete(path) || this.auth.userCanDelete('bo-ctdt');
        this.canSelectSubjects = this.isFacultyRoute || this.canUpdate;
        if (this.isFacultyRoute) {
            this.canAdd = false;
            this.canUpdate = false;
            this.canDelete = false;
        }
    }

    onNameSearch(event: Event): void { this.nameSearch.set((event.target as HTMLInputElement).value); }
    search(): void {
        this.appliedNameSearch = this.nameSearch().trim();
        this.loadBoCtdt(1, true);
    }

    onFacultyFilter(value: number | null): void {
        if (this.isFacultyRoute) return;
        this.facultyFilter.set(value ? Number(value) : null);
        this.loadBoCtdt(1, true);
    }

    private loadFacultyProfile(page: number, resetPaginator: boolean): void {
        this.state.set('loading');
        this.cancelProfile$.next();
        const option: ConditionOption = {
            condition: [{ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: String(this.auth.user?.id), orWhere: 'and' }],
            set: [{ label: 'limit', value: '1' }], page: null
        };
        this.profileService.getUserProfileByPageNewV2(option).pipe(
            takeUntil(this.cancelProfile$), takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                const id = Number(response.data?.[0]?.donvi_chuyenmon_id);
                if (!Number.isInteger(id) || id < 1) {
                    this.state.set('error');
                    this.notification.toastWarning('Tài khoản chưa được phân vào Khoa.');
                    return;
                }
                this.facultyCategoryId = id;
                this.facultyFilter.set(id);
                this.loadBoCtdt(page, resetPaginator);
            },
            error: () => {
                this.state.set('error');
                this.notification.toastError('Không thể tải thông tin Khoa', 'Lỗi kết nối');
            }
        });
    }

    loadBoCtdt(page = 1, resetPaginator = false): void {
        this.requestedPage = page;
        if (this.isFacultyRoute && !this.facultyCategoryId) {
            this.loadFacultyProfile(page, resetPaginator);
            return;
        }
        this.state.set('loading');
        const conditions: OvicConditionParam[] = [];
        const faculty = this.isFacultyRoute ? this.facultyCategoryId : this.facultyFilter();
        if (faculty) conditions.push({ conditionName: 'category_ids', condition: OvicQueryCondition.like, value: `%${faculty}%`, orWhere: 'and' });
        if (this.appliedNameSearch) conditions.push({ conditionName: 'name', condition: OvicQueryCondition.like, value: `%${this.appliedNameSearch}%`, orWhere: 'and' });
        this.cancelLoad$.next();
        this.boService.get(conditions, {
            limit: this.table.paginator.rows(), paged: page, orderby: 'created_at', order: 'DESC'
        }).pipe(takeUntil(this.cancelLoad$), takeUntil(this.destroy$)).subscribe({
            next: response => {
                const total = Number(response.totalRecords) || 0;
                this.table.fillRawData({ data: response.data || [], recordsFiltered: total, recordsTotal: total, draw: 1 }, { paged: page, resetPaginator });
                this.state.set('success');
            },
            error: () => {
                this.state.set('error');
                this.notification.toastError('Không thể tải danh sách bộ CTĐT', 'Lỗi kết nối');
            }
        });
    }

    retryLoad(): void { this.loadBoCtdt(this.requestedPage, false); }
    onPageChange(page: number): void { this.loadBoCtdt(page); }

    private normalizeCategoryIds(value: unknown): number[] {
        const raw: unknown[] = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
        return [...new Set(raw.map(Number).filter(id => Number.isInteger(id) && id > 0))];
    }

    departmentNames(bo: BoCtdt): string {
        return this.normalizeCategoryIds(bo.category_ids).map(id => this.departmentTitles.get(id) || `Khoa #${id}`).join(', ') || '—';
    }

    uppercaseCodeInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const original = input.value;
        const upper = original.toUpperCase();
        if (original === upper) return;
        const start = input.selectionStart ?? original.length;
        const end = input.selectionEnd ?? start;
        input.value = upper;
        this.boForm.controls.code.setValue(upper);
        input.setSelectionRange(original.slice(0, start).toUpperCase().length, original.slice(0, end).toUpperCase().length);
    }

    private loadFormDonVi(): void {
        if (this.boFormDonVi.length || this.formLoading()) return;
        this.formLoading.set(true);
        this.formLoadError.set(false);
        this.cancelDepartments$.next();
        const option: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: String(this.auth.user?.donvi_id), orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'title' }, { label: 'order', value: 'ASC' }], page: null
        };
        this.donViService.getDonviByPageNew(option).pipe(
            takeUntil(this.cancelDepartments$), takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                this.boFormDonVi = (response.data || []).map(unit => ({ ...unit, id: Number(unit.id) }));
                this.departmentTitles.clear();
                this.boFormDonVi.forEach(unit => this.departmentTitles.set(unit.id, unit.title));
                this.formLoading.set(false);
            },
            error: () => {
                this.formLoading.set(false);
                this.formLoadError.set(true);
                this.notification.toastError('Không thể tải danh mục Khoa', 'Lỗi kết nối');
            }
        });
    }

    retryFormDonVi(): void {
        if (this.formLoading()) return;
        this.boFormDonVi = [];
        this.loadFormDonVi();
    }

    openCreate(): void {
        if (!this.canAdd || this.saving() || this.deleting()) return;
        this.boForm.reset({ name: '', code: '', year: null, category_ids: [] });
        this.formControl.openFormAdd();
        this.loadFormDonVi();
    }

    openEdit(item: BoCtdt): void {
        if (!this.canUpdate || this.saving() || this.deleting()) return;
        this.boForm.reset({ name: item.name || '', code: item.code || '', year: Number(item.year) || null, category_ids: this.normalizeCategoryIds(item.category_ids) });
        this.formControl.openFormEdit(item);
        this.loadFormDonVi();
    }

    closeForm(): void {
        if (!this.saving()) this.formControl.visible = false;
    }

    submitForm(): void {
        if ((this.formControl.isFormAdd ? !this.canAdd : !this.canUpdate) || this.saving() || this.deleting()) return;
        this.boForm.markAllAsTouched();
        const value = this.boForm.getRawValue();
        const categoryIds = this.normalizeCategoryIds(value.category_ids);
        if (this.boForm.invalid || !categoryIds.length || this.formLoading() || this.formLoadError()) {
            this.notification.toastWarning('Vui lòng kiểm tra lại các trường bắt buộc');
            return;
        }
        const payload: Partial<BoCtdt> = { name: value.name.trim(), code: value.code.trim(), year: Number(value.year), category_ids: categoryIds };
        const request$ = this.formControl.isFormAdd ? this.boService.create(payload) : this.boService.update(this.formControl.object.id, payload);
        this.saving.set(true);
        request$.pipe(takeUntil(this.destroy$), finalize(() => this.saving.set(false))).subscribe({
            next: () => {
                this.formControl.visible = false;
                this.notification.toastSuccess('Đã lưu bộ CTĐT', 'Thành công');
                this.loadBoCtdt(this.table.paginator.paged());
            },
            error: () => this.notification.toastError('Không thể lưu bộ CTĐT. Dữ liệu nhập được giữ lại.', 'Lỗi thao tác')
        });
    }

    delete(item: BoCtdt): void {
        if (!this.canDelete || this.saving() || this.deleting()) return;
        const page = this.table.paginator.paged();
        const safeTitle = (item.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.notification.confirmDelete2({
            heading: 'Xác nhận xóa', htmlMessage: `Bạn có chắc muốn xóa bộ chương trình đào tạo &quot;${safeTitle}&quot;?`
        }).pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
            if (!confirmed || !this.canDelete || this.saving() || this.deleting() || this.destroyed) return;
            this.deleting.set(true);
            const controller = new IctuDeletingAnimationControl([item.id], this.boService);
            this.notification.startDeleting(controller.progress).pipe(
                takeUntil(this.destroy$), finalize(() => this.deleting.set(false))
            ).subscribe({
                next: success => {
                    if (!success) {
                        this.notification.toastError('Xóa bộ CTĐT thất bại', 'Lỗi thao tác');
                        return;
                    }
                    this.notification.toastSuccess('Xóa bộ CTĐT thành công', 'Thành công');
                    const nextPage = this.table.data().length === 1 && page > 1 ? page - 1 : page;
                    this.loadBoCtdt(nextPage);
                },
                error: () => this.notification.toastError('Xóa bộ CTĐT thất bại', 'Lỗi thao tác')
            });
            controller.run();
        });
    }

    openCdrTemplate(item: BoCtdt): void {
        if (this.saving() || this.deleting() || this.subjectSaving()) return;
        this.selectedTemplateBo.set(item);
    }

    closeCdrTemplate(): void {
        this.selectedTemplateBo.set(null);
    }

    openPeo(item: BoCtdt): void {
        if (this.saving() || this.deleting() || this.subjectSaving()) return;
        this.selectedPeoBo.set(item);
    }

    closePeo(): void {
        this.selectedPeoBo.set(null);
    }

    openPrograms(item: BoCtdt): void {
        const route = this.isFacultyRoute ? 'lanhdao-khoa' : 'dao-tao';
        this.router.navigate([`/admin/${route}/chuongtrinh-daotao`], { queryParams: { bo_id: item.id } });
    }

    openSubjectDrawer(bo: BoCtdt): void {
        if (!this.canSelectSubjects || this.subjectSaving() || this.saving() || this.deleting()) return;
        this.cancelSubject$.next();
        ++this.subjectSession;
        this.subjectDrawerBo.set(bo);
        this.subjectRelations.set([]);
        this.subjects.set([]);
        this.selectedSubjectData.clear();
        this.selectedSubjectIds.set(new Set<number>());
        this.subjectSearch.set('');
        this.appliedSubjectSearch = '';
        this.subjectError.set('');
        this.subjectSaveError.set('');
        this.subjectRelationsReady.set(false);
        this.pendingSubjectSelection = null;
        this.subjectPaginator.reset(0);
        this.subjectDrawerVisible.set(true);
        this.loadSubjectPicker(1);
    }

    closeSubjectDrawer(): void {
        if (this.subjectSaving()) return;
        this.subjectDrawerVisible.set(false);
        this.onSubjectDrawerHide();
    }

    onSubjectDrawerHide(): void {
        if (this.subjectDrawerVisible() || this.subjectSaving()) return;
        this.cancelSubject$.next();
        ++this.subjectSession;
        this.subjectLoading.set(false);
        this.subjectRelationsReady.set(false);
        this.subjectDrawerBo.set(null);
        this.pendingSubjectSelection = null;
        this.selectedSubjectData.clear();
    }

    onSubjectSearch(event: Event): void { this.subjectSearch.set((event.target as HTMLInputElement).value); }

    searchSubjects(): void {
        if (this.subjectSaving()) return;
        this.appliedSubjectSearch = this.subjectSearch().trim();
        this.loadSubjectPicker(1, this.selectedSubjectIds());
    }

    retrySubjectLoad(): void {
        this.loadSubjectPicker(this.requestedSubjectPage, this.subjectRelationsReady() ? null : this.selectedSubjectIds());
    }

    private subjectConditions(): OvicConditionParam[] {
        const query = this.appliedSubjectSearch;
        return query ? ['name', 'code'].map(conditionName => ({
            conditionName, condition: OvicQueryCondition.like, value: `%${query}%`, orWhere: 'or'
        })) : [];
    }

    loadSubjectPicker(page: number, preservedSelectedIds: ReadonlySet<number> | null = null): void {
        const bo = this.subjectDrawerBo();
        if (!bo || !this.subjectDrawerVisible() || this.subjectSaving()) return;
        const session = this.subjectSession;
        const loadRelations = !this.subjectRelationsReady();
        this.pendingSubjectSelection = preservedSelectedIds ? new Set(preservedSelectedIds) : null;
        this.cancelSubject$.next();
        this.subjectLoading.set(true);
        this.subjectError.set('');
        this.requestedSubjectPage = page;
        forkJoin({
            relations: loadRelations ? this.subjectCourseService.getByBoCtdt(bo.id).pipe(map(response => response.data || [])) : of(null),
            subjects: this.subjectService.get(this.subjectConditions(), {
                limit: this.subjectPaginator.rows(), paged: page, orderby: 'name', order: 'ASC'
            })
        }).pipe(takeUntil(this.cancelSubject$), takeUntil(this.destroy$)).subscribe({
            next: response => {
                if (session !== this.subjectSession) return;
                if (loadRelations) {
                    const relations = response.relations || [];
                    this.subjectRelations.set(relations);
                    this.selectedSubjectIds.set(this.pendingSubjectSelection
                        ? new Set(this.pendingSubjectSelection)
                        : new Set(relations.map(relation => Number(relation.subject_id))));
                    this.pendingSubjectSelection = null;
                    this.subjectRelationsReady.set(true);
                }
                const subjects = response.subjects.data || [];
                subjects.forEach(subject => this.selectedSubjectData.set(Number(subject.id), subject));
                this.subjects.set(subjects);
                this.subjectPaginator.reset(response.subjects.totalRecords || 0);
                this.subjectPaginator.changePage(page);
                this.subjectLoading.set(false);
            },
            error: () => {
                if (session !== this.subjectSession) return;
                this.subjectLoading.set(false);
                this.subjectError.set('Không thể tải danh sách môn học.');
            }
        });
    }

    toggleSubject(subject: Subject): void {
        if (this.subjectSaving() || this.subjectLoading() || !this.subjectRelationsReady() || !this.canSelectSubjects) return;
        const ids = new Set(this.selectedSubjectIds());
        const id = Number(subject.id);
        if (ids.has(id)) ids.delete(id);
        else {
            ids.add(id);
            this.selectedSubjectData.set(id, subject);
        }
        this.selectedSubjectIds.set(ids);
    }

    isSubjectSelected(id: number): boolean { return this.selectedSubjectIds().has(Number(id)); }

    private createRelation(bo: BoCtdt, subject: Subject): Observable<unknown> {
        const key = `${bo.id}:${subject.id}`;
        const existing = this.pendingCourseIds.get(key);
        const course$ = existing ? of(existing) : this.courseService.addElnKhoaHoc({
            bo_ctdt_id: Number(bo.id), subject_id: Number(subject.id), title: subject.name,
            maso: `${bo.code}_${subject.code}`, slug: this.helper.slugVietnamese(subject.name), desc: subject.desc || '', status: 1,
            params: { sotinchi: Number(subject.sotinchi) || 0, sotinchi_th: Number(subject.sotinchi_th) || 0 }
        }).pipe(map(response => {
            const id = Number(typeof response === 'number' ? response : response?.id ?? response?.data?.id ?? response?.data);
            if (!Number.isInteger(id) || id < 1) throw new Error('API courses không trả về ID hợp lệ.');
            this.pendingCourseIds.set(key, id);
            return id;
        }));
        return course$.pipe(
            switchMap(course_id => this.subjectCourseService.create({ ctdt_bo_id: Number(bo.id), subject_id: Number(subject.id), course_id })),
            tap(() => this.pendingCourseIds.delete(key))
        );
    }

    saveSubjects(): void {
        const bo = this.subjectDrawerBo();
        if (!bo || !this.canSelectSubjects || this.subjectSaving() || this.subjectLoading() || !this.subjectRelationsReady() || this.subjectError()) return;
        const existing = new Map<number, SubjectCourseExtend>();
        this.subjectRelations().forEach(relation => {
            const id = Number(relation.subject_id);
            if (!existing.has(id)) existing.set(id, relation);
        });
        const selected = this.selectedSubjectIds();
        const adds = [...selected].filter(id => !existing.has(id));
        const deletes = [...existing].filter(([id]) => !selected.has(id)).map(([, relation]) => relation);
        if (adds.some(id => !this.selectedSubjectData.has(id))) {
            this.subjectSaveError.set('Thiếu dữ liệu môn học. Vui lòng tải lại.');
            return;
        }
        const operations = [
            ...adds.map(subjectId => ({ type: 'add' as const, subjectId })),
            ...deletes.map(relation => ({ type: 'delete' as const, relation }))
        ];
        if (!operations.length) {
            this.closeSubjectDrawer();
            return;
        }
        const session = this.subjectSession;
        this.subjectSaving.set(true);
        this.subjectSaveError.set('');
        let completed = 0;
        from(operations).pipe(
            concatMap(operation => (operation.type === 'add'
                ? this.createRelation(bo, this.selectedSubjectData.get(operation.subjectId))
                : this.subjectCourseService.delete(operation.relation.id)).pipe(tap(() => completed++))),
            toArray(), takeUntil(this.destroy$)
        ).subscribe({
            next: () => {
                if (session !== this.subjectSession) return;
                this.subjectSaving.set(false);
                this.notification.toastSuccess('Đã cập nhật môn học', 'Thành công');
                this.closeSubjectDrawer();
            },
            error: () => {
                if (session !== this.subjectSession) return;
                this.subjectSaving.set(false);
                this.subjectSaveError.set(`Đã hoàn thành ${completed}/${operations.length} thao tác. Đang tải lại dữ liệu để kiểm tra.`);
                this.notification.toastError('Không thể cập nhật toàn bộ môn học', 'Lỗi thao tác');
                this.subjectRelationsReady.set(false);
                this.loadSubjectPicker(this.requestedSubjectPage, selected);
            }
        });
    }
}
