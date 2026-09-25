import { ExportPointForIUService } from './../../../../../shared/services/export-point-for-IU.service';
import { FileService } from '@core/services/file.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ThiShifts } from '@modules/shared/models/thi-shifts';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { RoleService } from '@core/services/role.service';
import { UserService } from '@core/services/user.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SidebarModule } from 'primeng/sidebar';
import { TableModule } from 'primeng/table';
import { forkJoin, mergeMap, of } from 'rxjs';
import { PhongthiComponent } from '../../phongthi/phongthi.component';
import { OvicQueryCondition } from '@core/models/dto';
import { SharedModule } from '@modules/shared/shared.module';
import { ThiShiftRooms } from '@modules/shared/models/thi-shift-room';
import { User } from '@core/models/user';
import { TYPELOG } from '@modules/shared/models/thi-logs';
import { ThiShiftStudents } from '@modules/shared/models/thi-shift-students';
import * as XLSX from 'xlsx';
import { APP_CONFIGS } from '@env';
import { KEY_ANSWER_new, ROLES } from '@modules/shared/utils/syscat';
import { ThibackupFormService } from '@modules/shared/services/thibackup-form.service';
import { ThibackupLogsService } from '@modules/shared/services/thibackup-logs.service';
import { ThibackupShiftRoomssService } from '@modules/shared/services/thibackup-shift-rooms.service';
import { ThibackupShiftStudentsService } from '@modules/shared/services/thibackup-shift-students.service';
import { ThibackupShiftsService } from '@modules/shared/services/thibackup-shift.service';
import { ThiShiftRoomssService } from '@modules/shared/services/thi-shift-rooms.service';
import { ThiShiftsService } from '@modules/shared/services/thi-shifts.service';
import { ThiShiftStudentsService } from '@modules/shared/services/thi-shift-students.service';
import { ThiFormService } from '@modules/shared/services/thi-form.service';
import { ThiLogsService } from '@modules/shared/services/thi-log.service';
@Component({
    selector: 'app-thongke-cathi',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        TableModule,
        PaginatorModule,
        ReactiveFormsModule,
        CalendarModule,
        MatMenuModule,
        OverlayPanelModule,
        NgbTooltipModule,
        SidebarModule,
        MatListModule,
        CheckboxModule
    ],
    templateUrl: './thongke-cathi.component.html',
    styleUrls: ['./thongke-cathi.component.css']
})
export class ThongkeCathiComponent implements OnInit {

    @ViewChild('paginator_shift') paginator_shift: Paginator;

    @ViewChild('templateRoom') templateRoom: TemplateRef<any>;

    @ViewChild('templateRoomLog') templateRoomLog: TemplateRef<any>;


    selectedShift: ThiShifts;

    list_course: ElnKhoaHoc[];

    list_hocky: { value: string, label: string }[] = [];

    list_dotthi: { value: string, label: string }[] = [];

    list_namhoc: { value: string, label: string }[] = [];

    limit_shifts: number = 20;

    pageIndex: number = 1;

    list_shifts: ThiShifts[];

    list_room: ThiShiftRooms[];

    selectedRoom: ThiShiftRooms;

    list_canbo_coithi: User[];

    total_shifts: number = 0;

    option_status_filter = [
        { label: 'Chưa kích hoạt', id: 0 },
        { label: 'Đã kích hoạt', id: 1 },
        { label: 'Đã kết thúc', id: 2 },
    ];

    objectFillter = {
        course_id: null,
        hocky: null,
        namhoc: null,
        dotthi: null,
        status: null,
    };
    type_log = TYPELOG;

    closeLeft: boolean = false;

    isManager: boolean = false;

    today: Date;

    searchRoom: string;

    keyAnswer = KEY_ANSWER_new;

    constructor(
        private thiShiftsService: ThiShiftsService,
        private notificationService: NotificationService,
        private helperService: HelperService,
        private formBuilder: FormBuilder,
        private auth: AuthService,
        private classesService: ClassesService,
        private ovicDateTimeService: OvicDateTimeService,
        private elnKhoaHocService: ElnKhoaHocService,
        private thiShiftRoomssService: ThiShiftRoomssService,
        private roleService: RoleService,
        private userService: UserService,
        private thiShiftStudentsService: ThiShiftStudentsService,
        private thiFormService: ThiFormService,
        private thiLogsService: ThiLogsService,
        private fileService: FileService,
        private exportPointForIUService: ExportPointForIUService
    ) {
        this.isManager = true;
    }

    ngOnInit(): void {
        this.initLoad();
    }

    getRolesPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const objectRoles = {};
            const role_ = [];
            Object.keys(ROLES).forEach(f => {
                if (f !== ROLES.student) {
                    role_.push(ROLES[f]);
                }
            })
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: role_.toString() },
                    { label: 'include_by', value: 'name' },
                ],
                page: null,
            };
            this.roleService.getRolesByPageNew(condition).subscribe({
                next: (_role) => {
                    _role.data.forEach((f) => {
                        objectRoles[f.name] = f;
                    });

                    this.notificationService.isProcessing(false);
                    resolve(objectRoles);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError(
                        'Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công'
                    );
                    resolve(null);
                },
            });
        });
    }

    async initLoad() {
        const condition_hocky: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'hocky' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'hocky' },
                { label: 'select', value: 'hocky' },
            ],
            page: null
        }

        const condition_course: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,av,maso,title,id,category_ids' },
            ],
            page: null
        }

        const condition_dotthi: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'dotthi' },
                { label: 'select', value: 'dotthi' },
            ],
            page: null
        }


        this.notificationService.isProcessing(true);

        const objectRoles = await this.getRolesPromise();

        const ids_roles = [];

        Object.keys(objectRoles).forEach((f) => {
            ids_roles.push(objectRoles[f].id);
        });

        const condition_teacher: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'role_ids', value: ids_roles.toString() }
            ],
            page: ''
        }

        forkJoin([
            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course),
            this.classesService.getClassesByPageNew(condition_hocky),
            this.ovicDateTimeService.getCurrentDateTime(),
            this.thiShiftsService.getThiShiftsByPageNew(condition_dotthi),
            this.userService.getUserByPageNew(condition_teacher),
        ]).subscribe({
            next: ([_course, _hocky, _date, _dotthi, _teacher]) => {
                this.list_course = [];
                const index_user = _teacher.data.findIndex(m => m.id === this.auth.user.id);
                this.list_canbo_coithi = _teacher.data;
                if (index_user === -1) {
                    this.list_canbo_coithi.push(this.auth.user);
                }

                _course.data.forEach(f => {
                    f['label_name'] = "[".concat(f.maso, "] - ", f.title);
                })

                if (_course)
                    this.list_course = _course.data;

                const _hockys = [];

                _hocky.data.forEach(f => {
                    if (f.hocky)
                        _hockys.push({ value: f.hocky, label: 'Học kỳ '.concat(f.hocky) })
                })

                const dotthis = [];

                _dotthi.data.forEach(f => {
                    if (f.dotthi)
                        dotthis.push({ value: f.dotthi, label: 'Đợt thi '.concat(f.dotthi.toString()) })
                })

                this.list_dotthi = dotthis;
                this.list_hocky = _hockys;

                const d = new Date(_date);

                this.today = _date;

                const preYear = (d.getFullYear() - 1).toString().concat("_", d.getFullYear().toString());
                const nextYear = (d.getFullYear()).toString().concat("_", (d.getFullYear() + 1).toString());
                const namhocs = [
                    { value: nextYear, label: ''.concat(nextYear) },
                    { value: preYear, label: ''.concat(preYear) },
                ]

                this.list_namhoc = namhocs;

                this.loadShiftsPage(1);
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
    }

    loadShiftsPage(page: number) {
        const condition_shift: ConditionOption = {
            condition: [
                { conditionName: 'type_of_test', condition: OvicQueryCondition.equal, value: 'TRACNGHIEM' },
                { conditionName: 'time_start', condition: OvicQueryCondition.lessThanOrEqualsTo, value: this.helperService.strToSQLDate(this.today.toString()).concat(' 23:59'), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: this.limit_shifts.toString() },
                { label: 'order', value: 'DESC' },
                { label: 'orderby', value: 'time_start' },
                // { label: 'withCountTest', value: '1' },
                // { label: 'withCount', value: '1' },
                { label: 'with', value: 'user_created,shift_student' },

            ],

            page: page.toString()
        }

        const filter_like = { 'name': 1 };

        if (this.objectFillter && Object.keys(this.objectFillter)) {
            Object.keys(this.objectFillter).forEach(f => {
                if (this.objectFillter[f] !== null) {
                    if (filter_like[f]) {
                        condition_shift.condition.push({ conditionName: f, condition: OvicQueryCondition.like, value: '%' + this.objectFillter[f] + '%', orWhere: 'and' })
                    } else {
                        condition_shift.condition.push({ conditionName: f, condition: OvicQueryCondition.equal, value: this.objectFillter[f], orWhere: 'and' })
                    }
                }
            })
        }

        if (!this.objectFillter['status'] && this.objectFillter['status'] !== 0) {
            condition_shift.condition.push({ conditionName: 'status', condition: OvicQueryCondition.lessThanOrEqualsTo, value: '2', orWhere: 'and' });
            condition_shift.condition.push({ conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' })
        }

        this.notificationService.isProcessing(true);

        if (!this.isManager) {
            condition_shift.condition.push({ conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' })
        }

        this.thiShiftsService.getThiShiftsByPageNew(condition_shift).pipe(mergeMap(_res => {
            // const form_ids = _res.data.map(m => m.form_id);
            // if (form_ids.length) {
            //     const condition_form: ConditionOption = {
            //         condition: [],
            //         set: [
            //             { label: 'limit', value: '-1' },
            //             { label: 'include', value: [...new Set(form_ids)].toString() },
            //             { label: 'include_by', value: 'id' }
            //         ],
            //         page: null
            //     }
            //     return this.thiFormService.getThiFormByPageNew(condition_form).pipe(mergeMap(_form => {
            //         _res.data.forEach(f => {
            //             const index = _form.data.findIndex(i => i.id === f.form_id);
            //             if (index !== -1) {
            //                 f['form_label'] = _form.data[index].name;
            //             }
            //         })
            //         return of(_res);
            //     }))
            // }
            return of(_res);
        })).subscribe({
            next: (_shifts) => {
                this.notificationService.isProcessing(false);
                const _index_start = (page - 1) * this.limit_shifts;
                _shifts.data.forEach((f, key) => {
                    f['checked'] = false;
                    f['index_'] = _index_start + key + 1;
                    f['count_student'] = 0;
                    f['count_test'] = 0;
                    if (f['shift_student'] && Array.isArray(f['shift_student'])) {
                        f['count_student'] = f['shift_student'].length;
                        f['count_test'] = f['shift_student'].filter(m => m !== 0).length;
                    }
                })
                this.list_shifts = _shifts.data;
                this.total_shifts = _shifts.recordsFiltered;
            },
            error: () => {
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                this.notificationService.isProcessing(false)
            }
        })
    }

    changePage_shift(event) {
        this.pageIndex = event.page + 1;
        this.loadShiftsPage(event.page + 1)
    }

    returnToOrderPage(page_order: number) {
        if (this.paginator_shift) {
            if (!this.paginator_shift.empty()) {
                this.paginator_shift.changePage(page_order - 1);
            } else {
                this.loadShiftsPage(1);
            }
        } else {
            this.loadShiftsPage(1);
        }
    }

    onSelectShift(event: ThiShifts) {
        this.selectedShift = event;
        this.loadShiftRoom();
    }

    keyupForFilterByName(event) {
        if (!event) {
            this.objectFillter['name'] = event.toString().trim();
            this.returnToOrderPage(1);
        }
    }

    startFilter(event, key) {
        if (event && event.toString().trim() || event === 0) {
            this.objectFillter[key] = event;
        } else {
            this.objectFillter[key] = null;
        }
        this.returnToOrderPage(1);
    }

    cancelFilter() {
        this.objectFillter = {
            course_id: null,
            hocky: null,
            namhoc: null,
            dotthi: null,
            status: 1
        };;
        this.returnToOrderPage(1);
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }


    loadShiftRoom() {
        this.list_room = [];
        const condition_room: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'shift_student' }
            ],
            page: null
        }

        const condition_log: ConditionOption = {
            condition: [
                { conditionName: 'thi_shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'created_at' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.thiShiftRoomssService.getThiShiftRoomssByPageNew(condition_room),
            this.thiLogsService.getThiLogsByPageNew(condition_log)
        ]).subscribe({
            next: ([_room, _log]) => {
                _room.data.forEach(f => {
                    const index = _log.data.findIndex(m => m.object === "thi_shift_room" && m.object_id === f.id && m.type === 'HOANTHANHCOITHI');
                    if (index !== -1) {
                        f['time_end'] = _log.data[index].created_at;
                        f['status_room'] = 2;
                    } else {
                        f['time_end'] = "-";
                        const index_start = _log.data.findIndex(m => m.object === "thi_shift_room" && m.object_id === f.id && m.type === 'ENTER_ROOM');
                        if (index_start !== -1) {
                            f['status_room'] = 1;
                        } else {
                            f['status_room'] = 0;
                        }
                    }

                    f['slvang'] = f['shift_student'].filter(m => m.locked !== 0).length;
                    f['slvipham'] = f['shift_student'].filter(m => m.violation_of_exam).length;
                    f['room_log_teacher'] = _log.data.filter(m => m.object === "thi_shift_room" && m.object_id === f.id);
                    f['shift_student'].forEach(s => {
                        f['room_log_teacher'] = f['room_log_teacher'].concat(_log.data.filter(m => m.object === "thi_shift_student" && m.object_id === s.id))
                    })
                    f['room_log_teacher'] = this.helperService.sort(f['room_log_teacher'], 'id');
                })
                this.list_room = _room.data;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }


    closeSideMenu() {
        this.notificationService.closeSideNavigationMenu();
    }

    openRoomLog(room: ThiShiftRooms) {
        this.selectedRoom = room;
        this.notificationService.openSideNavigationMenu({ template: this.templateRoomLog, size: 1024, offsetTop: '0px' });
    }

    startDownLoadPoint() {
        const data_download = this.list_shifts.filter(m => m['checked']);
        if (data_download.length) {
            this.notificationService.isProcessing(true);
            const shift_ids = data_download.map(m => m.id);
            const condition_room: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: shift_ids.toString() },
                    { label: 'include_by', value: 'shift_id' },
                    { label: 'with', value: 'student' }
                ],
                page: null
            }

            forkJoin([
                this.thiShiftStudentsService.getThiShiftStudentsByPageNew(condition_room),
                this.fileService.getFileLocalAsBlob("..\\assets\\files\\mau_file_import_LMS-LCMS\\DE_IMPORT_VAO_IU.xls")
            ]).subscribe({
                next: ([_student, _resFile]) => {
                    this.notificationService.isProcessing(false);
                    this.downloadAsExcel(data_download, this.helperService.sort(_student.data, 'sbd'), _resFile);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                }
            })
        } else {
            this.notificationService.toastInfo("Vui lòng chọn ca thi trước khi tải");
        }
    }

    downloadAsExcel(shift_check: ThiShifts[], _shift_student: ThiShiftStudents[], _resFile: Blob) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(_resFile);
        reader.onloadend = (event) => {
            const localUrl = reader.result;
            const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'binary' });
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            let i = 0;
            const topData = data.splice(0, 10);
            const headerData = [];
            const tableHeader = [];
            topData.forEach((f, key) => {
                if (Array.isArray(f)) {
                    if (!f[0]) {
                        f[0] = '';
                    }
                }
                if (key < 9) {
                    headerData.push(f);
                } else {
                    tableHeader.push(f);
                }
            })

            shift_check.forEach(shift => {
                const shift_student_in_cathi = _shift_student.filter(m => m.shift_id === shift.id);
                const objectRoom = {};
                objectRoom[shift.id] = {};
                objectRoom[shift.id]['dataTable'] = [];
                shift_student_in_cathi.forEach((f, key) => {
                    objectRoom[shift.id]['dataTable'].push(this.dataByClass(f, key + 1))
                })
                Object.keys(objectRoom).forEach((f, key) => {
                    objectRoom[f]["header"] = [];
                    headerData.forEach((he, heKey) => {
                        objectRoom[f]["header"].push([...he]);
                    })
                    objectRoom[f]["header"][0][0] = APP_CONFIGS.donviquanly.toUpperCase();
                    objectRoom[f]["header"][1][0] = APP_CONFIGS.donvitructhuoc.toUpperCase();
                    objectRoom[f]["header"][3][0] = 'Ca thi: ' + shift.name;
                    const index_course = this.list_course.findIndex(m => m.id === shift.course_id);
                    objectRoom[f]["header"][4][0] = 'Mã học phần: '.concat(index_course !== -1 ? this.list_course[index_course].maso : '-');
                    objectRoom[f]["header"][4][4] = index_course !== -1 && this.list_course[index_course].params ? this.list_course[index_course].params.sotinchi : '-';
                    objectRoom[f]["header"][4][7] = index_course !== -1 ? this.list_course[index_course].title : '-';
                    const dateThi = new Date(shift.time_start);
                    objectRoom[f]["header"][5][0] = 'Ngày thi: ' + dateThi.toLocaleString('en-GB').split(",")[0];
                    objectRoom[f]["header"][5][6] = "Đợt thi: " + shift.namhoc.concat("_", shift.hocky.toString(), " đợt ", shift.dotthi.toString());
                    objectRoom[f]["tableHeader"] = tableHeader;
                    objectRoom[f]["mergesData"] = [];
                    ws['!merges'].map(m => {
                        if (m.s.r < 9) {
                            objectRoom[f]["mergesData"].push(this.keyAnswer[m.s.c].concat((m.s.r + 1).toString(), ':', this.keyAnswer[m.e.c], (m.e.r + 1).toString()));
                        }
                    });
                })
                shift['objectExcel'] = objectRoom;
            })

            const cols = {
                donvitructhuoc: {
                    name: 'A1:D1',
                    font: { name: 'Arial', family: 1, size: 10, bold: true },
                    alignment: { vertical: 'middle', horizontal: 'center' },
                },
                donvo: {
                    name: 'A2:D2',
                    font: { name: 'Arial', family: 1, size: 10, bold: true },
                    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
                },
                chxhcn: {
                    name: 'G1:J1',
                    font: { name: 'Arial', family: 1, size: 10 },
                    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
                },
                dltdhp: {
                    name: 'G2:J2',
                    font: { name: 'Arial', family: 1, size: 10, underline: true },
                    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
                },
                title_sub: {
                    name: 'A3:K3',
                    font: { name: 'Arial', family: 1, size: 10, bold: true },
                    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
                },
                title: {
                    name: 'A4:K4',
                    font: { name: 'Arial', family: 1, size: 10, bold: true },
                    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
                },
                // col_1: {
                //     name: 'C6:L6',
                //     font: { name: 'Arial', family: 1, size: 10, bold: true },
                //     alignment: { vertical: 'middle', horizontal: 'left' },
                // },
                // col_2: {
                //     name: 'M6:S6',
                //     font: { name: 'Arial', family: 1, size: 10, bold: true },
                //     alignment: { vertical: 'middle', horizontal: 'left' },
                // },
                // col_3: {
                //     name: 'A7:K7',
                //     font: { name: 'Arial', family: 1, size: 10, bold: true },
                //     alignment: { vertical: 'middle', horizontal: 'left' },
                // }
            };
            const widthPoint = 13;
            const objectColWidth = { 1: 8, 2: 13, 3: 15, 4: 15, 5: widthPoint, 6: 25, 7: 25, 8: widthPoint, 9: widthPoint, 10: widthPoint, 11: 15 };
            this.notificationService.isProcessing(false);
            this.exportPointForIUService.exportExcel(shift_check, cols, objectColWidth, { name: 'Arial', family: 1, size: 10 }, 'Danh sách ca thi');

        };
    }

    dataByClass(value: ThiShiftStudents, key) {
        let status = null;

        let ghichu = '';

        let point = value.point === -1 ? 0 : value.point;

        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const get_violation = config.find(m => m.config_key === 'GET_VIOLATION_OF_EXAM')['params'];

        const config_array = [];

        if (get_violation && Object.keys(get_violation)) {
            Object.keys(get_violation).forEach(f => {
                get_violation[f]['key'] = f;
                config_array.push(get_violation[f]);
            })
        }

        if (value.violation_of_exam && value.violation_of_exam.title) {
            const index = config_array.findIndex(m => m.key === value.violation_of_exam.key);
            if (index !== -1) {
                point = parseFloat((value.point * ((100 - (Number(config_array[index]['POINT']))) / 100)).toFixed(1));
                if (config_array[index]['POINT'] === 100) {
                    ghichu = 'Đình chỉ'
                } else {
                    ghichu = value.violation_of_exam.title.concat(' (đã trừ ', config_array[index]['POINT'].toString(), '%)');
                }

            }
        }

        if (value.status === 1) {
            if (value.violation_of_exam && value.violation_of_exam.key === "DINH_CHI") {
                status = "OF";
            }
        } else if (value.status === 0) {
            if (value.locked === 1) {
                status = "VK";
                ghichu = "Bỏ thi";
            } else if (value.locked === 2) {
                status = "DHT";
            }
        } else if (value.status === -1) {
            status = "HUY";
            ghichu = "Hủy";
        }

        return [
            key,
            value.shift_id,
            value.room,
            value.id,
            '',
            value.student.student_code.toUpperCase(),
            value.student.full_name,
            value.sbd,
            status !== null ? status : parseFloat(point.toString()),
            ghichu,
        ];
    }
}
