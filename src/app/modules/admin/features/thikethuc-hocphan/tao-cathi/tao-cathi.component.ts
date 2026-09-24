
import { ThiFormService } from '@modules/shared/services/thi-form.service';
import { ThiShiftStudentsService } from './../../../../shared/services/thi-shift-students.service';
import { UserService } from 'src/app/core/services/user.service';
import { ThiShiftRoomssService } from './../../../../shared/services/thi-shift-rooms.service';
import { ElnKhoaHocService } from '@shared/services/elearning-khoa-hoc.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { OvicDateTime } from './../../../../shared/models/classes';
import { ClassesService } from '@modules/shared/services/classes.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ThiShiftsService } from './../../../../shared/services/thi-shifts.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ThiShifts } from '@modules/shared/models/thi-shifts';
import { AuthService } from '@core/services/auth.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin, merge, mergeMap, of } from 'rxjs';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { SharedModule } from "../../../../shared/shared.module";
import { OvicQueryCondition } from '@core/models/dto';
import { TableModule } from 'primeng/table';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { CalendarModule } from 'primeng/calendar';
import { MatMenuModule } from '@angular/material/menu';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SinhvienCathiComponent } from "../sinhvien-cathi/sinhvien-cathi.component";
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { ThiShiftRooms } from '@modules/shared/models/thi-shift-room';
import { RoleService } from '@core/services/role.service';
import { User } from '@core/models/user';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SidebarModule } from 'primeng/sidebar';
import { MatListModule } from '@angular/material/list';
import { ThiForm } from '@modules/shared/models/thi-form';
import { ExportPassOfRoomService } from '@modules/shared/services/export-pass-of-room.service';
import { Packer } from 'docx';
import * as saveAs from 'file-saver';
import { ROLES } from '@modules/shared/utils/syscat';
import { Router } from '@angular/router';
import { key_server } from '@env';
import { SinhvienCathiHvuComponent } from "../sinhvien-cathi-hvu/sinhvien-cathi-hvu.component";
import { DongboCathiIctuComponent } from "../dongbo-cathi-ictu/dongbo-cathi-ictu.component";
@Component({
    selector: 'app-tao-cathi',
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
        SinhvienCathiComponent,
        NgbTooltipModule,
        SidebarModule,
        MatListModule,
        SinhvienCathiHvuComponent,
        DongboCathiIctuComponent
    ],
    templateUrl: './tao-cathi.component.html',
    styleUrls: ['./tao-cathi.component.css']
})
export class TaoCathiComponent implements OnInit {

    @ViewChild('paginator_shift') paginator_shift: Paginator;

    @ViewChild('createShift') createShift: TemplateRef<any>;

    @ViewChild('templateThemSinhvien') templateThemSinhvien: TemplateRef<any>;

    @ViewChild('templatePhanquyenCoithi') templatePhanquyenCoithi: TemplateRef<any>;

    @ViewChild('templateDongboCathi') templateDongboCathi: TemplateRef<any>;

    openCount = 0;

    isUpdate: boolean = false;

    list_shifts: ThiShifts[];

    selectedShift: ThiShifts;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    formShift: FormGroup;

    canAdded: boolean = false;

    canUpdate: boolean = false;

    canDelete: boolean = false;

    total_shifts: number = 0;

    limit_shifts: number = 20;

    list_namhoc: { value: string, label: string }[] = [];

    list_hocky: { value: string, label: string }[] = [];

    list_dotthi: { value: string, label: string }[] = [];

    list_course: ElnKhoaHoc[] = [];

    objectFillter = {
        course_id: null,
        hocky: null,
        namhoc: null,
        dotthi: null,
        status: null
    };

    formTitle: string;

    list_type_test = [
        { id: 'TRACNGHIEM', label: 'Trắc nghiệm' },
        { id: 'TULUAN', label: 'Tự luận', disabled: true }
    ]

    option_status = [
        { label: 'Chưa kích hoạt', id: 0 },
        { label: 'Đã kích hoạt', id: 1 },
    ];

    option_status_filter = [
        { label: 'Chưa kích hoạt', id: 0 },
        { label: 'Đã kích hoạt', id: 1 },
        { label: 'Đã kết thúc', id: 2 },
    ];

    list_shift_room: ThiShiftRooms[];

    pageIndex: number = 1;

    list_teacher: User[];

    list_shift_rooms: ThiShiftRooms[];

    selectedRoom: ThiShiftRooms;

    displayTeacher: boolean = false;

    searchTeacher: string;

    list_form: ThiForm[];

    checkorder_cbct: number = 0;

    keyServer = key_server;

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
        private router: Router
    ) {
        this.formShift = this.formBuilder.group(
            {
                name: ['', Validators.required],
                desc: [''],
                course_id: ['', Validators.required],
                time_start: ['', Validators.required],
                time_of_test: ['', Validators.required],
                // pass_of_test: [ '', Validators.required ],
                type_of_test: ['', Validators.required],
                namhoc: ['', Validators.required],
                hocky: ['', Validators.required],
                status: ['', Validators.required],
                // num_of_test: ['', Validators.required],
                dotthi: ['', Validators.required],
                form_id: ['']
            }
        );

        const url = this.router.url.substring(7).split('?')[0];

        this.canAdded = this.auth.userCanAdd(url);

        this.canUpdate = this.auth.userCanEdit(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.hoidongthi_chutich) || this.auth.userHasRole(ROLES.hoidongthi_thuky) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
    }

    ngOnInit(): void {
        this.initLoad();
    }

    get f() {
        return this.formShift.controls;
    }

    initLoad() {
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
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
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

        forkJoin([
            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course),
            this.classesService.getClassesByPageNew(condition_hocky),
            this.ovicDateTimeService.getCurrentDateTime(),
            this.thiShiftsService.getThiShiftsByPageNew(condition_dotthi)
        ]).subscribe({
            next: ([_course, _hocky, _date, _dotthi]) => {
                this.list_course = [];

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
                { conditionName: 'type_of_test', condition: OvicQueryCondition.equal, value: 'TRACNGHIEM', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: this.limit_shifts.toString() },
                { label: 'order', value: 'ASC' },
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
            condition_shift.condition.push({ conditionName: 'status', condition: OvicQueryCondition.lessThanOrEqualsTo, value: '1', orWhere: 'and' })
        }

        this.notificationService.isProcessing(true);

        if (!this.isManager) {
            condition_shift.condition.push({ conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' })
        }

        this.thiShiftsService.getThiShiftsByPageNew(condition_shift).pipe(mergeMap(_res => {
            const form_ids = _res.data.map(m => m.form_id);

            if (form_ids.length) {
                const condition_form: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: [...new Set(form_ids)].toString() },
                        { label: 'include_by', value: 'id' }
                    ],
                    page: null
                }
                return this.thiFormService.getThiFormByPageNew(condition_form).pipe(mergeMap(_form => {
                    _res.data.forEach(f => {
                        const index = _form.data.findIndex(i => i.id === f.form_id);
                        if (index !== -1) {
                            f['form_label'] = _form.data[index].name;
                        }
                    })
                    return of(_res);
                }))
            }

            return of(_res);
        })).subscribe({
            next: (_shifts) => {
                this.notificationService.isProcessing(false);
                const _index_start = (page - 1) * this.limit_shifts;
                _shifts.data.forEach((f, key) => {
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

    formReset() {
        this.formShift.reset();
        this.list_form = null;
        this.isUpdate = false;
        this.f['type_of_test'].setValue('TRACNGHIEM');
        this.f['status'].setValue(0);
        // this.f[ 'pass_of_test' ].setValue( this.resetPassword() );
    }

    resetPassword(): string {
        let result = '';
        for (let i = 0; i < 6; i++) {
            result = result.concat(Math.floor(Math.random() * 9).toString())
        }
        return result;
    }


    onResetPassword() {
        this.f['pass_of_test'].setValue(this.resetPassword());
    }


    openAddShifts() {
        this.formTitle = 'Tạo ca thi';
        this.formReset();
        this.notificationService.openSideNavigationMenu({ template: this.createShift, size: 800, offsetTop: '0px' })
    }


    getFormDePromise(course_id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const condition_form: ConditionOption = {
                condition: [
                    { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' }
                ],
                set: [
                    { label: 'limit', value: '-1' }
                ],
                page: null
            }
            this.notificationService.isProcessing(true);
            this.thiFormService.getThiFormByPageNew(condition_form).subscribe({
                next: (_form) => {
                    resolve(_form.data)
                    this.notificationService.isProcessing(false);
                },
                error: () => {
                    resolve(null);
                    this.notificationService.isProcessing(false);
                }
            })
        });
    }

    async openEditShifts(shift: ThiShifts) {
        this.selectedShift = shift;
        this.formTitle = 'Sửa ca thi';
        this.formReset();
        this.list_form = await this.getFormDePromise(shift.course_id);
        this.formShift.setValue({
            name: shift.name,
            desc: shift.desc,
            course_id: shift.course_id,
            time_start: new Date(shift.time_start),
            time_of_test: shift.time_of_test,
            // pass_of_test: shift.pass_of_test,
            type_of_test: shift.type_of_test,
            namhoc: shift.namhoc,
            hocky: shift.hocky,
            status: shift.status,
            dotthi: shift.dotthi,
            form_id: shift.form_id
        })


        this.isUpdate = true;
        this.notificationService.openSideNavigationMenu({ template: this.createShift, size: 800, offsetTop: '0px' })
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
            status: null
        };;
        this.returnToOrderPage(1);
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

    closeSideMenu() {
        this.displayTeacher = false;
        this.notificationService.closeSideNavigationMenu();
    }

    openDongBoCathi() {
        this.openCount++;
        this.notificationService.openSideNavigationMenu({ template: this.templateDongboCathi, size: window.innerWidth, offsetTop: '0px' });
    }

    numberKeyDown(event) {
        if (event) {
            if (!/[0-9]/.test(event.key) && event.key !== 'Backspace') {
                event.preventDefault();
            }
        }
    }

    saveShift() {
        if (this.formShift.valid) {
            const data = this.formShift.getRawValue();
            data['time_start'] = this.helperService.stringToDateSql(data['time_start'], true);
            this.notificationService.isProcessing(true);
            if (this.isUpdate) {
                this.thiShiftsService.updateThiShifts(this.selectedShift.id, data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Sửa thành công");
                        this.returnToOrderPage(this.pageIndex);
                        this.notificationService.isProcessing(false);
                    },
                    error: () => {
                        this.notificationService.toastError("Sửa thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            } else {
                this.thiShiftsService.addThiShifts(data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Thêm thành công");
                        this.returnToOrderPage(1);
                        this.notificationService.isProcessing(false);
                    },
                    error: () => {
                        this.notificationService.toastError("Thêm thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        } else {
            this.notificationService.toastWarning("Vui lòng nhập đầy đủ thông tin các trường có đánh dấu *")
        }
    }

    deleteShift(shift: ThiShifts) {
        this.selectedShift = shift
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.thiShiftsService.deleteThiShifts(shift.id).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadShiftsPage(this.pageIndex);
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    openAddSinhvien(shift: ThiShifts) {
        this.selectedShift = shift;
        this.notificationService.openSideNavigationMenu({ template: this.templateThemSinhvien, size: window.innerWidth, offsetTop: '0px' })
    }

    getRoomPromise(shift: ThiShifts): Promise<any> {
        return new Promise((resolve, reject) => {
            const condition_room: ConditionOption = {
                condition: [{ conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: shift.id.toString() }],
                set: [
                    { label: 'limit', value: '-1' }
                ],
                page: null
            }

            this.thiShiftRoomssService.getThiShiftRoomssByPageNew(condition_room).subscribe({
                next: (_room) => {
                    if (_room.recordsFiltered && _room.data.filter(m => m.status === 1).length === _room.recordsFiltered) {
                        return resolve(true);
                    } else {
                        return resolve(false);
                    }
                },
                error: () => {
                    resolve(null);
                }
            })
        });

    }



    async changeStatusCathi(shift: ThiShifts, status: number) {
        if (status === 2) {
            const check = await this.getRoomPromise(shift);
            if (!check) {
                return this.notificationService.toastWarning("Còn phòng thi chưa xác nhận hoàn thành coi thi, vui lòng kiểm tra lại");
            }
            this.notificationService.confirm("Thao tác này không thể hoàn tác, thầy/cô có chắc chắn là ca thi <span class='font-weight-600'>" + shift.name + "</span> đã hoàn thành?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then((a) => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.thiShiftsService.updateThiShifts(shift.id, { status: status }).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess("Cập nhật thành công");
                            this.loadShiftsPage(this.pageIndex);
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Cập nhật thất bại");
                        }
                    })
                }
            })
        } else if (status === 1) {
            this.notificationService.confirm("Thầy/Cô có chắc chắn kích hoạt ca thi <span class='font-weight-600'>" + shift.name + "</span> không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then((a) => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.thiShiftsService.updateThiShifts(shift.id, { status: status }).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess("Cập nhật thành công");
                            this.loadShiftsPage(this.pageIndex);
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Cập nhật thất bại");
                        }
                    })
                }
            })

        } else {
            this.notificationService.confirm("Thầy/Cô có chắc chắn tắt kích hoạt ca thi <span class='font-weight-600'>" + shift.name + "</span> không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then((a) => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.thiShiftsService.updateThiShifts(shift.id, { status: status }).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess("Cập nhật thành công");
                            this.loadShiftsPage(this.pageIndex);
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Cập nhật thất bại");
                        }
                    })
                }
            })
        }
    }

    async openPhanQuyenCoithi(shift: ThiShifts, export_word: boolean = false) {
        this.displayTeacher = false;
        this.selectedShift = shift;

        this.notificationService.isProcessing(true);

        const objectRoles = await this.getRolesPromise();

        const ids_roles = [];

        Object.keys(objectRoles).forEach((f) => {
            ids_roles.push(objectRoles[f].id);
        });

        const roleATeacher = this.auth.roles.find((r) => r.name === ROLES.giangvien);

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

        const condition_shift_room: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },

            ],
            page: ''
        }

        const condition_room: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'room' },
                { label: 'groupby', value: 'room' }
            ],
            page: null
        }

        forkJoin([
            this.userService.getUserByPageNew(condition_teacher),
            this.thiShiftRoomssService.getThiShiftRoomssByPageNew(condition_shift_room),
            this.thiShiftStudentsService.getThiShiftStudentsByPageNew(condition_room)
        ]).subscribe({
            next: ([_user, _shift_room_coithi, _shift_room]) => {
                this.list_teacher = _user.data;
                const data: ThiShiftRooms[] = [];
                _shift_room.data.forEach(f => {
                    const index = _shift_room_coithi.data.findIndex(m => m.room === f.room);
                    const room: ThiShiftRooms = {
                        id: index !== -1 ? _shift_room_coithi.data[index].id : 0,
                        shift_id: this.selectedShift.id,
                        room: f.room,
                        canbo_coithi_ids: index !== -1 ? _shift_room_coithi.data[index].canbo_coithi_ids : null,
                        pass_of_room: index !== -1 ? _shift_room_coithi.data[index].pass_of_room : null,
                    }
                    data.push(room);
                })

                this.list_shift_rooms = data;
                if (export_word === true) {
                    this.exportPassRoom(shift, data, this.list_teacher, this.list_course);
                } else {
                    this.notificationService.isProcessing(false);
                    this.notificationService.openSideNavigationMenu({ template: this.templatePhanquyenCoithi, size: 700, offsetTop: '0px' });
                }
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
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

    loadShiftRoom() {
        this.notificationService.isProcessing(true);
        const condition_shift_room: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },

            ],
            page: ''
        }

        const condition_room: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: this.selectedShift.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'room' },
                { label: 'groupby', value: 'room' }
            ],
            page: null
        }

        forkJoin([
            this.thiShiftRoomssService.getThiShiftRoomssByPageNew(condition_shift_room),
            this.thiShiftStudentsService.getThiShiftStudentsByPageNew(condition_room)
        ]).subscribe({
            next: ([_shift_room_coithi, _shift_room]) => {
                const data: ThiShiftRooms[] = [];
                _shift_room.data.forEach(f => {
                    const index = _shift_room_coithi.data.findIndex(m => m.room === f.room);
                    const room: ThiShiftRooms = {
                        id: index !== -1 ? _shift_room_coithi.data[index].id : 0,
                        shift_id: this.selectedShift.id,
                        room: f.room,
                        canbo_coithi_ids: index !== -1 ? _shift_room_coithi.data[index].canbo_coithi_ids : null,
                        pass_of_room: index !== -1 ? _shift_room_coithi.data[index].pass_of_room : null,
                    }

                    data.push(room);
                })

                this.list_shift_rooms = data;

                if (this.selectedRoom) {
                    const index = data.findIndex(m => m.room === this.selectedRoom.room);
                    if (index !== -1) {
                        this.checkorder_cbct = 0;
                        this.selectedRoom = data[index];
                        this.list_teacher.forEach(f => {
                            f['checked'] = false;
                            f['checkedorder'] = -1;
                            if (Array.isArray(this.selectedRoom.canbo_coithi_ids)) {
                                const index = this.selectedRoom.canbo_coithi_ids.findIndex(i => i.toString() === f.id.toString());
                                if (index !== -1) {
                                    f['checked'] = true;
                                    f['checkedorder'] = index;
                                }
                            }
                        })
                        if (Array.isArray(this.selectedRoom.canbo_coithi_ids)) {
                            this.checkorder_cbct = this.selectedRoom.canbo_coithi_ids.length
                        }
                    }
                }
                this.notificationService.isProcessing(false);
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError(
                    'Lỗi kết nối, vui lòng thử lại'
                );
            }
        })
    }

    chooseTeacher(room: ThiShiftRooms) {
        this.notificationService.openSideNavigationMenu({ template: this.templatePhanquyenCoithi, size: 1000, offsetTop: '0px' });
        setTimeout(() => {
            this.displayTeacher = true;
        }, 100)

        this.selectedRoom = room;
        this.checkorder_cbct = 0;
        const orther_room = this.list_shift_rooms.filter(m => m.id !== room.id && m.canbo_coithi_ids && m.canbo_coithi_ids.length);
        let teacher_ids = [];
        orther_room.forEach(f => {
            teacher_ids = teacher_ids.concat(f.canbo_coithi_ids);
        })

        this.list_teacher.forEach(f => {
            f['checked'] = false;
            f['checkedorder'] = -1;
            f['disabled'] = false;
            if (Array.isArray(this.selectedRoom.canbo_coithi_ids)) {
                const index = this.selectedRoom.canbo_coithi_ids.findIndex(i => i.toString() === f.id.toString());
                if (index !== -1) {
                    f['checked'] = true;
                    f['checkedorder'] = index;
                }
            }

            const index_ = teacher_ids.findIndex(m => m.toString() === f.id.toString());
            if (index_ !== -1) {
                f['disabled'] = true;
            }
        })

        if (Array.isArray(this.selectedRoom.canbo_coithi_ids)) {
            this.checkorder_cbct = this.selectedRoom.canbo_coithi_ids.length
        }
    }

    changeSelecGiangvien(event) {
        if (event) {
            const index = this.list_teacher.findIndex(m => m.id === event.options[0].value['id']);
            if (index !== -1) {
                this.checkorder_cbct++;
                this.list_teacher[index]['checked'] = event.options[0].selected;
                this.list_teacher[index]['checkedorder'] = this.checkorder_cbct;
                // this.list_teacher[ index ][ 'checkorder' ]
            }
        }
    }

    closeShowListTeacher() {
        this.displayTeacher = false;
        this.notificationService.openSideNavigationMenu({ template: this.templatePhanquyenCoithi, size: 700, offsetTop: '0px' });
    }

    saveCanboCoithi() {
        const canbocoithi_id = this.helperService.sort(this.list_teacher.filter(m => m['checked']), 'checkedorder').map(m => m.id);
        if (canbocoithi_id && canbocoithi_id.length) {
            const data = {
                shift_id: this.selectedRoom.shift_id,
                room: this.selectedRoom.room,
                canbo_coithi_ids: canbocoithi_id,
                pass_of_room: this.selectedRoom.pass_of_room
            }

            this.notificationService.isProcessing(true);
            if (this.selectedRoom.id) {
                this.thiShiftRoomssService.updateThiShiftRoomss(this.selectedRoom.id, data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Cập nhật thành công")
                        this.loadShiftRoom();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
                    }
                })
            } else {
                data.pass_of_room = this.resetPassword();
                this.thiShiftRoomssService.addThiShiftRoomss(data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Cập nhật thành công")
                        this.loadShiftRoom();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
                    }
                })
            }
        } else {
            this.notificationService.toastWarning("Vui lòng chọn cán bộ coi thi")
        }
    }

    deleteCanboCoiThi(room: ThiShiftRooms) {
        this.selectedRoom = room;
        if (room.id) {
            this.notificationService.confirmDelete().then(a => {
                if (a) {
                    this.notificationService.isProcessing(true);
                    this.thiShiftRoomssService.deleteThiShiftRoomss(room.id).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess("Xoá thành công");
                            delete this.selectedRoom.id;
                            this.loadShiftRoom();
                        },
                        error: () => {
                            this.notificationService.toastError("Xoá thất bại, vui lòng thử lại");
                            this.notificationService.isProcessing(false);
                        }
                    })
                }
            })
        }

    }

    async onChangeCourse(event: ElnKhoaHoc) {
        if (event) {
            this.f['form_id'].setValue(null);
            this.f['time_of_test'].setValue(null);
            this.list_form = await this.getFormDePromise(event.id);
        }
    }

    layde(shift: ThiShifts) {
        this.selectedShift = shift
        this.notificationService.confirm("Thầy/Cô có chắc chắn muốn phân bổ đề cho ca thi <span class='font-weight-600'>" + shift.name + "</span> không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                this.thiShiftStudentsService.layde(shift.id).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Phân bổ đề thành công");
                        this.loadShiftsPage(this.pageIndex);
                    },
                    error: (e) => {
                        this.notificationService.isProcessing(false);
                        if (e.error.message) {
                            this.notificationService.toastError(e.error.message);
                        } else {
                            this.notificationService.toastError("Phân bổ đề thất bại");
                        }
                    }
                })
            }
        })
    }

    closeSideMenuSinhvien() {
        this.notificationService.closeSideNavigationMenu();
        this.loadShiftsPage(this.pageIndex);
    }

    savePasswordOfroom(room: ThiShiftRooms) {
        this.notificationService.isProcessing(true);
        const pass_of_room = this.resetPassword();
        this.thiShiftRoomssService.updateThiShiftRoomss(room.id, { pass_of_room: pass_of_room }).subscribe({
            next: () => {
                this.notificationService.toastSuccess("Cập nhật thành công")
                this.loadShiftRoom();
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
    }

    exportPassRoom(shift: ThiShifts, rooms: ThiShiftRooms[], _users: User[], _list_course: ElnKhoaHoc[]) {
        const data = rooms.filter(m => m.canbo_coithi_ids && m.canbo_coithi_ids.length !== 0)
        if (data.length) {
            this.notificationService.isProcessing(true)
            this.userService.getUserByItem(shift['created_by'].toString(), 'id').subscribe({
                next: (_created) => {
                    shift['created_by_name'] = _created[0] ? _created[0].display_name : null;
                    shift['created_by_phone'] = _created[0] ? _created[0].phone : null;
                    const documentCreator = new ExportPassOfRoomService();
                    const doc = documentCreator.create(rooms, shift, _users, _list_course);
                    Packer.toBlob(doc).then(blob => {
                        saveAs(blob, shift.name.concat(".docx"));
                        this.notificationService.isProcessing(false)
                        this.notificationService.toastSuccess("Tải thành công");
                    });
                },
                error: () => {
                    this.notificationService.isProcessing(true);
                    this.notificationService.toastSuccess("Tải thất bại");
                }
            })

        } else {
            this.notificationService.isProcessing(false)
            this.notificationService.toastWarning("Vui lòng phân quyền coi thi trước khi tải xuống");
        }
    }

    changeValueForm(event: ThiForm) {
        if (event) {
            this.f['time_of_test'].setValue(event.time_of_test);
        }
    }
}
