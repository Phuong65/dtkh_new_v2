import { CommonModule } from '@angular/common';
import { Component, DestroyRef, WritableSignal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { UserService } from '@core/services/user.service';
import { NotificationService } from '@core/services/notification.service';
import { FileService } from '@core/services/file.service';
import { User } from '@core/models/user';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { ROUTERS } from '@modules/shared/utils/syscat';
import { key_server } from '@env';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CloneCourseComponent } from './course-management-detail/children/clone-course/clone-course.component';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { catchError, defer, finalize, forkJoin, from, map, mergeMap, of, switchMap, tap, toArray } from 'rxjs';
import { OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { AppState } from '@core-new/models/app-state';
import { IctuDataTable2 } from '@core-new/models/datatable';
import { IctuPaginatorComponent } from '@core-new/components/ictu-paginator/ictu-paginator.component';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { NotificationService as IctuNotificationService } from '@core-new/service/notification.service';
import { AuthService } from '@core/services/auth.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { Ctdt } from '@modules/shared/models/ctdt';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';

interface CourseRow extends ElnKhoaHoc {
    teacherName?: string;
}

interface CourseDownloadDocument {
    parentId: number;
    week: string;
    files: { fileTitle: string; blob: Blob }[];
}

@Component({
    selector: 'app-course-management',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, DrawerModule, InputTextModule, SelectModule, TooltipModule, MatButtonModule,
        IctuPaginatorComponent, LoadingProgressComponent, CloneCourseComponent],
    templateUrl: './course-management.component.html',
    styleUrl: './course-management.component.css'
})
export class CourseManagementComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly courseService = inject(ElnKhoaHocService);
    private readonly ctdtService = inject(CtdtService);
    private readonly donViService = inject(DonViService);
    private readonly chuyenMucService = inject(ElnChuyenMucService);
    private readonly userProfileService = inject(ElngUserProfileService);
    private readonly auth = inject(AuthService);
    private readonly userService = inject(UserService);
    private readonly notificationService = inject(NotificationService);
    private readonly ictuNotificationService = inject(IctuNotificationService);
    private readonly fileService = inject(FileService);
    private readonly coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private readonly hoidongThamdinhMonhocService = inject(HoidongThamdinhMonhocService);
    private readonly hoidongThamdinhService = inject(HoidongThamdinhService);
    private readonly router = inject(Router);

    readonly state: WritableSignal<AppState> = signal('loading');
    readonly filterState: WritableSignal<AppState> = signal('loading');
    readonly errorMessage = signal('');
    readonly filterError = signal('');
    readonly searchValue = signal('');
    readonly categoryId = signal<number | null>(null);
    readonly ctdtId = signal<number | null>(null);
    readonly categories = signal<DonVi[]>([]);
    readonly programmes = signal<Ctdt[]>([]);
    readonly departments = signal<ElnChuyenMuc[]>([]);
    readonly table = new IctuDataTable2<CourseRow>({ rows: 20, pageLinkSize: 5 });
    readonly cloneDrawerVisible = signal(false);
    readonly selectedCourse = signal<CourseRow | null>(null);
    readonly downloadingCourseId = signal<number | null>(null);
    readonly deletingCourseId = signal<number | null>(null);
    readonly downloadProgress = signal(0);
    readonly downloadMessage = signal('');
    readonly scopedCategoryId = signal<number | null>(null);
    readonly scopedDepartmentId = signal<number | null>(null);

    readonly isLecturer: boolean;
    readonly isFacultyLeader: boolean;
    readonly isDepartmentLeader: boolean;
    readonly isTrainingOrAdmin: boolean;
    readonly showCategoryFilter: boolean;
    readonly showProgrammeFilter: boolean;
    readonly courseListReturnUrl: string;

    readonly canClone: boolean;
    readonly canDelete: boolean;
    readonly canDownload: boolean;
    private requestId = 0;

    constructor() {
        const routePath = this.router.url.replace(/^\/admin\//, '').split('?')[0].replace(/\/+$/, '');
        const roleRoute = routePath.split('/')[0];
        const canManage = this.auth.hasRouter(ROUTERS.admin) || this.auth.hasRouter(ROUTERS.daotao);
        this.isLecturer = roleRoute === ROUTERS.giangvien;
        this.isFacultyLeader = roleRoute === ROUTERS.lanhdao_khoa;
        this.isDepartmentLeader = roleRoute === ROUTERS.lanhdao_bomon;
        this.isTrainingOrAdmin = roleRoute === ROUTERS.admin || roleRoute === ROUTERS.daotao;
        this.showCategoryFilter = this.isTrainingOrAdmin;
        this.showProgrammeFilter = this.isTrainingOrAdmin;
        this.courseListReturnUrl = `/admin/${routePath}`;
        this.canClone = canManage && (this.auth.userCanEdit(routePath) || this.auth.userCanEdit('quanly-monhoc'));
        this.canDelete = canManage && (this.auth.userCanDelete(routePath) || this.auth.userCanDelete('quanly-monhoc'));
        this.canDownload = canManage || (key_server === 'hvu' && this.auth.userCanAccess(routePath));
    }

    ngOnInit(): void {
        this.loadFilterOptions();
        this.loadRoleScope();
    }

    private loadRoleScope(): void {
        this.state.set('loading');
        this.errorMessage.set('');
        if (this.isFacultyLeader || this.isDepartmentLeader) {
            this.userProfileService.getElngUserProfileByCol('user_id', String(this.auth.user.id)).pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe({
                next: profiles => {
                    const profile = profiles?.[0];
                    if (this.isFacultyLeader) {
                        const categoryId = Number(profile?.donvi_chuyenmon_id);
                        this.scopedCategoryId.set(Number.isSafeInteger(categoryId) && categoryId > 0 ? categoryId : null);
                    }
                    if (this.isDepartmentLeader) {
                        const departmentId = Number(profile?.bomon_id);
                        this.scopedDepartmentId.set(Number.isSafeInteger(departmentId) && departmentId > 0 ? departmentId : null);
                    }
                    if ((this.isFacultyLeader && this.scopedCategoryId() === null)
                        || (this.isDepartmentLeader && this.scopedDepartmentId() === null)) {
                        this.failRoleScope('Tài khoản chưa được phân công phạm vi Khoa hoặc Bộ môn trong hệ thống.');
                        return;
                    }
                    this.loadCourses(1, true);
                },
                error: () => {
                    this.scopedCategoryId.set(null);
                    this.scopedDepartmentId.set(null);
                    this.failRoleScope('Không thể xác định phạm vi dữ liệu. Vui lòng thử lại.');
                }
            });
            return;
        }
        this.loadCourses(1, true);
    }

    retryLoadCourses(): void {
        this.loadRoleScope();
    }

    private failRoleScope(message: string): void {
        this.state.set('error');
        this.errorMessage.set(message);
    }

    private loadFilterOptions(): void {
        this.filterState.set('loading');
        const category: ConditionOption = {
            condition: [{ conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'title' }, { label: 'order', value: 'ASC' }],
            page: null
        };
        const programme: ConditionOption = {
            condition: [{ conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'ten' }, { label: 'order', value: 'ASC' }],
            page: null
        };
        const department: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'bomon', orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }, { label: 'orderby', value: 'title' }, { label: 'order', value: 'ASC' }],
            page: null
        };
        forkJoin({
            categories: this.donViService.getDonviByPageNew(category),
            programmes: this.ctdtService.getCtdtByPageNew(programme),
            departments: this.chuyenMucService.getChuyemucByPageNew(department)
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: response => {
                this.categories.set(response.categories.data || []);
                this.programmes.set(response.programmes.data || []);
                this.departments.set(response.departments.data || []);
                this.filterState.set('success');
            },
            error: () => {
                this.filterState.set('error');
            }
        });
    }

    loadCourses(page = 1, resetPaginator = false): void {
        const requestId = ++this.requestId;
        if ((this.isFacultyLeader && this.scopedCategoryId() === null)
            || (this.isDepartmentLeader && this.scopedDepartmentId() === null)) {
            this.failRoleScope('Không thể xác định phạm vi dữ liệu. Vui lòng thử lại.');
            return;
        }
        this.state.set('loading');
        this.errorMessage.set('');
        const commonConditions: OvicConditionParam[] = [
            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' }
        ];
        const query = this.searchValue().trim();
        if (query) commonConditions.push({ conditionName: 'title', condition: OvicQueryCondition.like, value: `%${query}%`, orWhere: 'and' });
        if (this.categoryId() !== null) commonConditions.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: String(this.categoryId()), orWhere: 'and' });
        if (this.ctdtId() !== null) commonConditions.push({ conditionName: 'ctdt_ids', condition: OvicQueryCondition.like, value: `%${this.ctdtId()}%`, orWhere: 'and' });

        let conditions: OvicConditionParam[];
        if (this.isLecturer) {
            const userId = String(this.auth.user.id);
            // Repeat shared filters so both sides of the assignment OR stay constrained.
            const lecturerAssignmentConditions: OvicConditionParam[] = [
                { conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: userId, orWhere: 'and' },
                ...commonConditions.map((condition, index) => ({
                    ...condition,
                    orWhere: index === 0 ? 'or' : 'and'
                })),
                { conditionName: 'creator_exam_id', condition: OvicQueryCondition.equal, value: userId, orWhere: 'and' }
            ];
            conditions = [...commonConditions, ...lecturerAssignmentConditions];
        } else {
            conditions = [...commonConditions];
        }
        if (!this.isLecturer && this.isFacultyLeader) {
            conditions.push({
                conditionName: 'category_ids',
                condition: OvicQueryCondition.equal,
                value: String(this.scopedCategoryId()),
                orWhere: 'and'
            });
        }
        if (!this.isLecturer && this.isDepartmentLeader) {
            conditions.push({
                conditionName: 'nganh_bomon_id',
                condition: OvicQueryCondition.equal,
                value: String(this.scopedDepartmentId()),
                orWhere: 'and'
            });
        }
        const option: ConditionOption = {
            condition: conditions,
            set: [{ label: 'limit', value: String(this.table.paginator.rows()) }, { label: 'orderby', value: 'title' }, { label: 'order', value: 'ASC' }],
            page: String(page)
        };
        this.courseService.getKhoaHocByPageNew_2(option).pipe(
            switchMap(response => {
                const courses = (response.data || []) as CourseRow[];
                const teacherIds = [...new Set(courses.flatMap(course => [course.creator_plan_id, course.creator_exam_id])
                    .map(id => Number(id)).filter(id => Number.isSafeInteger(id) && id > 0))];
                const teacherOption: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'include', value: teacherIds.join(',') },
                        { label: 'include_by', value: 'id' },
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                };
                const users = teacherIds.length ? this.userService.getUserByPageNew(teacherOption).pipe(
                    map(result => result.data || []),
                    catchError(() => {
                        this.notificationService.toastWarning('Không thể tải tên giảng viên phụ trách');
                        return of([] as User[]);
                    })
                ) : of([] as User[]);
                return users.pipe(map(users => ({ response, users })));
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: ({ response, users }) => {
                if (requestId !== this.requestId) return;
                const teacherNames = new Map(users.map(user => [String(user.id), user.display_name]));
                const courses = (response.data || []) as CourseRow[];
                courses.forEach(course => {
                    const teacherId = this.isLecturer && String(course.creator_exam_id) === String(this.auth.user.id)
                        ? course.creator_exam_id
                        : course.creator_plan_id;
                    course.teacherName = teacherNames.get(String(teacherId)) || 'Chưa phân quyền';
                });
                const total = Number(response.recordsFiltered) || 0;
                this.table.fillRawData({ data: courses, recordsFiltered: total, recordsTotal: total, draw: 1 }, { paged: page, resetPaginator });
                this.state.set('success');
            },
            error: () => {
                if (requestId !== this.requestId) return;
                this.state.set('error');
                this.errorMessage.set('Không thể tải danh sách học phần. Vui lòng thử lại.');
            }
        });
    }

    openClone(course: CourseRow): void {
        if (!this.canClone) return;
        this.selectedCourse.set(course);
        this.cloneDrawerVisible.set(true);
    }

    onCloneDrawerHide(): void {
        this.cloneDrawerVisible.set(false);
        this.selectedCourse.set(null);
        this.loadCourses(this.table.paginator.paged(), false);
    }

    downloadDocuments(course: CourseRow): void {
        if (!this.canDownload || !course.id || this.downloadingCourseId() !== null) return;
        this.downloadingCourseId.set(course.id);
        this.downloadProgress.set(0);
        this.downloadMessage.set('Đang tải tài liệu giảng dạy...');
        const option: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: String(course.id), orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' }
            ],
            set: [{ label: 'limit', value: '-1' }],
            page: null
        };
        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(option).pipe(
            switchMap(({ data }) => {
                const activities = data || [];
                const documents: CourseDownloadDocument[] = activities
                    .filter(item => item.parent_id === 0 && item.id != null)
                    .map(parent => ({ parentId: parent.id, week: String(parent.week), files: [] }));
                const requests = activities.filter(item => item.type === 'ACTIVITY').flatMap(item => {
                    const document = documents.find(entry => entry.parentId === item.parent_id);
                    if (!document) return [];
                    const files = [...(Array.isArray(item.files) ? item.files : []), ...(Array.isArray(item.slides) ? item.slides : [])];
                    return files.map(file => ({ document, file }));
                });
                if (!requests.length) {
                    this.notificationService.toastInfo('Học phần chưa có tài liệu giảng dạy');
                    return of(null);
                }
                return from(requests).pipe(
                    mergeMap(({ document, file }) => this.fileService.awsGetFileAsBlob(String(file.path)).pipe(
                        tap(blob => {
                            if (!blob) throw new Error('Tệp tài liệu trống');
                            document.files.push({ fileTitle: file.fileName, blob });
                            this.downloadProgress.update(progress => Math.min(99, progress + 99 / requests.length));
                        })
                    ), 4),
                    toArray(),
                    map(() => documents)
                );
            }),
            switchMap(documents => {
                if (!documents) return of(null);
                return defer(() => {
                    this.downloadMessage.set('Đang nén tài liệu giảng dạy...');
                    const name = (course.title || 'Hoc_phan').replace(/[\\/.]/g, '_');
                    const zip = new JSZip();
                    const root = zip.folder(name);
                    documents.forEach(document => {
                        const folder = root.folder(`Bai_${document.week}`);
                        const usedNames = new Set<string>();
                        document.files.forEach((file, index) => {
                            const originalName = file.fileTitle || `tai-lieu-${index + 1}`;
                            const dotIndex = originalName.lastIndexOf('.');
                            const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
                            const extension = dotIndex > 0 ? originalName.slice(dotIndex) : '';
                            let fileName = originalName;
                            let suffix = 2;
                            while (usedNames.has(fileName.toLocaleLowerCase())) {
                                fileName = `${baseName} (${suffix++})${extension}`;
                            }
                            usedNames.add(fileName.toLocaleLowerCase());
                            folder.file(fileName, file.blob);
                        });
                    });
                    return from(zip.generateAsync({ type: 'blob' })).pipe(map(blob => ({ blob, name })));
                });
            }),
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.downloadingCourseId.set(null))
        ).subscribe({
            next: result => {
                if (!result) return;
                const { blob, name } = result;
                try {
                    saveAs(blob, name);
                    this.downloadProgress.set(100);
                    this.downloadMessage.set('');
                } catch {
                    this.downloadMessage.set('');
                    this.notificationService.toastError('Không thể lưu tệp tài liệu giảng dạy');
                }
            },
            error: () => {
                this.downloadMessage.set('');
                this.notificationService.toastError('Không thể tải đầy đủ tài liệu giảng dạy');
            }
        });
    }

    deleteCourse(course: CourseRow): void {
        if (!this.canDelete || !course.id || this.deletingCourseId() !== null) return;
        this.deletingCourseId.set(course.id);
        const option: ConditionOption = {
            condition: [{ conditionName: 'course_id', condition: OvicQueryCondition.equal, value: String(course.id), orWhere: 'and' }],
            set: [{ label: 'limit', value: '-1' }],
            page: null
        };
        this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew(option).pipe(
            switchMap(({ data }) => {
                const ids = [...new Set((data || []).map(link => link.hoidong_thamdinh_id))];
                if (!ids.length) return of([] as string[]);
                const councilOption: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'include', value: ids.join(',') },
                        { label: 'include_by', value: 'id' },
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                };
                return this.hoidongThamdinhService.getHoidongThamdinhByPageNew(councilOption).pipe(
                    map(({ data: councils }) => ids.map(id => councils.find(council => council.id === id)?.title || `Hội đồng #${id}`))
                );
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: councils => {
                if (councils.length) {
                    this.notificationService.toastWarning(`Không thể xóa học phần đang thuộc hội đồng thẩm định: ${councils.join(', ')}`);
                    this.deletingCourseId.set(null);
                    return;
                }
                this.ictuNotificationService.confirmDelete2({
                    heading: 'Xác nhận xóa học phần',
                    htmlMessage: `Bạn có chắc muốn xóa học phần <strong>${this.escapeHtml(course.title || '')}</strong>?`
                }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
                    if (!confirmed) {
                        this.deletingCourseId.set(null);
                        return;
                    }
                    this.courseService.deleteElnKhoaHoc(course.id).pipe(
                        takeUntilDestroyed(this.destroyRef),
                        finalize(() => this.deletingCourseId.set(null))
                    ).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess('Xóa học phần thành công');
                            const page = this.table.data().length === 1 && this.table.paginator.paged() > 1
                                ? this.table.paginator.paged() - 1 : this.table.paginator.paged();
                            this.loadCourses(page, false);
                        },
                        error: () => this.notificationService.toastError('Xóa học phần thất bại')
                    });
                });
            },
            error: () => {
                this.deletingCourseId.set(null);
                this.notificationService.toastError('Không thể kiểm tra hội đồng thẩm định, vui lòng thử lại');
            }
        });
    }

    onSearch(): void {
        this.searchValue.set(this.searchValue().trim());
        this.loadCourses(1, true);
    }

    onFilterChange(): void {
        if (this.ctdtId() !== null && this.categoryId() !== null) {
            const programme = this.programmes().find(item => item.id === this.ctdtId());
            if (programme && programme.category_id !== this.categoryId()) this.ctdtId.set(null);
        }
        this.loadCourses(1, true);
    }

    private escapeHtml(value: string): string {
        return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
    }

    categoryName(id: number): string {
        return this.categories().find(item => item.id === id)?.title || '—';
    }

    categorySymbol(id: number): string {
        return this.unitSymbol(this.categories().find(item => item.id === id));
    }

    departmentName(id: number | null | undefined): string {
        return this.departments().find(item => item.id === id)?.title || '—';
    }

    departmentSymbol(id: number | null | undefined): string {
        return this.unitSymbol(this.departments().find(item => item.id === id));
    }

    private unitSymbol(unit?: { code?: string; title?: string }): string {
        const code = unit?.code?.trim();
        if (code) return code;
        const initials = unit?.title?.trim().split(/\s+/).map(word => word[0]).join('').toLocaleUpperCase();
        return initials || '—';
    }

    filteredProgrammes(): Ctdt[] {
        const categoryId = this.categoryId();
        return categoryId === null ? this.programmes() : this.programmes().filter(item => item.category_id === categoryId);
    }
}
