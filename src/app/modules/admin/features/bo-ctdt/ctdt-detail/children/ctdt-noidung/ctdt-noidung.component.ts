import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core-new/service/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { CtdtHocphanService } from '@modules/shared/services/ctdt-hocphan.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { catchError, concatMap, defer, finalize, forkJoin, from, map, Observable, of, Subject, switchMap, takeUntil, tap, throwError, toArray } from 'rxjs';
import { Ctdt } from '@modules/shared/models/ctdt';
import { ROLES } from '@modules/shared/utils/syscat';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { TableModule } from 'primeng/table';
import { CtdtHocphan } from '@modules/shared/models/ctdt_hocphan';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { Subject as CatalogSubject } from '@modules/shared/models/subject';
import { SubjectCourseExtend } from '@modules/shared/models/subject-course';
import { SubjectCourseService } from '@modules/shared/services/subject-course.service';
import { PopoverModule } from 'primeng/popover';
import { IctuPaginatorComponent } from '@core-new/components/ictu-paginator/ictu-paginator.component';
import { IctuPaginatorControl } from '@core-new/components/ictu-paginator/ictu-paginator-control';
import { CtdtConfig } from '@modules/shared/models/ctdt-config';
import { CtdtConfigService } from '@modules/shared/services/ctdt-config.service';
import { Drawer } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MatButtonModule } from '@angular/material/button';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { IctuDeletingAnimationControl } from '@core-new/models/ictu-deleting-animation-control';
import { HelperService } from '@core/services/helper.service';
import { TooltipModule } from 'primeng/tooltip';

type CourseConditionKey = 'hp_hoctruoc' | 'hp_tienquyet' | 'hp_songhanh';
type CourseRow = Pick<ElnKhoaHoc, 'id' | 'title' | 'maso' | 'ctdt_ids'> & {
    params?: Pick<NonNullable<ElnKhoaHoc['params']>, 'sotinchi' | 'sotinchi_th'>;
    ctdt_hocphan_id?: number;
    khoikienthuc?: string;
    hocky?: number;
    hp_hoctruoc?: number[];
    hp_tienquyet?: number[];
    hp_songhanh?: number[];
    selected_hp?: boolean;
};

type SubjectCourseOption = CatalogSubject & { course_id: number };
type StagedCourseAddition = {
    subject: SubjectCourseOption;
    blockKey: string;
    course: CourseRow;
    linkCreated: boolean;
    membershipSynced: boolean;
};
type StagedCourseDeletion = {
    linkId: number;
    course: CourseRow;
    linkDeleted: boolean;
    membershipSynced: boolean;
};
type SubjectSyncOperation =
    | { kind: 'add'; courseId: number; addition: StagedCourseAddition }
    | { kind: 'delete'; courseId: number; deletion: StagedCourseDeletion }
    | { kind: 'update'; courseId: number; course: CourseRow };

export interface typeCtdtHocphan {
    key: string;
    title: string;
    children: CourseRow[];
}

@Component({
    selector: 'app-ctdt-noidung',
    standalone: true,
    imports: [CommonModule, TableModule, FormsModule, ReactiveFormsModule, PopoverModule,
        Drawer, InputTextModule, MatButtonModule, LoadingProgressComponent, IctuPaginatorComponent, TooltipModule],
    templateUrl: './ctdt-noidung.component.html',
    styleUrls: ['./ctdt-noidung.component.css']
})
export class CtdtNoidungComponent implements OnInit, OnChanges, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly cancelLoad$ = new Subject<void>();
    private readonly cancelSubjects$ = new Subject<void>();
    private readonly cancelKhoi$ = new Subject<void>();
    private loadedCtdtId: number | null = null;
    private readonly auth = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly ctdtService = inject(CtdtService);
    private readonly ctdtHocphanService = inject(CtdtHocphanService);
    private readonly elngUserProfileService = inject(ElngUserProfileService);
    private readonly configsService = inject(ConfigsService);
    private readonly elnKhoaHocService = inject(ElnKhoaHocService);
    private readonly subjectCourseService = inject(SubjectCourseService);
    private readonly ctdtConfigService = inject(CtdtConfigService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly helperService = inject(HelperService);
    private readonly emptyKhoiGroup = 'KHOI_KIEN_THUC_EMPTY';
    private emptyKhoiMarker: CtdtConfig | null = null;
    private defaultKhoi: CtdtConfig[] = [];

    @Input() selectedCtdt: Ctdt | null = null;

    isManager = false;
    isLanhDaoKhoa = false;
    userId = 0;
    list_khoikienthuc: CtdtConfig[] = [];
    list_cdt_hocphan: typeCtdtHocphan[] = [];
    readonly formKhoi: FormGroup = this.formBuilder.group({ title: ['', Validators.required] });
    khoiDrawerVisible = false;
    khoiFormHeading = '';
    selectedKhoi: CtdtConfig | null = null;
    readonly savingKhoi: WritableSignal<boolean> = signal(false);
    readonly deletingKhoi: WritableSignal<boolean> = signal(false);

    get blockActionsBusy(): boolean {
        return this.savingKhoi() || this.deletingKhoi() || this.savingHp() || this.isLoadingData();
    }
    list_course: CourseRow[] = [];
    selectedKhoiKienthuc: typeCtdtHocphan | null = null;
    list_subjects: SubjectCourseOption[] = [];
    readonly selectedCourseIds = new Set<number>();
    private readonly selectedSubjects = new Map<number, SubjectCourseOption>();
    private readonly currentBlockLinks = new Map<number, number>();
    private readonly initialDrawerCourseIds = new Set<number>();
    private readonly linkedCourseIds = new Set<number>();
    private courseLinks: CtdtHocphan[] = [];
    private readonly persistedCourseRows = new Map<number, CourseRow>();
    private readonly stagedAdds = new Map<number, StagedCourseAddition>();
    private readonly stagedDeletes = new Map<number, StagedCourseDeletion>();
    private readonly dirtyCourseIds = new Set<number>();
    readonly subjectPaginator = new IctuPaginatorControl({ pageLinkSize: 5, rows: 20, showFirstLastIcon: true });
    private appliedSubjectSearch = '';
    private requestedSubjectPage = 1;
    private subjectRequestId = 0;
    searchCourse = '';
    searchCourse_hp = '';
    readonly isLoadingSubjects: WritableSignal<boolean> = signal(false);
    subjectLoadError = '';
    createError = '';
    courseLoadError = '';
    progressValue = 0;
    readonly savingHp: WritableSignal<boolean> = signal(false);
    savingTitle = 'Đang lưu dữ liệu, vui lòng chờ...';
    drawerChooseMonhocVisible = false;
    list_course_dk: CourseRow[] = [];
    selectedCourseCondition: CourseRow | null = null;
    keyHp: CourseConditionKey | null = null;
    readonly conditionKeys: CourseConditionKey[] = ['hp_hoctruoc', 'hp_tienquyet', 'hp_songhanh'];
    readonly isLoadingData: WritableSignal<boolean> = signal(false);

    constructor() {
        this.isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt, ROLES.daotao_new]
            .some(role => this.auth.userHasRole(role));
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.userId = this.auth.user?.id ?? 0;
    }

    ngOnInit(): void {
        if (!this.isLanhDaoKhoa && !this.isManager) {
            this.router.navigate(['/admin/content-none']);
            return;
        }
        if (this.selectedCtdt?.id) {
            this.initCtdtData(String(this.selectedCtdt.id));
        } else {
            this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
                if (params?.['code']) this.initCtdtData(params['code']);
                else this.router.navigate(['/admin/content-none']);
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedCtdt'] && this.selectedCtdt?.id && !changes['selectedCtdt'].firstChange) {
            this.initCtdtData(String(this.selectedCtdt.id));
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.cancelLoad$.complete();
        this.cancelSubjects$.complete();
        this.cancelKhoi$.complete();
    }

    initCtdtData(ctdtId: string): void {
        if (this.loadedCtdtId === Number(ctdtId)) return;
        this.cancelLoad$.next();
        this.cancelKhoi$.next();
        this.closeDrawerChooseMonhoc();
        this.loadedCtdtId = Number(ctdtId);
        this.list_course = [];
        this.list_cdt_hocphan = [];
        this.courseLinks = [];
        this.khoiDrawerVisible = false;
        this.emptyKhoiMarker = null;
        this.defaultKhoi = [];
        this.persistedCourseRows.clear();
        this.linkedCourseIds.clear();
        this.stagedAdds.clear();
        this.stagedDeletes.clear();
        this.dirtyCourseIds.clear();
        this.isLoadingData.set(true);
        this.courseLoadError = '';

        const condition_ctdt: ConditionOption = {
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: ctdtId }],
            set: [{ label: 'limit', value: '1' }], page: null
        };
        const condition_user: ConditionOption = {
            condition: [{ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: String(this.userId), orWhere: 'and' }],
            set: [{ label: 'limit', value: '1' }], page: null
        };
        const condition_khoi_kienthuc: ConditionOption = {
            condition: [{ conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'KHOI_KIEN_THUC' }],
            set: [{ label: 'limit', value: '1' }], page: null
        };
        const condition_ctdt_config: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: ctdtId }],
            set: [{ label: 'limit', value: '-1' }, { label: 'include', value: 'KHOI_KIEN_THUC,KHOI_KIEN_THUC_EMPTY' },
                { label: 'include_by', value: 'group' }, { label: 'orderby', value: 'ordering' }, { label: 'order', value: 'ASC' }],
            page: null
        };

        forkJoin([
            this.ctdtService.getCtdtByPageNew(condition_ctdt),
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
            this.configsService.getConfigsByPageNew(condition_khoi_kienthuc),
            this.ctdtConfigService.getCtdtConfigByPageNew(condition_ctdt_config)
        ]).pipe(takeUntil(this.cancelLoad$), takeUntil(this.destroy$)).subscribe({
            next: ([ctdt, user, defaults, config]) => {
                this.selectedCtdt = ctdt.data?.[0] || null;
                if (!this.selectedCtdt || (!this.isManager && user.data?.[0]?.donvi_chuyenmon_id !== this.selectedCtdt.category_id)) {
                    this.isLoadingData.set(false);
                    this.router.navigate(['/admin/content-none']);
                    return;
                }
                this.applyKhoiConfig(config.data || [], defaults.data?.[0]?.params, Number(ctdtId));
                this.loadCtdthocPhan();
            },
            error: () => {
                this.loadedCtdtId = null;
                this.isLoadingData.set(false);
                this.courseLoadError = 'Không thể tải thông tin CTĐT. Vui lòng thử lại.';
            }
        });
    }

    loadCtdthocPhan(): void {
        if (!this.selectedCtdt?.id) return;
        const ctdtId = this.selectedCtdt.id;
        this.cancelLoad$.next();
        this.isLoadingData.set(true);
        this.courseLoadError = '';
        const linkCondition: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(ctdtId) }],
            set: [{ label: 'limit', value: '-1' }], page: null
        };
        this.ctdtHocphanService.getCtdtHocphanByPageNew(linkCondition).pipe(
            switchMap(links => {
                const courseIds = [...new Set((links.data || []).map(link => Number(link.course_id)).filter(id => Number.isInteger(id) && id > 0))];
                if (!courseIds.length) return of({ links: links.data || [], courses: [] as ElnKhoaHoc[] });
                const courseCondition: ConditionOption = {
                    condition: [{ conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1' }],
                    set: [{ label: 'limit', value: '-1' }, { label: 'include', value: courseIds.join(',') }, { label: 'include_by', value: 'id' }],
                    page: null
                };
                return this.elnKhoaHocService.getKhoaHocByPageNew_2(courseCondition).pipe(
                    map(response => ({ links: links.data || [], courses: response.data || [] }))
                );
            }),
            takeUntil(this.cancelLoad$), takeUntil(this.destroy$)
        ).subscribe({
            next: ({ links, courses }) => {
                if (this.selectedCtdt?.id !== ctdtId) return;
                this.courseLinks = links;
                const courseById = new Map(courses.map(course => [Number(course.id), course]));
                const drafts = new Map(this.list_course.filter(c => this.dirtyCourseIds.has(c.id)).map(c => [c.id, c]));
                const persistedRows: CourseRow[] = links.reduce<CourseRow[]>((rows, link) => {
                    const course = courseById.get(Number(link.course_id));
                    if (!course) return rows;
                    const draft = drafts.get(course.id);
                    rows.push(draft
                        ? { ...draft, ctdt_hocphan_id: link.id, khoikienthuc: link.khoikienthuc }
                        : {
                            ...course,
                            ctdt_ids: Array.isArray(course.ctdt_ids) ? course.ctdt_ids.map(Number) : [],
                            ctdt_hocphan_id: link.id,
                            khoikienthuc: link.khoikienthuc,
                            hocky: link.hocky ?? null,
                            hp_hoctruoc: [...(link.hp_hoctruoc || [])],
                            hp_tienquyet: [...(link.hp_tienquyet || [])],
                            hp_songhanh: [...(link.hp_songhanh || [])]
                        });
                    return rows;
                }, []);
                persistedRows.forEach(course => this.persistedCourseRows.set(Number(course.id), course));
                this.linkedCourseIds.clear();
                links.forEach(link => this.linkedCourseIds.add(Number(link.course_id)));
                this.reconcileStagedLinks();
                this.applyStagedLinksToView();
                this.isLoadingData.set(false);
            },
            error: () => {
                this.isLoadingData.set(false);
                this.courseLoadError = 'Không thể tải danh sách học phần. Vui lòng thử lại trước khi thêm môn.';
            }
        });
    }

    retryLoad(): void {
        if (this.loadedCtdtId) this.loadCtdthocPhan();
        else if (this.selectedCtdt?.id) this.initCtdtData(String(this.selectedCtdt.id));
    }

    private applyKhoiConfig(rows: CtdtConfig[], defaults: unknown, ctdtId: number): void {
        this.emptyKhoiMarker = rows.find(item => item.group === this.emptyKhoiGroup) || null;
        if (Array.isArray(defaults)) this.defaultKhoi = defaults;
        const custom = rows.filter(item => item.group === 'KHOI_KIEN_THUC');
        this.list_khoikienthuc = custom.length ? custom : this.emptyKhoiMarker ? []
            : this.defaultKhoi.map((item, index) => ({ ...item, ctdt_id: ctdtId,
                group: 'KHOI_KIEN_THUC', ordering: item.ordering ?? index + 1 }));
        this.groupCourses();
    }

    private getKhoiConfig(ctdtId: number): Observable<CtdtConfig[]> {
        return this.ctdtConfigService.getCtdtConfigByPageNew({
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(ctdtId) }],
            set: [{ label: 'limit', value: '-1' }, { label: 'include', value: 'KHOI_KIEN_THUC,KHOI_KIEN_THUC_EMPTY' },
                { label: 'include_by', value: 'group' }, { label: 'orderby', value: 'ordering' }, { label: 'order', value: 'ASC' }],
            page: null
        }).pipe(map(response => response.data || []));
    }

    private refreshKhoiConfig(ctdtId: number, message: string): void {
        this.getKhoiConfig(ctdtId).pipe(takeUntil(this.destroy$)).subscribe({
            next: rows => {
                if (this.selectedCtdt?.id !== ctdtId) return;
                this.applyKhoiConfig(rows, undefined, ctdtId);
                this.khoiDrawerVisible = false;
                this.loadCtdthocPhan();
                this.notificationService.toastSuccess(message);
            },
            error: () => this.notificationService.toastError('Không thể tải lại danh sách khối kiến thức')
        });
    }

    openAddKhoi(): void {
        if (this.blockActionsBusy || this.hasPendingChanges()) {
            if (this.hasPendingChanges()) this.notificationService.toastWarning('Vui lòng lưu các thay đổi học phần trước khi thêm khối kiến thức.');
            return;
        }
        this.formKhoi.reset({ title: '' });
        this.selectedKhoi = null;
        this.khoiFormHeading = 'Thêm khối kiến thức';
        this.khoiDrawerVisible = true;
    }

    openEditKhoi(block: typeCtdtHocphan): void {
        const config = this.list_khoikienthuc.find(item => item.key === block.key);
        if (!config || this.blockActionsBusy || this.hasPendingChanges()) {
            if (this.hasPendingChanges()) this.notificationService.toastWarning('Vui lòng lưu các thay đổi học phần trước khi sửa khối kiến thức.');
            return;
        }
        this.selectedKhoi = config;
        this.formKhoi.reset({ title: config.title });
        this.khoiFormHeading = 'Sửa khối kiến thức';
        this.khoiDrawerVisible = true;
    }

    closeKhoiDrawer(): void {
        if (!this.savingKhoi() && !this.deletingKhoi()) this.khoiDrawerVisible = false;
    }

    saveKhoi(): void {
        if (!this.selectedCtdt || this.savingKhoi() || this.deletingKhoi()) return;
        this.formKhoi.markAllAsTouched();
        const title = String(this.formKhoi.value.title || '').trim();
        if (this.formKhoi.invalid || !title) return;
        const programmeId = this.selectedCtdt.id;
        const hasPendingChanges = this.hasPendingChanges();
        if (hasPendingChanges) {
            this.notificationService.toastWarning('Vui lòng lưu các thay đổi học phần trước khi sửa khối kiến thức.');
            return;
        }
        const selected = this.selectedKhoi;
        const editing = Boolean(selected);
        const defaultSnapshot = this.list_khoikienthuc.map(item => ({ ...item }));
        const key = selected?.key || this.helperService.slugVietnamese(title);
        if (!key || this.list_khoikienthuc.some(item => item.key !== selected?.key
            && (item.key === key || item.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase()))) {
            this.notificationService.toastWarning('Khối kiến thức đã tồn tại hoặc không hợp lệ');
            return;
        }
        const payload: CtdtConfig = { ctdt_id: programmeId, group: 'KHOI_KIEN_THUC', key, title,
            ordering: selected?.ordering || this.list_khoikienthuc.length + 1, noidung: selected?.noidung || '' };
        this.savingKhoi.set(true);
        this.getKhoiConfig(programmeId).pipe(
            switchMap(rows => {
                const real = rows.filter(item => item.group === 'KHOI_KIEN_THUC');
                const persisted = real.find(item => item.key === selected?.key);
                if (editing && persisted?.id) return this.ctdtConfigService.updateCtdtConfig(persisted.id, payload);
                const savedKeys = new Set(real.map(item => item.key));
                const defaultsToMaterialize = defaultSnapshot
                    .filter(item => !savedKeys.has(item.key))
                    .map((item, index) => () => this.ctdtConfigService.addCtdtConfig({
                        ctdt_id: programmeId, group: 'KHOI_KIEN_THUC', key: item.key,
                        title: editing && item.key === key ? title : item.title,
                        ordering: item.ordering ?? index + 1, noidung: item.noidung || ''
                    }));
                return (defaultsToMaterialize.length ? from(defaultsToMaterialize).pipe(concatMap(request => defer(request)), toArray()) : of([]))
                    .pipe(switchMap(() => editing ? of(null) : real.some(item => item.key === key) ? of(null)
                        : this.ctdtConfigService.addCtdtConfig(payload)));
            }),
            switchMap(saved => this.emptyKhoiMarker?.id ? this.ctdtConfigService.deleteCtdtConfig(this.emptyKhoiMarker.id).pipe(map(() => saved)) : of(saved)),
            takeUntil(this.destroy$), finalize(() => this.savingKhoi.set(false))
        ).subscribe({
            next: () => this.refreshKhoiConfig(programmeId, 'Lưu khối kiến thức thành công'),
            error: () => this.notificationService.toastError('Không thể lưu khối kiến thức')
        });
    }

    deleteKhoi(block: typeCtdtHocphan): void {
        if (!this.selectedCtdt || this.blockActionsBusy || !block.key || this.courseLoadError) return;
        if (this.hasPendingChanges()) {
            this.notificationService.toastWarning('Vui lòng lưu các thay đổi học phần trước khi xóa khối kiến thức.');
            return;
        }
        const config = this.list_khoikienthuc.find(item => item.key === block.key);
        if (!config) return;
        const programmeId = this.selectedCtdt.id;
        const defaultSnapshot = this.list_khoikienthuc.map(item => ({ ...item }));
        const count = this.courseLinks.filter(link => link.khoikienthuc === block.key).length;
        const safeTitle = block.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        this.notificationService.confirmDelete2({
            heading: 'Xóa khối kiến thức và học phần',
            htmlMessage: `Xóa khối "${safeTitle}" và toàn bộ học phần thuộc khối trong CTĐT này (hiện có ${count} học phần)? Môn học gốc không bị xóa.`
        }).pipe(takeUntil(this.cancelKhoi$), takeUntil(this.destroy$)).subscribe(confirmed => {
            if (!confirmed || this.selectedCtdt?.id !== programmeId || this.blockActionsBusy || this.hasPendingChanges()) return;
            this.deletingKhoi.set(true);
            const operation = forkJoin({
                configs: this.getKhoiConfig(programmeId),
                links: this.ctdtHocphanService.getCtdtHocphanByPageNew({
                    condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(programmeId) }],
                    set: [{ label: 'limit', value: '-1' }], page: null
                })
            }).pipe(switchMap(({ configs, links }) => this.buildDeleteKhoiOperation(
                programmeId, block.key, defaultSnapshot, configs, links.data || []
            )));
            let operationComplete = false;
            const controller = new IctuDeletingAnimationControl([1], {
                // One sequential operation: a failed child deletion must prevent deleting the block.
                delete: () => operation.pipe(
                    tap(() => operationComplete = true),
                    takeUntil(this.cancelKhoi$), takeUntil(this.destroy$)
                )
            });
            this.notificationService.startDeleting(controller.progress).pipe(
                takeUntil(this.cancelKhoi$), takeUntil(this.destroy$),
                finalize(() => this.deletingKhoi.set(false))
            ).subscribe({
                next: ok => {
                    if (this.selectedCtdt?.id !== programmeId) return;
                    if (ok && operationComplete) {
                        this.refreshKhoiConfig(programmeId, 'Xóa khối kiến thức và học phần thành công');
                    } else {
                        this.notificationService.toastError('Xóa chưa hoàn tất. Khối được giữ lại nếu còn học phần chưa xóa; vui lòng tải lại và thử lại.');
                        this.refreshKhoiConfig(programmeId, '');
                    }
                },
                error: () => this.notificationService.toastError('Xóa khối kiến thức thất bại')
            });
            controller.run();
        });
    }

    private buildDeleteKhoiOperation(
        programmeId: number, blockKey: string, snapshot: CtdtConfig[], configs: CtdtConfig[], links: CtdtHocphan[]
    ): Observable<unknown> {
        const targets = links.filter(link => Number(link.ctdt_id) === Number(programmeId) && link.khoikienthuc === blockKey);
        const remainingLinks = links.filter(link => !targets.includes(link));
        const real = configs.filter(item => item.group === 'KHOI_KIEN_THUC');
        const configTargets = real.filter(item => item.key === blockKey);
        if ([...targets, ...configTargets].some(item => !Number.isInteger(Number(item.id)) || Number(item.id) <= 0)) {
            return throwError(() => new Error('Liên kết hoặc khối kiến thức không có ID hợp lệ'));
        }
        const removedCourseIds = new Set(targets.map(link => Number(link.course_id)));
        remainingLinks.forEach(link => removedCourseIds.delete(Number(link.course_id)));
        const requests: Array<() => Observable<unknown>> = [];
        // Preserve untouched default blocks when creating the first programme-specific configuration.
        snapshot.filter(item => item.key !== blockKey && !real.some(saved => saved.key === item.key))
            .forEach((item, index) => requests.push(() => this.ctdtConfigService.addCtdtConfig({
                ctdt_id: programmeId, group: 'KHOI_KIEN_THUC', key: item.key, title: item.title,
                ordering: item.ordering ?? index + 1, noidung: item.noidung || ''
            })));
        const remainingBlocks = new Set([...snapshot, ...real].filter(item => item.key !== blockKey).map(item => item.key));
        remainingLinks.forEach(link => {
            const patch: Partial<CtdtHocphan> = {};
            this.conditionKeys.forEach(key => {
                const current = link[key] || [];
                const filtered = current.filter(id => !removedCourseIds.has(Number(id)));
                if (filtered.length !== current.length) patch[key] = filtered;
            });
            if (Object.keys(patch).length) requests.push(() => this.ctdtHocphanService.updateCtdtHocphan(link.id, patch));
        });
        targets.forEach(link => requests.push(() => {
            const courseId = Number(link.course_id);
            const deletion: StagedCourseDeletion = {
                linkId: Number(link.id),
                course: this.persistedCourseRows.get(courseId) || {
                    id: courseId, title: link.course_name, maso: '', khoikienthuc: blockKey
                },
                linkDeleted: false,
                membershipSynced: false
            };
            if (this.selectedCtdt?.id === programmeId) this.stagedDeletes.set(courseId, deletion);
            return this.saveSubjectOperation({ kind: 'delete', courseId, deletion }, { id: programmeId } as Ctdt).pipe(
                tap(() => {
                    if (this.stagedDeletes.get(courseId) === deletion) this.stagedDeletes.delete(courseId);
                })
            );
        }));
        requests.push(() => this.ctdtHocphanService.getCtdtHocphanByPageNew({
            condition: [
                { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(programmeId) },
                { conditionName: 'khoikienthuc', condition: OvicQueryCondition.equal, value: blockKey, orWhere: 'and' }
            ], set: [{ label: 'limit', value: '-1' }], page: null
        }).pipe(switchMap(response => response.data?.length
            ? throwError(() => new Error('Khối vẫn còn học phần, vui lòng thử lại')) : of(null))));
        configTargets.forEach(item => requests.push(() => this.ctdtConfigService.deleteCtdtConfig(item.id)));
        if (!remainingBlocks.size && !configs.some(item => item.group === this.emptyKhoiGroup)) {
            requests.push(() => this.ctdtConfigService.addCtdtConfig({
                ctdt_id: programmeId, group: this.emptyKhoiGroup, key: 'khoi_kien_thuc_empty',
                title: 'Đã xóa toàn bộ khối kiến thức', ordering: 1
            }));
        }
        return from(requests).pipe(concatMap(request => defer(request)), toArray());
    }

    private groupCourses(): void {
        this.list_cdt_hocphan = this.list_khoikienthuc.map(block => ({
            key: block.key, title: block.title,
            children: this.list_course.filter(course => course.khoikienthuc === block.key)
        }));
        const other = this.list_course.filter(course => !this.list_khoikienthuc.some(block => block.key === course.khoikienthuc));
        if (other.length) this.list_cdt_hocphan.push({ key: '', title: 'Chưa xác định khối kiến thức', children: other });
    }

    getTotalHocphanCount(): number {
        return this.list_course.length;
    }

    filterCourses(courses: CourseRow[], query: string): CourseRow[] {
        const keyword = query?.trim().toLocaleLowerCase('vi') ?? '';
        return keyword ? courses.filter(course => `${course.title || ''} ${course.maso || ''}`.toLocaleLowerCase('vi').includes(keyword)) : courses;
    }

    getTotalCredits(): number {
        return this.list_cdt_hocphan.reduce((sum, block) => sum + this.getBlockCredits(block), 0);
    }

    getTotalPracticeCredits(): number {
        return this.list_cdt_hocphan.reduce((sum, block) => sum + this.getBlockPracticeCredits(block), 0);
    }

    getBlockCredits(block: typeCtdtHocphan): number {
        return block.children.reduce((sum, course) => sum + Number(course.params?.sotinchi || 0), 0);
    }

    getBlockPracticeCredits(block: typeCtdtHocphan): number {
        return block.children.reduce((sum, course) => sum + Number(course.params?.sotinchi_th || 0), 0);
    }

    openSelectedMonhoc(block: typeCtdtHocphan): void {
        if (this.savingHp() || this.isLoadingData() || this.courseLoadError || !block.key || this.deletingKhoi()) return;
        this.selectedKhoiKienthuc = block;
        this.searchCourse = '';
        this.appliedSubjectSearch = '';
        this.selectedCourseIds.clear();
        this.selectedSubjects.clear();
        this.currentBlockLinks.clear();
        this.initialDrawerCourseIds.clear();
        this.courseLinks
            .filter(link => link.khoikienthuc === block.key)
            .forEach(link => {
                const courseId = Number(link.course_id);
                const linkId = Number(link.id);
                if (!Number.isInteger(courseId) || courseId <= 0 || !Number.isInteger(linkId) || linkId <= 0) return;
                this.currentBlockLinks.set(courseId, linkId);
                if (!this.stagedDeletes.has(courseId)) this.selectedCourseIds.add(courseId);
            });
        this.stagedAdds.forEach(({ subject, blockKey }) => {
            if (blockKey === block.key) {
                this.selectedCourseIds.add(Number(subject.course_id));
                this.selectedSubjects.set(Number(subject.course_id), subject);
            }
        });
        this.selectedCourseIds.forEach(courseId => this.initialDrawerCourseIds.add(courseId));
        this.createError = '';
        this.list_subjects = [];
        this.subjectPaginator.reset(0);
        this.drawerChooseMonhocVisible = true;
        this.loadSubjects(1, true);
    }

    loadSubjects(page = 1, resetSearch = false): void {
        if (this.savingHp() || !this.drawerChooseMonhocVisible) return;
        this.cancelSubjects$.next();
        const requestId = ++this.subjectRequestId;
        this.requestedSubjectPage = page;
        if (resetSearch) this.appliedSubjectSearch = this.searchCourse.trim();
        this.isLoadingSubjects.set(true);
        this.subjectLoadError = '';
        const boId = this.selectedCtdt?.ctdt_bo_id;
        if (!boId) {
            this.isLoadingSubjects.set(false);
            this.subjectLoadError = 'CTĐT chưa thuộc bộ chương trình đào tạo nên không thể tải danh mục môn học.';
            return;
        }
        this.subjectCourseService.get(
            [{ conditionName: 'ctdt_bo_id', condition: OvicQueryCondition.equal, value: String(boId), orWhere: 'and' }],
            { limit: this.subjectPaginator.rows(), paged: page, orderby: 'id', order: 'ASC', with: 'subjects' }
        ).pipe(
            takeUntil(this.cancelSubjects$), takeUntil(this.destroy$)
        ).subscribe({
            next: response => {
                if (requestId !== this.subjectRequestId || this.selectedCtdt?.ctdt_bo_id !== boId) return;
                this.list_subjects = this.flattenSubjectCourses(response.data || []);
                const total = Number(response.totalRecords) || 0;
                this.subjectPaginator.reset(total);
                this.subjectPaginator.changePage(page);
                this.isLoadingSubjects.set(false);
            },
            error: () => {
                if (requestId !== this.subjectRequestId) return;
                this.isLoadingSubjects.set(false);
                this.subjectPaginator.changePage(this.requestedSubjectPage);
                this.subjectLoadError = 'Không thể tải danh mục môn học của bộ CTĐT. Vui lòng thử lại.';
            }
        });
    }

    private flattenSubjectCourses(relations: SubjectCourseExtend[]): SubjectCourseOption[] {
        const subjects: SubjectCourseOption[] = [];
        const seen = new Set<number>();
        relations.forEach(relation => {
            const entries = Array.isArray(relation.subjects) ? relation.subjects : relation.subjects ? [relation.subjects] : [];
            const subject = entries.find(item => item && Number(item.id) === Number(relation.subject_id));
            if (subject && !seen.has(Number(subject.id))) {
                seen.add(Number(subject.id));
                subjects.push({ ...subject, course_id: Number(relation.course_id) });
            }
        });
        return subjects.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    }

    closeDrawerChooseMonhoc(): void {
        if (this.savingHp()) return;
        this.drawerChooseMonhocVisible = false;
        this.onSubjectDrawerHide();
    }

    onSubjectDrawerHide(): void {
        this.cancelSubjects$.next();
        this.isLoadingSubjects.set(false);
        this.selectedKhoiKienthuc = null;
        this.selectedCourseIds.clear();
        this.selectedSubjects.clear();
        this.currentBlockLinks.clear();
        this.initialDrawerCourseIds.clear();
    }

    isSubjectCreated(subject: SubjectCourseOption): boolean {
        const courseId = Number(subject.course_id);
        const link = this.courseLinks.find(item => Number(item.course_id) === courseId);
        if (link && link.khoikienthuc !== this.selectedKhoiKienthuc?.key) return true;
        const staged = this.stagedAdds.get(courseId);
        return Boolean(staged && staged.blockKey !== this.selectedKhoiKienthuc?.key);
    }

    isSubjectSelected(subject: SubjectCourseOption): boolean {
        return this.selectedCourseIds.has(Number(subject.course_id));
    }

    toggleSubjectCheck(subject: SubjectCourseOption): void {
        if (this.savingHp() || this.isLoadingSubjects() || this.isSubjectCreated(subject)) return;
        const courseId = Number(subject.course_id);
        if (!Number.isInteger(courseId) || courseId <= 0) return;
        if (this.selectedCourseIds.has(courseId)) this.selectedCourseIds.delete(courseId);
        else this.selectedCourseIds.add(courseId);
        this.selectedSubjects.set(courseId, subject);
    }

    hasSubjectChanges(): boolean {
        return [...this.initialDrawerCourseIds].some(courseId => !this.selectedCourseIds.has(courseId))
            || [...this.selectedCourseIds].some(courseId => !this.initialDrawerCourseIds.has(courseId));
    }

    saveCoursesFromSubjects(): void {
        if (this.savingHp() || this.isLoadingSubjects() || !this.selectedKhoiKienthuc?.key) return;
        const blockKey = this.selectedKhoiKienthuc.key;
        const additions = [...this.selectedCourseIds]
            .filter(courseId => !this.currentBlockLinks.has(courseId))
            .map(courseId => this.selectedSubjects.get(courseId));
        if (additions.some(subject => !subject)) {
            this.createError = 'Không thể xác định thông tin học phần đã chọn. Vui lòng tải lại danh mục và chọn lại.';
            return;
        }
        const invalidSubject = additions.find(subject => !Number.isInteger(Number(subject.course_id)) || Number(subject.course_id) <= 0);
        if (invalidSubject) {
            this.createError = 'Môn học chưa có course_id trong subject-courses. Vui lòng tạo course cho môn này trước.';
            return;
        }
        this.currentBlockLinks.forEach((linkId, courseId) => {
            if (this.selectedCourseIds.has(courseId)) {
                this.stagedDeletes.delete(courseId);
                return;
            }
            const course = this.persistedCourseRows.get(courseId) || this.list_course.find(item => Number(item.id) === courseId);
            if (course) this.stagedDeletes.set(courseId, { linkId, course, linkDeleted: false, membershipSynced: false });
        });
        this.stagedAdds.forEach((addition, courseId) => {
            if (addition.blockKey === blockKey && !this.selectedCourseIds.has(courseId)) {
                this.stagedAdds.delete(courseId);
                this.dirtyCourseIds.delete(courseId);
            }
        });
        this.selectedCourseIds.forEach(courseId => {
            if (!this.currentBlockLinks.has(courseId)) {
                this.stagedDeletes.delete(courseId);
                const subject = this.selectedSubjects.get(courseId);
                if (subject && !this.stagedAdds.has(courseId)) {
                    this.stagedAdds.set(courseId, {
                        subject,
                        blockKey,
                        course: this.buildDraftCourse(subject, blockKey),
                        linkCreated: false,
                        membershipSynced: false
                    });
                }
            }
        });
        this.reconcileStagedLinks();
        this.applyStagedLinksToView();
        this.closeDrawerChooseMonhoc();
    }

    private reconcileStagedLinks(): void {
        this.stagedDeletes.forEach((deletion, courseId) => {
            if (!this.courseLinks.some(link => Number(link.id) === deletion.linkId && Number(link.course_id) === courseId)) {
                deletion.linkDeleted = true;
            }
        });
        this.stagedAdds.forEach((addition, courseId) => {
            if (this.linkedCourseIds.has(courseId)) addition.linkCreated = true;
        });
        const currentIds = new Set(this.courseLinks.map(link => Number(link.course_id)));
        this.persistedCourseRows.forEach((_, courseId) => {
            if (!currentIds.has(courseId) && !this.stagedDeletes.has(courseId)) this.persistedCourseRows.delete(courseId);
        });
    }

    private buildDraftCourse(subject: SubjectCourseOption, blockKey: string): CourseRow {
        return {
            id: subject.course_id,
            title: subject.name,
            maso: subject.code,
            khoikienthuc: blockKey,
            hocky: null,
            hp_hoctruoc: [],
            hp_tienquyet: [],
            hp_songhanh: [],
            params: {
                sotinchi: Number(subject.sotinchi) || 0,
                sotinchi_th: Number(subject.sotinchi_th) || 0
            }
        };
    }

    private normalizeCtdtIds(value: unknown): number[] {
        return [...new Set((Array.isArray(value) ? value : [])
            .map(Number)
            .filter(id => Number.isInteger(id) && id > 0))];
    }

    private loadCourse(courseId: number): Observable<ElnKhoaHoc> {
        const condition: ConditionOption = {
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: String(courseId) }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };
        return this.elnKhoaHocService.getKhoaHocByPageNew_2(condition).pipe(
            map(response => response.data?.[0]),
            switchMap(course => course ? of(course) : throwError(() => new Error(`Không tìm thấy học phần #${courseId}`)))
        );
    }

    private syncCourseMembership(courseId: number, programmeId: number, add: boolean): Observable<unknown> {
        return this.loadCourse(courseId).pipe(
            switchMap(course => {
                const current = this.normalizeCtdtIds(course.ctdt_ids);
                const ctdtIds = add
                    ? this.normalizeCtdtIds([...current, programmeId])
                    : current.filter(id => id !== programmeId);
                const source = Array.isArray(course.ctdt_ids) ? course.ctdt_ids : [];
                if (ctdtIds.length === source.length && ctdtIds.every((id, index) => id === source[index])) return of(course);
                return this.elnKhoaHocService.updateElnKhoaHoc(courseId, { ctdt_ids: ctdtIds });
            })
        );
    }

    private getCourseLinks(courseId: number, programmeId: number): Observable<CtdtHocphan[]> {
        return this.ctdtHocphanService.getCtdtHocphanByPageNew({
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: String(courseId), orWhere: 'and' },
                { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(programmeId), orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }], page: null
        }).pipe(map(response => response.data || []));
    }

    private saveSubjectOperation(operation: SubjectSyncOperation, ctdt: Ctdt): Observable<unknown> {
        if (operation.kind === 'delete') {
            const { deletion } = operation;
            const deleteLink = deletion.linkDeleted
                ? of(null)
                : this.ctdtHocphanService.deleteCtdtHocphan(deletion.linkId).pipe(
                    tap(() => deletion.linkDeleted = true),
                    catchError(error => this.getCourseLinks(operation.courseId, ctdt.id).pipe(
                        switchMap(links => links.some(link => Number(link.id) === deletion.linkId)
                            ? throwError(() => error) : of(null)),
                        tap(() => deletion.linkDeleted = true)
                    ))
                );
            return deleteLink.pipe(switchMap(() => deletion.membershipSynced
                ? of(null)
                : this.getCourseLinks(operation.courseId, ctdt.id).pipe(
                    switchMap(links => links.some(link => Number(link.id) !== deletion.linkId)
                        ? of(null) : this.syncCourseMembership(operation.courseId, ctdt.id, false)),
                    tap(() => deletion.membershipSynced = true)
                )
            ));
        }
        if (operation.kind === 'add') {
            const { addition } = operation;
            const createLink = addition.linkCreated
                ? of(null)
                : this.ctdtHocphanService.addCtdtHocphan(
                    this.buildCtdtHocphan(addition.subject, ctdt, addition.blockKey, addition.course)
                ).pipe(
                    tap(() => addition.linkCreated = true),
                    catchError(error => this.getCourseLinks(operation.courseId, ctdt.id).pipe(
                        switchMap(links => links.some(link => link.khoikienthuc === addition.blockKey)
                            ? of(null) : throwError(() => error)),
                        tap(() => addition.linkCreated = true)
                    ))
                );
            return createLink.pipe(switchMap(() => addition.membershipSynced
                ? of(null)
                : this.syncCourseMembership(operation.courseId, ctdt.id, true)
                    .pipe(tap(() => addition.membershipSynced = true))
            ));
        }
        return this.ctdtHocphanService.updateCtdtHocphan(operation.course.ctdt_hocphan_id, {
            hocky: operation.course.hocky,
            hp_hoctruoc: operation.course.hp_hoctruoc || [],
            hp_tienquyet: operation.course.hp_tienquyet || [],
            hp_songhanh: operation.course.hp_songhanh || []
        });
    }

    removeCourseFromBlock(course: CourseRow, popover?: { hide: () => void }): void {
        if (!this.selectedCtdt?.id || this.blockActionsBusy || this.courseLoadError || !course?.id) return;

        const courseId = Number(course.id);
        if (!Number.isInteger(courseId) || courseId <= 0
            || !this.list_course.some(item => Number(item.id) === courseId && item.khoikienthuc === course.khoikienthuc)) return;

        const pendingAddition = this.stagedAdds.get(courseId);
        const stagedAddition = Boolean(pendingAddition && !pendingAddition.linkCreated);
        if (!stagedAddition) {
            const linkId = Number(course.ctdt_hocphan_id);
            if (!Number.isInteger(linkId) || linkId <= 0
                || !this.courseLinks.some(link => Number(link.id) === linkId && Number(link.course_id) === courseId)) {
                this.notificationService.toastWarning('Không xác định được liên kết học phần. Vui lòng tải lại dữ liệu.');
                return;
            }
        }

        const programmeId = this.selectedCtdt.id;
        const safeTitle = String(course.title || '').replace(/&/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        this.notificationService.confirmDelete2({
            heading: 'Xác nhận gỡ học phần',
            htmlMessage: `Bạn có chắc muốn gỡ học phần <b>"${safeTitle}"</b> khỏi khối kiến thức? Môn học gốc không bị xóa.`
                + (stagedAddition ? '' : ' Bấm Lưu lại để áp dụng thay đổi.')
        }).pipe(takeUntil(this.cancelKhoi$), takeUntil(this.destroy$)).subscribe(confirmed => {
            if (!confirmed || this.blockActionsBusy || this.courseLoadError || this.selectedCtdt?.id !== programmeId
                || !this.list_course.includes(course) || this.stagedAdds.get(courseId) !== pendingAddition) return;

            if (stagedAddition) {
                this.stagedAdds.delete(courseId);
                this.dirtyCourseIds.delete(courseId);
            } else {
                this.stagedAdds.delete(courseId);
                this.stagedDeletes.set(courseId, {
                    linkId: Number(course.ctdt_hocphan_id),
                    course,
                    linkDeleted: false,
                    membershipSynced: false
                });
            }

            if (this.selectedCourseCondition?.id === courseId) {
                popover?.hide();
                this.selectedCourseCondition = null;
                this.keyHp = null;
                this.list_course_dk = [];
            }
            this.applyStagedLinksToView();
            this.notificationService.toastInfo(stagedAddition
                ? `Đã bỏ học phần "${course.title}" chưa lưu.`
                : `Đã đánh dấu gỡ học phần "${course.title}". Bấm Lưu lại để áp dụng.`);
        });
    }

    private applyStagedLinksToView(): void {
        this.list_course = [
            ...[...this.persistedCourseRows.values()].filter(course => !this.stagedDeletes.has(Number(course.id))),
            ...[...this.stagedAdds.entries()]
                .filter(([courseId]) => !this.linkedCourseIds.has(courseId))
                .map(([, addition]) => addition.course)
        ];
        this.groupCourses();
    }

    hasPendingChanges(): boolean {
        return this.dirtyCourseIds.size > 0 || this.stagedAdds.size > 0 || this.stagedDeletes.size > 0;
    }

    private buildCtdtHocphan(subject: SubjectCourseOption, ctdt: Ctdt, blockKey: string, course?: CourseRow): Partial<CtdtHocphan> {
        return {
            ctdt_id: ctdt.id,
            course_id: subject.course_id,
            course_name: subject.name,
            khoikienthuc: blockKey,
            sotinchi: Number(subject.sotinchi) || 0,
            sotinchi_thuchanh: Number(subject.sotinchi_th) || 0,
            hocky: course?.hocky ?? null,
            hp_hoctruoc: course?.hp_hoctruoc || [],
            hp_tienquyet: course?.hp_tienquyet || [],
            hp_songhanh: course?.hp_songhanh || [],
            category_id: ctdt.category_id,
            status: 1,
            ordering: 100
        };
    }

    onSemesterChange(course: CourseRow, value: string): void {
        course.hocky = value === '' ? null : Number(value);
        this.dirtyCourseIds.add(course.id);
    }

    saveCourseDetails(): void {
        if (this.savingHp() || this.isLoadingData()) return;
        const courses = this.list_course.filter(course => this.dirtyCourseIds.has(Number(course.id)) && course.ctdt_hocphan_id);
        const additions = [...this.stagedAdds.entries()]
            .filter(([, addition]) => !addition.linkCreated || !addition.membershipSynced)
            .map(([courseId, addition]) => ({ kind: 'add' as const, courseId, addition }));
        const deletions = [...this.stagedDeletes.entries()]
            .filter(([, deletion]) => !deletion.linkDeleted || !deletion.membershipSynced)
            .map(([courseId, deletion]) => ({ kind: 'delete' as const, courseId, deletion }));
        if (!courses.length && !additions.length && !deletions.length) return;
        if (this.list_course.some(course => this.dirtyCourseIds.has(Number(course.id))
            && !course.ctdt_hocphan_id && !this.stagedAdds.has(Number(course.id)))) {
            this.notificationService.toastWarning('Học phần chưa có liên kết CTĐT. Vui lòng tải lại trước khi lưu học kỳ.');
            return;
        }
        if (this.list_course.some(course => course.hocky != null && (!Number.isInteger(course.hocky) || course.hocky < 1))) {
            this.notificationService.toastWarning('Học kỳ phải là số nguyên lớn hơn 0 hoặc để trống.');
            return;
        }
        const ctdt = this.selectedCtdt;
        if (!ctdt?.id) return;
        const operations: SubjectSyncOperation[] = [
            ...deletions,
            ...additions,
            ...courses.map(course => ({ kind: 'update' as const, courseId: Number(course.id), course }))
        ];
        let completed = 0;
        let current = operations[0];
        this.savingHp.set(true);
        this.savingTitle = 'Đang lưu thay đổi học phần...';
        this.progressValue = 0;
        from(operations).pipe(
            concatMap(operation => {
                current = operation;
                this.savingTitle = operation.kind === 'delete'
                    ? `Đang xóa liên kết ${completed + 1}/${operations.length}...`
                    : operation.kind === 'add'
                        ? `Đang thêm học phần ${completed + 1}/${operations.length}...`
                        : `Đang cập nhật học phần ${completed + 1}/${operations.length}...`;
                const request = this.saveSubjectOperation(operation, ctdt);
                return request.pipe(tap(() => {
                    completed++;
                    this.progressValue = Math.round(completed / operations.length * 100);
                    if (operation.kind === 'delete') {
                        if (operation.deletion.linkDeleted && operation.deletion.membershipSynced) {
                            this.stagedDeletes.delete(operation.courseId);
                            this.dirtyCourseIds.delete(operation.courseId);
                        }
                    } else if (operation.kind === 'add') {
                        if (operation.addition.linkCreated && operation.addition.membershipSynced) {
                            this.stagedAdds.delete(operation.courseId);
                            this.dirtyCourseIds.delete(operation.courseId);
                        }
                    } else {
                        this.dirtyCourseIds.delete(operation.courseId);
                    }
                }));
            }),
            toArray(), takeUntil(this.destroy$), finalize(() => this.savingHp.set(false))
        ).subscribe({
            next: () => {
                this.stagedAdds.clear();
                this.stagedDeletes.clear();
                this.dirtyCourseIds.clear();
                this.notificationService.toastSuccess('Lưu thay đổi thành công');
                if (this.selectedCtdt?.id === ctdt.id) this.loadCtdthocPhan();
            },
            error: error => {
                const label = current.kind === 'delete'
                    ? `liên kết #${current.deletion.linkId}`
                    : current.kind === 'add'
                        ? current.addition.subject.name
                        : current.course.title;
                const message = typeof error?.error?.message === 'string' ? error.error.message : error?.message || 'Vui lòng thử lại.';
                this.notificationService.toastError(`Đã xử lý ${completed}/${operations.length}. Lỗi tại ${label}: ${message}`);
                if (this.selectedCtdt?.id === ctdt.id) this.loadCtdthocPhan();
            }
        });
    }

    pointQuestionKeyDown(event: KeyboardEvent): void {
        const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
        if (event.ctrlKey || event.metaKey || /^[0-9]$/.test(event.key) || allowed.includes(event.key)) return;
        event.preventDefault();
    }

    togglePanel(child: CourseRow, popover: { toggle: (event: Event) => void }, event: Event, key: CourseConditionKey): void {
        if (this.savingHp() || this.isLoadingData()) return;
        this.selectedCourseCondition = child;
        this.keyHp = key;
        this.searchCourse_hp = '';
        const currentSelections = child[key] || [];
        this.list_course_dk = this.list_course.filter(course => course.id !== child.id && child.hocky > 0 && course.hocky > 0
            && (key === 'hp_songhanh' ? Number(course.hocky) === Number(child.hocky) : Number(course.hocky) < Number(child.hocky)))
            .map(course => ({ ...course, selected_hp: currentSelections.includes(course.id) }))
            .sort((a, b) => Number(b.selected_hp) - Number(a.selected_hp));
        popover.toggle(event);
    }

    toggleCourseCondition(course: CourseRow): void {
        if (!this.selectedCourseCondition || !this.keyHp || this.savingHp()) return;
        course.selected_hp = !course.selected_hp;
        const current = [...(this.selectedCourseCondition[this.keyHp] || [])];
        this.selectedCourseCondition[this.keyHp] = course.selected_hp
            ? [...new Set([...current, course.id])] : current.filter(id => id !== course.id);
        this.dirtyCourseIds.add(this.selectedCourseCondition.id);
    }

    getSelectedConditionCount(child: CourseRow, key: CourseConditionKey): number {
        return child[key]?.length || 0;
    }
}
