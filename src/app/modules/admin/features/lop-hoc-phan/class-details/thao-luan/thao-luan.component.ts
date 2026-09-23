import { ClassPlanActivityThaoLuanPostReplyService } from './../../../../../shared/services/class_plan_activity_thaoluan_post_reply.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { ClassPlanActivityThaoLuanPost, ClassPlanActivityThaoLuanPostService } from './../../../../../shared/services/class_plan_activity_thaoluan_post.service';
import { HelperService } from '@core/services/helper.service';
import { Component, ElementRef, Input, NgModule, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Classes } from '@modules/shared/models/classes';
import { SharedModule } from '@modules/shared/shared.module';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InputQuestionDirectionComponent } from '@modules/admin/features/cauhoi-tracnghiem/input-question-direction/input-question-direction.component';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { PaginatorModule } from 'primeng/paginator';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin, mergeMap, Observable, of } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { ClassPlanActivitiesService } from '@modules/shared/services/class-plan-activities.service';
import { ClassPlansService } from '@modules/shared/services/class-plans.service';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { ClassPlans } from '@modules/shared/models/class-plans';
import { BUTTON_CLOSED } from '@core/models/buttons';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { LARGE_MODAL_OPTIONS, MAXIMIZE_MODAL_OPTIONS, TYPE_FILE_LIST } from '@modules/shared/utils/syscat';
import { OvicDocument, OvicFile } from '@core/models/file';
import { ClassStudent } from '@modules/shared/models/class-student';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ClassPlanActivityThaoLuanPostReply } from '@modules/shared/services/class_plan_activity_thaoluan_post_reply.service';
import { getLinkDownload_aws } from '@env';
import { MediaService } from '@modules/shared/services/media.service';
import { DownloadProcess } from '@modules/shared/components/ovic-download-progress/ovic-download-progress.component';

@Component({
    selector: 'app-thao-luan',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        PaginatorModule,
        NgbTooltipModule,
        MatListModule,
        CheckboxModule,
        DialogModule,
        DividerModule,
        MatProgressBarModule,
        ContextMenuModule,
        MatIconModule,
        PanelModule,
        ReactiveFormsModule,
        FormsModule,
        CalendarModule,
        InputQuestionDirectionComponent,
        TableModule,
        LoadMediaOnTextDirective,
        ButtonModule,
        TooltipModule,
        KatexImgDirective,
        MatMenuModule,
        DialogModule
    ],
    templateUrl: './thao-luan.component.html',
    styleUrls: ['./thao-luan.component.css']
})
export class ThaoLuanComponent implements OnInit {
    @ViewChild('templateThaoluan') templateThaoluan: TemplateRef<any>;

    @ViewChild('filesLessonReview') filesLessonReview: ElementRef;

    @ViewChild('templateThaoLuanPost') templateThaoLuanPost: TemplateRef<any>;

    @ViewChild('templateStudentPost') templateStudentPost: ElementRef;

    @Input() classSelected: Classes;

    titleLayout: string = '';

    list_class_plan_activities: ClassPlanActivities[] = [];

    class_plan_test: ClassPlans;

    selected_class_plan_activity: ClassPlanActivities;

    formData: FormGroup;

    selectedFileReview: OvicDocument;

    selectedThaoluan: ClassPlanActivities;

    list_thaoluan_post: ClassPlanActivityThaoLuanPost[];

    selectedThaoLuanPost: ClassPlanActivityThaoLuanPost;

    list_student: ClassStudent[];

    selectedStudent: ClassStudent;

    search_student: string;

    total_student: number = 0;

    limit_student: number = 25;

    cols_student: any[] = [];

    display_view_file: boolean = false;

    selectedFile: OvicFile;

    formFile = new FormControl([]);

    noidung_reply: string;
    constructor(
        private notificationService: NotificationService,
        private classPlanActivitiesService: ClassPlanActivitiesService,
        private classPlansService: ClassPlansService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private formBuilder: FormBuilder,
        private modalService: NgbModal,
        private helperService: HelperService,
        private classPlanActivityThaoLuanPostService: ClassPlanActivityThaoLuanPostService,
        private classStudentService: ClassStudentService,
        private classPlanActivityThaoLuanPostReplyService: ClassPlanActivityThaoLuanPostReplyService,
        private mediaService: MediaService
    ) {
        this.formData = this.formBuilder.group(
            {
                start_date: ['', Validators.required],
                exprided_date: ['', Validators.required],
            }
        );

        this.cols_student = [
            { label: '#', class: 'ovic-w-80px text-center', key: 'index_' },
            {
                label: 'Mã sinh viên',
                class: 'ovic-w-200px text-left',
                key: 'student_code',
            },
            { label: 'Họ tên', class: 'text-left', key: 'full_name' },
            {
                label: 'Ngày sinh',
                class: 'ovic-w-100px text-center',
                key: 'birthday',
            },
            {
                label: 'Số lượng',
                class: 'ovic-w-120px text-center',
                key: 'count_post',
            },
        ];
    }

    ngOnInit(): void {
        this.loadThaoluan();
    }

    get f() {
        return this.formData.controls;
    }

    loadThaoluan() {

        this.list_class_plan_activities = [];

        this.class_plan_test = null

        this.titleLayout = 'Đang tải dữ liệu, vui lòng chờ';

        const condition_activity: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'THAOLUAN' },
                { label: 'include_by', value: 'type' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '2000', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.classPlansService.getClassPlansByPageNew(condition_plan),
            this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condition_activity),
        ]).subscribe({
            next: ([_plans, _activities]) => {
                if (_activities.recordsFiltered) {
                    this.list_class_plan_activities = _activities.data;
                    this.class_plan_test = _plans.data[0];
                } else {
                    this.titleLayout = 'Đồng bộ bài thảo luận';
                }
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    syncTest() {
        this.notificationService.isProcessing(true);
        const condition_course_plan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '2000', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'ordering', condition: OvicQueryCondition.notEqual, value: '100', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }


        const condition_activity: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'THAOLUAN' },
                { label: 'include_by', value: 'type' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '2000', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_course_plan),
            this.classPlansService.getClassPlansByPageNew(condition_plan),
            this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condition_activity),
        ]).subscribe({
            next: ([_course_plan, _res_plan, _res_plan_activity]) => {


                const __plan = _res_plan.data;
                const __plan_activity = _res_plan_activity.data;

                if (_course_plan.recordsFiltered) {
                    const index = _course_plan.data.findIndex(m => m.parent_id === 0);

                    if (index !== -1) {

                        const childrent = _course_plan.data.filter(m => m.parent_id !== 0);

                        const _plan = {
                            class_id: this.classSelected.id,
                            course_id: this.classSelected.course_id,
                            week: _course_plan.data[index].week,
                            title: _course_plan.data[index].title,
                            course_plan_activity_id: _course_plan.data[index].id,
                        }





                        if (__plan[0] && __plan[0].id) {
                            this.classPlansService.updateClassPlans(__plan[0].id, _plan).pipe(mergeMap(() => {
                                const request: Observable<any>[] = [];
                                childrent.forEach(f => {
                                    if (f.type === 'THAOLUAN') {
                                        const data_activity = {
                                            class_id: this.classSelected.id,
                                            course_id: this.classSelected.course_id,
                                            plan_id: __plan[0].id,
                                            type: f.type,
                                            ordering: f.ordering,
                                            title: f.title,
                                            desc: f.desc,
                                            desc_title: f.desc_title,
                                            params: f.params,
                                            status: 0,
                                            course_plan_activity_id: f.id,
                                            files: f.files
                                        }

                                        const index_c = __plan_activity.findIndex(m => m.course_plan_activity_id === f.id);

                                        if (index_c !== -1) {
                                            request.push(this.classPlanActivitiesService.updateClassPlanActivities(__plan_activity[index_c].id, data_activity))
                                        } else {
                                            request.push(this.classPlanActivitiesService.addClassPlanActivities(data_activity))
                                        }
                                    }
                                })
                                if (request.length)
                                    return forkJoin(request).pipe(mergeMap(() => {
                                        return of(null);
                                    }))
                                return of(null);
                            })).subscribe({
                                next: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastSuccess("Đồng bộ thành công");
                                    this.loadThaoluan();
                                },
                                error: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastError("Đồng bộ thất bại");
                                }
                            })
                        } else {
                            this.classPlansService.addClassPlans(_plan).pipe(mergeMap(_plan_id => {
                                const request: Observable<any>[] = [];
                                childrent.forEach(f => {
                                    if (f.type === 'THAOLUAN') {
                                        const data_activity = {
                                            class_id: this.classSelected.id,
                                            course_id: this.classSelected.course_id,
                                            plan_id: _plan_id,
                                            type: f.type,
                                            ordering: f.ordering,
                                            title: f.title,
                                            desc: f.desc,
                                            desc_title: f.desc_title,
                                            params: f.params,
                                            status: 0,
                                            course_plan_activity_id: f.id,
                                            files: f.files
                                        }
                                        request.push(this.classPlanActivitiesService.addClassPlanActivities(data_activity))
                                    }
                                })
                                if (request.length)
                                    return forkJoin(request).pipe(mergeMap(() => {
                                        return of(null);
                                    }))
                                return of(null);
                            })).subscribe({
                                next: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastSuccess("Đồng bộ thành công");
                                    this.loadThaoluan();
                                },
                                error: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastError("Đồng bộ thất bại");
                                }
                            });
                        }
                    } else {
                        this.notificationService.isProcessing(false);
                        this.notificationService.confirm('Bài thảo luần chưa được tạo, vui lòng liên hệ đến <span class="comfirm-bold">GIẢNG VIÊN PHỤ TRÁCH MÔN HỌC</span>', 'Thông báo', [BUTTON_CLOSED]).then(() => {
                        })
                    }
                } else {
                    this.notificationService.isProcessing(false);
                    this.notificationService.confirm('Bài thảo luần chưa được tạo, vui lòng liên hệ đến <span class="comfirm-bold">GIẢNG VIÊN PHỤ TRÁCH MÔN HỌC</span>', 'Thông báo', [BUTTON_CLOSED]).then(() => {
                    })
                }
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Đồng bộ thất bại, vui lòng thử lại");
            }
        })
    }

    editThaoLuan(thaoluan: ClassPlanActivities, event) {
        event.stopPropagation();
        this.selected_class_plan_activity = thaoluan;
        this.formData.reset();
        if (this.selected_class_plan_activity.start_date)
            this.f['start_date'].setValue(new Date(this.selected_class_plan_activity.start_date));
        if (this.selected_class_plan_activity.exprided_date)
            this.f['exprided_date'].setValue(new Date(this.selected_class_plan_activity.exprided_date));
        this.notificationService.openSideNavigationMenu({ template: this.templateThaoluan, size: 700, offsetTop: '0px' })
    }

    closeSideMenu() {
        this.notificationService.closeSideNavigationMenu();
    }

    onSelectFileReview(file: OvicDocument) {
        this.selectedFileReview = null;
        this.selectedFileReview = file;
        this.modalService.open(this.filesLessonReview, LARGE_MODAL_OPTIONS);
    }

    saveThaoluan() {
        if (this.formData.valid) {
            this.notificationService.isProcessing(true);
            const data = { ...this.formData.getRawValue() };
            data['start_date'] = this.helperService.stringToDateSql(data['start_date']);
            data['exprided_date'] = this.helperService.stringToDateSql(data['exprided_date']);
            this.classPlanActivitiesService.updateClassPlanActivities(this.selected_class_plan_activity.id, data).subscribe({
                next: () => {
                    this.closeSideMenu();
                    this.notificationService.toastSuccess("Lưu thành công");
                    this.loadThaoluan();

                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Lưu thất bại");
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng nhập đầy đủ thông tin");
        }
    }

    openPostThaoLuan(thaoluan: ClassPlanActivities) {
        this.selectedThaoluan = thaoluan;
        this.loadStudentClass_v2(1, this.limit_student);
    }

    loadStudentClass_v2(page, limit) {
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
                { label: 'limit', value: limit },
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

        this.classStudentService.getClassStudentByPageNew(condition).pipe(mergeMap(_s => {
            const student_ids = _s.data.map(m => m.student_id);
            if (student_ids.length) {
                const condtion_post: ConditionOption = {
                    condition: [
                        { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                        { conditionName: 'class_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectedThaoluan.id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: student_ids.toString() },
                        { label: 'include_by', value: 'student_id' },
                        { label: 'select', value: 'student_id' }
                    ],
                    page: null
                }

                return this.classPlanActivityThaoLuanPostService.getClassPlanActivityThaoLuanPostByPageNew(condtion_post).pipe(mergeMap(_post => {
                    _s.data.forEach(f => {
                        f['count_post'] = _post.data.filter(m => m.student_id === f.student_id).length;
                    })
                    return of(_s);
                }))
            }
            return of(_s);
        })).subscribe({
            next: (_resStudent) => {
                this.total_student = _resStudent.recordsFiltered;
                if (_resStudent.data) {
                    const tmp = [];
                    // this.objectClassStudent = {};
                    const _index_start = (page - 1) * Number(limit);
                    _resStudent.data.forEach((f, key) => {
                        f['index_'] = _index_start + key + 1;
                        f['name'] = f.user_info['name'];
                        f['full_name'] = f.user_info['full_name'];
                        f['birthday'] = f.user_info['birthday'] ? f.user_info['birthday'] : 'Không có';
                        f['email'] = f.user_info['email'];
                        f['student_code'] = f.user_info['student_code'];
                        f['student_status'] = f.status === -1 ? '<span class="student-stop-learning">Bỏ học</span>' : '<span class="student-is-learning">Đang hoạt động</span>';
                        f['student_status'] = f.status === 0 ? '<span class="student-is-waitting">Chờ duyệt</span>' : f['student_status'];
                        tmp.push(f);
                    });
                    this.list_student = tmp;
                } else {
                    this.list_student = [];
                }
                console.log(this.list_student);
                this.notificationService.isProcessing(false);
                this.notificationService.openSideNavigationMenu({ template: this.templateThaoLuanPost, size: 1024, offsetTop: '0px' });
            },

            error: (e) => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Không tải được dữ liệu, lỗi kết nối');
            },
        });
    }

    onSearchStudent(event) {
        this.search_student = event;
        this.loadStudentClass_v2(1, this.limit_student);
    }

    changePage_student(event) {
        this.loadStudentClass_v2(event.page + 1, this.limit_student);
    }

    onSelectStudent(student: ClassStudent) {
        this.selectedStudent = student;
        this.modalService.open(this.templateStudentPost, MAXIMIZE_MODAL_OPTIONS);
        this.loadStudentPost()
    }

    loadStudentPost() {
        this.notificationService.isProcessing(true);
        const condition_post: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                { conditionName: 'class_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectedThaoluan.id.toString(), orWhere: 'and' },
                { conditionName: 'student_id', condition: OvicQueryCondition.equal, value: this.selectedStudent.student_id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'DESC' },
                { label: 'orderby', value: 'created_at' }
            ],
            page: null
        }

        const condition_post_reply: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'class_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectedThaoluan.id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'DESC' },
                { label: 'orderby', value: 'created_at' }
            ],

            page: null
        }

        forkJoin([
            this.classPlanActivityThaoLuanPostService.getClassPlanActivityThaoLuanPostByPageNew(condition_post),
            this.classPlanActivityThaoLuanPostReplyService.getClassPlanActivityThaoLuanPostReplyByPageNew(condition_post_reply)
        ]).subscribe({
            next: ([_post, _reply]) => {
                _post.data.forEach(f => {
                    const reply_ = _reply.data.find(m => m.post_id === f.id);
                    if (reply_) {
                        f['reply'] = reply_;
                    } else {
                        f['reply'] = {
                            noidung: null,
                            files: [],
                            post_id: f.id,
                            class_plan_activity_id: f.class_plan_activity_id,
                            class_id: f.class_id
                        }
                    }

                    f['edit'] = f.reply && f.reply.id ? false : true;

                })
                this.list_thaoluan_post = _post.data;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    openViewFile(file) {
        this.selectedFile = file;
        this.display_view_file = true;
    }

    postReply(post: ClassPlanActivityThaoLuanPost) {
        if (this.noidung_reply) {
            this.notificationService.isProcessing(true);
            const data = {
                noidung: this.noidung_reply,
                files: this.formFile.value,
                post_id: post.id,
                class_plan_activity_id: post.class_plan_activity_id,
                class_id: post.class_id
            }

            if (post.reply.id) {
                this.classPlanActivityThaoLuanPostReplyService.updateClassPlanActivityThaoLuanPostReply(post.reply.id, data).subscribe({
                    next: () => {
                        this.loadStudentPost();
                        this.notificationService.toastSuccess("Lưu thành công");
                        this.formFile.reset();
                    },
                    error: () => {
                        this.notificationService.toastError("Lưu thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            } else {
                this.classPlanActivityThaoLuanPostReplyService.addClassPlanActivityThaoLuanPostReply(data).subscribe({
                    next: () => {
                        this.loadStudentPost();
                        this.notificationService.toastSuccess("Lưu thành công");
                        this.formFile.reset();
                        this.noidung_reply = null;
                    },
                    error: () => {
                        this.notificationService.toastError("Lưu thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        } else {
            this.notificationService.toastWarning("Vui lòng nhập nội dung nhận xét");
        }
    }

    onEditReply(post: ClassPlanActivityThaoLuanPost) {
        this.formFile.reset();
        post['edit'] = true;
        this.formFile.setValue(post.reply.files);
        this.noidung_reply = post.reply.noidung;
    }

    cancelReply(post: ClassPlanActivityThaoLuanPost) {
        this.formFile.reset();
        this.noidung_reply = null;
        post['edit'] = false;
    }

    async downloadFile(event: Event, file: any) {
        event.stopPropagation(); // Chặn nổi bọt lên thẻ cha
        const result = await this.mediaService.AwstplDownloadFile(file);
        switch (result) {
            case DownloadProcess.rejected:
                this.notificationService.toastInfo('Chưa hỗ trợ tải xuống thư mục');
                break;
            case DownloadProcess.error:
                this.notificationService.toastError('Tải xuống thất bại');
                break;
        }
    }
}
