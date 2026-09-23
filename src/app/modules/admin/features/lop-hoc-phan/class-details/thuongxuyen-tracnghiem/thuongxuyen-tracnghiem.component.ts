import { ClassPlanActivitiesTestsService } from '@shared/services/class-plan-activities-tests.service';
import { ClassPlanActivitiesTestsControlService } from './../../../../../shared/services/class-plan-activities-tests-control.service';
import { ClassPlanActivitiesTestsControl } from './../../../../../shared/models/class-plan-activities-tests-control';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { HelperService } from '@core/services/helper.service';
import { ElnKhoaHocService } from '@shared/services/elearning-khoa-hoc.service';
import { NotificationService } from './../../../../../../core/services/notification.service';
import { ClassPlanActivitiesService } from './../../../../../shared/services/class-plan-activities.service';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { BUTTON_CLOSED, BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { forkJoin, mergeMap, Observable, of, Subject } from 'rxjs';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ClassStudent } from '@modules/shared/models/class-student';
import { Classes } from '@modules/shared/models/classes';
import { ClassPlanActivitiesTests, VIOLATION } from '@modules/shared/models/class-plan-activities-tests';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@core/models/auth';
import { AuthService } from '@core/services/auth.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { APP_CONFIGS, getWsUrl, key_server, wsPath } from '@env';
import { io, Socket } from 'socket.io-client';
import { LARGE_MODAL_OPTIONS, ROLES } from '@modules/shared/utils/syscat';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { ClassPlanActivityTestsAnswersService } from '@modules/shared/models/class-plan-activities-tests-answer.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { BadgeModule } from 'primeng/badge'
import { ClassGroupService } from '@modules/shared/services/class-group.service';
import { ClassGroupMemberService } from '@modules/shared/services/class-group-member.service';
import { ClassGroup } from '@modules/shared/models/class-group';
import { catchError, finalize } from 'rxjs/operators';
@Component({
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        CalendarModule,
        TableModule,
        DialogModule,
        PaginatorModule,
        CheckboxModule,
        DropdownModule,
        NgbTooltipModule,
        MatMenuModule,
        MatProgressBarModule,
        BadgeModule
    ],
    selector: 'app-thuongxuyen-tracnghiem',
    templateUrl: './thuongxuyen-tracnghiem.component.html',
    styleUrls: ['./thuongxuyen-tracnghiem.component.css']
})

export class ThuongxuyenTracnghiemComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('topResize') topResize: ElementRef;

    @ViewChild('templateLogStudentShift', { static: true }) templateLogStudentShift: TemplateRef<any>;

    @ViewChild("templateWarningStudent") templateWarningStudent: TemplateRef<any>;

    @ViewChild('viewStudentTest') viewStudentTest: ElementRef;

    classSelected: Classes;

    selectedStudents: ClassStudent[] = [];

    selectedActivity: ClassPlanActivities;

    limit_student: number = 20;

    list_student: ClassStudent[] = [];

    search_student: string;

    total_student: number = 0;

    startDate: Date;

    tongsv: number = 0;

    tongtest: number = 0;

    cols_student: any[] = [];

    thongke = {
        chualam: 0,
        danglam: 1,
        danop: 2
    }

    filter_status_array = [
        { label: 'Tất cả', value: 'all' },
        { label: 'Chưa làm', value: 'chualam' },
        { label: 'Đang làm', value: 'danglam' },
        { label: 'Đã nộp', value: 'danop' }
    ]


    status_object = {
        chualam: 0,
        danglam: 0,
        dadung: 0,
        danop: 0,
        dahuy: 0,
        unlock: 1,
        tongde: 0,
    }

    filterStatusSelect = 'all';

    type2Class = false;

    displayDelete = false;

    isManager: boolean = false;

    userId: number;

    showNew: boolean = true;

    selectedStudent: ClassStudent;

    acceptViolation: boolean = false;

    displayViolation: boolean = false;

    displayDeleteViolaytion: boolean = false;

    displayAddtime: boolean = false;

    displayCancel: boolean = false;

    display_thubai: boolean = false;

    checkboxThubai: boolean = false;

    _status_student_filter: number;

    messageControl: string;

    addTimeValue: number;

    noteDeleteViolation: string;

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

    pageIndex: number = 1;

    dbConfig: any;

    interverTimeShiftStudent: any;

    displayModal: boolean = false;

    progressValue: number = 0;

    waitingTitle: string = 'Đang thực hiện, vui lòng chờ...';

    list_question: CourseQuestions[];

    list_aws: any[] = [];

    private socket: Socket;

    private submitTrigger$ = new Subject<void>();

    private resizeObserver: ResizeObserver;

    filter_status_html: number;

    search_student_html: string;

    list_warning: any[] = [];

    show_warning: boolean = false;

    key_server = key_server;

    index_focus: number = 0;

    /** ===== Nhóm sinh viên ===== */
    classGroups: ClassGroup[] = [];
    selectedGroupId: number | null = null;
    selectedGroupStudents: ClassStudent[] = [];
    /** Toàn bộ student_id thuộc nhóm đang chọn (không phụ thuộc phân trang/bộ lọc) */
    selectedGroupMemberStudentIds: number[] = [];
    displayGroupActionConfirm: boolean = false;
    groupActionType: 'diemdanh' | 'huy_diemdanh' | 'submit' = 'diemdanh';
    groupActionMessage: string = '';
    groupActionCount: number = 0;

    constructor(
        private classPlanActivitiesService: ClassPlanActivitiesService,
        private notificationService: NotificationService,
        private classPlanActivitiesTestsService: ClassPlanActivitiesTestsService,
        private classStudentService: ClassStudentService,
        private elnKhoaHocService: ElnKhoaHocService,
        private helperService: HelperService,
        private cdr: ChangeDetectorRef,
        private ovicDateTimeService: OvicDateTimeService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private auth: AuthService,
        private classesService: ClassesService,
        private classPlanActivitiesTestsControlService: ClassPlanActivitiesTestsControlService,
        private classPlanActivityTestsAnswersService: ClassPlanActivityTestsAnswersService,
        private modalService: NgbModal,
        private courseQuestionsService: CourseQuestionsService,
        private classGroupService: ClassGroupService,
        private classGroupMemberService: ClassGroupMemberService
    ) {
        this.cols_student = [
            { label: '#', class: 'ovic-w-50px text-center', key: 'index_', html: false },
            { label: 'Họ và tên', class: 'with-400px text-left', key: 'full_name', html: false, private: true },
            // { label: 'Mã sinh viên', class: 'ovic-w-110px text-left', key: 'student_code', html: false },
            { label: 'Điểm danh', class: 'ovic-w-50px text-center', key: 'lock', private: true },
            { label: 'Trạng thái', class: 'ovic-w-100px text-center', key: 'status_test', html: true, private: true },
            { label: 'Có đề', class: 'ovic-w-50px text-center', key: 'has_test', html: true },
            { label: 'Tiến độ', class: 'ovic-w-100px text-center', key: 'progress', private: true },
            { label: 'Điểm', class: 'ovic-w-100px text-center', key: 'point', html: true, private: true },
            { label: 'Vi phạm quy chế', class: 'ovic-w-120px text-center', key: 'violation', private: true },

        ];

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.troly_pdt) ? true : false;

        this.displayDelete = this.isManager;

        this.userId = this.auth.user.id;

        let config = [];
        try {
            const configStr = localStorage.getItem('--app_configs-' + APP_CONFIGS.realm);
            config = configStr ? JSON.parse(configStr) : [];
        } catch (e) {
            config = [];
        }
        const config_array = [];

        if (config && config.length) {
            const getViolationItem = config.find(m => m.config_key === 'GET_VIOLATION_OF_EXAM');
            const get_violation = getViolationItem ? getViolationItem['params'] : null;

            if (get_violation && Object.keys(get_violation).length) {
                Object.keys(get_violation).forEach(f => {
                    get_violation[f]['key'] = f;
                    config_array.push(get_violation[f]);
                })
            }
        }

        this.dbConfig = config_array;
    }


    ngOnDestroy(): void {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.closeInterval();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }

    ngAfterViewInit(): void {
        this.resizeObserver = new ResizeObserver(entries => {
            const width = entries[0].contentRect.width;
            this.onResize(width);
            this.cdr.detectChanges()
        });
        this.resizeObserver.observe(this.topResize.nativeElement);
    }

    initMyClass() {
        this.notificationService.isProcessing(true);
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                const class_id = params['code'];
                const class_plan_test_id = params['test']
                const condition_class: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: class_id.toString() },
                    ],
                    set: [],
                    page: null,
                };

                if (!this.isManager) {
                    condition_class.condition.push(
                        {
                            conditionName: 'manager_ids',
                            condition: OvicQueryCondition.like,
                            value: '%|' + this.userId.toString() + '|%',
                            orWhere: 'and',
                        });
                }

                const condition_plan_test: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: class_plan_test_id.toString(), orWhere: 'and' },
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: class_id.toString(), orWhere: 'and' },
                    ],
                    set: [],
                    page: null,
                };




                forkJoin([
                    this.classesService.getClassesByPageNew(condition_class),
                    this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condition_plan_test),
                ]).subscribe({
                    next: ([cl, _plan_test]) => {
                        this.notificationService.isProcessing(false);
                        if (cl.recordsFiltered && _plan_test.recordsFiltered) {
                            this.selectedActivity = _plan_test.data[0];
                            this.connectSocket();
                            this.classSelected = cl.data[0];
                            if (this.classSelected.manager_ids) {
                                const giangvien_ar = this.classSelected.manager_ids.split('|').filter(m => m);
                                const _index_gv = giangvien_ar.findIndex(m => m.toString() === this.auth.user.id.toString());
                                if (_index_gv === -1 && !this.isManager) {
                                    this.notificationService.toastError('Không tìm thấy bài kiểm tra thường xuyên này');
                                    this.router.navigate(['/admin/lop-hoc-phan']);
                                }
                            } else if (!this.isManager) {
                                this.notificationService.toastError('Không tìm thấy bài kiểm tra thường xuyên này');
                                this.router.navigate(['/admin/lop-hoc-phan']);
                            }

                            this.auth.setFeatureSecondary(cl.data[0].name.concat(" - ", this.selectedActivity.title));

                            if (this.selectedActivity.start_date) {
                                this.startDate = new Date(this.selectedActivity.start_date);
                            }

                            // this.loadGroups();
                            this.loadStudentAndTest();
                        } else {
                            this.notificationService.toastError('Không tìm thấy bài kiểm tra thường xuyên này');
                            this.notificationService.isProcessing(false);
                            this.router.navigate(['/admin/lop-hoc-phan']);
                        }
                    },
                    error: (er) => {
                        this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                        this.notificationService.isProcessing(false);
                        this.router.navigate(['/admin/lop-hoc-phan']);
                    },
                });
            } else {
                this.notificationService.isProcessing(false);
                this.router.navigate(['/admin/lop-hoc-phan']);
            }
        });
    }

    ngOnInit(): void {
        this.notificationService.setCloseLeftMenu(true);
        this.initMyClass();
    }


    connectSocket() {
        this.socket = io(getWsUrl(), {
            path: wsPath,
            reconnection: true,
            autoConnect: true,
            auth: {
                token: this.auth.accessToken,
                realm: APP_CONFIGS.realm
            },
            transports: ['websocket', 'polling'],
            secure: true,
        });

        this.socket.on('kt_tx_bat_dau_thi_'.concat(this.selectedActivity.id.toString()), (dto, cb) => {
            cb({ ok: true });
            if (dto && dto['test_id']) {
                const index = this.list_student.findIndex(m => m.test_tracnghiem && m.test_tracnghiem.id === dto['test_id']);
                if (index !== -1) {
                    this.list_student[index]['status_test'] = 1
                    this.list_student[index].test_tracnghiem.status = 1;
                }
            }
        });

        this.socket.on('kt_tx_dung_thi_'.concat(this.selectedActivity.id.toString()), (dto, cb) => {
            cb({ ok: true });
            if (dto && dto['test_id']) {
                const index = this.list_student.findIndex(m => m.test_tracnghiem && m.test_tracnghiem.id === dto['test_id']);
                if (index !== -1) {
                    this.list_student[index]['status_test'] = -2
                    this.list_student[index].test_tracnghiem.status = -2;
                }
            }
        });

        this.socket.on('kt_tx_nop_bai_'.concat(this.selectedActivity.id.toString()), (dto, cb) => {
            cb({ ok: true });
            if (dto && dto['test_id']) {
                const index = this.list_student.findIndex(m => m.test_tracnghiem && m.test_tracnghiem.id === dto['test_id']);
                if (index !== -1) {
                    this.list_student[index]['status_test'] = 2;
                    this.list_student[index].test_tracnghiem.status = 2;
                }
            }
        });
    }

    loadStudentAndTest() {
        this.status_object = {
            chualam: 0,
            danglam: 0,
            dadung: 0,
            danop: 0,
            dahuy: 0,
            unlock: 1,
            tongde: 0
        }

        const condition_count_student: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,user_id' },
                { label: 'with', value: 'user' }
            ],
            page: null,
        };

        const condition_count_test: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
                { conditionName: 'class_plan_activities_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'status,id' }
            ],
            page: null,
        };

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page: null,
        };

        this.notificationService.isProcessing(true);

        forkJoin([
            this.classPlanActivitiesTestsService.getClassPlanActivitiesTestsByPageNew(condition_count_test),
            this.classStudentService.getClassStudentByPageNew(condition_count_student),
            this.classGroupService.getClassGroupByPageNew(condition)
        ]).subscribe({
            next: ([_class_plan_test, _class_student, _class_group]) => {
                this.tongtest = _class_plan_test.recordsFiltered;
                this.tongsv = _class_student.recordsFiltered;
                this.status_object = {
                    chualam: _class_plan_test.data.filter(m => m.status === 0).length,
                    danglam: _class_plan_test.data.filter(m => m.status === 1).length,
                    dadung: _class_plan_test.data.filter(m => m.status === -2).length,
                    danop: _class_plan_test.data.filter(m => m.status === 2).length,
                    dahuy: _class_plan_test.data.filter(m => m.status === -1).length,
                    unlock: _class_student.data.filter(m => m['user'] && m['user']['is_locked'] === 0).length,
                    tongde: _class_plan_test.recordsFiltered
                }

                this.classGroups = _class_group.data || [];

                if (this.selectedGroupId && !this.classGroups.find(g => g.id === this.selectedGroupId)) {
                    this.selectedGroupId = null;
                    this.selectedGroupStudents = [];
                }

                this.notificationService.isProcessing(false);

                this.loadStudentClass(this.pageIndex);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
    }

    getStatusTestPromise(status: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const condition_count_test: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
                    { conditionName: 'class_plan_activities_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: 'and' },
                    { conditionName: 'status', condition: OvicQueryCondition.equal, value: status.toString(), orWhere: 'and' },
                ],

                set: [
                    // { label: 'limit', value:  },
                    { label: 'limit', value: '-1' },
                    { label: 'with', value: 'controls' }
                ],

                page: null
            };

            this.classPlanActivitiesTestsService.getClassPlanActivitiesTestsByPageNew(condition_count_test).subscribe({
                next: (_role) => {
                    resolve(_role.data);
                },
                error: () => {
                    this.notificationService.toastError(
                        'Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công'
                    );
                    resolve([]);
                },
            });
        });
    }

    /**
     * Gắn dữ liệu bài test vào danh sách sinh viên (logic dùng chung)
     */
    private attachTestDataToStudents(_class_student: any, _student_test_preload: ClassPlanActivitiesTests[], usePreload: boolean) {
        _class_student.data.forEach((f: any) => {
            if (usePreload) {
                const index = _student_test_preload.findIndex(m => m.student_id === f.student_id);
                if (index !== -1) {
                    f['test_tracnghiem'] = _student_test_preload[index];
                    f['has_test'] = '<span class="blue"><i class="fa fa-check"></i></span>';
                    f['lock'] = _student_test_preload[index].lock;
                    f['stopped'] = _student_test_preload[index].stopped;
                    f['status_test'] = _student_test_preload[index].status;
                    f['point'] = _student_test_preload[index].status === 2 ? _student_test_preload[index].point : '--';
                    f['violation_of_exam'] = _student_test_preload[index].violation_of_exam;
                    f['controls'] = _student_test_preload[index]['controls'];
                    if (_student_test_preload[index].violation_of_exam && _student_test_preload[index].violation_of_exam.key && f['status_test'] === 2) {
                        const idx = this.dbConfig.findIndex(m => m.key === _student_test_preload[index].violation_of_exam.key);
                        if (idx !== -1) {
                            f['point'] = parseFloat((_student_test_preload[index].point * ((100 - (Number(this.dbConfig[idx]['POINT']))) / 100)).toFixed(1));
                        }
                    }
                    if (f['status_test'] === -1) {
                        f['point'] = 0;
                    }
                } else {
                    f['point'] = '-';
                    f['status_test'] = '-';
                    f['has_test'] = '-';
                }
            }
        });
    }

    /**
     * Tạo điều kiện lấy bài test (dùng chung)
     */
    private buildTestCondition(student_ids: number[]): ConditionOption {
        return {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
                { conditionName: 'class_plan_activities_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'include', value: student_ids.toString() },
                { label: 'include_by', value: 'student_id' },
                { label: 'limit', value: this.limit_student.toString() },
                { label: 'with', value: 'controls' }
            ],
            page: null,
        };
    }

    /**
     * Xây dựng condition cho student list (dùng chung)
     */
    private buildStudentCondition(page: number): ConditionOption {
        const condition: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() },
            ],
            set: [
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'limit', value: this.limit_student.toString() },
                { label: 'with', value: 'user' }
            ],
            page: page.toString(),
        };

        if (this.search_student) {
            condition.condition.push({
                conditionName: 'user_info',
                condition: OvicQueryCondition.like,
                value: '%' + this.search_student.trim() + '%',
                orWhere: 'and',
            });
        }
        return condition;
    }

    /**
     * Xử lý filter status và trả về preload tests nếu cần
     */
    private async handleFilterStatus(condition: ConditionOption): Promise<ClassPlanActivitiesTests[]> {
        let _student_test_preload: ClassPlanActivitiesTests[] = [];
        if (this.filterStatusSelect !== 'all') {
            let status_test = 0;
            switch (this.filterStatusSelect) {
                case 'chualam': status_test = 0; break;
                case 'danglam': status_test = 1; break;
                case 'danop': status_test = 2; break;
                case 'dadung': status_test = -2; break;
                case 'dahuy': status_test = -1; break;
            }
            _student_test_preload = await this.getStatusTestPromise(status_test);
            const student_ids_in_test = [-1];
            _student_test_preload.forEach(f => student_ids_in_test.push(f.student_id));
            if (student_ids_in_test.length) {
                condition.set.push({ label: 'include', value: student_ids_in_test.toString() });
                condition.set.push({ label: 'include_by', value: 'student_id' });
            }
        }
        return _student_test_preload;
    }

    /**
     * Enrich student data với user info
     */
    private enrichStudentData(data: any[], page: number): any[] {
        const tmp = [];
        const _index_start = (page - 1) * this.limit_student;
        data.forEach((f: any, key: number) => {
            f['index_'] = _index_start + key + 1;
            f['name'] = f.user_info['name'];
            f['full_name'] = f.user_info['full_name'];
            f['first_name'] = f.user_info['full_name'] ? f.user_info['full_name'].split(' ').splice(0, f.user_info['full_name'].split(' ').length - 1).join(' ') : '-';
            f['birthday'] = f.user_info['birthday'] ? f.user_info['birthday'] : 'Không có';
            f['email'] = f.user_info['email'];
            f['student_code'] = f.user_info['student_code'];
            tmp.push(f);
        });
        return tmp;
    }

    private loadStudentData(
        page: number,
        condition: ConditionOption,
        _student_test_preload: ClassPlanActivitiesTests[],
        isFullReload: boolean
    ) {
        this.classStudentService.getClassStudentByPageNew(condition).pipe(mergeMap(_class_student => {
            const student_ids: number[] = [];
            _class_student.data.forEach((f: any) => {
                student_ids.push(f.student_id);
                f['has_test'] = false;
            });

            if (student_ids.length && this.filterStatusSelect === 'all') {
                const condition_test = this.buildTestCondition(student_ids);
                return this.classPlanActivitiesTestsService.getClassPlanActivitiesTestsByPageNew(condition_test).pipe(mergeMap(_student_test => {
                    _class_student.data.forEach((f: any) => {
                        const index = _student_test.data.findIndex(m => m.student_id === f.student_id);
                        if (index !== -1) {
                            f['test_tracnghiem'] = _student_test.data[index];
                            f['has_test'] = '<span class="blue"><i class="fa fa-check"></i></span>';
                            f['lock'] = _student_test.data[index].lock;
                            f['stopped'] = _student_test.data[index].stopped;
                            f['status_test'] = _student_test.data[index].status;
                            f['point'] = _student_test.data[index].status === 2 ? _student_test.data[index].point : '--';
                            f['violation_of_exam'] = _student_test.data[index].violation_of_exam;
                            f['controls'] = _student_test.data[index]['controls'];
                            if (_student_test.data[index].violation_of_exam && _student_test.data[index].violation_of_exam.key && f['status_test'] === 2) {
                                const idx = this.dbConfig.findIndex(m => m.key === _student_test.data[index].violation_of_exam.key);
                                if (idx !== -1) {
                                    f['point'] = parseFloat((_student_test.data[index].point * ((100 - (Number(this.dbConfig[idx]['POINT']))) / 100)).toFixed(1));
                                }
                            }
                            if (f['status_test'] === -1) {
                                f['point'] = 0;
                            }
                        } else {
                            f['point'] = '-';
                            f['status_test'] = '-';
                            f['has_test'] = '-';
                        }
                    });
                    return of(_class_student);
                }));
            } else {
                this.attachTestDataToStudents(_class_student, _student_test_preload, true);
                return of(_class_student);
            }
        })).subscribe({
            next: (_resStudent) => {
                this.total_student = _resStudent.recordsFiltered;
                if (!isFullReload) {
                    // Incremental update: chỉ update các trường trong list_student hiện tại
                    this.list_student.forEach(f => {
                        const index = _resStudent.data.findIndex((m: any) => m.id === f.id);
                        if (index !== -1) {
                            f['test_tracnghiem'] = _resStudent.data[index].test_tracnghiem;
                            f['has_test'] = _resStudent.data[index]['has_test'];
                            f['lock'] = _resStudent.data[index]['lock'];
                            f['status_test'] = _resStudent.data[index]['status_test'];
                            if (f['test_tracnghiem'] && f['test_tracnghiem'].questions) {
                                f['point'] = _resStudent.data[index]['point'];
                            }
                            f['user'] = _resStudent.data[index]['user'];
                            f['violation_of_exam'] = _resStudent.data[index]['violation_of_exam'];
                            f['controls'] = _resStudent.data[index]['controls'];
                        }
                    });
                    this.notificationService.isProcessing(false);
                } else {
                    // Full reload
                    if (_resStudent.data) {
                        this.list_student = this.enrichStudentData(_resStudent.data, page);
                    } else {
                        this.list_student = [];
                    }
                    this.notificationService.isProcessing(false);
                }
                this.startSetInterval();
            },
            error: (e) => {
                console.log(e);
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Không tải được dữ liệu, lỗi kết nối');
            },
        });
    }

    async loadStudentClass(page: number) {
        const condition = this.buildStudentCondition(page);
        this.notificationService.isProcessing(true);
        const _student_test_preload = await this.handleFilterStatus(condition);
        this.loadStudentData(page, condition, _student_test_preload, true);
    }

    startSetInterval() {
        this.closeInterval();
        this.interverTimeShiftStudent = setTimeout(() => this.interLoadStudentAndTest(), 15000);
    }

    closeInterval() {
        clearTimeout(this.interverTimeShiftStudent);
    }

    interLoadStudentAndTest() {
        this.closeInterval();

        const condition_count_student: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, user_id' },
                { label: 'with', value: 'user' }
            ],
            page: null,
        };

        const condition_count_test: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
                { conditionName: 'class_plan_activities_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'status,id' }
            ],
            page: null,
        };

        forkJoin([
            this.classPlanActivitiesTestsService.getClassPlanActivitiesTestsByPageNew(condition_count_test),
            this.classStudentService.getClassStudentByPageNew(condition_count_student)
        ]).subscribe({
            next: ([_class_plan_test, _class_student]) => {
                this.tongtest = _class_plan_test.recordsFiltered;
                this.tongsv = _class_student.recordsFiltered;
                this.status_object = {
                    chualam: _class_plan_test.data.filter(m => m.status === 0).length,
                    danglam: _class_plan_test.data.filter(m => m.status === 1).length,
                    dadung: _class_plan_test.data.filter(m => m.status === -2).length,
                    danop: _class_plan_test.data.filter(m => m.status === 2).length,
                    dahuy: _class_plan_test.data.filter(m => m.status === -1).length,
                    unlock: _class_student.data.filter(m => m['user'] && m['user']['is_locked'] === 0).length,
                    tongde: _class_plan_test.recordsFiltered
                }

                this.interLoadStudentClass(this.pageIndex);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
    }

    async interLoadStudentClass(page: number) {
        const condition = this.buildStudentCondition(page);
        const _student_test_preload = await this.handleFilterStatus(condition);
        this.loadStudentData(page, condition, _student_test_preload, false);
    }

    onChangeDateStart(event) {
        this.startDate = event;
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

        if (this.tongtest > 0) {
            let noiti = "Bạn có chắc chắn muốn mở bài kiểm tra không?";
            if (status === 0) {
                noiti = "Bạn có chắc chắn muốn đóng bài kiểm tra không?";
            }

            this.notificationService.confirm(noiti, "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.classPlanActivitiesService.updateClassPlanActivities(this.selectedActivity.id, { status: status }).pipe(mergeMap(r => {
                        if (status === 0) {
                            return this.classPlanActivitiesService.unLockLogin(this.classSelected.id).pipe(mergeMap(d => {
                                return of(null);
                            }))
                        }
                        return of(null)
                    })).subscribe({
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
        } else {
            this.notificationService.toastWarning('Vui lòng tạo đề kiểm tra trước khi mở');
        }
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
                    { conditionName: 'class_plan_activities_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: 'and' },
                ],

                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: 'student_id,id' },
                ],
                page: null,
            }

            forkJoin([
                this.classStudentService.getClassStudentByPageNew(condition_student),
                this.classPlanActivitiesTestsService.getClassPlanActivitiesTestsByPageNew(condition_test)
            ]).pipe(mergeMap(([_student, _test]) => {
                const _id_test_delete = [];
                _test.data.forEach(f => {
                    const index = _student.data.findIndex(m => m.student_id === f.student_id);
                    if (index === -1) {
                        _id_test_delete.push(f.id);
                    }
                })

                if (_id_test_delete.length) {
                    return this.classPlanActivitiesTestsService.deleteClassPlanActivitiesTests(_id_test_delete.toString()).pipe(mergeMap(() => {
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
        this.notificationService.confirm("Bạn có chắc chắn muốn tạo đề kiểm tra không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                const check = await this.checkTestPromise();
                this.elnKhoaHocService.getElnKhoaHocByCol('id', this.classSelected.course_id.toString()).pipe(mergeMap(_elnkhoa => {
                    return forkJoin([
                        this.classPlanActivitiesTestsService.sinhde(this.selectedActivity.id, _elnkhoa[0].av),
                        this.classPlanActivitiesService.updateClassPlanActivities(this.selectedActivity.id, { nhapdiem_tructiep: 0 })
                    ]).pipe(a => a)
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

    onSearchStudent(event) {
        if (this.limit_student >= this.tongsv) {
            this.search_student = null;
            this.search_student_html = event;
        } else {
            this.search_student_html = null;
            this.search_student = event;
            this.firstPageSet();
        }

    }

    firstPageSet() {
        this.loadStudentClass(1);
    }

    changePage_student(event) {
        this.limit_student = event.rows;
        this.pageIndex = event.page + 1;
        this.loadStudentClass(event.page + 1);
    }

    onChangeLock(class_student: ClassStudent) {
        if (class_student['test_tracnghiem']) {
            const lock = class_student['lock'] === 1 ? 0 : 1;
            this.notificationService.isProcessing(true);
            this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(class_student['test_tracnghiem'].id, { lock: lock }).subscribe({
                next: () => {
                    this.notificationService.isProcessing(false);
                    class_student['lock'] = lock;
                    class_student['test_tracnghiem']['lock'] = lock;
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError('Lỗi kết nối, cập nhật thất bại');
                }
            })
        } else {
            this.notificationService.toastWarning('Chưa có đề kiểm tra cho sinh viên này');
        }
    }

    onChangeStopped(class_student: ClassStudent) {
        if (class_student['test_tracnghiem']) {
            const stopped = class_student['stopped'] === 1 ? 0 : 1;
            this.notificationService.confirm(stopped === 0 ? "Bạn có chắc chắn cho sinh viên này tiếp tục làm bài kiểm tra không?" : "Bạn có chắc chắn sinh viên này đã vi phạm quy chế không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(class_student['test_tracnghiem'].id, { stopped: stopped }).subscribe({
                        next: () => {
                            this.notificationService.isProcessing(false);
                            class_student['stopped'] = stopped;
                            class_student['test_tracnghiem']['stopped'] = stopped;
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                        }
                    })
                }
            }).then(() => null)
        } else {
            this.notificationService.toastWarning('Chưa có đề kiểm tra cho sinh viên này');
        }
    }

    onChangeFilterStatus(event) {
        if (event) {
            if (this.limit_student >= this.tongsv) {
                this.filterStatusSelect = 'all';
                switch (event.value) {
                    case 'chualam':
                        this.filter_status_html = 0;
                        break;
                    case 'danglam':
                        this.filter_status_html = 1;
                        break;
                    case 'danop':
                        this.filter_status_html = 2;
                        break;
                    case 'dadung':
                        this.filter_status_html = -2;
                        break;
                    case 'dahuy':
                        this.filter_status_html = -1;
                        break;
                    default:
                        this.filter_status_html = null;
                        break;
                }
            } else {
                this.filter_status_html = null;
                this.filterStatusSelect = event.value;
                this.loadStudentClass(1);
            }
        }
    }

    onResize(width) {
        if (width < 750) {
            this.type2Class = true;
        } else {
            this.type2Class = false;
        }
    }

    deleteCode() {
        if (this.selectedStudents && this.selectedStudents.length) {
            const test_ids = [];
            this.selectedStudents.forEach(f => {
                if (f['test_tracnghiem']) {
                    if (f['test_tracnghiem']['id']) {
                        test_ids.push(f['test_tracnghiem']['id'])
                    }
                }
            })

            if (test_ids.length) {
                this.notificationService.confirmDelete().then(_a => {
                    if (_a) {
                        this.classPlanActivitiesTestsService.deleteClassPlanActivitiesTests(test_ids.toString()).subscribe({
                            next: () => {
                                this.notificationService.toastSuccess("Xóa đề thành công, vui lòng phân bổ lại đề cho sinh viên");
                                this.loadStudentAndTest();
                            },
                            error: () => {
                                this.notificationService.toastError("Xóa thất bại, vui lòng thử lại");
                            }
                        })
                    }
                })
            } else {
                this.notificationService.toastInfo("Các sinh viên được chọn đã làm bài kiểm tra, không thể xóa")
            }
        } else {
            this.notificationService.toastError("Vui lòng chọn sinh viên có đề muốn xóa");
        }
    }

    /** thao tác quản lý phòng thi */

    lockLoginAllStudent() {
        if (!this.selectedActivity.start_date) {
            return this.notificationService.toastWarning("Chưa cài đặt thời gian dự kiến");
        }

        if (new Date(this.selectedActivity.start_date).getTime() < new Date().getTime()) {
            this.notificationService.isProcessing(true);
            this.classPlanActivitiesService.lockLogin({ class_id: this.classSelected.id, expires: 60 }).subscribe({
                next: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess('Đã khóa đăng nhập sinh viên thành công');
                    this.loadStudentClass(this.pageIndex);
                },
                error: () => {
                    this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                    this.notificationService.isProcessing(false);
                }
            })
        } else {
            this.notificationService.toastWarning('Chưa đến thời gian dự kiến, không thể khóa đăng nhập')
        }
    }

    unlockLoginAllstudent() {
        this.notificationService.isProcessing(true);
        this.classPlanActivitiesService.unLockLogin(this.classSelected.id).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Đã mở khóa đăng nhập sinh viên thành công');
                this.loadStudentClass(this.pageIndex);
            },
            error: () => {
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.isProcessing(false);
            }
        })
    }

    lockLoginStudent(class_student: ClassStudent) {
        if (!this.selectedActivity.start_date) {
            return this.notificationService.toastWarning("Chưa cài đặt thời gian dự kiến");
        }

        if (new Date(this.selectedActivity.start_date).getTime() < new Date().getTime()) {
            this.notificationService.isProcessing(true);
            this.classPlanActivitiesService.lockLogin({ class_id: this.classSelected.id, student_id: class_student.student_id, expires: 60 }).subscribe({
                next: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess('Đã khóa đăng nhập sinh viên thành công');
                    this.loadStudentClass(this.pageIndex);
                },
                error: () => {
                    this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                    this.notificationService.isProcessing(false);
                }
            })
        } else {
            this.notificationService.toastWarning('Chưa đến thời gian dự kiến, không thể khóa đăng nhập')
        }
    }

    unLockLoginStudent(class_student: ClassStudent) {
        this.notificationService.isProcessing(true);
        this.classPlanActivitiesService.unLockLogin(this.classSelected.id, class_student.student_id).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Đã mở đăng nhập sinh viên thành công');
                this.loadStudentClass(this.pageIndex);
            },
            error: () => {
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.isProcessing(false);
            }
        })
    }

    getPassOfTest() {
        this.notificationService.isProcessing(true);
        this.classPlanActivitiesService.passCode(this.selectedActivity.id).subscribe({
            next: (a) => {
                this.notificationService.isProcessing(false);
                this.notificationService.confirm('<div class="pass_of_test_popup"><div><span class="font-weight-600 label-name">' + this.selectedActivity.title + '</span></div><div>Mã truy cập của tất cả sinh viên là:</div> <div class="label-pass"><span class="font-weight-600">' + a.data + '</span></div></div>', "Thông báo", [BUTTON_CLOSED]).then(() => {

                })
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    getPassOfTestStudent(class_student: ClassStudent) {
        this.selectedStudent = class_student;
        this.notificationService.isProcessing(true);
        this.classPlanActivitiesService.passCode(this.selectedActivity.id, class_student.student_id).subscribe({
            next: (a) => {
                this.notificationService.isProcessing(false);
                this.notificationService.confirm('<div class="pass_of_test_popup"><div><span class="font-weight-600 label-name">' + class_student['full_name'] + ' (' + class_student['student_code'] + ')</span></div><div>Mã truy cập bài kiểm tra là:</div> <div class="label-pass"><span class="font-weight-600">' + a.data + '</span></div></div>', "Thông báo", [BUTTON_CLOSED]).then(() => {

                })
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    pauseAndContinue(class_student: ClassStudent) {

        let key = null;

        switch (class_student['status_test']) {
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
                massage = 'Giảng viên đã dừng bài thi';
                noiti = 'Đã dừng bài thi';
                data_student.status = -2;

                break;
            case 'CONTINUE':
                massage = 'Giảng viên cho sinh viên tiếp tục thi';
                noiti = 'Đã cho sinh viên tiếp tục thi';
                data_student.status = 1;
                break;
            default:
                break;
        }

        const data: ClassPlanActivitiesTestsControl = {
            class_plan_activities_tests_id: class_student['test_tracnghiem'].id,
            type: key,
            message: massage,
            value: null,
            sender: 'GIANGVIEN',
            sender_by: this.auth.user.id,
            received_by: class_student.user_id,
            status: 0
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.classPlanActivitiesTestsControlService.addClassPlanActivitiesTestsControl(data),
            this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(class_student['test_tracnghiem'].id, data_student)
        ]).subscribe({
            next: () => {
                this.notificationService.toastSuccess(noiti);
                this.notificationService.isProcessing(false);
                this.loadStudentClass(this.pageIndex);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, cập nhật thất bại");
                this.loadStudentClass(this.pageIndex);
            }
        })
    }

    openViolationSet(class_student: ClassStudent) {

        if (!this.dbConfig || !this.dbConfig.length) {
            this.notificationService.toastWarning('Chưa có cấu hình vi phạm, vui lòng liên hệ quản trị viên');
            return;
        }

        this.acceptViolation = false;

        this.selectedStudent = class_student;

        this.displayViolation = true;

        this.violationData = {
            key: this.dbConfig[0].key,
            note: null,
            user_id: this.auth.user.id,
            title: this.dbConfig[0]['TITLE']
        }

        if (class_student['violation_of_exam']) {
            this.violationData = class_student['violation_of_exam'];
        }
    }

    saveViolation() {
        if (!this.violationData.key) {
            return this.notificationService.toastWarning("Vui lòng chọn mức độ vi phạm")
        }

        if (!this.violationData.note) {
            return this.notificationService.toastWarning("Vui lòng điền ghi chú của giảng viên");
        }

        const violation_ = this.dbConfig.find(m => m['key'] === this.violationData.key);

        if (!violation_) {
            this.notificationService.isProcessing(false);
            return this.notificationService.toastWarning("Cấu hình vi phạm không tồn tại hoặc đã bị xóa");
        }

        this.violationData.title = violation_['TITLE'];

        const data_control: ClassPlanActivitiesTestsControl = {
            class_plan_activities_tests_id: this.selectedStudent['test_tracnghiem'].id,
            type: 'VIOLATION',
            message: this.violationData.note,
            value: violation_['POINT'],
            sender: 'GIANGVIEN',
            sender_by: this.auth.user.id,
            received_by: this.selectedStudent.user_id,
            status: 0
        }

        this.notificationService.confirm("<div class='pass_of_test_popup'><div>Bạn có chắc chắn xử lý vi phạm sinh viên:</div><div><span class='font-weight-600'>" + this.selectedStudent.user_info.full_name + " - " + this.selectedStudent.user_info.student_code + "</span></div></div>", 'Xử lý vi phạm', [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                forkJoin([
                    this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(this.selectedStudent['test_tracnghiem'].id, { violation_of_exam: this.violationData, trudiem: violation_['POINT'] }),
                    this.classPlanActivitiesTestsControlService.addClassPlanActivitiesTestsControl(data_control),
                ]).subscribe({
                    next: () => {
                        if (this.violationData.key === 'DINH_CHI') {
                            const data_nopbai: ClassPlanActivitiesTestsControl = {
                                class_plan_activities_tests_id: this.selectedStudent['test_tracnghiem'].id,
                                type: 'SUBMIT',
                                message: 'giảng viên đã thu bài',
                                value: null,
                                sender: 'GIANGVIEN',
                                sender_by: this.auth.user.id,
                                received_by: this.selectedStudent.user_id,
                                status: 0
                            }
                            this.notificationService.isProcessing(true);
                            forkJoin([
                                this.classPlanActivitiesTestsControlService.addClassPlanActivitiesTestsControl(data_nopbai),
                                this.classPlanActivitiesService.nopbai(this.selectedActivity.id, this.selectedStudent.student_id)
                            ]).subscribe({
                                next: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastSuccess("Lưu thành công");
                                    this.displayViolation = false;
                                    this.loadStudentClass(this.pageIndex);
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
                            this.loadStudentClass(this.pageIndex);
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

    submitShiftStudent(class_student: ClassStudent) {

        this.selectedStudent = class_student;

        this.notificationService.confirm("Thầy/Cô có chắc chắn thu bài thi của sinh viên: <span style='font-weight-600'>" + class_student.user_info.full_name + "</span> không?", "Thu bài thi", [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                const data: ClassPlanActivitiesTestsControl = {
                    class_plan_activities_tests_id: this.selectedStudent['test_tracnghiem'].id,
                    type: 'SUBMIT',
                    message: 'giảng viên đã thu bài thi',
                    value: null,
                    sender: 'GIANGVIEN',
                    sender_by: this.auth.user.id,
                    received_by: class_student.user_id,
                    status: 0
                }

                this.notificationService.isProcessing(true);

                forkJoin([
                    this.classPlanActivitiesTestsControlService.addClassPlanActivitiesTestsControl(data),
                    this.classPlanActivitiesService.nopbai(this.selectedActivity.id, class_student.student_id),
                    this.classPlanActivitiesService.unLockLogin(this.classSelected.id, class_student.student_id)
                ]).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess('Thu bài thành công');
                        this.notificationService.isProcessing(false);
                        this.loadStudentClass(this.pageIndex);
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lỗi kết nối, cập nhật thất bại");
                        this.loadStudentClass(this.pageIndex);
                    }
                })
            } else {

            }
        })
    }



    /** ===== Nhóm sinh viên - Operations ===== */

    loadGroups() {
        if (!this.classSelected || !this.classSelected.id) {
            this.classGroups = [];
            return;
        }
        const condition: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page: null,
        };
        this.classGroupService.getClassGroupByPageNew(condition).pipe(finalize(() => {
        })).subscribe({
            next: (_res) => {
                this.classGroups = _res.data || [];
                if (this.selectedGroupId && !this.classGroups.find(g => g.id === this.selectedGroupId)) {
                    this.selectedGroupId = null;
                    this.selectedGroupStudents = [];
                }
            },
            error: () => this.classGroups = [],
        });
    }

    onGroupChange() {
        if (!this.classGroups.length) {
            this.selectedGroupStudents = [];
            this.selectedGroupMemberStudentIds = [];
            return;
        }
        const selectedGroup = this.classGroups.find(g => g.id === this.selectedGroupId);
        if (!selectedGroup) {
            this.selectedGroupStudents = [];
            this.selectedGroupMemberStudentIds = [];
            return;
        }
        // Lấy toàn bộ student_id của nhóm từ API (không phụ thuộc list_student đang hiển thị)
        const memberCondition: ConditionOption = {
            condition: [
                { conditionName: 'class_group_id', condition: OvicQueryCondition.equal, value: selectedGroup.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null,
        };
        this.notificationService.isProcessing(true);
        this.classGroupMemberService.getClassGroupMemberByPageNew(memberCondition).subscribe({
            next: (_members) => {
                this.notificationService.isProcessing(false);
                const memberStudentIds = (_members.data || []).map((m: any) => m.student_id);
                this.selectedGroupMemberStudentIds = memberStudentIds;
                // selectedGroupStudents vẫn dùng để hiển thị nhanh trong UI (chỉ lọc từ list_student hiện tại)
                if (memberStudentIds.length) {
                    this.selectedGroupStudents = this.list_student.filter(s => memberStudentIds.includes(s.student_id));
                } else {
                    this.selectedGroupStudents = [];
                }
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.selectedGroupStudents = [];
                this.selectedGroupMemberStudentIds = [];
            }
        });
    }

    openGroupActionConfirm(actionType: 'diemdanh' | 'huy_diemdanh' | 'submit') {
        if (!this.selectedGroupId || !this.selectedGroupMemberStudentIds.length) {
            this.notificationService.toastWarning('Vui lòng chọn nhóm có sinh viên trước khi thực hiện');
            return;
        }

        const groupName = this.classGroups.find(g => g.id === this.selectedGroupId)?.name || '';
        const totalGroupMembers = this.selectedGroupMemberStudentIds.length;

        this.groupActionType = actionType;

        switch (actionType) {
            case 'diemdanh':
                this.groupActionMessage = `Điểm danh (vắng mặt) tất cả ${totalGroupMembers} sinh viên trong nhóm "${groupName}"?`;
                break;
            case 'huy_diemdanh':
                this.groupActionMessage = `Điểm danh (có mặt) tất cả ${totalGroupMembers} sinh viên trong nhóm "${groupName}"?`;
                break;
            case 'submit':
                this.groupActionMessage = `Thu bài kiểm tra của các sinh viên trong nhóm "${groupName}" (${totalGroupMembers} sinh viên)?`;
                break;
        }

        this.groupActionCount = totalGroupMembers;
        this.displayGroupActionConfirm = true;
    }

    /**
     * Xây dựng Map student_id → user_id từ danh sách student_id
     */
    private buildStudentUserMap(studentIds: number[]): Observable<Map<number, number>> {
        const condition: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
            ],
            set: [
                { label: 'include', value: studentIds.toString() },
                { label: 'include_by', value: 'student_id' },
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'student_id,user_id' },
            ],
            page: null,
        };
        return this.classStudentService.getClassStudentByPageNew(condition).pipe(
            mergeMap(res => {
                const map = new Map<number, number>();
                (res.data || []).forEach((s: any) => {
                    if (s.student_id && s.user_id) {
                        map.set(s.student_id, s.user_id);
                    }
                });
                return of(map);
            })
        );
    }

    /**
     * Query bài test cho toàn bộ student_id (không phụ thuộc trang/bộ lọc hiện tại)
     */
    private queryTestsByStudentIds(studentIds: number[]): Observable<ClassPlanActivitiesTests[]> {
        const condition_test: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
                { conditionName: 'class_plan_activities_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'include', value: studentIds.toString() },
                { label: 'include_by', value: 'student_id' },
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'controls' }
            ],
            page: null,
        };
        return this.classPlanActivitiesTestsService.getClassPlanActivitiesTestsByPageNew(condition_test).pipe(
            mergeMap(res => of(res.data || []))
        );
    }

    confirmGroupAction() {
        if (!this.selectedGroupId || !this.selectedGroupMemberStudentIds.length) {
            return;
        }

        this.displayGroupActionConfirm = false;

        const allGroupStudentIds = [...this.selectedGroupMemberStudentIds];
        const groupName = this.classGroups.find(g => g.id === this.selectedGroupId)?.name || '';

        if (this.groupActionType === 'diemdanh') {
            this.notificationService.isProcessing(true);
            // Query bài test cho toàn bộ student_id trong nhóm
            this.queryTestsByStudentIds(allGroupStudentIds).subscribe({
                next: (allTests) => {
                    this.notificationService.isProcessing(false);
                    // Lọc các bài test có tồn tại để điểm danh
                    const validTests = allTests.filter(t => t.id && t.student_id);
                    const skippedCount = allGroupStudentIds.length - validTests.length;

                    if (!validTests.length) {
                        this.notificationService.toastWarning(`Không có sinh viên nào trong nhóm "${groupName}" có bài kiểm tra để điểm danh`);
                        return;
                    }

                    this.progressValue = 0;
                    this.displayModal = true;
                    this.waitingTitle = `Đang điểm danh (vắng mặt) nhóm "${groupName}"...`;

                    const requests: Observable<any>[] = [];
                    validTests.forEach(test => {
                        requests.push(this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(test.id, { lock: 1 }));
                    });

                    if (requests.length) {
                        const summaryMessage = skippedCount > 0
                            ? `Đã điểm danh (vắng mặt) nhóm "${groupName}" thành công (${validTests.length}/${allGroupStudentIds.length} sinh viên, ${skippedCount} sv bỏ qua do chưa có đề)`
                            : `Đã điểm danh (vắng mặt) nhóm "${groupName}" thành công (${validTests.length}/${allGroupStudentIds.length} sinh viên)`;

                        this.loopAddForm(requests, 0).subscribe({
                            next: () => {
                                this.displayModal = false;
                                this.notificationService.toastSuccess(summaryMessage);
                                this.loadStudentAndTest();
                            },
                            error: () => {
                                this.displayModal = false;
                                this.notificationService.toastError(`Điểm danh (vắng mặt) nhóm "${groupName}" thất bại`);
                                this.loadStudentAndTest();
                            }
                        });
                    }
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError(`Không thể lấy dữ liệu bài kiểm tra của nhóm "${groupName}"`);
                }
            });
        } else if (this.groupActionType === 'huy_diemdanh') {
            this.notificationService.isProcessing(true);
            // Query bài test cho toàn bộ student_id trong nhóm
            this.queryTestsByStudentIds(allGroupStudentIds).subscribe({
                next: (allTests) => {
                    this.notificationService.isProcessing(false);
                    // Lọc các bài test có tồn tại để hủy điểm danh
                    const validTests = allTests.filter(t => t.id && t.student_id);
                    const skippedCount = allGroupStudentIds.length - validTests.length;

                    if (!validTests.length) {
                        this.notificationService.toastWarning(`Không có sinh viên nào trong nhóm "${groupName}" có bài kiểm tra để hủy điểm danh`);
                        return;
                    }

                    this.progressValue = 0;
                    this.displayModal = true;
                    this.waitingTitle = `Đang điểm danh (có mặt) nhóm "${groupName}"...`;

                    const requests: Observable<any>[] = [];
                    validTests.forEach(test => {
                        requests.push(this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(test.id, { lock: 0 }));
                    });

                    if (requests.length) {
                        const summaryMessage = skippedCount > 0
                            ? `Đã điểm danh (có mặt) nhóm "${groupName}" thành công (${validTests.length}/${allGroupStudentIds.length} sinh viên, ${skippedCount} sv bỏ qua do chưa có đề)`
                            : `Đã điểm danh (có mặt) nhóm "${groupName}" thành công (${validTests.length}/${allGroupStudentIds.length} sinh viên)`;

                        this.loopAddForm(requests, 0).subscribe({
                            next: () => {
                                this.displayModal = false;
                                this.notificationService.toastSuccess(summaryMessage);
                                this.loadStudentAndTest();
                            },
                            error: () => {
                                this.displayModal = false;
                                this.notificationService.toastError(`Điểm danh (có mặt) nhóm "${groupName}" thất bại`);
                                this.loadStudentAndTest();
                            }
                        });
                    }
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError(`Không thể lấy dữ liệu bài kiểm tra của nhóm "${groupName}"`);
                }
            });
        } else if (this.groupActionType === 'submit') {
            this.notificationService.isProcessing(true);
            // Query bài test và mapping student_id → user_id cho toàn bộ student_id trong nhóm
            forkJoin([
                this.queryTestsByStudentIds(allGroupStudentIds),
                this.buildStudentUserMap(allGroupStudentIds)
            ]).subscribe({
                next: ([allTests, studentUserMap]) => {
                    this.notificationService.isProcessing(false);
                    // Lọc các bài test hợp lệ để thu: status không phải 2 (đã nộp), -1 (đã hủy), 0 (chưa làm)
                    // và có id
                    const validTests = allTests.filter(t =>
                        t.status !== 2 && t.status !== -1 && t.status !== 0 &&
                        t.id && t.student_id
                    );

                    const skippedCount = allGroupStudentIds.length - validTests.length;

                    if (!validTests.length) {
                        this.notificationService.toastWarning(`Không có sinh viên nào trong nhóm "${groupName}" cần thu bài`);
                        return;
                    }

                    this.progressValue = 0;
                    this.displayModal = true;
                    this.waitingTitle = `Đang thu bài nhóm "${groupName}"...`;

                    const requests: Observable<any>[] = [];
                    validTests.forEach(test => {
                        const userId = studentUserMap.get(test.student_id);
                        const data: ClassPlanActivitiesTestsControl = {
                            class_plan_activities_tests_id: test.id,
                            type: 'SUBMIT',
                            message: 'giảng viên đã thu bài thi (theo nhóm)',
                            value: null,
                            sender: 'GIANGVIEN',
                            sender_by: this.auth.user.id,
                            received_by: userId,
                            status: 0
                        };
                        requests.push(forkJoin([
                            this.classPlanActivitiesTestsControlService.addClassPlanActivitiesTestsControl(data),
                            this.classPlanActivitiesService.nopbai(this.selectedActivity.id, test.student_id),
                            this.classPlanActivitiesService.unLockLogin(this.classSelected.id, test.student_id)
                        ]));
                    });

                    if (requests.length) {
                        this.progressValue = 0;
                        this.waitingTitle = `Đang thu bài nhóm "${groupName}"...`;
                        this.groupActionType = 'submit';

                        this.loopAddFormWithTracking(requests, 0, { success: 0, failed: 0, skip: skippedCount, total: allGroupStudentIds.length, groupName }).subscribe({
                            next: (result) => {
                                this.displayModal = false;
                                const msg = `Đã thu bài nhóm "${groupName}": ${result.success} thành công, ${result.failed} thất bại, ${result.skip} bỏ qua (tổng ${result.total} sv)`;
                                if (result.failed > 0) {
                                    this.notificationService.toastWarning(msg);
                                } else {
                                    this.notificationService.toastSuccess(msg);
                                }
                                this.loadStudentAndTest();
                            },
                            error: () => {
                                this.displayModal = false;
                                this.notificationService.toastError(`Thu bài nhóm "${groupName}" thất bại`);
                                this.loadStudentAndTest();
                            }
                        });
                    }
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError(`Không thể lấy dữ liệu bài kiểm tra của nhóm "${groupName}"`);
                }
            });
        }
    }

    closeAddTime() {
        this.displayAddtime = false;
        this.displayViolation = false;
        this.displayCancel = false;
        this.displayDeleteViolaytion = false;
        this.display_thubai = false;
    }


    deleteViolation(class_student: ClassStudent) {
        this.selectedStudent = class_student;
        this.noteDeleteViolation = null;
        this.displayDeleteViolaytion = true;
    }

    startDeleteViolation() {
        if (this.noteDeleteViolation) {
            this.notificationService.confirm('Thầy/Cô có chắc chắn hủy xử lý vi phạm?', 'Xác nhận thành động', [BUTTON_YES, BUTTON_NO]).then(async a => {
                if (a.name === 'yes') {
                    const data_control: ClassPlanActivitiesTestsControl = {
                        class_plan_activities_tests_id: this.selectedStudent.test_tracnghiem.id,
                        type: 'DELETE_VIOLATION',
                        message: this.noteDeleteViolation.trim(),
                        value: 0,
                        sender: 'GIANGVIEN',
                        sender_by: this.auth.user.id,
                        received_by: this.selectedStudent.user_id,
                        status: 0
                    }

                    this.notificationService.isProcessing(true);
                    forkJoin([
                        this.classPlanActivitiesTestsControlService.addClassPlanActivitiesTestsControl(data_control),
                        this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(this.selectedStudent.test_tracnghiem.id, { violation_of_exam: null, trudiem: 0 })
                    ]).subscribe({
                        next: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastSuccess("Hủy thành công");
                            this.closeAddTime();
                            this.loadStudentClass(this.pageIndex);
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

    addTimeForShiftStudent(class_student: ClassStudent) {
        this.selectedStudent = class_student;
        this.displayAddtime = true;
        this.addTimeValue = null;
    }

    saveAddtime() {
        if (this.addTimeValue) {
            const data: ClassPlanActivitiesTestsControl = {
                class_plan_activities_tests_id: this.selectedStudent.test_tracnghiem.id,
                type: 'ADD_TIME',
                message: 'giảng viên thêm thời gian cho sinh viên làm tiếp',
                value: Number(this.addTimeValue) !== 0 ? this.addTimeValue * 60 : this.selectedStudent.test_tracnghiem.time,
                sender: 'GIANGVIEN',
                sender_by: this.auth.user.id,
                received_by: this.selectedStudent.user_id,
                status: 0
            }

            this.notificationService.isProcessing(true);
            forkJoin([
                this.classPlanActivitiesTestsControlService.addClassPlanActivitiesTestsControl(data),
                this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(this.selectedStudent.test_tracnghiem.id, { status: 1, time: this.addTimeValue * 60 })
            ]).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Thêm thời gian thành công');
                    this.notificationService.isProcessing(false);
                    this.displayAddtime = false;
                    this.loadStudentClass(this.pageIndex);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Lỗi kết nối, cập nhật thất bại");
                    this.displayAddtime = false;
                    this.loadStudentClass(this.pageIndex);
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng nhập thời gian thêm");
        }
    }

    numberKeyDown(event) {
        if (event) {
            if (!/[0-9]/.test(event.key) && event.key !== 'Backspace') {
                event.preventDefault();
            }
        }
    }

    openCancelTest(class_student: ClassStudent) {
        this.selectedStudent = class_student;
        this.displayCancel = true;
        this.messageControl = null;
    }

    cancelShiftStudent() {
        if (this.messageControl && this.messageControl.trim()) {
            this.notificationService.confirm("<div class='pass_of_test_popup'><div>Thầy/Cô có chắc chắn hủy bài của sinh viên:</div> <div><span class='font-weight-600'>" + this.selectedStudent.user_info.full_name + "</span> </div></div>", "Thông báo", [BUTTON_YES, BUTTON_NO]).then(async a => {
                if (a.name === 'yes') {
                    const data: ClassPlanActivitiesTestsControl = {
                        class_plan_activities_tests_id: this.selectedStudent.test_tracnghiem.id,
                        type: 'CANCEL',
                        message: this.messageControl,
                        value: null,
                        sender: 'GIANGVIEN',
                        sender_by: this.auth.user.id,
                        received_by: this.selectedStudent.user_id,
                        status: 0
                    }

                    this.notificationService.isProcessing(true);
                    forkJoin([
                        this.classPlanActivitiesTestsControlService.addClassPlanActivitiesTestsControl(data),
                        this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(this.selectedStudent.test_tracnghiem.id, { status: -1 })
                    ]).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess('Hủy bài thành công');
                            this.notificationService.isProcessing(false);
                            this.displayCancel = false;
                            this.loadStudentClass(this.pageIndex);
                        },
                        error: () => {
                            this.displayCancel = false;
                            this.notificationService.toastError("Lỗi kết nối, cập nhật thất bại");
                            this.loadStudentClass(this.pageIndex);
                        }
                    })
                }
            })
        } else {
            this.notificationService.toastWarning('Vui lòng nhập ghi chú');
        }
    }


    closeSideMenu() {
        this.selectedStudent = null;
        this.notificationService.closeSideNavigationMenu();
    }

    openLogStudent(class_Student: ClassStudent) {
        this.selectedStudent = null;
        this.selectedStudent = class_Student;
        this.notificationService.openSideNavigationMenu({ template: this.templateLogStudentShift, size: 900, offsetTop: '0px' });
    }


    openDialogThubai() {
        const data_ = this.list_student.filter(m => m['status_test'] !== 2 && m['status_test'] !== -1 && m['status_test'] !== 0);
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
                forkJoin([
                    this.classPlanActivitiesService.nopbai(this.selectedActivity.id),
                    this.classPlanActivitiesService.unLockLogin(this.classSelected.id)
                ]).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Đã thu bài thành công");
                        this.closeAddTime();
                        this.loadStudentClass(this.pageIndex);
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            }
        })
    }

    continueAllTest() {
        this.notificationService.confirm("Thầy/cô có chắc chắn muốn thực hiện thao tác cho tất cả sinh viên tiếp tục làm bài?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                const condition_test: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'class_id',
                            condition: OvicQueryCondition.equal,
                            value: this.selectedActivity.class_id.toString(),
                        },
                        {
                            conditionName: 'class_plan_activities_id',
                            condition: OvicQueryCondition.equal,
                            value: this.selectedActivity.id.toString(),
                            orWhere: 'and'
                        },
                        {
                            conditionName: 'status',
                            condition: OvicQueryCondition.equal,
                            value: '-2',
                            orWhere: 'and'
                        },
                    ],

                    set: [
                        { label: 'limit', value: '-1' },
                    ],
                    page: null,
                };

                this.displayModal = true;

                this.progressValue = 0;

                this.classPlanActivitiesTestsService.getClassPlanActivitiesTestsByPageNew(condition_test).subscribe({
                    next: (_test) => {
                        const request: Observable<any>[] = [];

                        _test.data.forEach(f => {
                            const data: ClassPlanActivitiesTestsControl = {
                                class_plan_activities_tests_id: f.id,
                                type: 'CONTINUE',
                                message: 'Giảng viên cho sinh viên tiếp tục thi',
                                value: null,
                                sender: 'GIANGVIEN',
                                sender_by: this.auth.user.id,
                                received_by: f['created_by'],
                                status: 0
                            }

                            request.push(forkJoin([
                                this.classPlanActivitiesTestsControlService.addClassPlanActivitiesTestsControl(data),
                                this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(f.id, { status: 1 })
                            ]))
                        })

                        if (request.length) {
                            this.loopAddForm(request, 0).subscribe({
                                next: () => {
                                    this.displayModal = false;
                                    this.notificationService.toastSuccess("Đã cho sinh viên tiếp tục thi thành công")
                                    this.loadStudentClass(1);
                                },
                                error: () => {
                                    this.displayModal = false;
                                    this.notificationService.toastError("Thao tác thất bại");
                                }
                            })
                        } else {
                            this.displayModal = false;
                            this.notificationService.toastWarning("Không có bài thi nào đang tạm dừng");
                        }
                    },
                    error: () => {
                        this.displayModal = false;
                    }
                })
            }
        })
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

    /**
     * loopAddFormWithTracking: tương tự loopAddForm nhưng tracking số lượng thành công/thất bại.
     * Bắt lỗi từng request, tăng failed nếu lỗi, tiếp tục request kế tiếp.
     * Chỉ emit summary cuối cùng sau khi xử lý hết danh sách.
     */
    private loopAddFormWithTracking(
        requests: Observable<any>[],
        key: number,
        tracking: { success: number; failed: number; skip: number; total: number; groupName: string }
    ): Observable<{ success: number; failed: number; skip: number; total: number; groupName: string }> {
        return requests[key].pipe(
            mergeMap(() => {
                tracking.success++;
                this.progressValue = (key + 1) / requests.length * 100;
                if (requests[key + 1]) {
                    return this.loopAddFormWithTracking(requests, key + 1, tracking);
                } else {
                    return of(tracking);
                }
            }),
            catchError(() => {
                tracking.failed++;
                this.progressValue = (key + 1) / requests.length * 100;
                if (requests[key + 1]) {
                    return this.loopAddFormWithTracking(requests, key + 1, tracking);
                } else {
                    return of(tracking);
                }
            })
        );
    }

    openViewTest(row: ClassStudent) {
        this.selectedStudent = row;
        if (row.test_tracnghiem && row.test_tracnghiem['questions']) {
            const condition_question: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: row.test_tracnghiem['questions'].toString() },
                    { label: 'include_by', value: 'id ' }
                ],
                page: null
            }

            const condition_aws: ConditionOption = {
                condition: [
                    { conditionName: "class_plan_activities_tests_id", condition: OvicQueryCondition.equal, value: row['test_tracnghiem'].id.toString(), orWhere: "and" }
                ],
                set: [
                    { label: 'limit', value: '-1' },
                ],
                page: null
            }

            this.notificationService.isProcessing(true);
            this.list_question = [];
            this.list_aws = [];
            forkJoin([
                this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question),
                this.classPlanActivityTestsAnswersService.getClassPlanActivityTestsAnswersByPageNew(condition_aws),
            ]).subscribe({
                next: ([_course_question, _test_aws]) => {
                    this.list_question = _course_question.data;
                    this.list_aws = _test_aws.data;
                    this.notificationService.isProcessing(false);
                    this.modalService.open(this.viewStudentTest, LARGE_MODAL_OPTIONS);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                }
            })

        } else {

        }
    }

    openWarningStudent(student: ClassStudent) {
        this.selectedStudent = student;
        this.notificationService.openSideNavigationMenu({ template: this.templateWarningStudent, size: 500, offsetTop: '0px' })
    }

    openWarning() {
        this.show_warning = !this.show_warning;
    }

    createTestTrucTiep() {
        this.notificationService.confirm("Thao tác này sẽ bỏ qua việc phân phối đề. Thầy/Cô chỉ việc nhập điểm?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                this.elnKhoaHocService.getElnKhoaHocByCol('id', this.classSelected.course_id.toString()).pipe(mergeMap(_elnkhoa => {
                    return this.classPlanActivitiesTestsService.sinhdetructiep(this.selectedActivity.id, _elnkhoa[0].av)
                })).subscribe({
                    next: () => {
                        this.selectedActivity.nhapdiem_tructiep = 1;
                        this.notificationService.toastSuccess('Cập nhật thành công');
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

    savePointTest(event, row: ClassStudent, index) {
        if (event && row['test_tracnghiem']) {
            if (row['test_tracnghiem'].point || row['test_tracnghiem'].point === 0 || row['test_tracnghiem'].point === null) {
                if (event.key === 'Enter') {
                    this.notificationService.isProcessing(true);
                    this.classPlanActivitiesTestsService.updateClassPlanActivitiesTests(row['test_tracnghiem'].id, { point: row['point'], status: 2 }).subscribe({
                        next: () => {
                            this.notificationService.isProcessing(false);

                            let i = index;
                            do {
                                i = i + 1;
                                if (this.list_student[i] && this.list_student[i].test_tracnghiem && !this.list_student[i].test_tracnghiem.questions) {
                                    this.index_focus = this.list_student[i].id;
                                }
                            } while (this.list_student[i] && this.list_student[i].test_tracnghiem && this.list_student[i].test_tracnghiem.questions);
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Lưu điểm thất bại, vui lòng thử lại");
                            row['point'] = row['test_tracnghiem'].point === -1 ? null : row['test_tracnghiem'].point;
                        }
                    })
                }
            }
        }
    }
}