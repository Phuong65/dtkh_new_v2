import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ClassPlanActivityStudentTestsService } from '@modules/shared/services/class-plan-activity-student-tests.service';
import { Component, ElementRef, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { catchError, concatMap, exhaustMap, finalize, forkJoin, from, map, mergeMap, Observable, of, Subject, Subscription, tap, toArray } from 'rxjs';
import { ClassStudent } from '@modules/shared/models/class-student';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { ClassPlanActivitiesService } from '@modules/shared/services/class-plan-activities.service';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { APP_CONFIGS, getWsUrl, wsPath } from '@env';
import { ClassPlanActivityStudentTests, VIOLATION } from '@modules/shared/models/class-plan-activity-student-tests';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LARGE_MODAL_OPTIONS, MAXIMIZE_MODAL_OPTIONS, ROLES } from '@modules/shared/utils/syscat';
import { ButtonModule } from 'primeng/button';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { io, Socket } from 'socket.io-client';
import { ClassPlanActivityStudentAnswersService } from '@modules/shared/services/class-plan-activity-student-answers.service';
import { ClassPlanActivityStudentAnswers } from '@modules/shared/models/class-plan-activity-student-answers';
import { MatMenuModule } from '@angular/material/menu';
import { ViewTracnghiemTuluanComponent } from "../view-tracnghiem-tuluan/view-tracnghiem-tuluan.component";
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { ApiAiService } from '@modules/shared/services/api-ai.service';
import {
    buildEssayAiGradingPrompt,
    containsEssayAiImageReference,
    getValidEssayAiMaxScore,
    mapEssayAiGradingResult,
    normalizeEssayAiPromptContent,
    parseEssayAiGradingResponse
} from '../essay-ai-grading/essay-ai-grading.utils';

const BULK_AI_TEST_PACK_SIZE = 20;

type BulkAiGradingPhase = 'idle' | 'loading' | 'grading' | 'saving' | 'completing' | 'done' | 'error';

interface BulkAiPromptItem {
    key: string;
    testId: number;
    questionId: number;
    answerId: number;
    question: CoursePlanActivityTuluan;
    answer: ClassPlanActivityStudentAnswers;
    maxPoint: number;
}

interface BulkAiSaveItem {
    testId: number;
    questionId: number;
    answerId: number;
    point: number;
    feedback: string;
}

interface BulkAiPackResult {
    saveItems: BulkAiSaveItem[];
}

interface BulkAiProgress {
    phase: BulkAiGradingPhase;
    message: string;
    percent: number;
    totalPacks: number;
    completedPacks: number;
    totalTests: number;
    processedTests: number;
    totalAnswers: number;
    savedAnswers: number;
    failedAnswers: number;
    totalCompletionTests: number;
    completedTests: number;
    failedTests: number;
    summary: string;
}

@Component({
    selector: 'app-theodoi-kiemtra-daugio',
    templateUrl: './theodoi-kiemtra-daugio.component.html',
    styleUrls: ['./theodoi-kiemtra-daugio.component.css'],
    standalone: true,
    imports: [CommonModule, SharedModule, PaginatorModule, TableModule, DialogModule, ReactiveFormsModule, FormsModule, ButtonModule, NgbTooltipModule, MatMenuModule, ViewTracnghiemTuluanComponent]
})
export class TheodoiKiemtraDaugioComponent implements OnInit, OnDestroy {
    @ViewChild('scrollMe') private warningScroll: ElementRef;

    @ViewChild("templateWarningStudent") templateWarningStudent: TemplateRef<any>;

    @ViewChild('paginator', { static: false }) paginator: Paginator;

    @ViewChild('viewStudentTest') viewStudentTest: ElementRef;

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

    isLoadingStudentTest: boolean = false;

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

    list_question: CourseQuestions[];

    list_aws: ClassPlanActivityStudentAnswers[];

    private socket: Socket;

    private submitTrigger$ = new Subject<void>();

    filterStatusHtml = {
        status: null,
        locked: null,
        closed: null
    }

    search_student_html: string;

    isBulkAiGrading: boolean = false;

    bulkAiProgress: BulkAiProgress = this.createInitialBulkAiProgress();

    private bulkAiSubscription: Subscription;

    private bulkAiTestErrorIds = new Set<number>();

    private bulkAiExpectedAnswerIds = new Map<number, Set<number>>();

    private bulkAiSuccessfulAnswerIds = new Set<number>();

    private isDestroyed: boolean = false;

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
        private courseQuestionsService: CourseQuestionsService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private apiAiService: ApiAiService
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
            { label: 'Điểm', class: 'ovic-w-100px text-center', key: 'tong_diem', html: true, private: true },
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
        this.isDestroyed = true;
        this.closeInterval();
        this.bulkAiSubscription?.unsubscribe();
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

                    this.list_student[index]['tong_diem'] = "Đang tính điểm";

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

                            this.auth.setFeatureSecondary(cl.data[0].name.concat(" - Bài kiểm tra trắc nghiệm 15P tuần ", this.currentWeek.toString()));

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
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: "KT_DAUGIO", orWhere: 'and' },
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
                    { conditionName: 'type', condition: OvicQueryCondition.equal, value: "KT_DAUGIO", orWhere: 'and' },
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
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_DAUGIO', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: student_ids.toString() },
                        { label: 'include_by', value: 'student_id' },
                        { label: 'select', value: 'locked,closed,status,student_id,tong_diem,id,violation_of_exam,note_vipham,vipham,tracking,submit_by,questions,questions_tuluan,trangthai_cham' }
                    ],
                    page: null
                }

                return this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_student).pipe(mergeMap(_student_test => {
                    _class_student.data.forEach(f => {
                        const index = _student_test.data.findIndex(m => m.student_id === f.student_id);
                        f['has_test'] = '-';
                        if (index !== -1) {
                            f['student_test'] = _student_test.data[index];
                            f['tong_diem'] = Number(_student_test.data[index].tong_diem) / 10;
                            f['status_test'] = _student_test.data[index].status;
                            f['locked'] = _student_test.data[index].locked;
                            f['closed'] = _student_test.data[index].closed;
                            f['has_test'] = '<span class="blue"><i class="fa fa-check"></i></span>';
                            f['note_vipham'] = _student_test.data[index]['note_vipham'];
                            f['violation_of_exam'] = _student_test.data[index].violation_of_exam;
                            f['device'] = _student_test.data[index]['tracking'] && _student_test.data[index]['tracking']['starts'] ? _student_test.data[index]['tracking']['starts'][0]['device'] : '';
                            f['status_info_test'] = _student_test.data[index].status;

                            if (_student_test.data[index].status === 0 && _student_test.data[index].closed === 1) {
                                f['status_test'] = -2;
                            }

                            if (_student_test.data[index].status === 1 && _student_test.data[index]["submit_by"] === 0) {
                                f['status_test'] = 2;
                            }

                            if (_student_test.data[index].status === 1 && _student_test.data[index]["submit_by"] !== f.user_id && _student_test.data[index]["submit_by"] !== 0) {
                                f['status_test'] = 3;
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
                    const refreshedSelectedStudent = this.selectedStudent
                        ? this.list_student.find(student => student.student_id === this.selectedStudent.student_id)
                        : null;
                    if (refreshedSelectedStudent) {
                        this.selectedStudent = refreshedSelectedStudent;
                    }
                } else {
                    this.list_student = [];
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
                return this.classPlanActivityStudentTestsService.phanBodeKtDaugio({
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

    changePage_student(event) {
        this.limit_student = event.rows;
        this.pageIndex = event.page + 1;
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
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: "KT_DAUGIO", orWhere: 'and' },
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
                        { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_DAUGIO', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: student_ids.toString() },
                        { label: 'include_by', value: 'student_id' },
                        { label: 'select', value: 'locked,closed,status,student_id,tong_diem,id,violation_of_exam,note_vipham,vipham,tracking,submit_by,questions,questions_tuluan,trangthai_cham' }
                    ],
                    page: null
                }

                return this.classPlanActivityStudentTestsService.getClassPlanActivityStudentTestsByPageNew(condition_student).pipe(mergeMap(_student_test => {
                    _class_student.data.forEach(f => {
                        const index = _student_test.data.findIndex(m => m.student_id === f.student_id);
                        f['has_test'] = '-';
                        if (index !== -1) {
                            f['student_test'] = _student_test.data[index];
                            f['tong_diem'] = Number(_student_test.data[index].tong_diem) / 10;
                            f['status_test'] = _student_test.data[index].status;
                            f['locked'] = _student_test.data[index].locked;
                            f['closed'] = _student_test.data[index].closed;
                            f['has_test'] = '<span class="blue"><i class="fa fa-check"></i></span>';
                            f['violation_of_exam'] = _student_test.data[index].violation_of_exam;
                            f['note_vipham'] = _student_test.data[index]['note_vipham'];
                            f['status_info_test'] = _student_test.data[index].status;

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

    gradeAllEssayTestsWithAi(): void {
        if (this.isBulkAiGrading || !this.classSelected?.id || !this.currentWeek) {
            return;
        }

        this.closeInterval();
        this.bulkAiSubscription?.unsubscribe();
        this.isBulkAiGrading = true;
        this.bulkAiProgress = this.createInitialBulkAiProgress();
        this.bulkAiProgress.phase = 'loading';
        this.bulkAiProgress.message = 'Đang tải toàn bộ bài tự luận đã nộp cần chấm';
        this.bulkAiTestErrorIds.clear();
        this.bulkAiExpectedAnswerIds.clear();
        this.bulkAiSuccessfulAnswerIds.clear();

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: this.currentWeek.toString(), orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'KT_DAUGIO', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,questions_tuluan,trangthai_cham,status' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'id' }
            ],
            page: null
        };

        this.bulkAiSubscription = this.classPlanActivityStudentTestsService
            .getClassPlanActivityStudentTestsByPageNew(condition)
            .pipe(
                map(response => (response.data || [])
                    .filter(test => Number(test.trangthai_cham) !== 1)
                    .filter(test => this.getBulkEssayQuestionIds(test).length > 0)
                    .sort((first, second) => Number(first.id) - Number(second.id))),
                concatMap(tests => this.runBulkAiGrading(tests)),
                finalize(() => {
                    this.isBulkAiGrading = false;
                    if (!this.isDestroyed) {
                        this.notificationService.isProcessing(true);
                        this.loadStudentClass(this.pageIndex);
                    }
                })
            )
            .subscribe({
                error: () => {
                    this.bulkAiProgress.phase = 'error';
                    this.bulkAiProgress.message = 'Không thể hoàn tất chấm điểm AI tất cả';
                    this.bulkAiProgress.summary = 'Lỗi tải hoặc xử lý dữ liệu. Vui lòng thử lại';
                    this.notificationService.toastError(this.bulkAiProgress.summary);
                }
            });
    }

    private runBulkAiGrading(tests: ClassPlanActivityStudentTests[]): Observable<unknown> {
        if (!tests.length) {
            this.bulkAiProgress.phase = 'done';
            this.bulkAiProgress.percent = 100;
            this.bulkAiProgress.message = 'Không có bài tự luận đã nộp cần chấm';
            this.bulkAiProgress.summary = this.bulkAiProgress.message;
            this.notificationService.toastInfo(this.bulkAiProgress.message);
            return of(null);
        }

        tests.forEach(test => this.bulkAiExpectedAnswerIds.set(Number(test.id), new Set<number>()));
        const packs = this.chunkBulkAiTests(tests);
        this.bulkAiProgress.phase = 'grading';
        this.bulkAiProgress.totalTests = tests.length;
        this.bulkAiProgress.totalPacks = packs.length;
        this.bulkAiProgress.message = `Đang chấm pack 1/${packs.length} — 0/${tests.length} bài`;

        return from(packs).pipe(
            concatMap((pack, index) => this.processBulkAiPack(pack, index, packs.length).pipe(
                catchError(() => {
                    pack.forEach(test => this.bulkAiTestErrorIds.add(Number(test.id)));
                    this.completeBulkAiPack(pack.length, index, packs.length);
                    return of({
                        saveItems: []
                    } as BulkAiPackResult);
                })
            )),
            toArray(),
            concatMap(results => this.saveBulkAiAnswers(
                results.flatMap(result => result.saveItems)
            )),
            concatMap(() => this.markBulkAiGradedTests(tests))
        );
    }

    private processBulkAiPack(
        pack: ClassPlanActivityStudentTests[],
        packIndex: number,
        totalPacks: number
    ): Observable<BulkAiPackResult> {
        const testIds = pack.map(test => Number(test.id));
        const questionIds = [...new Set(pack.flatMap(test => this.getBulkEssayQuestionIds(test)))];
        const questionCondition: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: questionIds.join(',') },
                { label: 'include_by', value: 'id' }
            ],
            page: null
        };
        const answerCondition: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_plan_activity_student_test_id',
                    condition: OvicQueryCondition.equal,
                    value: testIds.join(','),
                    orWhere: 'in'
                }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'cursor', value: '0' },
                {
                    label: 'select',
                    value: 'id,class_plan_activity_student_test_id,course_plan_activity_tuluan_id,student_answer,point,feedback'
                }
            ],
            page: null
        };

        return this.coursePlanActivityTuluanService
            .getCoursePlanActivityTuluanByPageNew(questionCondition)
            .pipe(
                concatMap(questionResponse => this.classPlanActivityStudentAnswersService
                    .getClassPlanActivityStudentAnswersByPageNew(answerCondition)
                    .pipe(map(answerResponse => ({ questionResponse, answerResponse })))
                ),
                concatMap(({ questionResponse, answerResponse }) => {
                    const questions = questionResponse.data || [];
                    const answers = answerResponse.data || [];
                    const promptItems = this.createBulkAiPromptItems(pack, questions, answers);
                    const emptyResult: BulkAiPackResult = { saveItems: [] };

                    if (!promptItems.length) {
                        this.completeBulkAiPack(pack.length, packIndex, totalPacks);
                        return of(emptyResult);
                    }

                    return this.apiAiService.getChamDiemAi(buildEssayAiGradingPrompt(
                        promptItems.map(item => ({
                            key: item.key,
                            question: item.question.desc,
                            studentAnswer: item.answer.student_answer,
                            rubricMarkdown: item.question.rubric_markdown || '',
                            maxScore: item.maxPoint
                        }))
                    )).pipe(
                        map(response => {
                            const responseItems = parseEssayAiGradingResponse(response);
                            const saveItems: BulkAiSaveItem[] = [];

                            promptItems.forEach(item => {
                                const matchingItems = responseItems
                                    ?.filter(result => result['question_key'] === item.key) || [];
                                const result = matchingItems.length === 1
                                    ? mapEssayAiGradingResult(matchingItems[0], item.maxPoint)
                                    : null;

                                if (!result) {
                                    this.bulkAiTestErrorIds.add(item.testId);
                                    return;
                                }

                                saveItems.push({
                                    testId: item.testId,
                                    questionId: item.questionId,
                                    answerId: item.answerId,
                                    point: result.score,
                                    feedback: result.feedback
                                });
                            });

                            this.completeBulkAiPack(pack.length, packIndex, totalPacks);
                            return { saveItems };
                        }),
                        catchError(() => {
                            promptItems.forEach(item => this.bulkAiTestErrorIds.add(item.testId));
                            this.completeBulkAiPack(pack.length, packIndex, totalPacks);
                            return of(emptyResult);
                        })
                    );
                })
            );
    }

    private createBulkAiPromptItems(
        pack: ClassPlanActivityStudentTests[],
        questions: CoursePlanActivityTuluan[],
        answers: ClassPlanActivityStudentAnswers[]
    ): BulkAiPromptItem[] {
        const questionMap = new Map<number, CoursePlanActivityTuluan>();
        questions.forEach(question => {
            if (question.id) {
                questionMap.set(Number(question.id), question);
            }
        });

        const answerMap = new Map<string, ClassPlanActivityStudentAnswers>();
        answers.forEach(answer => {
            const testId = Number(answer.class_plan_activity_student_test_id);
            const questionId = Number(answer.course_plan_activity_tuluan_id);
            if (!Number.isFinite(testId) || !Number.isFinite(questionId)) {
                return;
            }

            const answerKey = this.getBulkAiAnswerKey(testId, questionId);
            if (answerMap.has(answerKey)) {
                this.bulkAiTestErrorIds.add(testId);
                return;
            }
            answerMap.set(answerKey, answer);
        });

        const promptItems: BulkAiPromptItem[] = [];
        pack.forEach((test, testIndex) => {
            const testId = Number(test.id);
            let essayIndex = 0;
            this.getBulkEssayQuestionIds(test).forEach(questionId => {
                const answer = answerMap.get(this.getBulkAiAnswerKey(testId, questionId));
                if (!answer) {
                    return;
                }
                if (containsEssayAiImageReference(answer.student_answer)) {
                    this.bulkAiTestErrorIds.add(testId);
                    return;
                }
                if (!normalizeEssayAiPromptContent(answer.student_answer)) {
                    return;
                }

                if (!answer.id) {
                    this.bulkAiTestErrorIds.add(testId);
                    return;
                }

                const answerId = Number(answer.id);
                this.bulkAiExpectedAnswerIds.get(testId)?.add(answerId);
                const question = questionMap.get(questionId);
                const maxPoint = question ? getValidEssayAiMaxScore(question.point) : null;
                if (
                    !question
                    || !normalizeEssayAiPromptContent(question.desc)
                    || !question.rubric_markdown?.trim()
                    || maxPoint === null
                    || containsEssayAiImageReference(question.desc)
                    || containsEssayAiImageReference(answer.student_answer)
                ) {
                    this.bulkAiTestErrorIds.add(testId);
                    return;
                }

                essayIndex++;
                promptItems.push({
                    key: `test_${testIndex + 1}_essay_${essayIndex}`,
                    testId,
                    questionId,
                    answerId,
                    question,
                    answer,
                    maxPoint
                });
            });
        });

        return promptItems;
    }

    private saveBulkAiAnswers(saveItems: BulkAiSaveItem[]): Observable<unknown> {
        this.bulkAiProgress.phase = 'saving';
        this.bulkAiProgress.totalAnswers = saveItems.length;
        this.bulkAiProgress.savedAnswers = 0;
        this.bulkAiProgress.failedAnswers = 0;
        this.bulkAiProgress.percent = saveItems.length ? 0 : 100;
        this.bulkAiProgress.message = saveItems.length
            ? `Đang lưu 0/${saveItems.length} câu`
            : 'Không có kết quả AI hợp lệ cần lưu';

        if (!saveItems.length) {
            return of([]);
        }

        return from(saveItems).pipe(
            concatMap(item => this.classPlanActivityStudentAnswersService
                .updateClassPlanActivityStudentAnswers(item.answerId, {
                    point: item.point,
                    feedback: item.feedback
                })
                .pipe(
                    map(() => ({ item, success: true })),
                    catchError(() => of({ item, success: false }))
                )),
            tap(result => {
                if (result.success) {
                    this.bulkAiSuccessfulAnswerIds.add(result.item.answerId);
                    this.bulkAiProgress.savedAnswers++;
                } else {
                    this.bulkAiTestErrorIds.add(result.item.testId);
                    this.bulkAiProgress.failedAnswers++;
                }
                const processed = this.bulkAiProgress.savedAnswers + this.bulkAiProgress.failedAnswers;
                this.bulkAiProgress.percent = this.getBulkAiPercent(processed, saveItems.length);
                this.bulkAiProgress.message = `Đang lưu ${processed}/${saveItems.length} câu`;
            }),
            toArray()
        );
    }

    private markBulkAiGradedTests(
        tests: ClassPlanActivityStudentTests[]
    ): Observable<unknown> {
        const eligibleTests = tests
            .map(test => Number(test.id))
            .filter(testId => {
                if (!Number.isFinite(testId) || this.bulkAiTestErrorIds.has(testId)) {
                    return false;
                }
                const expectedAnswerIds = this.bulkAiExpectedAnswerIds.get(testId) || new Set<number>();
                return [...expectedAnswerIds].every(answerId => this.bulkAiSuccessfulAnswerIds.has(answerId));
            });

        this.bulkAiProgress.phase = 'completing';
        this.bulkAiProgress.totalCompletionTests = eligibleTests.length;
        this.bulkAiProgress.completedTests = 0;
        this.bulkAiProgress.percent = eligibleTests.length ? 0 : 100;
        this.bulkAiProgress.message = eligibleTests.length
            ? `Đang đánh dấu đang chấm 0/${eligibleTests.length} bài`
            : 'Không có bài đủ điều kiện đánh dấu đang chấm';

        if (!eligibleTests.length) {
            this.finishBulkAiGrading(tests);
            return of([]);
        }

        let processedTests = 0;
        return from(eligibleTests).pipe(
            concatMap(testId => this.classPlanActivityStudentTestsService
                .updateClassPlanActivityStudentTests(testId, { trangthai_cham: -1 })
                .pipe(
                    map(() => ({ testId, success: true })),
                    catchError(() => of({ testId, success: false }))
                )),
            tap(result => {
                processedTests++;
                if (result.success) {
                    this.bulkAiProgress.completedTests++;
                } else {
                    this.bulkAiTestErrorIds.add(result.testId);
                }
                this.bulkAiProgress.percent = this.getBulkAiPercent(processedTests, eligibleTests.length);
                this.bulkAiProgress.message = `Đang cập nhật trạng thái ${processedTests}/${eligibleTests.length} bài`;
            }),
            toArray(),
            tap(() => this.finishBulkAiGrading(tests))
        );
    }

    private finishBulkAiGrading(tests: ClassPlanActivityStudentTests[]): void {
        this.bulkAiProgress.failedTests = tests.length - this.bulkAiProgress.completedTests;
        this.bulkAiProgress.phase = 'done';
        this.bulkAiProgress.percent = 100;
        this.bulkAiProgress.message = 'Đã hoàn tất chấm điểm AI tất cả';
        this.bulkAiProgress.summary = `${this.bulkAiProgress.completedPacks}/${this.bulkAiProgress.totalPacks} pack; `
            + `${this.bulkAiProgress.completedTests}/${tests.length} bài đánh dấu đang chấm; `
            + `${this.bulkAiProgress.failedTests} bài lỗi; `
            + `${this.bulkAiProgress.savedAnswers}/${this.bulkAiProgress.totalAnswers} câu đã lưu; `
            + `${this.bulkAiProgress.failedAnswers} câu lưu lỗi`;
        if (this.bulkAiProgress.failedTests || this.bulkAiProgress.failedAnswers) {
            this.notificationService.toastWarning(this.bulkAiProgress.summary);
        } else {
            this.notificationService.toastSuccess(this.bulkAiProgress.summary);
        }
    }

    private completeBulkAiPack(packSize: number, packIndex: number, totalPacks: number): void {
        this.bulkAiProgress.completedPacks++;
        this.bulkAiProgress.processedTests += packSize;
        this.bulkAiProgress.percent = this.getBulkAiPercent(this.bulkAiProgress.completedPacks, totalPacks);
        this.bulkAiProgress.message = this.bulkAiProgress.completedPacks < totalPacks
            ? `Đang chấm pack ${packIndex + 2}/${totalPacks} — ${this.bulkAiProgress.processedTests}/${this.bulkAiProgress.totalTests} bài`
            : `Đã chấm xong ${this.bulkAiProgress.completedPacks}/${totalPacks} pack`;
    }

    private chunkBulkAiTests(tests: ClassPlanActivityStudentTests[]): ClassPlanActivityStudentTests[][] {
        const packs: ClassPlanActivityStudentTests[][] = [];
        for (let index = 0; index < tests.length; index += BULK_AI_TEST_PACK_SIZE) {
            packs.push(tests.slice(index, index + BULK_AI_TEST_PACK_SIZE));
        }
        return packs;
    }

    private getBulkEssayQuestionIds(test: ClassPlanActivityStudentTests): number[] {
        if (!Array.isArray(test.questions_tuluan)) {
            return [];
        }
        return [...new Set(test.questions_tuluan
            .map(questionId => Number(questionId))
            .filter(questionId => Number.isFinite(questionId) && questionId > 0))];
    }

    private getBulkAiAnswerKey(testId: number, questionId: number): string {
        return `${testId}_${questionId}`;
    }

    private getBulkAiPercent(completed: number, total: number): number {
        return total ? Math.round(completed * 100 / total) : 100;
    }

    private createInitialBulkAiProgress(): BulkAiProgress {
        return {
            phase: 'idle',
            message: '',
            percent: 0,
            totalPacks: 0,
            completedPacks: 0,
            totalTests: 0,
            processedTests: 0,
            totalAnswers: 0,
            savedAnswers: 0,
            failedAnswers: 0,
            totalCompletionTests: 0,
            completedTests: 0,
            failedTests: 0,
            summary: ''
        };
    }

    formatTongDiem(value: unknown): string {
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        const point = Number(value);
        return Number.isFinite(point) ? point.toFixed(1) : String(value);
    }

    isTestGraded(studentTest: ClassPlanActivityStudentTests): boolean {
        return Number(studentTest?.trangthai_cham) === 1;
    }

    canShowStudentTestPoint(studentTest: ClassPlanActivityStudentTests): boolean {
        if (!studentTest) {
            return false;
        }
        const hasEssayQuestions = Array.isArray(studentTest.questions_tuluan) && studentTest.questions_tuluan.length > 0;
        if (hasEssayQuestions) {
            return this.isTestGraded(studentTest);
        }
        return true;
    }

    startSetInterval() {
        if (this.isBulkAiGrading) {
            return;
        }
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
                    return this.classPlanActivityStudentTestsService.phanBodeKtDaugio({ class_id: this.classSelected.id, course_id: this.classSelected.course_id, week: this.currentWeek, av: this.courseSelected.av, student_id: student.student_id }).pipe(mergeMap(s => {
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

    get canViewPreviousStudentTest(): boolean {
        return this.canNavigateStudentTest(-1);
    }

    get canViewNextStudentTest(): boolean {
        return this.canNavigateStudentTest(1);
    }

    canOpenStudentTest(row: ClassStudent): boolean {
        const studentTest = row?.['student_test'];
        return !this.isBulkAiGrading
            && Number(studentTest?.status) === 1
            && this.hasQuestionIds(studentTest?.questions);
    }

    openViewTest(row: ClassStudent): void {
        if (!this.canOpenStudentTest(row)) {
            return;
        }
        this.loadStudentTest(row, true);
    }

    navigateStudentTest(offset: -1 | 1): void {
        if (!this.canNavigateStudentTest(offset)) {
            return;
        }

        const reviewableStudents = this.getReviewableStudents();
        const currentIndex = reviewableStudents.findIndex(student => student.student_id === this.selectedStudent?.student_id);
        const targetStudent = reviewableStudents[currentIndex + offset];
        if (targetStudent) {
            this.loadStudentTest(targetStudent, false);
        }
    }

    private canNavigateStudentTest(offset: -1 | 1): boolean {
        if (this.isLoadingStudentTest) {
            return false;
        }

        const reviewableStudents = this.getReviewableStudents();
        const currentIndex = reviewableStudents.findIndex(student => student.student_id === this.selectedStudent?.student_id);
        const targetIndex = currentIndex + offset;
        return currentIndex !== -1 && targetIndex >= 0 && targetIndex < reviewableStudents.length;
    }

    private getReviewableStudents(): ClassStudent[] {
        const searchValue = (this.search_student_html || '').trim().toLowerCase();
        return (this.list_student || []).filter(student => {
            const studentTest = student['student_test'];
            const matchesSearch = !searchValue || [student['full_name'], student['student_code']]
                .some(value => String(value || '').toLowerCase().includes(searchValue));
            const matchesStatus = this.filterStatusHtml.status === null
                || Number(student['status_info_test']) === Number(this.filterStatusHtml.status);
            const matchesLocked = this.filterStatusHtml.locked === null
                || Number(student['locked']) === Number(this.filterStatusHtml.locked);
            const matchesClosed = this.filterStatusHtml.closed === null
                || Number(student['closed']) === Number(this.filterStatusHtml.closed);

            return matchesSearch
                && matchesStatus
                && matchesLocked
                && matchesClosed
                && Number(studentTest?.status) === 1
                && this.hasQuestionIds(studentTest?.questions);
        });
    }

    private hasQuestionIds(questionIds: unknown): boolean {
        return Array.isArray(questionIds) ? questionIds.length > 0 : !!questionIds;
    }

    private loadStudentTest(row: ClassStudent, openModal: boolean): void {
        const studentTest = row['student_test'];
        if (!studentTest || !this.hasQuestionIds(studentTest['questions'])) {
            return;
        }

        const condition_question: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: studentTest['questions'] ? studentTest['questions'].toString() : '' },
                { label: 'include_by', value: 'id ' }
            ],
            page: null
        };
        const condition_aws: ConditionOption = {
            condition: [
                { conditionName: 'class_plan_activity_student_test_id', condition: OvicQueryCondition.equal, value: studentTest.id, orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'cursor', value: '0' }
            ],
            page: null
        };

        this.isLoadingStudentTest = true;
        this.notificationService.isProcessing(true);
        forkJoin([
            studentTest['questions']
                ? this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
                : of({ data: [] }),
            this.classPlanActivityStudentAnswersService.getClassPlanActivityStudentAnswersByPageNew(condition_aws),
        ]).subscribe({
            next: ([_course_question, _test_aws]) => {
                this.selectedStudent = row;
                this.list_question = _course_question.data || [];
                this.list_aws = _test_aws.data || [];
                this.isLoadingStudentTest = false;
                this.notificationService.isProcessing(false);
                if (openModal) {
                    this.modalService.open(this.viewStudentTest, LARGE_MODAL_OPTIONS);
                }
            },
            error: () => {
                this.isLoadingStudentTest = false;
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Không tải được bài kiểm tra, vui lòng thử lại');
            }
        });
    }
}
