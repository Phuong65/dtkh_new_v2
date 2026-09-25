import { style } from '@angular/animations';
import { ThiStudentAnswerService } from './../../../../shared/services/thi-student-answer.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { ExportPointForIUService } from '@shared/services/export-point-for-IU.service';
import { FileService } from '@core/services/file.service';
import { ThiLogsService } from '@shared/services/thi-log.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ThiShifts } from '@modules/shared/models/thi-shifts';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
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
import { ThiFormService } from '@modules/shared/services/thi-form.service';
import { ThiShiftRoomssService } from '@modules/shared/services/thi-shift-rooms.service';
import { ThiShiftStudentsService } from '@modules/shared/services/thi-shift-students.service';
import { ThiShiftsService } from '@modules/shared/services/thi-shifts.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SidebarModule } from 'primeng/sidebar';
import { TableModule } from 'primeng/table';
import { forkJoin, mergeMap, Observable, of, concat, catchError } from 'rxjs';
import { OvicQueryCondition } from '@core/models/dto';
import { SharedModule } from '@modules/shared/shared.module';
import { ThiShiftRooms } from '@modules/shared/models/thi-shift-room';
import { User } from '@core/models/user';
import { TYPELOG } from '@modules/shared/models/thi-logs';
import { ThiShiftStudents } from '@modules/shared/models/thi-shift-students';
import * as XLSX from 'xlsx';
import { APP_CONFIGS, getLinkDownload_aws } from '@env';
import { KEY_ANSWER_new } from '@modules/shared/utils/syscat';
import { TabViewModule } from 'primeng/tabview';
import { CarouselModule } from 'primeng/carousel';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { StepsModule } from 'primeng/steps';
import { ThiStudentAnswer } from '@modules/shared/models/thi-student-answer';
import * as pdfFonts from '@shared/utils/vs_font';
import JSZip from 'jszip';
import * as fs from 'file-saver';

@Component({
    selector: 'app-xuat-baithi-root',
    standalone: true,
    imports: [
        CarouselModule,
        TabViewModule,
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
        CheckboxModule,
        DialogModule,
        MatProgressBarModule,
        StepsModule
    ],
    templateUrl: './xuat-baithi-root.component.html',
    styleUrls: ['./xuat-baithi-root.component.css']
})
export class XuatBaithiRootComponent implements OnInit {
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
        // status: null,
    };
    type_log = TYPELOG;

    closeLeft: boolean = false;

    isManager: boolean = false;

    today: Date;

    searchRoom: string;

    keyAnswer = KEY_ANSWER_new;

    list_student: ThiShiftStudents[];

    dbConfig: any;

    indexRoom: number = 0;

    searchStudent: string;

    responsiveOptions = [];

    selectedShiftStudents: ThiShiftStudents[] = [];

    progressValue: number = 0;

    displayModal: boolean = false;

    waitingTitle: string = '';

    itemsStep = [
        { label: 'Tải bài thi' },
        { label: 'Đồng bộ dữ liệu' },
        { label: 'Tải ảnh' },
        { label: 'Nén dữ liệu' }
    ];

    hasStep: boolean = false;

    activeIndexStep: number = 0;

    downloadShift: boolean = false;

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
        private exportPointForIUService: ExportPointForIUService,
        private courseQuestionsService: CourseQuestionsService,
        private thiStudentAnswerService: ThiStudentAnswerService
    ) {

        this.responsiveOptions = [
            {
                breakpoint: '1024px',
                numVisible: 3,
                numScroll: 3
            },
            {
                breakpoint: '768px',
                numVisible: 2,
                numScroll: 2
            },
            {
                breakpoint: '560px',
                numVisible: 1,
                numScroll: 1
            }
        ];

    }

    ngOnInit(): void {
        this.initLoad();
    }

    getRolesPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const objectRoles = {};
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: 'teacher,uni_leader,fact_leader,bm_leader,hdthi_chutich,hdthi_thuky,hdthi_cbct,hdthi_qlct,chuyenvien,hssv' },
                    { label: 'include_by', value: 'name' },
                ],
                page: null,
            };
            this.roleService.getRolesByPageNew(condition).subscribe({
                next: (_role) => {
                    _role.data.forEach((f) => {
                        objectRoles[f.name] = f;
                    });

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
                { conditionName: 'time_start', condition: OvicQueryCondition.lessThanOrEqualsTo, value: this.helperService.strToSQLDate(this.today.toString()).concat(' 23:59'), orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '2', orWhere: 'and' }
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

        // if (!this.objectFillter['status'] && this.objectFillter['status'] !== 0) {
        //     condition_shift.condition.push({ conditionName: 'status', condition: OvicQueryCondition.lessThanOrEqualsTo, value: '2', orWhere: 'and' });
        //     condition_shift.condition.push({ conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' })
        // }

        this.notificationService.isProcessing(true);

        // if (!this.isManager) {
        //     condition_shift.condition.push({ conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' })
        // }

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

    onSelectShift(event: ThiShifts, download_shift: boolean = false) {
        this.selectedShift = event;
        const index = this.list_course.findIndex(m => m.id === this.selectedShift.course_id);
        if (index !== -1) {
            this.selectedShift['av'] = this.list_course[index].av;
        }
        this.downloadShift = download_shift;
        this.loadShiftRoom(download_shift);
    }

    keyupForFilterByName(event) {
        if (!event) {
            this.objectFillter['name'] = event.toString().trim();
            this.returnToOrderPage(1);
        }
    }

    changePage_shift(event) {
        this.pageIndex = event.page + 1;
        this.loadShiftsPage(event.page + 1)
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
        };;
        this.returnToOrderPage(1);
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

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    loadShiftRoom(download_shift: boolean = false) {
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

        const condition_shift_student: ConditionOption = {

            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'room' },
            ],

            page: null
        }


        this.notificationService.isProcessing(true);

        forkJoin([
            this.thiShiftRoomssService.getThiShiftRoomssByPageNew(condition_room),
            this.thiLogsService.getThiLogsByPageNew(condition_log),
            this.thiShiftStudentsService.getThiShiftStudentsByPageNew(condition_shift_student),
        ]).subscribe({
            next: ([_room, _log, _student]) => {
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
                    f['students'] = _student.data.filter(m => m.room === f.room).length;
                    f['shift_student'].forEach(s => {
                        f['room_log_teacher'] = f['room_log_teacher'].concat(_log.data.filter(m => m.object === "thi_shift_student" && m.object_id === s.id))
                    })
                    f['room_log_teacher'] = this.helperService.sort(f['room_log_teacher'], 'id');
                })

                this.list_room = _room.data;

                if (this.list_room && this.list_room.length) {
                    this.openRoom(this.list_room[0], download_shift);
                } else {
                    this.notificationService.isProcessing(false);
                }

                // this.openRoom(this.list_room[this.indexRoom]);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    // changeTabRoom(event) {
    //     this.openRoom(this.list_room[this.indexRoom])
    // }

    openRoom(room: ThiShiftRooms, download_shift: boolean = false) {
        this.selectedRoom = room;

        this.selectedShiftStudents = [];

        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const get_violation = config.find(m => m.config_key === 'GET_VIOLATION_OF_EXAM')['params'];

        const config_array = [];

        if (get_violation && Object.keys(get_violation)) {
            Object.keys(get_violation).forEach(f => {
                get_violation[f]['key'] = f;
                config_array.push(get_violation[f]);
            })
        }

        this.dbConfig = config_array;

        this.loadListShiftStudent(false, download_shift);
    }

    loadListShiftStudent(download: boolean = false, download_shift: boolean = false) {
        const condition_shift_student: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'student,controls,user' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'select', value: 'questions,tracking,id,shift_id,student_id,sbd,ordering,room,status,completed,locked,point,time_remaining,thi_question_bank_tn_id,student_user_id,violation_of_exam,progress,total,warning,submited_by' },
            ],

            page: null
        }

        if (!download_shift) {
            condition_shift_student.condition.push({ conditionName: 'room', condition: OvicQueryCondition.equal, value: this.selectedRoom.room, orWhere: 'and' },)
        }



        this.notificationService.isProcessing(true);

        this.thiShiftStudentsService.getThiShiftStudentsByPageNew(condition_shift_student).subscribe({
            next: (_student_shift) => {
                _student_shift.data.forEach(f => {

                    f['_student_status'] = f.status;

                    if (f.status === 1) {
                        if (f.completed === 1) {
                            f['_student_status'] = 2
                        }
                    }


                    const phut = f.time_remaining ? Math.floor(f.time_remaining / 60) : 0;

                    const giay = f.time_remaining ? (f.time_remaining % 60) : 0;

                    f['time_left_convert'] = phut.toString().concat('p ', giay.toString(), 's');

                    f['full_name'] = f.student.full_name;

                    f['student_code'] = f.student.student_code;

                    if (f.violation_of_exam && f.violation_of_exam.key) {
                        const index = this.dbConfig.findIndex(m => m.key === f.violation_of_exam.key);
                        if (index !== -1) {
                            if (f._student_status === 2) {
                                f.point = parseFloat((f.point * ((100 - (Number(this.dbConfig[index]['POINT']))) / 100)).toFixed(1));
                            }
                        }
                    }

                    if (f.status === -1) {
                        f.point = 0;
                    }

                    const warning_array = f.warning ? f.warning.split("|") : [];
                    f['warning_array'] = [];

                    warning_array.forEach(t => {
                        f['warning_array'].push({ time: t });
                    })
                })


                this.list_student = download_shift ? _student_shift.data.filter(m => m.room === this.selectedRoom.room) : _student_shift.data;

                this.notificationService.isProcessing(false);

                if (_student_shift.data.length) {
                    if (download === true && download_shift === false) {
                        this.donwloadQuestion(this.list_student.filter(m => m.point > -1 && m.point !== null &&
                            m._student_status !== -1))
                    } else if (download === false && download_shift === true) {

                        this.donwloadQuestion(_student_shift.data.filter(m => m.point > -1 && m.point !== null &&
                            m._student_status !== -1))
                    }
                }
            },

            error: () => {
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                this.notificationService.isProcessing(false);
            }

        })
    }

    downloadAllBaithiRoom(room) {
        this.selectedRoom = room;

        this.selectedShiftStudents = [];

        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const get_violation = config.find(m => m.config_key === 'GET_VIOLATION_OF_EXAM')['params'];

        const config_array = [];

        if (get_violation && Object.keys(get_violation)) {
            Object.keys(get_violation).forEach(f => {
                get_violation[f]['key'] = f;
                config_array.push(get_violation[f]);
            })
        }

        this.dbConfig = config_array;

        this.downloadShift = false;

        this.loadListShiftStudent(true);
    }

    dowloadBaithiInRoom() {
        this.downloadShift = false;
        if (this.selectedShiftStudents && this.selectedShiftStudents.length) {
            this.donwloadQuestion(this.selectedShiftStudents.filter(m => m.point > -1 && m.point !== null &&
                m._student_status !== -1));
        } else {
            this.notificationService.toastWarning("Vui lòng chọn bài thi")
        }

    }

    loopGetDataQuestion(request: Observable<any>[], key: number, result: any[]): Observable<CourseQuestions[]> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopGetDataQuestion(request, key + 1, result.concat(a.data));
            } else {
                return of(result.concat(a.data));
            }
        }))
    }

    loopGetDataStudentAnswer(request: Observable<any>[], key: number, result: any[]): Observable<ThiStudentAnswer[]> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopGetDataStudentAnswer(request, key + 1, result.concat(a.data));
            } else {
                return of(result.concat(a.data));
            }
        }))
    }

    loopGetDataImage(request: Observable<any>[][], key: number): Observable<any> {
        return forkJoin(request[key]).pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopGetDataImage(request, key + 1);
            } else {
                return of(null);
            }
        }))
    }

    getStylePromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.fileService.getFileLocalAsBlob('..\\assets\\css\\downloadTest.css').subscribe({
                next: (_style_css) => {
                    resolve(_style_css);
                },
                error: () => {
                    resolve(null);
                },
            });
        });
    }

    donwloadQuestion(shift_student: ThiShiftStudents[]) {
        const request: Observable<any>[] = [];

        const request_answer: Observable<any>[] = [];

        let id_question = [];

        const ar_id_shift_student = [];
        let j = 0;
        ar_id_shift_student[j] = [];

        shift_student.forEach(f => {
            if (f.questions) {
                id_question = id_question.concat(f.questions);
            }

            if (ar_id_shift_student[j].length < 10) {
                ar_id_shift_student[j].push(f.id);
            } else {
                j = j + 1;
                ar_id_shift_student[j] = [];
                ar_id_shift_student[j].push(f.id);
            }
        })

        ar_id_shift_student.forEach(f => {
            const condtion_question: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: f.toString() },
                    { label: 'include_by', value: 'shift_student_id' }
                ],
                page: null
            }
            request_answer.push(this.thiStudentAnswerService.getThiStudentAnswerByPageNew(condtion_question));
        })

        id_question = [... new Set(id_question)];

        const ar_id_question = [];
        let i = 0;
        ar_id_question[i] = [];

        id_question.forEach(f => {
            if (ar_id_question[i].length < 100) {
                ar_id_question[i].push(f);
            } else {
                i = i + 1;
                ar_id_question[i] = [];
                ar_id_question[i].push(f);
            }
        })



        this.waitingTitle = 'Đang tải dữ liệu, vui lòng không tắt trình duyệt';



        ar_id_question.forEach(f => {
            const condtion_question: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: f.toString() },
                    { label: 'include_by', value: 'id ' }
                ],
                page: null
            }
            request.push(this.courseQuestionsService.getCourseQuestionsByPageNew(condtion_question));
        })

        this.displayModal = true;
        this.progressValue = 0;
        this.hasStep = true;
        this.activeIndexStep = 0;
        if (request.length) {
            this.loopGetDataQuestion(request, 0, []).subscribe({
                next: (_questions) => {

                    let list_part = [];

                    if (this.selectedShift['av'] === 1) {
                        let parts = _questions.map(m => m.code);

                        parts = [... new Set(parts)];

                        parts.forEach(m => {
                            if (m) {
                                list_part.push({
                                    id: m.replace(/\D/g, ''),
                                    label: m
                                })
                            }
                        })
                    }

                    list_part = this.helperService.sort(list_part, "id");


                    shift_student.forEach(f => {
                        if (f.questions && f.questions.length) {
                            const question_test = [];
                            _questions.filter(i => f.questions.findIndex(m => m === i.id) !== -1).forEach(_q => {
                                const ob_question = {};
                                Object.keys(_q).forEach(o => {
                                    ob_question[o] = _q[o];
                                })
                                question_test.push(ob_question);
                            })
                            const parent = question_test.filter(m => m.group_id === 0);
                            parent.forEach(p => {
                                p['children'] = question_test.filter(m => m.group_id === p.id);
                            })

                            if (this.selectedShift['av'] === 1) {
                                const part_question = [];
                                list_part.forEach(lp => {
                                    const item_part = {
                                        label: lp.label,
                                        list_question: parent.filter(m => m['code'] === lp.label),
                                    }
                                    part_question.push(item_part);
                                })
                                f['list_part'] = part_question;
                            } else {
                                f['list_question'] = parent;
                            }
                        }
                    })

                    this.activeIndexStep = 1;
                    this.progressValue = 0;
                    this.waitingTitle = "Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt";
                    this.loopGetDataStudentAnswer(request_answer, 0, []).subscribe({
                        next: async (_student_answer) => {
                            const _style_css = await this.getStylePromise();
                            const stringStyleCss = await _style_css.text();
                            shift_student.forEach(f => {
                                f['count_student_ans'] = 0;
                                f['count_student_ans_correct'] = 0;
                                if (f['list_question'] && f['list_question'].length) {
                                    f['list_question'].forEach(q => {
                                        const index_ans = _student_answer.findIndex(m => m.shift_student_id === f.id && m.course_question_id === q.id);
                                        if (index_ans !== -1) {
                                            q['student_answer'] = _student_answer[index_ans].student_answer;
                                            q['result'] = _student_answer[index_ans].result;
                                            q['status'] = _student_answer[index_ans].status;
                                            if (q['student_answer'] || q['student_answer'] === 0)
                                                f['count_student_ans'] = f['count_student_ans'] + 1;
                                            if (q['result'] === 1) {
                                                f['count_student_ans_correct'] = f['count_student_ans_correct'] + 1;
                                            }
                                        }

                                        if (q['children'] && q['children'].length) {
                                            q['children'].forEach(c => {
                                                const index_ans_c = _student_answer.findIndex(m => m.shift_student_id === f.id && m.course_question_id === c.id);
                                                if (index_ans_c !== -1) {
                                                    c['student_answer'] = _student_answer[index_ans_c].student_answer;
                                                    c['result'] = _student_answer[index_ans_c].result;
                                                    c['status'] = _student_answer[index_ans_c].status;
                                                    if (c['student_answer'] || c['student_answer'] === 0)
                                                        f['count_student_ans'] = f['count_student_ans'] + 1;
                                                    if (c['result'] === 1) {
                                                        f['count_student_ans_correct'] = f['count_student_ans_correct'] + 1;
                                                    }
                                                }
                                            })
                                        }
                                    })
                                }

                                if (f['list_part'] && f['list_part'].length) {
                                    f['list_part'].forEach(part => {
                                        if (part['list_question'] && part['list_question'].length) {
                                            part['list_question'].forEach(q => {
                                                const index_ans = _student_answer.findIndex(m => m.shift_student_id === f.id && m.course_question_id === q.id);
                                                if (index_ans !== -1) {
                                                    q['student_answer'] = _student_answer[index_ans].student_answer;
                                                    q['result'] = _student_answer[index_ans].result;
                                                    q['status'] = _student_answer[index_ans].status;
                                                    if (q['student_answer'] || q['student_answer'] === 0)
                                                        f['count_student_ans'] = f['count_student_ans'] + 1;
                                                    if (q['result'] === 1) {
                                                        f['count_student_ans_correct'] = f['count_student_ans_correct'] + 1;
                                                    }
                                                }

                                                if (q['children'] && q['children'].length) {
                                                    q['children'].forEach(c => {
                                                        const index_ans_c = _student_answer.findIndex(m => m.shift_student_id === f.id && m.course_question_id === c.id);
                                                        if (index_ans_c !== -1) {
                                                            c['student_answer'] = _student_answer[index_ans_c].student_answer;
                                                            c['result'] = _student_answer[index_ans_c].result;
                                                            c['status'] = _student_answer[index_ans_c].status;
                                                            if (c['student_answer'] || c['student_answer'] === 0)
                                                                f['count_student_ans'] = f['count_student_ans'] + 1;
                                                            if (c['result'] === 1) {
                                                                f['count_student_ans_correct'] = f['count_student_ans_correct'] + 1;
                                                            }
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })

                            //** tạo file pdf và nén */;
                            const zip = new JSZip();
                            const text = this.selectedRoom && !this.downloadShift ? this.selectedRoom.room.concat(" - ", this.selectedShift.name).replace(/\/|\\|\./g, "_") : this.selectedShift.name.replace(/\/|\\|\./g, "_");
                            const shiftFolder = zip.folder(text);
                            let count_sync = 0;
                            this.progressValue = 0;
                            this.waitingTitle = "Đang tải ảnh, vui lòng không tắt trình duyệt";
                            this.activeIndexStep = 2;
                            const image_ids = [];
                            const request: Observable<any>[][] = [];
                            let i_req = 0;
                            request[i_req] = [];
                            shift_student.forEach(f => {
                                f['_test'] = '<div class="container">';
                                let header_test = '<div class="header-test">';
                                const index_course = this.list_course.findIndex(m => m.id === this.selectedShift.course_id);
                                header_test = header_test.concat("<div class='font-16 text-center'>ĐẠI HỌC THÁI NGUYÊN</div>");
                                header_test = header_test.concat("<div class='font-16 bold text-center'>TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN</div>");
                                header_test = header_test.concat("<div class='font-16 bold text-center margin-bottom-30px'>VÀ TRUYỀN THÔNG</div>");
                                header_test = header_test.concat("<div class='font-18 bold text-center title-test-header'>BÀI THI KẾT THÚC HỌC PHẦN</div>");
                                header_test = header_test.concat("<div class='margin-bottom-10px'>- Tên học phần: ", index_course !== -1 ? this.list_course[index_course].title : '', "</div>");
                                header_test = header_test.concat("<div class='margin-bottom-10px'>- Tên ca thi: ", this.selectedShift.name, "</div>");
                                header_test = header_test.concat("<div class='margin-bottom-10px'>- Thời gian thi: ", this.selectedShift.time_of_test.toString(), " phút</div>");
                                header_test = header_test.concat("<div class='margin-bottom-10px flex'><span class='label-header-left'>- Họ tên thí sinh: ", f['student'] ? f.student.full_name : '', "</span><span class='label-header-mid'>- Mã sinh viên: ", f['student'] ? f.student.student_code.toUpperCase() : '', "</span><span class='label-header-right'>- SBD: ", f.sbd, "</span></div>")
                                header_test = header_test.concat("<div class='margin-bottom-10px flex'><span class='label-header-left'>- Tổng số câu: ", f['total'].toString(), "</span><span class='label-header-right'>- Số câu trả lời đúng: ", f['count_student_ans_correct'], "</span></div>");
                                header_test = header_test.concat("<div class='margin-bottom-10px flex'><span class='label-header-left'>- Số câu trả lời: ", f['count_student_ans'].toString(), "</span><span class='label-header-right'>- Số câu không trả lời: ", (Number(f['total']) - f['count_student_ans']).toString(), "</span></div>");
                                header_test = header_test.concat("<div class='margin-bottom-10px flex'><span class='label-header-left'>- Tổng điểm: ", f['point'].toString(), "</span><span class='label-header-right'>- Trạng thái kỷ luận: ", f.violation_of_exam ? f.violation_of_exam.title : 'Không', "</span></div>")
                                f['_test'] = f['_test'].concat(header_test, '</div>');

                                if (f['list_question'] && f['list_question'].length) {
                                    f['list_question'].forEach((q, i) => {
                                        this.setHtmlQuestion(f, q, i);
                                    })
                                }

                                if (f['list_part'] && f['list_part'].length) {
                                    f['question_count'] = 0;
                                    f['list_part'].forEach((part, i) => {
                                        const part_question_div = '<div class="part-question"><div class="part-direction">'.concat("<span class='part-name'>", part['label'], "</span></div>");
                                        f['_test'] = f['_test'].concat(part_question_div);
                                        part['list_question'].forEach((q, i) => {
                                            this.setHtmlQuestion(f, q, i, part);
                                        })
                                        f['_test'] = f['_test'].concat("</div>");
                                    })
                                }
                                f['_test'] = f['_test'].concat('</html>');
                                f['_test'] = f['_test'].replace(/src="([0-9]+)"/gis, _src => {
                                    const ids = _src.replace(/\D/g, "");
                                    if (request[i_req].length < 6) {
                                        request[i_req].push(this.fileService.awsGetFileAsBlob(ids).pipe(mergeMap(a => {
                                            image_ids.push({ id: ids, url: a })
                                            return of(a);
                                        })))
                                    } else {
                                        i_req = i_req + 1;
                                        request[i_req] = []
                                        request[i_req].push(this.fileService.awsGetFileAsBlob(ids).pipe(mergeMap(a => {
                                            image_ids.push({ id: ids, url: a })
                                            return of(a);
                                        })))
                                    }
                                    return _src;
                                });
                            })

                            if (request.length && request[0].length) {
                                this.loopGetDataImage(request, 0).subscribe({
                                    next: () => {
                                        this.progressValue = 0;
                                        this.activeIndexStep = 3;
                                        this.waitingTitle = "Đang nén dữ liệu, vui lòng không tắt trình duyệt";
                                        let countimgs = 0;
                                        const currentThis = this;
                                        image_ids.forEach(f_img => {
                                            if (image_ids[countimgs]['url']) {
                                                const reader = new FileReader();
                                                reader.readAsDataURL(image_ids[countimgs]['url']);
                                                reader.onloadend = function () {
                                                    const base64data = reader.result;
                                                    f_img['base64'] = base64data;
                                                    countimgs = countimgs + 1;
                                                    if (countimgs === image_ids.length) {
                                                        shift_student.forEach(f => {
                                                            f['_test'] = f['_test'].replace(/src="([0-9]+)"/gis, _src => {
                                                                const ids = _src.replace(/\D/g, "");
                                                                const index_img = image_ids.findIndex(m => m.id.toString() === ids.toString());
                                                                if (index_img !== -1) {
                                                                    return 'src="' + image_ids[index_img]['base64'] + '"';
                                                                }
                                                                return _src;
                                                            })
                                                        })

                                                        if (shift_student.length) {
                                                            currentThis.convertToPDF(shift_student, stringStyleCss, 0, zip, shiftFolder, text)
                                                        }
                                                    }
                                                }
                                            } else {
                                                countimgs = countimgs + 1;
                                                if (countimgs === image_ids.length) {
                                                    shift_student.forEach(f => {
                                                        f['_test'] = f['_test'].replace(/src="([0-9]+)"/gis, async _src => {
                                                            const ids = _src.replace(/\D/g, "");
                                                            const index_img = image_ids.findIndex(m => m.id.toString() === ids.toString());
                                                            if (index_img !== -1) {
                                                                return 'src="' + image_ids[index_img]['base64'] + '"';
                                                            }
                                                            return _src;
                                                        })
                                                    })
                                                    if (shift_student.length) {
                                                        currentThis.convertToPDF(shift_student, stringStyleCss, 0, zip, shiftFolder, text)
                                                    }
                                                }
                                            }
                                        })
                                    },
                                    error: () => {

                                    }
                                })
                            } else {
                                this.progressValue = 0;
                                this.activeIndexStep = 3;
                                this.waitingTitle = "Đang nén dữ liệu, vui lòng không tắt trình duyệt";
                                if (shift_student.length) {
                                    this.convertToPDF(shift_student, stringStyleCss, 0, zip, shiftFolder, text)
                                }
                            }
                        },
                        error: () => {

                        }
                    })
                },
                error: () => {

                }
            })
        }
    }

    setHtmlQuestion(shift_student: ThiShiftStudents, course_question: CourseQuestions, key_: number, part_question: any = null) {
        if (this.selectedShift['av'] !== 1) {
            const question_direction = '<div class="question"><div class="flex no-margin-child-p margin-left-p-10px question-direction"><span class="number-question">Câu '.concat((key_ + 1).toString(), ':</span><div class="direction flex-1">', course_question['question_direction'], "</div></div>");
            shift_student['_test'] = shift_student['_test'].concat(question_direction);
            switch (course_question.question_type) {
                case 'group-input':
                    if (course_question['children'] && course_question['children'].length) {
                        course_question['children'].forEach((c, keyc) => {
                            const question_child = "<div class='child-question'><div class='flex no-margin-child-p margin-left-p-10px question-direction'><span class='margin-right-10px'>" + this.getKey(keyc).toLowerCase() + ')</span>'.concat('<div class="direction flex-1">', c['question_direction'], "</div></div>");
                            shift_student['_test'] = shift_student['_test'].concat(question_child);
                            const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                            const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", this.helperService.encodeHTML(c['student_answer']), "</div></p></div>");
                            shift_student['_test'] = shift_student['_test'].concat(answ);
                            if (c.answer_correct) {
                                const arrayAnswerCorrect = c.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                                let answer_correct = arrayAnswerCorrect.join(" | ");
                                const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", this.helperService.encodeHTML(answer_correct), "</div></p></div>");
                                shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                            }
                            shift_student['_test'] = shift_student['_test'].concat("</div>");
                        })
                    }
                    break;
                case 'group-radio':
                    if (course_question['children'] && course_question['children'].length) {
                        course_question['children'].forEach((c, keyc) => {
                            const question_child = "<div class='child-question'><div class='flex no-margin-child-p margin-left-p-10px question-direction'><span class='margin-right-10px'>" + this.getKey(keyc).toLowerCase() + ')</span>'.concat('<div class="direction">', c['question_direction'], "</div></div>");
                            shift_student['_test'] = shift_student['_test'].concat(question_child);
                            const borderCorrect = Number(c['result']) === 1 ? 'border-correct' : '';
                            const student_answer_arr = c['student_answer'] ? c['student_answer'].split("|").filter(m => m || parseFloat(m) === 0) : [];
                            if (c['answer_option'] && c['answer_option'].length) {
                                const answer_option_sort = this.helperService.sort(c['answer_option'], 'id')
                                answer_option_sort.forEach((a, keyans) => {
                                    let borderAnswer = "";
                                    const index = student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(a.id));
                                    if (index !== -1) {
                                        borderAnswer = "border-answer";
                                    }
                                    const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='number-question " + borderAnswer + " " + borderCorrect + "'>" + this.getKey(keyans).concat('.</span><div class="direction">'.concat(a['value']), "</div></div>");
                                    shift_student['_test'] = shift_student['_test'].concat(answ);
                                })

                                if (c.answer_correct) {
                                    const arrayAnswerCorrect = c.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                                    const answer_correct = arrayAnswerCorrect.map(m => {
                                        const index_ans = answer_option_sort.findIndex(i => parseFloat(i.id) === parseFloat(m));
                                        if (index_ans !== -1)
                                            return this.getKey(index_ans);
                                        return '';
                                    }).filter(m => m !== '').join(" | ");
                                    const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<p><strong>", answer_correct, "</strong></p></div>");
                                    shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                                }
                            }

                            shift_student['_test'] = shift_student['_test'].concat("</div>");
                        })
                    }
                    break;
                case 'checkbox':
                    if (course_question['answer_option'] && course_question['answer_option'].length) {
                        const borderCorrect = Number(course_question['result']) === 1 ? 'border-correct' : '';
                        const student_answer_arr = course_question['student_answer'] ? course_question['student_answer'].replace(/\D/g, '|').split("|").filter(m => m || parseFloat(m) === 0) : [];
                        const answer_option_sort = this.helperService.sort(course_question['answer_option'], 'id')
                        answer_option_sort.forEach((a, keyans) => {
                            let borderAnswer = "";
                            const index = student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(a.id));
                            if (index !== -1) {
                                borderAnswer = "border-answer";
                            }
                            const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='number-question " + borderAnswer + " " + borderCorrect + "'>" + this.getKey(keyans).concat('.</span><div class="direction">'.concat(a['value']), "</div></div>");
                            shift_student['_test'] = shift_student['_test'].concat(answ);
                        })

                        if (course_question.answer_correct) {
                            const arrayAnswerCorrect = course_question.answer_correct.replace(/\D/g, '|').split("|").filter(m => m || parseFloat(m) === 0);
                            const answer_correct = arrayAnswerCorrect.map(m => {
                                const index_ans = answer_option_sort.findIndex(i => parseFloat(i.id) === parseFloat(m));
                                if (index_ans !== -1)
                                    return this.getKey(index_ans);
                                return '';
                            }).filter(m => m !== '').join(" ; ");
                            const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p><strong>", answer_correct, "</strong></p></div></div>");
                            shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                        }
                    }

                    break;
                case 'drag_drop':
                    if (course_question.answer_option && course_question.answer_option.length) {
                        let drag_drop_ansoption = '<div class="drag-drop-list-answer">';
                        course_question.answer_option.forEach(ao => {
                            if (!course_question.config || !course_question.config.contentHtml) {
                                ao['value'] = this.helperService.encodeHTML(ao['value']);
                            }

                            drag_drop_ansoption = drag_drop_ansoption.concat("<span class='item-drag-drop-answer'>", ao['value'], "</span>");
                        })
                        drag_drop_ansoption = drag_drop_ansoption.concat("</div>");

                        shift_student['_test'] = shift_student['_test'].concat(drag_drop_ansoption);

                        if (course_question['children'] && course_question['children'].length) {
                            course_question['children'].forEach((c, keyc) => {
                                const question_child = "<div class='child-question'><div class='flex no-margin-child-p margin-left-p-10px question-direction'><span class='margin-right-10px'>" + this.getKey(keyc).toLowerCase() + ')</span>'.concat('<div class="direction flex-1">', c['question_direction'], "</div></div>");
                                shift_student['_test'] = shift_student['_test'].concat(question_child);
                                if (c.student_answer) {
                                    const arr_student_ans = c.student_answer.replace(/\D/g, '|').split("|").filter(m => m || Number(m) === 0);
                                    const student_ans = course_question.answer_option.filter(m => arr_student_ans.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                    const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                                    const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", student_ans.join(" ; "), "</p></div></div>");
                                    shift_student['_test'] = shift_student['_test'].concat(answ);
                                }

                                if (c.answer_correct) {
                                    const arr_ans_correct = c.answer_correct.replace(/\D/g, '|').split("|").filter(m => m || Number(m) === 0);
                                    const ans_correct = course_question.answer_option.filter(m => arr_ans_correct.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                    const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", ans_correct.join(" ; "), "</p></div></div>");
                                    shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                                }
                                shift_student['_test'] = shift_student['_test'].concat("</div>");
                            })
                        }
                    }
                    break;
                case 'radio':
                    if (course_question['answer_option'] && course_question['answer_option'].length) {
                        const borderCorrect = Number(course_question['result']) === 1 ? 'border-correct' : '';
                        const student_answer_arr = course_question['student_answer'] ? course_question['student_answer'].split("|").filter(m => m || parseFloat(m) === 0) : [];
                        const answer_option_sort = this.helperService.sort(course_question['answer_option'], 'id')
                        answer_option_sort.forEach((a, keyans) => {
                            let borderAnswer = "";
                            const index = student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(a.id));
                            if (index !== -1) {
                                borderAnswer = "border-answer";
                            }
                            const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='number-question " + borderAnswer + " " + borderCorrect + "'>" + this.getKey(keyans).concat('.</span><div class="direction">'.concat(a['value']), "</div></div>");
                            shift_student['_test'] = shift_student['_test'].concat(answ);
                        })

                        if (course_question.answer_correct) {
                            const arrayAnswerCorrect = course_question.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                            const answer_correct = arrayAnswerCorrect.map(m => {
                                const index_ans = answer_option_sort.findIndex(i => parseFloat(i.id) === parseFloat(m));
                                if (index_ans !== -1)
                                    return this.getKey(index_ans);
                                return '';
                            }).filter(m => m !== '').join(" | ");
                            const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p><strong>", answer_correct, "</strong></p></div></div>");
                            shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                        }
                    }

                    break;
                case 'grouping':
                    if (course_question.answer_option && course_question.answer_option.length) {
                        let drag_drop_ansoption = '<div class="drag-drop-list-answer">';
                        course_question.answer_option.forEach(ao => {
                            drag_drop_ansoption = drag_drop_ansoption.concat("<span class='item-drag-drop-answer'>", ao['value'], "</span>");
                        })
                        drag_drop_ansoption = drag_drop_ansoption.concat("</div>");

                        shift_student['_test'] = shift_student['_test'].concat(drag_drop_ansoption);

                        if (course_question['children'] && course_question['children'].length) {
                            course_question['children'].forEach((c, keyc) => {
                                const question_child = "<div class='child-question'><div class='flex no-margin-child-p margin-left-p-10px question-direction'><span class='margin-right-10px'>" + this.getKey(keyc).toLowerCase() + ')</span>'.concat('<div class="direction flex-1">', c['question_direction'], "</div></div>");
                                shift_student['_test'] = shift_student['_test'].concat(question_child);
                                if (c.student_answer) {
                                    const arr_student_ans = c.student_answer.replace(/\D/g, "|").split("|").filter(m => m || Number(m) === 0);
                                    const student_ans = course_question.answer_option.filter(m => arr_student_ans.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                    const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                                    const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", student_ans.join(" | "), "</p></div></div>");
                                    shift_student['_test'] = shift_student['_test'].concat(answ);
                                }

                                if (c.answer_correct) {
                                    const arr_ans_correct = c.answer_correct.replace(/\D/g, "|").split("|").filter(m => m || Number(m) === 0);
                                    const ans_correct = course_question.answer_option.filter(m => arr_ans_correct.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                    const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", ans_correct.join(" | "), "</p></div></div>");
                                    shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                                }
                                shift_student['_test'] = shift_student['_test'].concat("</div>");
                            })
                        }
                    }
                    break;
                case 'inputbox':
                    if (course_question.answer_correct) {
                        const inputCorrect = Number(course_question['result']) === 0 ? 'input-wrong' : 'input-correct';
                        const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", this.helperService.encodeHTML(course_question['student_answer']), "</p></div></div>");
                        shift_student['_test'] = shift_student['_test'].concat(answ);
                        const arrayAnswerCorrect = course_question.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                        let answer_correct = arrayAnswerCorrect.join(" | ");
                        const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", this.helperService.encodeHTML(answer_correct), "</p></div></div>");
                        shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                    }
                    break;
                case 'reorder_words':
                    if (course_question.answer_correct) {
                        const inputCorrect = Number(course_question['result']) === 0 ? 'input-wrong' : 'input-correct';
                        const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", course_question['student_answer'], "</p></div></div>");
                        shift_student['_test'] = shift_student['_test'].concat(answ);
                        const arrayAnswerCorrect = course_question.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                        let answer_correct = arrayAnswerCorrect.join(" | ");
                        const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", answer_correct, "</p></div></div>");
                        shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                    }
                    break;
                default:
                    break;
            }
            shift_student['_test'] = shift_student['_test'].concat("</div>");
        } else {
            const partDirection = '<div class="part-childrent"><div class="part-childrent-direction flex no-margin-child-p"><span class="part-number">'.concat(part_question.label, ".", (key_ + 1).toString(), ".</span><div class='direction-part'>", course_question.question_direction, "</div></div>");
            shift_student['_test'] = shift_student['_test'].concat(partDirection);
            if (course_question['children'] && course_question['children'].length) {
                course_question['children'].forEach(c => {
                    shift_student['question_count'] = shift_student['question_count'] + 1;
                    const question_direction = '<div class="question question-av-part"><div class="flex no-margin-child-p margin-left-p-10px question-direction"><span class="number-question">Question '.concat((shift_student['question_count']).toString(), ':</span><div class="direction flex-1">', c['question_direction'], "</div></div>");
                    shift_student['_test'] = shift_student['_test'].concat(question_direction);
                    switch (course_question.question_type) {
                        case 'grouping':
                            if (course_question.answer_option && course_question.answer_option.length) {
                                let drag_drop_ansoption = '<div class="drag-drop-list-answer">';
                                course_question.answer_option.forEach(ao => {
                                    drag_drop_ansoption = drag_drop_ansoption.concat("<span class='item-drag-drop-answer'>", ao['value'], "</span>");
                                })
                                drag_drop_ansoption = drag_drop_ansoption.concat("</div>");

                                shift_student['_test'] = shift_student['_test'].concat(drag_drop_ansoption);
                            }
                            break;
                        case 'drag_drop':
                            if (course_question.answer_option && course_question.answer_option.length) {
                                let drag_drop_ansoption = '<div class="drag-drop-list-answer">';
                                course_question.answer_option.forEach(ao => {
                                    drag_drop_ansoption = drag_drop_ansoption.concat("<span class='item-drag-drop-answer'>", ao['value'], "</span>");
                                })
                                drag_drop_ansoption = drag_drop_ansoption.concat("</div>");

                                shift_student['_test'] = shift_student['_test'].concat(drag_drop_ansoption);
                            }
                            break;
                        default:
                            break;
                    }
                    switch (course_question.question_type) {
                        case 'checkbox':
                            if (c['answer_option'] && c['answer_option'].length) {
                                const borderCorrect = Number(c['result']) === 1 ? 'border-correct' : '';
                                const student_answer_arr = c['student_answer'] ? c['student_answer'].replace(/\D/g, '|').split("|").filter(m => m || parseFloat(m) === 0) : [];
                                const answer_option_sort = this.helperService.sort(c['answer_option'], 'id')
                                answer_option_sort.forEach((a, keyans) => {
                                    let borderAnswer = "";
                                    const index = student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(a.id));
                                    if (index !== -1) {
                                        borderAnswer = "border-answer";
                                    }
                                    const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='number-question " + borderAnswer + " " + borderCorrect + "'>" + this.getKey(keyans).concat('.</span><div class="direction">'.concat(a['value']), "</div></div>");
                                    shift_student['_test'] = shift_student['_test'].concat(answ);
                                })

                                if (c.answer_correct) {
                                    const arrayAnswerCorrect = c.answer_correct.replace(/\D/g, '|').split("|").filter(m => m || parseFloat(m) === 0);
                                    const answer_correct = arrayAnswerCorrect.map(m => {
                                        const index_ans = answer_option_sort.findIndex(i => parseFloat(i.id) === parseFloat(m));
                                        if (index_ans !== -1)
                                            return this.getKey(index_ans);
                                        return '';
                                    }).filter(m => m !== '').join(" ; ");
                                    const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p><strong>", answer_correct, "</strong></p></div></div>");
                                    shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                                }
                            }

                            break;
                        case 'radio':
                            const borderCorrect = Number(c['result']) === 1 ? 'border-correct' : '';
                            const student_answer_arr = c['student_answer'] ? c['student_answer'].split("|").filter(m => m || parseFloat(m) === 0) : [];
                            if (c['answer_option'] && c['answer_option'].length) {
                                const answer_option_sort = this.helperService.sort(c['answer_option'], 'id')
                                answer_option_sort.forEach((a, keyans) => {
                                    let borderAnswer = "";
                                    const index = student_answer_arr.findIndex(m => parseFloat(m) === parseFloat(a.id));
                                    if (index !== -1) {
                                        borderAnswer = "border-answer";
                                    }
                                    const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='number-question " + borderAnswer + " " + borderCorrect + "'>" + this.getKey(keyans).concat('.</span><div class="direction">'.concat(a['value']), "</div></div>");
                                    shift_student['_test'] = shift_student['_test'].concat(answ);
                                })

                                if (c.answer_correct) {
                                    const arrayAnswerCorrect = c.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                                    const answer_correct = arrayAnswerCorrect.map(m => {
                                        const index_ans = answer_option_sort.findIndex(i => parseFloat(i.id) === parseFloat(m));
                                        if (index_ans !== -1)
                                            return this.getKey(index_ans);
                                        return '';
                                    }).filter(m => m !== '').join(" | ");
                                    const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p><strong>", answer_correct, "</strong></p></div></div>");
                                    shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                                }
                            }

                            break;
                        case 'inputbox':
                            const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                            const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", c['student_answer'], "</p></div></div>");
                            shift_student['_test'] = shift_student['_test'].concat(answ);
                            if (c.answer_correct) {
                                const arrayAnswerCorrect = c.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                                let answer_correct = arrayAnswerCorrect.join(" | ");
                                const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", answer_correct, "</p></div></div>");
                                shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                            }
                            break;
                        case 'reorder_words':
                            if (c.answer_correct) {
                                const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                                const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", c['student_answer'], "</p></div></div>");
                                shift_student['_test'] = shift_student['_test'].concat(answ);
                                const arrayAnswerCorrect = c.answer_correct.split("|").filter(m => m || parseFloat(m) === 0);
                                let answer_correct = arrayAnswerCorrect.join(" | ");
                                const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", answer_correct, "</p></div></div>");
                                shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                            }
                            break;
                        case 'drag_drop':
                            if (c.student_answer) {
                                const arr_student_ans = c.student_answer.replace(/\D/g, '|').split("|").filter(m => m || Number(m) === 0);
                                const student_ans = c.answer_option.filter(m => arr_student_ans.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                                const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", student_ans.join(" ; "), "</p></div></div>");
                                shift_student['_test'] = shift_student['_test'].concat(answ);
                            }

                            if (c.answer_correct) {
                                const arr_ans_correct = c.answer_correct.replace(/\D/g, '|').split("|").filter(m => m || Number(m) === 0);
                                const ans_correct = c.answer_option.filter(m => arr_ans_correct.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", ans_correct.join(" ; "), "</p></div></div>");
                                shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                            }
                            break;
                        case 'grouping':
                            if (c.student_answer) {
                                const arr_student_ans = c.student_answer.replace(/\D/g, "|").split("|").filter(m => m || Number(m) === 0);
                                const student_ans = c.answer_option.filter(m => arr_student_ans.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                const inputCorrect = Number(c['result']) === 0 ? 'input-wrong' : 'input-correct';
                                const answ = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án của thí sinh:</span> ".concat("<div class='flex-1'><p class='", inputCorrect, "'>", student_ans.join(" | "), "</p></div></div>");
                                shift_student['_test'] = shift_student['_test'].concat(answ);
                            }

                            if (c.answer_correct) {
                                const arr_ans_correct = c.answer_correct.replace(/\D/g, "|").split("|").filter(m => m || Number(m) === 0);
                                const ans_correct = c.answer_option.filter(m => arr_ans_correct.findIndex(i => Number(i) === Number(m.id)) !== -1).map(m => m.value);
                                const answer_correct_html = "<div class='flex no-margin-child-p margin-left-p-10px answer'><span class='bold width-max-content'>Đáp án đúng:</span> ".concat("<div class='flex-1'><p>", ans_correct.join(" | "), "</p></div></div>");
                                shift_student['_test'] = shift_student['_test'].concat(answer_correct_html);
                            }
                            break;
                        default:
                            break;
                    }
                })
                shift_student['_test'] = shift_student['_test'].concat("</div>");
            }
            shift_student['_test'] = shift_student['_test'].concat("</div>");
        }
    }

    async convertToPDF(shift_student: ThiShiftStudents[], stringStyleCss: string, key: number, zip, shiftFolder, text) {
        console.log(shift_student[key]);
        const filename = shift_student[key].student ? shift_student[key].sbd + "".concat(" - ", shift_student[key].student.full_name).replace(/\/|\\|\./g, "_") : shift_student[key].sbd.replace(/\/|\\|\./g, "_")
        const header = "<html>" +
            "<head><meta charset='utf-8'>" +
            '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">' +
            '<link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&amp;display=swap" rel="stylesheet"><style>' +
            stringStyleCss +
            "</style></head><body>";
        const footer = "</body></html>";
        let blob = await new Blob([header.concat(shift_student[key]['_test'].replace(/\&nbsp\;/gis, ''), footer)], { type: "html;charset=utf-8" });
        shiftFolder.file(filename.concat(".html"), blob);
        this.progressValue = key + 1 / shift_student.length * 100;
        if (!shift_student[key + 1]) {
            const currentThis = this;
            zip.generateAsync({ type: "blob" }).then(function (content) {
                fs.saveAs(content, text);
                currentThis.displayModal = false;
            });
        } else {
            this.convertToPDF(shift_student, stringStyleCss, key + 1, zip, shiftFolder, text)
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve, _) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    getKey(index) {
        return String.fromCharCode(65 + index);
    }
}
