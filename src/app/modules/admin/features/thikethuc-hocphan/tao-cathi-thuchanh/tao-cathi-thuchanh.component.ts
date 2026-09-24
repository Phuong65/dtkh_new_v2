import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { ThiQuestionBankThService } from './../../../../shared/services/thi-question-bank-th.service';
import { CoursePlanActivitiesService } from '@shared/services/course-plan-activities.service';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
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
import { firstValueFrom, forkJoin, map, merge, mergeMap, Observable, of, timeout } from 'rxjs';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
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
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { APP_CONFIGS, getLinkDownload_aws, key_server } from '@env';
import { asBlob } from 'html-docx-js-typescript';
import { FileService } from '@core/services/file.service';
import { ROLES } from '@modules/shared/utils/syscat';
import { Router } from '@angular/router';
import * as htmlDocx from '@modules/shared/vendor/html-docx';
import { WordMathService } from '@modules/shared/services/word-math.service';

@Component({
    selector: 'app-tao-cathi-thuchanh',
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
        DialogModule,
        MatProgressBarModule,
    ],
    templateUrl: './tao-cathi-thuchanh.component.html',
    styleUrls: ['./tao-cathi-thuchanh.component.css']
})
export class TaoCathiThuchanhComponent implements OnInit {
    @ViewChild('paginator_shift') paginator_shift: Paginator;

    @ViewChild('createShift') createShift: TemplateRef<any>;

    @ViewChild('templateThemSinhvien') templateThemSinhvien: TemplateRef<any>;

    @ViewChild('templatePhanquyenCoithi') templatePhanquyenCoithi: TemplateRef<any>;

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
        { id: 'TRACNGHIEM', label: 'Trắc nghiệm', disabled: true },
        { id: 'TULUAN', label: 'Tự luận', }
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

    list_tuluan: CoursePlanActivityTuluan[];

    display_layde: boolean = false;

    displayModal: boolean = false;

    progressValue: number = 0;

    waitting_title: string = 'Đang tải dữ liệu, vui lòng không tắt trình duyệt';

    /** */

    newTestThuchanh = APP_CONFIGS.newTestThuchanh;
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
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private fileService: FileService,
        private router: Router,
        private thiQuestionBankThService: ThiQuestionBankThService,
        private coursePlanActivityTuluanTieuchichamService: CoursePlanActivityTuluanTieuchichamService,
        private mathService: WordMathService
    ) {
        this.formShift = this.formBuilder.group(
            {
                name: ['', Validators.required],
                desc: [''],
                course_id: ['', Validators.required],
                time_start: ['', Validators.required],
                // time_of_test: [ '', Validators.required ],
                // pass_of_test: [ '', Validators.required ],
                type_of_test: ['', Validators.required],
                namhoc: ['', Validators.required],
                hocky: ['', Validators.required],
                status: ['', Validators.required],
                num_of_test: ['', Validators.required],
                dotthi: ['', Validators.required],
                // form_id: [ '' ]
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
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,av,maso,title,id,category_ids,params' },
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
                { conditionName: 'type_of_test', condition: OvicQueryCondition.equal, value: 'TULUAN', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: this.limit_shifts.toString() },
                { label: 'order', value: 'DESC' },
                { label: 'orderby', value: 'id' },
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
        this.f['type_of_test'].setValue('TULUAN');
        this.f['status'].setValue(1);
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

    async openEditShifts(shift: ThiShifts) {
        this.selectedShift = shift;
        this.formTitle = 'Sửa ca thi';
        this.formReset();
        // this.list_form = await this.getFormDePromise( shift.course_id );
        this.formShift.setValue({
            name: shift.name,
            desc: shift.desc,
            course_id: shift.course_id,
            time_start: new Date(shift.time_start),
            // time_of_test: shift.time_of_test,
            // pass_of_test: shift.pass_of_test,
            num_of_test: shift.num_of_test,
            type_of_test: shift.type_of_test,
            namhoc: shift.namhoc,
            hocky: shift.hocky,
            status: shift.status,
            dotthi: shift.dotthi,
            // form_id: shift.form_id
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

    changeStatusCathi(shift: ThiShifts, status: number) {
        if (status === 2) {
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

    async onChangeCourse(event: ElnKhoaHoc) {
        // if ( event ) {
        //     this.f[ 'form_id' ].setValue( null );
        //     this.f[ 'time_of_test' ].setValue( null );
        //     this.list_form = await this.getFormDePromise( event.id );
        // }
    }

    startGetTestTuluan(thiShift: ThiShifts) {
        this.selectedShift = thiShift;
        this.list_tuluan = null;
        const condition_tuluan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: thiShift.course_id.toString(), orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'GROUP_QUESTION', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'id' },
            ],
            page: null
        }

        this.notificationService.isProcessing(true)

        this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan).pipe(mergeMap(a => {
            let id_tuluans = [];
            a.data.forEach(f => {
                if (f.tuluan_root_ids) {
                    const ids = f.tuluan_root_ids.split("|").filter(m => m && m !== '');
                    id_tuluans = id_tuluans.concat(ids);
                } else {
                    id_tuluans.push(f.id);
                }
            })

            if (id_tuluans.length) {
                const condition_tieuchi: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: id_tuluans.toString() },
                        { label: 'include_by', value: 'course_plan_activity_tuluan_id' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                return this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchi).pipe(mergeMap(_tieuchi => {
                    a.data.forEach(f => {
                        if (f.tuluan_root_ids) {
                            const ids = f.tuluan_root_ids.split("|").filter(m => m && m !== '');
                            id_tuluans = id_tuluans.concat(ids);
                            f['question_ids'] = ids.map(m => Number(m));
                            f['tieuchi'] = _tieuchi.data.filter(m => f['question_ids'].includes(m.course_plan_activity_tuluan_id));
                        } else {
                            id_tuluans.push(f.id);
                            f['tieuchi'] = _tieuchi.data.filter(m => m.course_plan_activity_tuluan_id === f.id);
                        }
                    })
                    return of(a);
                }))
            } else {
                return of(a);
            }
        })).subscribe({
            next: (_tuluan) => {
                if (_tuluan.recordsFiltered) {
                    this.list_tuluan = _tuluan.data;
                    this.display_layde = true;
                } else {
                    this.notificationService.toastWarning('Không tìm thấy đề, vui lòng kiểm tra lại phần tạo câu hỏi thực hành của môn học')
                }
                this.notificationService.isProcessing(false);
            },
            error: () => {

            }
        })
    }

    saveTestTuluan(isDownload: boolean = false) {
        this.notificationService.confirm('Thầy/Cô có chắc chắn thực hiện thao tác sinh đề ngẫu nhiên', 'Xác nhận thông báo', [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                let i = 0;
                let count_tuluan = this.list_tuluan.length;
                const test_get: CoursePlanActivityTuluan[] = [];
                while (i < this.selectedShift.num_of_test && count_tuluan > 0) {
                    const data_random = this.list_tuluan.filter(m => !m['get']);
                    let random = data_random[Math.floor(Math.random() * data_random.length)];
                    if (random) {
                        random['get'] = true;
                        test_get.push(random);
                        count_tuluan--;
                        i++
                    }
                }
                const tuluan_ids = test_get.map(m => m.id);
                this.notificationService.isProcessing(true)
                this.thiShiftsService.updateThiShifts(this.selectedShift.id, { tuluan_ids: tuluan_ids }).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false)
                        this.notificationService.toastSuccess("Lưu thành công");
                        this.loadShiftsPage(this.pageIndex);
                        if (isDownload) {
                            this.display_layde = false;
                            this.displayModal = true;
                            this.progressValue = 0;
                            this.downloadTestTuluan(test_get);
                        } else {
                            this.display_layde = false;
                        }
                    },
                    error: () => {
                        this.notificationService.isProcessing(false)
                        this.notificationService.toastSuccess("Lưu thất bại")
                    }
                })
            }
        })
    }

    getTuluanTest(thiShift: ThiShifts, note: boolean = false) {
        this.selectedShift = thiShift;
        const condition_tuluan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: thiShift.course_id.toString(), orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'GROUP_QUESTION', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: thiShift.tuluan_ids.toString() },
                { label: 'include_by', value: 'id' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'id' },
            ],
            page: null
        }

        this.displayModal = true;

        this.progressValue = 0;

        this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan).pipe(mergeMap(a => {
            let id_tuluans = [];
            a.data.forEach(f => {
                if (f.tuluan_root_ids) {
                    const ids = f.tuluan_root_ids.split("|").filter(m => m && m !== '');
                    id_tuluans = id_tuluans.concat(ids);
                } else {
                    id_tuluans.push(f.id);
                }
            })

            if (id_tuluans.length && note) {
                const condition_tieuchi: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: id_tuluans.toString() },
                        { label: 'include_by', value: 'course_plan_activity_tuluan_id' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                return this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchi).pipe(mergeMap(_tieuchi => {
                    a.data.forEach(f => {
                        if (f.tuluan_root_ids) {
                            const ids = f.tuluan_root_ids.split("|").filter(m => m && m !== '');
                            id_tuluans = id_tuluans.concat(ids);
                            f['question_ids'] = ids.map(m => Number(m));
                            f['tieuchi'] = _tieuchi.data.filter(m => f['question_ids'].includes(m.course_plan_activity_tuluan_id));
                        } else {
                            id_tuluans.push(f.id);
                            f['tieuchi'] = _tieuchi.data.filter(m => m.course_plan_activity_tuluan_id === f.id);
                        }
                    })
                    return of(a);
                }))
            } else {
                return of(a);
            }
        })).subscribe({
            next: (_tuluan) => {
                if (_tuluan.recordsFiltered) {
                    this.downloadTestTuluan(_tuluan.data, note);
                } else {
                    this.notificationService.toastWarning('Không tìm thấy đề, vui lòng kiểm tra lại phần tạo câu hỏi thực hành của môn học')
                }

            },
            error: () => {
                this.displayModal = false;
            }
        })

    }

    downloadTestTuluan(tuluan_: CoursePlanActivityTuluan[], note: boolean = false) {
        this.fileService.getFileLocalAsBlob('..\\assets\\css\\download.css').subscribe(_styleCss => {

            let contentExport = '';

            const title = note ? 'PHƯƠNG ÁN CHẤM ĐIỂM' : 'ĐỀ THI HẾT HỌC PHẦN';

            const index_monhoc = this.list_course.findIndex(m => m.id === this.selectedShift.course_id);

            let hinhthucthi = '';

            if (index_monhoc !== -1) {
                const course_params = this.list_course[index_monhoc].params;

                if (course_params && !course_params.exam_type) {
                    const index = EXAMFORMAT.findIndex((m) => m.key === course_params.exam_format);
                    if (index !== -1) {
                        hinhthucthi = EXAMFORMAT[index].label;
                    }
                } else {
                    const index = EXAMFORMAT.findIndex((m) => m.id === course_params.exam_type);
                    if (index !== -1) {
                        hinhthucthi = EXAMFORMAT[index].label;
                    }
                }
            }



            this.helperService.sort(tuluan_, 'id').forEach((f, key) => {

                let midtext = '<p style="text-align:center;font-size:13pt;text-indent:0pt;font-family:Times New Roman"><strong>Họ và tên sinh viên:</strong> …………………………………….<strong>Số báo danh:</strong>…………………</p><p class="MsoNormal" style="text-align:center;font-size:13pt"><br data-cke-filler="true"></p><p class="MsoNormal" style="text-align:center;font-size:13pt"><br data-cke-filler="true"></p>';

                if (note) {
                    midtext = '';
                }

                const header = '<table class="MsoTableGrid fontMso" border="0" cellspacing="0" cellpadding="0" style="border:0pt"><tbody><tr style="border:0pt"><td class="ck-editor__editable ck-editor__nested-editable" style="height:120.5pt;padding:0cm 5.4pt;vertical-align:top;width:220pt;border:0pt;font-size:13pt;font-family:`Times New Roman`" role="textbox" contenteditable="true" width="312"><p class="MsoNormal" style="text-align:center;font-size:13pt;font-family:`Times New Roman`">' + APP_CONFIGS.donviquanly.toLocaleUpperCase() + '<br><strong>' + APP_CONFIGS.donvitructhuoc.toLocaleUpperCase() + '</strong></p><p class="MsoNormal" style="text-align:center;font-size:13pt;font-family:`Times New Roman`"><br data-cke-filler="true"></p><p class="MsoNormal" style="font-size:13pt;text-align:left;font-family:`Times New Roman`"><strong>Mã đề: </strong>' + this.selectedShift.id + '.' + f.id + '</p><div class="ck-table-column-resizer"></div></td><td class="ck-editor__editable ck-editor__nested-editable" style="height:120.5pt;padding:0cm 5.4pt;vertical-align:top;width:233.75pt; border:0pt;font-size:13pt;font-family:`Times New Roman`" role="textbox" contenteditable="true" width="312"></p><p class="MsoNormal" style="text-align:center;font-size:13pt;font-family:`Times New Roman`"><strong>' + title + '</strong></p><p class="MsoNormal" style="text-align:center;font-size:13pt"><br data-cke-filler="true"></p><p class="MsoNormal" style="font-size:13pt;font-family:`Times New Roman`"><strong>Học phần:&nbsp;</strong>' + this.list_course[index_monhoc].title + ' - ' + this.list_course[index_monhoc].maso + '</p><p class="MsoNormal" style="font-size:13pt;font-family:`Times New Roman`"><strong>Hình thức:&nbsp;</strong>' + hinhthucthi + '</p><p class="MsoNormal" style="text-align:center;font-size:13pt;font-family:`Times New Roman`">Thời gian chuẩn bị: ' + f.time_duration + ' phút<br><i>(Không kể thời gian giao đề)</i></p><div class="ck-table-column-resizer"></div></td></tr></tbody></table><p class="MsoNormal" style="text-align:center;font-size:13pt"><br data-cke-filler="true"></p>' + midtext;

                const footer = '<p class="MsoNormal" style="text-align:center;"><br data-cke-filler="true"></p><p class="MsoNormal" style="text-align:center;">===== HẾT =====</p>';

                f['note'] = f.note ? f.note : '<p style="text-align:center;color:red">Không có nội dung phương án chấm</p>';

                let tieuchicham = '';

                if (note) {
                    if (f['question_ids'] && f['question_ids'].length) {
                        if (f.tieuchi && f.tieuchi.length) {
                            f['question_ids'].forEach((q, qkey) => {
                                const q_tieuchi = f.tieuchi.filter(m => m.course_plan_activity_tuluan_id === q);
                                tieuchicham = tieuchicham.concat('<p style="margin-top: 50pt;"><strong>Câu ', (qkey + 1).toString(), ': (' + this.returnTotalPointTieuChi(q_tieuchi).toString() + ' Điểm)</strong></p>');
                                if (q_tieuchi && q_tieuchi.length) {
                                    this.helperService.sort(q_tieuchi, 'ordering').forEach((t, tkey) => {
                                        tieuchicham = tieuchicham.concat('<p><strong>', (tkey + 1).toString(), '. ', t.title, ' (' + t.point.toString() + ' Điểm)</strong></p>');
                                        if (t.desc) {
                                            tieuchicham = tieuchicham.concat(t.desc)
                                        }
                                    })
                                }
                            })
                        }
                    } else {
                        if (f.tieuchi && f.tieuchi.length) {
                            this.helperService.sort(f.tieuchi, 'ordering').forEach((t, tkey) => {
                                tieuchicham = tieuchicham.concat('<p><strong>', (tkey + 1).toString(), '. ', t.title, ' (' + t.point.toString() + ' Điểm)</strong></p>');
                                if (t.desc) {
                                    tieuchicham = tieuchicham.concat(t.desc)
                                }
                            })
                        }
                    }
                }

                if (key !== 0) {
                    contentExport = contentExport.concat('<p><br class="page-break" style="page-break-after: always;"></br></p>', header, note ? tieuchicham : f.desc, footer,);
                } else {
                    contentExport = contentExport.concat(header, note ? tieuchicham : f.desc, footer);
                }
            })

            this.getLoadImage(contentExport, _styleCss, note)
        })
    }

    returnTotalPointTieuChi(list_tieuchi) {
        if (list_tieuchi.length) {
            return list_tieuchi.filter(m => m.point).map(m => Number(parseFloat(m.point.toString()).toFixed(2))).reduce((sum, num) => sum + num, 0);
        }
        return 0;
    }

    async getLoadImage(detuluan: string, stylecss: any, note: boolean = false) {

        const downloadImage = [];

        const tmpBaocao = detuluan.replace(/<img\s[^src]*?>/gi, _res => {
            return '';
        })
        // detuluan.replace(/class\=\"MsoNormal\"|<img\s[^src]*?>/gi, _res => {
        //     return '';
        // }).replace(/\s*MsoNormal\s*/gi, '');


        const data = tmpBaocao.replace(/src="(.*?)"/gi, rep => {
            const id = rep.replace(/src="|"/g, '');
            if (!isNaN(parseFloat(id))) {
                downloadImage.push({
                    id: id,
                    blob: null,
                });
            }
            return rep;
        });

        const request_image: Observable<any>[][] = [];

        let i = 0;

        request_image[i] = [];

        downloadImage.forEach((f, key) => {
            if (request_image[i].length < 4) {
                request_image[i].push(this.fileService.awsGetFileAsBlob(f.id).pipe(mergeMap(_res => {
                    f.blob = _res;
                    return of(null);
                })))
            } else {
                i = i + 1;
                request_image[i] = [];
                request_image[i].push(this.fileService.awsGetFileAsBlob(f.id).pipe(mergeMap(_res => {
                    f.blob = _res;
                    return of(null);
                })))
            }

        });

        if (request_image && request_image.length && request_image[0].length) {
            this.loopGetImage(0, request_image).subscribe(() => {
                this.convertToTypeImage(downloadImage.filter(m => m.blob), data, stylecss, note);
            })
        } else {

            this.htmltoDocx(data, stylecss, note);
        }
    }

    loopGetImage(key, request_: Observable<any>[][]): Observable<any> {
        this.progressValue = (key + 1) / request_.length * 100;
        return forkJoin(request_[key]).pipe(
            mergeMap(_res => {
                if (request_[key + 1] && request_[key + 1].length) {
                    return this.loopGetImage(key + 1, request_);
                } else {
                    return of(null)
                }
            }))
    }

    convertToTypeImage(downloadImage, data, stylecss, note: boolean = false) {
        let i = 0;
        const currentThis = this;
        downloadImage.forEach((f, key) => {
            const reader = new FileReader();
            reader.readAsDataURL(f.blob);
            reader.onloadend = function () {
                f['base64'] = reader.result.toString().replace('data:application/octet-stream', 'data:image/png');
                let img = document.createElement('img');
                let blob = URL.createObjectURL(f.blob);
                img.src = blob;
                img.onload = function () {
                    let w = img.width;
                    let h = img.height;
                    f['width'] = w;
                    f['height'] = h;
                    i = i + 1;
                    if (i === downloadImage.length) {
                        // data.replace( /<figure(.*?)image(.*?)<\/figure>/gi, _res => {

                        //     return _res
                        // })

                        const exportData = data.replace(/src="(.*?)"/gi, rep => {
                            const id = rep.replace(/src="|"/g, '');
                            if (!isNaN(parseFloat(id))) {
                                const index = downloadImage.findIndex(m => m.id.toString() === id.toString());
                                if (index !== -1) {
                                    const width = downloadImage[index]['width'];
                                    const height = downloadImage[index]['height'];
                                    let setWidth = 620;
                                    const wph = width / height;
                                    let setHeight = setWidth / wph;
                                    if (width < setWidth) {
                                        setWidth = width;
                                        setHeight = height;
                                    } else {
                                        setHeight = setWidth / wph;
                                    }
                                    return 'src="' + downloadImage[index]['base64'] + '" width="' + setWidth + '" height="' + setHeight + '"'
                                }
                                return rep;
                            }
                            return rep;
                        });
                        currentThis.htmltoDocx(exportData, stylecss, note);
                    }
                }
                img.onerror = function () {
                    let w = img.width;
                    let h = img.height;
                    f['width'] = w;
                    f['height'] = h;
                    i = i + 1;
                    if (i === downloadImage.length) {
                        const exportData = data.replace(/src="(.*?)"/gi, rep => {
                            const id = rep.replace(/src="|"/g, '');
                            if (!isNaN(parseFloat(id))) {
                                const index = downloadImage.findIndex(m => m.id.toString() === id.toString());
                                if (index !== -1) {
                                    const width = downloadImage[index]['width'];
                                    const height = downloadImage[index]['height'];
                                    let setWidth = 620;
                                    const wph = width / height;
                                    let setHeight = setWidth / wph;
                                    if (width < setWidth) {
                                        setWidth = width;
                                        setHeight = height;
                                    } else {
                                        setHeight = setWidth / wph;
                                    }
                                    return 'src="' + downloadImage[index]['base64'] + '" width="' + setWidth + '" height="' + setHeight + '"'
                                }
                                return rep;
                            }
                            return rep;
                        });
                        currentThis.htmltoDocx(exportData, stylecss, note);
                    }
                }

            }
        })
    }

    // TypeScript / JS (chạy tốt trong browser và Node (cần jsdom trên Node))
    cleanWordHtmlUsingDOM(html: string): string {
        return html
            // Xóa các comment điều kiện của Word (<!--[if ...]> ... <![endif]-->)
            .replace(/<!--\[if[\s\S]*?endif\]-->/gi, '')
            // Xóa các class Mso*
            .replace(/\bclass\s*=\s*"[^"]*\bMso[a-zA-Z0-9_-]*[^"]*"/gi, '')
            // Xóa các thuộc tính style bắt đầu bằng mso-
            .replace(/\s*mso-[^:;]+:[^;"]*;?/gi, '')
            // Xóa letter-spacing, word-spacing, text-justify, line-height
            .replace(/\s*(letter-spacing|word-spacing|text-justify|line-height):[^;"]*;?/gi, '')
            // Nếu không muốn justify: bỏ text-align:justify
            // .replace(/\s*text-align:\s*justify;?/gi, '')
            // Xóa span rỗng
            .replace(/<span[^>]*>\s*<\/span>/gi, '')
            // Chuẩn hóa lại khoảng trắng
            .replace(/\s{2,}/g, ' ')
            .trim();
    }


    async htmltoDocx(htmlString, res, note: boolean = false) {

        const currentThis = this;

        console.log(htmlString);

        const clean_word = this.clearJsWord(htmlString);

        const output_svg_latex = this.mathService.convertHtmlString(clean_word);


        const html_1 = output_svg_latex.replace(/style\=\"(.*?)\"/gi, _res => {
            const fontS = _res.replace(/font\-size\:\d+pt/gi, _font_size => {
                if (!_font_size.length) {
                    return _font_size;
                } else {
                    return _font_size.concat(";font-family:'Times New Roman'")
                }
            })

            if (fontS.length !== _res.length) {
                return fontS;
            } else {
                return _res.replace(/style="/, _res_1 => {
                    return _res_1.concat("font-size:14pt; font-family:'Times New Roman';")
                })
            }

        })



        const html_2 = html_1.replace(/<(p|span)(.*?)>/gi, _res => {
            if (_res.indexOf("style=") !== -1) {
                if (_res.indexOf("font-size") !== -1) {
                    return _res;
                } else {
                    return _res.replace(/style="/, _res_1 => {
                        return _res_1.concat("font-size:14pt; font-family:'Times New Roman';")
                    })
                }
            }
            const newEle = _res.replace(/<(p|span)/gi, _res_1 => {
                return _res_1.concat(` style="font-size:14pt; font-family:'Times New Roman'"`);
            })
            return newEle;
        })

        const html_3 = html_2.replace(/<li(.*?)>(.*?)<\/li>/gi, _res => {
            return _res.replace(/<li(.*?)>/gi, _res_1 => { return _res_1.concat(`<p style="font-size:14pt; font-family:'Times New Roman'">`) }).replace(/<\/li>/gi, _res_2 => { return '</p>'.concat(_res_2) })
        })

        const html_4 = html_3//this.clearJsWord(html_3) //html_3.replace(/<\!--\[if\s\!supportLists\]-->(.*?)<\!--\[endif\]-->/gi, '').replace(/<\!--\[(.*?)]-->|<\!\[(.*?)\]-->/gi, '');

        // console.log(html_4);

        let reader = new FileReader();

        reader.readAsText(res);

        reader.onloadend = async function () {

            let text = reader.result;

            let stringcss = '';

            const t = text.toString().replace(/\.ck\-content(.*?)\}/gims, _res => {
                stringcss = stringcss.concat(_res);
                return _res;
            });

            const newstringcss = stringcss.replace(/\{/gi, '{\n').replace(/\}/gi, '\n}\n').replace(/\;/gi, ';\n');

            // const header =
            //     '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
            //     'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
            //     'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ' +
            //     'xmlns="http://www.w3.org/TR/REC-html40">' +
            //     '<head>' +
            //     '<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>' +
            //     '<meta name="ProgId" content="Word.Document">' +
            //     '<meta name="Generator" content="Microsoft Word 15">' +
            //     '<meta name="Originator" content="Microsoft Word 15">' +
            //     '<xml><w:WordDocument>' +
            //     '<w:View>Print</w:View>' +
            //     '<w:Zoom>100</w:Zoom>' +
            //     '<w:DoNotOptimizeForBrowser/>' +
            //     '</w:WordDocument></xml>' +
            //     `<style>${text}</style>` +
            //     '</head><body>';
            // const footer = "</body></html>";

            // const title = note ? 'Phương án chấm KTHP' : 'Đề thi KTHP';

            // htmlDocx.asBlob(header.concat('<div class="WordSection1">', html_4, '</div>', footer), { orientation: 'portrait', margins: { top: 1152, bottom: 1152, left: 1440, right: 1152 } }).then((data: Blob) => {
            //     currentThis.displayModal = false;
            //     saveAs(data, title + ' ' + currentThis.selectedShift.name.replace(/\/|\./gi, '').concat('.docx')) // save as docx file
            // })

            const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office"
                  xmlns:w="urn:schemas-microsoft-com:office:word"
                  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
                  xmlns="http://www.w3.org/TR/REC-html40">
            <head>
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=11" />
            <meta name="Word.DocumentType" content="Document" />
            <meta http-equiv="Content-Type" content="application/msword; charset=utf-8">
            <style>${text}</style>
            </head>
            <body>${html_4}</body></html>`;

            const title = note ? 'Phương án chấm KTHP' : 'Đề thi KTHP';

            // const blob = new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            // const url = URL.createObjectURL(blob);
            // console.log(url);
            htmlDocx.asBlob(html, {
                orientation: 'portrait',
                margins: { top: 1152, bottom: 1152, left: 1440, right: 1152 }
            }).then((data: Blob) => {
                currentThis.displayModal = false;
                saveAs(data, `${title} ${currentThis.selectedShift.name.replace(/\/|\./gi, '')}.docx`
                );
            });
        }
    }

    startGetTestTuluanV2(shift: ThiShifts) {
        this.selectedShift = shift;
        this.notificationService.isProcessing(true);
        this.thiQuestionBankThService.deleteThiQuestionBankThByCol(shift.id.toString(), "shift_id").pipe(mergeMap(a => {
            return this.thiShiftsService.sinhdethuchanh(shift.id, shift.course_id, shift.num_of_test);
        })).subscribe({
            next: () => {
                this.notificationService.toastSuccess("Sinh đề thành công");
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    downloadTestV2(shift: ThiShifts, note: boolean = false) {
        this.notificationService.isProcessing(true);

        this.selectedShift = shift;

        const condition_bank_th: ConditionOption = {
            condition: [
                { conditionName: 'shift_id', condition: OvicQueryCondition.equal, value: shift.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: shift.course_id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        forkJoin([
            this.fileService.getFileLocalAsBlob('..\\assets\\css\\download.css'),
            this.thiQuestionBankThService.getThiQuestionBankThByPageNew(condition_bank_th)
        ]).subscribe({
            next: ([_styleCss, _bank]) => {
                let ids_cauhoi = [];

                _bank.data.forEach(f => {
                    ids_cauhoi = ids_cauhoi.concat(f.questions);
                })

                ids_cauhoi = [... new Set(ids_cauhoi)];

                let te = [];
                let i = 0;
                te[i] = [];

                const request: Observable<any>[] = [];

                ids_cauhoi.forEach(f => {
                    if (te[i].length < 2) {
                        te[i].push(f);
                    } else {
                        i++
                        te[i] = [];
                        te[i].push(f);
                    }
                })

                te.forEach(f => {
                    const condition_cauhoi: ConditionOption = {
                        condition: [],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: f.toString() },
                            { label: 'include_by', value: 'id' }
                        ],
                        page: null
                    }

                    if (note) {
                        condition_cauhoi.set.push({ label: 'with', value: 'tieuchi' });
                    }

                    request.push(this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_cauhoi));
                })


                if (request.length) {
                    this.notificationService.isProcessing(false);
                    this.displayModal = true;
                    this.progressValue = 0;
                    const result_data: CoursePlanActivityTuluan[] = [];
                    this.loopGetCauhoi(request, 0, result_data).subscribe({
                        next: (_cauhoi) => {

                            let contentExport = '';

                            const title = note ? 'PHƯƠNG ÁN CHẤM ĐIỂM' : 'ĐỀ THI HẾT HỌC PHẦN';

                            const index_monhoc = this.list_course.findIndex(m => m.id === this.selectedShift.course_id);

                            let hinhthucthi = '';

                            let time_duration = 60;

                            if (index_monhoc !== -1) {
                                const course_params = this.list_course[index_monhoc].params;

                                if (course_params && !course_params.exam_type) {
                                    const index = EXAMFORMAT.findIndex((m) => m.key === course_params.exam_format);
                                    if (index !== -1) {
                                        hinhthucthi = EXAMFORMAT[index].label;
                                    }
                                } else {
                                    const index = EXAMFORMAT.findIndex((m) => m.id === course_params.exam_type);
                                    if (index !== -1) {
                                        hinhthucthi = EXAMFORMAT[index].label;
                                    }
                                }

                                if (course_params) {
                                    if (course_params.sotinchi <= 2) {
                                        time_duration = 60;
                                    } else {
                                        time_duration = 90;
                                    }
                                }
                            }

                            _bank.data.forEach((f, key) => {
                                let midtext = '<p style="text-align:center;font-size:13pt;text-indent:0pt;font-family:Times New Roman"><strong>Họ và tên sinh viên:</strong> …………………………………….<strong>Số báo danh:</strong>…………………</p><p class="MsoNormal" style="text-align:center;font-size:13pt"><br data-cke-filler="true"></p><p class="MsoNormal" style="text-align:center;font-size:13pt"><br data-cke-filler="true"></p>';

                                if (note) {
                                    midtext = '';
                                }

                                const header = '<table class="MsoTableGrid fontMso" border="0" cellspacing="0" cellpadding="0" style="border:0pt"><tbody><tr style="border:0pt"><td class="ck-editor__editable ck-editor__nested-editable" style="height:120.5pt;padding:0cm 5.4pt;vertical-align:top;width:220pt;border:0pt;font-size:13pt;font-family:`Times New Roman`" role="textbox" contenteditable="true" width="312"><p class="MsoNormal" style="text-align:center;font-size:13pt;font-family:`Times New Roman`">' + APP_CONFIGS.donviquanly.toLocaleUpperCase() + '<br><strong>' + APP_CONFIGS.donvitructhuoc.toLocaleUpperCase() + '</strong></p><p class="MsoNormal" style="text-align:center;font-size:13pt;font-family:`Times New Roman`"><br data-cke-filler="true"></p><p class="MsoNormal" style="font-size:13pt;text-align:left;font-family:`Times New Roman`"><strong>Mã đề: </strong>' + this.selectedShift.id + '.' + f.id + '</p><div class="ck-table-column-resizer"></div></td><td class="ck-editor__editable ck-editor__nested-editable" style="height:120.5pt;padding:0cm 5.4pt;vertical-align:top;width:233.75pt; border:0pt;font-size:13pt;font-family:`Times New Roman`" role="textbox" contenteditable="true" width="312"></p><p class="MsoNormal" style="text-align:center;font-size:13pt;font-family:`Times New Roman`"><strong>' + title + '</strong></p><p class="MsoNormal" style="text-align:center;font-size:13pt"><br data-cke-filler="true"></p><p class="MsoNormal" style="font-size:13pt;font-family:`Times New Roman`"><strong>Học phần:&nbsp;</strong>' + this.list_course[index_monhoc].title + ' - ' + this.list_course[index_monhoc].maso + '</p><p class="MsoNormal" style="font-size:13pt;font-family:`Times New Roman`"><strong>Hình thức:&nbsp;</strong>' + hinhthucthi + '</p><p class="MsoNormal" style="text-align:center;font-size:13pt;font-family:`Times New Roman`">Thời gian chuẩn bị: ' + time_duration.toString() + ' phút<br><i>(Không kể thời gian giao đề)</i></p><div class="ck-table-column-resizer"></div></td></tr></tbody></table><p class="MsoNormal" style="text-align:center;font-size:13pt"><br data-cke-filler="true"></p>' + midtext;
                                const footer = '<p class="MsoNormal" style="text-align:center;"><br data-cke-filler="true"></p><p class="MsoNormal" style="text-align:center;">===== HẾT =====</p>';

                                let content_test = '';

                                const cauhoi_test = _cauhoi.filter(m => f.questions.includes(m.id));

                                this.helperService.sort(cauhoi_test, 'ordering').forEach((c, ckey) => {
                                    if (!note) {
                                        content_test = content_test.concat('<p style="margin-top: 50pt;"><strong>Câu ', (ckey + 1).toString(), ': (' + c.point.toString() + ' Điểm)</strong></p>', c.desc)
                                    } else {
                                        content_test = content_test.concat('<p style="margin-top: 50pt;"><strong>Câu ', (ckey + 1).toString(), ': (' + c.point.toString() + ' Điểm)</strong></p>');
                                        if (c.tieuchi && c.tieuchi.length) {
                                            this.helperService.sort(c.tieuchi, 'ordering').forEach((t, tkey) => {
                                                content_test = content_test.concat('<p><strong>', (tkey + 1).toString(), '. ', t.title, ' (' + t.point.toString() + ' Điểm)</strong></p>');
                                                if (t.desc) {
                                                    content_test = content_test.concat(t.desc)
                                                }
                                            })
                                        }
                                    }
                                })

                                if (key !== 0) {
                                    contentExport = contentExport.concat('<p><br class="page-break" style="page-break-after: always;"></br></p>', header, content_test, footer,);
                                } else {
                                    contentExport = contentExport.concat(header, content_test, footer);
                                }
                            })

                            this.getLoadImage(contentExport, _styleCss, note)
                        },
                        error: () => {
                            this.displayModal = false;
                        }
                    })
                } else {
                    this.notificationService.isProcessing(false);
                }
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    loopGetCauhoi(request: Observable<any>[], key: number, data): Observable<any> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            data = data.concat(a.data);
            if (request[key + 1]) {
                return this.loopGetCauhoi(request, key + 1, data);
            } else {
                return of(data);
            }
        }))
    }

    clearJsWord(html) {
        if (!html) return '';

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 1. Xóa toàn bộ comment (bao gồm if mso, fragment)
        const walker = document.createTreeWalker(doc, NodeFilter.SHOW_COMMENT);
        let node;
        const comments = [];
        while (node = walker.nextNode()) comments.push(node);
        comments.forEach(c => c.remove());

        // 2. Xóa tag rác Word
        doc.querySelectorAll('o\\:p').forEach(el => el.remove());

        // 3. Xóa XML namespace (nếu có dạng node)
        doc.querySelectorAll('*').forEach(el => {
            // remove namespace kiểu w:, v: nhưng KHÔNG đụng tag thường
            if (el.tagName.includes(':')) {
                el.replaceWith(...Array.from(el.childNodes));
            }
        });

        // 4. (OPTIONAL) dọn nhẹ style mso nhưng KHÔNG xóa style khác
        doc.querySelectorAll('[style]').forEach(el => {
            let style = el.getAttribute('style');

            // chỉ remove mso-* (an toàn)
            style = style.replace(/mso-[^:]+:[^;]+;?/gi, '');

            el.setAttribute('style', style.trim());
        });

        return doc.body.innerHTML.trim();
    }

}
