import { ThiLogsService } from './../../../../shared/services/thi-log.service';
import { UserService } from './../../../../../core/services/user.service';
import { parse } from 'latex.js';
import { ThiShiftViolation } from './../../../../shared/models/thi-shift-violation';
import { ThiShiftViolationsService } from './../../../../shared/services/thi-shift-violation.service';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { FileService } from '@core/services/file.service';
import { ThiShiftControls } from './../../../../shared/models/thi-shift-controls';
import { TableModule } from 'primeng/table';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ThiShiftsService } from '@modules/shared/services/thi-shifts.service';
import { ThiShiftRoomssService } from '@modules/shared/services/thi-shift-rooms.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThiShifts } from '@modules/shared/models/thi-shifts';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ThiShiftStudentsService } from '@modules/shared/services/thi-shift-students.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { AuthService } from '@core/services/auth.service';
import { OvicQueryCondition } from '@core/models/dto';
import { forkJoin, mergeMap, of, pipe, concat } from 'rxjs';
import { ThiShiftRooms } from '@modules/shared/models/thi-shift-room';
import { MatListModule } from '@angular/material/list';
import { SharedModule } from "../../../../shared/shared.module";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ThiShiftStudents, VIOLATION } from '@modules/shared/models/thi-shift-students';
import { ActivatedRoute, Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { ButtonModule } from 'primeng/button';
import { ThiShiftControlssService } from '@modules/shared/services/thi-shift-controls.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TooltipModule } from 'primeng/tooltip';
import { BUTTON_CLOSED, BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { DialogModule } from 'primeng/dialog';
import { APP_CONFIGS, key_server, PASS_ROOMS } from '@env';
import { MatCardModule } from '@angular/material/card';
import { ExportExcelSheetsService } from '@modules/shared/services/export-excel-sheets.service';
import { KEY_ANSWER_new, PointRead, ROLES } from '@modules/shared/utils/syscat';
import * as XLSX from 'xlsx';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ExportPointThiKthpService } from '@modules/shared/services/export-point-thi-kthp.service';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ThiLogs, TYPELOG } from '@modules/shared/models/thi-logs';

export type COMMAND = 'PAUSED' | 'CONTINUE' | 'ADD_TIME' | 'CANCEL' | 'SUBMIT' | 'VIOLATION' | 'DELETE_VIOLATION';

@Component({
    selector: 'app-phongthi',
    standalone: true,
    imports: [CommonModule, MatListModule, SharedModule, ReactiveFormsModule, FormsModule, TableModule, MatMenuModule, ButtonModule, NgbTooltipModule, TooltipModule, DialogModule, MatCardModule, DropdownModule, CheckboxModule],
    templateUrl: './phongthi.component.html',
    styleUrls: ['./phongthi.component.css']
})
export class PhongthiComponent implements OnInit, OnDestroy, AfterViewInit {

    @ViewChild('topResize') topResize: ElementRef;

    @ViewChild('templateLogStudentShift', { static: true }) templateLogStudentShift: TemplateRef<any>;

    @ViewChild('templateTrackingStudent', { static: true }) templateTrackingStudent: TemplateRef<any>;

    @ViewChild('templateWarningStudent', { static: true }) templateWarningStudent: TemplateRef<any>;

    @ViewChild('templateDangerCloseRoom') templateDangerCloseRoom: ElementRef<any>;



    selectedShift: ThiShifts;

    canEdit: boolean = false;

    isManager: boolean = false;

    hoidongcoithi: boolean = false;

    list_room: ThiShiftRooms[];

    selectedRoom: ThiShiftRooms;

    selectedCourse: ElnKhoaHoc;

    searRoom: string;

    list_student: ThiShiftStudents[];

    searchStudent: string;

    selectedShiftStudent: ThiShiftStudents;

    type_show: 'list' | 'grid';

    _status_student_filter: number;

    interverTimeShiftStudent: any;

    status_object = {
        chualam: 0,
        danglam: 0,
        dadung: 0,
        danop: 0,
        dahuy: 0,
        unlock: 1
    }

    displayAddtime = false;

    addTimeValue: number;

    object_pass_of_room = {};

    passOfRoom: string;

    keyAnswer = KEY_ANSWER_new;

    smallWidth: boolean = false;

    closeLeft: boolean = false;

    displayViolation: boolean = false;

    displayCancel: boolean = false;

    dbConfig: any;

    violationData: VIOLATION = {
        key: null,
        note: null,
        user_id: null,
        title: null
    }

    command_object = {
        PAUSED: 'Đã dừng',
        CONTINUE: 'Tiếp tục thi',
        ADD_TIME: 'Thêm thời gian, cho làm tiếp',
        CANCEL: 'Huỷ bài',
        SUBMIT: 'Nộp bài',
        VIOLATION: 'Xử lý vi phạm',
        DELETE_VIOLATION: 'Hủy xử lý vi phạm'
    }

    noteDeleteViolation: string;

    messageControl: string;

    displayCloseRoom: boolean = false;

    displayDeleteViolaytion: boolean = false;

    acceptViolation: boolean = false;

    display_thubai: boolean = false;

    chuanopbai: number = 0;

    checkboxThubai: boolean = false;

    type_log = TYPELOG;

    key_server = key_server;
    constructor(
        private helperService: HelperService,
        private notificationService: NotificationService,
        private elngUserProfileService: ElngUserProfileService,
        private thiShiftStudentsService: ThiShiftStudentsService,
        private auth: AuthService,
        private thiShiftRoomssService: ThiShiftRoomssService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private thiShiftsService: ThiShiftsService,
        private elnKhoaHocService: ElnKhoaHocService,
        private thiShiftControlssService: ThiShiftControlssService,
        private fileService: FileService,
        private exportPointThiKthpService: ExportPointThiKthpService,
        private ovicDateTimeService: OvicDateTimeService,
        private cdr: ChangeDetectorRef,
        private configsService: ConfigsService,
        private thiShiftViolationsService: ThiShiftViolationsService,
        private userService: UserService,
        private thiLogsService: ThiLogsService
    ) {
        // localStorage.setItem( PASS_ROOMS, JSON.stringify(  ) )

        this.getPassOfRoom();
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.hoidongthi_chutich) || this.auth.userHasRole(ROLES.hoidongthi_thuky) || this.auth.userHasRole(ROLES.hoidongthi_qlct) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) ? true : false;

    }

    ngAfterViewInit(): void {
        const observer = new ResizeObserver(entries => {
            const width = entries[0].contentRect.width;
            this.onResize(width);
            this.cdr.detectChanges()
        });

        if (this.topResize)
            observer.observe(this.topResize.nativeElement);
    }

    onResize(width) {
        if (width < 900) {
            this.smallWidth = true;
        } else {
            this.smallWidth = false;
        }
    }

    ngOnDestroy(): void {
        this.closeInterval();
    }

    ngOnChanges(changes: SimpleChanges): void {
        // if ( changes[ 'thishift' ] ) {
        //     this.selectedShift = this.thishift;
        //     this.loadPhongthi();
        // }
    }

    getPassOfRoom() {
        if (localStorage.getItem(PASS_ROOMS)) {
            this.object_pass_of_room = JSON.parse(localStorage.getItem(PASS_ROOMS));
        } else {
            this.object_pass_of_room = {};
        }
    }

    async setPassOfRoom(room: ThiShiftRooms) {
        if (this.passOfRoom && this.passOfRoom.trim()) {
            if (this.passOfRoom.trim() === room.pass_of_room) {
                this.object_pass_of_room[room.id.toString() + '_' + room.room] = this.passOfRoom.trim();
                localStorage.setItem(PASS_ROOMS, JSON.stringify(this.object_pass_of_room));
                room['open'] = true;
                this.notificationService.isProcessing(true);
                const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'ENTER_ROOM', object: 'thi_shift_room', object_id: this.selectedRoom.id, note: this.type_log['ENTER_ROOM'], thi_shift_id: this.selectedShift.id });
                this.loadListShiftStudent();
            } else {
                this.notificationService.toastError("Mã truy cập phòng thì không chính xác");
            }
        } else {
            this.notificationService.toastError("Vui lòng nhập Mã truy cập");
        }
    }

    ngOnInit(): void {
        this.notificationService.setCloseLeftMenu(true);

        this.auth.setFeatureSecondary("Thi kết thúc học phần");
        // const config = this.auth.getSysConfigParams( "GET_VIOLATION_OF_EXAM" );
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

        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                const shift_id = params['code'];
                const condition_shift: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: shift_id.toString() }
                    ],

                    set: [
                        { label: 'limit', value: '-1' },
                    ],

                    page: null
                }

                this.notificationService.isProcessing(true);

                forkJoin([
                    this.thiShiftsService.getThiShiftsByPageNew(condition_shift).pipe(mergeMap((_res) => {
                        if (_res.recordsFiltered) {
                            return forkJoin([
                                this.elnKhoaHocService.getElnKhoaHocByItem(_res.data[0].course_id.toString(), 'id'),
                                this.userService.getUserByItem(_res.data[0].created_by.toString(), 'id')
                            ]).pipe(mergeMap(([_course, _user_created]) => {
                                if (_course[0]) {
                                    _res.data[0]['course_label'] = _course[0].title;

                                    if (_user_created[0]) {
                                        _res.data[0]['created_by_name'] = _user_created[0].display_name;
                                        _res.data[0]['created_by_phone'] = _user_created[0].phone;
                                    }
                                    this.selectedCourse = _course[0];
                                }
                                return of(_res);
                            }))
                        }
                        return of(_res);
                    }))
                ]).subscribe({
                    next: ([_shift]) => {
                        if (_shift.data[0]) {
                            if (!this.isManager && _shift.data[0].status <= 0) {
                                this.notificationService.isProcessing(false);
                                this.notificationService.toastWarning("Ca thi này chưa được kích hoạt");
                                this.router.navigate(['/admin/content-none']);
                            } else {
                                this.selectedShift = _shift.data[0]
                                this.loadPhongthi();
                            }

                        } else {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Ca thi này không tồn tại");
                            this.router.navigate(['/admin/content-none']);
                        }
                    },
                    error: (err) => {
                        console.log(err);
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                        this.router.navigate(['/admin/content-none']);
                    }
                })
            } else {
                this.notificationService.isProcessing(false);
                this.router.navigate(['/admin/content-none']);
            }
        });

    }

    loadPhongthi() {
        const condition_room: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString() },

            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'shift_id,room,pass_of_room,id,status,canbo_coithi_ids' },
            ],

            page: null
        }

        if (!this.isManager) {
            condition_room.set.push({ label: 'canbo_coithi_ids', value: this.auth.user.id.toString() });
            condition_room.condition.push({ conditionName: 'status', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' });
        }

        const condition_student: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'room,thi_question_bank_tn_id' },
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.thiShiftRoomssService.getThiShiftRoomssByPageNew(condition_room),
            this.thiShiftStudentsService.getThiShiftStudentsByPageNew(condition_student)
        ]).subscribe({
            next: ([_room, _student]) => {

                _room.data.forEach(f => {
                    const students = _student.data.filter(m => m.room === f.room);
                    f['count_students'] = students.length;
                    f['shift_Students'] = students.filter(m => m['thi_question_bank_tn_id']).length;
                    f['canEdit'] = false;
                    f['tt'] = 1;
                    if (f.canbo_coithi_ids) {
                        const index = f.canbo_coithi_ids.findIndex(m => m.toString() === this.auth.user.id.toString());
                        if (index !== -1) {
                            f['canEdit'] = true;
                            f['tt'] = 0;
                        }
                    }
                })


                this.list_room = this.helperService.sort(_room.data, 'stt');

                this.notificationService.isProcessing(false);

                if (this.list_room && this.list_room.length) {
                    if (this.selectedRoom) {
                        const index = this.list_room.findIndex(m => m.room === this.selectedRoom.room)
                        if (index !== -1) {
                            this.selectedRoom = this.list_room[index];
                        }
                    } else {
                        this.selectedRoom = this.list_room[0];
                    }

                    this.onSelectedRoom(this.selectedRoom);
                }
            },

            error: () => {
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                this.notificationService.isProcessing(false);
            }
        })
    }

    onSelectedRoom(room: ThiShiftRooms) {
        this.selectedRoom = room;
        this.passOfRoom = null;
        this.list_student = null;
        this.searchStudent = null;
        this._status_student_filter = null;
        this.closeInterval();
        if (this.object_pass_of_room[room.id.toString() + '_' + room.room] === room.pass_of_room) {
            room['open'] = true;
            this.loadListShiftStudent();
        }
    }

    startSetInterval() {
        this.interverTimeShiftStudent = setTimeout(() => this.loadForStatusOnly(), 15000);
    }

    closeInterval() {
        clearTimeout(this.interverTimeShiftStudent);
    }

    loadForStatusOnly() {
        this.closeInterval();
        const condition_shift_student: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString(), orWhere: 'and' },
                { conditionName: 'room', condition: OvicQueryCondition.equal, value: this.selectedRoom.room, orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'controls,user' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'sbd' },
                { label: 'select', value: 'id,status,completed,locked,point,time_remaining,thi_question_bank_tn_id,student_user_id,tracking,violation_of_exam,progress,total,warning,submited_by' },
            ],
            page: null
        }

        this.thiShiftStudentsService.getThiShiftStudentsByPageNew(condition_shift_student).subscribe({
            next: (_student_shift) => {
                this.list_student.forEach(f => {
                    const index = _student_shift.data.findIndex(m => m.id === f.id);
                    if (index !== -1) {
                        f.status = _student_shift.data[index].status;
                        f.completed = _student_shift.data[index].completed;
                        f.locked = _student_shift.data[index].locked;
                        f.point = _student_shift.data[index].point;
                        f.time_remaining = _student_shift.data[index].time_remaining;
                        f.controls = _student_shift.data[index].controls;
                        f.tracking = _student_shift.data[index].tracking;
                        f.violation_of_exam = _student_shift.data[index].violation_of_exam;
                        f.progress = _student_shift.data[index].progress;
                        f.warning = _student_shift.data[index].warning;
                        f.submited_by = _student_shift.data[index].submited_by;
                        f['user'] = _student_shift.data[index]['user'];
                    }

                    f['_student_status'] = f.status;

                    if (f.status === 1) {
                        if (f.completed === 1) {
                            f['_student_status'] = 2
                        }
                    }



                    const phut = f.time_remaining ? Math.floor(f.time_remaining / 60) : 0;

                    const giay = f.time_remaining ? (f.time_remaining % 60) : 0;

                    f['time_left_convert'] = phut.toString().concat('p ', giay.toString(), 's');

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

                this.getStatusObject();

                this.notificationService.isProcessing(false);

                this.startSetInterval();
            },

            error: () => {
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                this.notificationService.isProcessing(false);
            }
        })
    }


    loadListShiftStudent() {
        const condition_shift_student: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString(), orWhere: 'and' },
                { conditionName: 'room', condition: OvicQueryCondition.equal, value: this.selectedRoom.room, orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'student,controls,user' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'sbd' },
                { label: 'select', value: 'tracking,id,shift_id,student_id,sbd,ordering,room,status,completed,locked,point,time_remaining,thi_question_bank_tn_id,student_user_id,violation_of_exam,progress,total,warning,submited_by' },
            ],
            page: null
        }

        this.status_object = {
            chualam: 0,
            danglam: 0,
            dadung: 0,
            danop: 0,
            dahuy: 0,
            unlock: 1
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


                this.list_student = _student_shift.data;

                this.getStatusObject();

                this.notificationService.isProcessing(false);

                this.startSetInterval();
            },

            error: () => {
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                this.notificationService.isProcessing(false);
            }

        })
    }

    getStatusObject() {
        this.status_object = {
            chualam: this.list_student.filter(m => m._student_status === 0).length,
            danglam: this.list_student.filter(m => m._student_status === 1).length,
            dadung: this.list_student.filter(m => m._student_status === -2).length,
            danop: this.list_student.filter(m => m._student_status === 2).length,
            dahuy: this.list_student.filter(m => m._student_status === -1).length,
            unlock: this.list_student.filter(m => m['user'] && m['user']['is_locked'] === 0).length
        }
    }

    async pauseAndContinue(shift_student: ThiShiftStudents) {

        this.closeInterval();

        let key = null;

        switch (shift_student['_student_status']) {
            case -2:
                key = 'CONTINUE';
                break;
            case 1:
                key = 'PAUSED';
                break;
            default:
                break;
        }

        let massage = '';

        let noiti = '';

        const data_student = {
            status: 1
        }

        switch (key) {
            case 'PAUSED':
                massage = 'Cán bộ coi thi đã dừng bài thi';
                noiti = 'Đã dừng bài thi';
                data_student.status = -2;

                break;
            case 'CONTINUE':
                massage = 'Cán bộ coi thi cho sinh viên tiếp tục thi';
                noiti = 'Đã cho sinh viên tiếp tục thi';
                data_student.status = 1;
                data_student['completed'] = 0;
                break;
            default:
                break;
        }

        const data: ThiShiftControls = {
            shift_student_id: shift_student.id,
            type: key,
            message: massage,
            value: null,
            sender: 'GIANGVIEN',
            sender_by: this.auth.user.id,
            received_by: shift_student.student.user_id,
            status: 0
        }

        this.notificationService.isProcessing(true);
        const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: key, object: 'thi_shift_student', object_id: shift_student.id, note: this.type_log[key], thi_shift_id: this.selectedShift.id });
        forkJoin([
            this.thiShiftControlssService.addThiShiftControlss(data),
            this.thiShiftStudentsService.updateThiShiftStudents(shift_student.id, data_student)
        ]).subscribe({
            next: () => {
                this.notificationService.toastSuccess(noiti);
                this.notificationService.isProcessing(false);
                this.loadForStatusOnly();
            },
            error: () => {
                this.notificationService.toastError("Lỗi kết nối, cập nhật thất bại");
                this.loadForStatusOnly();
            }
        })
    }

    submitShiftStudent(shift_student: ThiShiftStudents) {

        this.selectedShiftStudent = shift_student;

        this.closeInterval();

        this.notificationService.confirm("Thầy/Cô có chắc chắn thu bài thi của sinh viên: <span style='font-weight-600'>" + shift_student.student.full_name + "</span> không?", "Thu bài thi", [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                const data: ThiShiftControls = {
                    shift_student_id: shift_student.id,
                    type: 'SUBMIT',
                    message: 'Cán bộ coi thi đã thu bài thi',
                    value: null,
                    sender: 'GIANGVIEN',
                    sender_by: this.auth.user.id,
                    received_by: shift_student.student.user_id,
                    status: 0
                }

                this.notificationService.isProcessing(true);
                const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'SUBMIT', object: 'thi_shift_student', object_id: shift_student.id, note: this.type_log['SUBMIT'], thi_shift_id: this.selectedShift.id });
                forkJoin([
                    this.thiShiftControlssService.addThiShiftControlss(data),
                    this.thiShiftStudentsService.updateThiShiftStudents(shift_student.id, { status: 1 }),
                    this.thiShiftStudentsService.nopbai(shift_student.id)
                ]).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess('Thu bài thành công');
                        this.notificationService.isProcessing(false);
                        this.loadForStatusOnly();
                    },
                    error: () => {
                        this.notificationService.toastError("Lỗi kết nối, cập nhật thất bại");
                        this.loadForStatusOnly();
                    }
                })
            } else {
                this.startSetInterval();
            }
        })
    }

    cancelShiftStudent() {
        if (this.messageControl && this.messageControl.trim()) {
            this.closeInterval();
            this.notificationService.confirm("<div class='pass_of_test_popup'><div>Thầy/Cô có chắc chắn hủy bài của sinh viên:</div> <div><span class='font-weight-600'>" + this.selectedShiftStudent.student.full_name + "</span> </div></div>", "Thông báo", [BUTTON_YES, BUTTON_NO]).then(async a => {
                if (a.name === 'yes') {
                    const data: ThiShiftControls = {
                        shift_student_id: this.selectedShiftStudent.id,
                        type: 'CANCEL',
                        message: this.messageControl,
                        value: null,
                        sender: 'GIANGVIEN',
                        sender_by: this.auth.user.id,
                        received_by: this.selectedShiftStudent.student.user_id,
                        status: 0
                    }

                    this.notificationService.isProcessing(true);
                    const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'CANCEL', object: 'thi_shift_student', object_id: this.selectedShiftStudent.id, note: this.type_log['CANCEL'], thi_shift_id: this.selectedShift.id });
                    forkJoin([
                        this.thiShiftControlssService.addThiShiftControlss(data),
                        this.thiShiftStudentsService.updateThiShiftStudents(this.selectedShiftStudent.id, { status: -1 })
                    ]).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess('Hủy bài thành công');
                            this.notificationService.isProcessing(false);
                            this.displayCancel = false;
                            this.loadForStatusOnly();
                        },
                        error: () => {
                            this.displayCancel = false;
                            this.notificationService.toastError("Lỗi kết nối, cập nhật thất bại");
                            this.loadForStatusOnly();
                        }
                    })
                } else {
                    this.startSetInterval();
                }
            })
        } else {
            this.notificationService.toastWarning('Vui lòng nhập ghi chú');
        }
    }

    addTimeForShiftStudent(shift_student: ThiShiftStudents) {
        this.selectedShiftStudent = shift_student;
        this.displayAddtime = true;
        this.addTimeValue = null;
        this.closeInterval();
    }

    closeAddTime() {
        this.displayAddtime = false;
        this.displayViolation = false;
        this.displayCancel = false;
        this.displayCloseRoom = false;
        this.displayDeleteViolaytion = false;
        this.display_thubai = false;
        this.loadForStatusOnly();
    }

    numberKeyDown(event) {
        if (event) {
            if (!/[0-9]/.test(event.key) && event.key !== 'Backspace') {
                event.preventDefault();
            }
        }
    }

    async saveAddtime() {
        if (this.addTimeValue) {

            const data: ThiShiftControls = {
                shift_student_id: this.selectedShiftStudent.id,
                type: 'ADD_TIME',
                message: 'Cán bộ coi thi thêm thời gian cho sinh viên làm tiếp',
                value: Number(this.addTimeValue) !== 0 ? this.addTimeValue * 60 : this.selectedShiftStudent.time_remaining,
                sender: 'GIANGVIEN',
                sender_by: this.auth.user.id,
                received_by: this.selectedShiftStudent.student.user_id,
                status: 0
            }

            this.notificationService.isProcessing(true);
            const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'ADD_TIME', object: 'thi_shift_student', object_id: this.selectedShiftStudent.id, note: this.type_log['ADD_TIME'], thi_shift_id: this.selectedShift.id, value: data.value.toString() });
            forkJoin([
                this.thiShiftControlssService.addThiShiftControlss(data),
                this.thiShiftStudentsService.updateThiShiftStudents(this.selectedShiftStudent.id, { status: 1, completed: 0, time_remaining: this.addTimeValue * 60 })
            ]).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Hủy bài thành công');
                    this.notificationService.isProcessing(false);
                    this.displayAddtime = false;
                    this.loadForStatusOnly();
                },
                error: () => {
                    this.notificationService.toastError("Lỗi kết nối, cập nhật thất bại");
                    this.displayAddtime = false;
                    this.loadForStatusOnly();
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng nhập thời gian thêm");
        }
    }

    async downloadDiemExcel() {
        if (this.list_student) {

            const data_ = this.list_student.filter(m => m._student_status !== 2 && m._student_status !== -1 && m._student_status !== 0);

            if (data_.length) {
                return this.notificationService.toastWarning("Còn ".concat(data_.length.toString(), ' sinh viên chưa nộp bài. Yêu cầu thao tác thu bài trước khi thực hiện TẢI BẢNG ĐIỂM'));
            }

            this.closeInterval();

            this.notificationService.isProcessing(true);
            const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'DOWNLOADEXCELPOINT', object: 'thi_shift_room', object_id: this.selectedRoom.id, note: this.type_log['DOWNLOADEXCELPOINT'], thi_shift_id: this.selectedShift.id });
            forkJoin([
                this.fileService.getFileLocalAsBlob('..\\assets\\files\\mau_file_import_LMS-LCMS\\mau_xuat_diem_thi_kthp.xls'),
                this.ovicDateTimeService.getCurrentDateTime()
            ]).subscribe(([res, _date_server]) => {
                const file = res;
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onloadend = (event) => {
                    const localUrl = reader.result;
                    const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'binary' });
                    const wsname: string = wb.SheetNames[0];
                    const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    const objectRoom = {};
                    let i = 0;
                    const bottomData = data.splice(9, 6);
                    const topData = data.splice(0, 9);
                    const headerData = [];
                    const tableHeader = [];

                    // console.log()
                    // return;
                    topData.forEach((f, key) => {
                        if (Array.isArray(f)) {
                            if (!f[0]) {
                                f[0] = '';
                            }
                        }
                        if (key < 7) {
                            headerData.push(f);
                        } else {
                            tableHeader.push(f);
                        }
                    })

                    const footerData = [];

                    bottomData.forEach((f, key) => {
                        if (Array.isArray(f)) {
                            if (!f[0]) {
                                f[0] = '';
                            }
                        }
                        footerData.push(f);
                    });
                    const today = new Date(_date_server.toString());
                    let _date = today.getDate() < 10 ? '0'.concat(today.getDate().toString()) : today.getDate().toString();
                    let _month = (today.getMonth() + 1) < 10 ? '0'.concat((today.getMonth() + 1).toString()) : (today.getMonth() + 1).toString();
                    let _yeah = today.getFullYear().toString();
                    objectRoom[this.selectedRoom.room] = {};
                    objectRoom[this.selectedRoom.room]['dataTable'] = [];
                    this.list_student.forEach((f, key) => {
                        objectRoom[this.selectedRoom.room]['dataTable'].push(this.dataByClass(f, key + 1))
                    })
                    const time_start = new Date(this.selectedShift.time_start);
                    const date_thi = time_start.toLocaleString('en-GB')
                    Object.keys(objectRoom).forEach((f, key) => {
                        objectRoom[f]["header"] = [];
                        headerData.forEach((he, heKey) => {
                            objectRoom[f]["header"].push([...he]);
                        })
                        objectRoom[f]["header"][0][0] = APP_CONFIGS.donviquanly.toUpperCase();
                        objectRoom[f]["header"][1][0] = APP_CONFIGS.donvitructhuoc.toUpperCase();
                        objectRoom[f]["header"][2][0] = "Kết quả thi".toUpperCase();
                        objectRoom[f]["header"][3][0] = "Đợt thi: Lịch thi ".concat(this.selectedShift.namhoc.concat('_', this.selectedShift.hocky.toString(), '_đợt ', this.selectedShift.dotthi.toString()))
                        objectRoom[f]["header"][4][0] = "Mã học phần: ".concat(this.selectedCourse.maso);
                        objectRoom[f]["header"][4][4] = "".concat(this.selectedCourse.params.sotinchi.toString());
                        objectRoom[f]["header"][4][7] = "".concat(this.selectedCourse.title);
                        objectRoom[f]["header"][5][0] = "Mã danh sách thi: ".concat(this.selectedCourse.maso, '_', date_thi.split(':')[0]);
                        objectRoom[f]["header"][6][0] = "Ngày thi: ".concat(date_thi.split(',')[0]);
                        objectRoom[f]["header"][6][6] = "Ca thi: ".concat(this.selectedShift.name);
                        objectRoom[f]["header"][6][9] = "Giảng đường: ".concat(this.selectedRoom.room);
                        objectRoom[f]["tableHeader"] = tableHeader;
                        objectRoom[f]["footer"] = [];
                        footerData.forEach((ft, ftKey) => {
                            objectRoom[f]["footer"].push([...ft]);
                        })


                        objectRoom[f]["footer"][1][1] = "Tổng số sinh viên: ".concat(this.list_student.length.toString());
                        objectRoom[f]["footer"][1][4] = "Tổng số tham gia: ".concat(this.list_student.filter(m => m.status !== 0).length.toString());
                        objectRoom[f]["footer"][1][8] = "Tổng số vắng: ".concat(this.list_student.filter(m => m.status === 0).length.toString())
                        objectRoom[f]["footer"][3][7] = 'Thái Nguyên, ngày '.concat(_date, ' tháng ', _month, ' năm ', _yeah);
                        // objectRoom[f]["footer"][1][0] = "- Tổng có ".concat(objectRoom[f]["dataTable"].length.toString(), " thí sinh.");
                        // objectRoom[f]["footer"][2][10] = 'Ngày '.concat(_date, ' tháng ', _month, ' năm ', _yeah);
                        objectRoom[f]["mergesData"] = [];
                        ws['!merges'].map(m => {
                            if (m.s.r < 8) {
                                objectRoom[f]["mergesData"].push(this.keyAnswer[m.s.c].concat((m.s.r + 1).toString(), ':', this.keyAnswer[m.e.c], (m.e.r + 1).toString()));
                            } else {
                                objectRoom[f]["mergesData"].push(this.keyAnswer[m.s.c].concat((m.s.r - 6 + headerData.length + objectRoom[f]["dataTable"].length).toString(), ':', this.keyAnswer[m.e.c], (m.e.r - 6 + headerData.length + objectRoom[f]["dataTable"].length).toString()));
                            }
                        });
                    });

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
                            name: 'G1:T1',
                            font: { name: 'Arial', family: 1, size: 10 },
                            alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
                        },
                        dltdhp: {
                            name: 'G2:T2',
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
                    const objectColWidth = { 1: 8, 2: 10, 3: 25, 4: 20, 5: widthPoint, 6: widthPoint, 7: widthPoint, 8: widthPoint, 9: widthPoint, 10: widthPoint, 11: 15 };
                    this.notificationService.isProcessing(false);
                    this.exportPointThiKthpService.exportExcel(objectRoom, cols, objectColWidth, { name: 'Arial', family: 1, size: 10 }, this.selectedShift.name.concat(' - ', this.selectedRoom.room));
                    this.loadForStatusOnly();
                };
            });
        } else {
            this.notificationService.toastWarning('Không có sinh viên nào');
        }
    }

    dataByClass(value: ThiShiftStudents, key) {

        const ho = value.student['full_name'].split(' ').splice(0, value.student['full_name'].split(' ').length - 1).join(' ');

        const ten = value.student['full_name'].split(' ').splice(value.student['full_name'].split(' ').length - 1, 1).join(' ');

        let readPoint = ' - ';

        let status = '';

        if (value.point > -1) {
            const stringpoint = value.point.toString().split(/\D/gi);
            if (stringpoint.length <= 1) {
                readPoint = PointRead[value.point];
            } else {
                if (Number(stringpoint[1]) === 5 && Number(stringpoint[0]) !== 0) {
                    readPoint = PointRead[Number(stringpoint[0])].concat(" rưỡi");
                } else {
                    readPoint = PointRead[Number(stringpoint[0])].concat(" phẩy ").concat(PointRead[Number(stringpoint[1])].toLowerCase())
                }
            }
        }

        if (value.violation_of_exam && value.violation_of_exam.title) {
            const index = this.dbConfig.findIndex(m => m.key === value.violation_of_exam.key);
            if (index !== -1) {
                status = value.violation_of_exam.title.concat(' (đã trừ ', this.dbConfig[index]['POINT'].toString(), '%)');
            }

        }

        if (value.status === 1) {
            if (value.violation_of_exam && value.violation_of_exam.key === "DINH_CHI") {
                status = "OF";
            }
        } else if (value.status === 0) {
            if (value.locked === 1) {
                status = "VK";
                readPoint = '';
            } else if (value.locked === 2) {
                status = "DHT";
                readPoint = '';
            }
        } else if (value.status === -1) {
            status = "HUY";
            readPoint = '';
        }

        const point_check = value.point > -1 ? value.point : ' - ';

        return [
            key,
            value.sbd,
            value.student.student_code.toUpperCase(),
            ho,
            ten,
            value.student.birthday,
            value.id,
            '',
            point_check,
            readPoint,
            status,
        ];
    }

    async getPassOfTest() {
        this.notificationService.isProcessing(true);
        const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'GETPASSCODE_ROOM', object: 'thi_shift_room', object_id: this.selectedRoom.id, note: this.type_log['GETPASSCODE_ROOM'], thi_shift_id: this.selectedShift.id });
        this.thiShiftStudentsService.passCode(this.selectedShift.id, this.selectedRoom.room).subscribe({
            next: (a) => {
                this.notificationService.isProcessing(false);
                this.notificationService.confirm('<div class="pass_of_test_popup"><div><span class="font-weight-600 label-name">phòng ' + this.selectedRoom.room + '</span></div><div>Mã truy cập bài thi của tất cả sinh viên là:</div> <div class="label-pass"><span class="font-weight-600">' + a.data + '</span></div></div>', "Thông báo", [BUTTON_CLOSED]).then(() => {

                })
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    async getPassOfTestStudent(shift_student: ThiShiftStudents) {
        this.selectedShiftStudent = shift_student;
        this.notificationService.isProcessing(true);
        const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'GETPASSCODE', object: 'thi_shift_student', object_id: shift_student.id, note: this.type_log['GETPASSCODE'], thi_shift_id: this.selectedShift.id });
        this.thiShiftStudentsService.passCode(this.selectedShift.id, this.selectedRoom.room, shift_student.id).subscribe({
            next: (a) => {
                this.notificationService.isProcessing(false);
                this.notificationService.confirm('<div class="pass_of_test_popup"><div><span class="font-weight-600 label-name">' + shift_student.student.full_name + ' (' + shift_student.student.student_code + ')</span></div><div>Mã truy cập bài thi là:</div> <div class="label-pass"><span class="font-weight-600">' + a.data + '</span></div></div>', "Thông báo", [BUTTON_CLOSED]).then(() => {

                })
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    async onChangeLock(shift_student: ThiShiftStudents, status: number) {
        if (this.selectedRoom && this.selectedRoom['canEdit']) {
            if (shift_student.thi_question_bank_tn_id) {
                const lock = status;
                this.notificationService.isProcessing(true);
                let type: any = "UNLOCK_TEST";
                if (lock === 1) {
                    type = "LOCK_TEST_KP";
                } else if (lock === 2) {
                    type = "LOCK_TEST_P";
                }
                const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: type, object: 'thi_shift_student', object_id: shift_student.id, note: this.type_log[type], thi_shift_id: this.selectedShift.id });
                this.thiShiftStudentsService.updateThiShiftStudents(shift_student.id, { locked: lock }).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        shift_student['locked'] = lock;
                    },
                    error: () => {

                    }
                })
            } else {
                this.notificationService.toastWarning('Chưa có đề kiểm tra cho sinh viên này');
            }
        } else {
            this.notificationService.toastWarning('Thầy/Cô không được phân công coi thi cho phòng thi này');
        }
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    openViolationSet(shift_student: ThiShiftStudents) {

        this.acceptViolation = false;

        this.selectedShiftStudent = shift_student;

        this.displayViolation = true;

        this.violationData = {
            key: this.dbConfig[0].key,
            note: null,
            user_id: this.auth.user.id,
            title: this.dbConfig[0]['TITLE']
        }

        if (shift_student.violation_of_exam) {
            this.violationData = shift_student.violation_of_exam;
        }

        this.closeInterval();
    }

    saveViolation() {
        if (!this.violationData.key) {
            return this.notificationService.toastWarning("Vui lòng chọn mức độ vi phạm")
        }

        if (!this.violationData.note) {
            return this.notificationService.toastWarning("Vui lòng điền ghi chú của cán bộ coi thi");
        }



        const violation_ = this.dbConfig.find(m => m['key'] === this.violationData.key)
        this.violationData.title = violation_['TITLE'];

        const data: ThiShiftViolation = {
            shift_student_id: this.selectedShiftStudent.id,
            violation_key: this.violationData.key,
            note: this.violationData.note,
            student_id: this.selectedShiftStudent.student_id,
            shift_id: this.selectedShift.id
        }

        const data_control: ThiShiftControls = {
            shift_student_id: this.selectedShiftStudent.id,
            type: 'VIOLATION',
            message: this.violationData.note,
            value: violation_['POINT'],
            sender: 'GIANGVIEN',
            sender_by: this.auth.user.id,
            received_by: this.selectedShiftStudent.student.user_id,
            status: 0
        }

        this.notificationService.confirm("<div class='pass_of_test_popup'><div>Bạn có chắc chắn xử lý vi phạm sinh viên:</div><div><span class='font-weight-600'>" + this.selectedShiftStudent.student.full_name + " - " + this.selectedShiftStudent.student.student_code + "</span></div></div>", 'Xử lý vi phạm', [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'VIOLATION', object: 'thi_shift_student', object_id: this.selectedShiftStudent.id, note: this.type_log['VIOLATION'], thi_shift_id: this.selectedShift.id });
                forkJoin([
                    this.thiShiftStudentsService.updateThiShiftStudents(this.selectedShiftStudent.id, { violation_of_exam: this.violationData, trudiem: violation_['POINT'] }),
                    this.thiShiftViolationsService.addThiShiftViolations(data),
                    this.thiShiftControlssService.addThiShiftControlss(data_control),
                ]).subscribe({
                    next: () => {
                        if (this.violationData.key === 'DINH_CHI') {
                            const data_nopbai: ThiShiftControls = {
                                shift_student_id: this.selectedShiftStudent.id,
                                type: 'SUBMIT',
                                message: 'Cán bộ coi thi đã thu bài',
                                value: null,
                                sender: 'GIANGVIEN',
                                sender_by: this.auth.user.id,
                                received_by: this.selectedShiftStudent.student.user_id,
                                status: 0
                            }
                            this.notificationService.isProcessing(true);
                            forkJoin([
                                this.thiShiftControlssService.addThiShiftControlss(data_nopbai),
                                this.thiShiftStudentsService.updateThiShiftStudents(this.selectedShiftStudent.id, { status: 1 }),
                                this.thiShiftStudentsService.nopbai(this.selectedShiftStudent.id)
                            ]).subscribe({
                                next: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastSuccess("Lưu thành công");
                                    this.displayViolation = false;
                                    this.loadForStatusOnly();
                                },
                                error: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastError("Lỗi kết nối, cập nhật thất bại");
                                    this.displayViolation = false;
                                }
                            })
                        } else {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastSuccess("Lưu thành công");
                            this.displayViolation = false;
                            this.loadForStatusOnly();
                        }
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lưu thất bại");
                    }
                })
            }
        })
    }

    openTrackingStudent(shift_student: ThiShiftStudents) {
        this.selectedShiftStudent = null;
        this.selectedShiftStudent = shift_student;
        this.notificationService.openSideNavigationMenu({ template: this.templateTrackingStudent, size: 800, offsetTop: '0px' });
    }

    openWarningStudent(shift_student: ThiShiftStudents) {
        this.selectedShiftStudent = null;
        this.selectedShiftStudent = shift_student;
        this.notificationService.openSideNavigationMenu({ template: this.templateWarningStudent, size: 800, offsetTop: '0px' });
    }

    openLogStudent(shift_student: ThiShiftStudents) {
        this.selectedShiftStudent = null;
        this.selectedShiftStudent = shift_student;
        this.notificationService.openSideNavigationMenu({ template: this.templateLogStudentShift, size: 800, offsetTop: '0px' });
    }



    closeSideMenu() {
        this.selectedShiftStudent = null;
        this.notificationService.closeSideNavigationMenu();
    }

    openCancelTest(shift_student: ThiShiftStudents) {
        this.selectedShiftStudent = shift_student;
        this.displayCancel = true;
        this.messageControl = null;
    }

    closeRoom() {
        const data_ = this.list_student.filter(m => m._student_status !== 2 && m._student_status !== -1 && m._student_status !== 0);
        if (data_.length) {
            return this.notificationService.toastWarning("Còn ".concat(data_.length.toString(), ' sinh viên chưa nộp bài. Yêu cầu thao tác thu bài trước khi thực hiện HOÀN THÀNH COI THI'));
        }

        this.displayCloseRoom = true;
        // this.notificationService.confirm( 'check', [ BUTTON_YES, BUTTON_NO ] ).then( () => { } )
    }

    async lockLoginAllStudent() {
        this.notificationService.isProcessing(true);
        const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'LOCK_LOGIN_ROOM', object: 'thi_shift_room', object_id: this.selectedRoom.id, note: this.type_log['LOCK_LOGIN_ROOM'], thi_shift_id: this.selectedShift.id });
        this.thiShiftStudentsService.lockLogin({ shift_id: this.selectedShift.id, room: this.selectedRoom.room, expires: this.selectedShift.time_of_test }).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Đã khóa đăng nhập sinh viên thành công');
                this.loadForStatusOnly();
            },
            error: () => {
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.isProcessing(false);
            }
        })
    }

    async unlockLoginAllstudent() {
        this.notificationService.isProcessing(true);
        const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'UNLOCK_LOGIN_ROOM', object: 'thi_shift_room', object_id: this.selectedRoom.id, note: this.type_log['UNLOCK_LOGIN_ROOM'], thi_shift_id: this.selectedShift.id });
        this.thiShiftStudentsService.unLockLogin(this.selectedShift.id, this.selectedRoom.room).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Đã mở khóa đăng nhập sinh viên thành công');
                this.loadForStatusOnly();
            },
            error: () => {
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.isProcessing(false);
            }
        })
    }

    startCloseRoom() {
        this.notificationService.confirm('Thầy/Cô có chắc chắn thực hiện thao tác xác nhận đã hoàn thành coi thi?', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'HOANTHANHCOITHI', object: 'thi_shift_room', object_id: this.selectedRoom.id, note: this.type_log['HOANTHANHCOITHI'], thi_shift_id: this.selectedShift.id });
                forkJoin([
                    this.thiShiftRoomssService.updateThiShiftRoomss(this.selectedRoom.id, { status: 1 }),
                    this.thiShiftStudentsService.unLockLogin(this.selectedShift.id, this.selectedRoom.room)
                ]).pipe(mergeMap(a => {
                    return forkJoin([
                        this.thiShiftRoomssService.closeroom(this.selectedShift.id),
                    ])
                })).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess('Đã hoàn thành coi thi');
                        this.displayCloseRoom = false;
                        this.selectedRoom = null;
                        this.loadPhongthi();
                    },
                    error: () => {
                        this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        })
    }

    async lockLoginStudent(shift_student: ThiShiftStudents) {
        this.notificationService.isProcessing(true);
        const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'LOCK_LOGIN', object: 'thi_shift_student', object_id: shift_student.id, note: this.type_log['LOCK_LOGIN'], thi_shift_id: this.selectedShift.id });
        this.thiShiftStudentsService.lockLogin({ shift_id: this.selectedShift.id, room: this.selectedRoom.room, shift_student_id: shift_student.id, expires: this.selectedShift.time_of_test }).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Đã khóa đăng nhập sinh viên thành công');
                this.loadForStatusOnly();
            },
            error: () => {
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.isProcessing(false);
            }
        })
    }

    async unLockLoginStudent(shift_student: ThiShiftStudents) {
        this.notificationService.isProcessing(true);
        const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'UNLOCK_LOGIN', object: 'thi_shift_student', object_id: shift_student.id, note: this.type_log['UNLOCK_LOGIN'], thi_shift_id: this.selectedShift.id });
        this.thiShiftStudentsService.unLockLogin(this.selectedShift.id, this.selectedRoom.room, shift_student.id).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Đã mở đăng nhập sinh viên thành công');
                this.loadForStatusOnly();
            },
            error: () => {
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.isProcessing(false);
            }
        })
    }

    deleteViolation(shift_student: ThiShiftStudents) {
        this.selectedShiftStudent = shift_student;
        this.noteDeleteViolation = null;
        this.displayDeleteViolaytion = true;
    }

    startDeleteViolation() {
        if (this.noteDeleteViolation) {
            this.notificationService.confirm('Thầy/Cô có chắc chắn hủy xử lý vi phạm?', 'Xác nhận thành động', [BUTTON_YES, BUTTON_NO]).then(async a => {
                if (a.name === 'yes') {

                    const data_control: ThiShiftControls = {
                        shift_student_id: this.selectedShiftStudent.id,
                        type: 'DELETE_VIOLATION',
                        message: this.noteDeleteViolation.trim(),
                        value: 0,
                        sender: 'GIANGVIEN',
                        sender_by: this.auth.user.id,
                        received_by: this.selectedShiftStudent.student.user_id,
                        status: 0
                    }

                    this.notificationService.isProcessing(true);
                    const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'DELETE_VIOLATION', object: 'thi_shift_student', object_id: this.selectedShiftStudent.id, note: this.type_log['DELETE_VIOLATION'], thi_shift_id: this.selectedShift.id });
                    forkJoin([
                        this.thiShiftControlssService.addThiShiftControlss(data_control),
                        this.thiShiftStudentsService.updateThiShiftStudents(this.selectedShiftStudent.id, { violation_of_exam: null, trudiem: 0 })
                    ]).subscribe({
                        next: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastSuccess("Hủy thành công");
                            this.closeAddTime();
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                        }
                    })
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng nhập ghi chú");
        }
    }

    openDialogThubai() {
        const data_ = this.list_student.filter(m => m._student_status !== 2 && m._student_status !== -1 && m._student_status !== 0);
        this.checkboxThubai = false;
        if (!data_.length) {
            return this.notificationService.toastWarning("Không tìm thấy bài thi, vui lòng kiểm tra lại");
        } else {
            this.display_thubai = true;
        }
    }

    startThuBaiAll() {
        this.notificationService.confirm('Thầy/Cô có chắc chắn thực hiện thao tác THU BÀI THI CỦA TẤT CẢ SINH VIÊN?', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                const log = await this.addThiLogPromise({ user_id: this.auth.user.id, type: 'SUBMIT_ROOM', object: 'thi_shift_room', object_id: this.selectedRoom.id, note: this.type_log['SUBMIT_ROOM'], thi_shift_id: this.selectedShift.id });
                this.thiShiftStudentsService.nopBaiAll({ shift_id: this.selectedShift.id, room: this.selectedRoom.room }).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Đã thu bài thành công");
                        this.closeAddTime();
                        this.loadForStatusOnly();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            }
        })
    }

    addThiLogPromise(data: ThiLogs): Promise<any> {
        return new Promise((resolve, reject) => {
            this.thiLogsService.addThiLogs(data).subscribe({
                next: (_log) => {
                    resolve(_log)
                },
                error: () => {
                    resolve(null);
                }
            })
        });
    }
}
