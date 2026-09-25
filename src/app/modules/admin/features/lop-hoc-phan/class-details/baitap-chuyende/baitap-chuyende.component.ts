import {ClassGroupPlanService} from './../../../../../shared/services/class-group-plan.service';
import {ClassGroupService} from './../../../../../shared/services/class-group.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfigsService} from '@modules/shared/services/configs.service';
import {OvicDateTimeService} from '@modules/shared/services/ovic-date-time.service';
import {HelperService} from './../../../../../../core/services/helper.service';
import {ClassStudentTestDeadlineService} from './../../../../../shared/services/class-student-test-deadline.service';
import {
    ClassPlanActivityStudentTestsService
} from './../../../../../shared/services/class-plan-activity-student-tests.service';
import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, ElementRef} from '@angular/core';
import {OvicQueryCondition} from '@core/models/dto';
import {NotificationService} from '@core/services/notification.service';
import {ClassPlanActivities} from '@modules/shared/models/class-plan-activities';
import {ClassStudent} from '@modules/shared/models/class-student';
import {Classes} from '@modules/shared/models/classes';
import {ConditionOption} from '@modules/shared/models/condition-option';
import {ClassStudentService} from '@modules/shared/services/class-student.service';
import {forkJoin, mergeMap, Observable, of} from 'rxjs';
import {AuthService} from '@core/services/auth.service';
import {ClassStudentTestDeadline} from '@modules/shared/models/class-student-test-deadline';
import {NORMAL_MODAL_OPTIONS} from '@core/utils/syscat';
import {BUTTON_NO, BUTTON_YES} from '@core/models/buttons';
import {ConfirmationService} from 'primeng/api';
import {CoursePlanActivities} from '@modules/shared/models/course-plan-activities';
import {Paginator, PaginatorModule} from 'primeng/paginator';
import {ClassGroup} from '@modules/shared/models/class-group';
import {ROLES} from '@modules/shared/utils/syscat';
import {CommonModule} from '@angular/common';
import {SharedModule} from '@modules/shared/shared.module';
import {TableModule} from 'primeng/table';
import {key_server} from "@env";
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";
import {TooltipModule} from "primeng/tooltip";

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, TableModule, PaginatorModule, RippleModule, ButtonModule, TooltipModule],
    selector: 'app-baitap-chuyende',
    templateUrl: './baitap-chuyende.component.html',
    styleUrls: ['./baitap-chuyende.component.css'],
    providers: [ConfirmationService]
})
export class BaitapChuyendeComponent implements OnInit, OnChanges {

    @Input() classSelected: Classes;

    @Input() activityTest: CoursePlanActivities;

    @ViewChild('paginator', {static: true}) paginator: Paginator;

    // @ViewChild( 'formInfoDeadline' ) formInfoDeadline: ElementRef;

    list_student: ClassStudent[];

    selectedStudent: ClassStudent;

    limit_student: number = 25;

    search_student: string;

    total_student: number = 0;

    cols_student: any[] = [];

    dk_test: number;

    passnumber: number;

    isManager: boolean = false;
    isGiangvien: boolean = false;

    list_test_deadline: ClassStudentTestDeadline[];

    deadline: Date;

    config_date: number = 7;

    date_server: Date;

    disPlayDeadlineSet: boolean = false;

    list_group: ClassGroup[];

    selectClassGroup: ClassGroup;
    keyServer = key_server;

    constructor(
        private classStudentService: ClassStudentService,
        private noitifi: NotificationService,
        private classPlanActivityStudentTestsService: ClassPlanActivityStudentTestsService,
        private classStudentTestDeadlineService: ClassStudentTestDeadlineService,
        private auth: AuthService,
        private helperService: HelperService,
        private ovicDateTimeService: OvicDateTimeService,
        private configsService: ConfigsService,
        private modalService: NgbModal,
        private confirmationService: ConfirmationService,
    ) {

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isGiangvien = this.auth.userHasRole(ROLES.giangvien);


        if (this.keyServer == 'hvu') {
            this.cols_student = [
                {
                    label: '#', class: 'ovic-w-50px text-center', key: 'index_', html: false
                },
                {
                    label: 'Họ', class: 'ovic-w-150px text-left', key: 'first_name', html: false
                },
                {
                    label: 'Tên', class: 'ovic-w-80px text-left', key: 'name', html: false
                },
                {
                    label: 'Mã sinh viên',
                    class: 'ovic-w-110px text-left',
                    key: 'student_code',
                    html: false
                },
                {
                    label: 'Lần Test đầu',
                    class: 'ovic-w-50px text-center',
                    key: '_first_point',
                },
                {
                    label: 'Số lần đã làm',
                    class: 'ovic-w-50px text-center',
                    key: 'number_kt',
                },
                // {
                //     label: 'Điểm cao nhất (3 lần đầu)',
                //     class: 'ovic-w-100px text-center',
                //     key: 'high_point_three_first_time',
                //     html: true,
                // },
                // {
                //     label: 'Điểm cao nhất',
                //     class: 'ovic-w-100px text-center',
                //     key: 'highest_point',
                //     html: true,
                // },
                {
                    label: 'Điều kiện thi KTHP',
                    class: 'ovic-w-100px text-center',
                    key: 'dieukien',
                    html: true,
                },
            ];
        } else {
            this.cols_student = [
                {
                    label: '#', class: 'ovic-w-50px text-center', key: 'index_', html: false
                },
                {
                    label: 'Họ', class: 'ovic-w-150px text-left', key: 'first_name', html: false
                },
                {
                    label: 'Tên', class: 'ovic-w-80px text-left', key: 'name', html: false
                },
                {
                    label: 'Mã sinh viên',
                    class: 'ovic-w-110px text-left',
                    key: 'student_code',
                    html: false
                },
                {
                    label: 'Số lần đã làm',
                    class: 'ovic-w-50px text-center',
                    key: 'number_kt',
                },
                // {
                //     label: 'Điểm cao nhất (3 lần đầu)',
                //     class: 'ovic-w-100px text-center',
                //     key: 'high_point_three_first_time',
                //     html: true,
                // },
                // {
                //     label: 'Điểm cao nhất',
                //     class: 'ovic-w-100px text-center',
                //     key: 'highest_point',
                //     html: true,
                // },
                {
                    label: 'Điều kiện thi KTHP',
                    class: 'ovic-w-100px text-center',
                    key: 'dieukien',
                    html: true,
                },
            ];
        }

        // if(this.isManager &&  this.keyServer == 'hvu'){
        //     this.cols_student.push({
        //         label: 'Thao tác', class: ' text-center', key: 'btn', html: false
        //     })
        // }

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['activityTest']) {
            if (this.activityTest) {
                this.list_student = null;
                this.search_student = null;
                this.list_group = null;
                this.selectClassGroup = null;
                this.firstPageSet();
                // this.loadStudentClass( 1, this.limit_student );
            }
        }
    }

    ngOnInit(): void {
        this.loadStudentClass(1, this.limit_student);
    }

    loadStudentClass(page, limit) {
        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],
            set: [
                {label: 'order', value: 'ASC'},
                {label: 'orderby', value: 'ordering'},
                {label: 'limit', value: limit},
            ],
            page: page,
        };

        const condition_count: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],
            set: [
                {label: 'order', value: 'ASC'},
                {label: 'orderby', value: 'user_info'},
                {label: 'limit', value: '1'},
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


        const condition_pass: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                    orWhere: 'and'
                },
                {
                    conditionName: 'week',
                    condition: OvicQueryCondition.equal,
                    value: this.activityTest.week.toString(),
                    orWhere: 'and'
                },
                {conditionName: 'point_type', condition: OvicQueryCondition.equal, value: 'CC', orWhere: 'and'},
                {conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and'},
                {conditionName: 'passed', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and'},
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.equal,
                    value: this.keyServer == 'hvu' ? 'KT_TUAN,KT_DAUGIO' : 'KT_TUAN',
                    orWhere: 'in'
                }
            ],
            set: [
                {label: 'limit', value: '-1'},
                {label: 'order', value: 'ASC'},
                {label: 'orderby', value: 'id'},
                {label: 'groupby', value: 'student_id'},
                {label: 'select', value: 'id'}
            ],
            page: null
        }

        const condition_student: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],
            set: [
                {label: 'select', value: 'student_id'},
                {label: 'limit', value: '-1'},
            ],
            page: null,
        };

        const condition_group: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.id.toString(),
                },
            ],

            set: [
                {label: 'limit', value: '-1'},
            ],

            page: null
        }

        this.noitifi.isProcessing(true);

        forkJoin([
            this.classStudentService.getClassStudentByPageNew(condition).pipe(mergeMap(_class_student => {
                const student_ids = []
                _class_student.data.forEach(f => {
                    student_ids.push(f.student_id);
                    f['number_kt'] = '-';
                    f['dieukien'] = '-';
                    f['high_point_three_first_time'] = '-';
                    f['highest_point'] = '-';
                })

                if (student_ids.length) {
                    const condition_tests: ConditionOption = {
                        condition: [
                            {
                                conditionName: 'class_id',
                                condition: OvicQueryCondition.equal,
                                value: this.classSelected.id.toString(),
                                orWhere: 'and'
                            },
                            {
                                conditionName: 'week',
                                condition: OvicQueryCondition.equal,
                                value: this.activityTest.week.toString(),
                                orWhere: 'and'
                            },
                            {
                                conditionName: 'point_type',
                                condition: OvicQueryCondition.equal,
                                value: 'CC',
                                orWhere: 'and'
                            },
                            {
                                conditionName: 'status',
                                condition: OvicQueryCondition.greaterThan,
                                value: '-1',
                                orWhere: 'and'
                            },
                            {
                                conditionName: 'type',
                                condition: OvicQueryCondition.equal,
                                value: this.keyServer == 'hvu' ? 'KT_TUAN,KT_DAUGIO' : 'KT_TUAN',
                                orWhere: 'in'
                            }
                        ],
                        set: [
                            {label: 'limit', value: '-1'},
                            {label: 'include', value: [...new Set(student_ids)].toString()},
                            {label: 'include_by', value: 'student_id'},
                            {label: 'order', value: 'ASC'},
                            {label: 'orderby', value: 'id'}
                        ],
                        page: null
                    }

                    return forkJoin([
                        this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_tests),
                    ]).pipe(mergeMap(([_class_plan_activity_tests]) => {
                        _class_student.data.forEach(f => {

                            const student_tests = _class_plan_activity_tests.data.filter(m => m['student_id'] === f.student_id && m['created_by'] === m['updated_by']);
                            // console.log(student_tests);

                            f['_first_point'] = student_tests && student_tests.length > 0 && student_tests.find(f => f.type == 'KT_DAUGIO') ? Number(student_tests.find(f => f.type == 'KT_DAUGIO')['tong_diem']) / 10 : '-';
                            f['number_kt'] = student_tests.length ? student_tests.length : '-';
                            f['dieukien'] = student_tests.findIndex(m => m.passed === 1) !== -1 ? '<span class="blue font-weight-600">Đạt</span>' : '<span class="red font-weight-600">Chưa đạt</span>';
                            f['_dkView'] = student_tests.findIndex(m => m.passed === 1) !== -1 ? 'Đạt' : 'Chưa đạt';
                            let i = 0;

                            let hight_point_position = 0;

                            f['highest_point'] = student_tests[0] ? student_tests[0].point / 10 : '-';

                            student_tests.forEach((p, key) => {
                                if (key < 3) {
                                    if (student_tests[hight_point_position]) {
                                        if (p.point > student_tests[hight_point_position].point) {
                                            hight_point_position = key;
                                        }
                                    }
                                }

                                if (f['highest_point'] < p.point / 10) {
                                    f['highest_point'] = p.point / 10;
                                }
                            })

                            f['high_point_three_first_time'] = student_tests[hight_point_position] ? student_tests[hight_point_position].point / 10 : '-';
                        })
                        return of(_class_student);
                    }))
                }
                return of(_class_student);
            })),
            this.classStudentService.getClassStudentByPageNew(condition_student).pipe(mergeMap((_res) => {
                this.total_student = _res.recordsFiltered;
                const student_ids = [];
                _res.data.forEach(f => {
                    student_ids.push(f.student_id);
                })

                if (student_ids.length) {
                    condition_pass.set.push({label: 'include', value: student_ids.toString()});
                    condition_pass.set.push({label: 'include_by', value: 'student_id'});
                    return this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_pass).pipe(mergeMap(a => {
                        a.data = a.data.filter(m => m['created_by'] === a['updated_by']);
                        return of(a)
                    }))
                } else {
                    return of(_res);
                }
            })),
        ]).subscribe({
            next: ([_resStudent, _pass,]) => {
                this.passnumber = _pass.recordsFiltered;
                if (_resStudent.data) {
                    const tmp = [];
                    const _index_start = (page - 1) * Number(limit);
                    _resStudent.data.forEach((f, key) => {
                        f['index_'] = _index_start + key + 1;
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
                this.noitifi.isProcessing(false);
            },
            error: (e) => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Không tải được dữ liệu, lỗi kết nối');
            },
        });
    }

    onSearchStudent(event) {
        this.search_student = event;
        this.firstPageSet();
    }

    firstPageSet() {
        if (this.paginator.empty()) {
            this.loadStudentClass(1, this.limit_student);
        } else {
            this.paginator.changePage(0);
        }
    }

    changePage_student(event) {
        this.limit_student = event.rows;
        this.loadStudentClass(event.page + 1, this.limit_student);
    }

    closeForm() {
        // this.modalService.
    }

    filterBygroup(class_group: ClassGroup) {
        this.selectClassGroup = class_group;
        this.loadStudentClass(1, this.limit_student);
    }

    async btnUpdateKtToTuan(row: ClassStudent) {
        // 5007093

        const html = `
            <p class="mb-0">- Xác nhận huỷ kết quả test lần đầu của sinh viên <strong>${row.user_info.full_name}</strong></p>
            <p class="mb-0">- Thao tác này sẽ hủy kết quả test lần đầu và sẽ lấy điểm của lần test kế tiếp.</p>
            <p class="mb-0 text-center" style="color:red">Bạn có đồng ý thực hiện thao tác này không ?</p>
        `;
        const btn = await this.noitifi.confirm(html, 'THÔNG BÁO', [BUTTON_NO, BUTTON_YES]);
        if (btn.name == 'yes') {

            this.noitifi.isProcessing(true);
            this.classPlanActivityStudentTestsService.replaceKtDaugioToKtTuan(this.classSelected.id, this.activityTest.week, row.user_id).subscribe({
                next: () => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastSuccess('Thao tác thành công');
                    this.loadStudentClass(1, this.limit_student);
                }, error: (e) => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastError(e['error']['message']);

                }
            })
        }


    }
}
