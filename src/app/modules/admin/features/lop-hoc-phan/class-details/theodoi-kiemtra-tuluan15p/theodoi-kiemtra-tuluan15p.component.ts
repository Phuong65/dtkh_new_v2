import { CourseFormTuluan15pService } from '@modules/shared/services/course-form-tuluan-15p.service';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ClassPlanActivityStudentTestsService } from '@modules/shared/services/class-plan-activity-student-tests.service';
import { Component, ElementRef, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { catchError, concatMap, exhaustMap, finalize, forkJoin, from, mergeMap, Observable, of, Subject } from 'rxjs';
import { ClassStudent } from '@modules/shared/models/class-student';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { ClassPlanActivitiesService } from '@modules/shared/services/class-plan-activities.service';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { APP_CONFIGS, getWsUrl, wsPath } from '@env';
import { VIOLATION } from '@modules/shared/models/class-plan-activity-student-tests';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LARGE_MODAL_OPTIONS, ROLES } from '@modules/shared/utils/syscat';
import { ButtonModule } from 'primeng/button';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { io, Socket } from 'socket.io-client';
import { ClassPlanActivityStudentAnswersService } from '@modules/shared/services/class-plan-activity-student-answers.service';
import { ClassPlanActivityStudentAnswers } from '@modules/shared/models/class-plan-activity-student-answers';
import { MatMenuModule } from '@angular/material/menu';
import { Console, log } from 'console';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';


@Component({
    selector: 'app-theodoi-kiemtra-tuluan15p',
    templateUrl: './theodoi-kiemtra-tuluan15p.component.html',
    styleUrls: ['./theodoi-kiemtra-tuluan15p.component.css'],
    standalone: true,
    imports: [CommonModule, SharedModule, PaginatorModule, TableModule, DialogModule, ReactiveFormsModule, FormsModule, ButtonModule, NgbTooltipModule, MatMenuModule, LoadMediaOnTextDirective,
        KatexImgDirective]
})
export class TheodoiKiemtraTuluan15pComponent implements OnInit, OnDestroy {
    @ViewChild('scrollMe') private warningScroll: ElementRef;

    @ViewChild("templateWarningStudent") templateWarningStudent: TemplateRef<any>;

    @ViewChild('paginator', { static: false }) paginator: Paginator;

    @ViewChild('viewStudentTest') viewStudentTest: ElementRef;

    @ViewChildren('pointInput') pointInputs: QueryList<ElementRef>;

    isManager: boolean = false;

    userId: number;

    classSelected: Classes;

    currentWeek: number;

    tongtest: number;

    tongsv: number;

    limit_student: number = 20;

    search_student: string;

    list_student: ClassStudent[];

    total_student: number;

    courseSelected: ElnKhoaHoc;

    displayDelete: boolean = false;

    cols_student: any[] = [];

    selectedStudents: ClassStudent[];

    pageIndex: number = 1;

    status_object = {
        unlock: 1,
        opened: 0,
        chualam: 0,
        danglam: 0,
        danop: 0,
        vang: 0
    }

    displayViolation: boolean = false;

    selectedStudent: ClassStudent;

    dbConfig: any;

    violationData: VIOLATION = {
        key: null,
        note: null,
        user_id: null,
        title: null
    }

    acceptViolation: boolean = false;

    interverTimeShiftStudent: any;

    filterStatusSelect = 'all';

    list_warning: any[] = [];

    show_warning: boolean = false;

    list_question: CoursePlanActivityTuluan[];

    list_aws: ClassPlanActivityStudentAnswers[];

    studentAnswerMap: { [questionId: number]: string } = {};

    private socket: Socket;

    private submitTrigger$ = new Subject<void>();

    filterStatusHtml = {
        status: null,
        locked: null,
        closed: null
    }

    search_student_html: string;

    private savedEditingPoints: { [id: number]: { editingPoint: number; originalPoint: number; studentName: string } } = {};

    viewStudentPoint: number;

    constructor(
        private notificationService: NotificationService,
        private activatedRoute: ActivatedRoute,
        private classesService: ClassesService,
        private router: Router,
        private auth: AuthService,
        private classStudentService: ClassStudentService,
        private classPlanActivityStudentTestsService: ClassPlanActivityStudentTestsService,
        private elnKhoaHocService: ElnKhoaHocService,
        private classPlanActivitiesService: ClassPlanActivitiesService,
        private modalService: NgbModal,
        private classPlanActivityStudentAnswersService: ClassPlanActivityStudentAnswersService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private courseFormTuluan15pService: CourseFormTuluan15pService
    ) {
        this.userId = this.auth.user.id;

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.troly_pdt) ? true : false;

        this.displayDelete = this.isManager;

        this.cols_student = [
            { label: '#', class: 'ovic-w-50px text-center', key: 'index_', html: false },
            { label: 'Họ và tên', class: 'with-350px text-left', key: 'full_name', html: false, private: true },
            { label: 'Điểm danh', class: 'ovic-w-100px text-center', key: 'locked', private: true },
            { label: 'Đã kích hoạt KT', class: 'ovic-w-100px text-center', key: 'closed', private: true },
            { label: 'Trạng thái', class: 'ovic-w-150px text-center', key: 'status_test', html: true, private: true },
            { label: 'Có đề', class: 'ovic-w-50px text-center', key: 'has_test', html: true },
            { label: 'Điểm', class: 'ovic-w-100px text-center', key: 'point', html: true, private: true },
            { label: 'Tổng điểm', class: 'ovic-w-100px text-center', key: 'tong_diem', private: true },
            { label: 'Thiết bị', class: 'ovic-w-100px text-center', key: 'device' },
            { label: 'Vi phạm quy chế', class: 'ovic-w-120px text-center', key: 'violation', private: true },
            { label: 'Ghi chú', class: 'ovic-w-120px text-center', key: 'note_vipham', private: false },

        ];


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
    }

    ngOnDestroy(): void {
        this.closeInterval();
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    ngOnInit(): void {
        this.notificationService.setCloseLeftMenu(true);

        this.createTest();

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

        this.socket.on('kt_daugio_'.concat(this.classSelected.id.toString(), '_', this.currentWeek.toString(), "_checkin"), (dto, cb) => {
            cb({ ok: true });
            if (dto && dto['test_id'] && this.list_student) {
                const index = this.list_student.findIndex(m => m['student_test'] && m['student_test'].id === dto['test_id']);
                if (index !== -1) {
                    this.list_student[index]['status_test'] = 0;
                    this.list_student[index]['student_test']['status'] = 0;
                }
            }
        });

        this.socket.on('kt_daugio_'.concat(this.classSelected.id.toString(), '_', this.currentWeek.toString(), "_warning"), (dto, cb) => {
            cb({ ok: true });
            if (dto && dto['test_id'] && this.list_student) {
                if (dto['student']) {
                    const data = {
                        student_code: dto['student']['student_code'],
                        full_name: dto['student']['full_name'],
                    }

                    if (dto['tracking'] && dto['tracking']['warnings'] && dto['tracking']['warnings'].length) {
                        data['time'] = dto['tracking']['warnings'][dto['tracking']['warnings'].length - 1];
                    }

                    const index = this.list_student.findIndex(m => m['student_test'] && m['student_test'].id === dto['test_id']);
                    if (index !== -1) {
                        this.list_student[index]['student_test']['tracking'] = dto['tracking'];
                    }
                    this.list_warning.push(data);
                }
                // this.interLoadStudentAndTest();
            }
        });

        this.socket.on('kt_daugio_'.concat(this.classSelected.id.toString(), '_', this.currentWeek.toString(), "_submit"), (dto, cb) => {
            cb({ ok: true });
            if (dto && dto['test_id'] && this.list_student) {
                const index = this.list_student.findIndex(m => m['student_test'] && m['student_test'].id === dto['test_id']);
                if (index !== -1) {
                    let status = 1;

                    this.list_student[index]['point'] = "Đang tính điểm";

                    if (dto['submit_by'] && parseInt(dto['submit_by']) === 0) {
                        status = 2;
                    }

                    if (dto['submit_by'] && parseInt(dto['submit_by']) !== this.list_student[index].user_id && parseInt(dto['submit_by']) !== 0) {
                        status = 3;
                    }

                    if (dto['note_vipham']) {
                        this.list_student[index]['note_vipham'] = dto['note_vipham'];
                        this.list_student[index]['student_test']['note_vipham'] = dto['note_vipham'];
                    }

                    this.list_student[index]['status_test'] = status;
                    this.list_student[index]['student_test']['status'] = 1;
                }
            }
        });
    }


    getCourse(course_id: number): Promise<any> {
        if (course_id) {
            return new Promise((resolve, reject) => {
                this.elnKhoaHocService.getElnKhoaHocByItem(course_id.toString(), 'id').subscribe({
                    next: (_course) => {
                        if (_course.length) {
                            resolve(_course[0])
                        } else {
                            resolve(null)
                        }
                    },
                    error: () => {
                        resolve(null)
                    }
                })

            });
        }
        return null;
    }

    initMyClass() {
        this.notificationService.isProcessing(true);
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                const class_id = params['code'];
                this.currentWeek = Number(params['test']);
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

                forkJoin([
                    this.classesService.getClassesByPageNew(condition_class),
                ]).subscribe({
                    next: async ([cl]) => {
                        if (cl.recordsFiltered) {
                            this.classSelected = cl.data[0];
                            if (this.classSelected.manager_ids) {
                                const giangvien_ar = this.classSelected.manager_ids.split('|').filter(m => m);
                                const _index_gv = giangvien_ar.findIndex(m => m.toString() === this.auth.user.id.toString());
                                if (_index_gv === -1 && !this.isManager) {
                                    this.notificationService.toastError('Không tìm thấy bài kiểm tra');
                                    this.router.navigate(['/admin/lop-hoc-phan']);
                                }
                            } else if (!this.isManager) {
                                this.notificationService.toastError('Không tìm thấy bài kiểm tra');
                                this.router.navigate(['/admin/lop-hoc-phan']);
                            }

                            this.auth.setFeatureSecondary(cl.data[0].name.concat(" - Bài kiểm tra tự luận 15P tuần ", this.currentWeek.toString()));

                            if (this.classSelected.course_id) {
                                this.courseSelected = await this.getCourse(this.classSelected.course_id);
                            }
                            this.connectSocket();
                            this.loadStudentAndTest();
                        } else {
                            this.notificationService.toastError('Không tìm thấy bài kiểm tra');
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

    loadStudentAndTest() {
        this.closeInterval();
        const condition_count_student: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() },
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
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: this.currentWeek.toString(), orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: "KT_TULUAN", orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'status,id,closed,locked' }
            ],
            page: null,
        };

        this.notificationService.isProcessing(true);

        forkJoin([
            this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_count_test),
            this.classStudentService.getClassStudentByPageNew(condition_count_student)
        ]).subscribe({
            next: ([_class_plan_test, _class_student]) => {
                this.status_object = {
                    unlock: _class_student.data.filter(m => m['user'] && m['user']['is_locked'] === 0).length,
                    opened: _class_plan_test.data.filter(m => m.closed === 0).length,
                    chualam: _class_plan_test.data.filter(m => m.status === -1).length,
                    danglam: _class_plan_test.data.filter(m => m.status === 0).length,
                    danop: _class_plan_test.data.filter(m => m.status === 1).length,
                    vang: _class_plan_test.data.filter(m => m.locked === 1).length
                }
                this.tongtest = _class_plan_test.recordsFiltered;
                this.tongsv = _class_student.recordsFiltered;
                this.loadStudentClass(this.pageIndex);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
    }

    getStatusTestPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const condition_count_test: ConditionOption = {
                condition: [
                    { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() },
                    { conditionName: 'week', condition: OvicQueryCondition.equal, value: this.currentWeek.toString(), orWhere: 'and' },
                    { conditionName: 'type', condition: OvicQueryCondition.equal, value: "KT_TULUAN", orWhere: 'and' },
                ],

                set: [
                    // { label: 'limit', value:  },
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: 'student_id' }
                ],

                page: null,
            };

            if (this.filterStatusSelect !== 'all') {

                switch (this.filterStatusSelect) {
                    case 'vang':
                        condition_count_test.condition.push({ conditionName: 'locked', condition: OvicQueryCondition.equal, value: "1", orWhere: 'and' });
                        break;
                    case 'opened':
                        condition_count_test.condition.push({ conditionName: 'closed', condition: OvicQueryCondition.equal, value: "0", orWhere: 'and' });
                        break;
                    case 'chualam':
                        condition_count_test.condition.push({ conditionName: 'status', condition: OvicQueryCondition.equal, value: "-1", orWhere: 'and' });
                        break;
                    case 'danglam':
                        condition_count_test.condition.push({ conditionName: 'status', condition: OvicQueryCondition.equal, value: "0", orWhere: 'and' });
                        break;
                    case 'danop':
                        condition_count_test.condition.push({ conditionName: 'status', condition: OvicQueryCondition.equal, value: "1", orWhere: 'and' });
                        break;
                    default:
                        break;
                }

                this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_count_test).subscribe({
                    next: (_role) => {
                        resolve(_role.data.map(m => m.student_id));
                    },
                    error: () => {
                        this.notificationService.toastError(
                            'Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công'
                        );
                        resolve(null);
                    },
                });
            } else {
                resolve(null);
            }
        });
    }


    async loadStudentClass(page: number) {
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

        if (this.filterStatusSelect !== 'all') {
            const _student_test_preload = await this.getStatusTestPromise();
            if (_student_test_preload !== null) {
                _student_test_preload.push(0);
                condition.set.push({
                    label: 'include', value: _student_test_preload.toString()
                });

                condition.set.push({
                    label: 'include_by', value: 'student_id'
                })
            }
        }


        this.classStudentService.getClassStudentByPageNew(condition).pipe(mergeMap(_class_student => {
            const student_ids = _class_student.data.map(m => m.student_id);
            if (student_ids.length) {
                const condition_student: ConditionOption = {
                    condition: [
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.equal, value: this.currentWeek.toString(), orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_TULUAN', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: student_ids.toString() },
                        { label: 'include_by', value: 'student_id' },
                        { label: 'select', value: 'locked,closed,status,student_id,point,id,violation_of_exam,note_vipham,vipham,tracking,submit_by,questions,trangthai_cham,tong_diem' }
                    ],
                    page: null
                }

                return this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_student).pipe(mergeMap(_student_test => {
                    _class_student.data.forEach(f => {
                        const index = _student_test.data.findIndex(m => m.student_id === f.student_id);
                        f['has_test'] = '-';
                        if (index !== -1) {
                            const trangthai_cham = _student_test.data[index]['trangthai_cham'];
                            const point_raw = _student_test.data[index].point;
                            const point = point_raw / 10;
                            f['student_test'] = _student_test.data[index];
                            f['point'] = trangthai_cham === 1 ? point : null;
                            f['editingPoint'] = trangthai_cham === 1 ? point : null;
                            f['status_test'] = _student_test.data[index].status;
                            f['locked'] = _student_test.data[index].locked;
                            f['closed'] = _student_test.data[index].closed;
                            f['has_test'] = '<span class="blue"><i class="fa fa-check"></i></span>';
                            f['note_vipham'] = _student_test.data[index]['note_vipham'];
                            f['violation_of_exam'] = _student_test.data[index].violation_of_exam;
                            f['device'] = _student_test.data[index]['tracking'] && _student_test.data[index]['tracking']['starts'] ? _student_test.data[index]['tracking']['starts'][0]['device'] : '';
                            f['status_info_test'] = _student_test.data[index].status;
                            f['trangthai_cham'] = trangthai_cham;
                            f['tong_diem'] = trangthai_cham === 1 && _student_test.data[index]['tong_diem'] !== undefined ? Number(_student_test.data[index]['tong_diem']) / 10 : null;

                            if (_student_test.data[index].status === 0 && _student_test.data[index].closed === 1) {
                                f['status_test'] = -2;
                            }

                            if (_student_test.data[index].status === 1 && _student_test.data[index]["submit_by"] === 0) {
                                f['status_test'] = 2;
                            }

                            if (_student_test.data[index].status === 1 && _student_test.data[index]["submit_by"] !== f.user_id && _student_test.data[index]["submit_by"] !== 0) {
                                f['status_test'] = 3;
                            }

                            if (_student_test.data[index].violation_of_exam && _student_test.data[index].violation_of_exam.key && _student_test.data[index].status === 1) {
                                const index_ = this.dbConfig.findIndex(m => m.key === _student_test.data[index].violation_of_exam.key);
                                if (index_ !== -1) {
                                    f['point'] = parseFloat((point * ((100 - (Number(this.dbConfig[index_]['POINT']))) / 100)).toFixed(1));
                                }
                            }

                        }
                    })
                    return of(_class_student);
                }))
            }
            return of(_class_student);
        })).subscribe({
            next: (_resStudent) => {
                this.total_student = _resStudent.recordsFiltered;
                if (_resStudent.data) {
                    const tmp = [];
                    const _index_start = (page - 1) * this.limit_student;
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

                // restore saved editing points after page change
                if (Object.keys(this.savedEditingPoints).length && this.list_student) {
                    this.list_student.forEach(row => {
                        if (row['student_test'] && this.savedEditingPoints[row['student_test'].id] !== undefined) {
                            row['editingPoint'] = this.savedEditingPoints[row['student_test'].id].editingPoint;
                        }
                    });
                }
                this.notificationService.isProcessing(false);
                this.startSetInterval();
            },
            error: (e) => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Không tải được dữ liệu, lỗi kết nối');
            },
        })
    }

    triggerSubmit() {
        if (!this.courseSelected) return;
        this.submitTrigger$.next();
    }

    createTest() {
        // if (this.courseSelected) {
        //     this.notificationService.isProcessing(true);
        //     this.classPlanActivityStudentTestsService.phanBodeKtDaugio({ class_id: this.classSelected.id, course_id: this.classSelected.course_id, week: this.currentWeek, av: this.courseSelected.av }).subscribe({
        //         next: () => {
        //             this.notificationService.isProcessing(false);
        //             this.notificationService.toastSuccess("Phân bổ đề thành công");
        //             this.loadStudentAndTest();
        //         },
        //         error: () => {
        //             this.notificationService.isProcessing(false);
        //             this.notificationService.toastError("Phân bổ đề thất bại");
        //         }
        //     })
        // }

        this.submitTrigger$.pipe(
            exhaustMap(() => {
                this.notificationService.isProcessing(true);
                return this.classPlanActivityStudentTestsService.sinhdeTuluan15P({
                    class_id: this.classSelected.id,
                    course_id: this.classSelected.course_id,
                    week: this.currentWeek,
                    av: this.courseSelected.av
                }).pipe(
                    finalize(() => this.notificationService.isProcessing(false))
                );
            })
        ).subscribe({
            next: () => {
                this.notificationService.toastSuccess("Phân bổ đề thành công");
                this.loadStudentAndTest();
            },
            error: () => {
                this.notificationService.toastError("Phân bổ đề thất bại");
            }
        });
    }

    onPointKeydown(event: KeyboardEvent, index: number) {
        if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            const inputs = this.pointInputs?.toArray();
            if (inputs && index + 1 < inputs.length) {
                inputs[index + 1].nativeElement.focus();
            }
        }
    }

    changePage_student(event) {
        this.limit_student = event.rows;
        this.pageIndex = event.page + 1;
        // save editing points before loading new page
        if (this.list_student) {
            this.list_student.forEach(row => {
                if (row['student_test'] && row['editingPoint'] !== undefined && row['editingPoint'] !== null) {
                    const newPoint = Math.round(Number(row['editingPoint']) * 10);
                    if (newPoint !== row['student_test'].point) {
                        this.savedEditingPoints[row['student_test'].id] = {
                            editingPoint: row['editingPoint'],
                            originalPoint: row['student_test'].point,
                            studentName: row['full_name']
                        };
                    }
                }
            });
        }
        this.notificationService.isProcessing(true);
        this.loadStudentClass(event.page + 1);
    }

    onSearchStudent(event) {
        if (event) {
            if (this.limit_student >= this.tongsv) {
                if (event.target.value && event.target.value.trim()) {
                    if (event.code === "Enter") {
                        this.search_student = null;
                        this.search_student_html = event.target.value;
                    }
                } else {
                    this.search_student_html = null;
                }
            } else {
                this.search_student_html = null;
                if (event.target.value && event.target.value.trim()) {
                    this.search_student = event.target.value;
                    if (event.code === "Enter") {
                        this.notificationService.isProcessing(true);
                        this.firstPageSet();
                    }
                } else {
                    this.search_student = null;
                    this.notificationService.isProcessing(true);
                    this.firstPageSet();
                }
            }
        }
    }

    firstPageSet() {
        if (!this.paginator.empty()) {
            this.paginator.changePage(0);
        } else {
            this.loadStudentClass(1);
        }
    }

    onChangeLock(class_student: ClassStudent) {
        if (class_student['student_test']) {
            const locked = class_student['locked'] === 1 ? 0 : 1;
            this.notificationService.isProcessing(true);
            this.classPlanActivityStudentTestsService.updateClassPlanActivityStudentTests(class_student['student_test'].id, { locked: locked }).subscribe({
                next: () => {
                    this.notificationService.isProcessing(false);
                    this.loadStudentAndTest();
                },
                error: () => {
                    this.notificationService.toastError("Điểm danh thất bại, vui lòng thử lại");
                }
            })
        } else {
            this.notificationService.toastWarning('Chưa có đề kiểm tra cho sinh viên này');
        }
    }

    onChangeClosed(class_student: ClassStudent) {
        if (class_student['student_test']) {
            const closed = class_student['closed'] === 1 ? 0 : 1;
            let request: Observable<any> = this.classPlanActivitiesService.lockLogin({ class_id: this.classSelected.id, student_id: class_student.student_id, expires: 15 })
            if (closed === 1) {
                request = this.classPlanActivitiesService.unLockLogin(this.classSelected.id, class_student.student_id)
            }
            this.notificationService.isProcessing(true);
            forkJoin([
                request,
                this.classPlanActivityStudentTestsService.updateClassPlanActivityStudentTests(class_student['student_test'].id, { closed: closed })
            ]).pipe(mergeMap(a => {
                // if (closed === 1) {
                //     return this.classPlanActivityStudentTestsService.nopBaiOne(class_student['student_test'].id).pipe(mergeMap(a => {
                //         return of(null)
                //     }))
                // }
                return of(null)
            })).subscribe({
                next: () => {
                    this.notificationService.isProcessing(false);
                    this.loadStudentAndTest();
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Mở khóa thất bại, vui lòng thử lại");
                }
            })
        } else {
            this.notificationService.toastWarning('Chưa có đề kiểm tra cho sinh viên này');
        }
    }

    unLockLoginStudent(class_student: ClassStudent) {
        this.notificationService.isProcessing(true);
        this.classPlanActivitiesService.unLockLogin(this.classSelected.id, class_student.student_id).subscribe({
            next: () => {
                this.notificationService.toastSuccess('Đã mở đăng nhập sinh viên thành công');
                this.loadStudentClass(this.pageIndex);
            },
            error: () => {
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.isProcessing(false);
            }
        })
    }

    lockLoginStudent(class_student: ClassStudent) {
        this.notificationService.isProcessing(true);
        this.classPlanActivitiesService.lockLogin({ class_id: this.classSelected.id, student_id: class_student.student_id, expires: 15 }).subscribe({
            next: () => {
                this.notificationService.toastSuccess('Đã khóa đăng nhập sinh viên thành công');
                this.loadStudentClass(this.pageIndex);
            },
            error: () => {
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.isProcessing(false);
            }
        })
    }

    openAllTest() {
        // if (this.status_object.unlock !== 0) {
        //     return this.notificationService.toastWarning("Vui lòng khóa đăng nhập tất cả sinh viên")
        // }

        this.notificationService.confirm("Thầy/Cô có chắc chắn mở khóa tất cả bài kiểm tra", "Mở khóa bài kiểm tra", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === "yes") {
                this.notificationService.isProcessing(true);
                forkJoin([
                    this.classPlanActivitiesService.lockLogin({ class_id: this.classSelected.id, expires: 15 }),
                    this.classPlanActivityStudentTestsService.openAllTest({ class_id: this.classSelected.id, week: this.currentWeek })
                ]).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess('Mở khóa bài kiểm tra thành công');
                        this.loadStudentAndTest();
                    },
                    error: () => {
                        this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        })
    }

    closedAllTest() {
        this.notificationService.confirm("Thầy/Cô có chắc chắn khóa tất cả bài kiểm tra", "Khóa bài kiểm tra", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === "yes") {
                this.notificationService.isProcessing(true);
                forkJoin([
                    this.classPlanActivitiesService.unLockLogin(this.classSelected.id),
                    this.classPlanActivityStudentTestsService.closedAllTest({ class_id: this.classSelected.id, week: this.currentWeek }),
                ]).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess('Mở khóa bài kiểm tra thành công');
                        this.loadStudentAndTest();
                    },
                    error: () => {
                        this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        })
    }

    lockLoginAllStudent() {
        this.notificationService.isProcessing(true);
        this.classPlanActivitiesService.lockLogin({ class_id: this.classSelected.id, expires: 15 }).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Đã khóa đăng nhập sinh viên thành công');
                this.loadStudentAndTest();
            },
            error: () => {
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.isProcessing(false);
            }
        })
    }

    unlockLoginAllstudent() {
        this.notificationService.isProcessing(true);
        this.classPlanActivitiesService.unLockLogin(this.classSelected.id).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Đã mở khóa đăng nhập sinh viên thành công');
                this.loadStudentAndTest();
            },
            error: () => {
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.isProcessing(false);
            }
        })
    }


    closeAddTime() {
        this.displayViolation = false;
    }

    saveViolation() {
        if (!this.violationData.key) {
            return this.notificationService.toastWarning("Vui lòng chọn mức độ vi phạm")
        }

        const violation_ = this.dbConfig.find(m => m['key'] === this.violationData.key);

        this.violationData.title = violation_['TITLE'];

        this.notificationService.confirm("<div class='pass_of_test_popup'><div>Bạn có chắc chắn xử lý vi phạm sinh viên:</div><div><span class='font-weight-600'>" + this.selectedStudent.user_info.full_name + " - " + this.selectedStudent.user_info.student_code + "</span></div></div>", 'Xử lý vi phạm', [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                this.classPlanActivityStudentTestsService.updateClassPlanActivityStudentTests(this.selectedStudent['student_test'].id, { violation_of_exam: this.violationData, trudiem: violation_['POINT'] }).subscribe({
                    next: () => {
                        this.displayViolation = false;
                        this.loadStudentClass(this.pageIndex);
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lưu thất bại");
                    }
                })
            }
        })
    }

    openViolationSet(class_student: ClassStudent) {
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

    deleteViolation(class_student: ClassStudent) {
        this.selectedStudent = class_student;
        this.notificationService.isProcessing(true);
        this.classPlanActivityStudentTestsService.updateClassPlanActivityStudentTests(this.selectedStudent['student_test'].id, { violation_of_exam: null, trudiem: 0 }).subscribe({
            next: () => {
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

    interLoadStudentAndTest() {
        this.closeInterval();
        const condition_count_student: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() },
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
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: this.currentWeek.toString(), orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: "KT_TULUAN", orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'status,id,closed,locked' }
            ],
            page: null,
        };





        forkJoin([
            this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_count_test),
            this.classStudentService.getClassStudentByPageNew(condition_count_student)
        ]).subscribe({
            next: ([_class_plan_test, _class_student]) => {
                this.status_object = {
                    unlock: _class_student.data.filter(m => m['user'] && m['user']['is_locked'] === 0).length,
                    opened: _class_plan_test.data.filter(m => m.closed === 0).length,
                    chualam: _class_plan_test.data.filter(m => m.status === -1).length,
                    danglam: _class_plan_test.data.filter(m => m.status === 0).length,
                    danop: _class_plan_test.data.filter(m => m.status === 1).length,
                    vang: _class_plan_test.data.filter(m => m.locked === 1).length
                }
                this.tongtest = _class_plan_test.recordsFiltered;
                this.tongsv = _class_student.recordsFiltered;
                this.interLoadStudentClass(this.pageIndex);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
    }

    async interLoadStudentClass(page) {

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

        if (this.filterStatusSelect !== 'all') {
            const _student_test_preload = await this.getStatusTestPromise();
            if (_student_test_preload !== null) {
                _student_test_preload.push(0);
                condition.set.push({
                    label: 'include', value: _student_test_preload.toString()
                });

                condition.set.push({
                    label: 'include_by', value: 'student_id'
                })
            }
        }


        this.classStudentService.getClassStudentByPageNew(condition).pipe(mergeMap(_class_student => {
            const student_ids = _class_student.data.map(m => m.student_id);
            if (student_ids.length) {
                const condition_student: ConditionOption = {
                    condition: [
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.equal, value: this.currentWeek.toString(), orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_TULUAN', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: student_ids.toString() },
                        { label: 'include_by', value: 'student_id' },
                        { label: 'select', value: 'locked,closed,status,student_id,point,id,violation_of_exam,note_vipham,vipham,tracking,submit_by,questions,trangthai_cham,tong_diem' }
                    ],
                    page: null
                }

                return this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_student).pipe(mergeMap(_student_test => {
                    _class_student.data.forEach(f => {
                        const index = _student_test.data.findIndex(m => m.student_id === f.student_id);
                        f['has_test'] = '-';
                        if (index !== -1) {
                            const trangthai_cham = _student_test.data[index]['trangthai_cham'];
                            const point_raw = _student_test.data[index].point;
                            const point = point_raw / 10;
                            f['student_test'] = _student_test.data[index];
                            f['point'] = trangthai_cham === 1 ? point : null;
                            f['status_test'] = _student_test.data[index].status;
                            f['locked'] = _student_test.data[index].locked;
                            f['closed'] = _student_test.data[index].closed;
                            f['has_test'] = '<span class="blue"><i class="fa fa-check"></i></span>';
                            f['violation_of_exam'] = _student_test.data[index].violation_of_exam;
                            f['note_vipham'] = _student_test.data[index]['note_vipham'];
                            f['status_info_test'] = _student_test.data[index].status;
                            f['trangthai_cham'] = trangthai_cham;
                            f['tong_diem'] = trangthai_cham === 1 && _student_test.data[index]['tong_diem'] !== undefined ? Number(_student_test.data[index]['tong_diem']) / 10 : null;

                            if (_student_test.data[index].status === 0 && _student_test.data[index].closed === 1) {
                                f['status_test'] = -2;
                            }

                            if (_student_test.data[index].status === 1 && _student_test.data[index]["submit_by"] === 0) {
                                f['status_test'] = 2;
                            }

                            if (_student_test.data[index].status === 1 && _student_test.data[index]["submit_by"] !== f.user_id && _student_test.data[index]["submit_by"] !== 0) {
                                f['status_test'] = 3;
                            }

                            f['device'] = _student_test.data[index]['tracking'] && _student_test.data[index]['tracking']['starts'] ? _student_test.data[index]['tracking']['starts'][0]['device'] : '';

                            if (_student_test.data[index].violation_of_exam && _student_test.data[index].violation_of_exam.key && _student_test.data[index].status === 1) {
                                const index_ = this.dbConfig.findIndex(m => m.key === _student_test.data[index].violation_of_exam.key);
                                if (index_ !== -1) {
                                    f['point'] = parseFloat((point * ((100 - (Number(this.dbConfig[index_]['POINT']))) / 100)).toFixed(1));
                                }
                            }

                        }
                    })
                    return of(_class_student);
                }))
            }
            return of(_class_student);
        })).subscribe({
            next: (_resStudent) => {
                this.list_student.forEach(f => {
                    const index = _resStudent.data.findIndex(m => m.id === f.id);
                    if (index !== -1) {
                        f['student_test'] = _resStudent.data[index]['student_test'];
                        f['has_test'] = _resStudent.data[index]['has_test'];
                        f['locked'] = _resStudent.data[index]['locked'];
                        f['status_test'] = _resStudent.data[index]['status_test'];
                        f['point'] = _resStudent.data[index]['point'];
                        f['tong_diem'] = _resStudent.data[index]['tong_diem'];
                        f['user'] = _resStudent.data[index]['user'];
                        f['closed'] = _resStudent.data[index]['closed'];
                        f['violation_of_exam'] = _resStudent.data[index]['violation_of_exam'];
                        f['note_vipham'] = _resStudent.data[index]['note_vipham'];
                        f['device'] = _resStudent.data[index]['device'];
                        f['status_info_test'] = _resStudent.data[index]['status_info_test'];
                    }
                })

                this.startSetInterval();
            },
            error: (e) => {
                this.notificationService.toastError('Không tải được dữ liệu, lỗi kết nối');
            },
        })
    }

    startSetInterval() {
        this.interverTimeShiftStudent = setTimeout(() => this.interLoadStudentAndTest(), 15000);
    }

    closeInterval() {
        clearTimeout(this.interverTimeShiftStudent);
    }

    onChangeFilterStatus(event) {

        if (event) {
            if (this.limit_student >= this.tongsv) {
                this.filterStatusSelect = null;
                switch (event.value) {
                    case 'vang':
                        this.filterStatusHtml = {
                            status: null,
                            locked: 1,
                            closed: null
                        }
                        break;
                    case 'opened':
                        this.filterStatusHtml = {
                            status: null,
                            locked: null,
                            closed: 0
                        }
                        break;
                    case 'chualam':
                        this.filterStatusHtml = {
                            status: -1,
                            locked: null,
                            closed: null
                        }
                        break;
                    case 'danglam':
                        this.filterStatusHtml = {
                            status: 0,
                            locked: null,
                            closed: null
                        }
                        break;
                    case 'danop':
                        this.filterStatusHtml = {
                            status: 1,
                            locked: null,
                            closed: null
                        }
                        break;
                    default:
                        this.filterStatusHtml = {
                            status: null,
                            locked: null,
                            closed: null
                        }
                        break;
                }
            } else {
                this.filterStatusHtml = {
                    status: null,
                    locked: null,
                    closed: null
                }
                this.filterStatusSelect = event.value;
                this.notificationService.isProcessing(true);
                this.loadStudentClass(1);
            }
        }
    }

    deleteTest() {
        if (this.selectedStudents && this.selectedStudents.length) {
            this.notificationService.confirmDelete().then(a => {
                if (a) {
                    const ids = [];
                    this.selectedStudents.forEach(f => {
                        if (f['student_test']) {
                            ids.push(f['student_test'].id)
                        }
                    })
                    if (ids.length) {
                        this.notificationService.isProcessing(true);
                        this.classPlanActivityStudentTestsService.deleteClassPlanActivityStudentTests(ids.toString()).subscribe({
                            next: () => {
                                this.selectedStudents = null;
                                this.loadStudentAndTest();
                            },
                            error: () => {
                                this.notificationService.isProcessing(false);
                            }
                        })
                    } else {
                        this.notificationService.toastInfo("Không tìm thấy đề cần xóa");
                    }
                }
            })
        } else {
            this.notificationService.toastInfo("Không tìm thấy đề cần xóa");
        }
    }

    nopBaiAll() {
        this.notificationService.confirm("Thầy/Cô có chắc muốn gửi yêu cầu nộp bài cho tất cả sinh viên đang làm bài không?", "Yêu cầu nộp bài", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === "yes") {
                this.classPlanActivityStudentTestsService.nopBaiAllTest({ class_id: this.classSelected.id, week: this.currentWeek }).subscribe({
                    next: () => {
                        this.loadStudentAndTest();
                    },
                    error: () => {
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            }
        })
    }

    closeSideMenu() {
        this.notificationService.closeSideNavigationMenu();
    }

    nopBaiOne(student) {
        this.notificationService.confirm("Thầy/Cô có chắc muốn gửi yêu cầu nộp bài?", "Yêu cầu nộp bài", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === "yes") {
                this.classPlanActivityStudentTestsService.nopBaiOne(student["student_test"].id).subscribe({
                    next: () => {
                        this.loadStudentAndTest();
                    },
                    error: () => {
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            }
        })
    }

    openWarning() {
        this.show_warning = !this.show_warning;
    }

    scrollToBottom(): void {
        try {
            this.warningScroll.nativeElement.scrollTop = this.warningScroll.nativeElement.scrollHeight + 40;
        } catch (err) {

        }
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    openWarningStudent(student: ClassStudent) {
        this.selectedStudent = student;
        this.notificationService.openSideNavigationMenu({ template: this.templateWarningStudent, size: 500, offsetTop: '0px' })
    }

    resetTestStudent(student: ClassStudent) {
        this.notificationService.confirm("<div class='pass_of_test_popup'><div>Thầy/Cô có chắc chắn làm mới đề của sinh viên:</div> <div><span class='font-weight-600'>" + student.user_info.full_name + "</span> </div></div>", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === "yes") {
                this.notificationService.isProcessing(true);
                this.classPlanActivityStudentTestsService.deleteClassPlanActivityStudentTests(student["student_test"].id).pipe(mergeMap(a => {
                    return this.classPlanActivityStudentTestsService.sinhdeTuluan15P({ class_id: this.classSelected.id, course_id: this.classSelected.course_id, week: this.currentWeek, av: this.courseSelected.av, student_id: student.student_id }).pipe(mergeMap(s => {
                        return of(s);
                    }))
                })).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Nhận đề mới thành công");
                        this.loadStudentAndTest();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Nhận đề mới thất bại");
                    }
                })
            }
        })
    }

    saveAllPoints() {
        const updatesMap = new Map<number, { point: number; studentName: string }>();
        // collect from saved editing points first (other pages)
        Object.keys(this.savedEditingPoints).forEach(key => {
            const saved = this.savedEditingPoints[Number(key)];
            const newPoint = Math.round(Number(saved.editingPoint) * 10);
            if (newPoint !== saved.originalPoint) {
                updatesMap.set(Number(key), { point: newPoint, studentName: saved.studentName });
            }
        });
        // collect from current page (overwrites savedEditingPoints if same student re-edited)
        this.list_student.forEach(row => {
            if (row['student_test'] && row['editingPoint'] !== undefined && row['editingPoint'] !== null) {
                const pointValue = Number(row['editingPoint']);
                if (isNaN(pointValue) || pointValue < 0 || pointValue > 10) return;
                const newPoint = Math.round(pointValue * 10);
                if (newPoint !== row['student_test'].point) {
                    updatesMap.set(row['student_test'].id, { point: newPoint, studentName: row['full_name'] });
                }
            }
        });
        const updates = Array.from(updatesMap.entries()).map(([id, val]) => ({ id, ...val }));
        if (!updates.length) {
            return this.notificationService.toastInfo('Không có điểm nào thay đổi');
        }
        const total = updates.length;
        const step = 100 / total;
        let currentPercent = 0;

        this.notificationService.loadingAnimationV2({ process: { percent: 0 } });
        let successCount = 0;
        let failCount = 0;

        from(updates).pipe(
            concatMap(u =>
                this.classPlanActivityStudentTestsService.updateClassPlanActivityStudentTests(u.id, { point: u.point, trangthai_cham: 1 }).pipe(
                    mergeMap(() => {
                        successCount++;
                        currentPercent = Math.round((successCount + failCount) * step);
                        this.notificationService.loadingAnimationV2({ process: { percent: currentPercent } });
                        return of(null);
                    }),
                    catchError(() => {
                        failCount++;
                        currentPercent = Math.round((successCount + failCount) * step);
                        this.notificationService.loadingAnimationV2({ process: { percent: currentPercent } });
                        return of(null);
                    })
                )
            )
        ).subscribe({
            complete: () => {
                this.notificationService.disableLoadingAnimationV2();
                const msg = successCount > 0
                    ? 'Lưu điểm thành công (' + successCount + ' SV)' + (failCount > 0 ? ', ' + failCount + ' SV thất bại' : '')
                    : 'Lưu điểm thất bại';
                if (failCount === 0) {
                    this.notificationService.toastSuccess(msg);
                } else {
                    this.notificationService.toastError(msg);
                }
                this.savedEditingPoints = {};
                this.loadStudentClass(this.pageIndex);
            }
        });
    }

    navigateToStudent(direction: 1 | -1) {
        if (!this.list_student || !this.selectedStudent) return;
        const currentIdx = this.list_student.findIndex(s => s.id === this.selectedStudent?.id);
        if (currentIdx === -1) return;
        const step = direction;
        for (let i = currentIdx + step; i >= 0 && i < this.list_student.length; i += step) {
            const target = this.list_student[i];
            if (target['student_test']) {
                this.loadViewTestData(target);
                return;
            }
        }
        this.notificationService.toastInfo(direction === 1 ? 'Đã hết danh sách sinh viên' : 'Đây là sinh viên đầu tiên');
    }

    saveViewStudentPoint() {
        if (!this.selectedStudent || !this.selectedStudent['student_test']) return;
        const pointValue = Number(this.viewStudentPoint);
        if (isNaN(pointValue) || pointValue < 0 || pointValue > 10) {
            return this.notificationService.toastWarning('Điểm không hợp lệ (0-10)');
        }
        const newPoint = Math.round(pointValue * 10);
        if (newPoint === this.selectedStudent['student_test'].point) {
            return this.notificationService.toastInfo('Điểm không thay đổi');
        }
        this.notificationService.isProcessing(true);
        this.classPlanActivityStudentTestsService.updateClassPlanActivityStudentTests(
            this.selectedStudent['student_test'].id,
            { point: newPoint, trangthai_cham: 1 }
        ).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Lưu điểm thành công');
                // update local row data
                this.selectedStudent['student_test'].point = newPoint;
                this.selectedStudent['student_test'].trangthai_cham = 1;
                this.selectedStudent['point'] = pointValue;
                // update in list_student if present
                const idx = this.list_student?.findIndex(s => s.id === this.selectedStudent?.id);
                if (idx !== -1 && this.list_student?.[idx]) {
                    this.list_student[idx] = { ...this.list_student[idx], ...this.selectedStudent };
                }
                // auto navigate to next student
                this.navigateToStudent(1);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Lưu điểm thất bại');
            }
        });
    }

    openViewTest(row: ClassStudent) {
        this.selectedStudent = row;
        this.viewStudentPoint = row['point'];
        if (row['student_test'] && row['student_test']['questions']) {
            this.notificationService.isProcessing(true);
            this.loadViewTestData(row, () => {
                this.modalService.open(this.viewStudentTest, LARGE_MODAL_OPTIONS);
            });
        }
    }

    private loadViewTestData(row: ClassStudent, onComplete?: () => void) {
        this.selectedStudent = row;
        this.viewStudentPoint = row['point'] ?? null;
        const condition_question: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: row['student_test']['questions'].toString() },
                { label: 'include_by', value: 'id ' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        const condition_aws: ConditionOption = {
            condition: [
                { conditionName: "class_plan_activity_student_test_id", condition: OvicQueryCondition.equal, value: row['student_test'].id, orWhere: "and" }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'cursor', value: '0' }
            ],
            page: null
        }

        const condition_form_15p: ConditionOption = {
            condition: [
                { conditionName: "week", condition: OvicQueryCondition.equal, value: this.currentWeek.toString(), orWhere: "and" },
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: "and" }
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }
        this.list_question = [];
        this.list_aws = [];
        forkJoin([
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_question),
            this.classPlanActivityStudentAnswersService.getClassPlanActivityStudentAnswersByPageNew(condition_aws),
            this.courseFormTuluan15pService.getByPage(condition_form_15p)
        ]).subscribe({
            next: ([_course_question, _test_aws, _form]) => {
                _course_question.data.forEach(f => {
                    const index = _form.data.findIndex(m => m.cdr === f.cdr);
                    if (index !== -1) {
                        f.point = _form.data[index].point
                    }
                })
                this.list_question = _course_question.data;

                this.list_aws = _test_aws.data;
                this.studentAnswerMap = {};
                if (this.list_aws && this.list_aws.length) {
                    this.list_aws.forEach(a => {
                        if (a.course_plan_activity_tuluan_id) {
                            this.studentAnswerMap[a.course_plan_activity_tuluan_id] = a.student_answer;
                        }
                    });
                }
                this.notificationService.isProcessing(false);
                if (onComplete) onComplete();
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }
}
