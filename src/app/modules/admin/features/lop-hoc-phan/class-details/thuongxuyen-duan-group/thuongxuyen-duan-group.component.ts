import { request } from 'http';
import { group } from '@angular/animations';
import { ClassPlanActivityTuluanGroupService } from './../../../../../shared/services/class_plan_activity_tuluan_group.service';
import { ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { ClassStudent } from '@modules/shared/models/class-student';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { CoursePlanActivityTuluanTieuchicham } from '@modules/shared/models/course-plan-activity-tuluan-tieuchicham';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ClassPlanActivitiesService } from '@modules/shared/services/class-plan-activities.service';
import { ClassPlanActivityTuluanService } from '@modules/shared/services/class-plan-activity-tuluan-service';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { CHAM_DIEM_TULUAN_TX, CHUAN_DAU_RA, MAXIMIZE_MODAL_OPTIONS, ROLES } from '@modules/shared/utils/syscat';
import { NgbTooltipModule, NgbModalModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { PaginatorModule } from 'primeng/paginator';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { forkJoin, mergeMap, of, Observable, firstValueFrom } from 'rxjs';
import { SharedModule } from '@modules/shared/shared.module';
import { ClassPlanActivityTuluanGroup } from '@modules/shared/models/class_plan_activity_tuluan_group';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { DragDropModule } from "@angular/cdk/drag-drop";
import { AuthService } from '@core/services/auth.service';
import { APP_CONFIGS } from '@env';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';

@Component({
    selector: 'app-thuongxuyen-duan-group',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        CalendarModule,
        TableModule,
        ReactiveFormsModule,
        FormsModule,
        PaginatorModule,
        NgbTooltipModule,
        DividerModule,
        LoadMediaOnTextDirective,
        PanelModule,
        MatSliderModule,
        NgbModalModule,
        DialogModule,
        MatProgressBarModule,
        ButtonModule,
        TooltipModule,
        MatListModule,
        DragDropModule,
        MatCheckboxModule,
        NgbTooltipModule
    ],
    templateUrl: './thuongxuyen-duan-group.component.html',
    styleUrls: ['./thuongxuyen-duan-group.component.css']
})
export class ThuongxuyenDuanGroupComponent implements OnInit, OnChanges {

    @Input() activity: ClassPlanActivities;

    @Input() classSelected: Classes;

    @ViewChild('templateFormViewTuluan') templateFormViewTuluan: TemplateRef<any>;

    @ViewChild('templateFormChamDiem') templateFormChamDiem: ElementRef<any>;

    @ViewChild('templateFormChamDiemGroup') templateFormChamDiemGroup: ElementRef<any>;

    @ViewChild('templateListSelectTuluan') templateListSelectTuluan: ElementRef<any>;

    @ViewChild('topResize') topResize: ElementRef;

    list_tieuchi_cham: CoursePlanActivityTuluanTieuchicham[] = [];

    selectedStudents: ClassStudent[] = [];

    limit_student: number = 20;

    total_student: number = 0;

    cols_student: any[] = [];

    selectedActivity: ClassPlanActivities;

    selectedStudent: ClassStudent;

    startDate: Date;

    tongtest: number = 0;

    tongsv: number = 0;

    list_student: ClassStudent[] = [];

    list_student_for_select: ClassStudent[] = [];

    search_student: string;

    index_focus: number = 0;

    selectedTuluan: CoursePlanActivityTuluan;

    type2Class = false;

    countChanges: number = 0;

    panel_tieuchi = [];

    button_toggle = [];

    cham_diem_tuluan = CHAM_DIEM_TULUAN_TX;

    showThumbLabel = true;

    chuan_dau_ra = CHUAN_DAU_RA;

    isOpenChamDiem: boolean = false;

    pageIndex: number = 1;

    actionView: string;

    list_course_tuluan: CoursePlanActivityTuluan[] = [];

    displayModal: boolean = false;

    progressValue: number = 0;

    list_group: ClassPlanActivityTuluanGroup[] = [];

    openAddStudentGroup: boolean = false;

    selectedGroup: ClassPlanActivityTuluanGroup;

    config_group: { min: number, max: number };

    isManager: boolean = false;
    constructor(
        private classPlanActivitiesService: ClassPlanActivitiesService,
        private notificationService: NotificationService,
        private classStudentService: ClassStudentService,
        private elnKhoaHocService: ElnKhoaHocService,
        private helperService: HelperService,
        private classPlanActivityTuluanService: ClassPlanActivityTuluanService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private cdr: ChangeDetectorRef,
        private coursePlanActivityTuluanTieuchichamService: CoursePlanActivityTuluanTieuchichamService,
        private modalService: NgbModal,
        private classPlanActivityTuluanGroupService: ClassPlanActivityTuluanGroupService,
        private auth: AuthService,
        private coursePlanActivitiesService: CoursePlanActivitiesService
    ) {
        this.cols_student = [
            { label: '#', class: 'ovic-w-50px text-center', key: 'index_', html: false },
            { label: 'Họ', class: 'ovic-w-150px text-left', key: 'first_name', html: false },
            { label: 'Tên', class: 'ovic-w-80px text-left', key: 'name', html: false },
            { label: 'Mã sinh viên', class: 'ovic-w-150px text-left', key: 'student_code', html: false },
            { label: 'Có đề', class: 'ovic-w-50px text-center', key: 'has_test', html: true },
            { label: 'Mã đề', class: 'ovic-w-100px text-center', key: 'course_plan_activity_tuluan_id', private: true },
            { label: 'Điểm danh', class: 'ovic-w-50px text-center', key: 'lock', private: true },
            { label: 'Vi phạm quy chế', class: 'ovic-w-80px text-center', key: 'stopped', private: true },
            { label: 'Nhận đề', class: 'ovic-w-80px text-center', key: 'status_test', html: true },
            { label: 'Điểm', class: 'ovic-w-100px text-center', key: 'point', private: true, },
        ];

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) ? true : false;
    }

    ngAfterViewInit(): void {
        const observer = new ResizeObserver(entries => {
            const width = entries[0].contentRect.width;
            this.onResize(width);
            this.cdr.detectChanges()
        });

        observer.observe(this.topResize.nativeElement);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['activity']) {
            const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

            const get_setting_group = config.find(m => m.config_key === 'GROUP_DUAN_SETTING')['params'];

            this.config_group = get_setting_group

            this.openAddStudentGroup = false;

            this.selectedActivity = this.activity;
            this.startDate = null;
            this.selectedGroup = null;
            this.list_course_tuluan = [];
            this.list_group = [];
            if (this.selectedActivity.start_date) {
                this.startDate = new Date(this.selectedActivity.start_date);
            } else {
                // this.startDate = new Date();
            }


            if (this.activity.ordering === 0) {
                this.cols_student = [
                    { label: '#', class: 'ovic-w-50px text-center', key: 'index_', html: false },
                    { label: 'Họ', class: 'ovic-w-150px text-left', key: 'first_name', html: false },
                    { label: 'Tên', class: 'ovic-w-80px text-left', key: 'name', html: false },
                    { label: 'Mã sinh viên', class: 'ovic-w-150px text-left', key: 'student_code', html: false },
                    { label: 'Có đề', class: 'ovic-w-50px text-center', key: 'has_test', html: true },
                    { label: 'Mã đề', class: 'ovic-w-100px text-center', key: 'course_plan_activity_tuluan_id', private: true },
                    // { label: 'Điểm danh', class: 'ovic-w-50px text-center', key: 'lock', private: true },
                    // { label: 'Vi phạm quy chế', class: 'ovic-w-80px text-center', key: 'stopped', private: true },
                    { label: 'Nhận đề', class: 'ovic-w-80px text-center', key: 'status_test', html: true },
                    // { label: 'Điểm', class: 'ovic-w-100px text-center', key: 'point', private: true, },
                ];
            } else {
                this.cols_student = [
                    { label: '#', class: 'ovic-w-50px text-center', key: 'index_', html: false },
                    { label: 'Họ', class: 'ovic-w-150px text-left', key: 'first_name', html: false },
                    { label: 'Tên', class: 'ovic-w-80px text-left', key: 'name', html: false },
                    { label: 'Mã sinh viên', class: 'ovic-w-150px text-left', key: 'student_code', html: false },
                    { label: 'Có đề', class: 'ovic-w-50px text-center', key: 'has_test', html: true },
                    { label: 'Mã đề', class: 'ovic-w-100px text-center', key: 'course_plan_activity_tuluan_id', private: true },
                    { label: 'Điểm danh', class: 'ovic-w-50px text-center', key: 'lock', private: true },
                    { label: 'Vi phạm quy chế', class: 'ovic-w-80px text-center', key: 'stopped', private: true },
                    { label: 'Nhận đề', class: 'ovic-w-80px text-center', key: 'status_test', html: true },
                    { label: 'Điểm', class: 'ovic-w-100px text-center', key: 'point', private: true, },
                ];
            }

            this.loadStudentAndTest();
        }
    }

    pointQuestionKeyDown(event: KeyboardEvent, inputPoint_quest: HTMLInputElement) {
        if (!event) return;

        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight'];

        const value = inputPoint_quest.value;
        const cursorStart = inputPoint_quest.selectionStart ?? 0;
        const cursorEnd = inputPoint_quest.selectionEnd ?? 0;

        if (/^[0-9]$/.test(event.key)) {

            const newValue =
                value.substring(0, cursorStart) + event.key + value.substring(cursorEnd);


            if (newValue.includes('.')) {
                const parts = newValue.split('.');
                if (parts[1]?.length > 1) {
                    event.preventDefault();
                    return;
                }
            }


            if (parseFloat(newValue) > 10) {
                event.preventDefault();
                return;
            }

            return;
        }


        if (event.key === '.') {
            if (value.includes('.')) {
                event.preventDefault();
            }
            return;
        }


        if (allowedKeys.includes(event.key)) {
            return;
        }


        event.preventDefault();
    }

    numberKeyDown(event: KeyboardEvent, inputPoint_quest: HTMLInputElement) {
        if (!event) return;

        // Các phím điều khiển hợp lệ để sửa/xóa/di chuyển
        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];

        // Cho phép nhập các chữ số từ 0-9
        if (/^[0-9]$/.test(event.key)) {
            return; // Hợp lệ, cho phép nhập tự do
        }

        // Cho phép các phím điều khiển cơ bản
        if (allowedKeys.includes(event.key)) {
            return;
        }

        // Chặn tất cả các phím còn lại (dấu chấm '.', dấu trừ '-', chữ cái, v.v.)
        event.preventDefault();
    }

    ngOnInit(): void {

    }

    async loadStudentAndTest() {
        this.notificationService.isProcessing(true);

        this.list_student = [];

        const condition_count_student: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedActivity.class_id.toString(),
                },
            ],
            set: [
                { label: 'limit', value: '1' },
            ],
            page: null,
        };

        const condition_count_test: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedActivity.class_id.toString(),
                },
                {
                    conditionName: 'class_plan_activity_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedActivity.id.toString(),
                    orWhere: 'and'
                },
            ],
            set: [
                { label: 'limit', value: '1' },
            ],
            page: null,
        };

        const condition_course_tuluan: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.course_id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.equal,
                    value: "1",
                    orWhere: 'and'
                },
                {
                    conditionName: 'course_plan_activity_id',
                    condition: OvicQueryCondition.notEqual,
                    value: '0',
                    orWhere: 'and'
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }

        const condition_plan_0: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: "and" },
                { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: "0", orWhere: "and" },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: "1000", orWhere: "and" },
                { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: "0", orWhere: "and" },
            ],
            set: [
                { label: 'limit', value: '1' }
            ],
            page: null
        }

        if (this.selectedActivity.ordering !== 0) {
            const course_plan_id = await firstValueFrom(this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan_0));
            if (course_plan_id.recordsFiltered) {
                condition_course_tuluan.condition.push({ conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: course_plan_id.data[0].id.toString(), orWhere: "and" });
            }
        } else {
            condition_course_tuluan.condition.push({ conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.course_plan_activity_id.toString(), orWhere: "and" });
        }

        const condition_group: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedActivity.class_id.toString(),
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null,
        };

        const condition_student: ConditionOption = {
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
                { label: 'limit', value: '-1' },
            ],
            page: null,
        };



        forkJoin([
            this.classStudentService.getClassStudentByPageNew(condition_count_student),
            this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_count_test),
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_course_tuluan),
            this.classPlanActivityTuluanGroupService.getClassPlanActivityTuluanGroupByPageNew(condition_group),
            this.classStudentService.getClassStudentByPageNew(condition_student)
        ]).subscribe({
            next: ([_class_student, _class_plan_test, _tuluan, _group, _student]) => {
                this.list_group = _group.data;

                this.tongsv = _class_student.recordsFiltered;

                this.tongtest = _class_plan_test.recordsFiltered;

                this.list_course_tuluan = _tuluan.data;

                this.list_student = _student.data;

                if (_student.data) {
                    const tmp = [];
                    _student.data.forEach((f, key) => {
                        f['name'] = f.user_info['name'];
                        f['full_name'] = f.user_info['full_name'];
                        f['first_name'] = f.user_info['full_name'] ? f.user_info['full_name'].split(' ').splice(0, f.user_info['full_name'].split(' ').length - 1).join(' ') : '-';
                        f['birthday'] = f.user_info['birthday'] ? f.user_info['birthday'] : 'Không có';
                        f['email'] = f.user_info['email'];
                        f['student_code'] = f.user_info['student_code'];
                        tmp.push(f);
                    });
                    this.list_student = tmp;
                } else {
                    this.list_student = [];
                }

                let student_ids = [];

                this.list_group.forEach(f => {
                    f['students'] = this.list_student.filter(m => f.student_ids && f.student_ids.includes(m.student_id));
                    student_ids = student_ids.concat(f['students'].map(m => m.student_id));
                })

                const group_none: ClassPlanActivityTuluanGroup = {
                    class_id: 0,
                    ordering: 9999,
                    course_id: 0,
                    course_plan_activity_tuluan_id: 0,
                    leader_id: 0,
                    id: -1,
                    student_ids: []
                }

                group_none['students'] = this.list_student.filter(m => !student_ids.includes(m.student_id));

                group_none['student_ids'] = group_none['students'].map(m => m.student_id);

                if (group_none['student_ids'].length > 0)
                    this.list_group.push(group_none);

                this.notificationService.isProcessing(false);

                if (this.selectedActivity.ordering !== 0) {
                    if (this.tongtest !== 0) {
                        this.loadStudentClass(0);
                    } else {
                        this.syncDuan();
                    }
                }
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
    }


    async loadStudentClass(page) {
        this.notificationService.isProcessing(true);

        const condition_test: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedActivity.class_id.toString(),
                },
                {
                    conditionName: 'class_plan_activity_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedActivity.id.toString(),
                    orWhere: 'and'
                },
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.course_id.toString(),
                    orWhere: 'and'
                }
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null,
        };

        this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_test).subscribe({
            next: (_student_test) => {
                this.list_group.forEach(f => {
                    if (f['students'] && Array.isArray(f['students'])) {
                        f['students'].forEach(c => {
                            const index = _student_test.data.findIndex(m => m.student_id === c.student_id);
                            if (index !== -1) {
                                c['test_info'] = _student_test.data[index];
                                c['has_test'] = '<span class="blue"><i class="fa fa-check"></i></span>';
                                c['lock'] = _student_test.data[index].lock;
                                c['stopped'] = _student_test.data[index].stopped;
                                c['point'] = _student_test.data[index].point === -1 ? null : _student_test.data[index].point;
                                c['course_plan_activity_tuluan_id'] = _student_test.data[index].course_plan_activity_tuluan_id;
                                c['status_test'] = _student_test.data[index].status >= 1 ? '<span class="blue"><i class="fa fa-check"></i></span>' : '-';
                                const index_course = this.list_course_tuluan.findIndex(m => m.id === f['course_plan_activity_tuluan_id']);
                                if (index_course !== -1 && this.list_course_tuluan[index_course]['point'] && this.list_course_tuluan[index_course]['point'] > 0) {
                                    f['newTuluan'] = true;
                                }
                            } else {
                                c['point'] = '-';
                                c['status_test'] = '-';
                                c['has_test'] = '-';
                            }
                        })
                    }
                })
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    checkTestPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const condition_student: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
                ],

                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: 'student_id,id' },
                ],

                page: null,
            }

            const condition_test: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
                    { conditionName: 'class_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: 'and' },
                ],

                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: 'student_id,id' },
                ],
                page: null,
            }

            forkJoin([
                this.classStudentService.getClassStudentByPageNew(condition_student),
                this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_test)
            ]).pipe(mergeMap(([_student, _tuluan]) => {
                const _id_test_delete = [];
                _tuluan.data.forEach(f => {
                    const index = _student.data.findIndex(m => m.student_id === f.student_id);
                    if (index === -1) {
                        _id_test_delete.push(f.id);
                    }
                })

                if (_id_test_delete.length) {
                    return this.classPlanActivityTuluanService.deleteClassPlanActivityTuluan(_id_test_delete.toString()).pipe(mergeMap(() => {
                        return of(null);
                    }))
                }

                return of(null);

            })).subscribe({
                next: () => {
                    resolve(null);
                },
                error: () => {
                    resolve(null);
                }
            })
        });
    }



    createTest() {
        this.notificationService.confirm("Bạn có chắc chắn muốn phân bổ dự án không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                const check = await this.checkTestPromise();
                this.elnKhoaHocService.getElnKhoaHocByCol('id', this.classSelected.course_id.toString()).pipe(mergeMap(_elnkhoa => {
                    return this.classPlanActivityTuluanService.sinhde(this.selectedActivity.id, _elnkhoa[0].av)
                })).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess('Sinh đề thành công');
                        this.loadStudentAndTest();
                    },
                    error: (err) => {
                        console.log(err);
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError(err.error.message);
                    }
                })
            }
        })
    }

    saveDate() {
        if (this.startDate) {
            this.notificationService.isProcessing(true);
            this.classPlanActivitiesService.updateClassPlanActivities(this.selectedActivity.id, { start_date: this.helperService.stringToDateSql(this.startDate.toString()) }).subscribe({
                next: () => {
                    this.selectedActivity.start_date = this.startDate.toString();
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess('Cập nhật thành công');
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError('Lỗi kết nối, cập nhật thất bại');
                }
            })
        } else {
            this.notificationService.toastWarning('Vui lòng nhập thời gian dự kiến');
        }
    }

    changeStatusActivity(status: number) {
        if (!this.selectedActivity.start_date) {
            return this.notificationService.toastWarning('Vui lòng nhập thời gian kiểm tra trước khi mở');
        }

        let noiti = "Bạn có chắc chắn muốn mở bài kiểm tra không?";

        if (status === 0) {
            noiti = "Bạn có chắc chắn muốn đóng bài kiểm tra không?";
        }

        this.notificationService.confirm(noiti, "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                this.classPlanActivitiesService.updateClassPlanActivities(this.selectedActivity.id, { status: status }).subscribe({
                    next: () => {
                        this.selectedActivity.status = status;
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess('Cập nhật thành công');
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError('Lỗi kết nối, cập nhật thất bại');
                    }
                })
            }
        })
    }

    onChangeLock(class_student: ClassStudent) {
        if (class_student['test_info']) {
            const lock = class_student['lock'] === 1 ? 0 : 1;
            this.notificationService.isProcessing(true);
            this.classPlanActivityTuluanService.updateClassPlanActivityTuluan(class_student['test_info'].id, { lock: lock }).subscribe({
                next: () => {
                    this.notificationService.isProcessing(false);
                    class_student['lock'] = lock;
                    class_student['test_info']['lock'] = lock;
                },
                error: () => {

                }
            })
        } else {
            this.notificationService.toastWarning('Chưa có đề kiểm tra cho sinh viên này');
        }
    }

    onChangeStopped(class_student: ClassStudent) {
        if (class_student['test_info']) {
            const stopped = class_student['stopped'] === 1 ? 0 : 1;
            this.notificationService.confirm(stopped === 0 ? "Bạn có chắc chắn cho sinh viên này tiếp tục làm bài kiểm tra không?" : "Bạn có chắc chắn sinh viên này đã vi phạm quy chế không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.classPlanActivityTuluanService.updateClassPlanActivityTuluan(class_student['test_info'].id, { stopped: stopped }).subscribe({
                        next: () => {
                            this.notificationService.isProcessing(false);
                            class_student['stopped'] = stopped;
                            class_student['test_info']['stopped'] = stopped;
                        },
                        error: () => {
                            this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                        }
                    })
                }
            }).then(() => null)
        } else {
            this.notificationService.toastWarning('Chưa có đề kiểm tra cho sinh viên này');
        }
    }

    changePage_student(event) {
        this.pageIndex = event.page + 1;
        this.loadStudentClass(event.page + 1);
    }

    firstPageSet() {
        this.loadStudentClass(1);
    }

    onSearchStudent(event) {
        this.search_student = event;
        this.firstPageSet();
    }

    savePointTest(event, row: ClassStudent, index, group_student: ClassStudent) {
        if (event && row['test_info']) {
            if (row['test_info'].point || row['test_info'].point === 0 || row['test_info'].point === null) {
                if (event.key === 'Enter') {
                    this.notificationService.isProcessing(true);
                    this.classPlanActivityTuluanService.updateClassPlanActivityTuluan(row['test_info'].id, { point: row['point'], status: 2 }).subscribe({
                        next: () => {
                            this.notificationService.isProcessing(false);
                            if (group_student[index + 1]) {
                                this.index_focus = group_student[index + 1].id;
                            }
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Lưu điểm thất bại, vui lòng thử lại");
                            row['point'] = row['test_info'].point === -1 ? null : row['test_info'].point;
                        }
                    })
                }
            }
        }
    }

    openViewCode(event, row: ClassStudent) {
        if (event)
            event.preventDefault();
        this.selectedTuluan = null;
        if (row['test_info']) {
            if (row['test_info']['status'] >= 1) {
                this.selectedStudent = row;
                const condition_course_tuluan: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: row['test_info'].course_plan_activity_tuluan_id.toString() }
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }
                this.notificationService.isProcessing(true);
                this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_course_tuluan).subscribe({
                    next: (_tuluan) => {
                        if (_tuluan.recordsFiltered) {
                            this.selectedTuluan = _tuluan.data[0];
                        }
                        this.notificationService.isProcessing(false);
                        this.notificationService.openSideNavigationMenu({ template: this.templateFormViewTuluan, size: window.innerWidth, offsetTop: '0px' })
                    },
                    error: () => {

                    }
                })
            } else {
                this.notificationService.toastWarning('Thầy / cô có thể xem đề bài sau khi sinh viên đã nhận đề');
            }
        }
    }


    closeForm() {
        this.isOpenChamDiem = false;
        this.notificationService.closeSideNavigationMenu();
    }

    openNewQuestion(action: string) {
        this.actionView = action;

        const students = this.selectedGroup['students'];

        const index = students.findIndex(m => m.id === this.selectedStudent.id);

        if (index !== -1) {
            if (action === 'next') {
                if (index + 1 >= students.length) {
                    this.selectedStudent = students[0];
                } else {
                    this.selectedStudent = students[index + 1];
                }
            } else if (action === 'back') {
                if (index - 1 <= 0) {
                    this.selectedStudent = students[students.length - 1];
                } else {
                    this.selectedStudent = students[index - 1];
                }
            }

            this.openPointCode(this.selectedStudent, this.selectedGroup);
        } else {
            this.notificationService.toastWarning('Không tìm thấy câu hỏi');
        }
    }

    onResize(width) {
        if (width < 690) {
            this.type2Class = true;
        } else {
            this.type2Class = false;
        }
    }

    // deleteCode () {
    //     if ( this.selectedStudents && this.selectedStudents.length ) {
    //         const test_ids = [];
    //         this.selectedStudents.forEach( f => {
    //             if ( f[ 'test_info' ] ) {
    //                 if ( f[ 'test_info' ][ 'id' ] ) {
    //                     // if ( f[ 'test_info' ][ 'status' ] === 0 || f['test_info']['lock'] === 1) {
    //                     test_ids.push( f[ 'test_info' ][ 'id' ] )
    //                     // }
    //                 }
    //             }
    //         } )

    //         if ( test_ids.length ) {
    //             this.notificationService.confirmDelete().then( _a => {
    //                 if ( _a ) {
    //                     this.classPlanActivityTuluanService.deleteClassPlanActivityTuluan( test_ids.toString() ).subscribe( {
    //                         next: () => {
    //                             this.notificationService.toastSuccess( "Xóa đề thành công, vui lòng phân bổ lại đề cho sinh viên" );
    //                             this.loadStudentAndTest();
    //                         },
    //                         error: () => {
    //                             this.notificationService.toastError( "Xóa thất bại, vui lòng thử lại" );
    //                         }
    //                     } )
    //                 }
    //             } )
    //         } else {
    //             this.notificationService.toastInfo( "Các sinh viên được chọn đã làm bài kiểm tra, không thể xóa" )
    //         }
    //     } else {
    //         this.notificationService.toastError( "Vui lòng chọn sinh viên có đề muốn xóa" );
    //     }
    // }

    openPointCode(row: ClassStudent, group: ClassPlanActivityTuluanGroup) {

        this.notificationService.isProcessing(true);

        this.countChanges++;

        this.selectedTuluan = null;

        this.list_tieuchi_cham = [];
        // if (row['test_info']) {
        //     if (row['test_info']['status'] >= 1) {
        this.selectedStudent = row;

        this.selectedGroup = group;
        if (row['test_info']) {

            const index = this.list_course_tuluan.findIndex(m => m.id === row['test_info'].course_plan_activity_tuluan_id);

            if (index !== -1) {

                this.selectedTuluan = this.list_course_tuluan[index];

                const condition_tieuchi: ConditionOption = {
                    condition: [
                        { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: row['test_info'].course_plan_activity_tuluan_id.toString(), orWhere: 'and' },
                        { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.course_plan_activity_id.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchi).subscribe({
                    next: (_tieuchi) => {
                        _tieuchi.data.forEach(f => {
                            f['collapsed'] = true;
                            f['point_change'] = 0;
                            f['point_cham'] = 0;
                            if (this.selectedStudent && this.selectedStudent['test_info'] && this.selectedStudent['test_info'].params) {
                                if (this.selectedStudent['test_info'].params['tieuchicham']) {
                                    const tieuchicham = this.selectedStudent['test_info'].params['tieuchicham'];
                                    if (Array.isArray(tieuchicham)) {
                                        const index = tieuchicham.findIndex(m => m.ordering === f.ordering);
                                        if (index !== -1) {
                                            f['point_cham'] = tieuchicham[index]['point_cham'];
                                            f['point_change'] = tieuchicham[index]['point_change'];
                                        }
                                    }
                                }
                            }
                        })

                        this.list_tieuchi_cham = _tieuchi.data;

                        this.notificationService.isProcessing(false);

                        if (this.isOpenChamDiem === false) {
                            this.isOpenChamDiem = true;
                            this.modalService.open(this.templateFormChamDiem, MAXIMIZE_MODAL_OPTIONS)
                        }
                    },
                    error: () => {

                    }
                })
            } else {
                this.notificationService.isProcessing(false);
                this.notificationService.toastWarning("Không tìm thấy Dự án");
            }
        } else {
            this.notificationService.isProcessing(false);
            this.notificationService.toastWarning("Không tìm thấy Dự án");
        }
    }

    openHuongdancham(panel, item: CoursePlanActivityTuluanTieuchicham) {
        const index = this.panel_tieuchi.findIndex(m => m.id === panel['id']);

        if (index === -1) {
            this.panel_tieuchi.push(panel);
        }

        item['collapsed'] = !item['collapsed'];

        if (this.panel_tieuchi && this.panel_tieuchi.length) {
            this.panel_tieuchi.forEach(f => {
                f['animating'] = true;
            })
        }

        if (item['collapsed'] === false) {
            this.list_tieuchi_cham.filter(m => m.id !== item.id).map(m => {
                m['collapsed'] = true;
                return m;
            })
        }
    }

    onSliderChange(item) {
        item['point_cham'] = parseFloat((item['point'] / 100 * item['point_change']).toFixed(2));
        this.selectedStudent['point'] = parseFloat(this.list_tieuchi_cham.map(m => m['point_cham']).reduce((total, num) => total + num, 0).toFixed(2));
    }

    onSliderGroupChange(item) {
        item['point_cham'] = parseFloat((item['point'] / 100 * item['point_change']).toFixed(2));
        this.selectedGroup['point'] = parseFloat(this.list_tieuchi_cham.map(m => m['point_cham']).reduce((total, num) => total + num, 0).toFixed(2));
    }

    savePointTieuchi() {
        if (this.selectedStudent && this.selectedStudent['test_info']) {
            if (this.list_tieuchi_cham && this.list_tieuchi_cham.length) {
                const s = parseFloat(this.list_tieuchi_cham.map(m => m['point_cham']).reduce((total, num) => total + num, 0).toFixed(2));
                const data = [];
                this.list_tieuchi_cham.forEach(f => {
                    data.push({
                        id: f.id,
                        ordering: f.ordering,
                        title: f.title,
                        point_cham: f['point_cham'],
                        point: f.point,
                        point_change: f['point_change'],
                        cdr: f.cdr
                    })
                })

                this.notificationService.isProcessing(true);

                this.classPlanActivityTuluanService.updateClassPlanActivityTuluan(this.selectedStudent['test_info'].id, { params: { tieuchicham: data }, point: s, status: 2 }).subscribe({
                    next: () => {
                        this.selectedStudent['test_info'].params = { tieuchicham: data };
                        this.selectedStudent['test_info'].point = s;
                        this.selectedStudent['point'] = s;
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Lưu điểm thành công")
                    },
                    error(err) {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    },
                })
            } else {
                this.notificationService.toastWarning("Đề của sinh viên này không có tiêu chí");
            }
        } else {
            this.notificationService.toastWarning("Vui lòng chọn sinh viên");
        }
    }
    // getBackgroundColor(val: number): string {
    //     return `linear-gradient(to right, red 0%, orange 40%, yellow 55%, green 70%, deepskyblue 85%, deepskyblue 100%)`;
    // }

    closeModal(d) {
        d(true);
        this.isOpenChamDiem = false;
        this.loadStudentClass(this.pageIndex);
    }

    nhapDiem() {
        this.notificationService.confirm("Thao tác này sẽ bỏ qua việc phân phối đề. Thầy/Cô chỉ việc nhập điểm", "Thông báo", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                this.syncDuan(true);
            }
        })
    }

    syncDuan(no_code: boolean = false) {

        this.displayModal = true;

        this.progressValue = 0;

        const request: Observable<any>[] = [];

        const data_group = this.list_group.filter(m => m.id > 0);

        data_group.forEach(f => {
            if (f['students'] && Array.isArray(f['students'])) {
                f['students'].forEach(c => {
                    if (f.course_plan_activity_tuluan_id || no_code === true) {
                        const data = {
                            class_id: this.classSelected.id,
                            course_id: this.classSelected.course_id,
                            student_id: c.student_id,
                            course_plan_activity_tuluan_id: f.course_plan_activity_tuluan_id
                        }

                        data['class_plan_activity_id'] = this.selectedActivity.id;

                        const condition_has_tuluan: ConditionOption = {
                            condition: [
                                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                                { conditionName: 'student_id', condition: OvicQueryCondition.equal, value: c.student_id.toString(), orWhere: 'and' },
                                { conditionName: 'class_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: 'and' }
                            ],
                            set: [
                                { label: 'limit', value: '1' }
                            ],
                            page: null
                        }

                        request.push(this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_has_tuluan).pipe(mergeMap(_a => {
                            if (_a.recordsFiltered) {
                                return this.classPlanActivityTuluanService.updateClassPlanActivityTuluan(_a.data[0].id, data).pipe(mergeMap(() => {
                                    return of(null);
                                }))
                            } else {
                                return this.classPlanActivityTuluanService.addClassPlanActivityTuluan(data).pipe(mergeMap(() => {
                                    return of(null);
                                }))
                            }
                        })))
                    }
                })
            }
        })

        if (request.length) {
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.loadStudentAndTest();
                    this.notificationService.toastSuccess("Đồng bộ thành công");
                },
                error: (e) => {
                    console.log(e);
                    this.displayModal = false;
                    this.notificationService.toastError("Đồng bộ thất bại");
                }
            })
        } else {
            this.notificationService.isProcessing(false);
            this.displayModal = false;
            this.notificationService.toastInfo("Không tìm thấy nhóm hoặc đề");
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

    createdGroup(input_number) {
        if (input_number.value && parseFloat(input_number.value) !== 0 && !isNaN(parseFloat(input_number.value))) {
            this.displayModal = true;

            this.progressValue = 0;

            const value_input = parseFloat(input_number.value);

            const request: Observable<any>[] = [];

            for (let i = 1; i <= value_input; i++) {
                const data: ClassPlanActivityTuluanGroup = {
                    class_id: this.classSelected.id,
                    ordering: i,
                    course_id: this.classSelected.course_id,
                    course_plan_activity_tuluan_id: 0,
                    leader_id: 0,
                }

                request.push(this.classPlanActivityTuluanGroupService.addClassPlanActivityTuluanGroup(data))
            }

            if (request.length) {
                this.loopAddForm(request, 0).subscribe({
                    next: () => {
                        this.displayModal = false;
                        this.notificationService.toastSuccess("Tạo thành công");
                        this.loadStudentAndTest();
                    },
                    error: () => {
                        this.displayModal = false;
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            } else {
                this.displayModal = false;
            }
        } else {
            this.notificationService.toastWarning("Vui lòng nhập số lượng nhóm cần tạo")
        }
    }

    addOneGroup() {
        this.notificationService.isProcessing(true);

        const data_group = this.list_group.filter(m => m.id > 0);

        const data: ClassPlanActivityTuluanGroup = {
            class_id: this.classSelected.id,
            ordering: data_group && data_group.length ? data_group[data_group.length - 1].ordering + 1 : 1,
            course_id: this.classSelected.course_id,
            course_plan_activity_tuluan_id: 0,
            leader_id: 0,
        }

        this.classPlanActivityTuluanGroupService.addClassPlanActivityTuluanGroup(data).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess("Tạo thành công");
                this.loadStudentAndTest();
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    deleteGroup(group: ClassPlanActivityTuluanGroup) {
        if (group.course_plan_activity_tuluan_id && !this.isManager) {
            return this.notificationService.toastInfo("Nhóm đã có dự án, không thể xóa");
        }

        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.classPlanActivityTuluanGroupService.deleteClassPlanActivityTuluanGroup(group.id).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadStudentAndTest();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại, vui lòng thử lại");
                    }
                })
            }
        })
    }

    addStudentToGroup(group: ClassPlanActivityTuluanGroup) {
        this.selectedGroup = group;

        this.openAddStudentGroup = true;

        const tmp: ClassStudent[] = []

        const data_group = this.list_group.filter(m => m.id > 0);

        this.list_student.forEach(f => {
            const index_group = data_group.findIndex(m => group.id === m.id && m.student_ids && m.student_ids.includes(f.student_id));

            if (index_group !== -1) {
                f['checked'] = true;
            }

            const index = data_group.findIndex(m => group.id !== m.id && m.student_ids && m.student_ids.includes(f.student_id));

            if (index === -1) {
                tmp.push(f);
            }
        })

        this.list_student_for_select = tmp;
    }

    closeShowRightLayout() {
        this.openAddStudentGroup = false;
    }

    changeSelecteStudent(event: MatSelectionListChange) {
        if (event) {
            const index = this.list_student.findIndex(m => m.id === event.options[0].value['id']);
            if (index !== -1) {
                this.list_student[index]['checked'] = event.options[0].selected;
            }
        }
    }

    returnSelectedStudent() {
        if (this.list_student)
            return this.list_student.filter(m => m['checked']).length;
        return 0;
    }

    saveStudentToGroup() {
        if (this.list_student && this.selectedGroup) {
            this.notificationService.isProcessing(true);
            const ids = this.list_student.filter(m => m['checked']).map(m => m.student_id);
            // if (ids.length > this.config_group.max) {
            //     this.notificationService.isProcessing(false);
            //     return this.notificationService.toastInfo("Số lượng thành viên lớn hơn 6, không thể lưu");
            // }

            if (ids.length < this.config_group.min) {
                this.notificationService.isProcessing(false);
                return this.notificationService.toastInfo("Số lượng thành viên nhỏ hơn 2, không thể lưu");
            }

            this.classPlanActivityTuluanGroupService.updateClassPlanActivityTuluanGroup(this.selectedGroup.id, { student_ids: ids.length ? ids : null }).subscribe(
                {
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Tạo thành công");
                        this.openAddStudentGroup = false;
                        this.loadStudentAndTest();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                }
            )
        } else {
            this.notificationService.toastWarning("Không có sinh viên")
        }
    }

    deleteStudentInFroup(group: ClassPlanActivityTuluanGroup, student: ClassStudent) {
        if (group.course_plan_activity_tuluan_id && !this.isManager) {
            return this.notificationService.toastInfo("Nhóm đã có dự án, không thể xóa");
        }

        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                const ids = group['students'].filter(m => m.student_id.toString() !== student.student_id.toString()).map(m => m.student_id);
                this.classPlanActivityTuluanGroupService.updateClassPlanActivityTuluanGroup(group.id, { student_ids: ids }).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        group.student_ids = ids;
                        group['students'] = group['students'].filter(m => m.student_id.toString() !== student.student_id.toString());
                        this.notificationService.toastSuccess("Xóa thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại, vui lòng thử lại");
                    }
                })
            }
        })
    }

    selecteLeaderForGroup(group: ClassPlanActivityTuluanGroup, student: ClassStudent) {

        this.notificationService.isProcessing(true);

        this.classPlanActivityTuluanGroupService.updateClassPlanActivityTuluanGroup(group.id, { leader_id: student.student_id }).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                group.leader_id = student.student_id;
                this.notificationService.toastSuccess("Cập nhật thành công");
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Cập nhật thất bại, vui lòng thử lại");
            }
        })
    }

    openViewSelectTuluan(group: ClassPlanActivityTuluanGroup) {
        if (!group.student_ids || group.student_ids.length === 0) {
            return this.notificationService.toastError("Chưa có thành viên, vui lòng chọn thành viên");
        }

        this.selectedGroup = group;

        this.list_course_tuluan.forEach(f => {
            f['checked'] = false;
        })
        if (this.list_course_tuluan && this.list_course_tuluan.length) {
            if (group.course_plan_activity_tuluan_id) {
                const index = this.list_course_tuluan.findIndex(m => m.id === group.course_plan_activity_tuluan_id);
                if (index !== -1) {
                    this.selectedTuluan = this.list_course_tuluan[index];
                    this.selectedTuluan['checked'] = true;
                } else {
                    this.selectedTuluan = this.list_course_tuluan[0];
                }
            } else {
                this.selectedTuluan = this.list_course_tuluan[0];
            }
        }


        this.modalService.open(this.templateListSelectTuluan, MAXIMIZE_MODAL_OPTIONS);
    }

    onSelectTuluan(tuluan: CoursePlanActivityTuluan) {
        this.selectedTuluan = tuluan;
    }

    saveDuanForGroup() {
        if (this.selectedTuluan && this.selectedGroup) {
            if (this.selectedGroup.student_ids.length > 0) {
                this.notificationService.isProcessing(true);
                this.classPlanActivityTuluanGroupService.updateClassPlanActivityTuluanGroup(this.selectedGroup.id, { course_plan_activity_tuluan_id: this.selectedTuluan.id }).subscribe({
                    next: () => {
                        this.list_course_tuluan.forEach(f => {
                            f['checked'] = false;
                        })

                        this.selectedGroup['checked'] = true;

                        this.notificationService.isProcessing(false);

                        this.notificationService.toastSuccess("Cập nhật thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Cập nhật thất bại, vui lòng thử lại");
                    }
                })
            } else {
                this.notificationService.toastWarning("Nhóm này chưa có thành viên, không thể thêm");
            }
        } else {
            this.notificationService.toastWarning("Vui lòng chọn dự án");
        }
    }

    nextGroup(action: string) {
        const data_group = this.list_group.filter(m => m.id > 0);

        const index = data_group.findIndex(m => m.id === this.selectedGroup.id);
        if (index !== -1) {
            if (action === 'next') {
                if (index + 1 >= data_group.length) {
                    this.selectedGroup = data_group[0];
                } else {
                    this.selectedGroup = data_group[index + 1];
                }
            } else if (action === 'back') {
                if (index - 1 < 0) {
                    this.selectedGroup = data_group[data_group.length - 1];
                } else {
                    this.selectedGroup = data_group[index - 1];
                }
            }

            this.list_course_tuluan.forEach(f => {
                f['checked'] = false;
                if (f.id === this.selectedGroup.course_plan_activity_tuluan_id) {
                    f['checked'] = true;
                }
            })

            if (this.isOpenChamDiem === true) {
                this.openGroupPoint(this.selectedGroup);
            }
        } else {
            this.notificationService.toastWarning('Không tìm thấy group');
        }
    }

    openGroupPoint(group: ClassPlanActivityTuluanGroup) {
        this.notificationService.isProcessing(true);

        this.countChanges++;

        this.selectedGroup = group;

        this.list_tieuchi_cham = [];

        this.selectedTuluan = null;

        const index = this.list_course_tuluan.findIndex(m => m.id === group.course_plan_activity_tuluan_id);

        if (index !== -1) {
            this.selectedTuluan = this.list_course_tuluan[index];

            const condition_tieuchi: ConditionOption = {
                condition: [
                    { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: group.course_plan_activity_tuluan_id.toString(), orWhere: 'and' },
                    { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.course_plan_activity_id.toString(), orWhere: 'and' }
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'ordering' }
                ],
                page: null
            }

            this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchi).subscribe({
                next: (_tieuchi) => {
                    _tieuchi.data.forEach(f => {
                        f['collapsed'] = true;
                        f['point_change'] = 0;
                        f['point_cham'] = 0;

                        if (this.selectedGroup && this.selectedGroup.course_plan_activity_tuluan_id) {
                            if (this.selectedGroup.params && this.selectedGroup.params['tieuchicham']) {
                                const tieuchicham = this.selectedGroup.params['tieuchicham'];
                                if (Array.isArray(tieuchicham)) {
                                    const index = tieuchicham.findIndex(m => m.ordering === f.ordering);
                                    if (index !== -1) {
                                        f['point_cham'] = tieuchicham[index]['point_cham'];
                                        f['point_change'] = tieuchicham[index]['point_change'];
                                    }
                                }
                            }
                        }
                    })

                    this.list_tieuchi_cham = _tieuchi.data;

                    this.notificationService.isProcessing(false);

                    if (this.isOpenChamDiem === false) {
                        this.isOpenChamDiem = true;
                        this.modalService.open(this.templateFormChamDiemGroup, MAXIMIZE_MODAL_OPTIONS);
                    }

                },
                error: () => {

                }
            })

        } else {
            this.notificationService.isProcessing(false);
            this.notificationService.toastWarning("Không tìm thấy Dự án");
        }
    }


    savePointTieuchiGroup() {
        if (this.selectedGroup && this.selectedGroup.course_plan_activity_tuluan_id) {
            if (this.list_tieuchi_cham && this.list_tieuchi_cham.length) {
                this.displayModal = true;

                this.progressValue = 0;

                const s = parseFloat(this.list_tieuchi_cham.map(m => m['point_cham']).reduce((total, num) => total + num, 0).toFixed(2));

                const data = [];

                const request: Observable<any>[] = [];

                this.list_tieuchi_cham.forEach(f => {
                    data.push({
                        id: f.id,
                        ordering: f.ordering,
                        title: f.title,
                        point_cham: f['point_cham'],
                        point: f.point,
                        point_change: f['point_change'],
                        cdr: f.cdr
                    })
                })

                request.push(this.classPlanActivityTuluanGroupService.updateClassPlanActivityTuluanGroup(this.selectedGroup.id, { params: { tieuchicham: data }, point: s }).pipe(mergeMap(() => {
                    this.selectedGroup.params = { tieuchicham: data };
                    this.selectedGroup.point = s;
                    return of(null)
                })));

                if (this.selectedGroup['students'] && Array.isArray(this.selectedGroup['students'])) {
                    this.selectedGroup['students'].forEach(f => {
                        if (f['test_info']) {
                            request.push(this.classPlanActivityTuluanService.updateClassPlanActivityTuluan(f['test_info'].id, { params: { tieuchicham: data }, point: s, status: 2 }).pipe(mergeMap(() => {
                                f['test_info'].params = { tieuchicham: data };
                                f['test_info'].point = s;
                                return of(null)
                            })))
                        }
                    })
                }

                if (request.length) {
                    this.loopAddForm(request, 0).subscribe({
                        next: () => {
                            this.displayModal = false;
                            this.notificationService.toastSuccess("Lưu điểm thành công")
                        },
                        error: () => {
                            this.displayModal = false;
                            this.notificationService.toastError("Lưu điểm thất bại, vui lòng thử lại");
                        }
                    })
                } else {
                    this.displayModal = false;
                }

            } else {
                this.notificationService.toastWarning("Đề của sinh viên này không có tiêu chí");
            }
        } else {
            this.notificationService.toastWarning("Vui lòng chọn sinh viên");
        }
    }

    changeSelectAllStudent(event: MatCheckboxChange) {
        this.list_student_for_select.forEach(f => {
            if (!f['disabled']) {
                f['checked'] = event.checked;
            }
        })
    }
}
