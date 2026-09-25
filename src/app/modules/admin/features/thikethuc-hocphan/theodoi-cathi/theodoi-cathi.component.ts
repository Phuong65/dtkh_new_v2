
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { RoleService } from '@core/services/role.service';
import { UserService } from '@core/services/user.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { ThiShiftRoomssService } from '@modules/shared/services/thi-shift-rooms.service';

import { ThiShiftsService } from '@modules/shared/services/thi-shifts.service';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { ThiShiftStudentsService } from '@modules/shared/services/thi-shift-students.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CalendarModule } from 'primeng/calendar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SidebarModule } from 'primeng/sidebar';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin, mergeMap, of } from 'rxjs';
import { ElnBaiHoc } from '@modules/shared/models/elng-bai-hoc';
import { ElnKhoaHoc, getExamFormat } from '@modules/shared/models/elng-khoa-hoc';
import { OvicQueryCondition } from '@core/models/dto';
import { ThiShifts } from '@modules/shared/models/thi-shifts';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { CheckboxModule } from 'primeng/checkbox';
import { getTestType, ROLES, TYPE_TEST } from '@modules/shared/utils/syscat';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-theodoi-cathi',
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
        CheckboxModule,
        RouterModule
    ],
    templateUrl: './theodoi-cathi.component.html',
    styleUrls: ['./theodoi-cathi.component.css']
})
export class TheodoiCathiComponent implements OnInit {

    @ViewChild('paginator_shift') paginator_shift: Paginator;

    @ViewChild('templateRoom') templateRoom: TemplateRef<any>;

    selectedShift: ThiShifts;

    list_course: ElnKhoaHoc[];

    list_hocky: { value: string, label: string }[] = [];

    list_dotthi: { value: string, label: string }[] = [];

    list_namhoc: { value: string, label: string }[] = [];

    limit_shifts: number = 20;

    pageIndex: number = 1;

    list_shifts: ThiShifts[];

    total_shifts: number = 0;

    option_status_filter = [
        { label: 'Chưa kích hoạt', id: 0 },
        { label: 'Đã kích hoạt', id: 1 },
        // { label: 'Đã kết thúc', id: 2 },
    ];

    objectFillter = {
        course_id: null,
        hocky: null,
        namhoc: null,
        dotthi: null,
        status: null,
    };

    shiftcoithi_show: boolean = true;

    include_shift_ids: number[];

    isManager: boolean = false;

    hoidongcoithi: boolean = false;

    hdthi_thuky: boolean = false;

    hdthi_qlct: boolean = false;

    type_test = getExamFormat();

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
        private thiShiftStudentsService: ThiShiftStudentsService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.hoidongthi_chutich) || this.auth.userHasRole(ROLES.hoidongthi_thuky) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) ? true : false;

        this.hdthi_thuky = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.hoidongthi_chutich) || this.auth.userHasRole(ROLES.hoidongthi_thuky) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) ? true : false;

        this.hdthi_qlct = this.auth.userHasRole(ROLES.hoidongthi_qlct);

        if (this.isManager || this.hdthi_qlct) {
            this.option_status_filter = [
                { label: 'Chưa kích hoạt', id: 0 },
                { label: 'Đã kích hoạt', id: 1 },
                { label: 'Đã kết thúc', id: 2 },
            ];
        }
    }

    ngOnInit(): void {
        this.initLoad();
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

        const condition_room: ConditionOption = {
            condition: [

            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'groupby', value: 'shift_id' },
                { label: 'select', value: 'shift_id' },
            ],

            page: null
        }

        if (this.shiftcoithi_show) {
            condition_room.set.push({ label: 'canbo_coithi_ids', value: this.auth.user.id.toString() });
        } else {
            condition_room.set.push({ label: 'canbo_coithi_ids', value: '0' });
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course),
            this.classesService.getClassesByPageNew(condition_hocky),
            this.ovicDateTimeService.getCurrentDateTime(),
            this.thiShiftsService.getThiShiftsByPageNew(condition_dotthi),
            this.thiShiftRoomssService.getThiShiftRoomssByPageNew(condition_room)
        ]).subscribe({
            next: ([_course, _hocky, _date, _dotthi, _room]) => {
                this.list_course = [];

                this.include_shift_ids = _room.data.map(m => m.shift_id);

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
                this.loadShiftsPage(this.pageIndex);
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
                // { conditionName: 'type_of_test', condition: OvicQueryCondition.equal, value: 'TRACNGHIEM', orWhere: 'and' },
                // { conditionName: 'type_of_test', condition: OvicQueryCondition.equal, value: 'DUAN', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: this.limit_shifts.toString() },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'time_start' },
                // { label: 'withCount', value: '1' },
                { label: 'with', value: 'user_created,shift_student,shift_student_duan' },
                { label: 'include', value: 'TRACNGHIEM,DUAN' },
                { label: 'include_by', value: 'type_of_test' }
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

        if (this.shiftcoithi_show) {
            condition_shift.set.push({ label: 'include', value: this.include_shift_ids && this.include_shift_ids.length ? this.include_shift_ids.toString() : '0' });
            condition_shift.set.push({ label: 'include_by', value: 'id' })
        } else {
            if (this.hdthi_qlct && !this.hdthi_thuky) {
                condition_shift.condition.push({ conditionName: 'created_by', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' })
            }
        }

        this.notificationService.isProcessing(true);

        this.thiShiftsService.getThiShiftsByPageNew(condition_shift).subscribe({
            next: (_shifts) => {
                this.notificationService.isProcessing(false);
                const _index_start = (page - 1) * this.limit_shifts;
                _shifts.data.forEach((f, key) => {
                    f['index_'] = _index_start + key + 1;
                    f['count_student'] = 0;
                    f['count_test'] = 0;

                    if (f.type_of_test === "TRACNGHIEM") {
                        if (f['shift_student'] && Array.isArray(f['shift_student'])) {
                            f['count_student'] = f['shift_student'].length;
                            f['count_test'] = f['shift_student'].filter(m => m !== 0).length;
                        }
                    }

                    if (f.type_of_test === "DUAN") {
                        if (f['shift_student_duan'] && Array.isArray(f['shift_student_duan'])) {
                            f['count_student'] = f['shift_student_duan'].length;
                            f['count_test'] = f['count_student'];
                        }
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

    cancelFilter() {
        this.objectFillter = {
            course_id: null,
            hocky: null,
            namhoc: null,
            dotthi: null,
            status: null,
        };

        this.shiftcoithi_show = true;

        this.initLoad();
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

    changeStatusCathi(shift: ThiShifts, status: number) {
        if (status === 2) {
            this.notificationService.confirm("Thao tác này không thể hoàn tác, bạn có chắc chắn là ca thi này đã hoàn thành?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then((a) => {
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
    }

    getRoom(shift: ThiShifts) {
        this.selectedShift = shift;
        this.notificationService.openSideNavigationMenu({ template: this.templateRoom, size: window.innerWidth, offsetTop: '0px' });
        // this.loadShiftRoom();
    }

    closeSideMenu() {
        this.notificationService.closeSideNavigationMenu();
    }

}
