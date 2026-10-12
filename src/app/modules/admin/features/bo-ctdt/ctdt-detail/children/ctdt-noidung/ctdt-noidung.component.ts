import { HelperService } from '@core/services/helper.service';
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
import { concatMap, defer, finalize, forkJoin, from, map, of, Subject, switchMap, takeUntil, tap, throwError, toArray } from 'rxjs';
import { Ctdt } from '@modules/shared/models/ctdt';
import { ROLES } from '@modules/shared/utils/syscat';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { TableModule } from 'primeng/table';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CtdtHocphan } from '@modules/shared/models/ctdt_hocphan';
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
type CourseRow = ElnKhoaHoc & {
    ctdt_hocphan_id?: number;
    khoikienthuc?: string;
    hocky?: number;
    hp_hoctruoc?: number[];
    hp_tienquyet?: number[];
    hp_songhanh?: number[];
    selected_hp?: boolean;
};

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
    private readonly helperService = inject(HelperService);
    private readonly ctdtConfigService = inject(CtdtConfigService);

    @Input() selectedCtdt: Ctdt | null = null;

    isManager = false;
    isLanhDaoKhoa = false;
    userId = 0;
    list_khoikienthuc: CtdtConfig[] = [];
    list_cdt_hocphan: typeCtdtHocphan[] = [];
    list_course: CourseRow[] = [];
    selectedKhoiKienthuc: typeCtdtHocphan | null = null;
    list_subjects: CatalogSubject[] = [];
    selectedSubjects = new Map<number, CatalogSubject>();
    private readonly createdSubjectIds = new Set<number>();
    private readonly pendingCourseLinks = new Map<number, Map<number, Partial<ElnKhoaHoc>>>();
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
        this.createdSubjectIds.clear();
        this.pendingCourseLinks.clear();
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
        const courseCondition: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(ctdtId) },
                { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }], page: null
        };
        const linkCondition: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: String(ctdtId) }],
            set: [{ label: 'limit', value: '-1' }], page: null
        };
        forkJoin({
            courses: this.elnKhoaHocService.getKhoaHocByPageNew_2(courseCondition),
            links: this.ctdtHocphanService.getCtdtHocphanByPageNew(linkCondition)
        }).pipe(takeUntil(this.cancelLoad$), takeUntil(this.destroy$)).subscribe({
            next: ({ courses, links }) => {
                if (this.selectedCtdt?.id !== ctdtId) return;
                const linkByCourseId = new Map<number, CtdtHocphan>((links.data || []).map(link => [Number(link.course_id), link]));
                const drafts = new Map(this.list_course.filter(c => this.dirtyCourseIds.has(c.id)).map(c => [c.id, c]));
                this.list_course = (courses.data || []).map(course => {
                    const draft = drafts.get(course.id);
                    if (draft) return draft;
                    const link = linkByCourseId.get(Number(course.id));
                    return {
                        ...course,
                        ctdt_hocphan_id: link?.id,
                        khoikienthuc: link?.khoikienthuc || '',
                        hocky: link?.hocky ?? null,
                        hp_hoctruoc: [...(link?.hp_hoctruoc || [])],
                        hp_tienquyet: [...(link?.hp_tienquyet || [])],
                        hp_songhanh: [...(link?.hp_songhanh || [])]
                    };
                });
                this.list_course.forEach(course => {
                    if (course.subject_id && linkByCourseId.has(Number(course.id))) {
                        this.createdSubjectIds.add(Number(course.subject_id));
                    }
                });
                this.groupCourses();
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
        this.selectedSubjects.clear();
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

    private flattenSubjectCourses(relations: SubjectCourseExtend[]): CatalogSubject[] {
        const subjects: CatalogSubject[] = [];
        const seen = new Set<number>();
        relations.forEach(relation => {
            const entries = Array.isArray(relation.subjects) ? relation.subjects : relation.subjects ? [relation.subjects] : [];
            entries.forEach(subject => {
                if (subject && !seen.has(Number(subject.id))) {
                    seen.add(Number(subject.id));
                    subjects.push(subject);
                }
            });
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
        this.selectedSubjects.clear();
    }

    isSubjectCreated(subject: CatalogSubject): boolean {
        return this.createdSubjectIds.has(Number(subject.id));
    }

    toggleSubjectCheck(subject: CatalogSubject): void {
        if (this.savingHp() || this.isSubjectCreated(subject)) return;
        if (this.selectedSubjects.has(subject.id)) this.selectedSubjects.delete(subject.id);
        else this.selectedSubjects.set(subject.id, subject);
    }

    buildCourseFromSubject(subject: CatalogSubject, ctdt: Ctdt): Partial<ElnKhoaHoc> {
        return {
            ctdt_id: ctdt.id,
            bo_ctdt_id: ctdt.ctdt_bo_id,
            subject_id: subject.id,
            title: subject.name,
            maso: subject.code,
            slug: this.helperService.slugVietnamese(subject.name),
            desc: subject.desc || '',
            category_ids: ctdt.category_id,
            status: 1,
            params: {
                sotinchi: Number(subject.sotinchi) || 0,
                sotinchi_th: Number(subject.sotinchi_th) || 0,
                exam_format: null, cdr: null, exam_type: null
            }
        };
    }

    saveCoursesFromSubjects(): void {
        if (this.savingHp() || this.isLoadingSubjects() || !this.selectedCtdt?.id || !this.selectedKhoiKienthuc?.key) return;
        const subjects = [...this.selectedSubjects.values()].filter(subject => !this.isSubjectCreated(subject));
        if (!subjects.length) return;
        const ctdt = { ...this.selectedCtdt };
        const blockKey = this.selectedKhoiKienthuc.key;
        let completed = 0;
        let current: CatalogSubject = subjects[0];
        this.savingHp.set(true);
        this.createError = '';
        this.progressValue = 0;

        from(subjects).pipe(
            concatMap(subject => defer(() => {
                current = subject;
                const existingCourse = this.pendingCourseLinks.get(ctdt.id)?.get(subject.id);
                if (existingCourse) return of(existingCourse);
                this.savingTitle = `Đang tạo học phần ${completed + 1}/${subjects.length}: ${subject.code}`;
                const payload = this.buildCourseFromSubject(subject, ctdt);
                return this.elnKhoaHocService.addElnKhoaHoc(payload).pipe(
                    map(course => typeof course === 'object' ? { ...payload, ...(course as ElnKhoaHoc) } : { ...payload, id: course as number })
                );
            }).pipe(
                switchMap(course => {
                    const courseId = this.getCreatedCourseId(course);
                    if (!courseId) return throwError(() => new Error('API courses không trả về ID học phần mới.'));
                    const courseData = typeof course === 'object' ? course as ElnKhoaHoc : this.buildCourseFromSubject(subject, ctdt) as ElnKhoaHoc;
                    let ctdtPending = this.pendingCourseLinks.get(ctdt.id);
                    if (!ctdtPending) {
                        ctdtPending = new Map<number, Partial<ElnKhoaHoc>>();
                        this.pendingCourseLinks.set(ctdt.id, ctdtPending);
                    }
                    ctdtPending.set(subject.id, { ...courseData, id: courseId });
                    this.savingTitle = `Đang thêm học phần ${completed + 1}/${subjects.length} vào CTĐT...`;
                    return this.ctdtHocphanService.addCtdtHocphan(this.buildCtdtHocphan(courseData, subject, courseId, ctdt, blockKey));
                }),
                tap(() => {
                    this.pendingCourseLinks.get(ctdt.id)?.delete(subject.id);
                    completed++;
                    this.progressValue = Math.round(completed / subjects.length * 100);
                    if (this.selectedCtdt?.id === ctdt.id) {
                        this.createdSubjectIds.add(Number(subject.id));
                        this.selectedSubjects.delete(subject.id);
                    }
                })
            )),
            toArray(), takeUntil(this.destroy$), finalize(() => this.savingHp.set(false))
        ).subscribe({
            next: () => {
                this.savingHp.set(false);
                this.notificationService.toastSuccess(`Đã tạo và thêm ${completed} học phần vào CTĐT`);
                this.closeDrawerChooseMonhoc();
                if (this.selectedCtdt?.id === ctdt.id) this.loadCtdthocPhan();
            },
            error: error => {
                this.savingHp.set(false);
                const message = typeof error?.error?.message === 'string' ? error.error.message : error?.message || 'Vui lòng kiểm tra lại trước khi thử lại.';
                this.createError = `Đã xử lý ${completed}/${subjects.length} học phần. Lỗi tại ${current.code} — ${current.name}: ${message}`;
                this.notificationService.toastError(this.createError);
                if (this.selectedCtdt?.id === ctdt.id) this.loadCtdthocPhan();
            }
        });
    }

    private getCreatedCourseId(course: unknown): number | null {
        const data = course as { id?: number; data?: number | { id?: number } } | null;
        const nestedData = data?.data;
        const rawId = typeof course === 'number'
            ? course
            : data?.id ?? (typeof nestedData === 'number' ? nestedData : nestedData?.id);
        const id = Number(rawId);
        return Number.isInteger(id) && id > 0 ? id : null;
    }

    private buildCtdtHocphan(course: ElnKhoaHoc, subject: CatalogSubject, courseId: number, ctdt: Ctdt, blockKey: string): Partial<CtdtHocphan> {
        return {
            ctdt_id: ctdt.id,
            course_id: courseId,
            course_name: course.title || subject.name,
            khoikienthuc: blockKey,
            sotinchi: Number(subject.sotinchi) || 0,
            sotinchi_thuchanh: Number(subject.sotinchi_th) || 0,
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
        const courses = this.list_course.filter(course => this.dirtyCourseIds.has(course.id));
        if (!courses.length) return;
        if (courses.some(course => !course.ctdt_hocphan_id)) {
            this.notificationService.toastWarning('Học phần chưa có liên kết CTĐT. Vui lòng thêm lại trước khi lưu học kỳ.');
            return;
        }
        if (courses.some(course => course.hocky != null && (!Number.isInteger(course.hocky) || course.hocky < 1))) {
            this.notificationService.toastWarning('Học kỳ phải là số nguyên lớn hơn 0 hoặc để trống.');
            return;
        }
        const ctdtId = this.selectedCtdt?.id;
        this.savingHp.set(true);
        this.savingTitle = 'Đang lưu học kỳ và điều kiện vào học phần...';
        from(courses).pipe(
            concatMap(course => this.ctdtHocphanService.updateCtdtHocphan(course.ctdt_hocphan_id, {
                hocky: course.hocky,
                hp_hoctruoc: course.hp_hoctruoc || [],
                hp_tienquyet: course.hp_tienquyet || [],
                hp_songhanh: course.hp_songhanh || []
            }).pipe(tap(() => this.dirtyCourseIds.delete(course.id)))),
            toArray(), takeUntil(this.destroy$), finalize(() => this.savingHp.set(false))
        ).subscribe({
            next: () => {
                this.notificationService.toastSuccess('Lưu thay đổi thành công');
                if (this.selectedCtdt?.id === ctdtId) this.loadCtdthocPhan();
            },
            error: () => {
                this.notificationService.toastError('Một số học phần chưa lưu được. Thay đổi chưa lưu được giữ lại để thử lại.');
                this.loadCtdthocPhan();
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
