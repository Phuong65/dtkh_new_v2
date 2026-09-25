import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { ClassGroupPlanService } from './../../../../../shared/services/class-group-plan.service';
import { ClassPlanActivityStudentsService } from './../../../../../shared/services/class-plan-activity-students.service';
import { ClassPlanActivityTuluanService } from '@modules/shared/services/class-plan-activity-tuluan-service';
import { ClassPlanActivitiesTestsService } from './../../../../../shared/services/class-plan-activities-tests.service';
import { ClassPlansService } from '@modules/shared/services/class-plans.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { ClassPlans } from '@modules/shared/models/class-plans';
import { ClassStudent } from '@modules/shared/models/class-student';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ClassPlanActivitiesService } from '@modules/shared/services/class-plan-activities.service';
import { ClassPlanActivityStudentTestsService } from '@modules/shared/services/class-plan-activity-student-tests.service';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { ClassStudentTestDeadlineService } from '@modules/shared/services/class-student-test-deadline.service';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { ClassStudentTestDeadline } from '@modules/shared/models/class-student-test-deadline';
import { ConfirmationService } from 'primeng/api';
import { BUTTON_CLOSED } from '@core/models/buttons';
import { ClassGroupPlan } from '@modules/shared/models/class-group-plan';

import { TableModule } from 'primeng/table';
import { SharedModule } from '@modules/shared/shared.module';
import { DialogModule } from 'primeng/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { AuthService } from '@core/services/auth.service';
import { ROLES } from '@modules/shared/utils/syscat';
import { APP_CONFIGS, key_server } from "@env";
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
    standalone: true,
    imports: [TableModule, SharedModule, DialogModule, PaginatorModule, FormsModule, ReactiveFormsModule, MultiSelectModule, CalendarModule, MatProgressBarModule],
    selector: 'app-theodoi-tiendo',
    templateUrl: './theodoi-tiendo.component.html',
    styleUrls: ['./theodoi-tiendo.component.css'],
    providers: [ConfirmationService]
})

export class TheodoiTiendoComponent implements OnInit, OnChanges {
    @Input() classSelected: Classes;

    @Input() courseSelected: ElnKhoaHoc;

    @ViewChild('paginator', { static: true }) paginator: Paginator;

    disPlayDeadlineSet: boolean = false;

    selectedPlan: ClassPlans;

    list_class_plan_activities: ClassPlanActivities[];

    list_class_plan: ClassPlans[];

    list_student: ClassStudent[] = [];

    selectedStudent: ClassStudent;

    limit_student: number = 20;

    total_student: number = 0;

    search_student: string;

    chamtiendo: boolean = false;

    label_parent_kehoach: string = 'Bài';

    page: number = 0;

    date_server: Date;

    list_test_deadline: ClassStudentTestDeadline[];

    deadline: Date;

    config_date: number = 7;

    list_bai_selected: ClassPlanActivities[];

    selectedBais: number[];

    isManager: boolean = false;

    disPlayDeadlineSetAll: boolean = false;

    keyServer = key_server;

    progressValue: number = 0;


    displayModal: boolean = false;

    waitting_title: string = 'Đang cập nhật dữ liệu, vui lòng không tắt trình duyệt';
    constructor(
        private helperService: HelperService,
        private notificationService: NotificationService,
        private classPlanActivitiesService: ClassPlanActivitiesService,
        private modalService: NgbModal,
        private classStudentService: ClassStudentService,
        private classPlanActivityStudentTestsService: ClassPlanActivityStudentTestsService,
        private ovicDateTimeService: OvicDateTimeService,
        private classPlansService: ClassPlansService,
        private classStudentTestDeadlineService: ClassStudentTestDeadlineService,
        private configsService: ConfigsService,
        private confirmationService: ConfirmationService,
        private classGroupPlanService: ClassGroupPlanService,
        private auth: AuthService,
        private coursePlanActivitiesService: CoursePlanActivitiesService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['classSelected']) {
            this.firstLoad();
        }
    }

    ngOnInit(): void {
        // this.loadReadyForTienDo();
    }

    async firstLoad() {
        console.log(JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm)));
        this.notificationService.isProcessing(true);
        const condition_plan_activity: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],

            set: [
                { label: 'limit', value: '-1' }
            ],

            page: null
        }

        const condition_last_plan_activity: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],

            set: [
                { label: 'limit', value: '1' },
                { label: 'order', value: 'DESC' },
                { label: 'orderby', value: 'week' }
            ],

            page: null
        }

        const condition_group_plan: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],

            set: [
                { label: 'limit', value: '-1' }
            ],

            page: null
        }


        const condition_config: ConditionOption = {
            condition: [
                { conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'NUMOF_EXTDATE_FORTEST' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }

        let last_week = 0;

        if (this.keyServer === 'hvu') {
            const condition_course_plan: ConditionOption = {
                condition: [
                    {
                        conditionName: 'course_id',
                        condition: OvicQueryCondition.equal,
                        value: this.classSelected.course_id.toString(),
                        orWhere: 'and'
                    },
                    {
                        conditionName: 'week',
                        condition: OvicQueryCondition.lessThan,
                        value: '100',
                        orWhere: 'and'
                    },
                ],
                set: [
                    { label: 'limit', value: '1' },
                    { label: 'order', value: 'DESC' },
                    { label: 'orderby', value: 'week' },
                ],
                page: null
            }

            const course_plan = await firstValueFrom(this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_course_plan));

            last_week = course_plan.recordsFiltered ? course_plan.data[0].week : 0;
        }

        forkJoin([
            // this.classPlansService.getClassPlansByPageNew( condition_plan ),
            this.configsService.getConfigsByPageNew(condition_config),
            this.ovicDateTimeService.getCurrentDateTime().pipe(mergeMap(_date_time => {

                const d_server = new Date(_date_time);

                d_server.setDate(d_server.getDate() - this.config_date);

                condition_plan_activity.condition.push(
                    {
                        conditionName: 'teaching_day',
                        condition: OvicQueryCondition.lessThan,
                        value: this.helperService.stringToDateSql(d_server.toString()),
                        orWhere: 'and'
                    },
                    {
                        conditionName: 'week',
                        condition: OvicQueryCondition.notEqual,
                        value: '1000',
                        orWhere: 'and'
                    },
                    {
                        conditionName: 'week',
                        condition: OvicQueryCondition.notEqual,
                        value: '0',
                        orWhere: 'and'
                    },
                )

                const d_for_last = new Date(_date_time);

                const last_date = this.auth.getSysConfigValue('PRACTICE_TIME_OF_FINAL_WEEK_TEST');

                d_for_last.setDate(d_for_last.getDate() - last_date);

                condition_last_plan_activity.condition.push(
                    {
                        conditionName: 'teaching_day',
                        condition: OvicQueryCondition.lessThan,
                        value: this.helperService.stringToDateSql(d_for_last.toString()),
                        orWhere: 'and'
                    },
                    {
                        conditionName: 'week',
                        condition: OvicQueryCondition.equal,
                        value: last_week.toString(),
                        orWhere: 'and'
                    },
                )

                return forkJoin([
                    this.classPlansService.getClassPlansByPageNew(condition_plan_activity),
                    this.classPlansService.getClassPlansByPageNew(condition_last_plan_activity)
                ]).pipe(mergeMap(([_class_plan, _last_class_plan]) => {
                    console.log(_last_class_plan);

                    const for_student_test_week = [];

                    if (_last_class_plan.recordsFiltered) {
                        const index_last = _class_plan.data.findIndex(m => m.week === _last_class_plan.data[0].week);
                        if (index_last === -1) {
                            _class_plan.data.push(_last_class_plan.data[0]);
                        }
                    }

                    _class_plan.data.forEach(f => {
                        for_student_test_week.push(f.week);
                    })


                    const condition_student_test: ConditionOption = {
                        condition: [
                            {
                                conditionName: 'class_id',
                                condition: OvicQueryCondition.equal,
                                value: this.classSelected.id.toString(),
                            },
                            {
                                conditionName: 'passed',
                                condition: OvicQueryCondition.equal,
                                value: '1',
                                orWhere: 'and'
                            },
                            { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.keyServer == 'hvu' ? 'KT_TUAN,KT_DAUGIO' : 'KT_TUAN', orWhere: this.keyServer == 'hvu' ? 'in' : 'and' }
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: for_student_test_week.toString() },
                            { label: 'include_by', value: 'week' },
                            { label: 'select', value: 'week, student_id, id, updated_by, created_by' }
                        ],
                        page: null
                    }

                    return this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_student_test).pipe(mergeMap((_student_test) => {
                        _class_plan.data.forEach(f => {
                            f['progress_student_tests'] = _student_test.data.filter(m => m['week'] === f.week);
                        })
                        return of(_class_plan)
                    }))
                }))
            })),
            // this.classGroupPlanService.getClassGroupPlanByPageNew(condition_group_plan)
        ]).subscribe({
            next: ([_config, _class_plan]) => {
                // _class_plan.data.forEach( f => {
                //     f[ 'class_plan_activity' ] = _class_activity.data.filter( m => m.plan_id === f.id );
                // } )
                if (_config.data[0]) {
                    this.config_date = Number(_config.data[0].value);
                }

                console.log(_class_plan);
                this.list_class_plan = _class_plan.data;
                // console.log(_class_plan);

                this.loadStudentClass(1);
            },
            error: () => {
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                this.notificationService.isProcessing(false);
            }
        })
    }

    loadStudentClass(page) {
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
                { label: 'limit', value: '-1' },
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


        this.notificationService.isProcessing(true);

        this.classStudentService.getClassStudentByPageNew(condition).subscribe({
            next: (_resStudent) => {
                if (_resStudent.data) {
                    const tmp = [];
                    let i = 0;
                    _resStudent.data.forEach((f, key) => {
                        f['name'] = f.user_info['name'];
                        f['full_name'] = f.user_info['full_name'];
                        f['first_name'] = f.user_info['full_name'] ? f.user_info['full_name'].split(' ').splice(0, f.user_info['full_name'].split(' ').length - 1).join(' ') : '-';
                        f['birthday'] = f.user_info['birthday'] ? f.user_info['birthday'] : 'Không có';
                        f['email'] = f.user_info['email'];
                        f['student_code'] = f.user_info['student_code'];
                        const plans = [];
                        const tracnghiem = [];
                        this.list_class_plan.forEach(p => {
                            if (p.week !== 0 && p.week !== 1000) {
                                const index_tn = p['progress_student_tests'].findIndex(m => m['student_id'] === f.student_id && m['created_by'] === m['updated_by']);
                                if (index_tn === -1) {
                                    plans.push(p.week);
                                    p['week_label'] = this.label_parent_kehoach.concat(' ', p.week.toString());
                                    tracnghiem.push(p);
                                }
                            }
                        })

                        f['bai'] = plans.join('; ');

                        f['tracnghiem_test'] = tracnghiem;

                        if (plans.length) {
                            i++;
                            f['index_'] = i;
                            tmp.push(f);
                        }
                    });

                    this.list_student = tmp;
                    this.total_student = this.list_student.length;

                } else {
                    this.list_student = [];
                }
                this.notificationService.isProcessing(false);
            },
            error: (e) => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Không tải được dữ liệu, lỗi kết nối');
            },
        });
    }

    filterChamtiendo() {
        this.chamtiendo = !this.chamtiendo;
    }

    changePage_student(event) {
        this.page = event.page;
    }

    filterStudent() {
        this.page = 0;
        if (this.paginator.empty()) {
            this.loadStudentClass(1);
        } else {
            this.paginator.changePage(0);
        }
    }

    openCreatedDeadline(student: ClassStudent) {
        this.list_test_deadline = [];
        this.deadline = null;
        this.selectedBais = null;
        this.list_bai_selected = student['tracnghiem_test'];
        const condition_test_deadline: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                // { conditionName: 'class_plan_activity_id', condition: OvicQueryCondition.equal, value: this.activityTest.id.toString(), orWhere: 'and' },
                { conditionName: 'student_id', condition: OvicQueryCondition.equal, value: student.student_id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'id' }
            ],

            page: null
        }



        this.notificationService.isProcessing(true);

        forkJoin([
            this.ovicDateTimeService.getCurrentDateTime(),
            this.classStudentTestDeadlineService.getClassStudentTestDeadlineByPageNew(condition_test_deadline),

        ]).subscribe({
            next: ([_date_server, _test_deadline]) => {

                this.list_test_deadline = _test_deadline.data;
                this.date_server = _date_server;
                this.selectedStudent = student;
                this.notificationService.isProcessing(false);

                if (this.config_date === 0) {
                    this.notificationService.confirm('Chức năng gia hạn test đang bị khóa, vui lòng liên hệ với <span class="comfirm-bold">PHÒNG ĐÀO TẠO </span> để có thể thực hiện chức năng này', "Thông báo", [BUTTON_CLOSED]).then(() => {
                        return;
                    })
                    return;
                }

                this.disPlayDeadlineSet = true;
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
    }

    onSaveDeadline() {

        if (!this.selectedBais || !this.selectedBais.length) {
            this.notificationService.toastWarning("Vui lòng chọn bài test");
            return;
        }

        if (!this.deadline) {
            this.notificationService.toastWarning("Vui lòng nhập ngày gia hạn");
            return;
        }

        const deadline_time = new Date(this.deadline).getTime();

        const today_time = new Date(this.date_server).getTime();

        if (deadline_time < today_time) {
            this.notificationService.toastWarning("Ngày gia hạn không được nhỏ hơn ngày hôm nay");
            return;
        }


        const date_max = new Date(this.date_server);


        const date_ex = this.config_date;

        date_max.setDate(date_max.getDate() + date_ex);

        const date_max_time = date_max.getTime();

        if (deadline_time > date_max_time) {
            this.notificationService.toastWarning("Ngày gia hạn không được lớn hơn " + date_ex + " ngày, tính từ ngày hôm nay");
            return;
        }

        const request: Observable<any>[] = [];
        this.selectedBais.forEach(f => {
            const data: ClassStudentTestDeadline = {
                class_id: this.classSelected.id,
                week: f,
                student_id: this.selectedStudent.student_id,
                deadline: this.helperService.strToSQLDate(this.deadline.toString())
            }
            request.push(this.classStudentTestDeadlineService.addClassStudentTestDeadline(data))
        })

        this.notificationService.isProcessing(true);

        forkJoin(request).subscribe({
            next: () => {
                this.notificationService.toastSuccess("Thêm thành công")
                this.notificationService.isProcessing(false);
                // this.openCreatedDeadline( this.selectedStudent );
                this.disPlayDeadlineSet = false;
            },
            error: () => {
                this.notificationService.toastError("Thêm thất bại");
                this.notificationService.isProcessing(false);
            }
        })
    }

    /** new load with group */
    loadReadyForTienDo() {
        const condition_group_plan: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
                {
                    conditionName: 'week',
                    condition: OvicQueryCondition.notEqual,
                    value: '1000',
                    orWhere: 'and'
                },
                {
                    conditionName: 'week',
                    condition: OvicQueryCondition.notEqual,
                    value: '0',
                    orWhere: 'and'
                },
            ],

            set: [
                { label: 'limit', value: '-1' }
            ],

            page: null
        }

        const condition_plan_activity: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
                {
                    conditionName: 'week',
                    condition: OvicQueryCondition.notEqual,
                    value: '1000',
                    orWhere: 'and'
                },
                {
                    conditionName: 'week',
                    condition: OvicQueryCondition.notEqual,
                    value: '0',
                    orWhere: 'and'
                },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'week' }
            ],

            page: null
        }

        const condition_class_student: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'student_id,class_group_id' }
            ],
            page: null
        }

        forkJoin([
            this.classGroupPlanService.getClassGroupPlanByPageNew(condition_group_plan),
            this.classPlansService.getClassPlansByPageNew(condition_plan_activity),
            this.ovicDateTimeService.getCurrentDateTime(),
            this.classStudentService.getClassStudentByPageNew(condition_class_student)
        ]).subscribe({
            next: ([_group_plan, _plan_activity, _date_time, _class_student]) => {

                const date_ex = this.config_date;

                const d_server = new Date(_date_time);

                d_server.setDate(d_server.getDate() - date_ex);

                const new_group: ClassGroupPlan[] = []

                _group_plan.data.forEach(f => {
                    const date_group = new Date(f.teaching_day);
                    if (date_group.getTime() < d_server.getTime()) {
                        new_group.push(f);
                    }
                })

                _plan_activity.data.forEach(f => {
                    if (!f['teaching_day'])
                        f['group_plan'] = new_group.filter(m => m.week === f.week);
                })

                const new_plan_activity: ClassPlans[] = [];

                _plan_activity.data.filter(m => (m['group_plan'] && m['group_plan'].length) || m['teaching_day']).forEach(f => {
                    if (f['teaching_day']) {
                        const date_plan = new Date(f.teaching_day);
                        if (date_plan.getTime() < d_server.getTime()) {
                            new_plan_activity.push(f);
                        }
                    } else {
                        new_plan_activity.push(f);
                    }
                })

                const for_student_test_week = new_plan_activity.map(m => m.week);

                for_student_test_week.push(-1);

                const condition_student_test: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'class_id',
                            condition: OvicQueryCondition.equal,
                            value: this.classSelected.id.toString(),
                        },
                        {
                            conditionName: 'passed',
                            condition: OvicQueryCondition.equal,
                            value: '1',
                            orWhere: 'and'
                        },
                        // { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_TUAN', orWhere: 'and' }
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.keyServer == 'hvu' ? 'KT_TUAN,KT_DAUGIO' : 'KT_TUAN', orWhere: this.keyServer == 'hvu' ? 'in' : 'and' }

                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: for_student_test_week.toString() },
                        { label: 'include_by', value: 'week' },
                        { label: 'select', value: 'week, student_id, id, updated_by, created_by' }
                    ],
                    page: null
                }

                this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_student_test).subscribe({
                    next: (_student_test) => {
                        _class_student.data.forEach(f => {
                            const plans = [];
                            new_plan_activity.forEach(c => {
                                if (c.teaching_day) {
                                    const index = _student_test.data.findIndex(m => m.student_id === f.student_id && m['created_by'] === m['updated_by'] && m.week === c.week);
                                    if (index === -1) {
                                        plans.push(c.week);
                                    }
                                } else if (c['group_plan']) {
                                    c['group_plan'].forEach(g => {
                                        if (f.class_group_id === g['class_group_id']) {
                                            const index = _student_test.data.findIndex(m => m.student_id === f.student_id && m['created_by'] === m['updated_by'] && m.week === c.week);
                                            if (index === -1) {
                                                plans.push(c.week);
                                            }
                                        }
                                    })
                                }
                            })
                            f['plan'] = plans;
                        })
                        // _student_test.data.forEach(f => {
                        //     const index = _class_student.data.findIndex(m => m.student_id === f.student_id);
                        //     if (index !== -1) {
                        //         f['class_group_id'] = _class_student.data[index].class_group_id;
                        //     }
                        // });

                        new_plan_activity
                    }
                })
            }
        })
    }

    openFormAddTimeWeek() {
        this.disPlayDeadlineSetAll = true;
        const data = [];
        this.list_student.forEach(f => {
            if (Array.isArray(f['tracnghiem_test'])) {
                f['tracnghiem_test'].forEach(t => {
                    const index = data.findIndex(i => i.week === t.week);
                    if (index === -1) {
                        data.push(t);
                    }
                })
            }

        })
        this.list_bai_selected = this.helperService.sort(data, 'week');
    }

    onSaveDeadlineAll() {
        if (!this.selectedBais || !this.selectedBais.length) {
            this.notificationService.toastWarning("Vui lòng chọn bài test");
            return;
        }

        if (!this.deadline) {
            this.notificationService.toastWarning("Vui lòng nhập ngày gia hạn");
            return;
        }

        const deadline_time = new Date(this.deadline).getTime();

        const today_time = new Date(this.date_server).getTime();

        if (deadline_time < today_time) {
            this.notificationService.toastWarning("Ngày gia hạn không được nhỏ hơn ngày hôm nay");
            return;
        }


        const date_max = new Date(this.date_server);


        const date_ex = this.config_date;

        date_max.setDate(date_max.getDate() + date_ex);

        const date_max_time = date_max.getTime();

        if (deadline_time > date_max_time) {
            this.notificationService.toastWarning("Ngày gia hạn không được lớn hơn " + date_ex + " ngày, tính từ ngày hôm nay");
            return;
        }

        const request: Observable<any>[] = [];



        this.selectedBais.forEach(f => {
            this.list_student.forEach(s => {
                if (Array.isArray(s['tracnghiem_test'])) {
                    const index = s['tracnghiem_test'].findIndex(m => m.week.toString() === f.toString());
                    if (index !== -1) {
                        const data: ClassStudentTestDeadline = {
                            class_id: this.classSelected.id,
                            week: f,
                            student_id: s.student_id,
                            deadline: this.helperService.strToSQLDate(this.deadline.toString())
                        }
                        request.push(this.classStudentTestDeadlineService.addClassStudentTestDeadline(data))
                    }
                }
            })

        })

        if (request.length) {
            this.displayModal = true;
            this.progressValue = 0;
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.notificationService.toastSuccess("Cập nhật thành công")
                    this.loadStudentClass(1);
                },
                error: () => {
                    this.displayModal = false;
                    this.notificationService.toastError("Thao tác thất bại, vui lòng thử lại")
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
}
