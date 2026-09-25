import { HvuApiDanhsachSinhvienTheoLopService } from '@shared/services/hvu-api-danhsach-sinhvien-theolop.service';
import { user_info } from '@shared/models/class-student';
import { ClassPlanActivitiesService } from '@shared/services/class-plan-activities.service';
import { ClassStudentDiemdanhService } from '@shared/services/class-student-diemdanh.service';
import { ClassPlanActivityStudentTestsService } from '@shared/services/class-plan-activity-student-tests.service';
import {
    Component,
    ElementRef,
    Input,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { BUTTON_CLOSED, BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { OvicQueryCondition } from '@core/models/dto';
import { FileService } from '@core/services/file.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { APP_CONFIGS } from '@env';
import { ClassStudent } from '@modules/shared/models/class-student';
import { Classes, GROUP, PARAMS } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ExportExcelSheetsService } from '@modules/shared/services/export-excel-sheets.service';
import {
    KEY_ANSWER_new,
    LARGE_MODAL_OPTIONS,
    MAXIMIZE_MODAL_OPTIONS,
    OB_STATUS_IMPORT_ONE_STUDENT,
    STATUS_IMPORT_CLASS,
    STATUS_IMPORT_ONE_STUDENT,
    STATUS_IMPORT_STUDENT_CLASS,
} from '@modules/shared/utils/syscat';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { saveAs } from 'file-saver';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { catchError, concatMap, forkJoin, mergeMap, Observable, of, tap, throwError } from 'rxjs';
import * as XLSX from 'xlsx';
import { ClassesService } from '@modules/shared/services/classes.service';
import { RegisterGroupStatusService } from '@modules/shared/services/register-group.service';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { STATUS_COUNT_KEY } from '@modules/shared/models/status-import';
import { ClassPlanActivityTuluanService } from '@modules/shared/services/class-plan-activity-tuluan-service';
import { NORMAL_MODAL_OPTIONS } from '@core/utils/syscat';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { ClassStudentDiemdanh } from '@modules/shared/models/class-student-diemdanh';
import { AuthService } from '@core/services/auth.service';
import { SharedModule } from '@modules/shared/shared.module';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ButtonModule } from 'primeng/button';
import { ClassPlanActivitiesTestsService } from '@modules/shared/services/class-plan-activities-tests.service';
import { HelperService } from '@core/services/helper.service';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';

export interface CLASS_GROUPS {
    group: number,
    group_name: string,
    children: any[],
    member_number: number,
    leader_id: number,
    leader_profile: any,
    members: number[],
    register_member: number,
    group_point?: number,
}

export interface TOPICS {
    group: number,
    topic: string,
    leader_name: string,
    member_number: number,
    leader_id: number,
    group_point: number,
}

@Component({
    selector: 'app-sinhvien-hvu',
    standalone: true,
    imports: [CommonModule, SharedModule, TableModule, PaginatorModule, NgbTooltipModule, MatListModule, CheckboxModule, DialogModule, DividerModule, MatProgressBarModule, ButtonModule],
    templateUrl: './sinhvien-hvu.component.html',
    styleUrls: ['./sinhvien-hvu.component.css']
})
export class SinhvienHvuComponent implements OnInit {
    @Input() classSelected: Classes;

    @ViewChild('templateImportSinhvien') templateImportSinhvien: ElementRef;

    @ViewChild('templateListStudentGroup')
    templateListStudentGroup: TemplateRef<any>;

    @ViewChild('paginator', { static: true }) paginator: Paginator;

    @ViewChild('inputImport') inputImport: ElementRef;

    @ViewChild('templateClassInfo') templateClassInfo: ElementRef;

    @ViewChild('templateListClass') templateListClass: TemplateRef<any>;

    list_student: ClassStudent[] = [];

    list_student_import: any[] = [];

    listStudentGroup: CLASS_GROUPS[] = [];

    selectedGroup: CLASS_GROUPS;

    openGroupStudent: boolean = false;

    search_student: string;

    displayModal = false;

    progressValue = 0;

    keyAnswer = KEY_ANSWER_new;

    waitting_title: string;

    total_student: number = 0;

    limit_student: number = 20;

    student_one_add: ElngUserProfile;

    display_add_student: boolean = false;

    cols_student: any[] = [];

    group_member = {
        total_member: 0,
        register_member: 0,
    };

    max_group: number;

    formTitle: string;

    total_student_group: number = 0;

    listStudentNoneGroup: ClassStudent[];

    show_count_status: STATUS_COUNT_KEY;

    select_key_status: any;

    STATUS_IMPORT_STUDENT_CLASS = STATUS_IMPORT_ONE_STUDENT;

    OB_STATUS_IMPORT_ONE_STUDENT = OB_STATUS_IMPORT_ONE_STUDENT;

    student_import_cols: any[];

    list_class: Classes[];

    search_class: string;

    selectedStudent: ClassStudent;

    selectedOtherClass: Classes;

    displaySyncClass: boolean = false;

    list_week_test: any[] = [];

    list_tx_test: ClassPlanActivities[] = [];

    selectedWeekTest: any[] = [];

    selectedTxTest: any[] = [];

    selectDiemdanh: boolean = false;

    ghide_test: boolean = false;

    list_diemdanh: ClassStudentDiemdanh[] = [];

    isImporting: boolean = false;

    importComparison = {
        currentStudentCount: 0,
        sourceStudentCount: 0,
        eligibleImportCount: 0,
        existingStudentCount: 0,
        newStudentCount: 0,
        missingFromSourceCount: 0,
        invalidStudentCount: 0,
        duplicateStudentCount: 0,
        countChanged: false,
        membershipChanged: false,
    };

    constructor(
        private fileService: FileService,
        private modalService: NgbModal,
        private noitifi: NotificationService,
        private classStudentService: ClassStudentService,
        private exportExcelSheetsService: ExportExcelSheetsService,
        private elngUserProfileService: ElngUserProfileService,
        private userService: UserService,
        private classesService: ClassesService,
        private registerGroupStatusService: RegisterGroupStatusService,
        private classPlanActivitiesTestsService: ClassPlanActivitiesTestsService,
        private classPlanActivityStudentTestsService: ClassPlanActivityStudentTestsService,
        private classPlanActivityTuluanService: ClassPlanActivityTuluanService,
        private classStudentDiemdanhService: ClassStudentDiemdanhService,
        private helperService: HelperService,
        private classPlanActivitiesService: ClassPlanActivitiesService,
        private auth: AuthService,
        private hvuApiDanhsachSinhvienTheoLopService: HvuApiDanhsachSinhvienTheoLopService
    ) {

    }

    ngOnInit(): void {
        this.cols_student = [
            { label: '#', class: 'ovic-w-80px text-center', key: 'index_' },
            {
                label: 'Mã sinh viên',
                class: 'ovic-w-200px text-left',
                key: 'student_code',
            },
            { label: 'Họ tên', class: 'text-left', key: 'full_name' },
            {
                label: 'Ngày sinh',
                class: 'ovic-w-100px text-center',
                key: 'birthday',
            },
            {
                label: 'Thao tác',
                class: 'ovic-w-120px text-center',
                key: 'action',
            },
        ];

        this.student_import_cols = [
            // { label: '#', class: 'ovic-w-80px text-center', key: 'index_' },
            {
                label: 'Mã sinh viên',
                class: 'ovic-w-250px text-left',
                key: 'student_code',
            },
            {
                label: 'Họ tên',
                class: 'text-left name-student-homework-post',
                key: 'full_name',
            },
            {
                label: 'Ngày sinh',
                class: 'ovic-w-150px text-center',
                key: 'birthday',
            },
            { label: 'Email', class: 'ovic-w-250px text-left', key: 'email' },
            {
                label: 'Trạng thái',
                class: 'ovic-w-250px text-center',
                key: 'status_import',
                object_key: true,
            },
        ];

        this.loadStudentClass_v2(1, this.limit_student);
    }

    loadStudentClass_v2(page, limit) {
        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],
            set: [
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'limit', value: limit },
            ],
            page: page,
        };

        if (this.search_student) {
            condition.condition.push({
                conditionName: 'user_info',
                condition: OvicQueryCondition.like,
                value: '%' + this.search_student.trim() + '%',
                orWhere: 'and',
            });
        }

        this.noitifi.isProcessing(true);

        this.classStudentService.getClassStudentByPageNew(condition).subscribe({
            next: (_resStudent) => {
                this.total_student = _resStudent.recordsFiltered;
                if (_resStudent.data) {
                    const tmp = [];
                    // this.objectClassStudent = {};
                    const _index_start = (page - 1) * Number(limit);
                    _resStudent.data.forEach((f, key) => {
                        f['index_'] = _index_start + key + 1;
                        f['name'] = f.user_info['name'];
                        f['full_name'] = f.user_info['full_name'];
                        f['birthday'] = f.user_info['birthday'] ? f.user_info['birthday'] : 'Không có';
                        f['email'] = f.user_info['email'];
                        f['student_code'] = f.user_info['student_code'];
                        f['student_status'] = f.status === -1 ? '<span class="student-stop-learning">Bỏ học</span>' : '<span class="student-is-learning">Đang hoạt động</span>';
                        f['student_status'] = f.status === 0 ? '<span class="student-is-waitting">Chờ duyệt</span>' : f['student_status'];
                        tmp.push(f);
                    });

                    this.list_student = tmp;

                    if (this.search_student && !_resStudent.data.length) {
                        this.getOneStudent(this.search_student.trim());
                    }
                } else {
                    this.list_student = [];
                }
                this.noitifi.isProcessing(false);
            },
            error: (e) => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Không tải được dữ liệu, lỗi kết nối');
            },
        });
    }

    getOneStudent(student_code: string) {
        if (student_code) {
            this.noitifi.isProcessing(true);
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: 'student_code',
                        condition: OvicQueryCondition.equal,
                        value: student_code.toLowerCase(),
                    },
                ],
                set: [],
                page: null,
            };

            this.elngUserProfileService
                .getUserProfileByPageNewV2(condition)
                .pipe(
                    mergeMap((_profile) => {
                        if (_profile.data.length) {
                            const user_id = _profile.data[0].user_id;
                            if (user_id) {
                                return this.userService
                                    .getUserByCol('id', user_id.toString())
                                    .pipe(
                                        mergeMap((_user) => {
                                            if (_user.length) {
                                                _profile.data[0]['email'] =
                                                    _user[0].email;
                                                return of(_profile);
                                            } else {
                                                return of(null);
                                            }
                                        })
                                    );
                            } else {
                                return of(null);
                            }
                        }
                        return of(null);
                    })
                )
                .subscribe({
                    next: (_student) => {
                        this.noitifi.isProcessing(false);
                        if (_student && _student.data && _student.data.length) {
                            this.student_one_add = _student.data[0];
                            this.display_add_student = true;
                        } else {
                            this.student_one_add = null;
                            this.noitifi
                                .confirm(
                                    'Sinh viên có mã (' +
                                    this.search_student +
                                    ') chưa được cấp tài khoản, vui lòng liên hệ phòng Công tác Học sinh, sinh viên để được cấp tài khoản',
                                    'Thông báo',
                                    [BUTTON_CLOSED]
                                )
                                .then(
                                    () => { },
                                    () => { }
                                );
                        }
                    },
                    error: () => {
                        this.student_one_add = null;
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Lỗi kết nối');
                    },
                });
        }
    }

    addOneStudent() {
        if (this.student_one_add) {
            const student = {
                student_id: this.student_one_add.id,
                class_id: this.classSelected.id,
                user_id: this.student_one_add.user_id,
                user_info: {
                    name: this.student_one_add.name,
                    full_name: this.student_one_add.full_name,
                    birthday: this.student_one_add.birthday,
                    student_code: this.student_one_add.student_code,
                    email: this.student_one_add['email'],
                },
                status: 1,
                hocky: this.classSelected.hocky,
                namhoc: this.classSelected.namhoc,
            };
            this.noitifi.isProcessing(true);
            this.classStudentService.addClassStudent(student).subscribe({
                next: () => {
                    this.noitifi.toastSuccess('Thêm thành công');
                    this.noitifi.isProcessing(false);
                    this.display_add_student = false;
                    this.loadStudentClass_v2(1, this.limit_student);
                },
                error: () => {
                    this.display_add_student = false;
                    this.noitifi.toastError('Thêm thất bại');
                    this.noitifi.isProcessing(false);
                },
            });
        } else {
            this.display_add_student = false;
            this.noitifi.toastWarning('Không tìm thấy sinh viên');
        }
    }

    deleteStudentClass(event) {
        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.classStudentService
                        .deleteClassStudent(event)
                        .subscribe({
                            next: () => {
                                this.noitifi.toastSuccess('Xoá thành công');
                                this.firstPageSet();
                            },
                            error: () =>
                                this.noitifi.toastError('Xóa thất bại'),
                        });
                }
            },
            () => null
        );
    }

    onSearchStudent(event) {
        this.student_one_add = null;
        this.search_student = event;
        this.firstPageSet();
    }

    firstPageSet() {
        // if (this.paginator && !this.paginator.empty()) {
        //     this.paginator.changePage(0);
        // } else {
        this.loadStudentClass_v2(1, this.limit_student);
    }

    downLoadExFile() {
        this.fileService
            .downloadFileAsBlob(
                '..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 03 - 03 Import cau hoi bai tap bo tro - trac nghiem.docx'
            )
            .subscribe((res) => {
                saveAs(
                    res,
                    'Mau 03 - 03 Import cau hoi bai tap bo tro - trac nghiem.docx'
                );
            });
    }

    openAddImportSinhvien() {
        this.list_student_import = [];
        this.resetImportComparison();
        this.modalService.open(
            this.templateImportSinhvien,
            MAXIMIZE_MODAL_OPTIONS
        );
    }

    changeShowStudent() {
        this.openGroupStudent = !this.openGroupStudent;
        this.search_student = null;
        if (this.openGroupStudent) this.loadListGroup();
    }

    changePage_student(event) {
        this.loadStudentClass_v2(event.page + 1, this.limit_student);
    }

    deleteStudents() {
        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.classStudentService
                        .deleteClassStudentByCol(
                            this.classSelected.id.toString(),
                            'class_id'
                        )
                        .subscribe({
                            next: () => {
                                this.loadStudentClass_v2(1, this.limit_student);
                            },
                            error: () =>
                                this.noitifi.toastError('Xóa thất bại'),
                        });
                }
            },
            () => null
        );
    }

    downloadFile() {
        this.downLoadExStudent([]);
        // const data = [];
        // this.displayModal = true;
        // this.progressValue = 0;
        // this.waitting_title = 'Đang tải dữ liệu, vui lòng chờ';
        // this.loopStudentToDownload(data, 1, 1000);
    }

    loopStudentToDownload(data: ClassStudent[], page, count: number) {
        if (data.length < count) {
            this.progressValue = (data.length / count) * 100;
            const option: ConditionOption = {
                condition: [
                    {
                        conditionName: 'class_id',
                        condition: OvicQueryCondition.equal,
                        value: this.classSelected.id.toString(),
                    },
                ],
                set: [
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'ordering' },
                ],
                page: page,
            };

            this.classStudentService
                .getClassStudentByPageNew(option)
                .subscribe({
                    next: (_student) => {
                        this.loopStudentToDownload(
                            data.concat(_student.data),
                            page + 1,
                            _student.recordsFiltered
                        );
                    },
                    error: () => {
                        this.displayModal = false;
                        this.noitifi.toastError(
                            'Lỗi kết nối, vui lòng thử lại'
                        );
                    },
                });
        } else {
            this.progressValue = 100;
            const tmp = [];
            const object_ClassStudent = {};
            data.forEach((f, key) => {
                f['name'] = f.user_info['name'];
                f['full_name'] = f.user_info['full_name'];
                f['birthday'] = f.user_info['birthday']
                    ? f.user_info['birthday']
                    : 'Không có';
                f['email'] = f.user_info['email'];
                f['student_code'] = f.user_info['student_code'];
                f['student_status'] =
                    f.status === -1
                        ? '<span class="student-stop-learning">Bỏ học</span>'
                        : '<span class="student-is-learning">Đang hoạt động</span>';
                f['student_status'] =
                    f.status === 0
                        ? '<span class="student-is-waitting">Chờ duyệt</span>'
                        : f['student_status'];
                if (!object_ClassStudent[f.id]) {
                    object_ClassStudent[f.id] = f;
                }
                tmp.push(f);
            });

        }
    }

    downLoadExStudent(dmClassStudent) {
        // if (dmClassStudent && dmClassStudent.length) {
        //     this.fileService
        //         .getFileLocalAsBlob(
        //             '..\\assets\\files\\mau_file_import_LMS-LCMS\\BangDiemDanhTKT.xls'
        //         )
        //         .subscribe((res) => {
        //             const file = res;
        //             const reader = new FileReader();
        //             reader.readAsArrayBuffer(file);
        //             reader.onloadend = (event) => {
        //                 const localUrl = reader.result;
        //                 const wb: XLSX.WorkBook = XLSX.read(localUrl, {
        //                     type: 'binary',
        //                 });
        //                 const wsname: string = wb.SheetNames[0];
        //                 const ws: XLSX.WorkSheet = wb.Sheets[wsname];
        //                 const data = XLSX.utils.sheet_to_json(ws, {
        //                     header: 1,
        //                 });
        //                 const mergesData = [];
        //                 const mergesDataFooter = [];
        //                 const objectRoom = {};
        //                 let i = 0;
        //                 const footerData = data.splice(28, 15);
        //                 const headerData = data.splice(0, 11);
        //                 const newHeaderData = [];
        //                 const tableHeader = [];
        //                 headerData.forEach((f, key) => {
        //                     if (Array.isArray(f)) {
        //                         if (!f[0]) {
        //                             f[0] = '';
        //                         }
        //                     }
        //                     if (key < 9) {
        //                         newHeaderData.push(f);
        //                     } else {
        //                         tableHeader.push(f);
        //                     }
        //                 });
        //                 const newFooterData = [];
        //                 footerData.forEach((f, key) => {
        //                     if (Array.isArray(f)) {
        //                         if (!f[0]) {
        //                             f[0] = '';
        //                         }
        //                     }
        //                     newFooterData.push(f);
        //                 });
        //                 const today = new Date();
        //                 let _date =
        //                     today.getDate() < 10
        //                         ? '0'.concat(today.getDate().toString())
        //                         : today.getDate().toString();
        //                 let _month =
        //                     today.getMonth() + 1 < 10
        //                         ? '0'.concat((today.getMonth() + 1).toString())
        //                         : (today.getMonth() + 1).toString();
        //                 let _yeah = today.getFullYear().toString();
        //                 objectRoom[this.classSelected.id] = {};
        //                 objectRoom[this.classSelected.id]['dataTable'] = [];
        //                 dmClassStudent.forEach((f, key) => {
        //                     objectRoom[this.classSelected.id]['dataTable'].push(
        //                         this.dataByClass(f, key + 1)
        //                     );
        //                 });
        //                 Object.keys(objectRoom).forEach((f, key) => {
        //                     objectRoom[f]['header'] = [];
        //                     newHeaderData.forEach((he, heKey) => {
        //                         objectRoom[f]['header'].push([...he]);
        //                     });
        //                     console.log(objectRoom[f]['header']);
        //                     // objectRoom[f]["header"][0][0] = APP_CONFIGS.donviquanly.toUpperCase();
        //                     // objectRoom[f]["header"][1][0] = APP_CONFIGS.donvitructhuoc.toUpperCase();
        //                     // objectRoom[f]["header"][3][0] = "BẢNG ĐIỂM LỚP HỌC PHẦN " + this.classSelected.name.toUpperCase();

        //                     objectRoom[f]['header'][5][2] =
        //                         this.classSelected.name;
        //                     objectRoom[f]['header'][5][12] = 'Học kỳ '.concat(
        //                         this.classSelected.hocky,
        //                         ' Năm học ',
        //                         this.classSelected.namhoc
        //                     );
        //                     // objectRoom[f]["header"][6][0] = "Số tín chỉ: " + this.classSelected.sotinchi;
        //                     // objectRoom[f]["header"][4][11] = "Ngày thi: ".concat(this.selectedCathi.time_start_format);
        //                     objectRoom[f]['tableHeader'] = tableHeader;
        //                     objectRoom[f]['footer'] = [];
        //                     newFooterData.forEach((ft, ftKey) => {
        //                         objectRoom[f]['footer'].push([...ft]);
        //                     });
        //                     objectRoom[f]['footer'][1][0] =
        //                         'Danh sách có: ' +
        //                         objectRoom[f]['dataTable'].length +
        //                         ' Sinh viên';
        //                     objectRoom[f]['footer'][2][10] =
        //                         'Thái Nguyên, ngày '.concat(
        //                             _date,
        //                             ' tháng ',
        //                             _month,
        //                             ' năm ',
        //                             _yeah
        //                         );
        //                     console.log(objectRoom[f]['footer']);
        //                     objectRoom[f]['mergesData'] = [];
        //                     ws['!merges'].map((m) => {
        //                         if (m.s.r < 27) {
        //                             objectRoom[f]['mergesData'].push(
        //                                 this.keyAnswer[m.s.c].concat(
        //                                     (m.s.r + 1).toString(),
        //                                     ':',
        //                                     this.keyAnswer[m.e.c],
        //                                     (m.e.r + 1).toString()
        //                                 )
        //                             );
        //                         } else {
        //                             objectRoom[f]['mergesData'].push(
        //                                 this.keyAnswer[m.s.c].concat(
        //                                     (
        //                                         m.s.r -
        //                                         27 +
        //                                         headerData.length +
        //                                         objectRoom[f]['dataTable']
        //                                             .length
        //                                     ).toString(),
        //                                     ':',
        //                                     this.keyAnswer[m.e.c],
        //                                     (
        //                                         m.e.r -
        //                                         27 +
        //                                         headerData.length +
        //                                         objectRoom[f]['dataTable']
        //                                             .length
        //                                     ).toString()
        //                                 )
        //                             );
        //                         }
        //                     });
        //                 });
        //                 const cols = {
        //                     donvitructhuoc: {
        //                         name: 'A1:D1',
        //                         font: {
        //                             name: 'Times New Roman',
        //                             family: 1,
        //                             size: 10,
        //                             bold: true,
        //                         },
        //                         alignment: {
        //                             vertical: 'middle',
        //                             horizontal: 'center',
        //                         },
        //                     },
        //                     donvo: {
        //                         name: 'A2:D2',
        //                         font: {
        //                             name: 'Times New Roman',
        //                             family: 1,
        //                             size: 10,
        //                             bold: true,
        //                         },
        //                         alignment: {
        //                             vertical: 'middle',
        //                             horizontal: 'center',
        //                             wrapText: true,
        //                         },
        //                     },
        //                     chxhcn: {
        //                         name: 'H1:T1',
        //                         font: {
        //                             name: 'Times New Roman',
        //                             family: 1,
        //                             size: 10,
        //                         },
        //                         alignment: {
        //                             vertical: 'middle',
        //                             horizontal: 'center',
        //                             wrapText: true,
        //                         },
        //                     },
        //                     dltdhp: {
        //                         name: 'H2:T2',
        //                         font: {
        //                             name: 'Times New Roman',
        //                             family: 1,
        //                             size: 10,
        //                             underline: true,
        //                         },
        //                         alignment: {
        //                             vertical: 'middle',
        //                             horizontal: 'center',
        //                             wrapText: true,
        //                         },
        //                     },
        //                     title: {
        //                         name: 'A4:T4',
        //                         font: {
        //                             name: 'Times New Roman',
        //                             family: 1,
        //                             size: 12,
        //                             bold: true,
        //                         },
        //                         alignment: {
        //                             vertical: 'middle',
        //                             horizontal: 'center',
        //                             wrapText: true,
        //                         },
        //                     },
        //                     col_1: {
        //                         name: 'C6:L6',
        //                         font: {
        //                             name: 'Times New Roman',
        //                             family: 1,
        //                             size: 10,
        //                             bold: true,
        //                         },
        //                         alignment: {
        //                             vertical: 'middle',
        //                             horizontal: 'left',
        //                         },
        //                     },
        //                     col_2: {
        //                         name: 'M6:S6',
        //                         font: {
        //                             name: 'Times New Roman',
        //                             family: 1,
        //                             size: 10,
        //                             bold: true,
        //                         },
        //                         alignment: {
        //                             vertical: 'middle',
        //                             horizontal: 'left',
        //                         },
        //                     },
        //                     col_3: {
        //                         name: 'A7:K7',
        //                         font: {
        //                             name: 'Times New Roman',
        //                             family: 1,
        //                             size: 10,
        //                             bold: true,
        //                         },
        //                         alignment: {
        //                             vertical: 'middle',
        //                             horizontal: 'left',
        //                         },
        //                     },
        //                 };
        //                 const widthPoint = 10;
        //                 const objectColWidth = {
        //                     1: 8,
        //                     2: 20,
        //                     3: 20,
        //                     4: 10,
        //                     5: widthPoint,
        //                     6: widthPoint,
        //                     7: widthPoint,
        //                     8: widthPoint,
        //                     9: widthPoint,
        //                 };
        //                 this.displayModal = false;
        //                 this.exportExcelSheetsService.exportExcel(
        //                     objectRoom,
        //                     cols,
        //                     objectColWidth,
        //                     { name: 'Times New Roman', family: 1, size: 13 },
        //                     this.classSelected.name
        //                 );
        //             };
        //         });
        // } else {
        // this.displayModal = false;
        this.fileService.getFileLocalAsBlob('..\\assets\\files\\mau_file_import_hvu\\DanhSachSinhVien.xlsx').subscribe((res) => {
            saveAs(
                res,
                'Mau 06 - Import sinh vien vao 1 lop hoc phan.xlsx'
            );
        });
        // }
    }

    dataByClass(f, i) {
        const ho = f['full_name']
            .split(' ')
            .splice(0, f['full_name'].split(' ').length - 1)
            .join(' ');
        const ten = f['full_name']
            .split(' ')
            .splice(f['full_name'].split(' ').length - 1, 1)
            .join(' ');
        return [
            i,
            f['student_code'].toUpperCase(),
            ho,
            ten,
            f['birthday'],
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
        ];
    }

    createGroup() {
        if (this.max_group) {
            this.noitifi
                .confirm(
                    'Thầy / Cô có chắc chắn muốn tạo nhóm. Nếu tạo nhóm, những nhóm đã tồn tại sẽ bị xóa ?',
                    'Thông báo',
                    [BUTTON_YES, BUTTON_NO]
                )
                .then((a) => {
                    if (a.name === 'yes') {
                        const group_size =
                            this.total_student % this.max_group === 0
                                ? this.total_student / this.max_group
                                : Math.floor(
                                this.total_student / this.max_group
                            ) + 1;
                        const params: PARAMS = {
                            max_group: this.max_group,
                            group_size: group_size,
                            block_group: false,
                        };
                        let groups: GROUP[] = [];
                        for (let i = 1; i <= params.max_group; i++) {
                            groups.push({
                                leader_id: 0,
                                members: [],
                                group: i,
                            });
                        }
                        params['groups'] = groups;
                        // }
                        this.classesService
                            .updateDataClasses(this.classSelected.id, {
                                params: params,
                            })
                            .subscribe({
                                next: (_res) => {
                                    this.noitifi.toastSuccess(
                                        'Cập nhật thành công'
                                    );
                                    this.classSelected.params = params;
                                    this.noitifi
                                        .confirm(
                                            'Đã mở đăng ký nhóm, Thầy/cô thông báo cho sinh viên đăng ký nhóm qua phần mềm LMS',
                                            'Thông báo',
                                            [BUTTON_CLOSED]
                                        )
                                        .then(() => {
                                            this.loadListGroup();
                                        });
                                },
                                error: () => {
                                    this.noitifi.toastError(
                                        'Cập nhật thất bại, Lỗi kết nối'
                                    );
                                },
                            });
                    }
                });
        } else {
            this.noitifi.toastWarning('Vui lòng nhập vào số nhóm cần tạo');
        }
    }

    loadListGroup() {
        if (this.classSelected.params && this.classSelected.params.max_group) {
            const tmpGroup = [];
            const student_ids = [];
            this.noitifi.isProcessing(true);
            this.group_member = {
                total_member: 0,
                register_member: 0,
            };

            for (let i = 0; i < this.classSelected.params.max_group; i++) {
                const group: CLASS_GROUPS = {
                    group: i + 1,
                    group_name: 'Nhóm '.concat((i + 1).toString()),
                    children: [],
                    member_number: 0,
                    leader_id: 0,
                    leader_profile: null,
                    members: [],
                    register_member: 0,
                };
                if (this.classSelected.params.groups) {
                    const index = this.classSelected.params.groups.findIndex(
                        (m) => m.group === i + 1
                    );
                    if (index !== -1) {
                        group.member_number =
                            this.classSelected.params.groups[
                                index
                                ].members.length;
                        group.members =
                            this.classSelected.params.groups[index].members;
                        if (this.classSelected.params.groups[index].leader_id) {
                            student_ids.push(
                                this.classSelected.params.groups[index]
                                    .leader_id
                            );
                            group['leader_id'] =
                                this.classSelected.params.groups[
                                    index
                                    ].leader_id;
                        }
                    }
                }
                tmpGroup.push(group);
            }

            tmpGroup.forEach((f, key) => {
                if (
                    this.classSelected.params &&
                    !this.classSelected.params.block_group
                ) {
                    setTimeout(() => {
                        const condition: ConditionOption = {
                            condition: [
                                {
                                    conditionName: 'class_id',
                                    condition: OvicQueryCondition.equal,
                                    value: this.classSelected.id.toString(),
                                },
                                {
                                    conditionName: 'group_number',
                                    condition: OvicQueryCondition.equal,
                                    value: f.group.toString(),
                                    orWhere: 'and',
                                },
                            ],
                            set: [
                                { label: 'order', value: 'DESC' },
                                { label: 'orderby', value: 'id' },
                                { label: 'group_by', value: 'student_id' },
                                { label: 'limit', value: '-1' },
                            ],
                            page: null,
                        };

                        this.registerGroupStatusService
                            .getRegisterGroupStatusByPageNew(condition)
                            .subscribe({
                                next: (_register) => {
                                    f.register_member = _register.data.filter(
                                        (m) =>
                                            f.members.findIndex(
                                                (i) => i === m.student_id
                                            ) === -1
                                    ).length;
                                    this.group_member.register_member =
                                        this.group_member.register_member +
                                        f.register_member;
                                },
                                error: () => { },
                            });
                    }, key * 200);
                }
                this.group_member.total_member =
                    this.group_member.total_member + f.members.length;
            });

            if (student_ids.length) {
                const condition: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'class_id',
                            condition: OvicQueryCondition.equal,
                            value: this.classSelected.id.toString(),
                        },
                    ],
                    set: [
                        { label: 'include', value: student_ids.toString() },
                        { label: 'include_by', value: 'student_id' },
                        { label: 'limit', value: '-1' },
                    ],
                    page: null,
                };

                this.classStudentService
                    .getClassStudentByPageNew(condition)
                    .subscribe({
                        next: (_student_leader) => {
                            _student_leader.data.forEach((f, key) => {
                                f['name'] = f.user_info['name'];
                                f['full_name'] = f.user_info['full_name'];
                                f['birthday'] = f.user_info['birthday']
                                    ? f.user_info['birthday']
                                    : 'Không có';
                                f['email'] = f.user_info['email'];
                                f['student_code'] = f.user_info['student_code'];
                                f['student_status'] =
                                    f.status === -1
                                        ? '<span class="student-stop-learning">Bỏ học</span>'
                                        : '<span class="student-is-learning">Đang hoạt động</span>';
                                f['student_status'] =
                                    f.status === 0
                                        ? '<span class="student-is-waitting">Chờ duyệt</span>'
                                        : f['student_status'];
                            });
                            tmpGroup.forEach((f) => {
                                const index = _student_leader.data.findIndex(
                                    (m) => m.student_id === f.leader_id
                                );

                                if (index !== -1) {
                                    f.leader_profile =
                                        _student_leader.data[index];
                                }
                            });
                            this.listStudentGroup = tmpGroup;
                            this.noitifi.isProcessing(false);
                        },

                        error: () => {
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                            this.noitifi.isProcessing(false);
                        },
                    });
            } else {
                this.noitifi.isProcessing(false);
                this.listStudentGroup = tmpGroup;
            }
        }
    }

    addStudentToGroup(group) {
        this.formTitle = group.group_name.concat(' - Thêm');
        this.selectedGroup = group;
        this.loadSinhVienNoneGroupPage(1);
        this.noitifi.openSideNavigationMenu({
            template: this.templateListStudentGroup,
            size: 700,
        });
    }

    loadSinhVienNoneGroupPage(page: number) {
        let student_ids = [0];
        this.listStudentGroup.forEach((f) => {
            student_ids = student_ids.concat(f.members);
        });
        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '50' },
                { label: 'exclude', value: student_ids.toString() },
                { label: 'exclude_by', value: 'student_id' },
            ],
            page: page.toString(),
        };

        if (this.search_student) {
            condition.condition.push({
                conditionName: 'user_info',
                condition: OvicQueryCondition.like,
                value: '%' + this.search_student + '%',
                orWhere: 'and',
            });
        }

        this.classStudentService.getClassStudentByPageNew(condition).subscribe({
            next: (_resStudent) => {
                const tmp = [];
                const _index_start = (page - 1) * 50;
                _resStudent.data.forEach((f, key) => {
                    f['index_'] = _index_start + key + 1;
                    f['name'] = f.user_info['name'];
                    f['full_name'] = f.user_info['full_name'];
                    f['birthday'] = f.user_info['birthday']
                        ? f.user_info['birthday']
                        : 'Không có';
                    f['email'] = f.user_info['email'];
                    f['student_code'] = f.user_info['student_code'];
                    tmp.push(f);
                });
                this.total_student_group = _resStudent.recordsFiltered;

                this.listStudentNoneGroup = tmp;
            },
            error: () => {
                this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
            },
        });
    }

    selectedStudentToGroup(event: MatSelectionListChange) {
        const data = [...this.listStudentNoneGroup.filter((m) => m['check'])];
        const group_size =
            this.classSelected.params.group_size -
            this.selectedGroup.children.length;
        if (data.length >= group_size) {
            this.noitifi.toastWarning(
                'Số lượng thành viên của nhóm này đã vượt quá trung bình trung'
            );
        }
        const index = this.listStudentNoneGroup.findIndex(
            (m) => m.id === event.options[0].value.id
        );
        if (index !== -1) {
            this.listStudentNoneGroup[index]['check'] =
                !this.listStudentNoneGroup[index]['check'];
        }
    }

    saveStudentToGroup() {
        const data = [...this.listStudentNoneGroup.filter((m) => m['check'])];
        if (data.length) {
            const ids = [];
            data.map((m) => {
                ids.push(m.student_id);
            });
            const params = this.classSelected.params;
            const index = params.groups
                ? params.groups.findIndex(
                    (m) => m.group === this.selectedGroup.group
                )
                : -1;
            if (index !== -1) {
                params.groups[index].members =
                    params.groups[index].members.concat(ids);
            } else {
                if (params.groups && Array.isArray(params.groups)) {
                } else {
                    params.groups = [];
                }

                params.groups.push({
                    group: this.selectedGroup.group,
                    leader_id: 0,
                    members: ids,
                });
            }
            params.groups.forEach((f) => {
                if (f.members && f.members.length) {
                    f.members = [...new Set(f.members)];
                }
            });
            this.closeSideMenu();
            this.classesService
                .updateDataClasses(this.classSelected.id, { params: params })
                .subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Thêm thành công');
                        this.classSelected.params = params;
                        this.loadListGroup();
                    },
                    error: () => {
                        this.noitifi.toastWarning(
                            'Lỗi kết nỗi, vui lòng thử lại'
                        );
                    },
                });
        } else {
            this.noitifi.toastWarning('Vui lòng chọn sinh viên');
        }
    }

    clearStudentFromGroup(student: ClassStudent, group: CLASS_GROUPS) {
        const index = this.classSelected.params.groups.findIndex(
            (m) => m.group === group.group
        );
        if (index !== -1) {
            const index_ = this.classSelected.params.groups[
                index
                ].members.findIndex((m) => m === student.student_id);
            if (index_ !== -1) {
                this.classSelected.params.groups[index].members.splice(
                    index_,
                    1
                );
            }
        }

        const index_g = group.members.findIndex(
            (m) => m === student.student_id
        );
        if (index_g !== -1) {
            group.members.splice(index_g, 1);
        }

        const index_s = group.children.findIndex(
            (m) => m.student_id === student.student_id
        );
        if (index_s !== -1) {
            group.children.splice(index_s, 1);
        }

        group.member_number = group.member_number - 1;

        this.classesService
            .updateDataClasses(this.classSelected.id, {
                params: this.classSelected.params,
            })
            .subscribe({
                next: () => { },
                error: () => { },
            });
    }

    loopGetStudentForGroup(data_student, page: number, count: number) {
        if (data_student.length < count) {
            this.progressValue = (data_student.length / count) * 100;
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: 'class_id',
                        condition: OvicQueryCondition.equal,
                        value: this.classSelected.id.toString(),
                    },
                ],
                set: [
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'user_info' },
                    { label: 'limit', value: '20' },
                ],
                page: page.toString(),
            };

            this.classStudentService
                .getClassStudentByPageNew(condition)
                .subscribe({
                    next: (_student) => {
                        this.loopGetStudentForGroup(
                            _student.data.concat(data_student),
                            page + 1,
                            _student.recordsFiltered
                        );
                    },

                    error: () => {
                        this.displayModal = false;
                        this.noitifi.toastError(
                            'Lỗi kết nối, vui lòng thử lại'
                        );
                    },
                });
        } else {
            let data_group = [];
            if (this.classSelected.params && this.classSelected.params.groups) {
                data_student.forEach((f) => {
                    let flag = false;
                    this.classSelected.params.groups.forEach((g) => {
                        const index = g.members.findIndex(
                            (m) => m === f.student_id
                        );
                        if (index !== -1) {
                            if (
                                g.group <= this.classSelected.params.max_group
                            ) {
                                flag = true;
                            }
                        }
                    });
                    if (!flag) {
                        data_group.push(f);
                    }
                });
            } else {
                data_group = data_student;
            }

            if (data_group.length) {
                let groups: GROUP[] = [];
                if (this.classSelected.params.groups) {
                    this.classSelected.params.groups.forEach((f) => {
                        f.members.forEach((t) => {
                            const index_ = data_group.findIndex(
                                (m) => m.student_id === t
                            );
                            if (index_ !== -1) {
                                data_group.splice(index_, 1);
                            }
                        });
                    });
                    groups = this.classSelected.params.groups;
                } else {
                    for (
                        let i = 1;
                        i <= this.classSelected.params.max_group;
                        i++
                    ) {
                        groups.push({
                            leader_id: 0,
                            members: [],
                            group: i,
                        });
                    }
                }

                const size = Math.floor(
                    this.total_student / this.classSelected.params.max_group
                );

                groups.forEach((f) => {
                    if (f.members.length < size) {
                        for (let i = 1; i <= size; i++) {
                            if (data_group.length && i > f.members.length) {
                                const student = data_group.splice(
                                    this.getRandomInt(data_group.length),
                                    1
                                )[0];
                                f.members.push(student.student_id);
                            }
                        }
                    }
                });

                groups.forEach((f) => {
                    if (data_group.length) {
                        const student = data_group.splice(
                            this.getRandomInt(data_group.length),
                            1
                        )[0];
                        f.members.push(student.student_id);
                    }
                });

                const params: PARAMS = {
                    max_group: this.classSelected.params.max_group,
                    group_size: this.classSelected.params.group_size,
                    groups: groups,
                    block_group: this.classSelected.params.block_group,
                };

                this.classesService
                    .updateDataClasses(this.classSelected.id, {
                        params: params,
                    })
                    .subscribe({
                        next: () => {
                            this.displayModal = false;
                            this.noitifi.toastSuccess('Cập nhật thành công');
                            this.displayModal = false;
                            this.classSelected.params = params;
                            this.loadListGroup();
                        },
                        error: () => {
                            this.displayModal = false;
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                        },
                    });
            }
            this.displayModal = false;
        }
    }

    blockRegisterGroup() {
        if (!this.classSelected.params.block_group) {
            this.noitifi
                .confirm(
                    'Bạn có chắc chắn muốn kết thúc đăng ký nhóm?',
                    'Thông báo',
                    [BUTTON_YES, BUTTON_NO]
                )
                .then((a) => {
                    if (a.name === 'yes') {
                        if (
                            this.classSelected.params.groups &&
                            this.classSelected.params.groups.length
                        ) {
                            let i = 0;
                            this.displayModal = true;
                            this.progressValue = 0;
                            this.waitting_title = 'Đang thực thi, vui lòng chờ';
                            this.classSelected.params.groups.forEach(
                                (f, key) => {
                                    setTimeout(() => {
                                        const condition: ConditionOption = {
                                            condition: [
                                                {
                                                    conditionName: 'class_id',
                                                    condition:
                                                    OvicQueryCondition.equal,
                                                    value: this.classSelected.id.toString(),
                                                },
                                                {
                                                    conditionName:
                                                        'group_number',
                                                    condition:
                                                    OvicQueryCondition.equal,
                                                    value: f.group.toString(),
                                                    orWhere: 'and',
                                                },
                                            ],
                                            set: [
                                                {
                                                    label: 'order',
                                                    value: 'DESC',
                                                },
                                                {
                                                    label: 'orderby',
                                                    value: 'id',
                                                },
                                                {
                                                    label: 'group_by',
                                                    value: 'student_id',
                                                },
                                                { label: 'limit', value: '-1' },
                                            ],
                                            page: null,
                                        };

                                        this.registerGroupStatusService
                                            .getRegisterGroupStatusByPageNew(
                                                condition
                                            )
                                            .subscribe({
                                                next: (_register) => {
                                                    i = i + 1;
                                                    this.progressValue =
                                                        (i /
                                                            this.classSelected
                                                                .params.groups
                                                                .length) *
                                                        100;
                                                    _register.data.forEach(
                                                        (r) => {
                                                            const index =
                                                                f.members.findIndex(
                                                                    (i) =>
                                                                        i ===
                                                                        r.student_id
                                                                );
                                                            if (index === -1) {
                                                                f.members.push(
                                                                    r.student_id
                                                                );
                                                            }
                                                        }
                                                    );
                                                    if (
                                                        i ===
                                                        this.classSelected
                                                            .params.groups
                                                            .length
                                                    ) {
                                                        const block =
                                                            !this.classSelected
                                                                .params
                                                                .block_group;
                                                        this.classSelected.params.block_group =
                                                            block;
                                                        this.classesService
                                                            .updateDataClasses(
                                                                this
                                                                    .classSelected
                                                                    .id,
                                                                {
                                                                    params: this
                                                                        .classSelected
                                                                        .params,
                                                                }
                                                            )
                                                            .subscribe({
                                                                next: () => {
                                                                    this.noitifi.toastSuccess(
                                                                        'Cập nhật thành công'
                                                                    );
                                                                    this.displayModal =
                                                                        false;
                                                                    this.loadListGroup();
                                                                },
                                                                error: () => {
                                                                    this.noitifi.toastSuccess(
                                                                        'Cập nhật thất bại'
                                                                    );
                                                                },
                                                            });
                                                    }
                                                },
                                                error: () => { },
                                            });
                                    }, key * 200);
                                }
                            );
                        }
                    }
                });
        } else {
            const block = !this.classSelected.params.block_group;
            this.classSelected.params.block_group = block;
            this.classesService
                .updateDataClasses(this.classSelected.id, {
                    params: this.classSelected.params,
                })
                .subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Cập nhật thành công');
                    },
                    error: () => {
                        this.noitifi.toastSuccess('Cập nhật thất bại');
                    },
                });
        }
    }

    changePage_student_group(event) {
        this.loadSinhVienNoneGroupPage(event.page + 1);
    }

    getGroupMember(group: CLASS_GROUPS) {
        if (group.members && group.members.length) {
            if (group.children && group.children.length) {
                group.children = [];
            } else {
                const condition: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'class_id',
                            condition: OvicQueryCondition.equal,
                            value: this.classSelected.id.toString(),
                        },
                    ],
                    set: [
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'user_info' },
                        { label: 'include', value: group.members.toString() },
                        { label: 'include_by', value: 'student_id' },
                        { label: 'limit', value: '-1' },
                    ],
                    page: null,
                };

                this.classStudentService
                    .getClassStudentByPageNew(condition)
                    .subscribe({
                        next: (_student) => {
                            const tmp = [];
                            _student.data.forEach((f, key) => {
                                f['name'] = f.user_info['name'];
                                f['full_name'] = f.user_info['full_name'];
                                f['birthday'] = f.user_info['birthday']
                                    ? f.user_info['birthday']
                                    : 'Không có';
                                f['email'] = f.user_info['email'];
                                f['student_code'] = f.user_info['student_code'];
                                f['leader'] = false;
                                if (f.student_id === group.leader_id) {
                                    f['leader'] = true;
                                }
                                tmp.push(f);
                            });
                            group.children = tmp;
                        },

                        error: () => {
                            this.displayModal = false;
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                        },
                    });
            }
        } else {
            this.noitifi.toastWarning('Nhóm này chưa có sinh viên tham gia');
        }
    }

    randomStudentGroup() {
        if (this.classSelected.params && this.classSelected.params.max_group) {
            this.noitifi
                .confirm(
                    'Bạn có chắc chắn muốn phân nhóm ngẫu nhiên?',
                    'Thông báo',
                    [BUTTON_YES, BUTTON_NO]
                )
                .then((a) => {
                    if (a.name === 'yes') {
                        const student_data = [];
                        this.displayModal = true;
                        this.progressValue = 0;
                        this.waitting_title = 'Đang tạo nhóm, vui lòng đợi';
                        this.loopGetStudentForGroup(student_data, 1, 1000);
                    }
                });
        } else {
            this.noitifi.toastWarning('Chưa tạo nhóm');
        }
    }

    chooseLeaderGroup(student: ClassStudent, group: CLASS_GROUPS) {
        const index = this.classSelected.params.groups.findIndex(
            (m) => m.group === group.group
        );
        if (index !== -1) {
            if (group.leader_id !== student.student_id) {
                this.classSelected.params.groups[index].leader_id =
                    student.student_id;
                group.leader_id = student.student_id;
                group.leader_profile = student;
            } else {
                this.classSelected.params.groups[index].leader_id = 0;
                group.leader_id = 0;
                delete group.leader_profile;
            }
        }

        this.classesService
            .updateDataClasses(this.classSelected.id, {
                params: this.classSelected.params,
            })
            .subscribe({
                next: () => {
                    this.noitifi.toastSuccess('Cập nhật thành công');
                },
                error: () => {
                    this.noitifi.toastWarning('Cập nhật thất bại');
                },
            });
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    closeSideMenu() {
        this.noitifi.closeSideNavigationMenu();
    }

    // import sinh vien

    changeInputImport(event) {
        if (event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            this.list_student_import = [];
            this.resetImportComparison();
            reader.readAsArrayBuffer(file);
            reader.onloadend = () => {
                try {
                    const localUrl = reader.result;
                    const wb: XLSX.WorkBook = XLSX.read(localUrl, {
                        type: 'binary',
                    });
                    const wsname: string = wb.SheetNames[0];
                    const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                    if (!ws) {
                        throw new Error('Không tìm thấy sheet dữ liệu');
                    }
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                    const data_student = [];
                    this.displayModal = true;
                    this.progressValue = 0;
                    this.waitting_title = 'Đang lấy dữ liệu sinh viên, vui lòng chờ';
                    this.loopGetStudentClassToCheck(
                        data_student,
                        1,
                        1000,
                        data.filter(row => Array.isArray(row) && row[1] && row[2] && row[3])
                    ).subscribe({
                        error: () => {
                            this.displayModal = false;
                            this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                        },
                    });
                } catch (error) {
                    this.displayModal = false;
                    this.noitifi.toastError('File import không hợp lệ hoặc không đọc được dữ liệu');
                }
            };
            reader.onerror = () => {
                this.displayModal = false;
                this.noitifi.toastError('Không đọc được file import');
            };
        }
    }

    loopGetStudentClassToCheck(data_student, page: number, count: number, data_sql): Observable<any> {
        if (data_student.length < count) {
            this.progressValue = (data_student.length / count) * 100;
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: 'class_id',
                        condition: OvicQueryCondition.equal,
                        value: this.classSelected.id.toString(),
                    },
                ],
                set: [
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'user_info' },
                    { label: 'limit', value: '100' },
                ],
                page: page.toString(),
            };

            return this.classStudentService.getClassStudentByPageNew(condition).pipe(
                concatMap((_res) => this.loopGetStudentClassToCheck(
                    data_student.concat(_res.data),
                    page + 1,
                    _res.recordsFiltered,
                    data_sql
                ))
            );
        }
        return this.convertSqlStudentData(data_sql, data_student);
    }

    loopGetStudentFromHvu(data_student, page: number, count: number, data_sql): Observable<any> {
        if (data_student.length < count) {
            this.progressValue = (data_student.length / count) * 100;
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: 'class_id',
                        condition: OvicQueryCondition.equal,
                        value: this.classSelected.id.toString(),
                    },
                ],
                set: [
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'user_info' },
                    { label: 'limit', value: '100' },
                ],
                page: page.toString(),
            };

            return this.classStudentService.getClassStudentByPageNew(condition).pipe(
                concatMap((_res) => this.loopGetStudentFromHvu(
                    data_student.concat(_res.data),
                    page + 1,
                    _res.recordsFiltered,
                    data_sql
                ))
            );
        }
        return this.convertHvuStudentData(data_sql, data_student);
    }

    convertHvuStudentData(data_sql, data_student): Observable<any[]> {
        const studentCodes = new Set<string>();
        const list_data = [];
        let duplicateStudentCount = 0;
        let i = 0;
        const _data = [[]];
        data_sql.forEach((f, key) => {
            const key_object = this.normalizeStudentCode(f && f[1]);
            if (!key_object) {
                return;
            }
            if (studentCodes.has(key_object)) {
                duplicateStudentCount += 1;
                return;
            }
            studentCodes.add(key_object);
            if (_data[i].length < 100) {
                _data[i].push(key_object);
            } else {
                i = i + 1;
                _data[i] = [key_object];
            }

            const _student_sql = {
                student_id: 0,
                class_id: this.classSelected.id,
                user_id: 0,
                user_info: {
                    name: f[3] || '',
                    full_name: [f[2], f[3]].filter(value => !!value).join(' '),
                    birthday: '',
                    student_code: key_object,
                    email: '',
                },
                status: 1,
                hocky: this.classSelected.hocky,
                namhoc: this.classSelected.namhoc,
                student_code: key_object,
                full_name: [f[2], f[3]].filter(value => !!value).join(' '),
                ordering: key + 1
            };
            list_data.push(_student_sql);
        });
        this.importComparison.duplicateStudentCount = duplicateStudentCount;
        this.waitting_title = 'Đang kiểm tra dữ liệu sinh viên, vui lòng chờ';
        if (!list_data.length) {
            this.finishStudentReconciliation([], data_student);
            return of([]);
        }
        return this.loopGetStudentExistFromHvu(_data[0], _data, 0, [], list_data, data_student);
    }

    loopGetStudentExistFromHvu(data, datas, key: number, _student: ElngUserProfile[], convert_data, data_student): Observable<any[]> {
        if (key < datas.length) {
            this.progressValue = ((key + 1) / datas.length) * 100;
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'include', value: data.toString() },
                    { label: 'include_by', value: 'student_code' },
                    { label: 'limit', value: '-1' },
                ],
                page: null,
            };
            return this.elngUserProfileService.getUserProfileByPageNewV2(condition).pipe(
                concatMap((_student_res) => {
                    const user_ids = [0];
                    _student_res.data.forEach((f) => {
                        user_ids.push(f.user_id);
                    });
                    const condition_user: ConditionOption = {
                        condition: [],
                        set: [
                            { label: 'include', value: user_ids.toString() },
                            { label: 'include_by', value: 'id' },
                            { label: 'limit', value: '-1' },
                        ],
                        page: null,
                    };
                    return this.userService.getUserByPageNew(condition_user).pipe(
                        tap((_res_user) => {
                            const found_user_ids = new Set(_res_user.data.map((m) => m.id));
                            _student_res.data.forEach((f) => {
                                if (found_user_ids.has(f.user_id)) {
                                    const index = _res_user.data.findIndex((m) => m.id === f.user_id);
                                    if (index !== -1) {
                                        f['email'] = _res_user.data[index].email;
                                    }
                                } else {
                                    f['_no_user'] = true;
                                }
                            });
                        }),
                        concatMap(() => this.loopGetStudentExistFromHvu(
                            datas[key + 1],
                            datas,
                            key + 1,
                            _student.concat(_student_res.data),
                            convert_data,
                            data_student
                        ))
                    );
                })
            );
        }

        const _data_next = [];
        convert_data.forEach((f) => {
            const index = _student.findIndex((m) =>
                this.normalizeStudentCode(m.student_code) === f['student_code']
            );
            if (index !== -1) {
                if (!_student[index].id || !_student[index].user_id || _student[index]['_no_user']) {
                    f['status_import'] = 'no_data';
                    _data_next.push(f);
                    return;
                }
                const _student_sql = {
                    student_id: _student[index].id,
                    class_id: this.classSelected.id,
                    user_id: _student[index].user_id,
                    user_info: {
                        name: _student[index].name,
                        full_name: _student[index].full_name,
                        birthday: _student[index].birthday,
                        student_code: this.normalizeStudentCode(_student[index].student_code),
                        email: _student[index]['email'],
                    },
                    status: 1,
                    hocky: this.classSelected.hocky,
                    namhoc: this.classSelected.namhoc,
                    student_code: this.normalizeStudentCode(_student[index].student_code),
                    full_name: _student[index].full_name,
                    status_import: 'not_import',
                    email: _student[index]['email'],
                    birthday: _student[index].birthday,
                    ordering: f.ordering
                };
                const index_ = data_student.findIndex((m) => m.student_id === _student_sql.student_id);
                if (index_ !== -1) {
                    _student_sql['id'] = data_student[index_].id;
                    _student_sql.status_import = 'exist';
                }
                _data_next.push(_student_sql);
            } else {
                f['status_import'] = 'no_data';
                _data_next.push(f);
            }
        });
        this.finishStudentReconciliation(_data_next, data_student);
        return of(_data_next);
    }

    convertSqlStudentData(data_sql, data_student): Observable<any[]> {
        data_sql.splice(0, 1);
        const studentCodes = new Set<string>();
        const list_data = [];
        let duplicateStudentCount = 0;
        let i = 0;
        const _data = [[]];
        data_sql.forEach((f, key) => {
            const key_object = this.normalizeStudentCode(f && f[1]);
            if (!key_object) {
                return;
            }
            if (studentCodes.has(key_object)) {
                duplicateStudentCount += 1;
                return;
            }
            studentCodes.add(key_object);
            if (_data[i].length < 100) {
                _data[i].push(key_object);
            } else {
                i = i + 1;
                _data[i] = [key_object];
            }

            const _student_sql = {
                student_id: 0,
                class_id: this.classSelected.id,
                user_id: 0,
                user_info: {
                    name: f[3] || '',
                    full_name: [f[2], f[3]].filter(value => !!value).join(' '),
                    birthday: '',
                    student_code: key_object,
                    email: '',
                },
                status: 1,
                hocky: this.classSelected.hocky,
                namhoc: this.classSelected.namhoc,
                student_code: key_object,
                full_name: [f[2], f[3]].filter(value => !!value).join(' '),
                ordering: key + 1
            };
            list_data.push(_student_sql);
        });
        this.importComparison.duplicateStudentCount = duplicateStudentCount;
        this.waitting_title = 'Đang kiểm tra dữ liệu sinh viên, vui lòng chờ';
        if (!list_data.length) {
            this.finishStudentReconciliation([], data_student);
            return of([]);
        }
        return this.loopGetStudentExist(_data[0], _data, 0, [], list_data, data_student);
    }

    loopGetStudentExist(data, datas, key: number, _student: ElngUserProfile[], convert_data, data_student): Observable<any[]> {
        if (key < datas.length) {
            this.progressValue = ((key + 1) / datas.length) * 100;
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'include', value: data.toString() },
                    { label: 'include_by', value: 'student_code' },
                    { label: 'limit', value: '-1' },
                ],
                page: null,
            };
            return this.elngUserProfileService.getUserProfileByPageNewV2(condition).pipe(
                concatMap((_student_res) => {
                    const user_ids = [0];
                    _student_res.data.forEach((f) => {
                        user_ids.push(f.user_id);
                    });
                    const condition_user: ConditionOption = {
                        condition: [],
                        set: [
                            { label: 'include', value: user_ids.toString() },
                            { label: 'include_by', value: 'id' },
                            { label: 'limit', value: '-1' },
                        ],
                        page: null,
                    };
                    return this.userService.getUserByPageNew(condition_user).pipe(
                        tap((_res_user) => {
                            const found_user_ids = new Set(_res_user.data.map((m) => m.id));
                            _student_res.data.forEach((f) => {
                                if (found_user_ids.has(f.user_id)) {
                                    const index = _res_user.data.findIndex((m) => m.id === f.user_id);
                                    if (index !== -1) {
                                        f['email'] = _res_user.data[index].email;
                                    }
                                } else {
                                    f['_no_user'] = true;
                                }
                            });
                        }),
                        concatMap(() => this.loopGetStudentExist(
                            datas[key + 1],
                            datas,
                            key + 1,
                            _student.concat(_student_res.data),
                            convert_data,
                            data_student
                        ))
                    );
                })
            );
        }

        const _data_next = [];
        convert_data.forEach((f) => {
            const index = _student.findIndex((m) =>
                this.normalizeStudentCode(m.student_code) === f['student_code']
            );
            if (index !== -1) {
                if (!_student[index].id || !_student[index].user_id || _student[index]['_no_user']) {
                    f['status_import'] = 'no_data';
                    _data_next.push(f);
                    return;
                }
                const _student_sql = {
                    student_id: _student[index].id,
                    class_id: this.classSelected.id,
                    user_id: _student[index].user_id,
                    user_info: {
                        name: _student[index].name,
                        full_name: _student[index].full_name,
                        birthday: _student[index].birthday,
                        student_code: this.normalizeStudentCode(_student[index].student_code),
                        email: _student[index]['email'],
                    },
                    status: 1,
                    hocky: this.classSelected.hocky,
                    namhoc: this.classSelected.namhoc,
                    student_code: this.normalizeStudentCode(_student[index].student_code),
                    full_name: _student[index].full_name,
                    status_import: 'not_import',
                    email: _student[index]['email'],
                    birthday: _student[index].birthday,
                    ordering: f.ordering,
                };
                const index_ = data_student.findIndex((m) => m.student_id === _student_sql.student_id);
                if (index_ !== -1) {
                    _student_sql['id'] = data_student[index_].id;
                    _student_sql.status_import = 'exist';
                }
                _data_next.push(_student_sql);
            } else {
                f['status_import'] = 'no_data';
                _data_next.push(f);
            }
        });
        this.finishStudentReconciliation(_data_next, data_student);
        return of(_data_next);
    }

    private normalizeStudentName(value: any): string {
        return value === null || value === undefined
            ? ''
            : String(value).trim().replace(/\s+/g, ' ');
    }

    private getStudentNameParts(value: any): { firstName: string; middleName: string; lastName: string } {
        const parts = this.normalizeStudentName(value).split(' ').filter(part => !!part);
        return {
            firstName: parts.length ? parts[parts.length - 1] : '',
            middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
            lastName: parts.length > 1 ? parts[0] : '',
        };
    }

    private sortStudentsByVietnameseName(data: any[]): any[] {
        const collator = new Intl.Collator('vi', { sensitivity: 'accent' });
        return [...data].sort((left, right) => {
            const leftName = this.getStudentNameParts(left && left.full_name);
            const rightName = this.getStudentNameParts(right && right.full_name);
            return collator.compare(leftName.firstName, rightName.firstName)
                || collator.compare(leftName.middleName, rightName.middleName)
                || collator.compare(leftName.lastName, rightName.lastName)
                || collator.compare(
                    this.normalizeStudentCode(left && left.student_code),
                    this.normalizeStudentCode(right && right.student_code)
                );
        });
    }

    private normalizeStudentCode(value: any): string {
        return value === null || value === undefined
            ? ''
            : String(value).trim().toLowerCase();
    }

    private resetImportComparison(): void {
        this.importComparison = {
            currentStudentCount: 0,
            sourceStudentCount: 0,
            eligibleImportCount: 0,
            existingStudentCount: 0,
            newStudentCount: 0,
            missingFromSourceCount: 0,
            invalidStudentCount: 0,
            duplicateStudentCount: 0,
            countChanged: false,
            membershipChanged: false,
        };
    }

    private finishStudentReconciliation(data: any[], currentStudents: ClassStudent[]): void {
        const sortedData = this.sortStudentsByVietnameseName(data);
        sortedData.forEach((student, index) => {
            student['ordering'] = index + 1;
        });
        this.list_student_import = sortedData;
        if (!this.show_count_status) {
            this.show_count_status = {
                done: 0,
                failed: 0,
                not_import: 0,
                no_teacher: 0,
                no_category: 0,
                sum_data: 0,
                class_th: 0,
                class_lt: 0,
                exist: 0,
                no_data: 0,
            };
        }
        this.show_count_status.no_data = sortedData.filter(item => item['status_import'] === 'no_data').length;
        this.show_count_status.not_import = data.filter(item => item['status_import'] === 'not_import').length;
        this.show_count_status.exist = data.filter(item => item['status_import'] === 'exist').length;
        this.show_count_status.sum_data = data.length;

        const currentCodes = new Set(
            (currentStudents || [])
                .map(item => this.normalizeStudentCode(item && item.user_info && item.user_info.student_code))
                .filter(code => !!code)
        );
        const eligibleStudents = data.filter(item => item['status_import'] !== 'no_data');
        const eligibleCodes = new Set(
            eligibleStudents
                .map(item => this.normalizeStudentCode(item.student_code))
                .filter(code => !!code)
        );
        const newStudentCount = Array.from(eligibleCodes).filter(code => !currentCodes.has(code)).length;
        const missingFromSourceCount = Array.from(currentCodes).filter(code => !eligibleCodes.has(code)).length;

        this.importComparison.currentStudentCount = (currentStudents || []).length;
        this.importComparison.sourceStudentCount = data.length;
        this.importComparison.eligibleImportCount = eligibleCodes.size;
        this.importComparison.existingStudentCount = Array.from(eligibleCodes).filter(code => currentCodes.has(code)).length;
        this.importComparison.newStudentCount = newStudentCount;
        this.importComparison.missingFromSourceCount = missingFromSourceCount;
        this.importComparison.invalidStudentCount = this.show_count_status.no_data;
        this.importComparison.countChanged = eligibleCodes.size !== this.importComparison.currentStudentCount;
        this.importComparison.membershipChanged = newStudentCount > 0 || missingFromSourceCount > 0;
        this.displayModal = false;
    }

    getEligibleImportCount(): number {
        return this.list_student_import.filter(item => item['status_import'] !== 'no_data').length;
    }

    hasInvalidImportStudents(): boolean {
        return this.list_student_import.some(item => item['status_import'] === 'no_data');
    }

    getImportDifferenceText(): string {
        const difference = this.importComparison.eligibleImportCount - this.importComparison.currentStudentCount;
        if (difference > 0) {
            return `Nguồn hợp lệ nhiều hơn hiện tại ${difference} sinh viên`;
        }
        if (difference < 0) {
            return `Nguồn hợp lệ ít hơn hiện tại ${Math.abs(difference)} sinh viên`;
        }
        return this.importComparison.membershipChanged
            ? 'Số lượng không đổi nhưng danh sách sinh viên có thay đổi'
            : 'Danh sách sinh viên không thay đổi';
    }

    private getImportConfirmationMessage(): string {
        const comparison = this.importComparison;
        const warning = comparison.countChanged || comparison.membershipChanged
            ? `<br><strong style="color:#dc3545">Cảnh báo: ${this.getImportDifferenceText()}.</strong>`
            : '';
        return `<strong style="color:#dc3545">Toàn bộ danh sách sinh viên hiện tại sẽ bị xóa trước khi thêm danh sách mới.</strong><br><br>` +
            `Hiện tại: <strong>${comparison.currentStudentCount}</strong> sinh viên.<br>` +
            `Danh sách mới: <strong>${comparison.eligibleImportCount}</strong> sinh viên.<br>` +
            `Sẽ thêm mới: <strong>${comparison.newStudentCount}</strong>; giữ lại từ nguồn: <strong>${comparison.existingStudentCount}</strong>.<br>` +
            `Sẽ bị loại khỏi lớp: <strong>${comparison.missingFromSourceCount}</strong>.` + warning +
            `<br><em>Nếu lỗi xảy ra sau bước xóa, lớp có thể chỉ được import một phần.</em><br><br>` +
            `Bạn có chắc chắn muốn thay thế toàn bộ danh sách không?`;
    }

    triggerToimport() {
        this.resetImportComparison();
        this.show_count_status = {
            done: 0,
            failed: 0,
            not_import: 0,
            no_teacher: 0,
            no_category: 0,
            sum_data: 0,
            class_th: 0,
            class_lt: 0,
            exist: 0,
            no_data: 0,
        };
        this.inputImport.nativeElement.value = '';
        this.inputImport.nativeElement.click();
    }

    filterByKeyStatus(status, dt) {
        this.select_key_status = status;
        if (status['key'] !== 'sum_data') {
            dt.filterGlobal(this.select_key_status['key'], 'contains');
        } else {
            dt.filterGlobal('', 'contains');
        }
    }

    startImportStudentToClass() {
        if (this.isImporting || this.displayModal) {
            return;
        }
        if (this.hasInvalidImportStudents()) {
            this.noitifi.toastWarning(
                `Không thể thay thế danh sách: còn ${this.importComparison.invalidStudentCount} sinh viên không hợp lệ`
            );
            return;
        }
        const eligibleStudents = this.list_student_import.filter(item => item['status_import'] !== 'no_data');
        if (!eligibleStudents.length) {
            this.noitifi.toastWarning('Không có sinh viên đủ điều kiện để import');
            return;
        }

        this.noitifi.confirm(this.getImportConfirmationMessage(), 'Xác nhận thay thế danh sách', [BUTTON_YES, BUTTON_NO]).then((a) => {
            if (a.name === 'yes') {
                if (this.isImporting) {
                    return;
                }
                const data = [];
                let i = 0;
                data[i] = [];
                eligibleStudents.forEach((student) => {
                    student['id'] = null;
                    student['status_import'] = 'not_import';
                    if (data[i].length < 5) {
                        data[i].push(student);
                    } else {
                        i += 1;
                        data[i] = [student];
                    }
                });
                this.isImporting = true;
                this.displayModal = true;
                this.progressValue = 0;
                this.waitting_title = 'Đang xóa danh sách sinh viên cũ, vui lòng chờ';
                this.classStudentService
                    .deleteClassStudentByCol(this.classSelected.id.toString(), 'class_id')
                    .pipe(
                        catchError(() => throwError(() => new Error('delete_failed'))),
                        concatMap(() => {
                            this.waitting_title = 'Đang thêm danh sách sinh viên mới, vui lòng chờ';
                            return this.loopAddStudentClass(data, 0);
                        })
                    )
                    .subscribe({
                        next: () => this.finishStudentImport(),
                        error: (error) => {
                            this.isImporting = false;
                            this.displayModal = false;
                            if (error && error.message === 'delete_failed') {
                                this.noitifi.toastError('Không thể xóa danh sách sinh viên cũ. Chưa thêm dữ liệu mới');
                            } else {
                                this.noitifi.toastError('Import thất bại, vui lòng thử lại');
                            }
                        },
                    });
            }
        });
    }

    loopAddStudentClass(datas: ClassStudent[][], key: number): Observable<any> {
        if (key >= datas.length) {
            return of(null);
        }
        this.progressValue = ((key + 1) / datas.length) * 100;
        const request = datas[key].map((f) => {
            const _student = {
                student_id: f.student_id,
                class_id: f.class_id,
                user_id: f.user_id,
                user_info: f.user_info,
                status: f.status,
                hocky: f.hocky,
                namhoc: f.namhoc,
                ordering: f['ordering']
            };
            return this.classStudentService.addClassStudent(_student).pipe(
                tap(() => f['status_import'] = 'done'),
                catchError(() => {
                    f['status_import'] = 'failed';
                    return of(null);
                })
            );
        });
        const batch$ = request.length ? forkJoin(request) : of([]);
        return batch$.pipe(
            concatMap(() => this.loopAddStudentClass(datas, key + 1))
        );
    }

    private finishStudentImport(): void {
        this.displayModal = false;
        this.isImporting = false;
        this.show_count_status.failed = this.list_student_import.filter(
            (m) => m['status_import'] === 'failed'
        ).length;
        this.show_count_status.done = this.list_student_import.filter(
            (m) => m['status_import'] === 'done'
        ).length;
        this.show_count_status.not_import = this.list_student_import.filter(
            (m) => m['status_import'] === 'not_import'
        ).length;
        if (this.show_count_status.failed) {
            this.noitifi.toastWarning(
                `Import hoàn tất: ${this.show_count_status.done} thành công, ${this.show_count_status.failed} thất bại`
            );
        } else if (this.show_count_status.done) {
            this.noitifi.toastSuccess(`Cập nhật thành công ${this.show_count_status.done} sinh viên`);
        } else {
            this.noitifi.toastWarning('Không có sinh viên được cập nhật');
        }
        this.loadStudentClass_v2(1, this.limit_student);
    }

    loadClassInCourse(student: ClassStudent) {
        this.selectedStudent = student;

        this.noitifi.isProcessing(true);

        const condition_class: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                { conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: this.classSelected.namhoc, orWhere: 'and' },
                { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: this.classSelected.hocky, orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }


        this.classesService.getClassesByPageNew(condition_class).pipe(mergeMap(_res_class => {

            const class_ids = _res_class.data.map(m => m.id);
            if (class_ids.length) {
                const condition_test_tuan: ConditionOption = {
                    condition: [
                        { conditionName: 'student_id', condition: OvicQueryCondition.equal, value: student.student_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'groupby', value: 'class_id' },
                        { label: 'include', value: class_ids.toString() },
                        { label: 'include_by', value: 'class_id' }
                    ],
                    page: null
                }

                return forkJoin([
                    this.classPlanActivitiesTestsService.getClassPlanActivitiesTestsByPageNew(condition_test_tuan),
                    this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_test_tuan),
                    this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_test_tuan),
                    this.classStudentService.getClassStudentByPageNew(condition_test_tuan)
                ]).pipe(mergeMap(([_kynang_test, _tuan_test, _tuluan_test, _class_student]) => {
                    const data = [];
                    if (_class_student.data && _class_student.data.length === 0) {
                        _res_class.data.forEach(f => {
                            const index_1 = _kynang_test.data.findIndex(m => m.class_id === f.id);
                            const index_2 = _tuan_test.data.findIndex(m => m.class_id === f.id);
                            const index_3 = _tuluan_test.data.findIndex(m => m.class_id === f.id);
                            if (index_1 !== -1 || index_2 !== -1 || index_3 !== -1) {
                                data.push(f);
                            }
                        })
                    }
                    return of(data);
                }))
            }

            return of(_res_class.data)
        })).subscribe({
            next: (_class) => {
                this.list_class = _class;
                this.noitifi.openSideNavigationMenu({ template: this.templateListClass, size: 700, offsetTop: '0px' });
                this.noitifi.isProcessing(false)
            },
            error: () => {
                this.noitifi.isProcessing(false)
            }
        })
    }

    openInfoClass(_class: Classes) {
        this.selectedOtherClass = _class;

        this.list_week_test = [];

        this.selectedWeekTest = [];

        this.list_diemdanh = [];

        const condition_plan_test: ConditionOption = {
            condition: [
                { conditionName: 'student_id', condition: OvicQueryCondition.equal, value: this.selectedStudent.student_id.toString(), orWhere: 'and' },
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: _class.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'THUONGXUYEN_TULUAN,THUONGXUYEN_TRACNGHIEM' },
                { label: 'include_by', value: 'type' }
            ],
            page: null
        }

        this.noitifi.isProcessing(true);

        forkJoin([
            this.classPlanActivitiesTestsService.getClassPlanActivitiesTestsByPageNew(condition_plan_test).pipe(mergeMap(_res_kynang => {
                const classPlanActivity_id = _res_kynang.data.map(m => m.class_plan_activities_id);
                if (classPlanActivity_id && classPlanActivity_id.length) {
                    const condition_other_plan: ConditionOption = {
                        condition: [
                            { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'THUONGXUYEN_TRACNGHIEM', orWhere: 'and' }
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: classPlanActivity_id.toString() },
                            { label: 'include_by', value: 'id' }
                        ],
                        page: null
                    }

                    return this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condition_other_plan).pipe(mergeMap(a => {
                        a.data.forEach(c => {
                            const index = _res_kynang.data.findIndex(m => m.class_plan_activities_id === c.id);
                            if (index !== -1) {
                                c['student_test'] = _res_kynang.data[index];
                            }
                        })
                        return of(a);
                    }))
                }
                return of(null);
            })),
            this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_plan_test),
            this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_plan_test).pipe(mergeMap(_res_kynang => {
                const classPlanActivity_id = _res_kynang.data.map(m => m.class_plan_activity_id);
                if (classPlanActivity_id && classPlanActivity_id.length) {
                    const condition_other_plan: ConditionOption = {
                        condition: [
                            { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'THUONGXUYEN_TULUAN', orWhere: 'and' }
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: classPlanActivity_id.toString() },
                            { label: 'include_by', value: 'id' }
                        ],
                        page: null
                    }

                    return this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condition_other_plan).pipe(mergeMap(a => {
                        a.data.forEach(c => {
                            const index = _res_kynang.data.findIndex(m => m.class_plan_activity_id === c.id);
                            if (index !== -1) {
                                c['student_test'] = _res_kynang.data[index];
                            }
                        })
                        return of(a);
                    }))
                }
                return of(null);
            })),
            this.classStudentDiemdanhService.getClassStudentDiemdanhByPageNew(condition_plan_test),
            this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condition_plan).pipe(mergeMap(_test => {
                const ids_test_tracnghiem = [0];
                const ids_test_tuluan = [0];
                _test.data.forEach(f => {
                    switch (f.type) {
                        case 'THUONGXUYEN_TRACNGHIEM':
                            ids_test_tracnghiem.push(f.id);
                            break;
                        case 'THUONGXUYEN_TULUAN':
                            ids_test_tuluan.push(f.id);
                            break;
                        default:
                            break;
                    }
                })

                const condition_tracnghiem: ConditionOption = {
                    condition: [
                        { conditionName: 'student_id', condition: OvicQueryCondition.equal, value: this.selectedStudent.student_id.toString(), orWhere: 'and' },
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: ids_test_tracnghiem.toString() },
                        { label: 'include_by', value: 'class_plan_activities_id' }
                    ],
                    page: null
                }

                const condition_tuluan: ConditionOption = {
                    condition: [
                        { conditionName: 'student_id', condition: OvicQueryCondition.equal, value: this.selectedStudent.student_id.toString(), orWhere: 'and' },
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: ids_test_tuluan.toString() },
                        { label: 'include_by', value: 'class_plan_activity_id' }
                    ],
                    page: null
                }

                return forkJoin([
                    this.classPlanActivitiesTestsService.getClassPlanActivitiesTestsByPageNew(condition_tracnghiem),
                    this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_tuluan)
                ]).pipe(mergeMap(([_tracnghiem, _tuluan]) => {
                    _test.data.forEach(f => {
                        switch (f.type) {
                            case 'THUONGXUYEN_TRACNGHIEM':
                                if (_tracnghiem) {
                                    const index = _tracnghiem.data.findIndex(m => m.class_plan_activities_id === f.id);
                                    if (index !== -1) {
                                        f['current_test'] = _tracnghiem.data[index]['student_test'];
                                    }
                                }
                                break;
                            case 'THUONGXUYEN_TULUAN':
                                if (_tuluan) {
                                    const index = _tuluan.data.findIndex(m => m.class_plan_activity_id === f.id);
                                    if (index !== -1) {
                                        f['current_test'] = _tracnghiem.data[index]['student_test'];
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    })
                    return of(_test);
                }))
            }))
        ]).subscribe({
            next: ([_kynang_test, _tuan_test, _tuluan_test, _diemdanh, _current_class_plan]) => {

                this.noitifi.isProcessing(false);

                this.displaySyncClass = true;

                const weeks = [... new Set(_tuan_test.data.map(m => m.week))];

                const _weeks_test = [];

                weeks.forEach(f => {
                    const class_plan_activity_student_tests_ids = _tuan_test.data.filter(m => m.week === f).map(m => m.id);
                    _weeks_test.push({ week: f, checked: false, class_plan_activity_student_tests_ids: class_plan_activity_student_tests_ids });
                })

                const tx_test = [];

                _current_class_plan.data.forEach(f => {
                    switch (f.type) {
                        case 'THUONGXUYEN_TRACNGHIEM':
                            if (_kynang_test) {
                                const index = _kynang_test.data.findIndex(m => m.ordering === f.ordering);
                                if (index !== -1) {
                                    f['old_test'] = _kynang_test.data[index]['student_test'];
                                    tx_test.push(f);
                                }
                            }
                            break;
                        case 'THUONGXUYEN_TULUAN':
                            if (_tuluan_test) {
                                const index = _tuluan_test.data.findIndex(m => m.ordering === f.ordering);
                                if (index !== -1) {
                                    f['old_test'] = _tuluan_test.data[index]['student_test'];
                                    tx_test.push(f);
                                }
                            }
                            break;
                        default:
                            break;
                    }
                })

                this.list_week_test = this.helperService.sort(_weeks_test, 'week');

                this.list_tx_test = this.helperService.sort(tx_test, 'ordering');

                this.list_diemdanh = _diemdanh.data;

            },
            error: (e) => {
                console.log(e);
            }
        })

    }

    changeDataToClass() {
        const request: Observable<any>[] = [];
        this.list_week_test.forEach(f => {
            const index = this.selectedWeekTest.findIndex(m => m === f.week);
            if (index !== -1) {
                f['class_plan_activity_student_tests_ids'].forEach(c => {
                    request.push(this.classPlanActivityStudentTestsService.updateClassPlanActivityStudentTests(c,
                        {
                            old_class_id: this.selectedOtherClass.id,
                            class_id: this.classSelected.id,
                            move_data_by: this.auth.user.id,
                            updated_by: this.selectedStudent.user_id
                        }
                    ))
                })
            }
        })

        this.list_tx_test.forEach(f => {
            const index = this.selectedTxTest.findIndex(m => m === f.id);
            if (index !== -1) {

                switch (f.type) {
                    case 'THUONGXUYEN_TRACNGHIEM':
                        if (this.ghide_test) {
                            if (f['current_test']) {
                                request.push(this.classPlanActivitiesTestsService.deleteClassPlanActivitiesTests(f['current_test'].id))
                            }

                            if (f['old_test']) {
                                const data_ = {
                                    old_class_id: this.selectedOtherClass.id,
                                    class_id: this.classSelected.id,
                                    old_class_plan_activities_id: f['old_test'].class_plan_activities_id,
                                    class_plan_activities_id: f.id
                                }
                                request.push(this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(f['old_test'].id, data_))
                            }

                        } else {
                            if (f['old_test'] && !f['current_test']) {
                                const data_ = {
                                    old_class_id: this.selectedOtherClass.id,
                                    class_id: this.classSelected.id,
                                    old_class_plan_activities_id: f['old_test'].class_plan_activities_id,
                                    class_plan_activities_id: f.id
                                }
                                request.push(this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(f['old_test'].id, data_))
                            }
                        }
                        break;
                    case 'THUONGXUYEN_TULUAN':
                        if (this.ghide_test) {
                            if (f['current_test']) {
                                request.push(this.classPlanActivityTuluanService.deleteClassPlanActivityTuluan(f['current_test'].id))
                            }


                            if (f['old_test']) {
                                const data_ = {
                                    old_class_id: this.selectedOtherClass.id,
                                    class_id: this.classSelected.id,
                                    old_class_plan_activities_id: f['old_test'].class_plan_activity_id,
                                    class_plan_activity_id: f.id
                                }
                                request.push(this.classPlanActivityTuluanService.updateClassPlanActivityTuluan(f['old_test'].id, data_))
                            }

                        } else {
                            if (f['old_test'] && !f['current_test']) {
                                const data_ = {
                                    old_class_id: this.selectedOtherClass.id,
                                    class_id: this.classSelected.id,
                                    old_class_plan_activities_id: f['old_test'].class_plan_activity_id,
                                    class_plan_activity_id: f.id
                                }
                                request.push(this.classPlanActivityTuluanService.updateClassPlanActivityTuluan(f['old_test'].id, data_))
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        })

        if (this.selectDiemdanh) {
            this.list_diemdanh.forEach(f => {
                request.push(this.classStudentDiemdanhService.updateClassStudentDiemdanh(f.id, { class_id: this.classSelected.id, old_class_id: this.selectedOtherClass.id }))
            })
        }

        if (request.length) {
            this.progressValue = 0;
            this.displayModal = true;
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.displaySyncClass = false;
                    this.closeSideMenu();
                    this.noitifi.toastSuccess("Lưu thành công")
                },
                error: () => {
                    this.displayModal = false;
                    this.noitifi.toastError("Lưu thất bại, vui lòng thử lại")
                }
            })
        }
    }

    loopAddForm(request: Observable<any>[], key: number): Observable<any> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopAddForm(request, key + 1);
            } else {
                return of(null);
            }
        }))
    }

    onDownLoadFromHvuApi() {
        if (!this.classSelected || !this.classSelected.sync_class_id || this.classSelected.sync_class_id === '0') {
            this.noitifi.toastWarning('Lớp học chưa có ID đồng bộ EDU, Vui lòng liên hệ phòng đào tạo');
            return;
        }
        this.list_student_import = [];
        this.resetImportComparison();
        this.noitifi.isProcessing(true);
        this.hvuApiDanhsachSinhvienTheoLopService
            .getHvuApiDanhsachSinhvienTheoLopBybody({ id_lop: this.classSelected.sync_class_id.toString() })
            .pipe(
                concatMap((_sync_student) => {
                    if (!Array.isArray(_sync_student)) {
                        return throwError(() => new Error('invalid_hvu_data'));
                    }
                    const data_sync_student = [];
                    _sync_student.forEach((f, key) => {
                        const studentCode = this.normalizeStudentCode(f && f.ma_sinh_vien);
                        if (studentCode) {
                            data_sync_student.push([key + 1, studentCode, '', '']);
                        }
                    });
                    this.noitifi.isProcessing(false);
                    this.show_count_status = {
                        done: 0,
                        failed: 0,
                        not_import: 0,
                        no_teacher: 0,
                        no_category: 0,
                        sum_data: 0,
                        class_th: 0,
                        class_lt: 0,
                        exist: 0,
                        no_data: 0,
                    };
                    this.displayModal = true;
                    this.progressValue = 0;
                    this.waitting_title = 'Đang lấy dữ liệu sinh viên, vui lòng chờ';
                    return this.loopGetStudentFromHvu([], 1, 1000, data_sync_student);
                })
            )
            .subscribe({
                error: (error) => {
                    this.displayModal = false;
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastWarning(
                        error && error.message === 'invalid_hvu_data'
                            ? 'Dữ liệu sinh viên từ HVU không hợp lệ'
                            : 'Tải thất bại, vui lòng thử lại'
                    );
                }
            });
    }
}
