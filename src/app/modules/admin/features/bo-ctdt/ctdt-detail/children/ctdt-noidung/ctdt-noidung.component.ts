import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core-new/service/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { CtdtHocphanService } from '@modules/shared/services/ctdt-hocphan.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { concatMap, finalize, forkJoin, from, map, of, Subject, switchMap, takeUntil, tap, toArray } from 'rxjs';
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

type CourseConditionKey = 'hp_hoctruoc' | 'hp_tienquyet' | 'hp_songhanh';
type CourseRow = Pick<ElnKhoaHoc, 'id' | 'title' | 'maso'> & {
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
type StagedCourseAddition = { subject: SubjectCourseOption; blockKey: string; course: CourseRow };
type SubjectSyncOperation =
    | { kind: 'add'; courseId: number; addition: StagedCourseAddition }
    | { kind: 'delete'; courseId: number; linkId: number }
    | { kind: 'update'; courseId: number; course: CourseRow };

export interface typeCtdtHocphan {
    key: string;
    title: string;
    children: CourseRow[];
}

@Component({
    selector: 'app-ctdt-noidung',
    standalone: true,
    imports: [CommonModule, TableModule, FormsModule, PopoverModule,
        Drawer, InputTextModule, MatButtonModule, LoadingProgressComponent, IctuPaginatorComponent],
    templateUrl: './ctdt-noidung.component.html',
    styleUrls: ['./ctdt-noidung.component.css']
})
export class CtdtNoidungComponent implements OnInit, OnChanges, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly cancelLoad$ = new Subject<void>();
    private readonly cancelSubjects$ = new Subject<void>();
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

    @Input() selectedCtdt: Ctdt | null = null;

    isManager = false;
    isLanhDaoKhoa = false;
    userId = 0;
    list_khoikienthuc: CtdtConfig[] = [];
    list_cdt_hocphan: typeCtdtHocphan[] = [];
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
    private readonly stagedDeletes = new Map<number, number>();
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
        this.isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt]
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
    }

    initCtdtData(ctdtId: string): void {
        if (this.loadedCtdtId === Number(ctdtId)) return;
        this.cancelLoad$.next();
        this.closeDrawerChooseMonhoc();
        this.loadedCtdtId = Number(ctdtId);
        this.list_course = [];
        this.list_cdt_hocphan = [];
        this.courseLinks = [];
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
            set: [{ label: 'limit', value: '-1' }, { label: 'include', value: 'KHOI_KIEN_THUC' },
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
                this.list_khoikienthuc = config.recordsFiltered ? config.data
                    : Array.isArray(defaults.data?.[0]?.params) ? defaults.data[0].params : [];
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
        if (this.savingHp() || this.isLoadingData() || this.courseLoadError || !block.key) return;
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
            if (this.selectedCourseIds.has(courseId)) this.stagedDeletes.delete(courseId);
            else this.stagedDeletes.set(courseId, linkId);
        });
        this.stagedAdds.forEach((addition, courseId) => {
            if (addition.blockKey === blockKey && !this.selectedCourseIds.has(courseId)) {
                this.stagedAdds.delete(courseId);
                this.dirtyCourseIds.delete(courseId);
            }
        });
        this.selectedCourseIds.forEach(courseId => {
            if (!this.currentBlockLinks.has(courseId)) {
                const subject = this.selectedSubjects.get(courseId);
                if (subject && !this.stagedAdds.has(courseId)) {
                    this.stagedAdds.set(courseId, {
                        subject,
                        blockKey,
                        course: this.buildDraftCourse(subject, blockKey)
                    });
                }
            }
        });
        this.reconcileStagedLinks();
        this.applyStagedLinksToView();
        this.closeDrawerChooseMonhoc();
    }

    private reconcileStagedLinks(): void {
        this.stagedDeletes.forEach((linkId, courseId) => {
            if (!this.courseLinks.some(link => Number(link.id) === linkId && Number(link.course_id) === courseId)) {
                this.stagedDeletes.delete(courseId);
                this.dirtyCourseIds.delete(courseId);
                this.persistedCourseRows.delete(courseId);
            }
        });
        this.stagedAdds.forEach((_, courseId) => {
            if (this.linkedCourseIds.has(courseId)) this.stagedAdds.delete(courseId);
        });
        const currentIds = new Set(this.courseLinks.map(link => Number(link.course_id)));
        this.persistedCourseRows.forEach((_, courseId) => {
            if (!currentIds.has(courseId)) this.persistedCourseRows.delete(courseId);
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
            .filter(([courseId]) => !this.linkedCourseIds.has(courseId))
            .map(([courseId, addition]) => ({ kind: 'add' as const, courseId, addition }));
        const deletions = [...this.stagedDeletes.entries()]
            .map(([courseId, linkId]) => ({ kind: 'delete' as const, courseId, linkId }));
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
                const request = operation.kind === 'delete'
                    ? this.ctdtHocphanService.deleteCtdtHocphan(operation.linkId)
                    : operation.kind === 'add'
                        ? this.ctdtHocphanService.addCtdtHocphan(this.buildCtdtHocphan(operation.addition.subject, ctdt, operation.addition.blockKey, operation.addition.course))
                        : this.ctdtHocphanService.updateCtdtHocphan(operation.course.ctdt_hocphan_id, {
                            hocky: operation.course.hocky,
                            hp_hoctruoc: operation.course.hp_hoctruoc || [],
                            hp_tienquyet: operation.course.hp_tienquyet || [],
                            hp_songhanh: operation.course.hp_songhanh || []
                        });
                return request.pipe(tap(() => {
                    completed++;
                    this.progressValue = Math.round(completed / operations.length * 100);
                    if (operation.kind === 'delete') {
                        this.stagedDeletes.delete(operation.courseId);
                        this.dirtyCourseIds.delete(operation.courseId);
                    } else if (operation.kind === 'add') {
                        this.stagedAdds.delete(operation.courseId);
                        this.dirtyCourseIds.delete(operation.courseId);
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
                    ? `liên kết #${current.linkId}`
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
