import { readImportFile } from '../read-import-file';
import { group } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NumberValueAccessor, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { OvicQueryCondition } from '@core/models/dto';
import { Role } from '@core/models/role';
import { User } from '@core/models/user';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';
import { RoleService } from '@core/services/role.service';
import { UserService } from '@core/services/user.service';
import { NORMAL_MODAL_OPTIONS } from '@core/utils/syscat';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { Calendar } from '@modules/shared/models/calendar';
import { ClassStudent } from '@modules/shared/models/class-student';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { STATUS_COUNT_KEY } from '@modules/shared/models/status-import';
import { CalendarService } from '@modules/shared/services/calendar.service';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnBaiHocService } from '@modules/shared/services/elearning-bai-hoc.service';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ExportExcelNewService } from '@modules/shared/services/export-excel-new.service';
import { ExportExcelService } from '@modules/shared/services/export-excel.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { SharedModule } from '@modules/shared/shared.module';
import { KEY_ANSWER_new, LARGE_MODAL_OPTIONS, MAXIMIZE_MODAL_OPTIONS, ROLES, STATUS_IMPORT, STATUS_IMPORT_CLASS, STATUS_IMPORT_STUDENT_CLASS, STATUS_IMPORT_USER } from '@modules/shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { saveAs } from 'file-saver'
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { Observable, catchError, forkJoin, map, mergeMap, of, pipe } from 'rxjs';
import { FileService } from 'src/app/core/services/file.service';
import * as XLSX from 'xlsx';
import { StepsModule } from 'primeng/steps';
import { ImportMonhocComponent } from '../import-ictu/import-monhoc/import-monhoc.component';
import { APP_CONFIGS } from '@env';

export interface data_sinhvienImport {
    index_: number;
    display_name: string;
    email: string;
    username: string;
    password: string;
    phone: string;
    donvi_id: number;
    status: number;
    role_ids: string[];
    user_id: number;
    full_name: string;
    full_name_slug: string;
    name: string;
    birthday: string;
    gender: string;
    student_code: string;
    tenlop_quanly: string;
    khoadaotao: string;
    category_name: string;
    import: boolean;
    import_label: 'Thành công' | 'Thất bại' | 'Đã có' | 'Trùng lặp' | 'Chưa import';
    duplicate: string;
    teacher: number;
}

export interface data_lophoc {
    index_: number;
    name: string;
    mahp: string;
    kyhieu: string;
    sotinchi: string;
    slug: string;
    status: number;
    manager_ids: number[];
    manager_info: string;
    khoa: string;
    dothoc: number;
    sosv_dangky: number;
    image: any;
    hocky: string;
    namhoc: string;
    email: string;
    mahp_slug: string;
    name_giaovien: string;
    khoa_bomon: string;
    import: boolean;
    import_label: string;
    duplicate: string;
}

@Component({
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        CheckboxModule,
        DialogModule,
        PaginatorModule,
        MatProgressBarModule,
        TableModule,
        StepsModule,
        ImportMonhocComponent
    ],
    selector: 'app-dongbo-dulieu-ictu',
    templateUrl: './dongbo-dulieu-ictu.component.html',
    styleUrls: ['./dongbo-dulieu-ictu.component.css'],
})

export class DongboDulieuIctuComponent implements OnInit {
    @ViewChild('inputImport') inputImport: ElementRef;
    @ViewChild('importSinhVienTemplate') importSinhVienTemplate: ElementRef;
    @ViewChild('templateWaiting') templateWaiting: ElementRef;
    @ViewChild('importLopHocTemplate') importLopHocTemplate: ElementRef;
    @ViewChild('templateChooseExcel') templateChooseExcel: ElementRef;
    @ViewChild('templateExportMaLop') templateExportMaLop: ElementRef;
    @ViewChild('importSinhvienLopHocTemplate') importSinhvienLopHocTemplate: ElementRef;
    @ViewChild('importTKBTemplate') importTKBTemplate: ElementRef;
    @ViewChild('importMonhocTemplate') importMonhocTemplate: ElementRef;
    @ViewChild('importTeacherTemplate') importTeacherTemplate: ElementRef;
    @ViewChild('importLopHocCalendarTemplate') importLopHocCalendarTemplate: ElementRef;

    keyAnswer = KEY_ANSWER_new;
    inputImportValue: any;
    type_action: 'sinhvien' | 'lophoc' | 'sinhvien_lophoc' | 'calendar' | 'monhoc' | 'cbgv';
    startProgress = false;
    progressValue = 0;
    duplicateStudent: any[];
    list_userImport: any[];
    slide_title: string;
    cols_sinhvien: any[];
    cols_lophop: any[];
    cols_sinhvien_lophoc: any[];
    cols_calendar: any[];
    cols_monhoc: any[];
    cols_giangvien: any[];
    cols_class_calendar: any[];
    STATUS_IMPORT = STATUS_IMPORT;
    STATUS_IMPORT_STUDENT_CLASS = STATUS_IMPORT_STUDENT_CLASS;
    STATUS_IMPORT_USER = STATUS_IMPORT_USER;
    STATUS_IMPORT_CLASS = STATUS_IMPORT_CLASS;
    ghi_de = false;
    displayModal = false;
    list_lopImport: any[] = [];
    list_calendarImport: any[];
    arrayYear = [];
    selectedYear: string;
    objectFilter = {};
    listHocky = [];
    listNamhoc = [];
    list_student_class = [];
    list_monhoc = [];
    list_giangvien = [];
    waitting_title = 'Vui lòng không tắt trình duyệt';
    show_return = true;
    import_return = 0;
    action = 'import'; // delete
    select_class_calendar: any;
    list_class_calendar: any[];
    open_step = false;
    step_menu = [
        { label: 'Đồng bộ lớp học' },
        { label: 'Đồng bộ lịch học' },
    ];
    activeIndex_step: number;
    show_count_status: STATUS_COUNT_KEY;
    search_class: string;
    select_key_status: any;
    col_filter = [];

    calendar_import_count = {
        failed: 0
    }

    ghide_calendar = false;
    _info_hocky = {
        hocky: null,
        namhoc: null
    }


    objectRoles = {};
    constructor(
        private fileService: FileService,
        private helperService: HelperService,
        private userService: UserService,
        private elngUserProfileService: ElngUserProfileService,
        private noitifi: NotificationService,
        private modalService: NgbModal,
        private classesService: ClassesService,
        private elnKhoaHocService: ElnKhoaHocService,
        private exportExcelService: ExportExcelService,
        private httpHepler: HttpParamsHeplerService,
        private classStudentService: ClassStudentService,
        private calendarService: CalendarService,
        private dateService: OvicDateTimeService,
        private exportExcelNewService: ExportExcelNewService,
        private donviService: DonViService,
        private auth: AuthService,
        private elnChuyenMucService: ElnChuyenMucService,
        private elnBaiHocService: ElnBaiHocService,
        private roleService: RoleService
    ) {
        // display_name: f[1] ? f[1] : null,
        //     email: f[6] ? f[6].toLowerCase() : null, //this.helperService.convertToSqlServerTime ( f[ 4 ].split ( /.|-/ ).join ( '/' ) ) ,
        //         username: f[5].toLowerCase() ? f[5].toLowerCase() : f[6].toLowerCase(),
        //             password: f[2] ? f[2].trim().replace(/\D/g, '').concat('@Ictu') : null,
        //                 phone: f[4] ? f[4] : f[5],
        this.cols_sinhvien = [
            { label: 'Mã SV', class: 'text-left', key: 'username', width: '200' },
            { label: 'Họ tên', class: 'text-left', key: 'display_name', width: '250' },
            { label: 'Ngày sinh', class: 'text-center', key: 'birthday', width: '150' },
            { label: 'SĐT', class: 'text-left', key: 'phone', width: '150' },
            { label: 'Email', class: 'text-left', key: 'email', width: '300' },
            { label: 'Kháo đào tạo', class: 'text-center', key: 'khoadaotao', width: '150' },
            { label: 'Trạng thái', class: 'text-center', key: 'import_label', width: '150' },
        ];

        this.cols_lophop = [

            { label: 'Mã HP', class: 'text-center', key: 'mahp', width: '100' },
            { label: 'Lớp HP', class: 'text-left', key: 'name', width: '350' },
            { label: 'Khoa / Bộ môn', class: 'text-left', key: 'khoa_bomon', width: '250' },
            { label: 'Khóa', class: 'text-center', key: 'khoa', width: '100' },
            { label: 'Số TC', class: 'text-center', key: 'sotinchi', width: '100' },
            { label: 'Đợt học', class: 'text-center', key: 'dothoc', width: '100' },
            { label: 'Học kỳ', class: 'text-center', key: 'hocky', width: '100' },
            { label: 'Giáo viên', class: 'text-left', key: 'name_giaovien', width: '250' },
            { label: 'Email GV', class: 'text-left', key: 'email', width: '250' },
            { label: 'Trạng thái', class: 'text-center', key: 'import_label', width: '150' },
        ];

        this.cols_sinhvien_lophoc = [
            { label: 'Mã SV', class: 'text-left', key: 'student_code', width: '200' },
            { label: 'Họ tên', class: 'text-left', key: 'full_name', width: '350' },
            { label: 'Ngày sinh', class: 'text-center', key: 'birthday', width: '150' },
            { label: 'Email', class: 'text-left', key: 'email', width: '300' },
            { label: 'Lớp HP', class: 'text-left', key: 'class_name', width: '400' },
            { label: 'Học kỳ', class: 'text-center', key: 'hocky', width: '100' },
            { label: 'Trạng thái', class: 'text-center', key: 'import_label', width: '200' },
        ];

        this.cols_calendar = [
            { label: 'Thứ', class: 'text-center', key: 'thu', width: '80' },
            { label: 'Ngày', class: 'text-center', key: 'date_vn', width: '150' },
            { label: 'Tiết', class: 'text-center', key: 'tiet', width: '150' },
            { label: 'Địa điểm', class: 'text-center', key: 'diadiem', width: '150' },
            { label: 'Giảng viên', class: 'text-left', key: 'teachers', width: '350', innerHTML: true },
            { label: 'Trạng thái', class: 'text-center', key: 'import_label', width: '200' },
        ]

        this.cols_monhoc = [
            { label: 'Tên môn', class: 'text-left', key: 'title', width: '400' },
            { label: 'Mã môn', class: 'text-center', key: 'maso', width: '150' },
            { label: 'Khoa quản lý', class: 'text-left', key: 'ten_khoa', width: '400' },
            { label: 'Bộ môn', class: 'text-left', key: 'ten_nganh_bomon', width: '400' },
            { label: 'Trạng thái', class: 'text-center', key: 'import_label', width: '200' },
        ]

        this.cols_giangvien = [
            { label: 'Họ tên', class: 'text-left', key: 'full_name', width: '250' },
            { label: 'Username', class: 'text-left', key: 'username', width: '200' },
            { label: 'Mật khẩu', class: 'text-left', key: 'password', width: '150' },
            { label: 'Email', class: 'text-left', key: 'email', width: '250' },
            { label: 'Số điện thoại', class: 'text-left', key: 'phone', width: '200' },
            { label: 'Khoa', class: 'text-left', key: 'name_khoa', width: '250' },
            { label: 'Bộ môn', class: 'text-left', key: 'name_bomon', width: '200' },
            { label: 'Google meet', class: 'text-center', key: 'google_meet', width: '150' },
            { label: 'Trạng thái', class: 'text-center', key: 'import_label', width: '150' },
        ]

        this.cols_class_calendar = [
            { label: 'Thứ', class: 'text-center', key: 'thu', width: '80' },
            { label: 'Ngày', class: 'text-center', key: 'date_vn', width: '150' },
            { label: 'Tiết', class: 'text-center', key: 'tiet', width: '150' },
            { label: 'Địa điểm', class: 'text-center', key: 'diadiem', width: '150' },
            { label: 'Giảng viên', class: 'text-left', key: 'teachers', width: '350', innerHTML: true },
            { label: 'Trạng thái', class: 'text-center', key: 'import_label', width: '200' },
        ]
    }



    ngOnInit(): void {
        this.noitifi.isProcessing(true);
        this.downloadRoles();
    }

    downloadRoles() {
        this.objectRoles = {};
        const condition: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: ROLES.student.concat(",", ROLES.giangvien) },
                { label: 'include_by', value: 'name' }
            ],
            page: null
        }
        this.roleService.getRolesByPageNew(condition).subscribe({
            next: (_role) => {
                _role.data.forEach(f => {
                    this.objectRoles[f.name] = f;
                })
                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công");
            }
        })
    }

    downloadEx(name) {
        this.type_action = name;
        switch (this.type_action) {
            case 'sinhvien':
                this.downLoadFileSinhVienEx();
                break;
            case 'lophoc':
                this.downLoadExClass();
                break;
            case 'sinhvien_lophoc':
                this.downLoadExStudent_class();
                break;
            case 'calendar':
                this.downLoadExCalendar();
                break;
            case 'monhoc':
                this.downLoadExMonhoc();
                break;
            case 'cbgv':
                this.downLoadExCBGV();
                break;
            default:
                break;
        }
    }

    export(name) {
        this.type_action = name;
        switch (this.type_action) {
            case 'sinhvien':
                break;
            case 'lophoc':
                break;
            case 'sinhvien_lophoc':
                break;
            case 'monhoc':
                this.openSelectDownloadCourse();
                // this.readyToDownLoadCourse();
                break;
            default:
                break;
        }
    }

    deleteDonwload(name) {
        this.type_action = name;
        this.show_return = false;
        switch (this.type_action) {
            case 'sinhvien':
                break;
            case 'lophoc':
                this.loadNamhocHocky();
                break;
            case 'sinhvien_lophoc':
                this.downLoadExDelete();
                break;
            default:
                break;
        }
    }

    openImport(name) {
        this.type_action = name;
        this.list_userImport = null;
        this.ghi_de = false;
        this.list_lopImport = [];
        this.action = 'import';
        this.list_calendarImport = null;
        this.open_step = false;
        this.ghide_calendar = false;
        this.show_count_status = {
            done: 0,
            failed: 0,
            not_import: 0,
            no_teacher: 0,
            no_category: 0,
            sum_data: 0,
            class_lt: 0,
            class_th: 0,
            exist: 0,
        };
        switch (name) {
            case 'sinhvien':
                this.slide_title = 'Sinh viên - Import sinh viên';
                this.modalService.open(this.importSinhVienTemplate, MAXIMIZE_MODAL_OPTIONS);
                break;
            case 'lophoc':
                this.slide_title = 'Lớp học - Import lớp học phần';
                this.modalService.open(this.importLopHocTemplate, MAXIMIZE_MODAL_OPTIONS)
                break;
            case 'sinhvien_lophoc':
                this.modalService.open(this.importSinhvienLopHocTemplate, MAXIMIZE_MODAL_OPTIONS)
                this.slide_title = 'Lớp học - Import sinh viên vào lớp học phần';
                break;
            case 'calendar':
                // this.modalService.open(this.importLopHocCalendarTemplate, MAXIMIZE_MODAL_OPTIONS);
                // this.slide_title = 'Lơp học và lịch giảng dạy';
                this.modalService.open(this.importTKBTemplate, MAXIMIZE_MODAL_OPTIONS);
                this.slide_title = 'Lịch giảng dạy - Import lịch dảng dạy';
                break;
            case 'monhoc':
                this.slide_title = 'Môn học - Import môn học';
                this.modalService.open(this.importMonhocTemplate, MAXIMIZE_MODAL_OPTIONS);
                break;
            case 'cbgv':
                this.slide_title = 'Cán bộ giảng viên - Import CBGV';
                this.modalService.open(this.importTeacherTemplate, MAXIMIZE_MODAL_OPTIONS);
                break;
            default:
                break;
        }
    }

    openDelete(name) {
        this.type_action = name;
        this.action = 'delete';
        switch (this.type_action) {
            case 'sinhvien':
                break;
            case 'lophoc':
                break;
            case 'sinhvien_lophoc':
                break;
            default:
                break;
        }
    }

    triggerImport() {
        this.inputImportValue = '';
        this.show_count_status = {
            done: 0,
            failed: 0,
            not_import: 0,
            no_teacher: 0,
            no_category: 0,
            sum_data: 0,
            class_lt: 0,
            class_th: 0,
            exist: 0,
        };
        this.inputImport.nativeElement.click();
    }

    downLoadFileSinhVienEx() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 04 - Import tao tai khoan cho sinh vien moi.xlsx').subscribe(res => {
            saveAs(res, 'Mau 04 - Import tao tai khoan cho sinh vien moi.xlsx');
        });
    }

    downLoadExStudent_class() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 07 - Import sinh viên vào nhiều lớp học phần.xlsx').subscribe(res => {
            saveAs(res, 'Mau 07 - Import sinh viên vào nhiều lớp học phần.xlsx');
        });
    }

    downLoadExDelete() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\file_mau_xoa_sinh_vien_khoi_lophp.xlsx').subscribe(res => {
            saveAs(res, 'file_mau_xoa_sinh_vien_khoi_lophp.xlsx');
        });
    }

    downLoadExClass() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 05 - Import danh sach lop hoc phan.xlsx').subscribe(res => {
            saveAs(res, 'Mau 05 - Import danh sach lop hoc phan.xlsx');
        });
    }

    downLoadExCalendar() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 08 - Import dư lieu lich giang day cua giang vien.xlsx').subscribe(res => {
            saveAs(res, 'Mau 08 - Import dư lieu lich giang day cua giang vien.xlsx');
        });
    }

    downLoadExMonhoc() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 03 - 01 Import danh muc Hoc phan (mon hoc).xlsx').subscribe(res => {
            saveAs(res, 'Mau 03 - 01 Import danh muc Hoc phan (mon hoc).xlsx');
        });
    }

    downLoadExCBGV() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 02 - Tao tai khoan giao vien.xlsx').subscribe(res => {
            saveAs(res, 'Mau 02 - Tao tai khoan giao vien.xlsx');
        });
    }

    changeInputImport(event) {
        if (event.target.files[0]) {
            const file = event.target.files[0];
            readImportFile(file, this.noitifi, 'binaryString', (localUrl) => {
                const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'binary' });
                if (this.type_action === 'calendar') {
                    // let data_new = [];
                    // wb.SheetNames.forEach((f, key) => {
                    //     const wsname: string = wb.SheetNames[key];
                    //     const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                    //     const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    //     const t = [];

                    //     let hocky = null;
                    //     let namhoc = null;
                    //     if (data[3] && data[3][0]) {
                    //         const ar_h = data[3][0].replace(/\:/g, '').split(" ");
                    //         hocky = ar_h[2];
                    //         namhoc = ar_h[5];
                    //         this._info_hocky.hocky = hocky;
                    //         this._info_hocky.namhoc = namhoc;
                    //     }


                    //     data.forEach((m, keym) => {
                    //         let check = true;
                    //         for (let i = 1; i < 11; i++) {
                    //             if (!m[i]) {
                    //                 check = false;
                    //             }
                    //         }

                    //         if (check) {
                    //             const key_name = wsname.trim().split("_");
                    //             key_name.splice(key_name.length - 1, 1);
                    //             m['group'] = key_name.join(".").replace(/\W+/g, '.').toLowerCase().trim();
                    //             m['hocky'] = hocky;
                    //             m['namhoc'] = namhoc;
                    //             t.push(m);
                    //         }
                    //     })
                    //     // const t = data.filter(m => (m[1] && m[2] && m[3] && m[4] && m[5] && m[0]) || (m[1] && m[1].toLowerCase().indexOf('tuần:') !== -1));
                    //     t.splice(0, 1);
                    //     // t.forEach(ft => {
                    //     //     ft['group'] = key + 1;
                    //     // })
                    //     data_new = data_new.concat(t);
                    // })
                    // if (this.action === 'import') {
                    //     this.import(this.type_action, data_new);
                    // } else if (this.action === 'delete') {
                    //     this.deleteImport(this.type_action, data_new);
                    // }
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
                    if (this.action === 'import') {
                        this.import(this.type_action, data_new);
                    } else if (this.action === 'delete') {
                        this.deleteImport(this.type_action, data_new);
                    }
                } else if (this.type_action === 'monhoc') {
                    let data_new = [];
                    wb.SheetNames.forEach((f, key) => {
                        const wsname: string = wb.SheetNames[key];
                        const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                        const t = [];
                        data.forEach(m => {
                            if (m[1] && m[3] && m[4]) {
                                t.push([m[0], m[1], m[3], m[4], m[5]])
                            }
                        })
                        t.splice(0, 1);
                        data_new = data_new.concat(t);
                    })
                    if (this.action === 'import') {
                        this.import(this.type_action, data_new);
                    } else if (this.action === 'delete') {
                        this.deleteImport(this.type_action, data_new);
                    }
                } else {
                    const wsname: string = wb.SheetNames[0];
                    const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    if (this.action === 'import') {
                        this.import(this.type_action, data);
                    } else if (this.action === 'delete') {
                        this.deleteImport(this.type_action, data);
                    }
                }
            });
        }
    }

    import(name: 'sinhvien' | 'lophoc' | 'sinhvien_lophoc' | 'calendar' | 'monhoc' | 'cbgv', data) {
        switch (name) {
            case 'sinhvien':
                this.convertToSqlData(data.filter(m => m[1] && m[2] && m[4] && m[5] && m[6] && m[7] && m[11]));
                break;
            case 'lophoc':
                this.convertDataForClass(data);
                break;
            case 'sinhvien_lophoc':
                this.convertDataForStudent(data);
                break;
            case 'calendar':
                //this.convertClassAndCalendar(data);
                this.convertForCalendar(data);
                break;
            case 'monhoc':
                this.convertDataForMonhoc(data);
                break;
            case 'cbgv':
                this.convertSqlToGiangvien(data.filter(m => m[1] && m[2] && m[3] && m[4] && m[5] && m[7]))
                break;
            default:
                break;
        }
    }

    deleteImport(name, data) {
        switch (name) {
            case 'sinhvien':
                // this.convertToSqlData(data.filter(m => m[1] && m[2] && m[4] && m[5] && m[6] && m[7] && m[11]));
                break;
            case 'lophoc':
                // this.convertDataForClass(data);
                break;
            case 'sinhvien_lophoc':
                // this.convertDataForStudent(data);
                this.showModalDeleteStudentClass(data.filter(m => m[0] && m[1] && !isNaN(m[0])));
                break;
            default:
                break;
        }
    }


    showModalDeleteStudentClass(data) {

    }

    /** Import sinh viên */

    convertToSqlData(data) {
        this.fileService.getFileLocalAsBlob("..\\assets\\json\\config.json").subscribe({
            next: (_res) => {
                const reader = new FileReader();
                reader.readAsBinaryString(_res);
                reader.onloadend = (event) => {
                    const localUrl = reader.result;
                    const json = JSON.parse(localUrl.toString());
                    const pass = json['password_after_@'];
                    data.splice(0, 1);
                    const objectDuplicate = {};
                    this.duplicateStudent = [];
                    const user_list: data_sinhvienImport[] = [];
                    data.forEach((f, key) => {
                        if (!objectDuplicate[f[6]]) {
                            objectDuplicate[f[6]] = { ...f };
                        } else {
                            objectDuplicate[f[6]]['duplicate'] = true;
                        }
                        user_list.push(
                            {
                                index_: key + 1,
                                display_name: f[1] ? f[1] : null,
                                email: f[6] ? f[6].toLowerCase() : null, //this.helperService.convertToSqlServerTime ( f[ 4 ].split ( /.|-/ ).join ( '/' ) ) ,
                                username: f[5].toLowerCase() ? f[5].toLowerCase() : f[6].toLowerCase(),
                                password: f[2] ? f[2].trim().replace(/\D/g, '').concat('@', pass) : null,
                                phone: f[4] ? f[4] : f[5],
                                donvi_id: this.auth.user.donvi_id,
                                status: 1,
                                role_ids: [this.objectRoles[ROLES.student].id.toString()],
                                user_id: null,
                                full_name: f[1].trim(),
                                full_name_slug: this.helperService.slugVietnamese(f[1].trim()),
                                name: f[1] ? f[1].trim().split(' ')[f[1].trim().split(' ').length - 1] : null,
                                birthday: f[2] ? f[2].trim().replace(/\D/g, '/') : null,
                                gender: f[3] ? f[3] : null,
                                student_code: f[5] ? f[5].toLowerCase() : null,
                                tenlop_quanly: f[7] ? f[7] : null,
                                khoadaotao: f[11] ? f[11] : null,
                                category_name: f[9] ? f[9] : null,
                                import: false,
                                import_label: objectDuplicate[f[6]]['duplicate'] ? 'Trùng lặp' : 'Chưa import',
                                duplicate: objectDuplicate[f[6]]['duplicate'] ? 'có' : 'không',
                                teacher: 0,
                            }
                        )
                    });
                    this.list_userImport = user_list;
                };
            },
            error: () => {

            }
        })
    }

    onChangeFilterImportDt(event, dt) {
        if (event) {
            if (event.option_label) {
                dt.filterGlobal(event.option_label, 'contains');
            } else {
                dt.filterGlobal(event.label, 'contains');
            }
        } else {
            dt.filterGlobal('', 'contains');
        }

    }

    startImportSinhvien(ghide: number) {
        if (this.list_userImport) {
            this.noitifi.confirm('Bạn có chắc chắn bắt đầu '.concat(!this.ghi_de ? 'Import?' : 'Ghi đè?'), 'Xác nhận', [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.show_return = true;
                    this.progressValue = 0;
                    this.displayModal = true;
                    this.import_return = 0;
                    this.waitting_title = "Đang đồng bộ sinh viên, vui lòng không tắt trình duyệt";
                    const data = [];
                    let i = 0;
                    data[i] = [];
                    this.list_userImport.forEach(f => {
                        if (data[i].length < 10) {
                            data[i].push(f);
                        } else {
                            i = i + 1;
                            data[i] = [];
                            data[i].push(f);
                        }
                    })
                    this.loopImportSinhvien_v2(data[0], data, 0);
                }
            })
        } else {
            this.noitifi.toastWarning("Không có bản ghi nào cần import");
        }
    }

    //new

    loopImportSinhvien_v2(data: data_sinhvienImport[], datas: any[], key) {
        if (key < datas.length) {
            this.import_return = this.import_return + data.length;
            this.progressValue = (key + 1) / datas.length * 100;
            const request: Observable<any>[] = [];
            data.forEach(f => {
                const user = {
                    display_name: f.display_name,
                    email: f.email,
                    username: f.username,
                    password: f.password,
                    phone: f.phone,
                    donvi_id: f.donvi_id,
                    status: f.status,
                    role_ids: f.role_ids
                };

                const userProfile = {
                    user_id: null,
                    full_name: f.full_name,
                    full_name_slug: f.full_name_slug,
                    name: f.name,
                    birthday: f.birthday,
                    gender: f.gender,
                    student_code: f.student_code,
                    tenlop_quanly: f.tenlop_quanly,
                    khoadaotao: f.khoadaotao,
                    category_name: f.category_name,
                    teacher: f.teacher,
                    is_deleted: 0
                };

                request.push(this.userService.getUserByCol('username', user.username).pipe(
                    catchError(() => {
                        f.import = false;
                        f.import_label = "Thất bại";
                        return of(null);
                    }),
                    mergeMap(_user => {
                        if (_user.length) {
                            userProfile.user_id = _user[0].id;
                            return this.elngUserProfileService.getElngUserProfileByItem(userProfile.user_id, "user_id").pipe(
                                catchError(() => {
                                    f.import = false;
                                    f.import_label = "Thất bại";
                                    return of(null);
                                }),
                                mergeMap((_student) => {
                                    if (_student.length) {
                                        if (this.ghi_de) {
                                            delete user.email;
                                            delete user.username;
                                            delete user.phone;
                                            return forkJoin([
                                                this.elngUserProfileService.updateElngUserProfile(_student[0].id, userProfile),
                                                this.userService.updateUserS(userProfile.user_id, user)
                                            ]).pipe(
                                                catchError(() => {
                                                    f.import = false;
                                                    f.import_label = "Thất bại";
                                                    return of(null);
                                                }),
                                                mergeMap(() => {
                                                    f.import = true;
                                                    f.import_label = "Thành công";
                                                    return of(null);
                                                })
                                            )
                                        } else {
                                            f.import = true;
                                            f.import_label = "Đã có";
                                            return of(null);
                                        }
                                    } else {
                                        return this.elngUserProfileService.addElngUserProfile(userProfile).pipe(
                                            catchError(() => {
                                                f.import = false;
                                                f.import_label = "Thất bại";
                                                return of(null);
                                            }),
                                            mergeMap(() => {
                                                f.import = true;
                                                f.import_label = "Thành công";
                                                return of(null);
                                            })
                                        )
                                    }
                                })
                            )
                        } else {
                            return this.userService.creatUser(user).pipe(
                                catchError(() => {
                                    f.import = false;
                                    f.import_label = "Thất bại";
                                    return of(null);
                                }),
                                mergeMap(_user_created => {
                                    if (_user_created) {
                                        userProfile.user_id = _user_created;
                                        return this.elngUserProfileService.addElngUserProfile(userProfile).pipe(
                                            catchError(() => {
                                                f.import = false;
                                                f.import_label = "Thất bại";
                                                return of(null);
                                            }),
                                            mergeMap(() => {
                                                f.import = true;
                                                f.import_label = "Thành công";
                                                return of(null);
                                            }))
                                    } else {
                                        f.import = false;
                                        f.import_label = "Thất bại";
                                        return of(null);
                                    }
                                }))
                        }
                    })
                ))
            })

            if (request.length) {
                forkJoin(request).subscribe({
                    next: () => {
                        this.loopImportSinhvien_v2(datas[key + 1], datas, key + 1);
                    },
                    error: () => {
                        this.loopImportSinhvien_v2(datas[key + 1], datas, key + 1);
                    }
                })
            } else {
                this.loopImportSinhvien_v2(datas[key + 1], datas, key + 1);
            }
        } else {
            this.displayModal = false;
            this.noitifi.toastSuccess("Đã import xong");
        }
    }


    loopImportSinhvien(data: data_sinhvienImport, datas: data_sinhvienImport[], key: number) {
        if (key < datas.length) {
            this.import_return = key + 1;
            this.progressValue = (key + 1) / datas.length * 100;
            const user = {
                display_name: data.display_name,
                email: data.email,
                username: data.username,
                password: data.password,
                phone: data.phone,
                donvi_id: data.donvi_id,
                status: data.status,
                role_ids: data.role_ids
            };

            const userProfile = {
                user_id: null,
                full_name: data.full_name,
                full_name_slug: data.full_name_slug,
                name: data.name,
                birthday: data.birthday,
                gender: data.gender,
                student_code: data.student_code,
                tenlop_quanly: data.tenlop_quanly,
                khoadaotao: data.khoadaotao,
                category_name: data.category_name,
                teacher: data.teacher
            };

            this.userService.getUserByCol('email', user.email).subscribe({
                next: res => {
                    if (res.length) {
                        userProfile.user_id = res[0].id;
                        this.addStudentInUserProfile(userProfile.user_id, userProfile, user, datas, key);
                    } else {
                        this.userService.creatUser(user).subscribe({
                            next: (id) => {
                                userProfile.user_id = id;
                                this.elngUserProfileService.addElngUserProfile(userProfile).subscribe({
                                    next: () => {
                                        datas[key].import = true;
                                        datas[key].import_label = "Thành công";
                                        this.loopImportSinhvien(datas[key + 1], datas, key + 1);
                                    },
                                    error: () => {
                                        datas[key].import_label = "Thất bại";
                                        this.loopImportSinhvien(datas[key + 1], datas, key + 1);
                                    }
                                });
                            },
                            error: () => {
                                datas[key].import_label = "Thất bại";
                                this.loopImportSinhvien(datas[key + 1], datas, key + 1);
                            }
                        });
                    }
                },
                error: () => {
                    datas[key].import_label = "Thất bại";
                    this.loopImportSinhvien(datas[key + 1], datas, key + 1);
                }
            });
        } else {
            this.displayModal = false;
            this.noitifi.toastSuccess("Đã import xong");
        }
    }

    addStudentInUserProfile(userId, userProfile, user, datas: data_sinhvienImport[], key) {
        this.elngUserProfileService.getElngUserProfileByItem(userId, "user_id").subscribe({
            next: _res => {
                if (_res.length) {
                    if (this.ghi_de) {
                        const data = { ...user };
                        delete data.email;
                        delete data.username;
                        delete data.phone;
                        forkJoin([
                            this.elngUserProfileService.updateElngUserProfile(_res[0].id, userProfile),
                            this.userService.updateUserS(userId, data)
                        ]).subscribe({
                            next: () => {
                                datas[key].import = true;
                                datas[key].import_label = "Thành công";
                                this.loopImportSinhvien(datas[key + 1], datas, key + 1);
                            },

                            error: () => {
                                datas[key].import_label = "Thất bại";
                                this.loopImportSinhvien(datas[key + 1], datas, key + 1);
                            }
                        })
                    } else {
                        datas[key].import = true;
                        datas[key].import_label = "Đã có";
                        this.loopImportSinhvien(datas[key + 1], datas, key + 1);
                    }
                } else {
                    this.elngUserProfileService.addElngUserProfile(userProfile).subscribe({
                        next: () => {
                            datas[key].import = true;
                            datas[key].import_label = "Thành công";
                            this.loopImportSinhvien(datas[key + 1], datas, key + 1);
                        },
                        error: () => {
                            datas[key].import_label = "Thất bại";
                            this.loopImportSinhvien(datas[key + 1], datas, key + 1);
                        }
                    });
                }
            },
            error: () => {
                datas[key].import_label = "Thất bại";
                this.loopImportSinhvien(datas[key + 1], datas, key + 1);
            }
        })
    }

    /** end import sinh viên */

    /** Import Lớp học */
    convertDataForClass(data) {
        const lophocphan = [];
        const objectDuplicate = {};
        const newData = data.filter(f => f[1] && f[2] && f[5] && f[6] && f[7] && f[8] && f[9]);
        newData.forEach((f, key) => {
            if (key !== 0 && key !== 1) {
                f[15] = f[15] ? f[15].toLowerCase() : null;
                const mahp = f[1];
                let kyhieu = null;
                if (f[2].trim().indexOf('(') !== -1) {
                    kyhieu = f[2] ? f[2].trim().split("(")[1].replace(")", "") : null;
                    const index = kyhieu.indexOf('TH');
                }
                if (f[10].trim().toLowerCase() === 'lt') {
                    const key_lop = this.helperService.slugVietnamese(f[2]);
                    if (!objectDuplicate[key_lop]) {
                        objectDuplicate[key_lop] = { ...f };
                    } else {
                        objectDuplicate[key_lop]['duplicate'] = true;
                    }

                    const object = {
                        index_: key + 1,
                        name: f[2] ? f[2].trim() : null,
                        mahp: mahp,
                        kyhieu: kyhieu,
                        sotinchi: f[6],
                        slug: this.helperService.slugVietnamese(f[2].trim()),
                        status: 1,
                        manager_ids: null,
                        manager_info: null,
                        khoa: f[5] ? f[5].trim().replace(/\D/gi, '') : '',
                        dothoc: f[7],
                        sosv_dangky: f[9],
                        image: null,
                        hocky: f[8],
                        namhoc: null,
                        email: f[15] ? f[15].trim().toLowerCase() : null,
                        mahp_slug: mahp,
                        name_giaovien: f[3],
                        khoa_bomon: f[4] ? f[4].trim() : null,
                        import: false,
                        import_label: objectDuplicate[key_lop]['duplicate'] ? 'Trùng lặp' : 'Chưa import',
                        duplicate: objectDuplicate[key_lop]['duplicate'] ? 'có' : 'không',
                    }
                    lophocphan.push(object);
                }
            }
        })

        this.list_lopImport = lophocphan;
        // this.addClassFormExcel(lophocphan, emailAr, mahpAr)
    }

    startImportLophoc() {
        if (this.list_lopImport) {
            const today = new Date();
            const year = today.getFullYear();
            const dataYear = [
                { value: Number(year - 1).toString().concat('_', year.toString()) },
                { value: year.toString().concat('_', Number(year + 1).toString()) }
            ]
            this.arrayYear = dataYear;
            this.modalService.open(this.templateChooseExcel, NORMAL_MODAL_OPTIONS);
        } else {
            this.noitifi.toastWarning("Không có bản ghi nào cần import");
        }
    }

    openImportClass(year: string, d) {
        this.selectedYear = year;
        this.noitifi.confirm('Bạn có chắc chắn bắt đầu '.concat(!this.ghi_de ? 'Import?' : 'Ghi đè?'), 'Xác nhận', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                this.show_return = true;
                this.progressValue = 0;
                this.displayModal = true;
                this.import_return = 0;
                this.waitting_title = "Đang đồng bộ lớp học, vui lòng không tắt trình duyệt";
                d(true);
                this.loopImportLophoc(this.list_lopImport[0], this.list_lopImport, 0);
            }
        })
    }


    loopImportLophoc(data: data_lophoc, datas: data_lophoc[], key: number) {
        if (key < datas.length) {
            this.import_return = key + 1;
            this.progressValue = (key + 1) / datas.length * 100;
            const data_class: Classes = {
                name: data.name,
                slug: data.slug,
                course_id: 0,
                course_info: null,
                user_id: 0,
                manager_ids: null,
                manager_info: null,
                status: data.status,
                image: null,
                hocky: data.hocky,
                namhoc: this.selectedYear,
                kyhieu: data.kyhieu,
                sotinchi: data.sotinchi,
                category_id: 0,
                khoa: data.khoa,
                dothoc: data.dothoc,
                sosv_dangky: null,
                link_googlemeet: [],
                nganh_bomon_id: 0
            }
            if (data.kyhieu) {
                if (data.email) {
                    forkJoin([
                        this.userService.getUserByItem(data.email.toString(), 'email'),
                        this.elnKhoaHocService.getElnKhoaHocByColCondition('maso', data.mahp_slug.toString()),
                    ]).subscribe({
                        next: ([_resUser, _resKhoa]) => {
                            if (_resUser[0]) {
                                data_class.manager_ids = '|' + _resUser[0].id + '|';
                                data_class.manager_info = _resUser[0].display_name.concat('*');
                            }

                            if (_resKhoa[0]) {
                                data_class.course_id = _resKhoa[0].id;
                                data_class.nganh_bomon_id = _resKhoa[0].nganh_bomon_id;
                                data_class.category_id = _resKhoa[0].category_ids;
                            }

                            this.classesService.getDataClassesByCol('slug', data.slug).subscribe({
                                next: (_resClass) => {
                                    if (_resClass.length) {
                                        if (this.ghi_de) {
                                            this.classesService.updateDataClasses(_resClass[0].id, data_class).subscribe({
                                                next: () => {
                                                    datas[key].import = true;
                                                    datas[key].import_label = "Thành công";
                                                    this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                                },
                                                error: () => {
                                                    datas[key].import_label = "Thất bại";
                                                    this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                                }
                                            })
                                        } else {
                                            datas[key].import = true;
                                            datas[key].import_label = "Đã có";
                                            this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                        }
                                    } else {
                                        this.classesService.createDataClasses(data_class).subscribe({
                                            next: () => {
                                                datas[key].import = true;
                                                datas[key].import_label = "Thành công";
                                                this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                            },

                                            error: () => {
                                                datas[key].import_label = "Thất bại";
                                                this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                            }
                                        })
                                    }
                                },
                                error: () => {
                                    datas[key].import_label = "Thất bại";
                                    this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                }
                            })

                        },
                        error: () => {
                            datas[key].import_label = "Thất bại";
                            this.loopImportLophoc(datas[key + 1], datas, key + 1);
                        }
                    })
                } else {
                    this.elnKhoaHocService.getElnKhoaHocByColCondition('maso', data.mahp_slug.toString()).subscribe({
                        next: (_resKhoa) => {
                            if (_resKhoa[0]) {
                                data_class.course_id = _resKhoa[0].id;
                                data_class.nganh_bomon_id = _resKhoa[0].nganh_bomon_id;
                                data_class.category_id = _resKhoa[0].category_ids;
                            }

                            this.classesService.getDataClassesByCol('slug', data.slug).subscribe({
                                next: (_resClass) => {
                                    if (_resClass.length) {
                                        if (this.ghi_de) {
                                            this.classesService.updateDataClasses(_resClass[0].id, data_class).subscribe({
                                                next: () => {
                                                    datas[key].import = true;
                                                    datas[key].import_label = "Thành công";
                                                    this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                                },
                                                error: () => {
                                                    datas[key].import_label = "Thất bại";
                                                    this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                                }
                                            })
                                        } else {
                                            datas[key].import = true;
                                            datas[key].import_label = "Đã có";
                                            this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                        }
                                    } else {
                                        this.classesService.createDataClasses(data_class).subscribe({
                                            next: () => {
                                                datas[key].import = true;
                                                datas[key].import_label = "Thành công";
                                                this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                            },

                                            error: () => {
                                                datas[key].import_label = "Thất bại";
                                                this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                            }
                                        })
                                    }
                                },
                                error: () => {
                                    datas[key].import_label = "Thất bại";
                                    this.loopImportLophoc(datas[key + 1], datas, key + 1);
                                }
                            })
                        },

                        error: () => {
                            datas[key].import_label = "Thất bại";
                            this.loopImportLophoc(datas[key + 1], datas, key + 1);
                        }
                    })

                }
            } else {
                datas[key]['import_label'] = 'Thiếu mã lớp';
                this.loopImportLophoc(datas[key + 1], datas, key + 1);
            }

        } else {
            this.displayModal = false;
            this.noitifi.toastSuccess("Đã import xong");
        }

    }

    loadNamhocHocky() {
        this.modalService.open(this.templateExportMaLop, NORMAL_MODAL_OPTIONS);
        const condition_group_namhoc = this.httpHepler.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ]).set('order', 'DESC').set('orderby', 'namhoc').set("groupby", "namhoc").set("limit", -1);

        const condition_group_hocky = this.httpHepler.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ]).set('order', 'DESC').set('orderby', 'hocky').set("groupby", "hocky").set("limit", -1);
        forkJoin([
            this.classesService.getClassesByCols(condition_group_namhoc),
            this.classesService.getClassesByCols(condition_group_hocky),
        ]).subscribe({
            next: ([_resNamhoc, _resHocky]) => {

                const tmpNamHoc = [];
                const tmpHocky = [];

                _resNamhoc.forEach(f => {
                    if (f['namhoc'])
                        tmpNamHoc.push({ value: f['namhoc'], label: 'Năm học '.concat(f['namhoc']) });
                })
                _resHocky.forEach(f => {
                    if (f['hocky'])
                        tmpHocky.push({ value: f['hocky'], label: 'HK '.concat(f['hocky']) });
                })

                this.listNamhoc = tmpNamHoc;
                this.listHocky = tmpHocky;
            },
            error: () => {
                this.noitifi.toastError('Lỗi tải dữ liệu');
            }
        })

    }


    exportClass(d) {
        if (Object.keys(this.objectFilter).length === 0) {
            this.noitifi.toastWarning("Vui lòng chọn năm học và học kỳ");
        } else if (!this.objectFilter['namhoc']) {
            this.noitifi.toastWarning("Vui lòng chọn năm học");
        } else if (!this.objectFilter['hocky']) {
            this.noitifi.toastWarning("Vui lòng chọn học kỳ");
        } else {
            const condition = this.httpHepler.paramsConditionBuilder(
                [
                    { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: this.objectFilter['namhoc'] },
                    { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: this.objectFilter['hocky'], orWhere: 'and' },
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                ]).set('select', 'id,name,sotinchi,course_info,manager_info,hocky,khoa,namhoc,link_googlemeet,course_id').set("limit", -1);
            this.classesService.getClassesByCols(condition).subscribe({
                next: (_resClass) => {
                    if (_resClass.length) {
                        d(true);
                        const newClass = [];
                        _resClass.forEach((f, key) => {
                            f['linkGoogleMeet'] = '';
                            f['hocphan'] = f.course_info ? f.course_info['title'] : '';
                            f['giangvien'] = f.manager_info ? f.manager_info.split('*')[0] : '';
                            newClass.push(f);
                        })
                        this.convertDataToExportExcel(newClass, APP_CONFIGS.donvitructhuoc)
                    } else {
                        d(true);
                        this.noitifi.toastInfo("Không có giữ liệu được tìm thấy");
                    }
                },
                error: () => {
                    d(true);
                }
            })
        }
    }


    convertDataToExportExcel(data, tenDonvi: string) {
        const dataExport = [];
        const header = ['STT', 'Tên lớp', 'Mã lớp', 'Số tín chỉ', 'Năm học', 'Học kỳ', 'Khóa mở', 'Học phần', 'Giảng viên', 'Link google meet'];
        data.forEach((f, key) => {
            dataExport.push([
                key + 1,
                f['name'],
                f['id'],
                f['sotinchi'],
                f['namhoc'],
                f['hocky'],
                f['khoa'],
                f['hocphan'],
                f['giangvien'],
                f['linkGoogleMeet'],
            ]);
        });
        const titleFont = { name: 'Times New Roman', family: 1, size: 18, bold: true };
        const rowFont = { name: 'Times New Roman', family: 1, size: 11 };
        const donviFont = { name: 'Times New Roman', family: 1, size: 11, bold: true };
        this.exportExcelService.exportExcel(
            dataExport,
            header,
            'Danh sách sinh viên năm học '.concat(this.objectFilter['namhoc'], ' - học kỳ: ', this.objectFilter['hocky']),
            titleFont,
            'E1:M2',
            rowFont,
            rowFont,
            tenDonvi,
            donviFont,
            null,
            null,
            null,
            null,
            ' '.concat(this.objectFilter['namhoc'], ' - học kỳ: ', this.objectFilter['hocky'])
        );
    }

    clearDataImport() {
        this.selectedYear = null;
    }

    close(d) {
        this.clearDataImport();
        d(true);
    }

    onChangeFilter(event, keyName: string) {
        if (event) {
            this.objectFilter[keyName] = event['value'];
        } else {
            this.objectFilter[keyName] = null;
        }
        // if (this.isGrid) {
        //     this.listClass = [];
        //     this.loadFilterPage(this.objectFilter, 0, 20);
        // } else {
        //     this.loadFilterPage(this.objectFilter, 0, this.limitList);
        // }
    }

    /** end import lớp học */
    /** Import sinh viên vào lớp học */

    convertDataForStudent(data) {
        const newData = data.filter(m => m[0] && m[1] && m[2] && !isNaN(m[0])) // 0=> stt, 1 => ma sinh vien => 2 > id lop
        this.duplicateStudent = [];
        this.displayModal = true;
        this.show_return = false;
        this.waitting_title = "Đang lấy dữ liệu sinh viên, vui lòng không tắt trình duyệt";
        const objectDuplicate = {};
        const email = {};
        const objectClass = {};
        const objectStudentCode = {};
        const objectAddStudent = {};
        const ar_student = [];
        const ar_student_f_request = [];
        let j = 0;
        ar_student_f_request[j] = [];
        newData.forEach((f, key) => {
            if (f[0] && f[1] && f[2]) {// stt , ma sinh vien, ma lop, nam hoc, hoc ky, id hoc phan
                f[1] = f[1].toLowerCase();
                if (!objectDuplicate[f[1].concat("_", f[2])]) {
                    objectDuplicate[f[1].concat("_", f[2])] = { ...f };
                } else {
                    objectDuplicate[f[1].concat("_", f[2])]['duplicate'] = true;
                }

                if (!objectDuplicate[f[1].concat("_", f[2])]['duplicate']) {
                    if (!email[f[1].concat("_", f[2])]) {
                        email[f[1].concat("_", f[2])] = 1;
                        const newEmail = f[1] ? f[1].trim().concat('@ictu.edu.vn').toLowerCase() : null;
                        if (!objectClass[f[2]]) {
                            objectClass[f[2]] = [];
                            objectClass[f[2]].push(f);
                        } else {
                            if (Array.isArray(objectClass[f[2]])) {
                                objectClass[f[2]].push(f);
                            }
                        }
                        if (!objectStudentCode[f[1]]) {
                            objectStudentCode[f[1]] = [];
                            ar_student.push({ student_code: f[1], class_id: f[2] });
                            objectStudentCode[f[1]].push({ class_id: f[2] });
                            ar_student_f_request[j].push(f[1]);
                            if (ar_student_f_request[j].length === 20) {
                                j = j + 1;
                                ar_student_f_request[j] = [];
                            }
                        } else {
                            if (Array.isArray(objectStudentCode[f[1]])) {
                                objectStudentCode[f[1]].push({ class_id: f[2] });
                            }
                        }
                    }
                }
            }
        })
        this.loopCheckValidStudent(ar_student_f_request[0], ar_student_f_request, objectStudentCode, 0);
    }

    loopCheckValidStudent(student_codes: string[], ar_student_f_request: any[], object_student: {}, key) {
        if (key < ar_student_f_request.length) {

            this.progressValue = (key + 1) / ar_student_f_request.length * 100;
            const class_ids = [];
            student_codes.forEach(f => {
                if (object_student[f]) {
                    object_student[f].forEach(fo => {
                        class_ids.push(fo['class_id']);
                    })
                }
            })

            const class_ids_include = [... new Set(class_ids)];
            const condition_profile = this.httpHepler.paramsConditionBuilder([]).set("include", student_codes.toString()).set("include_by", "student_code");
            const condition_user = this.httpHepler.paramsConditionBuilder([]).set("include", student_codes.toString()).set("include_by", "username");
            const condition_class = this.httpHepler.paramsConditionBuilder([
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },]
            ).set("include", class_ids_include.toString()).set("include_by", "id").set('limit', -1);
            forkJoin([
                this.elngUserProfileService.getElngUserProfileByCols(condition_profile),
                this.userService.getUserByCols(condition_user),
                this.classesService.getClassesByCols(condition_class)
            ]).subscribe({
                next: ([_resStudentP, _student, _resClass]) => {

                    student_codes.forEach(f => {
                        if (object_student[f]) {
                            object_student[f].forEach(fo => {
                                const index = _resClass.findIndex(m => m.id === fo['class_id']);
                                if (index !== -1) {
                                    fo['class_name'] = _resClass[index].name;
                                    fo['hocky'] = _resClass[index].hocky;
                                    fo['namhoc'] = _resClass[index].namhoc;
                                } else {
                                    fo['class_name'] = 'Không có lớp hp';
                                    fo['hocky'] = null;
                                    fo['namhoc'] = null;
                                    fo['no_class'] = true;
                                }
                            })
                        }
                    })


                    _resStudentP.forEach(f => {
                        if (object_student[f.student_code]) {
                            object_student[f.student_code].forEach(fo => {
                                fo['user_id'] = f.user_id;
                                fo['status'] = 1;
                                fo['student_id'] = f.id;
                                fo['name'] = f.name;
                                fo['full_name'] = f.full_name;
                                fo['birthday'] = f.birthday;
                                fo['student_code'] = f.student_code.toLowerCase();
                                fo['has_user'] = true;
                            })
                        }
                    })

                    _student.forEach(f => {
                        if (object_student[f.username]) {
                            object_student[f.username].forEach(fo => {
                                fo['email'] = f.email;
                                fo['has_profile'] = true;
                            })
                        }
                    })

                    this.loopCheckValidStudent(ar_student_f_request[key + 1], ar_student_f_request, object_student, key + 1);
                },
                error: () => {
                    student_codes.forEach(f => {
                        object_student[f].forEach(fo => {
                            fo['error_load'] = true;
                            fo['error_load_label'] = 'Lỗi đường truyền';
                        })
                    });
                    this.loopCheckValidStudent(ar_student_f_request[key + 1], ar_student_f_request, object_student, key + 1);
                }
            })
        } else {
            this.displayModal = false;
            this.progressValue = 0;
            const tmp = [];
            let i = 0;
            Object.keys(object_student).forEach(f => {
                if (Array.isArray(object_student[f])) {
                    object_student[f].forEach((fo, key) => {

                        if (key !== 0) {
                            fo['not_show'] = true;
                        } else {
                            fo['rowspan'] = object_student[f].length;
                        }
                        fo['import_label'] = 'Chưa import';
                        if (fo['error_load']) {
                            fo['import_label'] = 'Lỗi đường truyền';
                            fo['cannot_import'] = true;
                        } else {
                            if (!fo['has_profile'] || !fo['has_user']) {
                                fo['import_label'] = 'Chưa có tài khoản';
                                fo['cannot_import'] = true;
                            }
                        }

                        if (fo['no_class']) {
                            fo['cannot_import'] = true;
                            fo['import_label'] = 'Không có lớp hp';
                        }

                        i = i + 1;
                        fo['index_'] = i;
                        tmp.push(fo);
                    })
                }

            })
            this.list_student_class = tmp;
        }
    }

    startImportSinhVienClass() {
        if (this.list_student_class) {
            this.noitifi.confirm('Bạn có chắc chắn bắt đầu '.concat(!this.ghi_de ? 'Import?' : 'Ghi đè?'), 'Xác nhận', [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.progressValue = 0;
                    this.displayModal = true;
                    this.import_return = 0;
                    this.show_return = true;
                    this.waitting_title = "Đang đồng bộ sinh viên vào lớp học, vui lòng không tắt trình duyệt";
                    let i = 0;
                    const tmp = [];
                    tmp[0] = [];
                    this.list_student_class.forEach(f => {
                        if (!f['cannot_import']) {
                            if (tmp[i].length < 10) {
                                tmp[i].push(f);
                            } else {
                                i = i + 1;
                                tmp[i] = [];
                                tmp[i].push(f);
                            }
                        }
                    })
                    this.loopImportClassStudent(tmp[0], tmp, 0);
                }
            })
        } else {
            this.noitifi.toastWarning("Không có bản ghi nào cần import");
        }
    }

    loopImportClassStudent(data: any[], datas: any[], key) {
        if (key < datas.length) {
            this.import_return = this.import_return + data.length;
            this.progressValue = (key + 1) / datas.length * 100;
            const require: Observable<any>[] = [];
            data.forEach(f => {
                const object: ClassStudent = {
                    student_id: f.student_id,
                    class_id: f.class_id,
                    user_id: f.user_id,
                    user_info: {
                        name: f.name,
                        full_name: f.full_name,
                        birthday: f.birthday,
                        student_code: f.student_code,
                        email: f.email
                    },
                    status: 1,
                    params: null,
                    namhoc: f.namhoc,
                    hocky: f.hocky
                }

                const condition = this.httpHepler.paramsConditionBuilder(
                    [
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: f.class_id.toString() },
                        { conditionName: 'student_id', condition: OvicQueryCondition.equal, value: f.student_id.toString(), orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                    ]).set("select", "id, class_id, student_id ");

                require.push(this.classStudentService.getClassStudentByCols(condition).pipe(
                    catchError(() => {
                        f.import_label = "Thất bại";
                        return of(f)
                    }),
                    mergeMap(_resClassStudent => {
                        if (_resClassStudent.length) {
                            if (this.ghi_de) {
                                return this.classStudentService.updateClassStudent(_resClassStudent[0].id, object).pipe(
                                    catchError(() => {
                                        f.import_label = "Thất bại";
                                        return of(f)
                                    }),
                                    mergeMap(_res => {
                                        f.import_label = "Thành công";
                                        return of(f);
                                    }))
                            } else {
                                f.import_label = "Đã có";
                                return of(f);
                            }
                        } else {
                            return this.classStudentService.addClassStudent(object).pipe(
                                catchError(() => {
                                    f.import_label = "Thất bại";
                                    return of(f)
                                }),
                                mergeMap(_res => {
                                    f.import_label = "Thành công";
                                    return of(f);
                                }))
                        }
                    })));
            })

            forkJoin(require).subscribe({
                next: (_res) => {
                    this.loopImportClassStudent(datas[key + 1], datas, key + 1);
                },
                error: () => {
                    this.loopImportClassStudent(datas[key + 1], datas, key + 1);
                }
            })

        } else {
            this.displayModal = false;
            this.noitifi.toastSuccess("Đã import xong");
        }
    }



    /**End Import sinh vien */

    returnValueWaiting(): string {
        let current_value = this.import_return;
        let total_value = 100;
        switch (this.type_action) {
            case 'sinhvien':
                if (this.list_userImport)
                    total_value = this.list_userImport.length;
                break;
            case 'lophoc':
                if (this.list_lopImport)
                    total_value = this.list_lopImport.length;
                break;
            case 'sinhvien_lophoc':
                if (this.list_student_class)
                    total_value = this.list_student_class.filter(m => !m['cannot_import']).length;
                break;
            case 'calendar':
                if (this.list_calendarImport)
                    total_value = this.list_calendarImport.filter(m => m['teacher_ids'] && m['teacher_ids'] !== '').length;
                break;
            case 'monhoc':
                if (this.list_monhoc)
                    total_value = this.list_monhoc.filter(m => !m['cannot_import']).length;
                break;
            case 'cbgv':
                if (this.list_giangvien)
                    total_value = this.list_giangvien.filter(m => m['donvi_chuyenmon_id']).length;
                break;
            default:
                break;
        }
        return current_value.toString().concat("/", total_value.toString());
    }

    closeForm() {
        this.noitifi.closeSideNavigationMenu();
    }

    /**Import lịch giảng dạy */

    convertForCalendar(data) {
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
                    import: false,
                    import_label: 'Chưa import',
                    duplicate: 'không',
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
        this.loopGetClassForCalendar(arr_slug[0], arr_slug, 0, [...calendars]);
    }

    loopGetClassForCalendar(data, datas, key, calendar_data: Calendar[]) {
        if (key < datas.length) {
            this.progressValue = (key + 1) / datas.length * 100;
            const option: ConditionOption = {
                condition: [{ conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }],
                set: [
                    { label: "include", value: data.toString() },
                    { label: "include_by", value: "slug" },
                    { label: "limit", value: "-1" }
                ],
                page: null
            }

            this.classesService.getClassesByPageNew(option).subscribe({
                next: (_res) => {
                    calendar_data.forEach(f => {
                        if (!f.class_id) {
                            const index = _res.data.findIndex(m => m.slug === f.class_name_slug);
                            if (index !== -1) {
                                f.class_id = _res.data[index].id;
                                let teacher_str = '';
                                if (_res.data[index].manager_info) {
                                    _res.data[index].manager_info.split(",").forEach(f => {
                                        if (f && f !== '')
                                            teacher_str = teacher_str.concat('<span class="tag-user-name">', f, '</span>')
                                    })
                                }
                                f['teachers'] = teacher_str;
                                f['teacher_ids'] = _res.data[index].manager_ids;
                            } else {
                                // f['import_label'] = 'Không có lớp hp';
                            }
                        }
                    })
                    this.loopGetClassForCalendar(datas[key + 1], datas, key + 1, calendar_data);
                },
                error: () => {
                    this.loopGetClassForCalendar(datas[key + 1], datas, key + 1, calendar_data);
                }
            })
        } else {
            calendar_data.forEach(f => {
                if (!f.class_id) {
                    const index = calendar_data.findIndex(m => m.group === f.group && m.class_id);
                    if (index !== -1) {
                        f['teachers'] = calendar_data[index]['teachers'];
                        f['teacher_ids'] = calendar_data[index].teacher_ids;
                    } else {
                        f['import_label'] = 'Không có lớp hp';
                    }
                }
            })

            this.displayModal = false;
            this.list_calendarImport = calendar_data;
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

    startImportCalendar() {
        if (this.list_calendarImport) {
            this.noitifi.confirm('Bạn có chắc chắn bắt đầu '.concat(!this.ghi_de ? 'Import?' : 'Ghi đè?'), 'Xác nhận', [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.progressValue = 0;
                    this.displayModal = true;
                    this.import_return = 0;
                    this.waitting_title = "Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt";
                    const data = this.list_calendarImport.filter(m => m['teacher_ids'] && m['teacher_ids'] !== '');
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
                                reader.readAsBinaryString(_res);
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
                                            this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
                                            this.progressValue = 0;
                                            this.displayModal = false;
                                        }
                                    })

                                };
                            },
                            error: () => {
                                this.progressValue = 0;
                                this.displayModal = false;
                                this.noitifi.toastError("Không tải được lịch giảng dạy, vui lòng thử lại");
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
            this.noitifi.toastWarning("Không có bản ghi nào cần import");
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
                            f.import_label = "Thất bại";
                            this.calendar_import_count.failed = this.calendar_import_count.failed + 1;
                            return of(f)
                        }),
                        mergeMap(_res => {
                            if (!_res.data.length) {
                                return this.calendarService.addCalendar(calendar).pipe(
                                    catchError(() => {
                                        f.import_label = "Thất bại";
                                        this.calendar_import_count.failed = this.calendar_import_count.failed + 1;
                                        return of(f)
                                    }),
                                    mergeMap(_res => {
                                        f.import_label = "Thành công";
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
            this.noitifi.toastSuccess("Cập nhật thành công");
        }
    }

    // donwloadToExport() {
    //     const arrayCondition = [
    //         { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
    //     ];

    //     const likeSearch = ['title', 'creator_name', 'maso'];
    //     Object.keys(this.objectFilter).forEach(f => {
    //         if (likeSearch.findIndex(i => i === f) !== -1) {
    //             arrayCondition.push({ conditionName: f, condition: OvicQueryCondition.like, value: '%'.concat(this.objectFilter[f].toString(), '%'), orWhere: 'and' },);
    //         } else {
    //             arrayCondition.push({ conditionName: f, condition: OvicQueryCondition.equal, value: this.objectFilter[f].toString(), orWhere: 'and' },);
    //         }
    //     })

    //     let condition = this.httpHepler.paramsConditionBuilder(arrayCondition);

    //     const conditionChuyenmuc = this.httpHepler.paramsConditionBuilder([
    //         { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
    //     ]).set("order", "ASC").set("orderby", "ordering");

    //     forkJoin([
    //         this.elnKhoaHocService.getElnKhoaHocByCols(condition),
    //         this.elnChuyenMucService.getElnChuyenMucByCols(conditionChuyenmuc)
    //     ]).subscribe({
    //         next: ([_resCourse]) => {
    //             const tmpData = [];
    //             let teacher_ids = [];
    //             const courses_ids = [];
    //             const chuyenmuc_ids = [];
    //             _resCourse.forEach((f, key) => {
    //                 teacher_ids = teacher_ids.concat(f.teacher_ids);
    //                 courses_ids.push(f.id);
    //                 chuyenmuc_ids.push(f.category_ids);
    //             })

    //             const conditionLesson = this.httpHepler.paramsConditionBuilder(
    //                 [
    //                     { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' },
    //                     { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
    //                 ]).set("select", "course_id,type,video,audio,slide,documents,other_video").set("include", courses_ids.toString()).set("include_by", "course_id").set("limit", -1);
    //             forkJoin([
    //                 this.elnBaiHocService.getElnBaiHocByCols(conditionLesson),
    //                 this.userService.getUserByItem(teacher_ids.toString(), "id"),
    //             ]).subscribe(([_resLesson, _resTeacher]) => {
    //                 const object = {};
    //                 _resLesson.forEach((f) => {
    //                     if (f.type === "LESSON") {
    //                         if (!object[f.course_id]) {
    //                             object[f.course_id] = 1;
    //                         } else {
    //                             object[f.course_id] = object[f.course_id] + 1;
    //                         }
    //                     }
    //                 })
    //                 const result = [];
    //                 _resCourse.forEach((f, key) => {
    //                     if (!f.checkedVideo) {
    //                         if (f.video_introduce && f.video_introduce.length !== 0) {
    //                             f['checkedVideo'] = 'có';
    //                         } else {
    //                             f['checkedVideo'] = 'không';
    //                         }
    //                     }
    //                     f['sobaigiang_per'] = object[f.id] ? Number(object[f.id]).toString().concat("/", Number(f['sobaigiang']).toString()) : '0'.toString().concat("/", Number(f['sobaigiang']).toString());
    //                     if (f['pmsAction']) {
    //                         result.push(f);
    //                     }
    //                 });
    //                 this.donwloadCouseToExcel(result, _resLesson, _resTeacher);
    //             })

    //         },
    //         error: () => this.noitifi.toastError("Lỗi kết nối, tải thất bại")
    //     })
    // }
    readyToDownLoadCourse(d) {
        if (Object.keys(this.objectFilter).length === 0) {
            this.noitifi.toastWarning("Vui lòng chọn năm học và học kỳ");
        } else if (!this.objectFilter['namhoc']) {
            this.noitifi.toastWarning("Vui lòng chọn năm học");
        } else if (!this.objectFilter['hocky']) {
            this.noitifi.toastWarning("Vui lòng chọn học kỳ");
        } else {
            this.displayModal = true;
            this.waitting_title = "Đang tải dữ liệu, vui lòng không tắt trình duyệt";
            this.show_return = false;
            const condition_donvi = this.httpHepler.paramsConditionBuilder(
                [
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                    { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
                ]
            ).set('limit', '-1');

            const arr_condition = [
                { conditionName: 'donvi_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
            ]

            const condition_nganh = this.httpHepler.paramsConditionBuilder(arr_condition).set('limit', '-1');


            const condition_course = this.httpHepler.paramsConditionBuilder(
                [
                    { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: this.objectFilter['namhoc'] },
                    { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: this.objectFilter['hocky'], orWhere: 'and' },
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                ]).set('select', 'course_id').set("limit", -1).set("groupby", "course_id");


            forkJoin([
                this.donviService.getDonViByCols(condition_donvi),
                this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh),
                this.classesService.getClassesByCols(condition_course)
            ]).subscribe({
                next: ([_donvi, _nganh_bomon, _course]) => {
                    const data = [];
                    const course_id = [];
                    _course.forEach(f => {
                        if (f.course_id)
                            course_id.push(f.course_id);
                    })
                    this.loopGetCouse(data, 1, 1000, _donvi, _nganh_bomon, course_id, d);
                },
                error: () => {
                    this.displayModal = false;
                    d(true);
                    this.noitifi.toastError("Lỗi kết nối, tải thất bại");
                }
            })
        }
    }

    loopGetCouse(data: ElnKhoaHoc[], page: number, count: number, donvi: DonVi[], _nganh_bomon: ElnChuyenMuc[], _course_id, d) {
        if (data.length < count) {
            this.progressValue = data.length / count * 100;
            const arrayCondition = [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ];
            let setCondition = [];
            setCondition.push(
                { label: 'orderby', value: 'title' },
                { label: 'include', value: _course_id.toString() },
                { label: 'include_by', value: 'id' }
            );
            this.elnKhoaHocService.getKhoaHocByPageNew(arrayCondition, page, setCondition).pipe(mergeMap(_resCourse => {
                const tmpData = [];
                let teacher_ids = ['0'];
                const courses_ids = [];
                const chuyenmuc_ids = [];
                _resCourse.data.forEach((f, key) => {
                    const teacher_ids_re = f.teacher_ids ? f.teacher_ids.split("|").filter(m => m && m !== '') : [];
                    teacher_ids = teacher_ids.concat(teacher_ids_re);
                    courses_ids.push(f.id);
                    chuyenmuc_ids.push(f.category_ids);
                })

                const conditionLesson = this.httpHepler.paramsConditionBuilder(
                    [
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'LESSON' },
                        { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                    ]).set("include", courses_ids.toString()).set("include_by", "course_id").set("limit", "-1");
                return forkJoin([
                    this.elnBaiHocService.getElnBaiHocByCols(conditionLesson),
                    this.userService.getUserByItem(teacher_ids.filter(m => m && m !== '').toString(), "id"),
                ]).pipe(mergeMap(([_lesson, _teacher]) => {
                    const object = {};
                    _lesson.forEach((f) => {
                        if (f.type === "LESSON") {
                            if (!object[f.course_id]) {
                                object[f.course_id] = 1;
                            } else {
                                object[f.course_id] = object[f.course_id] + 1;
                            }
                        }
                    })
                    const result = [];
                    _resCourse.data.forEach((f, key) => {
                        if (!f.checkedVideo) {
                            if (f.video_introduce && f.video_introduce.length !== 0) {
                                f['checkedVideo'] = 'có';
                            } else {
                                f['checkedVideo'] = 'không';
                            }
                        }
                        f['sobaigiang_per'] = object[f.id] ? Number(object[f.id]).toString().concat("/", Number(f['sobaigiang']).toString()) : '0'.toString().concat("/", Number(f['sobaigiang']).toString());
                        if (f['pmsAction']) {
                            result.push(f);
                        }

                        let teacher_names = [];
                        if (f.teacher_ids && f.teacher_ids.length) {
                            const teachers = _teacher.filter(m => f.teacher_ids.split("|").findIndex(i => i.toString() === m.id.toString()) !== -1);
                            if (teachers.length) {
                                teachers.forEach((ft, tkey) => {
                                    teacher_names.push(ft.display_name)
                                })
                            }
                        }

                        f['teacher_names'] = teacher_names.length ? teacher_names.join(", ") : '';

                        const lesson = _lesson.filter(m => m.type === "LESSON" && m.course_id === f.id);
                        const baitap = _lesson.filter(m => m.type === "TEST" && m.course_id === f.id);
                        const lesson_empty = lesson.filter(m => !m.audio && !m.slide && !m.video && !m.other_video && !m.documents);

                        let videos = 0;
                        let audios = 0;
                        let slides = 0;
                        lesson.forEach(fv => {
                            if (fv.video) {
                                videos = videos + 1
                            }
                            if (fv.other_video) {
                                videos = videos + fv.other_video.length;
                            }

                            if (fv.audio) {
                                audios = audios + fv.audio.length;
                            }

                            if (fv.slide) {
                                slides = slides + fv.slide.length;
                            }
                        });

                        f['lesson_length'] = lesson.length;
                        f['lesson_empty'] = lesson_empty.length;
                        f['videos_length'] = videos;
                        f['slides_length'] = slides;
                        f['audios_length'] = audios;
                        f['baitap_length'] = baitap.length;
                    });
                    return of(_resCourse);
                }))
            })).subscribe({
                next: _res => {
                    this.loopGetCouse(data.concat(_res.data), page + 1, _res.recordsFiltered, donvi, _nganh_bomon, _course_id, d);
                },
                error: () => {
                    this.noitifi.toastError("Tải thất bại, lỗi kết nối");
                    this.displayModal = false;
                    d(true);
                }
            })
        } else {
            this.donwloadCouseToExcel(data, donvi, d)
        }
    }

    donwloadCouseToExcel(data_course, list_donvi_chuyenmon, d) {
        this.fileService.downloadFileAsBlob('..\\assets\\files\\Thong_ke_so_lieu_ve_bai_giang_so.xlsx').subscribe(res => {
            const file = res;
            readImportFile(file, this.noitifi, 'binaryString', (localUrl) => {
                const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'binary' });
                const wsname: string = wb.SheetNames[0];
                const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                const mergesData = [];
                const mergesDataFooter = [];

                const row = ws['!rows'];
                // const footerData = data.splice(50, 16);
                const headerData = data.splice(0, 6);
                const newHeaderData = [];
                const tableHeader = [];
                headerData.forEach((f, key) => {
                    if (Array.isArray(f)) {
                        if (!f[0]) {
                            f[0] = '';
                        }
                    }
                    if (key < 4) {
                        newHeaderData.push(f);
                    } else {
                        tableHeader.push(f);
                    }

                })
                const dataContent = [];
                data_course.forEach((f, key) => {
                    const index_khoa = list_donvi_chuyenmon.findIndex(m => m.id === f.category_ids);


                    // let teacher_names = [];
                    // if (f.teacher_ids && f.teacher_ids.length) {
                    //     const teachers = data_teacher.filter(m => f.teacher_ids.findIndex(i => i.toString() === m.id.toString()) !== -1);
                    //     if (teachers.length) {
                    //         teachers.forEach((ft, tkey) => {
                    //             teacher_names.push(ft.display_name)
                    //         })
                    //     }
                    // }

                    dataContent.push([
                        key + 1,
                        f.title,
                        f.maso,
                        '',
                        index_khoa !== -1 ? list_donvi_chuyenmon[index_khoa].title : '',
                        f['lesson_length'],
                        f['lesson_empty'],
                        f['videos_length'],
                        f['slides_length'],
                        f['audios_length'],
                        f['baitap_length'],
                        f.decuong ? 'Có' : 'Không',
                        f.files ? f.files.length : '0',
                        f['teacher_names']
                    ])
                })
                for (let j = 0; j < 14; j++) {
                    if (j !== 13) {
                        newHeaderData[3][j] = '';
                    } else {
                        const d = new Date();
                        newHeaderData[3][j] = 'Thời gian xuất báo cáo: '.concat(d.toLocaleString("en-GB").split(",")[0]);
                    }
                }
                const cols = { donvitructhuoc: 'A1:B1', donvi: 'A2:B2', title: 'G1:N2' };
                const widthPoint = 10;
                const objectColWidth = { 1: 5, 2: 20, 3: 10, 4: 9, 5: 20, 6: widthPoint, 7: 15, 8: widthPoint, 9: widthPoint, 10: widthPoint, 11: widthPoint, 12: widthPoint, 13: widthPoint, 14: 30 };
                ws['!merges'].map(m => {
                    if (m.s.r < 7) {
                        mergesData.push(this.keyAnswer[m.s.c].concat((m.s.r + 1).toString(), ':', this.keyAnswer[m.e.c], (m.e.r + 1).toString()));
                    } else {
                        mergesDataFooter.push(this.keyAnswer[m.s.c].concat((m.s.r - 7 + headerData.length + dataContent.length).toString(), ':', this.keyAnswer[m.e.c], (m.e.r - 7 + headerData.length + dataContent.length).toString()));
                    }
                });
                // mergesData.push('F5:G5')
                this.displayModal = false;
                d(true);
                this.exportExcelNewService.exportExcel(newHeaderData, tableHeader, dataContent, [], mergesData.concat(mergesDataFooter), cols, objectColWidth, { name: 'Time New Roman', family: 1, size: 9 }, 'Thong_ke_so_lieu_ve_bai_giang_so', 12, 30, true);
            };
        });
    }

    convertDataForMonhoc(data) {
        this.noitifi.isProcessing(true);
        const condition_donvi = this.httpHepler.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
            ]
        ).set('limit', '-1');

        const arr_condition = []
        const condition_nganh = this.httpHepler.paramsConditionBuilder(arr_condition).set('limit', '-1');

        forkJoin([
            this.donviService.getDonViByCols(condition_donvi),
            this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh),
        ]).subscribe({
            next: ([dsDonVi, _nganh_bomon]) => {
                const object_duplicate = {};
                this.list_monhoc = [];
                const tmp = [];
                data.forEach((f, key) => {
                    if (f[2]) {
                        if (!object_duplicate[f[2].toString().trim()]) {
                            object_duplicate[f[2].toString().trim()] = { ...f };
                        } else {
                            object_duplicate[f[2].toString().trim()]['duplicate'] = true;
                        }

                        const index_khoa = dsDonVi.findIndex(m => this.helperService.slugVietnamese(m.title) === this.helperService.slugVietnamese(f[3]));
                        let index_nganh = -1;
                        if (f[4])
                            index_nganh = _nganh_bomon.findIndex(m => this.helperService.slugVietnamese(m.title) === this.helperService.slugVietnamese(f[4]))
                        const monhoc = {
                            title: f[1].toString().trim(),
                            maso: f[2].toString().trim(),
                            category_ids: index_khoa !== -1 ? dsDonVi[index_khoa].id : null,
                            ten_khoa: index_khoa !== -1 ? dsDonVi[index_khoa].title : null,
                            import: false,
                            import_label: object_duplicate[f[2].toString().trim()]['duplicate'] ? 'Trùng lặp' : 'Chưa import',
                            duplicate: object_duplicate[f[2].toString().trim()]['duplicate'] ? 'có' : 'không',
                            cannot_import: object_duplicate[f[2].toString().trim()]['duplicate'] ? true : false,
                            nganh_bomon_id: index_nganh !== -1 ? _nganh_bomon[index_nganh].id : null,
                            ten_nganh_bomon: index_nganh !== -1 ? _nganh_bomon[index_nganh].title : null,
                        }
                        tmp.push(monhoc);
                    }
                })
                this.list_monhoc = tmp;
                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.noitifi.toastError('Không load được danh mục khoa')
            }
        });
    }

    startImportMonhoc() {
        this.noitifi.confirm('Bạn có chắc chắn bắt đầu '.concat(!this.ghi_de ? 'Import?' : 'Ghi đè?'), 'Xác nhận', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                const data = this.list_monhoc.filter(m => m['duplicate'] === 'không');
                let i = 0;
                let data_ = [];
                data_[0] = [];
                data.forEach(f => {
                    if (data_[i].length < 20) {
                        data_[i].push(f);
                    } else {
                        i = i + 1;
                        data_[i] = [];
                        data_[i].push(f);
                    }
                })
                this.displayModal = true;
                this.show_return = true;
                this.import_return = 0;
                this.loopImportMonhoc(data_[0], data_, 0);
            }
        })
    }

    loopImportMonhoc(data: any[], datas: any[], key) {
        if (key < datas.length) {
            this.import_return = this.import_return + data.length;
            this.progressValue = (key + 1) / datas.length * 100;
            const require: Observable<any>[] = [];
            data.forEach(f => {
                const monhoc = {
                    title: f.title,
                    maso: f.maso,
                    category_ids: f.category_ids,
                    slug: this.helperService.slugVietnamese(f.title),
                    status: 1,
                    nganh_bomon_id: f.nganh_bomon_id
                }

                const condition: ConditionOption = {
                    condition: [
                        { conditionName: 'maso', condition: OvicQueryCondition.equal, value: monhoc.maso, orWhere: 'and' },
                        { conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: monhoc.category_ids, orWhere: 'and' }
                    ],
                    set: [],
                    page: null
                }

                require.push(this.elnKhoaHocService.getKhoaHocByPageNew_2(condition).pipe(
                    catchError((res) => {
                        f['import_label'] = 'Thất bại';
                        return of(res);
                    }),
                    mergeMap(_course => {
                        if (_course.data.length) {
                            if (this.ghi_de) {
                                return this.elnKhoaHocService.updateElnKhoaHoc(_course.data[0].id, monhoc).pipe(
                                    catchError((res) => {
                                        f['import_label'] = 'Thất bại';
                                        return of(res);
                                    }),
                                    mergeMap(() => {
                                        f['import_label'] = 'Thành công';
                                        return of(_course);
                                    }))
                            } else {
                                f['import_label'] = 'Đã có';
                                return of(_course);
                            }
                        } else {
                            return this.elnKhoaHocService.addElnKhoaHoc(monhoc).pipe(
                                catchError((res) => {
                                    f['import_label'] = 'Thất bại';
                                    return of(res);
                                }),
                                mergeMap(() => {
                                    f['import_label'] = 'Thành công';
                                    return of(_course);
                                }))
                        }
                    })))

            })

            if (require.length) {
                forkJoin(require).subscribe({
                    next: () => {
                        this.loopImportMonhoc(datas[key + 1], datas, key + 1);
                    },
                    error: () => {
                        this.loopImportMonhoc(datas[key + 1], datas, key + 1);
                    }
                })
            } else {
                this.loopImportMonhoc(datas[key + 1], datas, key + 1);
            }
        } else {
            this.displayModal = false;
            this.noitifi.toastSuccess("Đã đồng bộ xong");
        }
    }

    convertSqlToGiangvien(data) {
        this.displayModal = true;
        this.progressValue = 0;
        this.waitting_title = 'Đang kiểm tra dữ liệu, vui lòng chờ';
        this.show_return = false;
        const condition_donvi = this.httpHepler.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
            ]
        ).set('limit', '-1');

        const arr_condition = [
            { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'bomon', orWhere: 'and' },
        ]
        const condition_nganh = this.httpHepler.paramsConditionBuilder(arr_condition).set('limit', '-1');

        forkJoin([
            this.donviService.getDonViByCols(condition_donvi),
            this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh)
        ]).subscribe({
            next: ([_dsDonvi, nganh_bomon]) => {
                const _data = [];
                this.loopGetTeacherToCheck(_data, 1, 1000, data, _dsDonvi, nganh_bomon);
            },
            error: () => {
                this.displayModal = false;
                this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }


    loopGetTeacherToCheck(data, page, count, _data_sql, _dsDonvi, nganh_bomon) {
        if (data.length < count) {
            this.progressValue = data.length / count * 100;
            const condtition_profile: ConditionOption = {
                condition: [
                    { conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
                ],
                set: [
                    { label: 'limit', value: '100' }
                ],
                page: page.toString()
            }
            this.elngUserProfileService.getUserProfileByPageNewV2(condtition_profile).subscribe({
                next: (_profile) => {
                    this.loopGetTeacherToCheck(data.concat(_profile.data), page + 1, _profile.recordsFiltered, _data_sql, _dsDonvi, nganh_bomon)
                },
                error: () => {
                    this.displayModal = false;
                    this.noitifi.toastError("Kết nối thất bại, vui lòng thử lại")
                }
            })
        } else {
            this.progressValue = data.length / count * 100;
            _data_sql.splice(0, 1);
            const objectDuplicate = {};
            this.duplicateStudent = [];
            const user_list: data_sinhvienImport[] = [];
            this.displayModal = false;
            _data_sql.forEach((f, key) => {
                const key_email = f[4].trim().toLowerCase();
                if (!objectDuplicate[key_email]) {
                    objectDuplicate[key_email] = { ...f };
                } else {
                    objectDuplicate[key_email]['duplicate'] = true;
                }

                const user_name = f[1].toString().trim().replace(/\'/g, '').replace(/\W+/g, '.').toLowerCase();
                const user_: data_sinhvienImport = {
                    index_: key + 1,
                    display_name: f[2].trim(),
                    email: key_email, //this.helperService.convertToSqlServerTime ( f[ 4 ].split ( /.|-/ ).join ( '/' ) ) ,
                    username: user_name,
                    password: f[7].trim(),
                    phone: f[3].toString().trim().replace(/\W+/g, ''),
                    donvi_id: this.auth.user.donvi_id,
                    status: 1,
                    role_ids: [this.objectRoles[ROLES.giangvien].id.toString()],
                    user_id: this.auth.user.id,
                    full_name: f[2].trim(),
                    full_name_slug: this.helperService.slugVietnamese(f[2].trim()),
                    name: f[2] ? f[2].trim().split(' ')[f[2].trim().split(' ').length - 1] : null,
                    birthday: null,
                    gender: null,
                    student_code: user_name,
                    tenlop_quanly: null,
                    khoadaotao: null,
                    category_name: null,
                    import: false,
                    import_label: objectDuplicate[key_email]['duplicate'] ? 'Trùng lặp' : 'Chưa import',
                    duplicate: objectDuplicate[key_email]['duplicate'] ? 'có' : 'không',
                    teacher: 1,
                }


                const index = _dsDonvi.findIndex(m => this.helperService.slugVietnamese(m.title) === this.helperService.slugVietnamese(f[5].trim()));
                if (index !== -1) {
                    user_['name_khoa'] = _dsDonvi[index].title;
                    user_['donvi_chuyenmon_id'] = _dsDonvi[index].id;
                }

                if (f[6]) {
                    const index_nganh = nganh_bomon.findIndex(m => this.helperService.slugVietnamese(m.title) === this.helperService.slugVietnamese(f[6].trim()));
                    if (index_nganh !== -1) {
                        user_['name_bomon'] = nganh_bomon[index_nganh].title;
                        user_['bomon_id'] = nganh_bomon[index_nganh].id;
                    }
                }
                user_['is_password'] = 'true_password';
                user_['is_email'] = 'true_email';
                if (!user_.password.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?!.*?[\s])(?=.*?[#?!@$%^&*-]).{8,30}$/)) {
                    user_['is_password'] = 'false_password';
                }

                if (!key_email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
                    user_['is_email'] = 'false_email';
                }

                const _index_daco = data.findIndex(m => m.student_code === user_.username);
                if (_index_daco !== -1) {
                    user_.import_label = "Đã có";
                }
                user_['google_meet'] = f[8] ? f[8].trim() : null;
                user_list.push(user_);
            });
            this.list_giangvien = user_list;
        }
    }

    startImportGiangvien() {
        const data = this.list_giangvien.filter(m => m['donvi_chuyenmon_id']);
        if (data.length) {
            this.noitifi.confirm('Bạn có chắc chắn bắt đầu '.concat(!this.ghi_de ? 'Import?' : 'Ghi đè?'), 'Xác nhận', [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.show_return = true;
                    this.progressValue = 0;
                    this.displayModal = true;
                    this.import_return = 0;
                    this.waitting_title = "Đang đồng bộ giảng viên, vui lòng không tắt trình duyệt";
                    this.loopImportGiangVien(data[0], data, 0);
                }
            })
        } else {
            this.noitifi.toastWarning("Vui lòng kiểm tra lại dữ liệu import");
        }
    }

    loopImportGiangVien(data: data_sinhvienImport, datas: data_sinhvienImport[], key) {
        if (key < datas.length) {
            this.progressValue = (key + 1) / datas.length * 100;
            this.import_return = key + 1;
            const user = {
                username: data.username,
                display_name: data.display_name,
                phone: data.phone,
                email: data.email,
                donvi_id: data.donvi_id,
                role_ids: data.role_ids,
                status: 1,
                password: data.password
            }

            const user_profile = {
                user_id: null,
                full_name: data.full_name,
                full_name_slug: data.full_name_slug,
                name: data.name,
                student_code: data.student_code,
                teacher: data.teacher,
                donvi_chuyenmon_id: data['donvi_chuyenmon_id'],
                google_meet: data['google_meet'],
                bomon_id: data['bomon_id']
            }

            this.userService.getUserByCol('email', user.email).pipe(
                catchError(() => {
                    datas[key].import = false;
                    datas[key].import_label = "Thất bại";
                    return of(null);
                }),
                mergeMap(_resCheck => {
                    if (_resCheck.length) {
                        if (this.ghi_de) {
                            return this.userService.updateUserS(_resCheck[0].id, user).pipe(
                                catchError(() => {
                                    datas[key].import = false;
                                    datas[key].import_label = "Thất bại";
                                    return of(null);
                                }),
                                mergeMap(_user => {
                                    user_profile.user_id = _resCheck[0].id;
                                    return this.elngUserProfileService.updateUserProfileByCol(user_profile.user_id, user_profile, 'user_id').pipe(
                                        catchError(() => {
                                            datas[key].import = false;
                                            datas[key].import_label = "Thất bại";
                                            return of(null);
                                        }),
                                        mergeMap(() => {
                                            datas[key].import = true
                                            datas[key].import_label = "Thành công";
                                            return of(null)
                                        }))
                                }))
                        } else {
                            datas[key].import = true;
                            datas[key].import_label = "Đã có";
                            return of(null)
                        }
                    } else {

                        return this.userService.creatUser(user).pipe(
                            catchError(() => {
                                datas[key].import = false;
                                datas[key].import_label = "Thất bại";
                                return of(null);
                            }), mergeMap(_user => {
                                if (_user) {
                                    user_profile.user_id = _user;
                                    return this.elngUserProfileService.addElngUserProfile(user_profile).pipe(
                                        catchError(() => {
                                            datas[key].import = false;
                                            datas[key].import_label = "Thất bại";
                                            return of(null);
                                        }), mergeMap(() => {
                                            datas[key].import = true
                                            datas[key].import_label = "Thành công";
                                            return of(null)
                                        }))
                                }
                                datas[key].import = false;
                                datas[key].import_label = "Thất bại";
                                return of(null)
                            }))
                    }
                })).subscribe({
                    next: () => {
                        this.loopImportGiangVien(datas[key + 1], datas, key + 1);
                    },
                    error: () => {
                        this.loopImportGiangVien(datas[key + 1], datas, key + 1);
                    }
                })
        } else {
            this.noitifi.toastSuccess("Cập nhật thành công");
            this.displayModal = false;
        }
    }

    convertClassAndCalendar(_data_sql) {
        this.displayModal = true;
        this.progressValue = 0;
        this.waitting_title = "Đang lấy dữ liệu môn học, vui lòng đợi";
        this.show_return = false;
        const data_monhoc = []
        this.loopGetMonHocForClass(data_monhoc, 1, 1000, _data_sql);
    }


    loopGetMonHocForClass(data_monhoc, page, count, _data_sql) {
        if (data_monhoc.length < count) {
            this.progressValue = data_monhoc.length / count * 100;
            const condtition_profile: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '100' }
                ],
                page: page.toString()
            }
            this.elnKhoaHocService.getKhoaHocByPageNew_2(condtition_profile).subscribe({
                next: (_profile) => {
                    this.loopGetMonHocForClass(data_monhoc.concat(_profile.data), page + 1, _profile.recordsFiltered, _data_sql)
                },
                error: () => {
                    this.displayModal = false;
                    this.noitifi.toastError("Kết nối thất bại, vui lòng ấn f5 để thử lại");
                }
            })
        } else {
            const data_class = [];
            this.waitting_title = "Đang lấy dữ liệu lớp học, vui lòng đợi";
            this.loopGetClassTocheck(data_class, 1, 1000, _data_sql, data_monhoc);
        }
    }

    loopGetClassTocheck(data_class, page: number, count, _data_sql, data_monhoc) {
        if (data_class.length < count) {
            const condition_lop: ConditionOption = {
                condition: [
                    { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: this._info_hocky.hocky, orWhere: 'and' },
                    { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: this._info_hocky.namhoc, orWhere: 'and' }
                ],
                set: [{ label: 'limit', value: '100' }],
                page: page.toString()
            }

            this.classesService.getClassesByPageNew(condition_lop).subscribe({
                next: (_class) => {
                    this.loopGetClassTocheck(data_class.concat(_class.data), page + 1, _class.recordsFiltered, _data_sql, data_monhoc)
                },
                error: () => {
                    this.displayModal = false;
                    this.noitifi.toastError("Kết nối thất bại, vui lòng ấn f5 để thử lại");
                }
            })
        } else {
            const data_teacher = [];
            this.waitting_title = "Đang lấy dữ liệu giảng viên, vui lòng đợi";
            this.loopGetTeacherForClass(data_teacher, 1, 1000, _data_sql, data_monhoc, data_class);
        }
    }

    loopGetTeacherForClass(_data_teacher, page, count, _data_sql, data_monhoc, data_class) {
        if (_data_teacher.length < count) {
            this.progressValue = _data_teacher.length / count * 100;
            const condtition_profile: ConditionOption = {
                condition: [
                    { conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
                ],
                set: [
                    { label: 'limit', value: '100' }
                ],
                page: page.toString()
            }
            this.elngUserProfileService.getUserProfileByPageNewV2(condtition_profile).subscribe({
                next: (_profile) => {
                    this.loopGetTeacherForClass(_data_teacher.concat(_profile.data), page + 1, _profile.recordsFiltered, _data_sql, data_monhoc, data_class)
                },
                error: () => {
                    this.displayModal = false;
                    this.noitifi.toastError("Kết nối thất bại, vui lòng thử lại")
                }
            })
        } else {
            this.displayModal = false;
            this.show_return = false;
            const object_lop = {};
            const list_class = [];
            let _calendar = [];
            _data_sql.forEach((f, key) => {
                const mahp = f[3];
                let kyhieu = null;
                const kyhieu_lop = this.helperService.slugVietnamese(f[4].trim());
                if (f[4].trim().indexOf('(') !== -1) {
                    kyhieu = f[4] ? f[4].trim().split("(")[1].replace(")", "") : null;
                }

                if (f[10] && f[1]) {
                    const ar_date = f[10].trim().split("-");
                    if (ar_date[0] && ar_date[1]) {
                        if (ar_date[0].split("/").length == 2)
                            ar_date[0] = ar_date[0].trim().concat("/", ar_date[1].trim().split("/")[2].trim());
                    }

                    const date_start = ar_date[0];
                    const date_end = ar_date[1];
                    _calendar = _calendar.concat(this.compareDateAndGetDate(f[1], date_start, date_end, f[2], f[8], f[4].trim(), f[6], _data_teacher, f['group']));
                }

                const object = {
                    index_: key + 1,
                    name: f[4] ? f[4].trim() : null,
                    mahp: mahp,
                    kyhieu: kyhieu,
                    sotinchi: f[6],
                    slug: this.helperService.slugVietnamese(f[4].trim()),
                    status: 1,
                    manager_ids: null,
                    manager_info: null,
                    khoa: null,
                    dothoc: null,
                    sosv_dangky: f[7],
                    image: null,
                    hocky: f['hocky'],
                    namhoc: f['namhoc'],
                    email: null,
                    mahp_slug: mahp,
                    name_giaovien: null,
                    khoa_bomon: null,
                    import: false,
                    import_label: 'Chưa import',
                    duplicate: 'không',
                    teacher_code: [f['group']],
                    category_id: 0,
                    course_id: 0,
                    nganh_bomon_id: 0,
                    course_info: null,
                    show_teacher_code: null,
                    key_status: f[5].trim().toLowerCase() === 'lt' ? 'not_import' : 'no_import',
                    class_type: f[5].trim().toLowerCase() === 'lt' ? 'class_lt' : 'class_th'
                }

                const key_object_check = kyhieu_lop.concat("_", f[5].trim().toLowerCase());
                if (!object_lop[key_object_check]) {
                    object_lop[key_object_check] = object;
                    object.manager_ids = [];
                    object.manager_info = [];
                    const index = _data_teacher.findIndex(m => m.student_code === f['group'].toLowerCase());
                    object.show_teacher_code = object.teacher_code.join(" ,");
                    if (index !== -1) {
                        object.manager_ids = [_data_teacher[index].user_id];
                        object.manager_info = [_data_teacher[index].full_name.concat('*')];
                    } else {
                        object['key_status'] = object['key_status'].concat(', no_teacher');
                    }

                    const index_category = data_monhoc.findIndex(m => m.maso === object.mahp);
                    if (index_category !== -1) {
                        object.category_id = data_monhoc[index_category].category_ids;
                        object.course_id = data_monhoc[index_category].id;
                        object.nganh_bomon_id = data_monhoc[index_category].nganh_bomon_id;
                        object.course_info = { "title": data_monhoc[index_category].title };
                    } else {
                        object['key_status'] = object['key_status'].concat(', no_category');
                    }

                    const index_class = data_class.findIndex(m => m.slug === object.slug);

                    if (index_class !== -1) {
                        object['key_status'] = object['key_status'].concat(', exist');
                    }

                    list_class.push(object_lop[key_object_check]);
                } else {
                    const index = object_lop[key_object_check].teacher_code.findIndex(m => m === f['group'].toLowerCase());
                    if (index === -1) {
                        const index_teacher_next = _data_teacher.findIndex(m => m.student_code === f['group'].toLowerCase());
                        if (index_teacher_next !== -1) {
                            object_lop[key_object_check].manager_ids.push(_data_teacher[index_teacher_next].user_id);
                            object_lop[key_object_check].manager_info.push(_data_teacher[index_teacher_next].full_name);
                        } else if (!object_lop[key_object_check].manager_ids || !object_lop[key_object_check].manager_ids.length) {
                            object_lop[key_object_check]['key_status'] = object_lop[key_object_check]['key_status'].concat(', no_teacher');
                        }

                        object_lop[key_object_check].show_teacher_code = object_lop[key_object_check].show_teacher_code.concat(", ", f['group']);
                        object_lop[key_object_check].teacher_code.push(f['group']);

                    }
                    const index_category = data_monhoc.findIndex(m => m.maso === object.mahp);
                    if (index_category !== -1) {
                        object_lop[key_object_check].category_id = data_monhoc[index_category].category_ids;
                        object_lop[key_object_check].course_id = data_monhoc[index_category].id;
                        object_lop[key_object_check].nganh_bomon_id = data_monhoc[index_category].nganh_bomon_id;
                        object_lop[key_object_check].course_info = { "title": data_monhoc[index_category].title };
                    } else {
                        object_lop[key_object_check]['key_status'] = object_lop[key_object_check]['key_status'].concat(', no_category');
                    }
                }
            })

            // _calendar.forEach(f => {
            //     const index = list_class.findIndex(m => m['slug'] === f['class_name_slug']);
            //     if (index !== -1) {
            //         f['teacher_ids'] = list_class[index]['manager_ids'];
            //     }
            // })

            this.list_lopImport = list_class;
            this.list_calendarImport = _calendar;
            this.countStatus(this.STATUS_IMPORT_CLASS, this.list_lopImport);
            if (list_class[0]) {
                this.select_class_calendar = list_class[0];
                this.list_class_calendar = _calendar.filter(m => m.class_name_slug === this.select_class_calendar.slug)
            }

        }
    }

    compareDateAndGetDate(thu, start, end, tiet, diadiem, class_name, sotc, _data_teacher, group): any[] {
        let calendar_s = [];
        const arstart = start.split("/");
        const d_start = arstart[2].concat("-", arstart[1], "-", arstart[0]);

        const arend = end.split("/");
        const d_end = arend[2].concat("-", arend[1], "-", arend[0]);

        const object_date_plus = {
            8: 0,
            2: 1,
            3: 2,
            4: 3,
            5: 4,
            6: 5,
            7: 6,
        }

        const object_date = {
            0: 8,
            1: 2,
            2: 3,
            3: 4,
            4: 5,
            5: 6,
            6: 7,
        }

        let S_Date = new Date(d_start);
        let plus_day = 0;
        if (object_date_plus[Number(thu)] > S_Date.getDay()) {
            plus_day = (object_date_plus[Number(thu)] - S_Date.getDay());
        } else if (object_date_plus[Number(thu)] < S_Date.getDay()) {
            plus_day = (7 - S_Date.getDay()) + object_date_plus[Number(thu)];
        }
        let StartDate = new Date(S_Date.setDate(S_Date.getDate() + plus_day));
        while (StartDate < new Date(d_end)) {
            const index = _data_teacher.findIndex(m => m.student_code === group.toLowerCase());
            const calendar = {
                class_id: 0,
                tuan: 0,
                ngay: this.helperService.strToSQLDate(StartDate.toString()),
                thu: object_date[StartDate.getDay()],
                tiet: tiet,
                diadiem: diadiem,
                class_name_slug: this.helperService.slugVietnamese(class_name),
                import: false,
                import_label: 'Chưa import',
                duplicate: 'không',
                date_vn: StartDate.toLocaleString("en-GB").split(",")[0],
                class_name: class_name,
                sotc: sotc,
                teacher_ids: index !== -1 ? "|" + _data_teacher[index].user_id.toString() + "|" : null,
                teachers: index !== -1 ? '<span class="tag-user-name">'.concat(_data_teacher[index].full_name, '</span>') : null,
            }

            StartDate = new Date(StartDate.setDate(StartDate.getDate() + 7));
            calendar_s.push(calendar);
        }
        return calendar_s;
    }

    chooseClassCalendar(classes) {
        this.select_class_calendar = classes;
        this.list_class_calendar = this.list_calendarImport.filter(m => m.class_name_slug === this.select_class_calendar.slug)
    }

    startImportLophocCalendar() {
        this.noitifi.confirm("Bạn có chắc chắn muốn import không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                this.show_return = false;
                this.progressValue = 0;
                this.displayModal = true;
                this.import_return = 0;
                this.open_step = true;
                this.activeIndex_step = 0;
                this.waitting_title = "Đang đồng bộ lớp học, vui lòng không tắt trình duyệt";
                const data = [];
                let i = 0;
                data[i] = [];
                this.list_lopImport.forEach(f => {
                    if (f['class_type'] === 'class_lt') {
                        if (data[i].length < 10) {
                            data[i].push(f);
                        } else {
                            i = i + 1;
                            data[i] = [];
                            data[i].push(f);
                        }
                    }
                })
                this.loopImportLopHocBe(data[0], data, 0);
            }

        })
    }

    loopImportLopHocBe(data: any[], datas: any[], key) {
        if (key < datas.length) {
            this.progressValue = (key + 1) / datas.length * 100;
            const request: Observable<any>[] = [];
            data.forEach((f, fkey) => {
                const data_class: Classes = {
                    name: f.name,
                    slug: f.slug,
                    course_id: f.course_id,
                    course_info: f.course_info,
                    user_id: 0,
                    manager_ids: f.manager_ids && f.manager_ids.length ? "|".concat(f.manager_ids.join("|"), "|") : null,
                    manager_info: f.manager_ids && f.manager_ids.length ? f.manager_info.toString() : null,
                    status: f.status,
                    image: null,
                    hocky: f.hocky,
                    namhoc: f.namhoc,
                    kyhieu: f.kyhieu,
                    sotinchi: f.sotinchi,
                    category_id: f.category_id,
                    khoa: f.khoa,
                    dothoc: f.dothoc,
                    sosv_dangky: f.sosv_dangky,
                    link_googlemeet: [],
                    donvi_chuyenmon_id: 0,
                    nganh_bomon_id: f.nganh_bomon_id,
                }

                if (data_class.kyhieu && data_class.manager_ids && data_class.category_id) {
                    const condition_lop: ConditionOption = {
                        condition: [
                            { conditionName: 'slug', condition: OvicQueryCondition.equal, value: data_class.slug, orWhere: 'and' },
                            { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: data_class.hocky, orWhere: 'and' },
                            { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: data_class.namhoc, orWhere: 'and' }
                        ],
                        set: [{ label: 'limit', value: '1' }],
                        page: '1'
                    }
                    request.push(this.classesService.getClassesByPageNew(condition_lop).pipe(
                        catchError(() => {
                            f['import'] = false;
                            f['import_label'] = 'Thất bại';
                            f['key_status'] = 'failed';
                            return of(null);
                        }),
                        mergeMap(_resClass => {
                            if (_resClass.recordsFiltered) {
                                this.list_calendarImport.forEach(m => {
                                    if (m.class_name_slug === data_class.slug) {
                                        m.class_id = _resClass.data[0].id;
                                    }
                                })
                                if (!this.ghi_de) {
                                    f['import'] = true;
                                    f['import_label'] = 'Đã có';
                                    f['key_status'] = 'done';
                                    return of(null);
                                } else {
                                    return this.classesService.updateDataClasses(_resClass.data[0].id, data_class).pipe(
                                        catchError(() => {
                                            f['import'] = false;
                                            f['import_label'] = 'Thất bại';
                                            f['key_status'] = 'failed';
                                            return of(null);
                                        }),
                                        mergeMap(() => {
                                            f['import'] = true;
                                            f['import_label'] = 'Thành công';
                                            f['key_status'] = 'done';
                                            return of(null);
                                        }))
                                }
                            } else {
                                return this.classesService.createDataClasses(data_class).pipe(
                                    catchError(() => {
                                        f['import'] = false;
                                        f['import_label'] = 'Thất bại';
                                        f['key_status'] = 'failed';
                                        return of(null);
                                    }),
                                    mergeMap(_res => {
                                        this.list_calendarImport.forEach(m => {
                                            if (m.class_name_slug === data_class.slug) {
                                                m.class_id = _res;
                                            }
                                        })

                                        f['import'] = true;
                                        f['import_label'] = 'Thành công';
                                        f['key_status'] = 'done';
                                        return of(null);
                                    }))
                            }
                        })))
                } else {

                }
            })

            if (request.length) {
                forkJoin(request).subscribe({
                    next: () => {
                        this.loopImportLopHocBe(datas[key + 1], datas, key + 1);
                    },
                    error: () => {
                        this.loopImportLopHocBe(datas[key + 1], datas, key + 1)
                    }
                })
            } else {
                this.loopImportLopHocBe(datas[key + 1], datas, key + 1)
            }
        } else {
            // const data_ = [];
            // let i = 0;
            // data_[i] = [];
            // this.list_calendarImport.forEach(f => {
            //     if (data_[i].length < 20) {
            //         data_[i].push(f);
            //     } else {
            //         i = i + 1;
            //         data_[i] = [];
            //         data_[i].push(f);
            //     }
            // })
            this.activeIndex_step = 1;
            this.import_return = 0;
            this.waitting_title = "Đang đồng bộ dữ liệu lịch giảng dạy, vui lòng không tắt trình duyệt";
            const data = this.list_calendarImport.filter(m => m['teacher_ids'] && m['teacher_ids'] !== '');
            const data_import = [];
            let i = 0;
            data_import[0] = [];
            this.countStatus(this.STATUS_IMPORT_CLASS, this.list_lopImport);
            data.forEach(f => {
                if (data_import[i].length < 20) {
                    data_import[i].push(f);
                } else {
                    i = i + 1;
                    data_import[i] = [];
                    data_import[i].push(f);
                }
            })
            this.calendar_import_count.failed = 0;
            if (this.ghide_calendar) {
                forkJoin([
                    this.dateService.getCurrentDateTime(),
                    this.fileService.getFileLocalAsBlob("..\\assets\\json\\lich_giang_day.json")
                ]).subscribe({
                    next: ([datetime, _res]) => {
                        const reader = new FileReader();
                        reader.readAsBinaryString(_res);
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
                                    this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
                                    this.progressValue = 0;
                                    this.displayModal = false;
                                }
                            })

                        };
                    },
                    error: () => {
                        this.progressValue = 0;
                        this.displayModal = false;
                        this.noitifi.toastError("Không tải được lịch giảng dạy, vui lòng thử lại");
                    }
                })
            } else {
                this.show_return = true;
                this.waitting_title = "Đang tạo lịch, vui lòng không tắt trình duyệt";
                this.loopAddCalendar(data_import[0], data_import, 0);
            }
        }
    }

    countStatus(status_keys, data) {
        this.show_count_status['sum_data'] = data.length;
        status_keys.forEach(f => {
            if (f.key !== 'sum_data' && f.key !== 'class_lt' && f.key !== 'class_th') {
                if (f.key === 'not_import') {
                    this.show_count_status[f.key] = data.filter(m => m['key_status'].indexOf(f.key) !== -1 && m['class_type'] === 'class_lt').length;
                } else {
                    this.show_count_status[f.key] = data.filter(m => m['key_status'].indexOf(f.key) !== -1).length;
                }
            } else {
                if (f.key === 'class_lt' || f.key === 'class_th') {
                    this.show_count_status[f.key] = data.filter(m => m['class_type'] === f.key).length;
                }
            }
        })
    }

    filterByKeyStatus(status) {
        this.select_key_status = status;
        if (status['key'] !== 'sum_data') {
            // if (status['key'] === 'not_import') {
            //     this.show_count_status[f.key] = data.filter(m => m['key_status'].indexOf(f.key) !== -1 && m['class_type'] === 'class_lt').length;
            // } else {
            //     this.show_count_status[f.key] = data.filter(m => m['key_status'].indexOf(f.key) !== -1).length;
            // }
            this.search_class = status['key'];
        } else {
            this.search_class = '';
        }
    }

    clickToInputFilter() {
        // this.col_filter = ['name', 'key_status', 'class_type'];
    }

    onChangeFilterImportClass(event) {

    }

    openSelectDownloadCourse() {
        this.loadNamhocHocky();
    }

}
