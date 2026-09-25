import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import {
    catchError,
    concatMap,
    finalize,
    forkJoin,
    from,
    map,
    Observable,
    of,
    reduce,
    Subject,
    switchMap,
    takeUntil,
    tap
} from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { OvicQueryCondition } from '@core/models/dto';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { User } from '@core/models/user';
import { SharedModule } from '@modules/shared/shared.module';
import { ClassStudent } from '@modules/shared/models/class-student';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import {
    HvuApiDanhsachSinhvienTheoLop,
    HvuApiDanhsachSinhvienTheoLopService
} from '@modules/shared/services/hvu-api-danhsach-sinhvien-theolop.service';
import { ROLES } from '@modules/shared/utils/syscat';
import {
    HvuClassDownloadResult,
    HvuClassStudentDifference,
    HvuClassStudentPreview,
    HvuClassSyncItem,
    ImportRecordResult,
    ImportSummary,
    StudentDifferenceStatus,
    StudentPreviewStatus
} from './import-sinhvien-lophoc.models';

interface SelectOption {
    label: string;
    value: string;
}

interface DownloadPipelineResult {
    students: HvuClassStudentPreview[];
    reconciliationFailed: boolean;
    noClasses?: boolean;
}

interface StudentDisplayRow {
    membershipKey: string;
    classId: number;
    syncClassId: string;
    className: string;
    studentCode: string;
    fullName?: string;
    birthday?: string;
    email?: string;
    status?: StudentPreviewStatus;
    errorMessage?: string;
    differenceStatus?: StudentDifferenceStatus;
    currentOrdering?: number;
    remoteOrdering?: number;
}

@Component({
    selector: 'app-import-sinhvien-lophoc',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        TableModule,
        PaginatorModule,
        DialogModule,
        CheckboxModule,
        MatProgressBarModule
    ],
    templateUrl: './import-sinhvien-lophoc.component.html',
    styleUrls: ['./import-sinhvien-lophoc.component.css']
})
export class ImportSinhvienLophocComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private readonly trainingRoles = [
        ROLES.admin,
        ROLES.manager,
        ROLES.chuyenvien_pdt,
        ROLES.troly_pdt,
        ROLES.daotao_cv_1
    ];

    yearOptions: SelectOption[] = [];
    semesterOptions: SelectOption[] = [];
    khoaOptions: SelectOption[] = [];

    selectedYear: string = null;
    selectedSemester: string = null;
    selectedKhoa: string = null;
    downloadYear: string = null;
    downloadSemester: string = null;
    downloadKhoa: string = null;
    selectedSyncClassId: string = null;
    studentStatusFilter: 'error' | 'changed' = null;

    classes: HvuClassSyncItem[] = [];
    displayedClasses: HvuClassSyncItem[] = [];
    confirmationClasses: HvuClassSyncItem[] = [];
    eligibleClasses: HvuClassSyncItem[] = [];
    students: HvuClassStudentPreview[] = [];
    studentDifferences: HvuClassStudentDifference[] = [];
    displayedStudents: StudentDisplayRow[] = [];

    totalEligibleStudents = 0;
    emptyEligibleClassCount = 0;
    confirmationChangedClassCount = 0;
    confirmationUnchangedClassCount = 0;
    confirmationAddedStudentCount = 0;
    confirmationRemovedStudentCount = 0;
    confirmationReorderedStudentCount = 0;
    confirmationInvalidCurrentStudentCount = 0;
    confirmationDestructiveClasses: HvuClassSyncItem[] = [];
    confirmDestructiveChangesAgreed = false;

    readonly downloadStatusLabels: Record<string, string> = {
        idle: 'Chưa tải',
        loading: 'Đang tải',
        success: 'Đã tải',
        empty: 'Danh sách rỗng',
        failed: 'Tải thất bại'
    };
    readonly importStatusLabels: Record<string, string> = {
        idle: 'Chưa import',
        deleting: 'Đang xóa dữ liệu cũ',
        importing: 'Đang import',
        success: 'Thành công',
        partial: 'Một phần',
        failed: 'Thất bại',
        blocked: 'Bị khóa'
    };
    readonly comparisonStatusLabels: Record<string, string> = {
        idle: 'Chưa đối chiếu',
        loading: 'Đang đối chiếu',
        unchanged: 'Không thay đổi',
        changed: 'Có thay đổi',
        failed: 'Đối chiếu lỗi',
        stale: 'Dữ liệu đã thay đổi'
    };
    readonly differenceStatusLabels: Record<string, string> = {
        unchanged: 'Giữ nguyên',
        added: 'Sẽ thêm',
        removed: 'Sẽ xóa',
        reordered: 'Đổi thứ tự',
        'current-invalid': 'Dữ liệu hiện tại lỗi'
    };
    readonly studentStatusLabels: Record<string, string> = {
        valid: 'Hợp lệ',
        'not-found': 'Không tìm thấy',
        duplicate: 'Trùng trong lớp',
        'download-failed': 'Tải thất bại',
        imported: 'Đã import',
        'import-failed': 'Import thất bại'
    };
    readonly statusClasses: Record<string, string> = {
        idle: 'status-idle',
        loading: 'status-processing',
        deleting: 'status-processing',
        importing: 'status-processing',
        success: 'status-success',
        valid: 'status-success',
        imported: 'status-success',
        empty: 'status-success',
        unchanged: 'status-success',
        changed: 'status-warning',
        added: 'status-added',
        removed: 'status-removed',
        reordered: 'status-warning',
        'current-invalid': 'status-error',
        stale: 'status-error',
        failed: 'status-error',
        partial: 'status-error',
        blocked: 'status-error',
        'not-found': 'status-error',
        duplicate: 'status-error',
        'download-failed': 'status-error',
        'import-failed': 'status-error'
    };

    searchClass: string = null;
    searchStudent: string = null;
    studentPage = 0;
    readonly studentPageSize = 25;

    isLoadingClasses = false;
    isDownloading = false;
    isImporting = false;

    showProgressDialog = false;
    progressTitle = 'Đồng bộ dữ liệu';
    progressDetail = '';
    progressValue = 0;
    progressCompleted = 0;
    progressTotal = 0;
    progressErrors = 0;

    showDownloadDialog = false;
    showConfirmDialog = false;
    confirmImportAgreed = false;

    facultyScoped = false;
    facultyCategoryId: number = null;
    facultyScopeBlocked = false;

    importSummary: ImportSummary = this.createEmptySummary();

    constructor(
        private router: Router,
        private auth: AuthService,
        private httpHelper: HttpParamsHeplerService,
        private notificationService: NotificationService,
        private classesService: ClassesService,
        private hvuStudentService: HvuApiDanhsachSinhvienTheoLopService,
        private elngUserProfileService: ElngUserProfileService,
        private userService: UserService,
        private classStudentService: ClassStudentService
    ) { }

    ngOnInit(): void {
        this.auth.setFeatureSecondary('Đồng bộ dữ liệu - Sinh viên vào lớp học phần');
        this.facultyScoped = this.auth.userHasRole(ROLES.lanhdaokhoa) &&
            !this.trainingRoles.some(role => this.auth.userHasRole(role));
        this.loadInitialData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    busy = false;

    private refreshBusyState(): void {
        this.busy = this.isLoadingClasses || this.isDownloading || this.isImporting;
    }

    private refreshDisplayedClasses(): void {
        const keyword = (this.searchClass || '').trim().toLowerCase();
        this.displayedClasses = keyword
            ? this.classes.filter(item =>
                (item.name || '').toLowerCase().includes(keyword) ||
                (item.kyhieu || '').toLowerCase().includes(keyword)
            )
            : this.classes;
    }

    private refreshDisplayedStudents(): void {
        const differenceByCode = new Map<string, HvuClassStudentDifference>();
        this.studentDifferences
            .filter(difference => difference.status !== 'removed' && difference.status !== 'current-invalid')
            .forEach(difference => differenceByCode.set(
                `${difference.syncClassId}|${difference.studentCode}`,
                difference
            ));

        let students: StudentDisplayRow[] = this.students.map(student => {
            const difference = differenceByCode.get(`${student.syncClassId}|${student.studentCode}`);
            return {
                ...student,
                differenceStatus: difference ? difference.status : undefined,
                currentOrdering: difference ? difference.currentOrdering : undefined,
                remoteOrdering: difference ? difference.remoteOrdering : undefined
            };
        });
        students = students.concat(
            this.studentDifferences
                .filter(difference => difference.status === 'removed' || difference.status === 'current-invalid')
                .map(difference => ({
                    membershipKey: difference.differenceKey,
                    classId: difference.classId,
                    syncClassId: difference.syncClassId,
                    className: difference.className,
                    studentCode: difference.studentCode || '-',
                    fullName: difference.fullName,
                    differenceStatus: difference.status,
                    currentOrdering: difference.currentOrdering,
                    remoteOrdering: difference.remoteOrdering,
                    errorMessage: difference.message
                }))
        );
        if (this.selectedSyncClassId) {
            students = students.filter(student => student.syncClassId === this.selectedSyncClassId);
        }
        if (this.studentStatusFilter === 'error') {
            students = students.filter(student => student.status === 'not-found' ||
                student.status === 'duplicate' ||
                student.status === 'download-failed' ||
                student.status === 'import-failed' ||
                student.differenceStatus === 'current-invalid');
        } else if (this.studentStatusFilter === 'changed') {
            students = students.filter(student => !!student.differenceStatus && student.differenceStatus !== 'unchanged');
        }
        this.displayedStudents = students;
    }

    private refreshEligibleClasses(): void {
        this.eligibleClasses = this.classes.filter(item =>
            (item.downloadStatus === 'success' || item.downloadStatus === 'empty') &&
            item.invalidStudentCount === 0 &&
            (item.comparisonStatus === 'unchanged' || item.comparisonStatus === 'changed') &&
            item.classId > 0
        );
    }

    private refreshConfirmationStats(): void {
        this.totalEligibleStudents = this.confirmationClasses.reduce((total, item) => total + item.validStudentCount, 0);
        this.emptyEligibleClassCount = this.confirmationClasses.filter(item => item.downloadStatus === 'empty').length;
        this.confirmationChangedClassCount = this.confirmationClasses.filter(item => item.comparisonStatus === 'changed').length;
        this.confirmationUnchangedClassCount = this.confirmationClasses.filter(item => item.comparisonStatus === 'unchanged').length;
        this.confirmationAddedStudentCount = this.confirmationClasses.reduce((total, item) => total + item.addedStudentCount, 0);
        this.confirmationRemovedStudentCount = this.confirmationClasses.reduce((total, item) => total + item.removedStudentCount, 0);
        this.confirmationReorderedStudentCount = this.confirmationClasses.reduce((total, item) => total + item.reorderedStudentCount, 0);
        this.confirmationInvalidCurrentStudentCount = this.confirmationClasses.reduce(
            (total, item) => total + item.invalidCurrentStudentCount,
            0
        );
        this.confirmationDestructiveClasses = this.confirmationClasses.filter(item =>
            item.removedStudentCount > 0 || item.invalidCurrentStudentCount > 0
        );
    }

    get requiresDestructiveConfirmation(): boolean {
        return this.confirmationRemovedStudentCount > 0 || this.confirmationInvalidCurrentStudentCount > 0;
    }

    get canConfirmImport(): boolean {
        return this.confirmImportAgreed &&
            (!this.requiresDestructiveConfirmation || this.confirmDestructiveChangesAgreed);
    }

    backToDongbo(): void {
        const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
        const url = this.router.serializeUrl(this.router.createUrlTree(['admin/' + activeLink]));
        this.router.navigateByUrl(url);
    }

    openDownloadSelection(): void {
        if (this.busy) {
            return;
        }
        this.downloadYear = this.selectedYear ||
            (this.yearOptions.length ? this.yearOptions[0].value : null);
        this.downloadSemester = this.downloadYear === this.selectedYear
            ? this.selectedSemester
            : null;
        this.downloadKhoa = this.downloadYear === this.selectedYear &&
            this.downloadSemester === this.selectedSemester
            ? this.selectedKhoa
            : null;
        this.showDownloadDialog = true;

        if (this.downloadYear && !this.downloadSemester) {
            this.loadSemesterOptions(this.downloadYear, true);
        } else if (this.downloadYear && this.downloadSemester && !this.downloadKhoa) {
            this.loadKhoaOptions(this.downloadYear, this.downloadSemester);
        }
    }

    onDownloadYearChange(): void {
        this.downloadSemester = null;
        this.downloadKhoa = null;
        this.semesterOptions = [];
        this.khoaOptions = [];
        if (this.downloadYear) {
            this.loadSemesterOptions(this.downloadYear, true);
        }
    }

    onDownloadSemesterChange(): void {
        this.downloadKhoa = null;
        this.khoaOptions = [];
        if (this.downloadYear && this.downloadSemester) {
            this.loadKhoaOptions(this.downloadYear, this.downloadSemester);
        }
    }

    confirmDownloadSelection(): void {
        if (this.busy || !this.downloadYear || !this.downloadSemester || !this.downloadKhoa) {
            return;
        }
        this.selectedYear = this.downloadYear;
        this.selectedSemester = this.downloadSemester;
        this.selectedKhoa = this.downloadKhoa;
        this.showDownloadDialog = false;
        this.downloadStudents();
    }

    onStudentPageChange(event: { page: number }): void {
        this.studentPage = event.page;
    }

    onClassSearchChange(): void {
        this.refreshDisplayedClasses();
    }

    selectClass(syncClassId: string): void {
        this.selectedSyncClassId = syncClassId;
        this.onClassFilterChange();
    }

    onClassFilterChange(): void {
        this.studentPage = 0;
        this.refreshDisplayedStudents();
    }

    toggleStudentErrorFilter(): void {
        this.studentStatusFilter = this.studentStatusFilter === 'error' ? null : 'error';
        this.studentPage = 0;
        this.refreshDisplayedStudents();
    }

    toggleStudentChangeFilter(): void {
        this.studentStatusFilter = this.studentStatusFilter === 'changed' ? null : 'changed';
        this.studentPage = 0;
        this.refreshDisplayedStudents();
    }

    retryFailedClasses(): void {
        if (this.busy) {
            return;
        }
        const retryClasses = this.classes.filter(item => item.importStatus === 'failed' || item.importStatus === 'partial');
        if (!retryClasses.length) {
            this.notificationService.toastInfo('Không có lớp thất bại để thử lại');
            return;
        }
        this.openImportConfirmation(retryClasses);
    }

    downloadStudents(): void {
        if (this.busy || !this.selectedYear || !this.selectedSemester || !this.selectedKhoa) {
            return;
        }
        if (this.facultyScoped && this.facultyScopeBlocked) {
            this.notificationService.toastWarning('Thầy/Cô chưa được phân vào khoa trong hệ thống, vui lòng liên hệ phòng đào tạo');
            return;
        }

        this.resetDownloadedData();
        this.isLoadingClasses = true;
        this.isDownloading = true;
        this.refreshBusyState();
        this.openProgress('Đang tải danh sách lớp học phần', 1);

        this.loadClasses$().pipe(
            switchMap(classes => {
                this.isLoadingClasses = false;
                this.classes = classes;
                this.refreshDisplayedClasses();
                if (!classes.length) {
                    return of({
                        students: [],
                        reconciliationFailed: false,
                        noClasses: true
                    } as DownloadPipelineResult);
                }
                return this.downloadStudentsForClasses$(classes);
            }),
            takeUntil(this.destroy$),
            finalize(() => {
                this.isLoadingClasses = false;
                this.isDownloading = false;
                this.refreshBusyState();
                this.showProgressDialog = false;
            })
        ).subscribe({
            next: result => {
                if (result.noClasses) {
                    this.notificationService.toastInfo('Không tìm thấy lớp học phần phù hợp');
                    return;
                }
                this.students = result.students.concat(
                    this.classes
                        .filter(item => item.downloadStatus === 'failed')
                        .map(item => this.createDownloadFailedPreview(item))
                );
                if (result.reconciliationFailed) {
                    this.markReconciliationFailed();
                    this.refreshEligibleClasses();
                    this.refreshDisplayedStudents();
                    this.notificationService.toastError('Đối chiếu sinh viên thất bại, chưa thể import dữ liệu');
                    return;
                }
                this.refreshClassCounts();
                this.refreshDisplayedStudents();
                const blocked = this.classes.filter(item => item.importStatus === 'blocked').length;
                if (blocked) {
                    this.notificationService.toastWarning(`Tải hoàn tất. Có ${blocked} lớp không đủ điều kiện import`);
                } else {
                    this.notificationService.toastSuccess('Tải và đối chiếu danh sách sinh viên thành công');
                }
            },
            error: () => this.notificationService.toastError('Tải danh sách lớp hoặc sinh viên thất bại, vui lòng thử lại')
        });
    }

    private loadClasses$(): Observable<HvuClassSyncItem[]> {
        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'namhoc',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedYear
                },
                {
                    conditionName: 'hocky',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedSemester,
                    orWhere: 'and'
                },
                {
                    conditionName: 'khoa',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedKhoa,
                    orWhere: 'and'
                },
                {
                    conditionName: 'sync_class_id',
                    condition: OvicQueryCondition.notEqual,
                    value: '0',
                    orWhere: 'and'
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and'
                }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'kyhieu' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        };

        if (this.facultyScoped) {
            condition.condition.push({
                conditionName: 'category_id',
                condition: OvicQueryCondition.equal,
                value: this.facultyCategoryId.toString(),
                orWhere: 'and'
            });
        }

        return this.classesService.getClassesByPageNew(condition).pipe(
            map(response => {
                const classIds = new Set<number>();
                return (response.data || [])
                    .filter(item => this.hasValidSyncClassId(item) && item.id > 0)
                    .filter(item => !this.facultyScoped || item.category_id === this.facultyCategoryId)
                    .filter(item => {
                        if (classIds.has(item.id)) {
                            return false;
                        }
                        classIds.add(item.id);
                        return true;
                    })
                    .map(item => this.mapClass(item));
            })
        );
    }

    private downloadStudentsForClasses$(classes: HvuClassSyncItem[]): Observable<DownloadPipelineResult> {
        const classChunks = this.chunk(classes, 5);
        this.openProgress('Đang tải danh sách sinh viên từ HVU', classes.length);

        return from(classChunks).pipe(
            concatMap(chunk => {
                this.progressDetail = chunk.map(item => item.kyhieu || item.name).join(', ');
                return forkJoin(chunk.map(item => this.loadStudentsForClass$(item)));
            }),
            tap(results => {
                this.progressCompleted += results.length;
                this.progressErrors += results.filter(result => !!result.errorMessage).length;
                this.updateProgressValue();
            }),
            reduce((allResults, results) => allResults.concat(results), [] as HvuClassDownloadResult[]),
            switchMap(results => this.reconcileStudents$(results).pipe(
                map(students => ({ students, reconciliationFailed: false } as DownloadPipelineResult)),
                catchError(() => of({
                    students: results.reduce((all, result) => all.concat(result.students), [] as HvuClassStudentPreview[]),
                    reconciliationFailed: true
                } as DownloadPipelineResult))
            )),
            switchMap(result => result.reconciliationFailed
                ? of(result)
                : this.compareCurrentStudentsForClasses$(classes, result.students).pipe(map(() => result))
            )
        );
    }

    openImportConfirmation(classes: HvuClassSyncItem[] = null): void {
        if (this.busy) {
            return;
        }
        this.confirmationClasses = classes ? classes.slice() : this.eligibleClasses.slice();
        this.refreshConfirmationStats();
        if (!this.confirmationClasses.length) {
            this.notificationService.toastWarning('Không có lớp đủ điều kiện import');
            return;
        }
        this.confirmImportAgreed = false;
        this.confirmDestructiveChangesAgreed = false;
        this.showConfirmDialog = true;
    }

    confirmAndImport(): void {
        if (!this.confirmImportAgreed) {
            this.notificationService.toastWarning('Vui lòng tích vào ô "Tôi đã đọc và đồng ý"');
            return;
        }
        if (this.requiresDestructiveConfirmation && !this.confirmDestructiveChangesAgreed) {
            this.notificationService.toastWarning('Vui lòng xác nhận chấp nhận xóa dữ liệu hiện tại');
            return;
        }
        if (this.isImporting) {
            return;
        }

        const confirmationClasses = this.confirmationClasses.slice();
        const importClasses = confirmationClasses.filter(item => item.comparisonStatus === 'changed');
        if (!importClasses.length) {
            this.showConfirmDialog = false;
            this.importSummary = this.buildImportSummary(confirmationClasses);
            this.notificationService.toastInfo('Các lớp đã chọn không có thay đổi, không cần import');
            return;
        }
        this.showConfirmDialog = false;
        this.isImporting = true;
        this.refreshBusyState();
        this.importSummary = this.createEmptySummary();
        this.openProgress('Đang thay thế danh sách sinh viên trong lớp học phần', importClasses.length);

        from(importClasses).pipe(
            concatMap(item => this.replaceClassStudents$(item)),
            tap(item => {
                this.progressCompleted += 1;
                this.progressErrors += item.importStatus === 'success' ? 0 : 1;
                this.updateProgressValue();
            }),
            takeUntil(this.destroy$),
            finalize(() => {
                this.isImporting = false;
                this.refreshBusyState();
                this.refreshEligibleClasses();
                this.refreshDisplayedStudents();
                this.showProgressDialog = false;
            })
        ).subscribe({
            complete: () => {
                this.importSummary = this.buildImportSummary(confirmationClasses);
                if (this.importSummary.failedClasses ||
                    this.importSummary.partialClasses ||
                    this.importSummary.staleBlockedClasses) {
                    this.notificationService.toastWarning('Import hoàn tất nhưng còn lớp thất bại hoặc dữ liệu đã thay đổi');
                } else {
                    this.notificationService.toastSuccess('Import danh sách sinh viên vào lớp học phần thành công');
                }
            }
        });
    }

    private loadInitialData(): void {
        const profileRequest = this.facultyScoped ? this.loadCurrentUserProfile$() : of(null);
        const yearParams = this.httpHelper.paramsConditionBuilder([
            {
                conditionName: 'status',
                condition: OvicQueryCondition.notEqual,
                value: '-1',
                orWhere: 'and'
            }
        ]).set('order', 'DESC')
            .set('orderby', 'namhoc')
            .set('groupby', 'namhoc')
            .set('limit', '-1');

        this.notificationService.isProcessing(true);
        forkJoin([
            this.classesService.getClassesByCols(yearParams),
            profileRequest
        ]).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: ([classes, profile]) => {
                this.yearOptions = (classes || [])
                    .filter(item => !!item.namhoc)
                    .map(item => ({
                        value: item.namhoc.toString(),
                        label: 'Năm học '.concat(item.namhoc.toString())
                    }));

                if (this.facultyScoped) {
                    this.facultyCategoryId = profile && profile.donvi_chuyenmon_id
                        ? profile.donvi_chuyenmon_id
                        : null;
                    this.facultyScopeBlocked = !this.facultyCategoryId;
                    if (this.facultyScopeBlocked) {
                        this.notificationService.toastWarning('Thầy/Cô chưa được phân vào khoa trong hệ thống, vui lòng liên hệ phòng đào tạo');
                    }
                }

                if (this.yearOptions.length) {
                    this.selectedYear = this.yearOptions[0].value;
                    this.loadSemesterOptions(this.selectedYear);
                } else {
                    this.notificationService.isProcessing(false);
                }
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Không thể tải dữ liệu khởi tạo, vui lòng thử lại');
            }
        });
    }

    private loadSemesterOptions(namhoc: string, forDownloadDialog = false): void {
        const semesterParams = this.httpHelper.paramsConditionBuilder([
            {
                conditionName: 'status',
                condition: OvicQueryCondition.notEqual,
                value: '-1'
            },
            {
                conditionName: 'namhoc',
                condition: OvicQueryCondition.equal,
                value: namhoc,
                orWhere: 'and'
            }
        ]).set('order', 'DESC')
            .set('orderby', 'hocky')
            .set('groupby', 'hocky')
            .set('limit', '-1');

        this.notificationService.isProcessing(true);
        this.classesService.getClassesByCols(semesterParams).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.notificationService.isProcessing(false))
        ).subscribe({
            next: classes => {
                this.semesterOptions = (classes || [])
                    .filter(item => item.hocky !== null && item.hocky !== undefined && item.hocky.toString().trim())
                    .map(item => ({
                        value: item.hocky.toString(),
                        label: 'HK '.concat(item.hocky.toString())
                    }));
                const semester = this.semesterOptions.length ? this.semesterOptions[0].value : null;
                if (forDownloadDialog) {
                    this.downloadSemester = semester;
                    this.downloadKhoa = null;
                    this.khoaOptions = [];
                    if (semester) {
                        this.loadKhoaOptions(namhoc, semester);
                    }
                } else {
                    this.selectedSemester = semester;
                }
            },
            error: () => this.notificationService.toastError('Không thể tải danh sách học kỳ, vui lòng thử lại')
        });
    }

    private loadKhoaOptions(namhoc: string, hocky: string): void {
        const khoaParams = this.httpHelper.paramsConditionBuilder([
            {
                conditionName: 'status',
                condition: OvicQueryCondition.notEqual,
                value: '-1'
            },
            {
                conditionName: 'namhoc',
                condition: OvicQueryCondition.equal,
                value: namhoc,
                orWhere: 'and'
            },
            {
                conditionName: 'hocky',
                condition: OvicQueryCondition.equal,
                value: hocky,
                orWhere: 'and'
            }
        ]).set('order', 'DESC')
            .set('orderby', 'khoa')
            .set('groupby', 'khoa')
            .set('limit', '-1');

        this.notificationService.isProcessing(true);
        this.classesService.getClassesByCols(khoaParams).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.notificationService.isProcessing(false))
        ).subscribe({
            next: classes => {
                this.khoaOptions = (classes || [])
                    .filter(item => item.khoa !== null && item.khoa !== undefined && item.khoa.toString().trim())
                    .map(item => ({
                        value: item.khoa.toString(),
                        label: 'Khóa '.concat(item.khoa.toString())
                    }));
                this.downloadKhoa = this.khoaOptions.length ? this.khoaOptions[0].value : null;
            },
            error: () => this.notificationService.toastError('Không thể tải danh sách khóa, vui lòng thử lại')
        });
    }

    private loadCurrentUserProfile$(): Observable<ElngUserProfile> {
        const condition: ConditionOption = {
            condition: [{
                conditionName: 'user_id',
                condition: OvicQueryCondition.equal,
                value: this.auth.user.id.toString()
            }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };
        return this.elngUserProfileService.getUserProfileByPageNewV2(condition).pipe(
            map(response => response.recordsFiltered ? response.data[0] : null)
        );
    }

    private hasValidSyncClassId(item: Classes): boolean {
        if (item.sync_class_id === null || item.sync_class_id === undefined) {
            return false;
        }
        const syncClassId = item.sync_class_id.toString().trim();
        return !!syncClassId && syncClassId !== '0';
    }

    private mapClass(item: Classes): HvuClassSyncItem {
        return {
            classId: item.id,
            syncClassId: item.sync_class_id.toString().trim(),
            name: item.name,
            kyhieu: item.kyhieu,
            namhoc: item.namhoc,
            hocky: item.hocky,
            categoryId: item.category_id,
            downloadStatus: 'idle',
            importStatus: 'idle',
            remoteStudentCount: 0,
            validStudentCount: 0,
            invalidStudentCount: 0,
            importedStudentCount: 0,
            failedStudentCount: 0,
            comparisonStatus: 'idle',
            currentStudentCount: 0,
            unchangedStudentCount: 0,
            addedStudentCount: 0,
            removedStudentCount: 0,
            reorderedStudentCount: 0,
            invalidCurrentStudentCount: 0
        };
    }

    private loadStudentsForClass$(item: HvuClassSyncItem): Observable<HvuClassDownloadResult> {
        item.downloadStatus = 'loading';
        return this.hvuStudentService.getHvuApiDanhsachSinhvienTheoLopBybody({
            id_lop: item.syncClassId
        }).pipe(
            map(response => {
                if (!Array.isArray(response)) {
                    throw new Error('Phản hồi danh sách sinh viên HVU không hợp lệ');
                }
                return this.mapDownloadedStudents(item, response);
            }),
            catchError(() => {
                item.downloadStatus = 'failed';
                item.importStatus = 'blocked';
                item.errorMessage = 'Tải danh sách sinh viên từ HVU thất bại';
                return of({
                    classItem: item,
                    students: [],
                    errorMessage: item.errorMessage
                });
            })
        );
    }

    private mapDownloadedStudents(
        item: HvuClassSyncItem,
        response: HvuApiDanhsachSinhvienTheoLop[]
    ): HvuClassDownloadResult {
        const rows = response
            .map((value, index) => ({
                studentCode: this.normalizeStudentCode(value && value.ma_sinh_vien),
                ordering: index + 1
            }))
            .filter(row => !!row.studentCode);
        const counts = rows.reduce((result, row) => {
            result.set(row.studentCode, (result.get(row.studentCode) || 0) + 1);
            return result;
        }, new Map<string, number>());
        const uniqueRows = rows.filter((row, index) =>
            rows.findIndex(value => value.studentCode === row.studentCode) === index
        );

        const students = uniqueRows.map(row => ({
            membershipKey: `${item.syncClassId}|${row.studentCode}`,
            classId: item.classId,
            syncClassId: item.syncClassId,
            className: item.name,
            studentCode: row.studentCode,
            ordering: row.ordering,
            status: counts.get(row.studentCode) > 1 ? 'duplicate' : 'not-found',
            errorMessage: counts.get(row.studentCode) > 1 ? 'Mã sinh viên bị trùng trong cùng lớp' : null
        } as HvuClassStudentPreview));

        item.downloadStatus = students.length ? 'success' : 'empty';
        item.remoteStudentCount = students.length;
        return { classItem: item, students };
    }

    private reconcileStudents$(results: HvuClassDownloadResult[]): Observable<HvuClassStudentPreview[]> {
        const students = results.reduce((all, result) => all.concat(result.students), [] as HvuClassStudentPreview[]);
        const uniqueCodes = students
            .filter(student => student.status !== 'duplicate')
            .map(student => student.studentCode)
            .filter((value, index, values) => values.indexOf(value) === index);

        if (!uniqueCodes.length) {
            return of(students);
        }

        const codeChunks = this.chunk(uniqueCodes, 100);
        this.progressTitle = 'Đang đối chiếu hồ sơ sinh viên';
        this.progressDetail = '';
        this.progressCompleted = 0;
        this.progressTotal = codeChunks.length;
        this.progressErrors = 0;
        this.updateProgressValue();

        return from(codeChunks).pipe(
            concatMap(codes => this.loadProfilesByCodes$(codes).pipe(
                tap(() => {
                    this.progressCompleted += 1;
                    this.updateProgressValue();
                })
            )),
            reduce((allProfiles, profiles) => allProfiles.concat(profiles), [] as ElngUserProfile[]),
            switchMap(profiles => this.loadUsersForProfiles$(profiles).pipe(
                map(users => this.mapProfilesToStudents(students, profiles, users))
            ))
        );
    }

    private loadProfilesByCodes$(codes: string[]): Observable<ElngUserProfile[]> {
        const condition: ConditionOption = {
            condition: [],
            set: [
                { label: 'include', value: codes.toString() },
                { label: 'include_by', value: 'student_code' },
                { label: 'limit', value: '-1' }
            ],
            page: null
        };
        return this.elngUserProfileService.getUserProfileByPageNewV2(condition).pipe(
            map(response => response.data || [])
        );
    }

    private loadUsersForProfiles$(profiles: ElngUserProfile[]): Observable<User[]> {
        const userIds = profiles
            .map(profile => profile.user_id)
            .filter(userId => !!userId)
            .filter((value, index, values) => values.indexOf(value) === index);
        if (!userIds.length) {
            return of([]);
        }

        const userIdChunks = this.chunk(userIds, 100);
        this.progressTitle = 'Đang đối chiếu tài khoản sinh viên';
        this.progressCompleted = 0;
        this.progressTotal = userIdChunks.length;
        this.updateProgressValue();

        return from(userIdChunks).pipe(
            concatMap(ids => {
                const condition: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'include', value: ids.toString() },
                        { label: 'include_by', value: 'id' },
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                };
                return this.userService.getUserByPageNew(condition).pipe(
                    map(response => response.data || []),
                    tap(() => {
                        this.progressCompleted += 1;
                        this.updateProgressValue();
                    })
                );
            }),
            reduce((allUsers, users) => allUsers.concat(users), [] as User[])
        );
    }

    private mapProfilesToStudents(
        students: HvuClassStudentPreview[],
        profiles: ElngUserProfile[],
        users: User[]
    ): HvuClassStudentPreview[] {
        const profileByCode = new Map<string, ElngUserProfile>();
        profiles.forEach(profile => {
            const code = this.normalizeStudentCode(profile.student_code);
            if (code && !profileByCode.has(code)) {
                profileByCode.set(code, profile);
            }
        });
        const userById = new Map<number, User>();
        users.forEach(user => userById.set(user.id, user));

        const reconciledStudents = students.map(student => {
            if (student.status === 'duplicate') {
                return student;
            }
            const profile = profileByCode.get(student.studentCode);
            const user = profile && profile.user_id ? userById.get(profile.user_id) : null;
            if (!profile || !profile.id || !profile.user_id || !user) {
                student.status = 'not-found';
                student.errorMessage = 'Không tìm thấy đầy đủ hồ sơ hoặc tài khoản nội bộ';
                return student;
            }
            student.studentId = profile.id;
            student.userId = profile.user_id;
            student.name = profile.name;
            student.fullName = profile.full_name;
            student.birthday = profile.birthday;
            student.email = user.email;
            student.status = 'valid';
            student.errorMessage = null;
            return student;
        });

        return this.sortStudentsAndAssignOrdering(reconciledStudents);
    }

    private sortStudentsAndAssignOrdering(
        students: HvuClassStudentPreview[]
    ): HvuClassStudentPreview[] {
        const studentsByClass = students.reduce((result, student) => {
            const classStudents = result.get(student.syncClassId) || [];
            classStudents.push(student);
            result.set(student.syncClassId, classStudents);
            return result;
        }, new Map<string, HvuClassStudentPreview[]>());

        return Array.from(studentsByClass.values()).reduce((result, classStudents) => {
            classStudents.sort((first, second) => this.compareStudentNames(first, second));
            classStudents.forEach((student, index) => student.ordering = index + 1);
            return result.concat(classStudents);
        }, [] as HvuClassStudentPreview[]);
    }

    private compareStudentNames(
        first: HvuClassStudentPreview,
        second: HvuClassStudentPreview
    ): number {
        const firstName = this.getStudentNameParts(first.fullName || first.name);
        const secondName = this.getStudentNameParts(second.fullName || second.name);
        const firstHasName = !!firstName.givenName;
        const secondHasName = !!secondName.givenName;

        if (firstHasName !== secondHasName) {
            return firstHasName ? -1 : 1;
        }

        return firstName.givenName.localeCompare(secondName.givenName, 'vi') ||
            firstName.middleName.localeCompare(secondName.middleName, 'vi') ||
            firstName.familyName.localeCompare(secondName.familyName, 'vi') ||
            first.studentCode.localeCompare(second.studentCode, 'vi');
    }

    private getStudentNameParts(fullName: string): {
        givenName: string;
        middleName: string;
        familyName: string;
    } {
        const parts = (fullName || '').trim().split(/\s+/).filter(value => !!value);
        return {
            givenName: parts.length ? parts[parts.length - 1] : '',
            middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
            familyName: parts.length > 1 ? parts[0] : ''
        };
    }

    private compareCurrentStudentsForClasses$(
        classes: HvuClassSyncItem[],
        students: HvuClassStudentPreview[]
    ): Observable<void> {
        const comparableClasses = classes.filter(item => item.downloadStatus !== 'failed');
        if (!comparableClasses.length) {
            this.studentDifferences = [];
            return of(undefined);
        }

        this.progressTitle = 'Đang đối chiếu danh sách sinh viên hiện tại';
        this.progressDetail = '';
        this.progressCompleted = 0;
        this.progressTotal = comparableClasses.length;
        this.progressErrors = 0;
        this.updateProgressValue();

        return from(this.chunk(comparableClasses, 5)).pipe(
            concatMap(chunk => {
                this.progressDetail = chunk.map(item => item.kyhieu || item.name).join(', ');
                chunk.forEach(item => item.comparisonStatus = 'loading');
                return forkJoin(chunk.map(item => this.loadCurrentStudentsForClass$(item)));
            }),
            tap(results => {
                this.progressCompleted += results.length;
                this.progressErrors += results.filter(result => result.currentStudents === null).length;
                this.updateProgressValue();
            }),
            reduce((allResults, results) => allResults.concat(results), [] as Array<{
                item: HvuClassSyncItem;
                currentStudents: ClassStudent[];
            }>),
            tap(results => {
                this.studentDifferences = [];
                results.forEach(result => {
                    if (result.currentStudents !== null) {
                        this.studentDifferences.push(...this.compareClassStudents(
                            result.item,
                            result.currentStudents,
                            students.filter(student => student.syncClassId === result.item.syncClassId)
                        ));
                    }
                });
            }),
            map(() => undefined)
        );
    }

    private loadCurrentStudentsForClass$(item: HvuClassSyncItem): Observable<{
        item: HvuClassSyncItem;
        currentStudents: ClassStudent[];
    }> {
        return this.classStudentService.getClassStudentByCol('class_id', item.classId).pipe(
            map(response => {
                if (!Array.isArray(response)) {
                    throw new Error('Phản hồi danh sách sinh viên hiện tại không hợp lệ');
                }
                return { item, currentStudents: response };
            }),
            catchError(() => {
                item.comparisonStatus = 'failed';
                item.importStatus = 'blocked';
                item.comparisonMessage = 'Không thể tải danh sách sinh viên hiện tại';
                item.errorMessage = item.comparisonMessage;
                return of({ item, currentStudents: null as ClassStudent[] });
            })
        );
    }

    private compareClassStudents(
        item: HvuClassSyncItem,
        currentStudents: ClassStudent[],
        remoteStudents: HvuClassStudentPreview[]
    ): HvuClassStudentDifference[] {
        const differences: HvuClassStudentDifference[] = [];
        const currentByCode = new Map<string, ClassStudent[]>();
        const remoteByCode = new Map<string, HvuClassStudentPreview>();

        currentStudents.forEach(currentStudent => {
            const code = this.normalizeStudentCode(
                currentStudent && currentStudent.user_info && currentStudent.user_info.student_code
            );
            if (!code) {
                differences.push(this.createCurrentInvalidDifference(
                    item,
                    currentStudent,
                    `current-invalid|${currentStudent && currentStudent.id || differences.length}`,
                    'Bản ghi hiện tại thiếu mã sinh viên'
                ));
                return;
            }
            const matches = currentByCode.get(code) || [];
            matches.push(currentStudent);
            currentByCode.set(code, matches);
        });
        remoteStudents.forEach(student => remoteByCode.set(student.studentCode, student));

        currentByCode.forEach((matches, code) => {
            if (matches.length > 1) {
                matches.forEach((currentStudent, index) => differences.push(this.createCurrentInvalidDifference(
                    item,
                    currentStudent,
                    `current-invalid|${code}|${index}`,
                    `Mã sinh viên ${code} bị trùng trong danh sách hiện tại`
                )));
                return;
            }
            const currentStudent = matches[0];
            const remoteStudent = remoteByCode.get(code);
            if (!remoteStudent) {
                differences.push(this.createDifference(
                    item,
                    code,
                    currentStudent.user_info && currentStudent.user_info.full_name,
                    'removed',
                    currentStudent.ordering,
                    undefined,
                    'Sinh viên sẽ bị xóa khỏi lớp'
                ));
                return;
            }
            const reordered = this.normalizeOrdering(currentStudent.ordering) !==
                this.normalizeOrdering(remoteStudent.ordering);
            differences.push(this.createDifference(
                item,
                code,
                remoteStudent.fullName || currentStudent.user_info && currentStudent.user_info.full_name,
                reordered ? 'reordered' : 'unchanged',
                currentStudent.ordering,
                remoteStudent.ordering,
                reordered ? 'Thứ tự sinh viên sẽ được cập nhật theo HVU' : undefined
            ));
        });

        remoteByCode.forEach((remoteStudent, code) => {
            if (!currentByCode.has(code)) {
                differences.push(this.createDifference(
                    item,
                    code,
                    remoteStudent.fullName,
                    'added',
                    undefined,
                    remoteStudent.ordering,
                    'Sinh viên sẽ được thêm vào lớp'
                ));
            }
        });

        item.currentStudentCount = currentStudents.length;
        item.unchangedStudentCount = differences.filter(value => value.status === 'unchanged').length;
        item.addedStudentCount = differences.filter(value => value.status === 'added').length;
        item.removedStudentCount = differences.filter(value => value.status === 'removed').length;
        item.reorderedStudentCount = differences.filter(value => value.status === 'reordered').length;
        item.invalidCurrentStudentCount = differences.filter(value => value.status === 'current-invalid').length;
        item.currentSnapshotSignature = this.createCurrentSnapshotSignature(currentStudents);
        item.comparisonStatus = item.addedStudentCount || item.removedStudentCount ||
            item.reorderedStudentCount || item.invalidCurrentStudentCount
            ? 'changed'
            : 'unchanged';
        item.comparisonMessage = item.comparisonStatus === 'changed'
            ? 'Danh sách hiện tại khác dữ liệu HVU'
            : 'Danh sách hiện tại trùng khớp dữ liệu HVU';
        return differences;
    }

    private createDifference(
        item: HvuClassSyncItem,
        studentCode: string,
        fullName: string,
        status: StudentDifferenceStatus,
        currentOrdering?: number,
        remoteOrdering?: number,
        message?: string
    ): HvuClassStudentDifference {
        return {
            differenceKey: `${item.syncClassId}|${status}|${studentCode}`,
            classId: item.classId,
            syncClassId: item.syncClassId,
            className: item.name,
            studentCode,
            fullName,
            status,
            currentOrdering,
            remoteOrdering,
            message
        };
    }

    private createCurrentInvalidDifference(
        item: HvuClassSyncItem,
        currentStudent: ClassStudent,
        key: string,
        message: string
    ): HvuClassStudentDifference {
        return {
            differenceKey: `${item.syncClassId}|${key}`,
            classId: item.classId,
            syncClassId: item.syncClassId,
            className: item.name,
            studentCode: this.normalizeStudentCode(
                currentStudent && currentStudent.user_info && currentStudent.user_info.student_code
            ) || '-',
            fullName: currentStudent && currentStudent.user_info && currentStudent.user_info.full_name,
            status: 'current-invalid',
            currentOrdering: currentStudent && currentStudent.ordering,
            message
        };
    }

    private createCurrentSnapshotSignature(currentStudents: ClassStudent[]): string {
        return currentStudents.map(student => ({
            code: this.normalizeStudentCode(student && student.user_info && student.user_info.student_code),
            ordering: this.normalizeOrdering(student && student.ordering)
        })).sort((first, second) =>
            first.code.localeCompare(second.code) || first.ordering - second.ordering
        ).map(value => `${value.code}:${value.ordering}`).join('|');
    }

    private createPreviewSnapshotSignature(students: HvuClassStudentPreview[]): string {
        return students.map(student => ({
            code: student.studentCode,
            ordering: this.normalizeOrdering(student.ordering)
        })).sort((first, second) =>
            first.code.localeCompare(second.code) || first.ordering - second.ordering
        ).map(value => `${value.code}:${value.ordering}`).join('|');
    }

    private normalizeOrdering(ordering: number): number {
        const value = Number(ordering);
        return Number.isFinite(value) ? value : 0;
    }

    private refreshClassCounts(): void {
        this.classes.forEach(item => {
            if (item.downloadStatus === 'failed' ||
                item.comparisonStatus === 'failed' ||
                item.comparisonStatus === 'stale') {
                item.importStatus = 'blocked';
                return;
            }
            const students = this.getStudentsByClass(item);
            item.remoteStudentCount = students.length;
            item.validStudentCount = students.filter(student => !!student.studentId && !!student.userId).length;
            item.invalidStudentCount = students.filter(student => this.hasInvalidSourceData(student)).length;
            item.importStatus = item.invalidStudentCount ? 'blocked' : 'idle';
        });
        this.refreshEligibleClasses();
    }

    private replaceClassStudents$(item: HvuClassSyncItem): Observable<HvuClassSyncItem> {
        item.importedStudentCount = 0;
        item.failedStudentCount = 0;
        item.errorMessage = null;
        this.progressDetail = item.kyhieu || item.name;

        const students = this.getStudentsByClass(item).filter(student => !!student.studentId && !!student.userId);
        students.forEach(student => {
            student.status = 'valid';
            student.errorMessage = null;
        });

        return this.preflightCurrentStudents$(item).pipe(
            switchMap(preflightPassed => {
                if (!preflightPassed) {
                    return of(item);
                }
                item.importStatus = 'deleting';
                return this.classStudentService.deleteClassStudentByCol(item.classId.toString(), 'class_id').pipe(
                    map(() => ({ deleteFailed: false })),
                    catchError(() => {
                        item.importStatus = 'failed';
                        item.failedStudentCount = students.length;
                        item.errorMessage = 'Không thể xóa danh sách sinh viên hiện tại của lớp';
                        return of({ deleteFailed: true });
                    }),
                    switchMap(deleteResult => {
                        if (deleteResult.deleteFailed) {
                            return of(item);
                        }
                        if (!students.length) {
                            item.importStatus = 'success';
                            this.markClassComparisonSynchronized(item, students);
                            return of(item);
                        }

                        item.importStatus = 'importing';
                        const studentChunks = this.chunk(students, 5);
                        return from(studentChunks).pipe(
                            concatMap(chunk => forkJoin(chunk.map(student => this.addStudent$(item, student)))),
                            reduce((allResults, results) => allResults.concat(results), [] as ImportRecordResult[]),
                            map(results => {
                                item.importedStudentCount = results.filter(result => result.success).length;
                                item.failedStudentCount = results.length - item.importedStudentCount;
                                item.importStatus = item.failedStudentCount ? 'partial' : 'success';
                                if (item.failedStudentCount) {
                                    item.errorMessage = `${item.failedStudentCount} sinh viên import thất bại`;
                                    item.currentSnapshotSignature = this.createPreviewSnapshotSignature(
                                        results.filter(result => result.success).map(result => result.student)
                                    );
                                } else {
                                    this.markClassComparisonSynchronized(item, students);
                                }
                                return item;
                            })
                        );
                    })
                );
            })
        );
    }

    private markClassComparisonSynchronized(
        item: HvuClassSyncItem,
        students: HvuClassStudentPreview[]
    ): void {
        item.comparisonStatus = 'unchanged';
        item.currentStudentCount = students.length;
        item.unchangedStudentCount = students.length;
        item.addedStudentCount = 0;
        item.removedStudentCount = 0;
        item.reorderedStudentCount = 0;
        item.invalidCurrentStudentCount = 0;
        item.comparisonMessage = 'Danh sách đã được đồng bộ theo dữ liệu HVU';
        item.currentSnapshotSignature = this.createPreviewSnapshotSignature(students);
        this.studentDifferences = this.studentDifferences.map(difference =>
            difference.syncClassId === item.syncClassId
                ? { ...difference, status: 'unchanged' as StudentDifferenceStatus, message: undefined }
                : difference
        );
    }

    private preflightCurrentStudents$(item: HvuClassSyncItem): Observable<boolean> {
        return this.classStudentService.getClassStudentByCol('class_id', item.classId).pipe(
            map(response => {
                if (!Array.isArray(response)) {
                    throw new Error('Phản hồi danh sách sinh viên hiện tại không hợp lệ');
                }
                const currentSignature = this.createCurrentSnapshotSignature(response);
                if (currentSignature !== item.currentSnapshotSignature) {
                    item.comparisonStatus = 'stale';
                    item.importStatus = 'blocked';
                    item.comparisonMessage = 'Danh sách hiện tại đã thay đổi sau lần đối chiếu';
                    item.errorMessage = 'Dữ liệu hiện tại đã thay đổi, vui lòng tải và đối chiếu lại';
                    return false;
                }
                return true;
            }),
            catchError(() => {
                item.comparisonStatus = 'failed';
                item.importStatus = 'blocked';
                item.comparisonMessage = 'Không thể kiểm tra lại danh sách sinh viên hiện tại';
                item.errorMessage = item.comparisonMessage;
                return of(false);
            })
        );
    }

    private addStudent$(
        item: HvuClassSyncItem,
        student: HvuClassStudentPreview
    ): Observable<ImportRecordResult> {
        const payload: ClassStudent = {
            student_id: student.studentId,
            class_id: item.classId,
            user_id: student.userId,
            user_info: {
                name: student.name || '',
                full_name: student.fullName || '',
                birthday: student.birthday || '',
                student_code: student.studentCode,
                email: student.email || ''
            },
            status: 1,
            namhoc: item.namhoc,
            hocky: item.hocky,
            ordering: student.ordering
        };

        return this.classStudentService.addClassStudent(payload).pipe(
            map(() => {
                student.status = 'imported';
                student.errorMessage = null;
                return { student, success: true };
            }),
            catchError(() => {
                student.status = 'import-failed';
                student.errorMessage = 'Không thể thêm sinh viên vào lớp';
                return of({
                    student,
                    success: false,
                    errorMessage: student.errorMessage
                });
            })
        );
    }

    private createDownloadFailedPreview(item: HvuClassSyncItem): HvuClassStudentPreview {
        return {
            membershipKey: `${item.syncClassId}|download-failed`,
            classId: item.classId,
            syncClassId: item.syncClassId,
            className: item.name,
            studentCode: '-',
            status: 'download-failed',
            errorMessage: item.errorMessage
        };
    }

    private markReconciliationFailed(): void {
        this.students.forEach(student => {
            if (student.status !== 'duplicate' && student.status !== 'download-failed') {
                student.status = 'not-found';
                student.errorMessage = 'Không thể đối chiếu dữ liệu nội bộ';
            }
        });
        this.classes.forEach(item => {
            if (item.downloadStatus === 'success') {
                item.importStatus = 'blocked';
                item.invalidStudentCount = item.remoteStudentCount;
                item.errorMessage = 'Đối chiếu sinh viên thất bại';
            }
        });
    }

    private buildImportSummary(classes: HvuClassSyncItem[]): ImportSummary {
        return {
            successClasses: classes.filter(item => item.importStatus === 'success').length,
            partialClasses: classes.filter(item => item.importStatus === 'partial').length,
            failedClasses: classes.filter(item =>
                item.importStatus === 'failed' ||
                (item.importStatus === 'blocked' && item.comparisonStatus === 'failed')
            ).length,
            skippedUnchangedClasses: classes.filter(item =>
                item.comparisonStatus === 'unchanged' && item.importStatus !== 'success'
            ).length,
            staleBlockedClasses: classes.filter(item => item.comparisonStatus === 'stale').length,
            successStudents: classes.reduce((total, item) => total + item.importedStudentCount, 0),
            failedStudents: classes.reduce((total, item) => total + item.failedStudentCount, 0)
        };
    }

    private createEmptySummary(): ImportSummary {
        return {
            successClasses: 0,
            partialClasses: 0,
            failedClasses: 0,
            skippedUnchangedClasses: 0,
            staleBlockedClasses: 0,
            successStudents: 0,
            failedStudents: 0
        };
    }

    private getStudentsByClass(item: HvuClassSyncItem): HvuClassStudentPreview[] {
        return this.students.filter(student => student.syncClassId === item.syncClassId);
    }

    private hasInvalidSourceData(student: HvuClassStudentPreview): boolean {
        return student.status === 'duplicate' ||
            student.status === 'not-found' ||
            student.status === 'download-failed';
    }

    private normalizeStudentCode(value: string): string {
        return value === null || value === undefined ? '' : value.toString().trim().toLowerCase();
    }

    private resetDownloadedData(): void {
        this.classes = [];
        this.displayedClasses = [];
        this.students = [];
        this.studentDifferences = [];
        this.displayedStudents = [];
        this.eligibleClasses = [];
        this.confirmationClasses = [];
        this.totalEligibleStudents = 0;
        this.emptyEligibleClassCount = 0;
        this.confirmationChangedClassCount = 0;
        this.confirmationUnchangedClassCount = 0;
        this.confirmationAddedStudentCount = 0;
        this.confirmationRemovedStudentCount = 0;
        this.confirmationReorderedStudentCount = 0;
        this.confirmationInvalidCurrentStudentCount = 0;
        this.confirmationDestructiveClasses = [];
        this.confirmDestructiveChangesAgreed = false;
        this.selectedSyncClassId = null;
        this.searchClass = null;
        this.studentStatusFilter = null;
        this.studentPage = 0;
        this.importSummary = this.createEmptySummary();
    }

    private openProgress(title: string, total: number): void {
        this.progressTitle = title;
        this.progressDetail = '';
        this.progressValue = 0;
        this.progressCompleted = 0;
        this.progressTotal = total;
        this.progressErrors = 0;
        this.showProgressDialog = true;
    }

    private updateProgressValue(): void {
        this.progressValue = this.progressTotal
            ? this.progressCompleted / this.progressTotal * 100
            : 0;
    }

    private chunk<T>(items: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let index = 0; index < items.length; index += size) {
            chunks.push(items.slice(index, index + size));
        }
        return chunks;
    }
}
