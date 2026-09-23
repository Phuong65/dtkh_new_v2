import { request } from 'http';
import { CommonModule } from '@angular/common';
import { CoursePlanActivityTuluanService } from './../../../../../shared/services/course-plan-activity-tuluan.service';

import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnInit, QueryList, SimpleChanges, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { OrWhereCondition, OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { ClassPlanActivityTuluan } from '@modules/shared/models/class-plan-activity-tuluan';
import { ClassStudent } from '@modules/shared/models/class-student';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ClassPlanActivitiesService } from '@modules/shared/services/class-plan-activities.service';
import { ClassPlanActivityTuluanService } from '@modules/shared/services/class-plan-activity-tuluan-service';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { forkJoin, mergeMap, Observable, Observer, of, pipe } from 'rxjs';
import { SharedModule } from '@modules/shared/shared.module';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { NgbModal, NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DividerModule } from 'primeng/divider';
import { CoursePlanActivityTuluanTieuchicham } from '@modules/shared/models/course-plan-activity-tuluan-tieuchicham';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { PanelModule } from 'primeng/panel';
import { MatSliderModule } from '@angular/material/slider';
import { CHAM_DIEM_TULUAN_TX, CHUAN_DAU_RA, MAXIMIZE_MODAL_OPTIONS } from '@modules/shared/utils/syscat';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
    selector: 'app-thuongxuyen-duan',
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
        MatProgressBarModule
    ],
    templateUrl: './thuongxuyen-duan.component.html',
    styleUrls: ['./thuongxuyen-duan.component.css']
})
export class ThuongxuyenDuanComponent implements OnInit {


    @Input() activity: ClassPlanActivities;

    @Input() classSelected: Classes;

    @Input() courseSelected: ElnKhoaHoc;

    @ViewChild('templateFormViewTuluan') templateFormViewTuluan: TemplateRef<any>;

    @ViewChild('templateFormChamDiem') templateFormChamDiem: ElementRef<any>;

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

    list_course_tuluan: CoursePlanActivityTuluan[];

    displayModal: boolean = false;

    progressValue: number = 0;
    
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
            this.selectedActivity = this.activity;
            this.startDate = null;
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

    pointQuestionKeyDown(event, inputPoint_quest) {
        if (event) {
            if (/[0-9]/.test(event.key) || event.key === '.' || event.key === 'Backspace') {
                if (inputPoint_quest.value.replace(/\d/gi, '').length > 0 && event.key === '.') {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    ngOnInit(): void {

    }

    loadStudentAndTest() {
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
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,point' },
            ],
            page: null
        }


        this.notificationService.isProcessing(true);


        forkJoin([
            this.classStudentService.getClassStudentByPageNew(condition_count_student),
            this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_count_test),
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_course_tuluan)
        ]).subscribe({
            next: ([_class_student, _class_plan_test, _tuluan]) => {
                this.tongsv = _class_student.recordsFiltered;
                this.tongtest = _class_plan_test.recordsFiltered;
                this.list_course_tuluan = _tuluan.data;
                if (this.tongtest !== 0) {
                    this.notificationService.isProcessing(false);
                    this.loadStudentClass(1);
                } else {
                    this.syncDuan();
                }
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
    }


    async loadStudentClass(page) {
        this.list_student = [];

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
                { label: 'limit', value: this.limit_student.toString() },
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

        this.classStudentService.getClassStudentByPageNew(condition).pipe(mergeMap(_class_student => {

            const student_ids = [];

            _class_student.data.forEach(f => {
                student_ids.push(f.student_id);
                f['has_test'] = false;
            })

            if (student_ids.length) {
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
                    ],

                    set: [
                        { label: 'include', value: student_ids.toString() },
                        { label: 'include_by', value: 'student_id' },
                        { label: 'limit', value: this.limit_student.toString() },
                    ],
                    page: null,
                };

                return this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_test).pipe(mergeMap(_student_test => {
                    _class_student.data.forEach(f => {
                        const index = _student_test.data.findIndex(m => m.student_id === f.student_id);
                        if (index !== -1) {
                            f['test_info'] = _student_test.data[index];
                            f['has_test'] = '<span class="blue"><i class="fa fa-check"></i></span>';
                            f['lock'] = _student_test.data[index].lock;
                            f['stopped'] = _student_test.data[index].stopped;
                            f['point'] = _student_test.data[index].point === -1 ? null : _student_test.data[index].point;
                            f['course_plan_activity_tuluan_id'] = _student_test.data[index].course_plan_activity_tuluan_id;
                            f['status_test'] = _student_test.data[index].status >= 1 ? '<span class="blue"><i class="fa fa-check"></i></span>' : '-';
                            const index_course = this.list_course_tuluan.findIndex(m => m.id === f['course_plan_activity_tuluan_id']);
                            if (index_course !== -1 && this.list_course_tuluan[index_course]['point'] && this.list_course_tuluan[index_course]['point'] > 0) {
                                f['newTuluan'] = true;
                            }
                        } else {
                            f['point'] = '-';
                            f['status_test'] = '-';
                            f['has_test'] = '-';
                        }
                    })
                    return of(_class_student);
                    // const delete_tuluan_ids = [];
                    // _student_test.data.forEach( ( f => {
                    //     const index = _class_student.data.findIndex( m => m.student_id === f.student_id );
                    //     if ( index === -1 ) {
                    //         delete_tuluan_ids.push( f.id );
                    //     }
                    // } ) )

                    // return this.classPlanActivityTuluanService.deleteClassPlanActivityTuluan( delete_tuluan_ids.toString() ).pipe( mergeMap( a => {
                    //
                    // }))
                    // console.log( delete_tuluan_ids );
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

                if (this.isOpenChamDiem === true) {
                    if (this.list_student.length) {
                        if (this.actionView === 'next') {
                            this.selectedStudent = this.list_student[0]
                        } else {
                            this.selectedStudent = this.list_student[this.list_student.length - 1];
                        }
                    }
                    if (this.selectedStudent)
                        this.openPointCode(this.selectedStudent);
                }

                this.notificationService.isProcessing(false);
            },
            error: (e) => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Không tải được dữ liệu, lỗi kết nối');
            },
        });
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

        if (this.tongsv <= this.tongtest) {
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
        } else {
            this.notificationService.toastWarning('Vui lòng tạo đề kiểm tra trước khi mở');
        }
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

    savePointTest(event, row: ClassStudent, index) {
        if (event && row['test_info']) {
            if (row['test_info'].point || row['test_info'].point === 0 || row['test_info'].point === null) {
                if (event.key === 'Enter') {
                    this.notificationService.isProcessing(true);
                    this.classPlanActivityTuluanService.updateClassPlanActivityTuluan(row['test_info'].id, { point: row['point'], status: 2 }).subscribe({
                        next: () => {
                            this.notificationService.isProcessing(false);
                            if (this.list_student[index + 1]) {
                                this.index_focus = this.list_student[index + 1].id;
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
        const index = this.list_student.findIndex(m => m.id === this.selectedStudent.id);
        if (index !== -1) {
            if (action === 'next') {
                if (index + 1 === this.list_student.length) {
                    this.pageIndex = this.pageIndex + 1;
                    this.loadStudentClass(this.pageIndex);
                } else {
                    this.selectedStudent = this.list_student[index + 1];
                    this.openPointCode(this.selectedStudent);
                }
            } else if (action === 'back') {
                if (index - 1 < 0) {
                    if (this.pageIndex > 1) {
                        this.pageIndex = this.pageIndex - 1;
                        this.loadStudentClass(this.pageIndex);
                    }
                } else {
                    this.selectedStudent = this.list_student[index - 1];
                    this.openPointCode(this.selectedStudent);
                }
            }
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

    openPointCode(row: ClassStudent) {

        this.countChanges++;

        this.selectedTuluan = null;

        this.list_tieuchi_cham = [];
        // if (row['test_info']) {
        //     if (row['test_info']['status'] >= 1) {
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

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_course_tuluan),
            this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchi)
        ]).subscribe({
            next: ([_tuluan, _tieuchi]) => {

                if (_tuluan.recordsFiltered) {
                    this.selectedTuluan = _tuluan.data[0];
                }

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

                // this.notificationService.openSideNavigationMenu({ template: this.templateFormChamDiem, size: window.innerWidth, offsetTop: '0px' })
                if (this.isOpenChamDiem === false) {
                    this.isOpenChamDiem = true;
                    this.modalService.open(this.templateFormChamDiem, MAXIMIZE_MODAL_OPTIONS)
                }
            },

            error: () => {

            }
        })
        //     } else {
        //         this.notificationService.toastWarning('Thầy / cô có thể xem đề bài sau khi sinh viên đã nhận đề');
        //     }
        // }
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

    syncDuan() {
        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '1' }
            ],

            page: null
        }

        this.notificationService.isProcessing(true);

        this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condition_plan).pipe(mergeMap(class_plan => {
            if (class_plan.recordsFiltered) {
                const condition_test: ConditionOption = {
                    condition: [
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                        { conditionName: 'class_plan_activity_id', condition: OvicQueryCondition.equal, value: class_plan.data[0].id.toString(), orWhere: 'and' },
                    ],

                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'class_id,course_id,student_id,course_plan_activity_tuluan_id,created_by' }
                    ],
                    page: null
                }

                return this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_test).pipe(mergeMap(_tuluan => {
                    return of(_tuluan);
                }))
            }
            return of(null);
        })).subscribe({
            next: (_tuluan) => {
                if (_tuluan && _tuluan.data.length) {
                    this.progressValue = 0;

                    this.displayModal = true;

                    this.notificationService.isProcessing(false);

                    const request: Observable<any>[] = [];

                    _tuluan.data.forEach(f => {
                        const data = { ...f };

                        data['class_plan_activity_id'] = this.selectedActivity.id;

                        const condition_has_tuluan: ConditionOption = {
                            condition: [
                                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                                { conditionName: 'student_id', condition: OvicQueryCondition.equal, value: f.student_id.toString(), orWhere: 'and' },
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
                        this.notificationService.toastInfo("Không tìm thấy đề");
                    }
                } else {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastWarning("Vui lòng phân bổ dự án trước");
                }
            },
            error: () => {
                this.notificationService.isProcessing(false)
                this.notificationService.toastWarning("Lỗi kết nối, vui lòng thử lại")
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
}
