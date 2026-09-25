import { readImportFile } from '../../read-import-file';
import { HvuApiDanhsachlichgiangday, HvuApiDanhsachlichgiangdayService } from './../../../../../shared/services/hvu-api-danhsachlichgiangday.service';
import { CalendarService } from '@shared/services/calendar.service';
import { data } from 'autoprefixer';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import * as XLSX from 'xlsx';
import { catchError, delay, firstValueFrom, forkJoin, isEmpty, mergeMap, Observable, of, pipe } from 'rxjs';
import { saveAs } from 'file-saver';
import { HelperService } from '@core/services/helper.service';
import { ClassCalendar } from '@modules/shared/models/class-calendar';
import { FileService } from '@core/services/file.service';
import { SharedModule } from '@modules/shared/shared.module';
import { CheckboxModule } from 'primeng/checkbox';
import { PaginatorModule } from 'primeng/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { AuthService } from '@core/services/auth.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ClassesService } from '@modules/shared/services/classes.service';
import { UserService } from '@core/services/user.service';
import { Calendar } from '@modules/shared/models/calendar';
import { OvicQueryCondition } from '@core/models/dto';
import { MatMenuModule } from '@angular/material/menu';
import { InputMaskModule } from 'primeng/inputmask';

export interface Calendar_Import extends Calendar {
    teacher_name?: string;
    ma_giangvien?: string;
    class_kyhieu?: string;
    name_giangvien?: string;
    status_import?: number;
}

export interface Calendar_sync extends HvuApiDanhsachlichgiangday {
    ngay: string;
    tuan: number;
}

@Component({
    selector: 'app-import-lichhoc',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        CheckboxModule,
        PaginatorModule,
        MatProgressBarModule,
        DialogModule,
        TableModule,
        MatMenuModule,
        InputMaskModule
    ],
    templateUrl: './import-lichhoc.component.html',
    styleUrls: ['./import-lichhoc.component.css']
})
export class ImportLichhocComponent implements OnInit {
    @ViewChild('inputImport') inputImport: ElementRef;

    list_lichhoc: Calendar_Import[] = [];

    ghi_de: boolean = false;

    search_lichhoc: string;

    status_import_filter: number;

    status_object = {
        no_import: 0,
        import_done: 0,
        import_fail: 0,
        no_teacher: 0,
        no_class: 0,
    }

    pageImport: number = 0;

    progressValue: number = 0;

    displayModal: boolean = false;

    waitting_title: string;

    displaySyncCalendar: boolean = false;

    calendarFilter: { namhoc: number; hocky: number } = {
        namhoc: null,
        hocky: null,
    }

    constructor(
        private router: Router,
        private notificationService: NotificationService,
        private helperService: HelperService,
        private fileService: FileService,
        private auth: AuthService,
        private classesService: ClassesService,
        private userService: UserService,
        private calendarService: CalendarService,
        private hvuApiDanhsachlichgiangdayService: HvuApiDanhsachlichgiangdayService
    ) { }

    ngOnInit(): void {
        this.auth.setFeatureSecondary("Đồng bộ dữ liệu - Lịch học");
    }

    onChangePageImport(event) {
        this.pageImport = event.page;
    }


    getStatusObject() {
        this.status_object = {
            no_import: this.list_lichhoc.filter(m => m['status_import'] === 0).length,
            import_done: this.list_lichhoc.filter(m => m['status_import'] === 1).length,
            import_fail: this.list_lichhoc.filter(m => m['status_import'] === -1).length,
            no_teacher: this.list_lichhoc.filter(m => m['status_import'] === -2).length,
            no_class: this.list_lichhoc.filter(m => m['status_import'] === -3).length,
        }
    }

    backToDongbo() {
        const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
        const url = this.router.serializeUrl(
            this.router.createUrlTree(['admin/' + activeLink])
        );
        this.router.navigateByUrl(url);
    }

    downLoadExLichHoc() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_hvu\\Mau 08 - Import TKB.xlsx').subscribe(res => {
            saveAs(res, 'Mau 08 - Import TKB.xlsx');
        });
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
                    const data_calendar = [];
                    let date_match = null;

                    const request_giangvien: Observable<any>[] = [];

                    const request_lophoc: Observable<any>[] = [];

                    let array_gv = [];

                    let array_lh = [];

                    wb.SheetNames.forEach((f, key) => {
                        const wsname: string = wb.SheetNames[key];
                        const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        data.forEach(d => {
                            if (d[0]) {
                                const regex_Date = /^([^\d\-]+(?:\s*\d+)?)\s*-\s*[^\d\-]*\s*(\d+)\s*-\s*[^\d]*\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
                                const regex_number = /\d+/;
                                if (regex_Date.test(d[0].toString().trim()) === true) {
                                    date_match = d[0].toString().trim().match(regex_Date);
                                } else {
                                    if (regex_number.test(d[0].toString().trim()) === true && date_match && date_match.length) {
                                        const rawThu = date_match[1].trim().toLowerCase();
                                        const tuan = parseInt(date_match[2]);
                                        const ngay = /\d{2}/.test(date_match[3]) ? date_match[3] : '0'.concat(date_match[3]);
                                        const thang = /\d{2}/.test(date_match[4]) ? date_match[4] : '0'.concat(date_match[4]);
                                        const nam = date_match[5];

                                        let thu: string | number;

                                        if (rawThu.includes("cn") || rawThu.includes("ch")) thu = "8";
                                        else {
                                            const num = rawThu.match(/\d+/);
                                            thu = num ? parseInt(num[0]) : "??";
                                        }

                                        const tiet = [];

                                        if (d[4]) {
                                            d[4].trim().split("").forEach((t, key) => {
                                                if (regex_number.test(t)) {
                                                    tiet.push(key + 1);
                                                }
                                            })
                                        }

                                        let name_giangvien: string = null;

                                        let ma_giangvien: string = null;

                                        if (d[5]) {
                                            name_giangvien = d[5].trim().replace(/\(([^)]+)\)/g, '').trim();
                                            ma_giangvien = d[5].trim().replace(/^([^(]+)/g, '').replace(/\(|\)/gi, "").trim();
                                        }

                                        if (name_giangvien) {
                                            const arr_ma_gangvien = ma_giangvien.split(",").filter(m => m && m !== '');
                                            name_giangvien.split(",").filter(m => m && m !== '').forEach((l, key) => {
                                                if (l && arr_ma_gangvien[key]) {
                                                    const calendar = {
                                                        ngay: nam.toString().concat("-", thang.toString(), "-", ngay.toString()),
                                                        thu: parseInt(thu.toString()),
                                                        tuan: tuan,
                                                        diadiem: d[2] ? d[2].trim() : null,
                                                        tiet: tiet.length > 0 ? tiet.toString() : null,
                                                        name_giangvien: l ? l.trim() : null,
                                                        ma_giangvien: arr_ma_gangvien[key].trim(),
                                                        teacher_ids: null,
                                                        class_id: null,
                                                        class_name: null,
                                                        class_kyhieu: d[10] ? this.removeNhom(d[10]).replace(/\s+/g, '').toUpperCase() : null,
                                                        status_import: 0
                                                    }

                                                    if (calendar.ma_giangvien)
                                                        array_gv.push(calendar.ma_giangvien);

                                                    if (calendar.class_kyhieu)
                                                        array_lh.push(calendar.class_kyhieu);

                                                    data_calendar.push(calendar);
                                                }
                                            })
                                        }
                                    }
                                }
                            }
                        })
                    })

                    array_gv = [... new Set(array_gv)];

                    array_lh = [... new Set(array_lh)];

                    this.chunkArray(array_gv, 100).forEach(f => {
                        const condition_gv: ConditionOption = {
                            condition: [],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: f.toString() },
                                { label: 'include_by', value: 'username' }
                            ],
                            page: null
                        }
                        request_giangvien.push(this.userService.getUserByPageNew(condition_gv))
                    })

                    this.chunkArray(array_lh, 100).forEach(f => {
                        const condition_lh: ConditionOption = {
                            condition: [],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: f.toString() },
                                { label: 'include_by', value: 'kyhieu' }
                            ],
                            page: null
                        }

                        request_lophoc.push(this.classesService.getClassesByPageNew(condition_lh))
                    })

                    if (request_giangvien.length) {
                        this.displayModal = true;
                        this.progressValue = 0;
                        this.waitting_title = "Đang lấy dữ liệu giảng viên, vui lòng không tắt trình duyệt (1/2)";
                        this.loopGetClass(request_giangvien, 0, []).subscribe({
                            next: (_res_gv) => {
                                if (request_lophoc.length) {
                                    this.progressValue = 0;
                                    this.waitting_title = "Đang lấy dữ liệu lớp học, vui lòng không tắt trình duyệt (2/2)";
                                    this.loopGetClass(request_lophoc, 0, []).subscribe({
                                        next: (_res_class) => {
                                            data_calendar.forEach(f => {
                                                const index = _res_gv.findIndex(m => m.username.toLowerCase() === f.ma_giangvien.toLowerCase());
                                                if (index !== -1) {
                                                    f['teacher_ids'] = '|'.concat(_res_gv[index].id.toString(), '|');
                                                    const index_class = _res_class.findIndex(m => m.kyhieu.toLowerCase() === f.class_kyhieu.toLowerCase());
                                                    if (index_class !== -1) {
                                                        f['class_id'] = _res_class[index_class].id;
                                                        f['class_name'] = _res_class[index_class].name;
                                                    } else {
                                                        f['status_import'] = -3;
                                                    }
                                                } else {
                                                    f['status_import'] = -2;
                                                }
                                            })

                                            this.displayModal = false;

                                            this.convertDataToSql(data_calendar);
                                        },
                                        error: () => {
                                            this.displayModal = false;
                                        }
                                    })
                                } else {
                                    this.displayModal = false;
                                }
                            },
                            error: (e) => {
                                console.log(e);
                                this.displayModal = false;
                            }
                        })
                    }
                });
            } else {
                this.notificationService.toastWarning("Sai định dạng file, yêu cầu file .xlsx. Vui lòng tải file mẫu danh sách import lịch học");
            }
        }
    }

    loopGetClass(_request: Observable<any>[], key, data: any[]): Observable<any> {
        this.progressValue = (key + 1) / _request.length * 100;
        return _request[key].pipe(
            mergeMap(_res => {
                data = data.concat(_res.data);
                if (_request[key + 1]) {
                    return this.loopGetClass(_request, key + 1, data);
                } else {
                    return of(data)
                }
            }))
    }

    loopAddLichhoc(key: number, group_obs: Observable<any>[][]): Observable<any> {
        this.progressValue = (key + 1) / group_obs.length * 100;
        return forkJoin(group_obs[key]).pipe(
            mergeMap(_res => {
                if (group_obs[key + 1] && group_obs[key + 1].length) {
                    return this.loopAddLichhoc(key + 1, group_obs);
                } else {
                    return of(null)
                }
            }))
    }

    chunkArray<T>(array: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }


    removeNhom(text: string): string {

        const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const result = normalized.replace(/\bnhom\b\s*/gi, '');

        return result;
    }

    convertDataToSql(data) {
        const lich_: Calendar_Import[] = [];
        data.forEach(f => {
            lich_.push({
                class_id: f.class_id,
                tuan: f.tuan,
                ngay: f.ngay,
                thu: f.thu,
                tiet: f.tiet,
                diadiem: f.diadiem,
                class_name: f.class_name ? f.class_name : f.class_kyhieu,
                teacher_ids: f.teacher_ids,
                teacher_name: f.name_giangvien ? f.name_giangvien.concat(" (", f.ma_giangvien, ")") : 'Không tìm thấy '.concat("(", f.ma_giangvien, ")"),
                status_import: f.status_import
            })
        })

        this.list_lichhoc = lich_;

        this.getStatusObject();
    }

    async startImportLichHoc() {

        const request: Observable<any>[][] = [];

        let i = 0;

        request[i] = [];

        this.list_lichhoc.forEach(f => {
            if (f['status_import'] !== -3 && f['status_import'] !== -2) {
                const data = {
                    class_id: f.class_id,
                    tuan: f.tuan,
                    ngay: f.ngay,
                    thu: f.thu,
                    tiet: f.tiet,
                    diadiem: f.diadiem,
                    class_name: f.class_name,
                    teacher_ids: f.teacher_ids,
                }

                const condition_calendar: ConditionOption = {
                    condition: [
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: data.class_id.toString(), orWhere: 'and' },
                        { conditionName: 'tuan', condition: OvicQueryCondition.equal, value: data.tuan.toString(), orWhere: 'and' },
                        { conditionName: 'ngay', condition: OvicQueryCondition.equal, value: data.ngay.toString(), orWhere: 'and' },
                        { conditionName: 'thu', condition: OvicQueryCondition.equal, value: data.thu.toString(), orWhere: 'and' },
                        { conditionName: 'tiet', condition: OvicQueryCondition.equal, value: data.tiet.toString(), orWhere: 'and' },
                        { conditionName: 'teacher_ids', condition: OvicQueryCondition.equal, value: data.teacher_ids.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                if (request[i].length < 6) {
                    request[i].push(this.calendarService.getCalendarByPageNew(condition_calendar).pipe(mergeMap(_a => {
                        if (_a.recordsFiltered === 0) {
                            return this.calendarService.addCalendar(data).pipe(catchError(() => {
                                f.status_import = -1;
                                return of(null)
                            }), mergeMap(a => {
                                if (a) {
                                    f.status_import = 1;
                                }
                                return of(null)
                            }))
                        } else {
                            f.status_import = 1;
                            return of(null);
                        }
                    })))
                } else {
                    i = i + 1;

                    request[i] = [];

                    request[i].push(this.calendarService.getCalendarByPageNew(condition_calendar).pipe(mergeMap(_a => {
                        if (_a.recordsFiltered === 0) {
                            return this.calendarService.addCalendar(data).pipe(catchError(() => {
                                f.status_import = -1;
                                return of(null)
                            }), mergeMap(a => {
                                if (a) {
                                    f.status_import = 1;
                                }
                                return of(null)
                            }))
                        } else {
                            f.status_import = 1;
                            return of(null);
                        }
                    })))
                }
            }
        })

        if (request.length) {

            this.displayModal = true;

            this.progressValue = 0;

            this.waitting_title = "Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt";

            if (this.ghi_de) {
                const clear = await firstValueFrom(this.calendarService.deleteCalendarFormTomorow())
            }

            this.loopAddLichhoc(0, request).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.getStatusObject();
                    this.notificationService.toastSuccess("Import thành công");

                },
                error: () => {
                    this.displayModal = false;
                    this.notificationService.toastSuccess("Import thất bại");
                }
            })
        }
    }

    startGetCalendarFromDkSys() {
        if (this.calendarFilter.namhoc && this.calendarFilter.hocky) {
            this.notificationService.isProcessing(true);
            this.hvuApiDanhsachlichgiangdayService.getHvuApiDanhsachlichgiangdayBybody({ nhhk: parseInt(this.calendarFilter.namhoc.toString().concat(this.calendarFilter.hocky.toString())) }).subscribe({
                next: (_sync_calendar) => {
                    const data = _sync_calendar.filter(m => parseInt(m.thu) !== 0 && m.ngay_giang_day && m.tuan_hoc && m.ma_giang_vien && m.giang_duong && m.tiet);
                    const convert_calendar: Calendar_sync[] = this.parseSchedules(data);
                    this.getTeacherAndClass(convert_calendar);

                    // array_gv = [... new Set(array_gv)];

                    // array_lh = [... new Set(array_lh)];

                    // console.log(array_gv);
                    // console.log(array_lh);
                    // console.log(data_calendar);
                    this.notificationService.isProcessing(false);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Lấy dữ liệu thất bại, vui lòng thử lại");
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng điền đầy đủ thông tin có dấu *")
        }
    }

    parseSchedules(data: HvuApiDanhsachlichgiangday[]): Calendar_sync[] {
        const result: Calendar_sync[] = [];

        data.forEach(item => {
            const { startDate, endDate } = this.getDateRange(item.ngay_giang_day);

            const tuanHoc = item.tuan_hoc;

            // tìm tuần đầu tiên có học
            const firstIndex = tuanHoc.search(/[0-9]/);
            if (firstIndex === -1) return;

            // tìm ngày đúng thứ
            const firstDate = this.getFirstDateByThu(
                startDate,
                endDate,
                Number(item.thu)
            );

            for (let i = 0; i < tuanHoc.length; i++) {
                const char = tuanHoc[i];

                if (!isNaN(Number(char))) {
                    const week = i + 1;

                    const date = new Date(firstDate);
                    date.setDate(date.getDate() + (i - firstIndex) * 7);

                    result.push({
                        ...item,
                        ngay: this.formatDate(date),
                        tuan: week
                    });
                }
            }
        });

        // sort theo ngày cho đẹp
        return result.sort(
            (a, b) => this.parseDate(a.ngay).getTime() - this.parseDate(b.ngay).getTime()
        );
    }

    getDateRange(range: string) {
        const [startStr, endStr] = range.split("đến").map(s => s.trim());

        return {
            startDate: this.parseDate(startStr),
            endDate: this.parseDate(endStr)
        };
    }

    parseDate(str: string): Date {
        const [day, month, year] = str.split("/").map(Number);
        return new Date(2000 + year, month - 1, day);
    }

    getFirstDateByThu(start: Date, end: Date, thu: number): Date {
        const jsThu = this.convertThuToJS(thu);

        const d = new Date(start);

        while (d <= end) {
            if (d.getDay() === jsThu) {
                return new Date(d);
            }
            d.setDate(d.getDate() + 1);
        }
        return new Date(start);
    }

    convertThuToJS(thu: number): number {
        if (thu === 8) return 0;
        return thu - 1;
    }

    formatDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    getTeacherAndClass(convert_calendar: Calendar_sync[]) {
        const request_giangvien: Observable<any>[] = [];

        const request_lophoc: Observable<any>[] = [];

        const data_calendar: Calendar_Import[] = [];

        let array_gv = [];

        let array_lh = [];

        convert_calendar.forEach(f => {
            const nam = this.calendarFilter.namhoc.toString().slice(2, 4);
            const calendar: Calendar_Import = {
                ngay: f.ngay,
                thu: parseInt(f.thu).toString(),
                tuan: f.tuan,
                diadiem: f.giang_duong,
                tiet: f.tiet,
                name_giangvien: '',
                ma_giangvien: f.ma_giang_vien,
                teacher_ids: null,
                class_id: null,
                class_name: null,
                class_kyhieu: nam.concat(this.calendarFilter.hocky.toString(), '-', f.ma_mon_hoc, '-', f.nhom_to),
                status_import: 0
            }


            if (calendar.ma_giangvien)
                array_gv.push(calendar.ma_giangvien);

            if (calendar.class_kyhieu)
                array_lh.push(calendar.class_kyhieu);

            data_calendar.push(calendar);
        })

        array_gv = [... new Set(array_gv)];

        array_lh = [... new Set(array_lh)];

        this.chunkArray(array_gv, 100).forEach(f => {
            const condition_gv: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: f.toString() },
                    { label: 'include_by', value: 'username' }
                ],
                page: null
            }
            request_giangvien.push(this.userService.getUserByPageNew(condition_gv))
        })

        this.chunkArray(array_lh, 100).forEach(f => {
            const condition_lh: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: f.toString() },
                    { label: 'include_by', value: 'kyhieu' }
                ],
                page: null
            }
            request_lophoc.push(this.classesService.getClassesByPageNew(condition_lh))
        })

        this.displaySyncCalendar = false;

        if (request_giangvien.length) {
            this.displayModal = true;
            this.progressValue = 0;
            this.waitting_title = "Đang lấy dữ liệu giảng viên, vui lòng không tắt trình duyệt (1/2)";
            this.loopGetClass(request_giangvien, 0, []).subscribe({
                next: (_res_gv) => {
                    if (request_lophoc.length) {
                        this.progressValue = 0;
                        this.waitting_title = "Đang lấy dữ liệu lớp học, vui lòng không tắt trình duyệt (2/2)";
                        this.loopGetClass(request_lophoc, 0, []).subscribe({
                            next: (_res_class) => {
                                data_calendar.forEach(f => {
                                    const index = _res_gv.findIndex(m => m.username.toLowerCase() === f.ma_giangvien.toLowerCase());
                                    if (index !== -1) {
                                        f['name_giangvien'] = _res_gv[index].display_name;
                                        f['teacher_ids'] = '|'.concat(_res_gv[index].id.toString(), '|');
                                        const index_class = _res_class.findIndex(m => m.kyhieu.toLowerCase() === f.class_kyhieu.toLowerCase());
                                        if (index_class !== -1) {
                                            f['class_id'] = _res_class[index_class].id;
                                            f['class_name'] = _res_class[index_class].name;
                                        } else {
                                            f['status_import'] = -3;
                                        }
                                    } else {
                                        f['status_import'] = -2;
                                    }
                                })

                                this.displayModal = false;
                                this.convertDataToSql(data_calendar);
                            },
                            error: () => {
                                this.displayModal = false;
                            }
                        })
                    } else {
                        this.displayModal = false;
                    }
                },
                error: (e) => {
                    console.log(e);
                    this.displayModal = false;
                }
            })
        } else {
            this.notificationService.toastWarning("Không tìm thấy giảng viên nào")
        }
    }
}
