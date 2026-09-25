import { readImportFile } from '../../read-import-file';
import { OvicDateTimeService } from '@shared/services/ovic-date-time.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { SharedModule } from '@modules/shared/shared.module';
import { Router } from '@angular/router';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import * as XLSX from 'xlsx';
import { catchError, concatMap, forkJoin, from, map, mergeMap, Observable, of } from 'rxjs';
import { saveAs } from 'file-saver';
import { Calendar } from '@modules/shared/models/calendar';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ClassesService } from '@modules/shared/services/classes.service';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { CalendarService } from '@modules/shared/services/calendar.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '@core/services/user.service';
import { User } from '@core/models/user';
import { NORMAL_MODAL_OPTIONS, ROLES } from '@modules/shared/utils/syscat';

@Component({
    selector: 'app-import-lichhoc',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        MatProgressBarModule,
        TableModule,
        PaginatorModule,
        CheckboxModule
    ],
    templateUrl: './import-lichhoc.component.html',
    styleUrls: ['./import-lichhoc.component.css']
})
export class ImportLichhocComponent implements OnInit {
    @ViewChild('inputImport') inputImport: ElementRef;
    @ViewChild('templateSyncIctu') templateSyncIctu: any;

    status_object = {
        no_import: 0,
        import_done: 0,
        import_fail: 0,
        no_teacher: 0,
        no_class: 0
    }

    status_import_filter: number;

    ghi_de: boolean = false;

    waitting_title: string = "Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt...";

    progressValue: number = 0;

    displayModal: boolean = false;

    pageImport: number = 0;

    list_lichhoc: any[] = [];

    search_lichhoc: string;

    show_return: boolean = false;

    import_return: number = 0;

    /** Đồng bộ từ API ICTU */
    syncYear: string;
    syncSemester: number;
    syncDot: string;
    syncYears: { label: string, value: string }[] = [];

    /** Cache giảng viên để map MaGV → user.id */
    list_teacher: User[] = [];

    /** Dữ liệu export excel lỗi */
    missingClasses: { stt: number; maLop: string; tenLop: string }[] = [];
    missingTeachers: { stt: number; maGV: string; tenGV: string; tenLop: string }[] = [];
    ictuSynced: boolean = false;

    constructor(
        private auth: AuthService,
        private router: Router,
        private notificationService: NotificationService,
        private helperService: HelperService,
        private fileService: FileService,
        private classesService: ClassesService,
        private dateService: OvicDateTimeService,
        private calendarService: CalendarService,
        private userService: UserService,
        private modalService: NgbModal
    ) { }

    ngOnInit(): void {
        this.auth.setFeatureSecondary("Đồng bộ dữ liệu - Lịch học");
        this.initLoad();
        this.generateSyncYears();
    }

    private generateSyncYears() {
        const y = new Date().getFullYear();
        this.syncYears = [];
        for (let i = y - 3; i <= y + 1; i++) {
            const label = `${i}-${i + 1}`;
            this.syncYears.push({ label, value: label });
        }
    }

    private initLoad() {
        // Không cần load teacher ở đây nữa — load ngay trước sync
    }

    getStatusObject() {
        this.status_object = {
            no_import: this.list_lichhoc.filter(m => m['status_import'] === 0).length,
            import_done: this.list_lichhoc.filter(m => m['status_import'] === 1).length,
            import_fail: this.list_lichhoc.filter(m => m['status_import'] === -1).length,
            no_teacher: this.list_lichhoc.filter(m => m['status_import'] === -2).length,
            no_class: this.list_lichhoc.filter(m => m['status_import'] === -3).length
        }
    }

    onChangePageImport(event) {
        this.pageImport = event.page;
    }

    backToDongbo() {
        const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
        const url = this.router.serializeUrl(
            this.router.createUrlTree(['admin/' + activeLink])
        );
        this.router.navigateByUrl(url);
    }

    downLoadExLichHoc() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 08 - Import dư lieu lich giang day cua giang vien.xlsx').subscribe(res => {
            saveAs(res, 'Mau 08 - Import dư lieu lich giang day cua giang vien.xlsx');
        });
    }

    /** Mở modal đồng bộ ICTU */
    openSyncModal() {
        this.syncYear = null;
        this.syncSemester = null;
        this.syncDot = null;
        this.modalService.open(this.templateSyncIctu, NORMAL_MODAL_OPTIONS);
    }

    /** Gọi API ICTU + convert → list_lichhoc */
    syncFromIctu(d: any) {
        if (!this.syncYear || !this.syncSemester) {
            this.notificationService.toastWarning("Vui lòng nhập năm học và học kỳ");
            return;
        }
        d(true);
        this.displayModal = true;
        this.progressValue = 0;
        this.waitting_title = "Đang tải danh sách giảng viên...";
        this.show_return = false;

        // Load teacher trước, rồi mới gọi API lịch học
        const roleATeacher = this.auth.roles.find((r: any) => r.name === ROLES.giangvien);
        const ids_roles = [];
        if (this.auth.roles && this.auth.roles.length) {
            this.auth.roles.forEach((r: any) => ids_roles.push(r.id || r));
        }
        const condition: ConditionOption = {
            condition: [{ conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'role_ids', value: roleATeacher ? roleATeacher['id'].toString() : ids_roles.toString() }
            ],
            page: null
        };
        this.userService.getUserByPageNew(condition).pipe(
            concatMap((res) => {
                this.list_teacher = res.data || [];
                this.waitting_title = "Đang tải dữ liệu lịch học từ ICTU...";
                this.progressValue = 0;
                return this.classesService.getCalendarByIctu(this.syncYear, this.syncSemester, this.syncDot || '');
            })
        ).subscribe({
            next: (ictuData) => {
                console.log(ictuData.filter(m=>m.IDlophp === 52921 ));
                if (!ictuData || !ictuData.length) {
                    this.displayModal = false;
                    this.notificationService.toastWarning("Không có dữ liệu từ ICTU");
                    return;
                }
                this.waitting_title = "Đang tra cứu thông tin lớp học...";
                this.progressValue = 0;
                this.syncCalendarInBatches(ictuData);
            },
            error: () => {
                this.displayModal = false;
                this.notificationService.toastError("Lỗi kết nối ICTU, vui lòng thử lại");
            }
        });
    }

    /** Batch lookup class theo slug, concatMap tuần tự, cập nhật progress % */
    private syncCalendarInBatches(ictuData: any[]) {
        // Gom slug unique từ dữ liệu ICTU
        const slugSet = new Set<string>();
        ictuData.forEach((item: any) => {
            const slug = this.helperService.slugVietnamese(item.Tenlophp || '');
            if (slug) slugSet.add(slug);
        });
        const slugArr = Array.from(slugSet);
        const batchSize = 20;
        const batches: string[][] = [];
        for (let i = 0; i < slugArr.length; i += batchSize) {
            batches.push(slugArr.slice(i, i + batchSize));
        }

        const classMap = new Map<string, any>();

        if (!batches.length) {
            this.finishSyncCalendar(ictuData, classMap);
            return;
        }

        from(batches).pipe(
            concatMap((batch: string[]) => {
                const option: ConditionOption = {
                    condition: [{ conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }],
                    set: [
                        { label: "include", value: batch.toString() },
                        { label: "include_by", value: "slug" },
                        { label: "limit", value: "-1" }
                    ],
                    page: null
                };
                return this.classesService.getClassesByPageNew(option).pipe(
                    catchError(() => of({ data: [] })),
                    map((res: any) => {
                        if (res?.data) {
                            res.data.forEach((c: any) => {
                                if (c.slug) classMap.set(c.slug, c);
                            });
                        }
                        this.progressValue = Math.min((batches.indexOf(batch) + 1) / batches.length * 100, 100);
                        return classMap;
                    })
                );
            })
        ).subscribe({
            complete: () => {
                this.finishSyncCalendar(ictuData, classMap);
            }
        });
    }

    /** Convert CALENDAR_ICTU[] → list_lichhoc items */
    private finishSyncCalendar(ictuData: any[], classMap: Map<string, any>) {
        const calendars: any[] = [];
        this.missingClasses = [];
        this.missingTeachers = [];
        this.ictuSynced = true;

        ictuData.forEach((item: any) => {
            const slug = this.helperService.slugVietnamese(item.Tenlophp || '');
            const classInfo = slug ? classMap.get(slug) : null;

            // Parse ngày
            let ngay = null;
            let thu = '';
            try {
                const d = new Date(item.Ngaygiangday);
                if (!isNaN(d.getTime())) {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    ngay = `${y}-${m}-${day}`;
                    const jsDay = d.getDay(); // 0=CN, 1=2, ..., 6=7
                    thu = jsDay === 0 ? '8' : (jsDay + 1).toString();
                }
            } catch { /* ignore */ }

            // Parse tiết
            const tietStart = Number(item.Tietbatdau) || 1;
            const tietEnd = Number(item.Tietketthuc) || tietStart;
            const tietArr: number[] = [];
            for (let t = tietStart; t <= tietEnd; t++) tietArr.push(t);
            const tietStr = tietArr.join(',');

            // Map teacher
            let teacher_ids: string | null = null;
            // Cách 1: tìm user.username === MaGV (không phân biệt hoa/thường)
            if (item.MaGV && this.list_teacher.length) {
                const maGvClean = item.MaGV.toString().trim();
                const teacher = this.list_teacher.find((u: any) => u.username.toLowerCase() === maGvClean.toLowerCase());
                if (teacher) teacher_ids = `|${teacher.id}|`;
            }
            // Cách 2: fallback manager_ids từ class
            if (!teacher_ids && classInfo?.manager_ids) {
                teacher_ids = classInfo.manager_ids;
            }

            // Gom dữ liệu lỗi để export
            if (!classInfo) {
                this.missingClasses.push({
                    stt: this.missingClasses.length + 1,
                    maLop: item.MaLopHP || '',
                    tenLop: item.Tenlophp || ''
                });
            } else if (!teacher_ids && item.MaGV) {
                // Chỉ thêm vào missingTeachers khi: có lớp học (classInfo) + không tìm thấy teacher
                // AND (không tìm thấy qua MaGV) AND (không tìm thấy qua manager_ids)
                const foundByMaGV = item.MaGV && this.list_teacher.some((u: any) => u.username.toLowerCase() === item.MaGV.toString().trim().toLowerCase());
                const foundByManager = classInfo?.manager_ids;
                if (!foundByMaGV && !foundByManager) {
                    this.missingTeachers.push({
                        stt: this.missingTeachers.length + 1,
                        maGV: item.MaGV || '',
                        tenGV: item.Hotengv || '',
                        tenLop: item.Tenlophp || ''
                    });
                }
            }

            let teacher_str = '';
            if (classInfo?.manager_info) {
                classInfo.manager_info.split(",").forEach((f: string) => {
                    if (f && f !== '') teacher_str = teacher_str.concat('<span class="tag-user-name">', f, '</span>');
                });
            }
            if (!teacher_str && item.Hotengv) {
                teacher_str = item.Hotengv;
            }

            const calendar: any = {
                class_id: classInfo?.id || 0,
                tuan: item.Tuanthu || '',
                ngay: ngay,
                thu: thu,
                tiet: tietStr,
                diadiem: item.Giangduong || '',
                class_name_slug: slug,
                status_import: 0,
                date_vn: ngay || '',
                class_name: item.Tenlophp || '',
                group: 1,
                sotc: classInfo?.sotinchi || '0',
                teacher_ids: teacher_ids,
                teachers: teacher_str,
            };
            if (!teacher_ids) {
                calendar.status_import = classInfo ? -2 : -3;
            }

            calendars.push(calendar);
        });

        this.displayModal = false;
        this.list_lichhoc = calendars;
        this.getStatusObject();
        this.notificationService.toastSuccess(`Đã tải ${calendars.length} lịch học từ ICTU`);
    }

    /** Export excel danh sách lỗi */
    exportErrorExcel() {
        if (!this.missingClasses.length && !this.missingTeachers.length) {
            this.notificationService.toastWarning("Không có dữ liệu lỗi để export");
            return;
        }

        const wb = XLSX.utils.book_new();

        if (this.missingClasses.length) {
            const wsData = [['STT', 'Mã lớp học', 'Tên lớp học']];
            this.missingClasses.forEach(f => {
                wsData.push([f.stt.toString(), f.maLop, f.tenLop]);
            });
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Lớp học không có trên hệ thống');
        }

        if (this.missingTeachers.length) {
            const wsData = [['STT', 'Mã giảng viên', 'Tên giảng viên', 'Tên lớp học']];
            this.missingTeachers.forEach(f => {
                wsData.push([f.stt.toString(), f.maGV, f.tenGV, f.tenLop]);
            });
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, 'Giảng viên chưa có trên hệ thống');
        }

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, `Loi_import_lich_hoc_${this.syncYear}_HK${this.syncSemester}.xlsx`);
    }

    triggerImport() {
        this.inputImport.nativeElement.value = '';
        this.list_lichhoc = [];
        this.inputImport.nativeElement.click();
    }

    changeInputImport(event) {
        if (event.target.files[0]) {
            const file = event.target.files[0];
            if (this.helperService.checkTypeFile(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'], file.type)) {
                readImportFile(file, this.notificationService, 'arrayBuffer', (localUrl) => {
                    const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'binary' });
                    const wsname: string = wb.SheetNames[0];
                    const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                    let data_new = [];
                    wb.SheetNames.forEach((f, key) => {
                        const wsname: string = wb.SheetNames[key];
                        const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        const t = data.filter(m => (m[1] && m[2] && m[3] && m[4] && m[5] && m[0]) || (m[1] && m[1].toLowerCase().indexOf('tuần:') !== -1));
                        t.splice(0, 1);
                        t.forEach(ft => {
                            ft['group'] = key + 1;
                        })
                        data_new = data_new.concat(t);
                    })
                    this.convertDataToSql(data_new);
                });
            } else {
                this.notificationService.toastWarning("Sai định dạng file, yêu cầu file .xlsx. Vui lòng tải file mẫu danh sách import lịch học");
            }
        }
    }

    convertDateToDateSql(date: string, day: string): string {
        let result = null;
        try {
            const object_date_plus = {
                '2': 0,
                '3': 1,
                '4': 2,
                '5': 3,
                '6': 4,
                '7': 5,
                '8': 6,
            }

            const arr = date.replace(/\D/g, '||').split('||')
            const d_start = arr[2].concat("-", arr[1], "-", arr[0]);
            const d = new Date(d_start);
            result = new Date(d_start);
            result.setDate(d.getDate() + object_date_plus[day]);
            return this.helperService.strToSQLDate(result);
        } catch (error) {
            return result;
        }
    }

    convertDataToSql(data) {
        let tuan = null;
        let ngaybatdau = null;
        const calendars: Calendar[] = [];
        const arr_slug = [];
        let i = 0;
        arr_slug[i] = [];
        data.forEach(f => {
            if (f[1].toString().toLowerCase().indexOf('tuần:') !== -1) {
                const arr = f[1].replace(/\:|\(|\)/g, '||').split('||').filter(m => m);
                tuan = arr[1].trim();
                ngaybatdau = arr[2].trim().split(" ")[0];
            } else {
                const ngay = this.convertDateToDateSql(ngaybatdau.toString().trim(), f[3].toString().trim());
                const date_vn = new Date(ngay);
                const name_slug = f[1].toString().trim().replace(/\.TH[0-9]\)/gi, _res => {
                    return ')';
                })
                const calendar = {
                    class_id: 0,
                    tuan: tuan,
                    ngay: ngay,
                    thu: f[3].toString().trim(),
                    tiet: f[4].toString().trim(),
                    diadiem: f[5].toString().trim(),
                    class_name_slug: this.helperService.slugVietnamese(f[1].toString().trim()),
                    status_import: 0,
                    date_vn: date_vn.toLocaleString("en-GB").split(",")[0],
                    class_name: f[1].toString().trim(),
                    group: f['group'],
                    sotc: f[2].toString().trim(),
                    teacher_ids: null,
                }
                if (arr_slug[i].length < 20) {
                    arr_slug[i].push(calendar.class_name_slug);
                } else {
                    i = i + 1;
                    arr_slug[i] = [];
                    arr_slug[i].push(calendar.class_name_slug)
                }
                calendars.push({ ...calendar });
            }
        })
        this.displayModal = true;
        this.progressValue = 0;
        this.waitting_title = 'Đang lấy dữ liệu lớp học, vui lòng không tắt trình duyệt.';
        this.show_return = false;

        const request: Observable<any>[] = [];

        arr_slug.forEach(f => {
            const option: ConditionOption = {
                condition: [{ conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }],
                set: [
                    { label: "include", value: f.toString() },
                    { label: "include_by", value: "slug" },
                    { label: "limit", value: "-1" }
                ],
                page: null
            }
            request.push(this.classesService.getClassesByPageNew(option).pipe(mergeMap(_class => {
                calendars.forEach(f => {
                    if (!f.class_id) {
                        const index = _class.data.findIndex(m => m.slug === f.class_name_slug);
                        if (index !== -1) {
                            f.class_id = _class.data[index].id;
                            let teacher_str = '';
                            if (_class.data[index].manager_info) {
                                _class.data[index].manager_info.split(",").forEach(f => {
                                    if (f && f !== '')
                                        teacher_str = teacher_str.concat('<span class="tag-user-name">', f, '</span>')
                                })
                            }
                            f['teachers'] = teacher_str;
                            f['teacher_ids'] = _class.data[index].manager_ids;
                        }
                    }
                })
                return of(null);
            })))
        })

        if (request.length) {

            this.loopGetClass(request, 0).subscribe({
                next: () => {
                    calendars.forEach(f => {
                        if (!f.class_id) {
                            const index = calendars.findIndex(m => m.group === f.group && m.class_id);
                            if (index !== -1) {
                                f['teachers'] = calendars[index]['teachers'];
                                f['teacher_ids'] = calendars[index].teacher_ids;
                            }
                        }

                        if (!f['teacher_ids']) {
                            f['status_import'] = -2;
                        }
                    })
                    this.displayModal = false;
                    this.list_lichhoc = calendars;
                    this.getStatusObject();
                },
                error: (e) => {
                    console.log(e);
                    this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                }
            })
        }
    }


    loopGetClass(_request: Observable<any>[], key): Observable<any> {
        this.progressValue = (key + 1) / _request.length * 100;
        return _request[key].pipe(
            mergeMap(_res => {
                if (_request[key + 1]) {
                    return this.loopGetClass(_request, key + 1);
                } else {
                    return of(null)
                }
            }))
    }

    startImportLichHoc() {
        if (this.list_lichhoc) {
            this.notificationService.confirm('Bạn có chắc chắn bắt đầu '.concat(!this.ghi_de ? 'Import?' : 'Ghi đè?'), 'Xác nhận', [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.progressValue = 0;
                    this.displayModal = true;
                    this.import_return = 0;
                    this.waitting_title = "Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt";
                    const data = this.list_lichhoc.filter(m => m['teacher_ids'] && m['teacher_ids'] !== '');
                    const data_import = [];
                    let i = 0;
                    data_import[0] = [];
                    data.forEach(f => {
                        if (data_import[i].length < 20) {
                            data_import[i].push(f);
                        } else {
                            i = i + 1;
                            data_import[i] = [];
                            data_import[i].push(f);
                        }
                    })

                    if (this.ghi_de) {
                        forkJoin([
                            this.dateService.getCurrentDateTime(),
                            this.fileService.getFileLocalAsBlob("..\\assets\\json\\lich_giang_day.json")
                        ]).subscribe({
                            next: ([datetime, _res]) => {
                                const reader = new FileReader();
                                reader.readAsText(_res);
                                reader.onloadend = (event) => {
                                    const localUrl = reader.result;
                                    const json = JSON.parse(localUrl.toString());
                                    const today = new Date(datetime);
                                    const date_he = new Date(today.getFullYear().toString().concat('-04-15'));
                                    const date_dong = new Date(today.getFullYear().toString().concat('-10-15'));
                                    let key_lich_giangday = "15_4";
                                    if (today >= date_dong || today <= date_he) {
                                        key_lich_giangday = "15_10";
                                    }
                                    const tiet_ = [];
                                    Object.keys(json[key_lich_giangday]).forEach(f => {
                                        const arh = f.split("h");
                                        if (Number(arh[0]) < today.getHours()) {
                                            tiet_.push(json[key_lich_giangday][f]);
                                        } else if (Number(arh[0]) === today.getHours() && Number(arh[1]) <= today.getMinutes()) {
                                            tiet_.push(json[key_lich_giangday][f]);
                                        }
                                    })

                                    const date_filter = today.getFullYear().toString().concat("-", (today.getMonth() + 1).toString(), "-", today.getDate().toString());
                                    let nextDay = new Date(datetime);
                                    nextDay.setDate(today.getDate() + 1);
                                    const date_filter_next = nextDay.getFullYear().toString().concat("-", (nextDay.getMonth() + 1).toString(), "-", nextDay.getDate().toString());

                                    const option_clalendar: ConditionOption = {
                                        condition: [{ conditionName: 'ngay', condition: OvicQueryCondition.equal, value: date_filter, orWhere: 'and' }],
                                        set: [{ label: 'limit', value: '-1' }],
                                        page: null
                                    }
                                    const data_ids = [];

                                    this.calendarService.getCalendarByPageNew(option_clalendar).subscribe({
                                        next: (_resCalendar) => {
                                            const data_calendar_ids = [];
                                            _resCalendar.data.forEach(f => {
                                                const tiet_ar = f.tiet.split(",");
                                                const index = tiet_ar.findIndex(m => tiet_.findIndex(i => i.toString() === m.toString()) !== -1);
                                                if (index === -1) {
                                                    data_calendar_ids.push(f.id);
                                                }
                                            })
                                            this.waitting_title = "Đang lấy lịch chưa thực hiện tính từ thời điểm hiện tại trở đi, vui lòng không tắt trình duyệt";
                                            this.loopGetCalendarForDelete(data_ids, 1, 1000, date_filter_next, data_calendar_ids, data_import);
                                        },

                                        error: () => {
                                            this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                                            this.progressValue = 0;
                                            this.displayModal = false;
                                        }
                                    })

                                };
                            },
                            error: () => {
                                this.progressValue = 0;
                                this.displayModal = false;
                                this.notificationService.toastError("Không tải được lịch giảng dạy, vui lòng thử lại");
                            }
                        })
                    } else {
                        this.show_return = true;
                        this.waitting_title = "Đang tạo lịch, vui lòng không tắt trình duyệt";
                        this.loopAddCalendar(data_import[0], data_import, 0);
                    }


                }
            })
        } else {
            this.notificationService.toastWarning("Không có bản ghi nào cần import");
        }
    }

    loopGetCalendarForDelete(data_id: any[], page: number, count: number, date: string, data_id_today: any[], data_import) {
        if (data_id.length < count) {
            this.progressValue = (data_id.length) / count * 100;
            const option_clalendar: ConditionOption = {
                condition: [{ conditionName: 'ngay', condition: OvicQueryCondition.greaterThanToEqualsTo, value: date, orWhere: 'and' }],
                set: [
                    { value: 'limit', label: '200' }
                ],
                page: page.toString(),
            }
            this.calendarService.getCalendarByPageNew(option_clalendar).subscribe({
                next: (_res) => {
                    _res.data.forEach(f => {
                        data_id.push(f.id)
                    })
                    this.loopGetCalendarForDelete(data_id, page + 1, _res.recordsFiltered, date, data_id_today, data_import);
                },
                error: () => {
                    this.loopGetCalendarForDelete(data_id, page, count, date, data_id_today, data_import);
                }
            })
        } else {
            this.progressValue = 0;
            this.waitting_title = "Đang xóa lịch chưa thực hiện tính từ thời điểm hiện tại trở đi, vui lòng không tắt trình duyệt";
            const data = data_id.concat(data_id_today);
            const data_ = [];
            let i = 0;
            data_[i] = [];
            data.forEach(f => {
                if (data_[i].length < 100) {
                    data_[i].push(f);
                } else {
                    i = i + 1;
                    data_[i] = [];
                    data_[i].push(f);
                }
            })
            this.loopDeleteCalendar(data_[0], data_, 0, data_import);
        }
    }

    loopDeleteCalendar(data, datas, key, data_import) {
        if (key < datas.length) {
            this.progressValue = (key + 1) / datas.length * 100;
            if (data.length) {
                this.calendarService.deleteCalendar(data.toString()).subscribe({
                    next: () => {
                        this.loopDeleteCalendar(datas[key + 1], datas, key + 1, data_import);
                    },
                    error: () => {
                        this.loopDeleteCalendar(datas[key + 1], datas, key + 1, data_import);
                    }
                })
            } else {
                this.loopDeleteCalendar(datas[key + 1], datas, key + 1, data_import);
            }
        } else {
            this.progressValue = 0;
            this.waitting_title = "Đang thêm lịch, vui lòng không tắt trình duyệt";
            this.loopAddCalendar(data_import[0], data_import, 0);;
        }
    }

    loopAddCalendar(data: any[], datas: any[], key: number) {
        if (key < datas.length) {
            this.import_return = this.import_return + data.length;
            this.progressValue = (key + 1) / datas.length * 100;
            const require: Observable<any>[] = [];
            data.forEach(f => {
                const calendar: Calendar = {
                    class_id: f.class_id,
                    tuan: f.tuan,
                    ngay: f.ngay,
                    thu: f.thu,
                    tiet: f.tiet,
                    diadiem: f.diadiem,
                    teacher_ids: f.teacher_ids,
                    class_name: f.class_name,
                    sotc: f.sotc,
                }

                if (f.teacher_ids) {
                    const condition: ConditionOption = {
                        condition: [
                            { conditionName: 'tiet', condition: OvicQueryCondition.equal, value: calendar.tiet },
                            { conditionName: 'ngay', condition: OvicQueryCondition.equal, value: calendar.ngay },
                            { conditionName: 'teacher_ids', condition: OvicQueryCondition.equal, value: calendar.teacher_ids },
                            { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: calendar.class_id.toString() }
                        ],
                        set: [{ label: 'limit', value: '-1' }],
                        page: null
                    }
                    require.push(this.calendarService.getCalendarByPageNew(condition).pipe(
                        catchError(() => {
                            f.status_import = -1;
                            return of(f)
                        }),
                        mergeMap(_res => {
                            if (!_res.data.length) {
                                return this.calendarService.addCalendar(calendar).pipe(
                                    catchError(() => {
                                        f.status_import = -1;
                                        return of(f)
                                    }),
                                    mergeMap(_res => {
                                        f.status_import = 1;
                                        return of(f);
                                    })
                                )
                            }
                            return of(f);
                        })))
                }
            })

            if (require.length) {
                forkJoin(require).subscribe({
                    next: () => {
                        this.loopAddCalendar(datas[key + 1], datas, key + 1);
                    },
                    error: () => {
                        this.loopAddCalendar(datas[key + 1], datas, key + 1);
                    }
                })
            } else {
                this.loopAddCalendar(datas[key + 1], datas, key + 1);
            }
        } else {
            this.displayModal = false;
            this.getStatusObject();
            this.notificationService.toastSuccess("Cập nhật thành công");
        }
    }
}
