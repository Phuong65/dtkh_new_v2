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
import { ClassGroupService } from '@modules/shared/services/class-group.service';
import { ClassGroupMemberService } from '@modules/shared/services/class-group-member.service';
import { ClassGroup } from '@modules/shared/models/class-group';
import { forkJoin, mergeMap, of, pipe, from, concatMap, finalize, Observable } from 'rxjs';
import { SharedModule } from '@modules/shared/shared.module';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
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
import { key_server } from '@env';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        CalendarModule,
        TableModule,
        DialogModule,
        ReactiveFormsModule,
        FormsModule,
        PaginatorModule,
        NgbTooltipModule,
        DividerModule,
        LoadMediaOnTextDirective,
        PanelModule,
        MatSliderModule,
        NgbModalModule
    ],
    selector: 'app-thuongxuyen-tuluan',
    templateUrl: './thuongxuyen-tuluan.component.html',
    styleUrls: ['./thuongxuyen-tuluan.component.css']
})
export class ThuongxuyenTuluanComponent implements OnInit, OnChanges, AfterViewInit {


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

    key_server = key_server;

    filter_status_html: number;

    search_student_html: string;

    /** ===== Nhóm sinh viên ===== */
    classGroups: ClassGroup[] = [];
    selectedGroupId: number | null = null;
    selectedGroupStudents: ClassStudent[] = [];
    selectedGroupMemberStudentIds: number[] = [];
    displayGroupActionConfirm: boolean = false;
    groupActionType: 'diemdanh' | 'huy_diemdanh' = 'diemdanh';
    groupActionMessage: string = '';
    groupActionCount: number = 0;
    showNew: boolean = true;

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
        private classGroupService: ClassGroupService,
        private classGroupMemberService: ClassGroupMemberService,
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
            this.loadStudentAndTest();
            this.loadGroups();
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
                this.notificationService.isProcessing(false);
                this.loadStudentClass(1);
            },
            error: () => {
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
        this.notificationService.confirm("Bạn có chắc chắn muốn tạo đề kiểm tra không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                const check = await this.checkTestPromise();
                this.elnKhoaHocService.getElnKhoaHocByCol('id', this.classSelected.course_id.toString()).pipe(mergeMap(_elnkhoa => {
                    return forkJoin([
                        this.classPlanActivityTuluanService.sinhde(this.selectedActivity.id, _elnkhoa[0].av),
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

    createTestTrucTiep() {
        this.notificationService.confirm("Thao tác này sẽ bỏ qua việc phân phối đề. Thầy/Cô chỉ việc nhập điểm?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(async a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                this.elnKhoaHocService.getElnKhoaHocByCol('id', this.classSelected.course_id.toString()).pipe(mergeMap(_elnkhoa => {
                    return this.classPlanActivityTuluanService.sinhdetructiep(this.selectedActivity.id, _elnkhoa[0].av)
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
            // if (this.selectedActivity.status === 1) {
            //     return this.notificationService.toastWarning("Không thể điểm danh khi bài kiểm tra đã được kích hoạt");
            // }
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
        this.limit_student = event.rows;
        this.pageIndex = event.page + 1;
        this.loadStudentClass(event.page + 1);
    }

    firstPageSet() {
        this.loadStudentClass(1);
    }

    onSearchStudent(event) {
        if (event) {
            if (event['target']['value']) {
                if (event.key === 'Enter') {
                    this.search_student = null;
                    this.search_student_html = null;
                    if (this.limit_student >= this.tongsv) {
                        this.search_student_html = event['target']['value'];
                    } else {
                        this.search_student = event['target']['value'];
                        this.firstPageSet();
                    }
                }
            } else {
                this.search_student = null;
                this.search_student_html = null;
                if (this.limit_student < this.tongsv) {
                    this.firstPageSet();
                }
            }
        }
        // this.search_student = event;
        // this.firstPageSet();
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

        if (this.selectedStudent['point'] === -1) {
            this.selectedStudent['point'] = null;
        }

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
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: row['test_info'].course_plan_activity_tuluan_id.toString() }
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

    savePointTuluan() {
        console.log(this.selectedStudent);
        console.log(this.selectedTuluan);
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

    openGroupActionConfirm(actionType: 'diemdanh' | 'huy_diemdanh') {
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
        }

        this.groupActionCount = totalGroupMembers;
        this.displayGroupActionConfirm = true;
    }

    /**
     * Query bài test tự luận cho toàn bộ student_id (không phụ thuộc trang/bộ lọc hiện tại)
     */
    private queryTestsByStudentIds(studentIds: number[]): Observable<ClassPlanActivityTuluan[]> {
        const condition_test: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.class_id.toString() },
                { conditionName: 'class_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'include', value: studentIds.toString() },
                { label: 'include_by', value: 'student_id' },
                { label: 'limit', value: '-1' },
            ],
            page: null,
        };
        return this.classPlanActivityTuluanService.getClassPlanActivityTuluanByPageNew(condition_test).pipe(
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
        const lockValue = this.groupActionType === 'diemdanh' ? 1 : 0;
        const actionLabel = this.groupActionType === 'diemdanh' ? 'vắng mặt' : 'có mặt';

        this.notificationService.isProcessing(true);

        // Query bài test cho toàn bộ student_id trong nhóm
        this.queryTestsByStudentIds(allGroupStudentIds).subscribe({
            next: (allTests) => {
                // Lọc các bài test có tồn tại để điểm danh
                const validTests = allTests.filter(t => t.id && t.student_id);
                const skippedCount = allGroupStudentIds.length - validTests.length;

                if (!validTests.length) {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastWarning(`Không có sinh viên nào trong nhóm "${groupName}" có bài kiểm tra để điểm danh`);
                    return;
                }

                const requests: Observable<any>[] = [];
                validTests.forEach(test => {
                    requests.push(this.classPlanActivityTuluanService.updateClassPlanActivityTuluan(test.id, { lock: lockValue }));
                });

                // Xử lý tuần tự bằng concatMap
                from(requests).pipe(
                    concatMap(req => req)
                ).subscribe({
                    next: () => {
                        // Đang xử lý tuần tự
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError(`Điểm danh (${actionLabel}) nhóm "${groupName}" thất bại`);
                        this.loadStudentAndTest();
                    },
                    complete: () => {
                        this.notificationService.isProcessing(false);
                        const summaryMessage = skippedCount > 0
                            ? `Đã điểm danh (${actionLabel}) nhóm "${groupName}" thành công (${validTests.length}/${allGroupStudentIds.length} sinh viên, ${skippedCount} sv bỏ qua do chưa có đề)`
                            : `Đã điểm danh (${actionLabel}) nhóm "${groupName}" thành công (${validTests.length}/${allGroupStudentIds.length} sinh viên)`;
                        this.notificationService.toastSuccess(summaryMessage);
                        this.loadStudentAndTest();
                    }
                });
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError(`Không thể lấy dữ liệu bài kiểm tra của nhóm "${groupName}"`);
            }
        });
    }
}
