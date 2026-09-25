import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';

import { ThiShiftsService, CathiNV, CathiDetailNV, CathiRoomNV, CathiHinhthucthiNV } from '@modules/shared/services/thi-shifts.service';
import { NotificationService } from '@core/services/notification.service';
import { HelperService } from '@core/services/helper.service';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ThiShifts } from '@modules/shared/models/thi-shifts';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError, concatMap, reduce, tap, last, mergeMap } from 'rxjs/operators';

import { OvicQueryCondition } from '@core/models/dto';
import { HttpParams } from '@angular/common/http';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ThiShiftStudentsService } from '@modules/shared/services/thi-shift-students.service';
import { ThiShiftRoomssService } from '@modules/shared/services/thi-shift-rooms.service';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import * as FileSaver from 'file-saver';
import * as exceljs from 'exceljs';

type SyncResult = { ok: boolean; errs: SyncErrorItem[] };
type SyncErrorItem = { type: 'student' | 'teacher' | 'sbd_duplicate'; maSv?: string; hoTen?: string; tenCb?: string; soPhong?: string; tenCaThi: string; message: string; sbdTrung?: string; danhSachSV?: string; studentDetail?: CathiDetailNV };

@Component({
    selector: 'app-dongbo-cathi-ictu',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        FormsModule,
        ProgressBarModule,
        DialogModule,
        MatProgressBarModule,
    ],
    templateUrl: './dongbo-cathi-ictu.component.html',
    styleUrls: ['./dongbo-cathi-ictu.component.css'],
})
export class DongboCathiIctuComponent implements OnInit, OnChanges {

    @Input() list_course: ElnKhoaHoc[] = [];

    @Input() list_namhoc: { value: string; label: string }[] = [];

    @Input() list_hocky: { value: string; label: string }[] = [];

    @Input() refreshTrigger = 0;

    @Output() onSyncSuccess = new EventEmitter<void>();

    @Output() onClose = new EventEmitter<void>();

    // Filter state
    selectedHocky: number | null = null;
    selectedNamhoc: string | null = null;
    selectedCourse: ElnKhoaHoc | null = null;

    // Data
    listCathiNV: CathiNV[] = [];
    selectedIds: Set<string> = new Set();
    statusMap: Map<string, 'pending' | 'synced' | 'exists' | 'reimport'> = new Map();
    idHinhThucTracNghiemSet: Set<number> = new Set();

    /** Lưu local ThiShifts.id cho các ca thi reimport (status=0, chưa có SV) */
    existingShiftMap: Map<string, number> = new Map(); // sync_cathi_id → local ThiShifts.id

    // Bulk lookup maps (loaded once before import/detail)
    studentCodeMap: Map<string, ElngUserProfile> = new Map(); // student_code → profile
    teacherCodeMap: Map<string, ElngUserProfile> = new Map(); // Ma_cb → profile
    teacherEmailMap: Map<string, ElngUserProfile> = new Map(); // email → profile

    // Cached detail data keyed by sync_cathi_id (load once, reuse for import)
    cachedStudents: Map<string, CathiDetailNV[]> = new Map();
    cachedRooms: Map<string, CathiRoomNV[]> = new Map();

    /** Map tên hiển thị cho mỗi ca thi (tính sẵn, dùng object để dùng bracket notation trong template) */
    shiftDisplayNameMap: Record<string, string> = {};

    /** Map thời gian hiển thị cho mỗi ca thi (tính sẵn) */
    timeLabelMap: Record<string, string> = {};

    /** Map kiểm tra ca thi có kyhieu_cathi hay không */
    shiftHasKyhieuMap: Record<string, boolean> = {};

    // Warning dialog for empty kyhieu_cathi
    showEmptyKyhieuWarning = false;
    confirmImportEmptyKyhieu = false;
    emptyKyhieuShifts: CathiNV[] = [];

    // Detail data
    detailCathi: CathiNV | null = null;
    detailStudents: (CathiDetailNV & { existsInSystem: boolean })[] = [];
    detailRooms: (CathiRoomNV & { cb1Exists: boolean; cb2Exists: boolean; cb1SystemName: string; cb2SystemName: string })[] = [];
    loadingDetail = false;
    selectedRoom: string | null = null;

    /** Tên ca thi hiển thị trong detail (tính sẵn) */
    detailShiftName = '';
    /** Thời gian hiển thị trong detail (tính sẵn) */
    detailTimeLabel = '';
    /** Map phòng → số lượng SV (tính sẵn) */
    roomStudentCountMap: Record<string, number> = {};
    /** Danh sách SV chưa xếp phòng (tính sẵn) */
    studentsWithoutRoom: (CathiDetailNV & { existsInSystem: boolean })[] = [];
    /** Danh sách SV của phòng đang chọn (tính sẵn) */
    filteredStudents: (CathiDetailNV & { existsInSystem: boolean })[] = [];

    // Sync UI
    loading = false;
    syncing = false;
    syncProgress = 0;
    syncTotal = 0;
    syncStepText = '';
    syncStepLabel = '';
    syncStepCurrent = 0;
    syncStepTotal = 0;
    noData = false;

    /** Dialog-waiting modal */
    displaySyncModal = false;
    waitting_title = '';
    get syncProgressValue(): number {
        if (this.profileLoading && this.profileTotal) {
            return this.profileLoadedCount / this.profileTotal * 100;
        }
        if (this.syncing && this.syncTotal) {
            return this.syncProgress / this.syncTotal * 100;
        }
        return 0;
    }

    // Đợt thi filter
    selectedDotThi: number | null = null;
    dotThiOptions: { value: number; label: string }[] = [];

    // Profile loading progress
    profileLoading = false;
    profileLoadingText = '';
    profileLoadedCount = 0;
    profileTotal = 0;

    // Sync results
    syncErrors: SyncErrorItem[] = [];
    syncSuccessCount = 0;
    syncFailCount = 0;
    syncComplete = false;

    /** Lỗi SV (tính sẵn từ syncErrors) */
    studentErrors: SyncErrorItem[] = [];
    /** Lỗi CB (tính sẵn từ syncErrors) */
    teacherErrors: SyncErrorItem[] = [];
    /** Lỗi trùng SBD (tính sẵn từ syncErrors) */
    sbdDuplicateErrors: SyncErrorItem[] = [];

    constructor(
        private thiShiftsService: ThiShiftsService,
        private notificationService: NotificationService,
        private helperService: HelperService,
        private elngUserProfileService: ElngUserProfileService,
        private thiShiftStudentsService: ThiShiftStudentsService,
        private thiShiftRoomssService: ThiShiftRoomssService,
    ) { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
            // reset state
            this.listCathiNV = [];
            this.selectedIds.clear();
            this.statusMap.clear();
            this.existingShiftMap.clear();
            this.selectedDotThi = null;
            this.dotThiOptions = [];
            this.studentCodeMap.clear();
            this.teacherCodeMap.clear();
            this.teacherEmailMap.clear();
            this.cachedStudents.clear();
            this.cachedRooms.clear();
            this.detailCathi = null;
            this.detailStudents = [];
            this.detailRooms = [];
            this.selectedRoom = null;
            this.loading = false;
            this.syncing = false;
            this.syncComplete = false;
            this.noData = false;
            this.showEmptyKyhieuWarning = false;
            this.confirmImportEmptyKyhieu = false;
            this.emptyKyhieuShifts = [];
            // nếu đã có filter, load lại
            if (this.selectedHocky && this.selectedNamhoc && this.selectedCourse) {
                this.loadDanhSach();
            }
        }
    }

    get selectedCount(): number {
        return this.selectedIds.size;
    }

    get readyCount(): number {
        let count = 0;
        this.selectedIds.forEach(id => {
            const stt = this.statusMap.get(id);
            if (stt === 'pending' || stt === 'reimport') count++;
        });
        return count;
    }

    get filteredListCathiNV(): CathiNV[] {
        if (this.selectedDotThi === null) return this.listCathiNV;
        return this.listCathiNV.filter(c => c.Dot_thi === this.selectedDotThi);
    }

    get allSelected(): boolean {
        if (!this.filteredListCathiNV.length) return false;
        return this.filteredListCathiNV.every(c =>
            this.selectedIds.has(c.ID_thi)
            || (this.statusMap.get(c.ID_thi) !== 'pending' && this.statusMap.get(c.ID_thi) !== 'reimport')
        );
    }

    onNamhocChange(event: any): void {
        this.selectedNamhoc = event || null;
        this.tryLoad();
    }

    onHockyChange(event: any): void {
        this.selectedHocky = event ? Number(event) : null;
        this.tryLoad();
    }

    onCourseChange(event: any): void {
        if (event) {
            this.selectedCourse = this.list_course.find(c => c.id === Number(event)) || null;
        } else {
            this.selectedCourse = null;
        }
        this.tryLoad();
    }

    private tryLoad(): void {
        if (this.selectedHocky && this.selectedNamhoc && this.selectedCourse) {
            this.selectedDotThi = null;
            this.dotThiOptions = [];
            this.loadDanhSach();
        }
    }

    onDotThiChange(event: any): void {
        this.selectedDotThi = event ? Number(event) : null;
    }

    loadDanhSach(): void {
        const hocky = this.selectedHocky!;
        const namhoc = this.selectedNamhoc!.replace(/_/g, '-');
        const mamon = this.selectedCourse!.maso;

        this.loading = true;
        this.noData = false;
        this.listCathiNV = [];
        this.selectedIds.clear();
        this.statusMap.clear();
        this.existingShiftMap.clear();
        this.shiftDisplayNameMap = {};
        this.timeLabelMap = {};
        this.shiftHasKyhieuMap = {};
        this.showEmptyKyhieuWarning = false;
        this.confirmImportEmptyKyhieu = false;
        this.emptyKyhieuShifts = [];

        // Lấy hình thức thi, tìm các ID "trắc nghiệm", rồi tải danh sách ca thi + check trùng
        this.thiShiftsService.dongBohinhthucthiIctu().pipe(
            map((res: any) => {
                const data: CathiHinhthucthiNV[] = res && res.data ? res.data : (Array.isArray(res) ? res : []);
                const ids = new Set<number>();
                data.forEach(h => {
                    if (h.Ten_hinh_thuc && this.fuzzyMatchTracNghiem(h.Ten_hinh_thuc)) {
                        ids.add(h.ID_hinh_thuc);
                    }
                });
                return ids;
            }),
            switchMap((hinhThucIds: Set<number>) => {
                if (!hinhThucIds.size) {
                    this.loading = false;
                    this.noData = true;
                    this.notificationService.toastWarning('Không tìm thấy hình thức thi "Trắc nghiệm" từ hệ thống');
                    return of(null);
                }
                this.idHinhThucTracNghiemSet = hinhThucIds;
                // Load existing sync_cathi_ids + danh sách ca thi song song
                return this.loadExistingSyncIds$(namhoc, hocky, this.selectedCourse!.id!).pipe(
                    switchMap((existingMap: Map<string, { localId: number; status: number }>) =>
                        this.thiShiftsService.dongBoCaThiIctu(hocky, namhoc, mamon).pipe(
                            map((data: CathiNV[]) => ({ data, existingMap }))
                        )
                    )
                );
            }),
            catchError(() => {
                this.loading = false;
                this.noData = true;
                this.notificationService.toastError('Lỗi tải dữ liệu từ hệ thống');
                return of(null);
            })
        ).subscribe(result => {
            if (!result) return;
            const { data, existingMap } = result;

            this.loading = false;
            if (data && data.length) {
                const filtered = data.filter(c => this.idHinhThucTracNghiemSet.has(c.ID_hinh_thuc));
                if (filtered.length) {
                    // Sort by Ngay_thi asc, then TimeStart asc
                    this.listCathiNV = filtered.sort((a, b) => {
                        const dateA = a.Ngay_thi || '';
                        const dateB = b.Ngay_thi || '';
                        if (dateA !== dateB) {
                            return dateA.localeCompare(dateB);
                        }
                        const timeA = a.TimeStart || '';
                        const timeB = b.TimeStart || '';
                        return timeA.localeCompare(timeB);
                    });
                    // Xây dựng shiftDisplayNameMap + timeLabelMap + shiftHasKyhieuMap (tuân thủ Rule 1)
                    this.listCathiNV.forEach(c => {
                        this.shiftDisplayNameMap[c.ID_thi] = this.buildShiftDisplayName(c);
                        this.timeLabelMap[c.ID_thi] = this.buildTimeLabel(c);
                        this.shiftHasKyhieuMap[c.ID_thi] = !!(c.kyhieu_cathi && c.kyhieu_cathi.trim());
                    });
                    this.listCathiNV.forEach(c => {
                        const exist = existingMap.get(c.ID_thi);
                        if (!exist) {
                            this.statusMap.set(c.ID_thi, 'pending');
                        } else if (exist.status !== 0) {
                            // Đã import VÀ status !== 0 → không cho phép chọn
                            this.statusMap.set(c.ID_thi, 'exists');
                        } else {
                            // Đã import VÀ status === 0 → lưu localId, kiểm tra student count sau
                            this.existingShiftMap.set(c.ID_thi, exist.localId);
                        }
                    });
                    // Build đợt thi options
                    const dotSet = new Set<number>();
                    this.listCathiNV.forEach(c => dotSet.add(c.Dot_thi));
                    this.dotThiOptions = [...dotSet].sort((a, b) => a - b).map(d => ({ value: d, label: `Đợt ${d}` }));

                    // Kiểm tra các ca thi status=0 đã có SV import chưa
                    this.checkReimportStatuses$().subscribe();
                } else {
                    this.noData = true;
                }
            } else {
                this.noData = true;
            }
        });
    }

    /** Kiểm tra ca thi status=0: tất cả đều được phép reimport (có SV hay chưa) */
    private checkReimportStatuses$(): Observable<void> {
        const ids = [...this.existingShiftMap.keys()];
        if (!ids.length) return of(void 0);

        // Tất cả ca thi status=0 đều được reimport
        ids.forEach(id => this.statusMap.set(id, 'reimport'));
        return of(void 0);
    }

    /** Trả về Map<sync_cathi_id, {localId, status}> cho tất cả ca thi đã đồng bộ */
    private loadExistingSyncIds$(namhoc: string, hocky: number, courseId: number): Observable<Map<string, { localId: number; status: number }>> {
        const condAll: ConditionOption = {
            condition: [
                { conditionName: 'type_of_test', condition: OvicQueryCondition.equal, value: 'TRACNGHIEM', orWhere: 'and' },
                { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: namhoc.replace(/-/g, '_'), orWhere: 'and' },
                { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: hocky.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: courseId.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'sync_cathi_id,id,status' },
            ],
            page: null,
        };
        return this.thiShiftsService.getThiShiftsByPageNew(condAll).pipe(
            map(all => {
                const map = new Map<string, { localId: number; status: number }>();
                all.data.forEach((s: ThiShifts) => {
                    if (s.sync_cathi_id) map.set(s.sync_cathi_id, { localId: s.id!, status: s.status });
                });
                return map;
            }),
            catchError(() => of(new Map<string, { localId: number; status: number }>()))
        );
    }

    toggleSelect(cathi: CathiNV): void {
        const stt = this.statusMap.get(cathi.ID_thi);
        if (stt === 'exists' || stt === 'synced') return;
        if (this.selectedIds.has(cathi.ID_thi)) {
            this.selectedIds.delete(cathi.ID_thi);
        } else {
            this.selectedIds.add(cathi.ID_thi);
        }
    }

    selectAll(): void {
        this.filteredListCathiNV.forEach(c => {
            const stt = this.statusMap.get(c.ID_thi);
            if (stt === 'pending' || stt === 'reimport') this.selectedIds.add(c.ID_thi);
        });
    }

    deselectAll(): void {
        this.selectedIds.clear();
    }

    /** Xây dựng tên hiển thị cho ca thi */
    private buildShiftDisplayName(cathi: CathiNV): string {
        const courseName = this.selectedCourse ? this.selectedCourse.title : '';
        let timeLabel = '';
        if (cathi.Ngay_thi) {
            try {
                const d = new Date(cathi.Ngay_thi);
                timeLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                if (cathi.TimeStart) timeLabel += ` ${cathi.TimeStart}`;
            } catch {
                timeLabel = cathi.Ngay_thi;
            }
        }
        return `${courseName} - ${timeLabel} - ${cathi.Nam_hoc} - HK${cathi.Hoc_ky} - Đợt${cathi.Dot_thi}`;
    }

    /** Xây dựng nhãn thời gian cho ca thi */
    private buildTimeLabel(cathi: CathiNV): string {
        if (cathi.Ngay_thi && cathi.TimeStart) {
            try {
                const date = new Date(cathi.Ngay_thi);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year} ${cathi.TimeStart}`;
            } catch {
                return cathi.Ngay_thi;
            }
        }
        return cathi.Ngay_thi || '';
    }

    /** Cập nhật các computed properties cho detail view */
    private updateDetailComputed(): void {
        if (this.detailCathi) {
            this.detailShiftName = this.shiftDisplayNameMap[this.detailCathi.ID_thi] || this.buildShiftDisplayName(this.detailCathi);
            this.detailTimeLabel = this.buildTimeLabel(this.detailCathi);
        } else {
            this.detailShiftName = '';
            this.detailTimeLabel = '';
        }

        // roomStudentCountMap
        const countMap: Record<string, number> = {};
        this.detailStudents.forEach(sv => {
            const room = sv.So_phong || '__no_room__';
            countMap[room] = (countMap[room] || 0) + 1;
        });
        this.roomStudentCountMap = countMap;

        // studentsWithoutRoom
        this.studentsWithoutRoom = this.detailStudents.filter(s => !s.So_phong);

        // filteredStudents
        this.updateFilteredStudents();
    }

    /** Cập nhật filteredStudents dựa trên selectedRoom */
    private updateFilteredStudents(): void {
        if (!this.selectedRoom || this.selectedRoom === '__no_room__') {
            this.filteredStudents = [];
        } else {
            this.filteredStudents = this.detailStudents.filter(s => s.So_phong === this.selectedRoom);
        }
    }

    /** Cập nhật các computed properties cho sync errors */
    private updateSyncErrorComputed(): void {
        this.studentErrors = this.syncErrors.filter(e => e.type === 'student');
        this.teacherErrors = this.syncErrors.filter(e => e.type === 'teacher');
        this.sbdDuplicateErrors = this.syncErrors.filter(e => e.type === 'sbd_duplicate');
    }

    syncSelected(): void {
        const toSync = this.listCathiNV.filter(c => {
            if (!this.selectedIds.has(c.ID_thi)) return false;
            const stt = this.statusMap.get(c.ID_thi);
            return stt === 'pending' || stt === 'reimport';
        });

        if (!toSync.length) {
            this.notificationService.toastWarning('Không có ca thi nào ở trạng thái chưa đồng bộ');
            return;
        }

        // Kiểm tra ca thi nào có kyhieu_cathi rỗng
        const emptyKyhieu = toSync.filter(c => !this.shiftHasKyhieuMap[c.ID_thi]);
        if (emptyKyhieu.length) {
            this.emptyKyhieuShifts = emptyKyhieu;
            this.confirmImportEmptyKyhieu = false;
            this.showEmptyKyhieuWarning = true;
            return;
        }

        this.startImport(toSync);
    }

    /** Xác nhận import dù có ca thi chưa có kyhieu_cathi */
    confirmAndImportEmptyKyhieu(): void {
        if (!this.confirmImportEmptyKyhieu) return;

        const toSync = this.listCathiNV.filter(c => {
            if (!this.selectedIds.has(c.ID_thi)) return false;
            const stt = this.statusMap.get(c.ID_thi);
            return stt === 'pending' || stt === 'reimport';
        });

        this.showEmptyKyhieuWarning = false;
        this.startImport(toSync);
    }

    cancelEmptyKyhieuWarning(): void {
        this.showEmptyKyhieuWarning = false;
        this.emptyKyhieuShifts = [];
        this.confirmImportEmptyKyhieu = false;
    }

    private startImport(toSync: CathiNV[]): void {
        this.syncing = true;
        this.syncProgress = 0;
        this.syncTotal = toSync.length;
        this.syncErrors = [];
        this.waitting_title = 'Đang tải thông tin người dùng...';
        this.displaySyncModal = true;

        // Load all detail data + profiles first, then import sequentially
        this.loadAllPreData$(toSync).pipe(
            concatMap(() => from(toSync).pipe(
                concatMap(cathi => this.importOne$(cathi)),
                tap(() => this.syncProgress++),
                reduce((acc: SyncResult[], result: SyncResult) => {
                    acc.push(result);
                    return acc;
                }, [] as SyncResult[]),
            ))
        ).subscribe({
            next: (results) => {
                this.syncing = false;
                this.showSyncResults(results, toSync.length);
            },
            error: () => {
                this.syncing = false;
                this.displaySyncModal = false;
                this.notificationService.toastError('Lỗi trong quá trình đồng bộ');
            },
        });
    }

    private showSyncResults(results: SyncResult[], _total: number): void {
        this.syncSuccessCount = results.filter(r => r.ok).length;
        this.syncFailCount = results.filter(r => !r.ok).length;
        this.syncErrors = results.flatMap(r => r.errs);
        this.updateSyncErrorComputed();
        this.displaySyncModal = false;
        this.syncComplete = true;
    }

    closeSyncResults(closePanel: boolean): void {
        this.syncComplete = false;
        this.syncErrors = [];
        this.updateSyncErrorComputed();
        if (closePanel) {
            this.onSyncSuccess.emit();
            this.onClose.emit();
        }
    }

    /** Xuất Excel danh sách SV không có trong hệ thống */
    exportStudentErrorsToExcel(): void {
        const data = this.studentErrors.filter(e => e.studentDetail).map(e => {
            const sv = e.studentDetail!;
            const ngaySinh = sv.Ngay_sinh ? this.formatNgaySinhExcel(sv.Ngay_sinh) : '';
            const maSv = sv.Ma_sv || '';
            return {
                SBD: sv.So_bao_danh || '',
                'Họ và tên': sv.Ho_ten || '',
                'Ngày sinh': ngaySinh,
                'Giới tính': sv.Gioi_tinh || '',
                Phone: maSv,
                'Mã SV': maSv,
                Email: maSv ? `${maSv}@ictu.edu.vn` : '',
                'Lớp quản lý': sv.Ten_lop || '',
                Tỉnh: '',
                Ngành: '',
                Khoa: '',
                'Khoa đào tạo': '',
            };
        });
        if (!data.length) {
            this.notificationService.toastWarning('Không có sinh viên nào để xuất');
            return;
        }

        const headerKeys = ['SBD', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Phone', 'Mã SV', 'Email', 'Lớp quản lý', 'Tỉnh', 'Ngành', 'Khoa', 'Khoa đào tạo'];
        const yellowHeaders = new Set(['Họ và tên', 'Ngày sinh', 'Phone', 'Mã SV', 'Email', 'Lớp quản lý', 'Khoa đào tạo']);

        const wb = new exceljs.Workbook();
        const ws = wb.addWorksheet('SV_khong_co_trong_he_thong');

        // Header row
        const headerRow = ws.addRow(headerKeys);
        headerRow.font = { bold: true, size: 11, name: 'Times New Roman' };
        headerRow.height = 25;
        headerRow.eachCell((cell, colNum) => {
            const key = headerKeys[colNum - 1];
            cell.border = {
                top: { style: 'thin', color: { argb: '333333' } },
                left: { style: 'thin', color: { argb: '333333' } },
                bottom: { style: 'thin', color: { argb: '333333' } },
                right: { style: 'thin', color: { argb: '333333' } },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            if (yellowHeaders.has(key)) {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFFF00' },
                };
            }
        });

        // Data rows
        data.forEach(row => {
            const r = ws.addRow(headerKeys.map(k => (row as any)[k]));
            r.font = { size: 11, name: 'Times New Roman' };
            r.height = 22;
            r.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: '333333' } },
                    left: { style: 'thin', color: { argb: '333333' } },
                    bottom: { style: 'thin', color: { argb: '333333' } },
                    right: { style: 'thin', color: { argb: '333333' } },
                };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            });
        });

        // Column widths
        ws.getColumn(1).width = 12;  // SBD
        ws.getColumn(2).width = 28;  // Họ và tên
        ws.getColumn(3).width = 14;  // Ngày sinh
        ws.getColumn(4).width = 10;  // Giới tính
        ws.getColumn(5).width = 16;  // Phone
        ws.getColumn(6).width = 16;  // Mã SV
        ws.getColumn(7).width = 28;  // Email
        ws.getColumn(8).width = 20;  // Lớp quản lý
        ws.getColumn(9).width = 12;  // Tỉnh
        ws.getColumn(10).width = 16; // Ngành
        ws.getColumn(11).width = 16; // Khoa
        ws.getColumn(12).width = 20; // Khoa đào tạo

        wb.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            FileSaver.saveAs(blob, `SV_khong_co_trong_he_thong_${timestamp}.xlsx`);
        });
    }

    private formatNgaySinhExcel(dateStr: string): string {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            // Try parsing dd/MM/yyyy or yyyy-MM-dd
            const parts = dateStr.split(/[/-]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) return `${parts[2]}.${parts[1]}.${parts[0]}`;
                return `${parts[0]}.${parts[1]}.${parts[2]}`;
            }
            return dateStr;
        }
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}.${mm}.${yyyy}`;
    }

    /** Fetch detail data for ALL shifts + load all profiles into maps */
    private loadAllPreData$(shifts: CathiNV[]): Observable<void> {
        const studentCodes = new Set<string>();
        const teacherCodes = new Set<string>();
        const teacherEmails = new Set<string>();

        const detailCalls = shifts.map(s =>
            forkJoin({
                students: this.thiShiftsService.dongBoCaThiIctuDetail(s.ID_thi).pipe(catchError(() => of([] as CathiDetailNV[]))),
                rooms: this.thiShiftsService.dongBoPhongthiIctuDetail(s.ID_thi).pipe(catchError(() => of([] as CathiRoomNV[]))),
            }).pipe(
                tap(({ students, rooms }) => {
                    this.cachedStudents.set(s.ID_thi, students || []);
                    this.cachedRooms.set(s.ID_thi, rooms || []);
                    (students || []).forEach(sv => { if (sv.Ma_sv) studentCodes.add(sv.Ma_sv.toLowerCase()); });
                    (rooms || []).forEach(r => {
                        if (r.Ma_cb_coi_thi1) teacherCodes.add(r.Ma_cb_coi_thi1.toLowerCase());
                        if (r.Ma_cb_coi_thi2) teacherCodes.add(r.Ma_cb_coi_thi2.toLowerCase());
                        if (r.Email_coi_thi1) teacherEmails.add(r.Email_coi_thi1.toLowerCase());
                        if (r.Email_coi_thi2) teacherEmails.add(r.Email_coi_thi2.toLowerCase());
                    });
                }),
            )
        );

        if (!detailCalls.length) {
            this.profileLoading = false;
            return of(void 0);
        }

        return from(detailCalls).pipe(
            mergeMap(call => call, 6), // limit 6 concurrent requests
            reduce((acc: any[], val: any) => { acc.push(val); return acc; }, [] as any[]),
            concatMap(() => {
                // Setup profile progress
                const totalProfiles = studentCodes.size + teacherCodes.size + teacherEmails.size;
                this.profileLoading = true;
                this.profileLoadedCount = 0;
                this.profileTotal = totalProfiles;
                this.profileLoadingText = 'Đang tải thông tin sinh viên & cán bộ coi thi...';

                const calls: Observable<any>[] = [];
                if (studentCodes.size) {
                    calls.push(this.batchLoadProfiles$([...studentCodes], 'student_code').pipe(
                        tap((profiles: ElngUserProfile[]) => profiles.forEach(p => {
                            if (p.student_code) this.studentCodeMap.set(p.student_code.toLowerCase(), p);
                        })),
                    ));
                }
                if (teacherCodes.size) {
                    calls.push(this.batchLoadProfiles$([...teacherCodes], 'student_code').pipe(
                        tap((profiles: ElngUserProfile[]) => profiles.forEach(p => {
                            if (p.student_code) this.teacherCodeMap.set(p.student_code.toLowerCase(), p);
                        })),
                    ));
                }
                if (teacherEmails.size) {
                    calls.push(this.batchLoadProfiles$([...teacherEmails], 'user__email').pipe(
                        tap((profiles: ElngUserProfile[]) => profiles.forEach(p => {
                            const email = p.user?.email || '';
                            if (email) this.teacherEmailMap.set(email.toLowerCase(), p);
                        })),
                    ));
                }
                return calls.length ? forkJoin(calls) : of(null);
            }),
            map(() => {
                this.profileLoading = false;
                return void 0;
            }),
            catchError((err) => {
                console.error('loadAllPreData$ error:', err);
                this.profileLoading = false;
                return of(void 0);
            }),
        );
    }

    private batchLoadProfiles$(items: string[], byField: string): Observable<ElngUserProfile[]> {
        // Chunk ~20 để tránh URL quá dài + cho phép theo dõi progress
        const CHUNK = 20;
        const chunks: string[][] = [];
        for (let i = 0; i < items.length; i += CHUNK) {
            chunks.push(items.slice(i, i + CHUNK));
        }
        if (!chunks.length) return of([]);

        return from(chunks).pipe(
            concatMap(chunk => {
                const params = new HttpParams()
                    .set('include', chunk.join(','))
                    .set('include_by', byField)
                    .set('limit', '-1');
                return this.elngUserProfileService.getElngUserProfileByCols(params).pipe(
                    tap(() => {
                        // Update progress after each chunk
                        this.profileLoadedCount += chunk.length;
                    }),
                    catchError(() => of([] as ElngUserProfile[])),
                );
            }),
            reduce((acc: ElngUserProfile[], val: ElngUserProfile[]) => acc.concat(val), [] as ElngUserProfile[]),
        );
    }

    /** Kiểm tra danh sách sinh viên của ca thi có bị trùng số báo danh không.
     *  Trả về danh sách lỗi nếu có, nếu không trùng thì trả về mảng rỗng. */
    private checkDuplicateSBD(syncCathiId: string, shiftName: string): SyncErrorItem[] {
        const students = this.cachedStudents.get(syncCathiId) || [];
        const sbdMap = new Map<string, CathiDetailNV[]>();

        // Gom nhóm sinh viên theo số báo danh
        students.forEach(sv => {
            const sbd = (sv.So_bao_danh || '').trim();
            if (!sbd) return; // Bỏ qua SV không có SBD
            if (!sbdMap.has(sbd)) {
                sbdMap.set(sbd, []);
            }
            sbdMap.get(sbd)!.push(sv);
        });

        const errs: SyncErrorItem[] = [];

        // Kiểm tra các SBD bị trùng
        sbdMap.forEach((svList, sbd) => {
            if (svList.length > 1) {
                const danhSachSV = svList.map(sv => `${sv.Ma_sv} - ${sv.Ho_ten}`).join('; ');
                errs.push({
                    type: 'sbd_duplicate',
                    tenCaThi: shiftName,
                    sbdTrung: sbd,
                    danhSachSV: danhSachSV,
                    message: `Ca thi "${shiftName}" có ${svList.length} sinh viên trùng số báo danh "${sbd}": ${danhSachSV}`,
                });
            }
        });

        return errs;
    }

    private importOne$(cathi: CathiNV): Observable<{ ok: boolean; errs: SyncErrorItem[] }> {
        const courseId = this.selectedCourse ? this.selectedCourse.id : null;
        if (!courseId) return of({ ok: false, errs: [] });

        const courseName = this.selectedCourse ? this.selectedCourse.title : '';

        let timeStart = '';
        if (cathi.Ngay_thi) {
            if (cathi.TimeStart) {
                timeStart = `${cathi.Ngay_thi.substring(0, 10)} ${cathi.TimeStart}`;
            } else {
                timeStart = cathi.Ngay_thi;
            }
        } else {
            timeStart = new Date().toISOString();
        }

        const sqlTime = this.helperService.stringToDateSql(timeStart, true);

        let timeLabel = '';
        if (cathi.Ngay_thi) {
            try {
                const d = new Date(cathi.Ngay_thi);
                timeLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                if (cathi.TimeStart) timeLabel += ` ${cathi.TimeStart}`;
            } catch {
                timeLabel = cathi.Ngay_thi;
            }
        }

        const kyhieu = (cathi.kyhieu_cathi || '').trim();
        const data = {
            hocky: cathi.Hoc_ky,
            namhoc: cathi.Nam_hoc.replace(/-/g, '_'),
            dotthi: cathi.Dot_thi,
            name: kyhieu
                ? `${kyhieu} - ${courseName} - ${timeLabel} - ${cathi.Nam_hoc} - HK${cathi.Hoc_ky} - Đợt${cathi.Dot_thi}`
                : `${courseName} - ${timeLabel} - ${cathi.Nam_hoc} - HK${cathi.Hoc_ky} - Đợt${cathi.Dot_thi}`,
            time_start: sqlTime,
            course_id: courseId,
            sync_cathi_id: cathi.ID_thi,
            type_of_test: 'TRACNGHIEM',
            status: 0,
        };

        const syncCathiId = cathi.ID_thi;
        const shiftName = this.shiftDisplayNameMap[cathi.ID_thi] || this.buildShiftDisplayName(cathi);
        const isReimport = this.statusMap.get(cathi.ID_thi) === 'reimport';
        const existingLocalId = this.existingShiftMap.get(cathi.ID_thi);

        // Bước 0: Kiểm tra trùng số báo danh trước khi import
        const duplicateSBDErrs = this.checkDuplicateSBD(syncCathiId, shiftName);
        if (duplicateSBDErrs.length) {
            this.syncStepText = `Bỏ qua ca thi "${shiftName}" — có sinh viên trùng số báo danh`;
            return of({ ok: false, errs: duplicateSBDErrs });
        }

        // Step 1: Import ca thi → lấy newShiftId. Nếu reimport, dùng localId có sẵn
        const addShift$ = isReimport && existingLocalId
            ? of(existingLocalId)
            : this.thiShiftsService.addThiShifts(data).pipe(
                map((newShift: any) => newShift?.id || newShift),
                catchError(() => of(null)) // Nếu lỗi → trả về null, không throw error
              );

        return addShift$.pipe(
            concatMap((newShiftId: number | null) => {
                // Nếu không lấy được newShiftId → không thể import tiếp → đánh dấu fail
                if (!newShiftId) {
                    this.syncStepText = `Thất bại — không thể tạo ca thi "${shiftName}"`;
                    return of({ ok: false, errs: [] });
                }

                if (!isReimport) {
                    this.syncStepLabel = 'Đồng bộ ca thi';
                    this.syncStepText = `Đã import ca thi "${shiftName}"`;
                } else {
                    this.syncStepLabel = 'Cập nhật lại sinh viên';
                    this.syncStepText = `Đang kiểm tra sinh viên cho ca thi "${shiftName}"...`;
                }

                return of(null).pipe(
                    concatMap(() => {
                        this.syncStepLabel = 'Đồng bộ sinh viên';
                        this.syncStepText = `Đang đồng bộ sinh viên cho "${shiftName}"...`;
                        const totalStudents = (this.cachedStudents.get(syncCathiId) || []).length;
                        return this.importStudents$(newShiftId, syncCathiId, shiftName, isReimport).pipe(
                            concatMap(({ studentErrs, importedCount, importedRooms }) => {
                                // Skip rooms if no student was imported
                                if (totalStudents > 0 && importedCount === 0) {
                                    this.syncStepText = `Bỏ qua phòng thi — không có sinh viên nào được import cho "${shiftName}"`;
                                    return of({ errs: studentErrs, skipRooms: true });
                                }
                                // Pre-check teachers: if any CB missing in system, skip rooms
                                const rooms = this.cachedRooms.get(syncCathiId) || [];
                                const teacherErrs = this.preCheckTeachers$(rooms, shiftName);
                                if (teacherErrs.length) {
                                    this.syncStepText = `Bỏ qua phòng thi — có giảng viên không tồn tại trong hệ thống cho "${shiftName}"`;
                                    return of({ errs: [...studentErrs, ...teacherErrs], skipRooms: true });
                                }
                                this.syncStepLabel = 'Đồng bộ phòng thi';
                                this.syncStepText = `Đang đồng bộ phòng thi cho "${shiftName}"...`;
                                // Step 3: Import phòng thi — chỉ import phòng có SV được import thành công
                                return this.importRooms$(newShiftId, syncCathiId, shiftName, importedRooms, isReimport).pipe(
                                    map(({ roomErrs }) => ({
                                        errs: [...studentErrs, ...roomErrs],
                                        skipRooms: false,
                                    }))
                                );
                            }),
                            map((result: { errs: SyncErrorItem[]; skipRooms?: boolean }) => ({
                                ok: true, // ca thi đã import thành công (theo plan: không có SV/phòng vẫn tính là thành công)
                                errs: result.errs,
                            })),
                            tap(result => {
                                if (result.ok) {
                                    this.statusMap.set(cathi.ID_thi, 'synced');
                                }
                            })
                        );
                    }),
                    catchError(() => of({ ok: false, errs: [] })),
                );
            }),
        );
    }

    private importStudents$(shiftId: number, syncCathiId: string, shiftName: string, isReimport = false): Observable<{ studentErrs: SyncErrorItem[]; importedCount: number; importedRooms: Set<string> }> {
        const students = this.cachedStudents.get(syncCathiId) || [];

        // Nếu reimport và ICTU trả rỗng → xóa hết SV cũ
        if (!students.length) {
            if (isReimport) {
                const cond: ConditionOption = {
                    condition: [{ conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: shiftId.toString(), orWhere: 'and' }],
                    set: [{ label: 'limit', value: '-1' }, { label: 'select', value: 'id' }],
                    page: null,
                };
                return this.thiShiftStudentsService.getThiShiftStudentsByPageNew(cond).pipe(
                    switchMap(res => {
                        const ids = res.data.map(s => s.id);
                        if (!ids.length) return of({ studentErrs: [], importedCount: 0, importedRooms: new Set<string>() });
                        return from(ids).pipe(
                            concatMap(recordId => this.thiShiftStudentsService.deleteThiShiftStudents(recordId).pipe(catchError(() => of(null)))),
                            last(),
                            map(() => ({ studentErrs: [], importedCount: 0, importedRooms: new Set<string>() })),
                        );
                    }),
                    catchError(() => of({ studentErrs: [], importedCount: 0, importedRooms: new Set<string>() })),
                );
            }
            return of({ studentErrs: [], importedCount: 0, importedRooms: new Set<string>() });
        }

        // Sort by So_bao_danh as number (e.g. "1", "2", "11", "12" instead of "1", "11", "12", "2")
        const sorted = [...students].sort((a, b) => {
            const sbdA = parseInt((a.So_bao_danh || '').trim(), 10) || 0;
            const sbdB = parseInt((b.So_bao_danh || '').trim(), 10) || 0;
            return sbdA - sbdB;
        });

        // Nếu reimport, load danh sách id+student_id đã có trong shift
        const existingStudentRecords$ = isReimport
            ? this.thiShiftStudentsService.getThiShiftStudentsByPageNew({
                condition: [{ conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: shiftId.toString(), orWhere: 'and' }],
                set: [{ label: 'limit', value: '-1' }, { label: 'select', value: 'id,student_id' }],
                page: null,
              }).pipe(
                map(res => new Map<number, number>(res.data.map(s => [s.student_id, s.id]))), // student_id → record id
                catchError(() => of(new Map<number, number>())),
              )
            : of(new Map<number, number>());

        return existingStudentRecords$.pipe(
            concatMap(existingStudentRecords => {
                const existingStudentIds = new Set(existingStudentRecords.keys());
                this.syncStepCurrent = 0;
                this.syncStepTotal = sorted.length;

                const errs: SyncErrorItem[] = [];
                const importedRooms = new Set<string>();
                let importedCount = 0;
                const processedStudentIds = new Set<number>();

                if (!sorted.length) {
                    return of({ studentErrs: errs, importedCount, importedRooms });
                }

                return from(sorted).pipe(
                    concatMap((sv, idx) => {
                        this.syncStepCurrent = idx + 1;
                        const profile = this.studentCodeMap.get(sv.Ma_sv.toLowerCase());
                        if (!profile || !profile.id) {
                            errs.push({
                                type: 'student',
                                maSv: sv.Ma_sv,
                                hoTen: sv.Ho_ten,
                                tenCaThi: shiftName,
                                message: `Sinh viên "${sv.Ma_sv} - ${sv.Ho_ten}" chưa có trên hệ thống DTKH (ca thi: "${shiftName}")`,
                                studentDetail: sv,
                            });
                            return of(null);
                        }
                        processedStudentIds.add(profile.id);
                        // Nếu đã có SV trong shift → bỏ qua
                        if (isReimport && existingStudentIds.has(profile.id)) {
                            if (sv.So_phong) importedRooms.add(sv.So_phong);
                            importedCount++;
                            return of(null);
                        }
                        if (sv.So_phong) importedRooms.add(sv.So_phong);
                        const studentData = {
                            shift_id: shiftId,
                            student_id: profile.id,
                            ordering: idx + 1,
                            sbd: sv.So_bao_danh || '',
                            room: sv.So_phong || '',
                            student_user_id: profile.user_id,
                        };
                        return this.thiShiftStudentsService.addThiShiftStudents(studentData).pipe(
                            tap(() => importedCount++),
                            map(() => null),
                            catchError(() => of(null)),
                        );
                    }),
                    last(),
                    concatMap(() => {
                        // Reimport: xóa SV đã có trong DB nhưng không còn trong dữ liệu ICTU
                        if (!isReimport || !existingStudentRecords.size) {
                            return of({ studentErrs: errs, importedCount, importedRooms });
                        }
                        const toDelete = [...existingStudentRecords.entries()].filter(([studentId]) => !processedStudentIds.has(studentId));
                        if (!toDelete.length) {
                            return of({ studentErrs: errs, importedCount, importedRooms });
                        }
                        return from(toDelete).pipe(
                            concatMap(([, recordId]) =>
                                this.thiShiftStudentsService.deleteThiShiftStudents(recordId).pipe(
                                    catchError(() => of(null)),
                                )
                            ),
                            last(),
                            map(() => ({ studentErrs: errs, importedCount, importedRooms })),
                            catchError(() => of({ studentErrs: errs, importedCount, importedRooms })),
                        );
                    }),
                );
            }),
        );
    }

    private importRooms$(shiftId: number, syncCathiId: string, shiftName: string, importedRoomsSet: Set<string>, isReimport = false): Observable<{ roomErrs: SyncErrorItem[] }> {
        const rooms = this.cachedRooms.get(syncCathiId) || [];

        // Nếu reimport và ICTU trả rỗng → xóa hết phòng cũ
        if (!rooms.length) {
            if (isReimport) {
                const cond: ConditionOption = {
                    condition: [{ conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: shiftId.toString(), orWhere: 'and' }],
                    set: [{ label: 'limit', value: '-1' }, { label: 'select', value: 'id' }],
                    page: null,
                };
                return this.thiShiftRoomssService.getThiShiftRoomssByPageNew(cond).pipe(
                    switchMap(res => {
                        const ids = res.data.map(r => r.id);
                        if (!ids.length) return of({ roomErrs: [] });
                        return from(ids).pipe(
                            concatMap(recordId => this.thiShiftRoomssService.deleteThiShiftRoomss(recordId).pipe(catchError(() => of(null)))),
                            last(),
                            map(() => ({ roomErrs: [] })),
                        );
                    }),
                    catchError(() => of({ roomErrs: [] })),
                );
            }
            return of({ roomErrs: [] });
        }

        // Only import rooms that have at least 1 student imported
        const roomsToImport = importedRoomsSet.size ? rooms.filter(r => importedRoomsSet.has(r.So_phong)) : rooms;
        if (!roomsToImport.length) {
            return of({ roomErrs: [] });
        }

        // Nếu reimport, load danh sách id+room đã có trong shift
        const existingRoomRecords$ = isReimport
            ? this.thiShiftRoomssService.getThiShiftRoomssByPageNew({
                condition: [{ conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: shiftId.toString(), orWhere: 'and' }],
                set: [{ label: 'limit', value: '-1' }, { label: 'select', value: 'id,room' }],
                page: null,
              }).pipe(
                map(res => new Map<string, number>(res.data.map(r => [r.room, r.id]))), // room → record id
                catchError(() => of(new Map<string, number>())),
              )
            : of(new Map<string, number>());

        return existingRoomRecords$.pipe(
            concatMap(existingRoomRecords => {
                const existingRoomNames = new Set(existingRoomRecords.keys());
                this.syncStepCurrent = 0;
                this.syncStepTotal = roomsToImport.length;

                const errs: SyncErrorItem[] = [];
                const processedRooms = new Set<string>();

                return from(roomsToImport).pipe(
                    concatMap((room) => {
                        this.syncStepCurrent++;
                        processedRooms.add(room.So_phong);
                        // Nếu phòng đã có → bỏ qua
                        if (isReimport && existingRoomNames.has(room.So_phong)) {
                            return of(null);
                        }
                        return this.importOneRoom$(room, shiftId, shiftName, errs);
                    }),
                    last(),
                    concatMap(() => {
                        // Reimport: xóa phòng đã có trong DB nhưng không còn trong dữ liệu ICTU
                        if (!isReimport || !existingRoomRecords.size) {
                            return of({ roomErrs: errs });
                        }
                        const toDelete = [...existingRoomRecords.entries()].filter(([room]) => !processedRooms.has(room));
                        if (!toDelete.length) {
                            return of({ roomErrs: errs });
                        }
                        return from(toDelete).pipe(
                            concatMap(([, recordId]) =>
                                this.thiShiftRoomssService.deleteThiShiftRoomss(recordId).pipe(
                                    catchError(() => of(null)),
                                )
                            ),
                            last(),
                            map(() => ({ roomErrs: errs })),
                            catchError(() => of({ roomErrs: errs })),
                        );
                    }),
                );
            }),
        );
    }

    private preCheckTeachers$(rooms: CathiRoomNV[], shiftName: string): SyncErrorItem[] {
        const errs: SyncErrorItem[] = [];
        for (const r of rooms) {
            if (r.Ma_cb_coi_thi1) {
                const p1 = this.lookupTeacher(r.Ma_cb_coi_thi1, r.Email_coi_thi1);
                if (!p1?.user_id) {
                    const name = r.Giao_vien_coi_thi1 || r.Ma_cb_coi_thi1;
                    errs.push({ type: 'teacher', tenCb: name, soPhong: r.So_phong, tenCaThi: shiftName, message: `CB "${name}" ở phòng "${r.So_phong}" chưa có trên hệ thống DTKH` });
                }
            }
            if (r.Ma_cb_coi_thi2) {
                const p2 = this.lookupTeacher(r.Ma_cb_coi_thi2, r.Email_coi_thi2);
                if (!p2?.user_id) {
                    const name = r.Giao_vien_coi_thi2 || r.Ma_cb_coi_thi2;
                    errs.push({ type: 'teacher', tenCb: name, soPhong: r.So_phong, tenCaThi: shiftName, message: `CB "${name}" ở phòng "${r.So_phong}" chưa có trên hệ thống DTKH` });
                }
            }
        }
        return errs;
    }

    private importOneRoom$(room: CathiRoomNV, shiftId: number, shiftName: string, errs: SyncErrorItem[]): Observable<any> {
        const cbIds: number[] = [];

        if (room.Ma_cb_coi_thi1) {
            const p1 = this.lookupTeacher(room.Ma_cb_coi_thi1, room.Email_coi_thi1);
            if (p1?.user_id) cbIds.push(p1.user_id);
            else {
                const name = room.Giao_vien_coi_thi1 || room.Ma_cb_coi_thi1;
                errs.push({
                    type: 'teacher',
                    tenCb: name,
                    soPhong: room.So_phong,
                    tenCaThi: shiftName,
                    message: `Cán bộ coi thi "${name}" ở phòng "${room.So_phong}" chưa có trên hệ thống DTKH (ca thi: "${shiftName}")`,
                });
            }
        }

        if (room.Ma_cb_coi_thi2) {
            const p2 = this.lookupTeacher(room.Ma_cb_coi_thi2, room.Email_coi_thi2);
            if (p2?.user_id) cbIds.push(p2.user_id);
            else {
                const name = room.Giao_vien_coi_thi2 || room.Ma_cb_coi_thi2;
                errs.push({
                    type: 'teacher',
                    tenCb: name,
                    soPhong: room.So_phong,
                    tenCaThi: shiftName,
                    message: `Cán bộ coi thi "${name}" ở phòng "${room.So_phong}" chưa có trên hệ thống DTKH (ca thi: "${shiftName}")`,
                });
            }
        }

        // Chỉ import phòng nếu có ít nhất 1 giảng viên
        if (!cbIds.length) {
            return of(null);
        }

        const roomData = {
            shift_id: shiftId,
            room: room.So_phong,
            canbo_coithi_ids: cbIds,
            pass_of_room: this.generatePasscode(),
        };
        return this.thiShiftRoomssService.addThiShiftRoomss(roomData).pipe(
            map(() => null),
            catchError(() => of(null)),
        );
    }

    private lookupTeacher(maCb: string, email: string): ElngUserProfile | undefined {
        if (maCb) {
            const p = this.teacherCodeMap.get(maCb.trim().toLowerCase());
            if (p) return p;
        }
        if (email) {
            return this.teacherEmailMap.get(email.trim().toLowerCase());
        }
        return undefined;
    }

    private generatePasscode(): string {
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += Math.floor(Math.random() * 10).toString();
        }
        return code;
    }

    // ===== Detail preview =====
    openDetail(cathi: CathiNV): void {
        this.detailCathi = cathi;
        this.detailStudents = [];
        this.detailRooms = [];
        this.loadingDetail = true;
        this.selectedRoom = null;

        forkJoin({
            students: this.thiShiftsService.dongBoCaThiIctuDetail(cathi.ID_thi).pipe(
                catchError(() => of([] as CathiDetailNV[])),
            ),
            rooms: this.thiShiftsService.dongBoPhongthiIctuDetail(cathi.ID_thi).pipe(
                catchError(() => of([] as CathiRoomNV[])),
            ),
        }).subscribe({
            next: (result) => {
                // Guard: ensure data is array
                const rawStudents = Array.isArray(result.students) ? result.students : [];
                const rawRooms = Array.isArray(result.rooms) ? result.rooms : [];

                if (!rawStudents.length && !rawRooms.length) {
                    this.loadingDetail = false;
                    this.profileLoading = false;
                    // Even with no detail data, still allow viewing empty layout
                    this.notificationService.toastWarning('Ca thi không có dữ liệu sinh viên/phòng thi');
                    return;
                }

                const allStudentCodes = new Set<string>();
                const allTeacherCodes = new Set<string>();
                const allTeacherEmails = new Set<string>();

                rawStudents.forEach(sv => { if (sv.Ma_sv) allStudentCodes.add(sv.Ma_sv.trim().toLowerCase()); });
                rawRooms.forEach(r => {
                    if (r.Ma_cb_coi_thi1) allTeacherCodes.add(r.Ma_cb_coi_thi1.trim().toLowerCase());
                    if (r.Ma_cb_coi_thi2) allTeacherCodes.add(r.Ma_cb_coi_thi2.trim().toLowerCase());
                    if (r.Email_coi_thi1) allTeacherEmails.add(r.Email_coi_thi1.trim().toLowerCase());
                    if (r.Email_coi_thi2) allTeacherEmails.add(r.Email_coi_thi2.trim().toLowerCase());
                });

                // Setup profile progress
                const totalProfiles = allStudentCodes.size + allTeacherCodes.size + allTeacherEmails.size;
                this.profileLoading = true;
                this.profileLoadedCount = 0;
                this.profileTotal = totalProfiles;
                this.profileLoadingText = 'Đang kiểm tra thông tin người dùng trong hệ thống...';

                // Batch load profiles into maps, then fill detail
                const loadCalls: Observable<any>[] = [];
                if (allStudentCodes.size) {
                    loadCalls.push(this.batchLoadProfiles$([...allStudentCodes], 'student_code').pipe(
                        tap((profiles: ElngUserProfile[]) => profiles.forEach(p => {
                            if (p.student_code) this.studentCodeMap.set(p.student_code.trim().toLowerCase(), p);
                        })),
                    ));
                }
                if (allTeacherCodes.size) {
                    loadCalls.push(this.batchLoadProfiles$([...allTeacherCodes], 'student_code').pipe(
                        tap((profiles: ElngUserProfile[]) => profiles.forEach(p => {
                            if (p.student_code) this.teacherCodeMap.set(p.student_code.trim().toLowerCase(), p);
                        })),
                    ));
                }
                if (allTeacherEmails.size) {
                    loadCalls.push(this.batchLoadProfiles$([...allTeacherEmails], 'user__email').pipe(
                        tap((profiles: ElngUserProfile[]) => profiles.forEach(p => {
                            const email = (p.user?.email || '').trim().toLowerCase();
                            if (email) this.teacherEmailMap.set(email, p);
                        })),
                    ));
                }

                forkJoin(loadCalls).subscribe({
                    next: () => {
                        this.loadingDetail = false;
                        this.profileLoading = false;
                        // Sort students by So_bao_danh as number
                        const sortedStudents = [...rawStudents].sort((a, b) => {
                            const sbdA = parseInt((a.So_bao_danh || '').trim(), 10) || 0;
                            const sbdB = parseInt((b.So_bao_danh || '').trim(), 10) || 0;
                            return sbdA - sbdB;
                        });
                        this.detailStudents = sortedStudents.map(sv => ({
                            ...sv,
                            So_phong: (sv.So_phong || '').trim(), // trim So_phong for reliable matching
                            existsInSystem: !!this.studentCodeMap.get((sv.Ma_sv || '').trim().toLowerCase()),
                        }));
                        this.detailRooms = rawRooms.map(r => {
                            const p1 = this.lookupTeacher(r.Ma_cb_coi_thi1, r.Email_coi_thi1);
                            const p2 = this.lookupTeacher(r.Ma_cb_coi_thi2, r.Email_coi_thi2);
                            return {
                                ...r,
                                So_phong: (r.So_phong || '').trim(),
                                cb1Exists: !!p1?.user_id,
                                cb2Exists: !!p2?.user_id,
                                cb1SystemName: p1 ? (p1.full_name || p1.name || '') : '',
                                cb2SystemName: p2 ? (p2.full_name || p2.name || '') : '',
                            };
                        });
                        this.updateDetailComputed();
                    },
                    error: () => {
                        // Fallback: show data even if profile loading fails
                        this.loadingDetail = false;
                        this.profileLoading = false;
                        // Sort students by So_bao_danh as number
                        const sortedStudents = [...rawStudents].sort((a, b) => {
                            const sbdA = parseInt((a.So_bao_danh || '').trim(), 10) || 0;
                            const sbdB = parseInt((b.So_bao_danh || '').trim(), 10) || 0;
                            return sbdA - sbdB;
                        });
                        this.detailStudents = sortedStudents.map(sv => ({
                            ...sv,
                            So_phong: (sv.So_phong || '').trim(),
                            existsInSystem: false,
                        }));
                        this.detailRooms = rawRooms.map(r => ({
                            ...r,
                            So_phong: (r.So_phong || '').trim(),
                            cb1Exists: false,
                            cb2Exists: false,
                            cb1SystemName: '',
                            cb2SystemName: '',
                        }));
                        this.updateDetailComputed();
                        this.notificationService.toastWarning('Không thể kiểm tra trạng thái người dùng, hiển thị dữ liệu gốc');
                    },
                });
            },
            error: () => {
                this.loadingDetail = false;
                this.profileLoading = false;
                this.notificationService.toastError('Lỗi tải chi tiết ca thi');
            },
        });
    }

    closeDetail(): void {
        this.detailCathi = null;
        this.detailStudents = [];
        this.detailRooms = [];
        this.selectedRoom = null;
        this.updateDetailComputed();
    }

    selectRoom(room: string): void {
        this.selectedRoom = this.selectedRoom === room ? null : room;
        this.updateFilteredStudents();
    }

    private fuzzyMatchTracNghiem(text: string): boolean {
        const s = this.removeVietnameseAccent(text.toLowerCase().trim());
        const keyword = this.removeVietnameseAccent('trac nghiem');
        return s.includes(keyword);
    }

    private removeVietnameseAccent(str: string): string {
        const accented: Record<string, string> = {
            'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
            'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
            'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
            'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
            'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
            'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
            'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
            'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
            'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
            'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
            'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
            'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
            'đ': 'd',
        };
        return str.replace(/[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/g, ch => accented[ch] || ch);
    }

    close(): void {
        this.onSyncSuccess.emit();
        this.onClose.emit();
    }
}