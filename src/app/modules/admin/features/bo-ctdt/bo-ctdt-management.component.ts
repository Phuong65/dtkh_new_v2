import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { Tooltip } from 'primeng/tooltip';
import { Observable, Subject as RxSubject, catchError, concatMap, filter, forkJoin, from, map, of, switchMap, takeUntil, tap, toArray } from 'rxjs';
import { IctuPaginatorComponent } from '@core-new/components/ictu-paginator/ictu-paginator.component';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { DataTableEvent, DataTableEventName, IctuDataTable2 } from '@core-new/models/datatable';
import { IctuFormControl2 } from '@core-new/models/ictu-form-control';
import { IctuDeletingAnimationControl } from '@core-new/models/ictu-deleting-animation-control';
import { NotificationService } from '@core-new/service/notification.service';
import { OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { HeDt } from '@modules/shared/models/he-dt';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { HeDtService } from '@modules/shared/services/he-dt.service';
import { CtdtHocphanService } from '@modules/shared/services/ctdt-hocphan.service';
import { Select } from 'primeng/select';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { HelperService } from '@core/services/helper.service';
import { BoCtdt } from '@modules/shared/models/bo-ctdt';
import { BoCtdtService } from '@modules/shared/services/bo-ctdt.service';
import { Ctdt } from '@modules/shared/models/ctdt';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { SubjectService } from '@modules/shared/services/subject.service';
import { SubjectCourseService } from '@modules/shared/services/subject-course.service';
import { Subject } from '@modules/shared/models/subject';
import { SubjectCourseExtend } from '@modules/shared/models/subject-course';
import { IctuPaginatorControl } from '@core-new/components/ictu-paginator/ictu-paginator-control';

@Component({
    selector: 'app-bo-ctdt-management',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        Drawer,
        InputText,
        Tooltip,
        IctuPaginatorComponent,
        LoadingProgressComponent,
        MatButton,
        Select
    ],
    templateUrl: './bo-ctdt-management.component.html',
    styleUrl: './bo-ctdt-management.component.css'
})
export class BoCtdtManagementComponent implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly boCtdtService = inject(BoCtdtService);
    private readonly ctdtService = inject(CtdtService);
    private readonly donViService = inject(DonViService);
    private readonly nganhService = inject(ElnChuyenMucService);
    private readonly heDtService = inject(HeDtService);
    private readonly ctdtHocphanService = inject(CtdtHocphanService);
    private readonly subjectService = inject(SubjectService);
    private readonly subjectCourseService = inject(SubjectCourseService);
    private readonly courseService = inject(ElnKhoaHocService);
    private readonly helperService = inject(HelperService);
    private readonly pendingCourseIds = new Map<string, number>();
    private readonly selectedSubjectData = new Map<number, Subject>();
    private readonly cancelSubjectLoad$ = new RxSubject<void>();
    private readonly cancelRelationLoad$ = new RxSubject<void>();
    private subjectRequestId = 0;
    private subjectDrawerSession = 0;
    private appliedSubjectSearch = '';
    private requestedSubjectPage = 1;
    subjectRelationsReady = false;
    private readonly cancelCtdtLoad$ = new RxSubject<void>();
    private readonly cancelCtdtMetaLoad$ = new RxSubject<void>();
    private readonly cancelCtdtFormOptionsLoad$ = new RxSubject<void>();
    private readonly cancelBoLoad$ = new RxSubject<void>();
    readonly ctdtFormLoading = signal<boolean>(false);
    ctdtFormDonVi: DonVi[] = [];
    ctdtFormNganh: ElnChuyenMuc[] = [];
    ctdtFormHeDt: HeDt[] = [];
    private readonly notificationService = inject(NotificationService);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    readonly drawer = viewChild<Drawer>('boCtdtDrawer');
    readonly destroy$ = new RxSubject<void>();
    readonly boTable = new IctuDataTable2<BoCtdt>({ rows: 20, pageLinkSize: 5 });
    readonly ctdtTable = new IctuDataTable2<Ctdt>({ rows: 10, pageLinkSize: 5 });
    readonly ctdtDisplayMeta = signal<Record<number, { khoa: string; nganh: string; heDaoTao: string; tongTinChi: number | null }>>({});
    readonly state = signal<AppState>('loading');
    readonly ctdtState = signal<AppState>('success');
    readonly isSaving = signal<boolean>(false);
    readonly searchValue = signal<string>('');
    readonly selectedBo = signal<BoCtdt | null>(null);
    readonly ctdtSearchValue = signal<string>('');
    readonly subjectDrawerBo = signal<BoCtdt | null>(null);
    readonly subjectRelations = signal<SubjectCourseExtend[]>([]);
    readonly linkedSubjects = signal<Subject[]>([]);
    readonly subjects = signal<Subject[]>([]);
    readonly selectedSubjectIds = signal<ReadonlySet<number>>(new Set<number>());
    readonly subjectSearchValue = signal<string>('');
    readonly isLoadingSubjects = signal<boolean>(false);
    readonly isLoadingSubjectRelations = signal<boolean>(false);
    readonly isSavingSubjects = signal<boolean>(false);
    readonly subjectLoadError = signal<string>('');
    readonly subjectSaveError = signal<string>('');
    readonly subjectPaginator = new IctuPaginatorControl({ rows: 15, pageLinkSize: 5, showFirstLastIcon: true });

    canAdd = true;
    canUpdate = true;
    canDelete = true;
    canAddCtdt = false;
    canDeleteCtdt = true;
    ctdtDrawerVisible = false;
    subjectDrawerVisible = false;
    private creatingForBo: BoCtdt | null = null;

    readonly ctdtForm = this.fb.group({
        ten: ['', [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(255)]],
        madt: ['', [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(50)]],
        category_id: [null as number | null, Validators.required],
        nganh_id: [null as number | null, Validators.required],
        khoa_apdung: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
        he_dt: [null as string | null, Validators.required]
    });

    readonly boCtdtForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        code: ['', [Validators.required, Validators.maxLength(50)]]
    });

    readonly formControl = new IctuFormControl2<BoCtdt>({
        dropdownFields: [],
        formGroup: this.boCtdtForm,
        objectName: 'bộ chương trình đào tạo',
        drawer: this.drawer
    });

    private readonly handelEvent: Record<DataTableEventName, (data: BoCtdt) => void> = {
        OPEN_FORM_ADD: () => this.openCreateDrawer(),
        OPEN_FORM_UPDATE: data => this.openEditDrawer(data),
        DELETE_SINGLE_ROW: data => this.deleteBoCtdt(data),
        DELETE_SELECTED_ROWS: () => this.deleteSelectedBoCtdt(),
        SUBMIT_FORM: () => this.submitForm()
    };

    private readonly observeEvents = new RxSubject<DataTableEvent<BoCtdt>>();

    ngOnInit(): void {
        this.checkPermissions();
        this.observeEvents.pipe(takeUntil(this.destroy$)).subscribe(({ name, data }) => this.handelEvent[name](data));
        this.loadBoCtdt(1, true);
    }

    ngOnDestroy(): void {
        this.cancelCtdtLoad$.next();
        this.cancelCtdtLoad$.complete();
        this.cancelCtdtMetaLoad$.next();
        this.cancelCtdtMetaLoad$.complete();
        this.cancelCtdtFormOptionsLoad$.next();
        this.cancelCtdtFormOptionsLoad$.complete();
        this.cancelBoLoad$.next();
        this.cancelBoLoad$.complete();
        this.cancelSubjectLoad$.next();
        this.cancelSubjectLoad$.complete();
        this.cancelRelationLoad$.next();
        this.cancelRelationLoad$.complete();
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkPermissions(): void {
        const rawUrl = this.router.url.split('?')[0];
        const routePath = rawUrl.startsWith('/admin/') ? rawUrl.substring(7) : rawUrl.replace(/^\//, '');
        if (this.auth?.userCanAdd) {
            this.canAdd = this.auth.userCanAdd(routePath) || this.auth.userCanAdd('bo-ctdt');
            this.canAddCtdt = this.canAdd || this.auth.userCanAdd('chuongtrinh-daotao');
        }
        if (this.auth?.userCanEdit) this.canUpdate = this.auth.userCanEdit(routePath) || this.auth.userCanEdit('bo-ctdt');
        if (this.auth?.userCanDelete) this.canDelete = this.auth.userCanDelete(routePath) || this.auth.userCanDelete('bo-ctdt');
        if (this.auth?.userCanDelete) this.canDeleteCtdt = this.canDelete || this.auth.userCanDelete('chuongtrinh-daotao');
    }

    emitEvent(name: DataTableEventName, data: BoCtdt = null): void {
        this.observeEvents.next({ name, data });
    }

    uppercaseCodeInput(event: Event, form: FormGroup, controlName: string): void {
        const input = event.target as HTMLInputElement;
        const originalValue = input.value;
        const uppercaseValue = originalValue.toUpperCase();
        if (originalValue === uppercaseValue) return;

        const selectionStart = input.selectionStart ?? originalValue.length;
        const selectionEnd = input.selectionEnd ?? selectionStart;
        const uppercaseSelectionStart = originalValue.slice(0, selectionStart).toUpperCase().length;
        const uppercaseSelectionEnd = originalValue.slice(0, selectionEnd).toUpperCase().length;

        input.value = uppercaseValue;
        form.get(controlName)?.setValue(uppercaseValue);
        input.setSelectionRange(uppercaseSelectionStart, uppercaseSelectionEnd);
    }

    onSearchChange(event: Event): void {
        this.searchValue.set((event.target as HTMLInputElement).value || '');
    }

    onSearchData(): void {
        this.searchValue.set(this.searchValue().trim());
        this.loadBoCtdt(1, true);
    }

    onCtdtSearchChange(event: Event): void {
        this.ctdtSearchValue.set((event.target as HTMLInputElement).value || '');
    }

    onCtdtSearchData(): void {
        this.ctdtSearchValue.set(this.ctdtSearchValue().trim());
        this.loadCtdt(1, true);
    }

    onBoPageChange(page: number): void {
        this.loadBoCtdt(page, false);
    }

    onCtdtPageChange(page: number): void {
        this.loadCtdt(page, false);
    }

    onSubjectSearchChange(event: Event): void {
        this.subjectSearchValue.set((event.target as HTMLInputElement).value || '');
    }

    onSubjectSearch(): void {
        if (this.isSavingSubjects()) return;
        this.appliedSubjectSearch = this.subjectSearchValue().trim();
        const bo = this.subjectDrawerBo();
        if (!bo) return;
        if (this.subjectRelationsReady) this.loadSubjects(1);
        else this.loadSubjectPicker(bo.id, this.subjectDrawerSession, 1);
    }

    onSubjectPageChange(page: number): void {
        if (this.isSavingSubjects()) return;
        const bo = this.subjectDrawerBo();
        if (!bo) return;
        if (this.subjectRelationsReady) this.loadSubjects(page);
        else this.loadSubjectPicker(bo.id, this.subjectDrawerSession, page);
    }

    retrySubjectLoad(): void {
        const bo = this.subjectDrawerBo();
        if (!bo) return;
        if (!this.subjectRelationsReady) this.loadSubjectPicker(bo.id, this.subjectDrawerSession, this.requestedSubjectPage);
        else this.loadSubjects(this.requestedSubjectPage);
    }

    loadBoCtdt(page = 1, resetPaginator = false): void {
        this.state.set('loading');
        const conditions: OvicConditionParam[] = [];
        const query = this.searchValue();
        if (query) {
            conditions.push({ conditionName: 'name', condition: OvicQueryCondition.like, value: `%${query}%`, orWhere: 'or' });
            conditions.push({ conditionName: 'code', condition: OvicQueryCondition.like, value: `%${query}%`, orWhere: 'or' });
        }

        this.cancelBoLoad$.next();
        this.boCtdtService.get(conditions, {
            limit: this.boTable.paginator.rows(), paged: page, orderby: 'created_at', order: 'DESC'
        }).pipe(takeUntil(this.destroy$), takeUntil(this.cancelBoLoad$)).subscribe({
            next: response => {
                const total = Number(response.totalRecords) || 0;
                const rows = Array.isArray(response.data) ? response.data : [];
                this.boTable.fillRawData({ data: rows, recordsFiltered: total, recordsTotal: total, draw: 1 }, { paged: page, resetPaginator });
                this.state.set('success');
                const current = this.selectedBo();
                const next = current && rows.some((item: BoCtdt) => item.id === current.id) ? current : rows[0] || null;
                if (this.selectedBo()?.id === next?.id) {
                    this.loadCtdt(1, true);
                } else {
                    this.selectBo(next);
                }
            },
            error: () => {
                this.state.set('error');
                this.notificationService.toastError('Không thể tải danh sách bộ chương trình đào tạo', 'Lỗi kết nối');
            }
        });
    }

    selectBo(bo: BoCtdt | null): void {
        if (this.selectedBo()?.id === bo?.id) return;
        this.selectedBo.set(bo);
        this.ctdtSearchValue.set('');
        this.loadCtdt(1, true);
    }

    loadCtdt(page = 1, resetPaginator = false): void {
        const bo = this.selectedBo();
        if (!bo) {
            this.cancelCtdtLoad$.next();
            this.cancelCtdtMetaLoad$.next();
            this.ctdtDisplayMeta.set({});
            this.ctdtTable.fillRawData({ data: [], recordsFiltered: 0, recordsTotal: 0, draw: 1 }, { paged: 1, resetPaginator: true });
            this.ctdtState.set('success');
            return;
        }

        this.cancelCtdtMetaLoad$.next();
        this.ctdtDisplayMeta.set({});
        this.ctdtState.set('loading');
        const conditions: OvicConditionParam[] = [
            { conditionName: 'ctdt_bo_id', condition: OvicQueryCondition.equal, value: String(bo.id), orWhere: 'and' }
        ];
        const query = this.ctdtSearchValue();
        if (query) {
            conditions.push({ conditionName: 'ten', condition: OvicQueryCondition.like, value: `%${query}%`, orWhere: 'and' });
        }

        this.cancelCtdtLoad$.next();
        this.ctdtService.getCtdtByPageNew({
            condition: conditions,
            set: [
                { label: 'limit', value: String(this.ctdtTable.paginator.rows()) },
                { label: 'orderby', value: 'id' },
                { label: 'order', value: 'DESC' }
            ],
            page: String(page)
        }).pipe(takeUntil(this.destroy$), takeUntil(this.cancelCtdtLoad$)).subscribe({
            next: response => {
                const total = Number(response.recordsFiltered) || 0;
                const rows = response.data || [];
                this.ctdtTable.fillRawData({ data: rows, recordsFiltered: total, recordsTotal: total, draw: 1 }, { paged: page, resetPaginator });
                this.ctdtState.set('success');
                this.loadCtdtDisplayMeta(rows);
            },
            error: () => {
                this.ctdtState.set('error');
                this.notificationService.toastError('Không thể tải danh sách chương trình đào tạo', 'Lỗi kết nối');
            }
        });
    }

    private loadCtdtDisplayMeta(rows: Ctdt[]): void {
        const validRows = rows.filter(row => Number.isInteger(Number(row.id)) && Number(row.id) > 0);
        if (!validRows.length) {
            this.ctdtDisplayMeta.set({});
            return;
        }

        const major: ConditionOption = {
            condition: [{ conditionName: 'type', condition: OvicQueryCondition.equal, value: 'nganh', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }], page: null
        };
        const unit: ConditionOption = {
            condition: [{ conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'title' }, { label: 'order', value: 'ASC' }], page: null
        };
        forkJoin({
            nganh: this.nganhService.getChuyemucByPageNew(major),
            khoa: this.donViService.getDonviByPageNew(unit),
            heDaoTao: this.heDtService.getAllHeDt(),
            credits: forkJoin(validRows.map(row => this.loadCtdtCredits(Number(row.id))))
        }).pipe(
            catchError(() => of({ nganh: { data: [] }, khoa: { data: [] }, heDaoTao: [], credits: validRows.map(() => null) })),
            takeUntil(this.cancelCtdtMetaLoad$),
            takeUntil(this.destroy$)
        ).subscribe(({ nganh, khoa, heDaoTao, credits }) => {
            const nganhById = new Map((nganh.data || []).map(item => [Number(item.id), item.title]));
            const khoaById = new Map((khoa.data || []).map(item => [Number(item.id), item.title]));
            const heDaoTaoByCode = new Map((heDaoTao || []).map(item => [String((item as HeDt & { kyhieu?: string }).kyhieu ?? item.id), item.title]));
            const metadata = validRows.reduce((result, row, index) => {
                result[Number(row.id)] = {
                    khoa: khoaById.get(Number(row.category_id)) || '—',
                    nganh: nganhById.get(Number(row.nganh_id)) || '—',
                    heDaoTao: heDaoTaoByCode.get(String(row.he_dt)) || '—',
                    tongTinChi: credits[index]
                };
                return result;
            }, {} as Record<number, { khoa: string; nganh: string; heDaoTao: string; tongTinChi: number | null }>);
            this.ctdtDisplayMeta.set(metadata);
        });
    }

    private loadCtdtCredits(ctdtId: number): Observable<number | null> {
        const condition: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(ctdtId) }],
            set: [{ label: 'limit', value: '-1' }], page: null
        };
        return this.ctdtHocphanService.getCtdtHocphanByPageNew(condition).pipe(
            switchMap(links => {
                const courseIds = [...new Set((links.data || []).map(link => Number(link.course_id)).filter(id => Number.isInteger(id) && id > 0))];
                if (!courseIds.length) return of([] as { params?: { sotinchi?: number } }[]);
                const courseCondition: ConditionOption = {
                    condition: [{ conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1' }],
                    set: [{ label: 'limit', value: '-1' }, { label: 'include', value: courseIds.join(',') }, { label: 'include_by', value: 'id' }],
                    page: null
                };
                return this.courseService.getKhoaHocByPageNew_2(courseCondition).pipe(map(response => response.data || []));
            }),
            map(courses => courses.reduce((total, course) => total + Number(course.params?.sotinchi || 0), 0)),
            catchError(() => of(null))
        );
    }

    getCtdtMeta(ctdt: Ctdt): { khoa: string; nganh: string; heDaoTao: string; tongTinChi: number | null } {
        return this.ctdtDisplayMeta()[Number(ctdt.id)] || { khoa: '—', nganh: '—', heDaoTao: '—', tongTinChi: null };
    }

    openSubjectDrawer(bo: BoCtdt, event?: Event): void {
        event?.stopPropagation();
        if (!this.canUpdate) {
            this.notificationService.toastWarning('Bạn không có quyền cập nhật học phần của bộ chương trình đào tạo');
            return;
        }
        if (this.isSavingSubjects()) return;

        this.cancelSubjectLoad$.next();
        this.cancelRelationLoad$.next();
        const session = ++this.subjectDrawerSession;
        this.subjectDrawerBo.set(bo);
        this.subjectRelations.set([]);
        this.linkedSubjects.set([]);
        this.selectedSubjectData.clear();
        this.subjects.set([]);
        this.selectedSubjectIds.set(new Set<number>());
        this.subjectSearchValue.set('');
        this.appliedSubjectSearch = '';
        this.requestedSubjectPage = 1;
        this.subjectRelationsReady = false;
        this.subjectLoadError.set('');
        this.subjectSaveError.set('');
        this.subjectPaginator.reset(0);
        this.subjectDrawerVisible = true;
        this.loadSubjectPicker(bo.id, session, 1);
    }

    closeSubjectDrawer(): void {
        if (this.isSavingSubjects()) return;
        this.subjectDrawerVisible = false;
        this.resetSubjectDrawer();
    }

    onSubjectDrawerHide(): void {
        if (!this.subjectDrawerVisible && !this.isSavingSubjects()) this.resetSubjectDrawer();
    }

    toggleSubjectSelection(subject: Subject): void {
        if (this.isSavingSubjects() || !this.subjectRelationsReady) return;
        const selected = new Set(this.selectedSubjectIds());
        const subjectId = Number(subject.id);
        if (selected.has(subjectId)) selected.delete(subjectId);
        else {
            selected.add(subjectId);
            this.selectedSubjectData.set(subjectId, subject);
        }
        this.selectedSubjectIds.set(selected);
    }

    isSubjectSelected(subjectId: number): boolean {
        return this.selectedSubjectIds().has(Number(subjectId));
    }

    saveSubjectCourses(): void {
        const bo = this.subjectDrawerBo();
        if (!bo || this.isSavingSubjects() || !this.subjectRelationsReady) return;

        const existingBySubjectId = new Map<number, SubjectCourseExtend>();
        this.subjectRelations().forEach(relation => {
            const subjectId = Number(relation.subject_id);
            if (!existingBySubjectId.has(subjectId)) existingBySubjectId.set(subjectId, relation);
        });
        const selected = this.selectedSubjectIds();
        const toCreate = [...selected].filter(subjectId => !existingBySubjectId.has(subjectId));
        const missingSubject = toCreate.find(subjectId => !this.selectedSubjectData.has(subjectId));
        if (missingSubject) {
            this.subjectSaveError.set('Không tìm thấy dữ liệu môn học đã chọn. Vui lòng tải lại danh sách.');
            return;
        }
        const toDelete = [...existingBySubjectId.entries()]
            .filter(([subjectId]) => !selected.has(subjectId))
            .map(([, relation]) => relation);
        if (!toCreate.length && !toDelete.length) {
            this.closeSubjectDrawer();
            return;
        }

        this.isSavingSubjects.set(true);
        this.subjectSaveError.set('');
        const session = this.subjectDrawerSession;
        const operations = [
            ...toCreate.map(subjectId => ({ type: 'create' as const, subjectId })),
            ...toDelete.map(relation => ({ type: 'delete' as const, relation }))
        ];
        let completed = 0;
        from(operations).pipe(
            concatMap(operation => (operation.type === 'create'
                ? this.createCourseSubjectRelation(bo, this.selectedSubjectData.get(operation.subjectId))
                : this.subjectCourseService.delete(operation.relation.id)
            ).pipe(tap(() => completed++))),
            toArray(),
            takeUntil(this.destroy$)
        ).subscribe({
            next: () => {
                if (session !== this.subjectDrawerSession) return;
                this.isSavingSubjects.set(false);
                this.notificationService.toastSuccess('Đã cập nhật học phần cho bộ chương trình đào tạo', 'Thành công');
                this.closeSubjectDrawer();
            },
            error: () => {
                if (session !== this.subjectDrawerSession) return;
                this.isSavingSubjects.set(false);
                this.subjectSaveError.set(`Đã hoàn thành ${completed}/${operations.length} thao tác. Dữ liệu đã được tải lại từ máy chủ.`);
                this.notificationService.toastError('Không thể cập nhật toàn bộ học phần. Vui lòng kiểm tra lại và thử lại.', 'Lỗi thao tác');
                this.loadSubjectRelations(bo.id, session);
            }
        });
    }

    private createCourseSubjectRelation(bo: BoCtdt, subject: Subject): Observable<unknown> {
        const key = `${bo.id}:${subject.id}`;
        const existingCourseId = this.pendingCourseIds.get(key);
        const courseId$ = existingCourseId
            ? of(existingCourseId)
            : this.courseService.addElnKhoaHoc({
                bo_ctdt_id: Number(bo.id),
                subject_id: Number(subject.id),
                title: subject.name,
                maso: subject.code,
                slug: this.helperService.slugVietnamese(subject.name),
                desc: subject.desc || '',
                status: 1,
                params: {
                    sotinchi: Number(subject.sotinchi) || 0,
                    sotinchi_th: Number(subject.sotinchi_th) || 0
                }
            }).pipe(map(response => {
                const rawId = typeof response === 'number' ? response : response?.id ?? response?.data?.id ?? response?.data;
                const id = Number(rawId);
                if (!Number.isInteger(id) || id <= 0) throw new Error('API courses không trả về ID hợp lệ.');
                this.pendingCourseIds.set(key, id);
                return id;
            }));
        return courseId$.pipe(
            switchMap(courseId => this.subjectCourseService.create({
                ctdt_bo_id: Number(bo.id),
                subject_id: Number(subject.id),
                course_id: courseId
            })),
            tap(() => this.pendingCourseIds.delete(key))
        );
    }

    private loadSubjectPicker(boId: number, session: number, page: number): void {
        this.cancelSubjectLoad$.next();
        this.cancelRelationLoad$.next();
        this.isLoadingSubjectRelations.set(true);
        this.isLoadingSubjects.set(true);
        this.subjectLoadError.set('');
        this.subjectRequestId++;
        this.requestedSubjectPage = page;
        const keyword = this.appliedSubjectSearch;
        const conditions: OvicConditionParam[] = keyword
            ? ['name', 'code'].map(conditionName => ({ conditionName, condition: OvicQueryCondition.like, value: `%${keyword}%`, orWhere: 'or' }))
            : [];
        const relations$ = this.subjectCourseService.getByBoCtdt(boId);
        const subjects$ = this.subjectService.get(conditions, {
            limit: this.subjectPaginator.rows(), paged: page, orderby: 'name', order: 'ASC'
        });
        forkJoin({ relations: relations$, subjects: subjects$ }).pipe(
            takeUntil(this.cancelSubjectLoad$),
            takeUntil(this.cancelRelationLoad$),
            takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                if (session !== this.subjectDrawerSession || this.subjectDrawerBo()?.id !== boId) return;
                const relations = response.relations.data || [];
                this.subjectRelations.set(relations);
                this.linkedSubjects.set(this.flattenRelationSubjects(relations));
                this.selectedSubjectIds.set(new Set(relations.map(relation => Number(relation.subject_id))));
                const pageSubjects = response.subjects.data || [];
                pageSubjects.forEach(subject => this.selectedSubjectData.set(Number(subject.id), subject));
                this.subjects.set(pageSubjects);
                this.subjectPaginator.reset(response.subjects.totalRecords || 0);
                this.subjectPaginator.changePage(page);
                this.subjectRelationsReady = true;
                this.isLoadingSubjectRelations.set(false);
                this.isLoadingSubjects.set(false);
            },
            error: () => {
                if (session !== this.subjectDrawerSession) return;
                this.isLoadingSubjectRelations.set(false);
                this.isLoadingSubjects.set(false);
                this.subjectLoadError.set('Không thể tải danh sách học phần. Vui lòng thử lại.');
            }
        });
    }

    private loadSubjectRelations(boId: number, session: number): void {
        this.isLoadingSubjectRelations.set(true);
        this.cancelRelationLoad$.next();
        this.subjectCourseService.getByBoCtdt(boId).pipe(
            takeUntil(this.cancelRelationLoad$),
            takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                if (session !== this.subjectDrawerSession || this.subjectDrawerBo()?.id !== boId) return;
                const relations = response.data || [];
                this.subjectRelations.set(relations);
                this.linkedSubjects.set(this.flattenRelationSubjects(relations));
                this.selectedSubjectIds.set(new Set(relations.map(relation => relation.subject_id)));
                this.subjectRelationsReady = true;
                this.isLoadingSubjectRelations.set(false);
            },
            error: () => {
                if (session !== this.subjectDrawerSession) return;
                this.isLoadingSubjectRelations.set(false);
                this.subjectLoadError.set('Không thể tải học phần đã gán cho bộ CTĐT. Vui lòng thử lại.');
            }
        });
    }

    flattenRelationSubjects(relations: SubjectCourseExtend[]): Subject[] {
        const result: Subject[] = [];
        const seen = new Set<number>();
        relations.forEach(r => {
            const list = Array.isArray(r.subjects) ? r.subjects : r.subjects ? [r.subjects] : [];
            list.forEach(s => {
                if (s && !seen.has(s.id)) {
                    seen.add(s.id);
                    result.push(s);
                }
            });
        });
        return result;
    }

    private loadSubjects(page: number, session = this.subjectDrawerSession): void {
        if (!this.subjectDrawerVisible || this.isSavingSubjects()) return;
        this.cancelSubjectLoad$.next();
        const requestId = ++this.subjectRequestId;
        this.requestedSubjectPage = page;
        this.isLoadingSubjects.set(true);
        const keyword = this.appliedSubjectSearch;
        const conditions: OvicConditionParam[] = keyword
            ? ['name', 'code'].map(conditionName => ({ conditionName, condition: OvicQueryCondition.like, value: `%${keyword}%`, orWhere: 'or' }))
            : [];
        this.subjectService.get(conditions, {
            limit: this.subjectPaginator.rows(), paged: page, orderby: 'name', order: 'ASC'
        }).pipe(
            takeUntil(this.cancelSubjectLoad$),
            takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                if (session !== this.subjectDrawerSession || requestId !== this.subjectRequestId) return;
                const pageSubjects = response.data || [];
                pageSubjects.forEach(subject => this.selectedSubjectData.set(Number(subject.id), subject));
                this.subjects.set(pageSubjects);
                this.subjectPaginator.reset(response.totalRecords || 0);
                this.subjectPaginator.changePage(page);
                this.isLoadingSubjects.set(false);
            },
            error: () => {
                if (session !== this.subjectDrawerSession || requestId !== this.subjectRequestId) return;
                this.isLoadingSubjects.set(false);
                this.subjectLoadError.set('Không thể tải danh mục học phần. Vui lòng thử lại.');
            }
        });
    }

    private resetSubjectDrawer(): void {
        this.cancelSubjectLoad$.next();
        this.cancelRelationLoad$.next();
        ++this.subjectDrawerSession;
        this.subjectDrawerBo.set(null);
        this.subjectRelations.set([]);
        this.linkedSubjects.set([]);
        this.selectedSubjectData.clear();
        this.subjects.set([]);
        this.selectedSubjectIds.set(new Set<number>());
        this.subjectSearchValue.set('');
        this.subjectLoadError.set('');
        this.subjectSaveError.set('');
        this.subjectRelationsReady = false;
        this.isLoadingSubjects.set(false);
        this.isLoadingSubjectRelations.set(false);
    }

    openCreateDrawer(): void {
        if (!this.canAdd) {
            this.notificationService.toastWarning('Bạn không có quyền thêm mới bộ chương trình đào tạo');
            return;
        }
        this.boCtdtForm.reset({ name: '', code: '' });
        this.formControl.openFormAdd();
    }

    openEditDrawer(item: BoCtdt): void {
        if (!this.canUpdate) {
            this.notificationService.toastWarning('Bạn không có quyền chỉnh sửa bộ chương trình đào tạo');
            return;
        }
        this.boCtdtForm.reset({ name: item.name || '', code: item.code || '' });
        this.formControl.openFormEdit(item);
    }

    openCreateCtdt(): void {
        const bo = this.selectedBo();
        if (!bo) {
            this.notificationService.toastWarning('Vui lòng chọn một bộ chương trình đào tạo');
            return;
        }
        if (!this.canAddCtdt) {
            this.notificationService.toastWarning('Bạn không có quyền thêm mới chương trình đào tạo');
            return;
        }
        this.creatingForBo = bo;
        this.ctdtForm.reset({ ten: '', madt: '', category_id: null, nganh_id: null, khoa_apdung: '', he_dt: null });
        this.ctdtDrawerVisible = true;
        this.loadCtdtFormOptions();
    }

    private loadCtdtFormOptions(): void {
        const major: ConditionOption = {
            condition: [{ conditionName: 'type', condition: OvicQueryCondition.equal, value: 'nganh', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }], page: null
        };
        const unit: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: String(this.auth.user?.donvi_id), orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }, { label: 'order', value: 'ASC' }, { label: 'orderby', value: 'title' }],
            page: null
        };
        this.cancelCtdtFormOptionsLoad$.next();
        this.ctdtFormLoading.set(true);
        forkJoin({
            nganh: this.nganhService.getChuyemucByPageNew(major),
            donvi: this.donViService.getDonviByPageNew(unit),
            hedt: this.heDtService.getAllHeDt()
        }).pipe(takeUntil(this.cancelCtdtFormOptionsLoad$), takeUntil(this.destroy$)).subscribe({
            next: ({ nganh, donvi, hedt }) => {
                this.ctdtFormNganh = nganh.data || [];
                this.ctdtFormDonVi = donvi.data || [];
                this.ctdtFormHeDt = hedt || [];
                this.ctdtFormLoading.set(false);
            },
            error: () => {
                this.ctdtFormLoading.set(false);
                this.notificationService.toastError('Không thể tải danh mục Khoa, Ngành và Hệ đào tạo', 'Lỗi kết nối');
            }
        });
    }

    onCtdtFormDonViChange(): void {
        this.ctdtForm.controls.nganh_id.setValue(null);
    }

    get ctdtFormNganhByDonVi(): ElnChuyenMuc[] {
        const categoryId = this.ctdtForm.controls.category_id.value;
        return this.ctdtFormNganh.filter(nganh => Number(nganh.donvi_chuyenmon_id) === Number(categoryId));
    }

    get canSubmitCtdtForm(): boolean {
        return !this.isSaving() && !this.ctdtFormLoading() && this.ctdtForm.valid
            && this.ctdtFormNganhByDonVi.some(nganh => Number(nganh.id) === Number(this.ctdtForm.controls.nganh_id.value));
    }

    onCtdtKhoaKeyDown(event: KeyboardEvent): void {
        if (event.ctrlKey || event.metaKey || /^[0-9]$/.test(event.key)
            || ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
    }

    openCtdt(item: Ctdt): void {
        this.router.navigate(['/chuong-trinh-dao-tao'], {
            queryParams: { code: item.id }
        });
    }

    submitCtdtForm(): void {
        if (!this.creatingForBo) {
            this.notificationService.toastWarning('Vui lòng chọn một bộ chương trình đào tạo');
            return;
        }
        this.ctdtForm.markAllAsTouched();
        if (!this.canSubmitCtdtForm) {
            this.notificationService.toastWarning('Vui lòng kiểm tra lại các trường bắt buộc');
            return;
        }

        const value = this.ctdtForm.getRawValue();
        const payload: Partial<Ctdt> = {
            ten: (value.ten || '').trim(),
            madt: (value.madt || '').trim(),
            category_id: Number(value.category_id),
            nganh_id: Number(value.nganh_id),
            khoa_apdung: value.khoa_apdung ? Number(value.khoa_apdung) : null,
            he_dt: value.he_dt || null,
            ctdt_bo_id: this.creatingForBo.id
        };

        this.isSaving.set(true);
        this.ctdtDrawerVisible = false;
        this.ctdtService.addCtdt(payload).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.notificationService.toastSuccess('Thêm mới chương trình đào tạo thành công', 'Thành công');
                this.loadCtdt(this.ctdtTable.paginator.paged(), false);
            },
            error: () => {
                this.isSaving.set(false);
                this.notificationService.toastError('Thêm mới chương trình đào tạo thất bại', 'Lỗi thao tác');
            }
        });
    }

    deleteCtdt(item: Ctdt): void {
        if (!this.canDeleteCtdt) {
            this.notificationService.toastWarning('Bạn không có quyền xóa chương trình đào tạo');
            return;
        }

        const currentPage = this.ctdtTable.paginator.paged();
        const nextPage = this.ctdtTable.data().length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        const safeTitle = (item.ten || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.notificationService.confirmDelete2({
            heading: 'Xác nhận xóa',
            htmlMessage: `Bạn có chắc muốn xóa chương trình đào tạo "${safeTitle}"?`
        }).pipe(
            filter(Boolean),
            switchMap(() => this.ctdtService.deleteCtdt(item.id)),
            takeUntil(this.destroy$)
        ).subscribe({
            next: () => {
                this.notificationService.toastSuccess('Xóa chương trình đào tạo thành công', 'Thành công');
                this.loadCtdt(nextPage, false);
            },
            error: () => {
                this.notificationService.toastError('Xóa chương trình đào tạo thất bại', 'Lỗi thao tác');
                this.loadCtdt(currentPage, false);
            }
        });
    }

    requestCloseDrawer(): void {
        if (this.formControl.state() === 'SUBMITTING') return;
        this.formControl.visible = false;
    }

    submitForm(): void {
        if (this.formControl.state() === 'SUBMITTING' || this.isSaving()) return;
        this.boCtdtForm.markAllAsTouched();
        if (this.boCtdtForm.invalid) {
            this.notificationService.toastWarning('Vui lòng kiểm tra lại các trường bắt buộc');
            return;
        }
        const value = this.boCtdtForm.getRawValue();
        const payload: Partial<BoCtdt> = { name: (value.name || '').trim(), code: (value.code || '').trim() };
        const isAdd = this.formControl.isFormAdd;
        const request$ = isAdd ? this.boCtdtService.create(payload) : this.boCtdtService.update(this.formControl.object.id, payload);
        this.isSaving.set(true);
        this.formControl.visible = false;
        request$.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.notificationService.toastSuccess(isAdd ? 'Thêm mới bộ chương trình đào tạo thành công' : 'Cập nhật bộ chương trình đào tạo thành công', 'Thành công');
                this.loadBoCtdt(this.boTable.paginator.paged(), false);
            },
            error: () => {
                this.isSaving.set(false);
                this.notificationService.toastError(isAdd ? 'Thêm mới bộ chương trình đào tạo thất bại' : 'Cập nhật bộ chương trình đào tạo thất bại', 'Lỗi thao tác');
            }
        });
    }

    deleteBoCtdt(item: BoCtdt): void {
        if (!this.canDelete) { this.notificationService.toastWarning('Bạn không có quyền xóa bộ chương trình đào tạo'); return; }
        const safeTitle = (item.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        this.requestDeletingData([item.id], `Bạn có chắc muốn xóa bộ chương trình đào tạo "${safeTitle}"?`);
    }

    deleteSelectedBoCtdt(): void {
        if (!this.canDelete) { this.notificationService.toastWarning('Bạn không có quyền xóa bộ chương trình đào tạo'); return; }
        const selected = this.boTable.getSelectedData();
        if (selected.length) this.requestDeletingData(selected.map(item => item.id), `Bạn có chắc muốn xóa ${selected.length} bộ chương trình đào tạo đã chọn?`);
    }

    private requestDeletingData(ids: number[], message: string): void {
        const currentPage = this.boTable.paginator.paged();
        const nextPage = ids.length === this.boTable.data().length && currentPage > 1 ? currentPage - 1 : currentPage;
        this.notificationService.confirmDelete2({ heading: 'Xác nhận xóa', htmlMessage: message }).pipe(
            filter(Boolean), map(() => new IctuDeletingAnimationControl(ids, this.boCtdtService)),
            switchMap((controller: IctuDeletingAnimationControl): Observable<boolean> => { controller.run(); return this.notificationService.startDeleting(controller.progress); }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: success => { if (success) this.notificationService.toastSuccess('Xóa bộ chương trình đào tạo thành công', 'Thành công'); this.loadBoCtdt(nextPage, false); },
            error: () => { this.notificationService.toastError('Xóa một hoặc nhiều bộ chương trình đào tạo thất bại', 'Lỗi thao tác'); this.loadBoCtdt(currentPage, false); }
        });
    }

    toggleBoCheckAll(checked: boolean): void { this.boTable.selectRow(checked); }
    toggleBoCheckRow(checked: boolean, index: number): void { this.boTable.selectRow(checked, index); }
    trackByBoId(_index: number, item: BoCtdt): number { return item.id; }
    trackByCtdtId(_index: number, item: Ctdt): number { return item.id || _index; }
}
