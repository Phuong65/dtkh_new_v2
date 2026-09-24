import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ClassPlanActivityTuluanGroupService } from './../../../../shared/services/class_plan_activity_tuluan_group.service';
import { ThiShiftStudentsDuanService } from './../../../../shared/services/thi-shift-students-duan.service';
import { ThiShiftGroupDuanService } from './../../../../shared/services/thi-shift-group-duan.service';
import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThiShifts } from '@modules/shared/models/thi-shifts';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ThiShiftRoomssService } from '@modules/shared/services/thi-shift-rooms.service';
import { student_import_shift } from '../sinhvien-cathi/sinhvien-cathi.component';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { BUTTON_CLOSED, BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import * as XLSX from 'xlsx';
import * as saveAs from 'file-saver';
import { catchError, forkJoin, map, mergeMap, Observable, of } from 'rxjs';
import { ClassPlanActivityTuluanGroup } from '@modules/shared/models/class_plan_activity_tuluan_group';
import { ClassStudent } from '@modules/shared/models/class-student';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { key_server } from '@env';
import { ThiShiftStudentsDuan } from '@modules/shared/models/thi-shift-students-duan';

export interface ClassPlanActivityTuluanGroup2 extends ClassPlanActivityTuluanGroup {
    students?: ClassStudent[];
    room?: string;
}


export interface student_import_shift_duan extends student_import_shift {
    course_plan_activity_tuluan_id?: number;
}



@Component({
    selector: 'app-sinhvien-cathi-duan',
    standalone: true,
    imports: [CommonModule, FormsModule, SharedModule, TableModule, PaginatorModule, ReactiveFormsModule, CalendarModule, MatMenuModule, OverlayPanelModule, TabViewModule, DialogModule, MatProgressBarModule, MatListModule],
    templateUrl: './sinhvien-cathi-duan.component.html',
    styleUrls: ['./sinhvien-cathi-duan.component.css']
})
export class SinhvienCathiDuanComponent implements OnInit, OnChanges {

    @Input() thishift: ThiShifts;

    @ViewChild('inputImport') inputImport: ElementRef;

    @ViewChild('paginator_room') paginator_room: Paginator;

    shiftSelected: ThiShifts;

    list_student_import: student_import_shift[];

    pageImport = 0;

    waitting_title: string;

    progressValue: number = 0;

    displayModal: boolean = false;

    display_add_student: boolean = false;

    search_student_import: string;

    student_one_add: ElngUserProfile;

    status_object = {
        no_account: 0,
        no_import: 0,
        import_done: 0,
        import_fail: 0
    }

    status_import_filter: string = null;

    activityIndex = 0;

    list_room: ThiShiftStudentsDuan[];

    selectedRoom: ThiShiftStudentsDuan;

    searRoom: string;

    list_student_in_room: ThiShiftStudentsDuan[];

    total_Student_in_room: number = 0;

    limit_student: number = 25;

    pageStudent_room_index: number = 1;

    search_student_in_room: string;

    key_server = key_server;
    constructor(
        private helperService: HelperService,
        private notificationService: NotificationService,
        private elngUserProfileService: ElngUserProfileService,
        // private thiShiftStudentsService: ThiShiftStudentsService,
        private fileService: FileService,
        private thiShiftRoomssService: ThiShiftRoomssService,
        private thiShiftStudentsDuanService: ThiShiftStudentsDuanService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['thishift']) {
            this.shiftSelected = this.thishift;
            this.list_student_import = null;
            this.activityIndex = 0;
        }
    }

    ngOnInit(): void {

    }

    getRoomPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const condition_room: ConditionOption = {
                condition: [
                    { conditionName: "shift_id", condition: OvicQueryCondition.equal, value: this.shiftSelected.id.toString(), orWhere: 'and' }
                ],
                set: [
                    { label: 'limit', value: '-1' }
                ],
                page: null
            }
            this.thiShiftRoomssService.getThiShiftRoomssByPageNew(condition_room).subscribe({
                next: (a) => {
                    if (a.recordsFiltered) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                },
                error: () => {
                    resolve(false);
                }
            })
        });
    }

    async onGetFileExcelImport() {
        if (!await this.getRoomPromise()) {
            this.notificationService.confirm('<div class="altert-import-student-after-set-rooms"><span>- Bạn đang thực hiện thao tác import sinh viên vào ca thi</span>' +
                '<span>- Cán bộ coi thi đã được phân quyền coi thi cho ca thi này </span>' +
                '<span>- Vui lòng xóa cán bộ coi thi trong chức năng <strong> Phân quyền coi thi </strong> trước khi thực hiện thao tác này</span></div>', "Cảnh báo", [BUTTON_CLOSED]).then(a => {
                    // if ( a.name === 'yes' ) {
                    //     this.inputImport.nativeElement.value = '';
                    //     this.inputImport.nativeElement.click();
                    // }
                })
        } else {
            this.inputImport.nativeElement.value = '';
            this.inputImport.nativeElement.click();
        }
    }

    changeInputImport(event) {
        if (event.target.files[0]) {
            const file = event.target.files[0];
            if (this.helperService.checkTypeFile(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'], file.type)) {
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onloadend = (event) => {
                    const localUrl = reader.result;
                    const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'binary' });
                    if (Object.keys(wb.Sheets) && Object.keys(wb.Sheets).length) {
                        let phongthi = '';
                        const data_import: student_import_shift[] = [];
                        const student_code: string[][] = [];
                        let i = 0;
                        student_code[i] = [];
                        Object.keys(wb.Sheets).forEach(f => {
                            const ws: XLSX.WorkSheet = wb.Sheets[f];
                            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                            if (f.indexOf('Trang1') !== -1 || this.key_server === 'hvu') {
                                if (data[6][9]) {
                                    const split_pt = data[6][9].toString().trim().split(':');
                                    if (split_pt[1]) {
                                        phongthi = split_pt[1].toString().trim();
                                        if (!phongthi) {
                                            this.notificationService.toastWarning("Sai cấu trúc file, không tìm thấy phòng thi tại sheet: " + f);
                                            return;
                                        }
                                    } else {
                                        this.notificationService.toastWarning("Sai cấu trúc file, không tìm thấy phòng thi tại sheet: " + f);
                                        return;
                                    }
                                } else {
                                    this.notificationService.toastWarning("Sai cấu trúc file, không tìm thấy phòng thi tại sheet: " + f);
                                    return;
                                }
                            }

                            const object_check = {};

                            data.forEach(d => {
                                let check_true_row = true;
                                for (let i = 0; i < 6; i++) {
                                    if (!d[i]) {
                                        check_true_row = false;
                                    }
                                }

                                if (check_true_row && !isNaN(d[0])) {
                                    if (!object_check[d[2].toString().trim().toLowerCase()]) {
                                        object_check[d[2].toString().trim().toLowerCase()] = true;
                                        const student: student_import_shift = {
                                            stt: Number(d[0].toString().trim()),
                                            sbd: d[1].toString().trim(),
                                            masv: d[2].toString().trim().toLowerCase(),
                                            full_name: d[3].toString().trim().concat(' ', d[4].toString().trim()),
                                            name_string: d[4].toString().trim(),
                                            birthday: d[5].toString().trim(),
                                            room: phongthi.replace(/\s/gi, ''),
                                            shift_id: this.shiftSelected.id,
                                            student_id: 0,
                                            status: -1,
                                            student_user_id: 0
                                        }

                                        if (student_code[i].length < 200) {
                                            student_code[i].push(student.masv);
                                        } else {
                                            i = i + 1;
                                            student_code[i] = [];
                                            student_code[i].push(student.masv);
                                        }

                                        data_import.push(student);
                                    }
                                }
                            })
                        })

                        if (data_import.length) {
                            this.convertExcelDataToSqlData(student_code, data_import)
                        } else {
                            this.notificationService.toastWarning("Sai cấu trúc file, không tìm thấy sinh viên, vui lòng kiểm tra lại");
                        }
                    } else {
                        this.notificationService.toastWarning("Sai cấu trúc file, vui lòng kiểm tra lại");
                    }
                };
            } else {
                this.notificationService.toastWarning("Sai định dạng file, yêu cầu file .xlsx. Vui lòng tải file mẫu danh sách import sinh viên");
            }
        }
    }

    loopGetFromDataStudentForImport(key: number, student_code_datas: string[][], data_return: ElngUserProfile[]): Observable<ElngUserProfile[]> {
        this.progressValue = (key + 1) / student_code_datas.length * 100;
        const condition_student: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: student_code_datas[key].length.toString() },
                { label: 'include', value: student_code_datas[key].toString() },
                { label: 'include_by', value: 'student_code' }
            ],
            page: null
        }

        return this.elngUserProfileService.getUserProfileByPageNewV2(condition_student).pipe(
            catchError(() => {
                this.progressValue = 0;
                this.displayModal = false;
                this.notificationService.toastError("Đã có lỗi sảy ra trong quá trình tải dữ liệu, vui lòng thử lại");
                return of(null);
            }),
            mergeMap(_res => {
                data_return = data_return.concat(_res.data);
                if (student_code_datas[key + 1] && student_code_datas[key + 1].length) {
                    return this.loopGetFromDataStudentForImport(key + 1, student_code_datas, data_return);
                } else {
                    return of(data_return)
                }
            }))
    }

    convertExcelDataToSqlData(student_code: string[][], data_import: student_import_shift[]) {
        this.waitting_title = 'Đang tải dữ liệu, vui lòng chờ ...';
        this.displayModal = true;
        this.progressValue = 0;
        if (student_code.length) {
            this.loopGetFromDataStudentForImport(0, student_code, []).subscribe({
                next: (_user_res) => {
                    this.progressValue = 0;
                    this.displayModal = false;
                    data_import.forEach(f => {
                        const index = _user_res.findIndex(m => m.student_code === f.masv);
                        if (index !== -1) {
                            f.full_name = _user_res[index].full_name;
                            f.student_id = _user_res[index].id;
                            f['status'] = 0;
                            f['student_user_id'] = _user_res[index].user_id;
                        } else {
                            f['status'] = -1
                        }
                    })

                    this.list_student_import = data_import;

                    this.getStatusObject();
                },
                error: () => {
                }
            });
        } else {
            this.notificationService.toastWarning("Sai cấu trúc file, không tìm thấy sinh viên, vui lòng kiểm tra lại");
        }
    }

    getStatusObject() {
        this.status_object = {
            no_account: this.list_student_import.filter(m => m.status === -1).length,
            no_import: this.list_student_import.filter(m => m.status === 0).length,
            import_done: this.list_student_import.filter(m => m.status === 1).length,
            import_fail: this.list_student_import.filter(m => m.status === -2).length
        }
    }

    onChangePageImport(event) {
        this.pageImport = event.page;
    }

    startImportShiftStudent() {
        const data_can_import = this.list_student_import.filter(m => m.status === 0);
        if (data_can_import.length) {
            this.notificationService.confirm("Thầy/Cô có chắc chắn bắt đầu quá trình import không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    const request: Observable<any>[][] = [];
                    let i = 0;
                    request[i] = [];
                    data_can_import.forEach(f => {
                        const data_student: ThiShiftStudentsDuan = {
                            shift_id: f.shift_id,
                            student_id: f.student_id,
                            ordering: f.stt,
                            sbd: f.sbd,
                            room: f.room,
                            student_user_id: f.student_user_id
                        }
                        if (request[i].length < 6) {
                            request[i].push(this.thiShiftStudentsDuanService.addThiShiftStudentsDuan(data_student).pipe(
                                map(a => {
                                    f['status'] = 1;
                                    return;
                                }),
                                catchError(e => {
                                    if (e.error.message === "Sinh viên này đã có trong ca thi.") {
                                        f['status'] = 1;
                                        return of(null)
                                    }
                                    f['status'] = -2;
                                    return of(e);
                                })
                            ))
                        } else {
                            i = i + 1;
                            request[i] = [];
                            request[i].push(this.thiShiftStudentsDuanService.addThiShiftStudentsDuan(data_student).pipe(
                                map(a => {
                                    f['status'] = 1;
                                    return;
                                }),
                                catchError(e => {
                                    if (e.error.message === "Sinh viên này đã có trong ca thi.") {
                                        f['status'] = 1;
                                        return of(null)
                                    }
                                    f['status'] = -2;
                                    return of(e);
                                })
                            ))
                        }
                    })

                    this.progressValue = 0;
                    this.displayModal = true;
                    this.waitting_title = 'Đang đồng bộ dữ liệu, vui lòng chờ...';
                    if (request.length) {
                        this.loopAddStudentShift(0, request).subscribe(() => {
                            this.displayModal = false;
                            this.getStatusObject();
                            this.notificationService.toastSuccess("Đã hoàn thành quá trình import, vui lòng kiểm tra lại danh sách sinh viên đã import");
                        })
                    } else {
                        this.notificationService.toastWarning("Không có sinh viên chưa import");
                    }
                }
            })
        } else {
            this.notificationService.toastWarning("Không có sinh viên chưa import");
        }
    }

    loopAddStudentShift(key, request_: Observable<any>[][]): Observable<any> {
        this.progressValue = (key + 1) / request_.length * 100;
        return forkJoin(request_[key]).pipe(
            mergeMap(_res => {
                if (request_[key + 1] && request_[key + 1].length) {
                    return this.loopAddStudentShift(key + 1, request_);
                } else {
                    return of(null)
                }
            }))
    }

    changeTap() {
        this.search_student_in_room = null;
        switch (this.activityIndex) {
            case 0:
                this.list_student_import = null;
                break;
            case 1:
                this.loadStudentInShift();
                break;
            default:
                break;
        }
    }

    loadStudentInShift() {
        const condition_room: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.shiftSelected.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'room' },
                { label: 'groupby', value: 'room' }
            ],
            page: null
        }

        const condition_student: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.shiftSelected.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'room' },
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.thiShiftStudentsDuanService.getThiShiftStudentsDuanByPageNew(condition_room),
            this.thiShiftStudentsDuanService.getThiShiftStudentsDuanByPageNew(condition_student)
        ]).subscribe({
            next: ([_room, _student]) => {
                _room.data.forEach(f => {
                    const students = _student.data.filter(m => m.room === f.room);
                    f['count_students'] = students.length;
                    // f['shift_Students'] = students.filter(m => m['thi_question_bank_tn_id']).length;
                })

                const all: ThiShiftStudentsDuan = {
                    id: 1,
                    room: 'Tất cả',
                    shift_id: 0,
                    student_id: 0,
                    ordering: 0,
                    sbd: '',
                    student_user_id: 0
                }

                all['count_students'] = _student.recordsFiltered;
                // all['shift_Students'] = _student.data.filter(m => m['thi_question_bank_tn_id']).length;

                _room.data.splice(0, 0, all);

                this.list_room = _room.data;

                this.notificationService.isProcessing(false);


                if (this.list_room && this.list_room.length) {
                    if (this.selectedRoom) {
                        const index = this.list_room.findIndex(m => m.room === this.selectedRoom.room)
                        if (index === -1) {
                            this.selectedRoom = all;
                        }
                    } else {
                        this.selectedRoom = all;
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

    onSelectedRoom(room: ThiShiftStudentsDuan) {
        this.selectedRoom = room;
        this.list_student_in_room = [];
        this.total_Student_in_room = 0;
        this.returnToOrderPage(this.pageStudent_room_index);
    }

    returnToOrderPage(page_order) {
        if (this.paginator_room) {
            if (!this.paginator_room.empty()) {
                this.paginator_room.changePage(page_order - 1);
            } else {
                this.onLoadStudentByRoom(1);
            }
        } else {
            this.onLoadStudentByRoom(1);
        }
    }


    getUserPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.student_one_add = null;
            if (this.search_student_in_room && this.search_student_in_room.trim()) {
                const condition_user: ConditionOption = {
                    condition: [
                        { conditionName: 'student_code', condition: OvicQueryCondition.equal, value: this.search_student_in_room.trim().toLocaleLowerCase(), orWhere: 'and' }
                    ],

                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id,student_code,full_name,birthday' },
                    ],

                    page: null
                }

                this.elngUserProfileService.getUserProfileByPageNewV2(condition_user).subscribe({
                    next: (_user) => {
                        if (_user.recordsFiltered) {
                            this.student_one_add = _user.data[0];
                            resolve(_user.data[0].id);
                        } else {
                            resolve(0);
                        }
                    },
                    error: () => {
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                        resolve(null);

                    }
                })
            } else {
                resolve(null)
            }
        });
    }


    async onLoadStudentByRoom(page: number) {
        const condition_student: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.shiftSelected.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: this.limit_student.toString() },
                { label: 'select', value: 'id,student_id,id,ordering,sbd,room' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' },
                { label: 'with', value: 'student' },
            ],
            page: page.toString()
        }

        if (this.selectedRoom && !this.selectedRoom.id) {
            condition_student.condition.push({ conditionName: 'room', condition: OvicQueryCondition.equal, value: this.selectedRoom.room, orWhere: 'and' })
        }

        this.notificationService.isProcessing(true);

        const user_id_filter = await this.getUserPromise();

        if (user_id_filter || user_id_filter === 0) {
            condition_student.condition.push({ conditionName: 'student_id', condition: OvicQueryCondition.equal, value: user_id_filter.toString(), orWhere: 'and' })

        }



        this.thiShiftStudentsDuanService.getThiShiftStudentsDuanByPageNew(condition_student).pipe(mergeMap(a => {
            return of(a);
        })).subscribe({
            next: (_student) => {

                const _index_start = (page - 1) * this.limit_student;

                _student.data.forEach((f, key) => {
                    f['index_'] = _index_start + key + 1;
                })

                this.list_student_in_room = _student.data;

                this.total_Student_in_room = _student.recordsFiltered;

                this.notificationService.isProcessing(false);

                if ((user_id_filter || user_id_filter === 0) && this.list_student_in_room.length === 0) {
                    if (this.student_one_add) {
                        if (!this.selectedRoom.id) {
                            this.display_add_student = true;
                        }
                    } else {
                        this.notificationService.confirm('Sinh viên có mã (' + this.search_student_in_room + ') chưa được cấp tài khoản, vui lòng liên hệ phòng Công tác Học sinh, sinh viên để được cấp tài khoản', 'Thông báo', [BUTTON_CLOSED]).then(() => { }, () => { });
                    }
                }
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    onChangePageStudentInRoom(event) {
        this.pageStudent_room_index = event.page + 1;
        this.onLoadStudentByRoom(this.pageStudent_room_index);
    }

    deleteOneStudent(student: ThiShiftStudentsDuan) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.thiShiftStudentsDuanService.deleteThiShiftStudentsDuan(student.id).subscribe({
                    next: () => {
                        this.loadStudentInShift();
                        this.notificationService.toastSuccess("Xóa thành công");
                    },
                    error: () => {
                        this.notificationService.toastSuccess("Xóa thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        })
    }

    deleteAllStudentInRoom() {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                if (this.selectedRoom.id) {
                    this.thiShiftStudentsDuanService.deleteThiShiftStudentsDuanByCol(this.shiftSelected.id.toString(), 'shift_id').subscribe({
                        next: () => {
                            this.notificationService.toastSuccess("Xóa thành công");
                            this.loadStudentInShift();
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastSuccess("Xóa thất bại");
                        }
                    })
                } else {
                    const condition_student: ConditionOption = {
                        condition: [
                            { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.shiftSelected.id.toString(), orWhere: 'and' },
                            { conditionName: 'room', condition: OvicQueryCondition.equal, value: this.selectedRoom.room, orWhere: 'and' }
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'select', value: 'id' }
                        ],
                        page: null
                    }

                    this.thiShiftStudentsDuanService.getThiShiftStudentsDuanByPageNew(condition_student).pipe(mergeMap(a => {
                        const thi_student_ids = [];
                        a.data.forEach(f => {
                            thi_student_ids.push(f.id);
                        })

                        if (thi_student_ids.length) {
                            return this.thiShiftStudentsDuanService.deleteThiShiftStudentsDuan([... new Set(thi_student_ids)].toString()).pipe(mergeMap(s => {
                                return of(null);
                            }))
                        }

                        return of(null);
                    })).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess("Xóa thành công");
                            this.loadStudentInShift();
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastSuccess("Xóa thất bại");
                        }
                    })
                }
            }
        })
    }

    filterStudent(event) {
        if (this.search_student_in_room) {
            if (event.key === 'Enter') {
                this.returnToOrderPage(1)
            }
        } else {
            this.returnToOrderPage(1)
        }
    }

    addOneStudent() {
        if (this.student_one_add) {
            if (this.student_one_add['SBD']) {
                const data = {
                    shift_id: this.shiftSelected.id,
                    student_id: this.student_one_add.id,
                    ordering: this.selectedRoom['count_students'] + 1,
                    sbd: this.student_one_add['SBD'],
                    room: this.selectedRoom.room
                }

                this.notificationService.isProcessing(true);
                this.display_add_student = false;
                this.thiShiftStudentsDuanService.addThiShiftStudentsDuan(data).subscribe({
                    next: () => {
                        this.loadStudentInShift();

                        this.search_student_in_room = null;
                        this.notificationService.toastSuccess('Thêm thành công');
                    },
                    error: (e) => {
                        if (e.error.message === "Sinh viên này đã có trong ca thi.") {
                            this.notificationService.toastError(e.error.message);
                        }
                        this.notificationService.isProcessing(false);
                    }
                })
            } else {
                this.notificationService.toastWarning("Vui lòng nhập SBD( Số báo danh)")
            }

        }
    }

    downLoadFileSinhVienEx() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\mau_import_sinhvien_thi_kthp.xls').subscribe(res => {
            saveAs(res, 'Mẫu import danh sách sinh viên thi kết thúc học phần.xls');
        });
    }
}
