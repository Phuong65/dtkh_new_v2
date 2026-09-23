import { request } from 'http';
import { ClassGroupService } from './../../../../../shared/services/class-group.service';
import { ClassGroupPlanService } from './../../../../../shared/services/class-group-plan.service';
import { UserService } from '@core/services/user.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';

import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OvicQueryCondition } from '@core/models/dto';
import { OvicDocument, OvicFile } from '@core/models/file';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ClassHomework } from '@modules/shared/models/class-homework';
import { ClassHomeworkPost } from '@modules/shared/models/class-homework-post';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { ClassPlans } from '@modules/shared/models/class-plans';
import { ClassStudent } from '@modules/shared/models/class-student';
import { ClassTestQuestion } from '@modules/shared/models/class-test-question';
import { ClassTests } from '@modules/shared/models/class-tests';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { ClassHomeworkPostService } from '@modules/shared/services/class-homework-post.service';
import { ClassHomeworkService } from '@modules/shared/services/class-homework.service';
import { ClassPlanActivitiesService } from '@modules/shared/services/class-plan-activities.service';
import { ClassPlansService } from '@modules/shared/services/class-plans.service';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ClassTestQuestionService } from '@modules/shared/services/class-test-questions.service';
import { ClassTestsService } from '@modules/shared/services/class-tests.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CourseQuestionFormService } from '@modules/shared/services/course-question-form.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import {
    CHUAN_DAU_RA,
    LARGE_MODAL_OPTIONS,
    ROLES,
} from '@modules/shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { CalendarService } from '@shared/services/calendar.service';
import { ClassCalendar } from '@modules/shared/models/class-calendar';
import { AuthService } from '@core/services/auth.service';
import { CoursePlanBankService } from '@modules/shared/services/course-plan-bank.service';
import { ClassGroup } from '@modules/shared/models/class-group';
import { group } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { TabViewModule } from 'primeng/tabview';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { BaitapChuyendeComponent } from '../baitap-chuyende/baitap-chuyende.component';
import { DocumentFileAndLink } from '@modules/shared/components/form-document-file-and-link/form-document-file-and-link.component';

type GeneralInformationActivityType = 'COURSE_DESCRIPTION' | 'STUDENT_REQUIREMENTS' | 'COURSE_DOCUMENTS';
type GeneralInformationDisplayType = GeneralInformationActivityType | 'GENERAL_INFORMATION';
type CourseDocumentGroup = 'Tài liệu chính' | 'Tài liệu tham khảo';

interface CourseDocumentDisplay extends DocumentFileAndLink {
    document_group: CourseDocumentGroup;
}

interface CoursePlanDisplay extends CoursePlanActivities {
    display_type?: GeneralInformationDisplayType;
    documents?: CourseDocumentDisplay[];
}

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, TabViewModule, PanelModule, DialogModule, CalendarModule, ReactiveFormsModule, FormsModule, BaitapChuyendeComponent],
    selector: 'app-class-noidung-giangday-v2',
    templateUrl: './class-noidung-giangday-v2.component.html',
    styleUrls: ['./class-noidung-giangday-v2.component.css']
})
export class ClassNoidungGiangdayV2Component implements OnInit {

    @Input() classSelected: Classes;

    @Input() courseSelected: ElnKhoaHoc;

    @ViewChild('filesLessonReview') filesLessonReview: ElementRef;

    selectedPlan: CoursePlanActivities;

    date_start_plan: Date;

    list_course_plan: CoursePlanDisplay[];

    selectedFileReview: OvicDocument | OvicFile;

    CHUAN_DAU_RA = CHUAN_DAU_RA;

    EXAMFORMAT = EXAMFORMAT;

    label_parent_kehoach: string = 'Bài';

    list_class_plan_activities: ClassPlans[];

    selectedPlanActivity: CoursePlanDisplay;

    displayModal = false;

    progressValue = 0;

    itemsStep = [
        { label: 'Chọn tuần của bài học' },
        { label: 'Đồng bộ bài tập' },
        { label: 'Đồng bộ nội dung' },
    ];

    stepIndex: number = 1;

    upLoadNumber: number = 0;

    displaySyncPlan: boolean = false;

    activeIndex: number = 0;

    search_student: string;

    total_student: number = 0;

    list_student: ClassStudent[] = [];

    selectHomeWork: ClassHomework;

    limit_student: number = 0;

    cols_homework_post: any[] = [];

    selectedStudentPosts: ClassHomeworkPost;

    formClassActivity: FormGroup;

    isUpdate = true;

    list_calendar: ClassCalendar[];

    date_server: Date;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    list_class_group: ClassGroup[];

    activity_date: number = 0;

    disabled_index_date: number;

    constructor(
        private helperService: HelperService,
        private noitifi: NotificationService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private classPlanActivitiesService: ClassPlanActivitiesService,
        private classPlansService: ClassPlansService,
        private modalService: NgbModal,
        private formBuilder: FormBuilder,
        private ovicDateTimeService: OvicDateTimeService,
        private userService: UserService,
        private auth: AuthService,
        private coursePlanBankService: CoursePlanBankService,
        private classGroupPlanService: ClassGroupPlanService,
        private classGroupService: ClassGroupService
    ) {
        this.cols_homework_post = [
            { label: '#', class: 'ovic-w-80px text-center', key: 'index_' },
            {
                label: 'Mã sinh viên',
                class: 'ovic-w-200px text-left',
                key: 'student_code',
            },
            {
                label: 'Họ tên',
                class: 'text-left name-student-homework-post',
                key: 'full_name',
            },
            // {
            //     label: 'Ngày nộp',
            //     class: 'ovic-w-150px text-center',
            //     key: 'ngaytao',
            // },
            // {
            //     label: 'Trạng thái',
            //     class: 'ovic-w-150px text-center',
            //     key: 'trangthai',
            //     innerClass_i: true,
            // },
            {
                label: 'Điểm',
                class: 'ovic-w-100px text-center',
                key: 'point',
                input: true,
            },
        ];

        this.formClassActivity = this.formBuilder.group({
            zoom_meet: [''],
            exprided_date: [''],
        });

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
    }

    get fca() {
        return this.formClassActivity.controls;
    }

    formActivityReset() {
        this.formClassActivity.reset();
        this.isUpdate = false;
    }

    ngOnInit(): void {
        this.loadFirstData();
        // this.classHomeworkPostService.getAllClassHomeworkPost().subscribe( () => {} );
    }

    createGeneralInformationPlan(): CoursePlanDisplay {
        const course = this.classSelected.course_detail || {} as ElnKhoaHoc;
        const sortDocuments = (documents?: DocumentFileAndLink[]): DocumentFileAndLink[] =>
            [...(documents || [])].sort((a, b) => (a.ordering || 0) - (b.ordering || 0));
        const documents: CourseDocumentDisplay[] = [
            ...sortDocuments(course.tailieu_chinh).map(document => ({ ...document, document_group: 'Tài liệu chính' as CourseDocumentGroup })),
            ...sortDocuments(course.tailieu_thamkhao).map(document => ({ ...document, document_group: 'Tài liệu tham khảo' as CourseDocumentGroup }))
        ];
        const createActivity = (
            id: number,
            type: GeneralInformationActivityType,
            title: string,
            desc: string,
            icon: string,
            activityDocuments: CourseDocumentDisplay[] = []
        ): CoursePlanDisplay => ({
            id,
            course_id: this.classSelected.course_id,
            parent_id: -1,
            type: 'ACTIVITY',
            display_type: type,
            ordering: Math.abs(id) - 1,
            title,
            desc: desc || '',
            params: null,
            video: null,
            files: [],
            status: 1,
            icon,
            children: [],
            week: 0,
            course_lesson_id: 0,
            desc_title: '',
            edit: 0,
            slides: [],
            documents: activityDocuments
        });

        return {
            id: -1,
            course_id: this.classSelected.course_id,
            parent_id: 0,
            type: 'PLAN',
            display_type: 'GENERAL_INFORMATION',
            ordering: 0,
            title: 'Thông tin chung',
            desc: '',
            params: null,
            video: null,
            files: [],
            status: 1,
            children: [
                createActivity(-2, 'COURSE_DESCRIPTION', 'Mô tả môn học', course.desc, 'fa fa-info-circle'),
                createActivity(-3, 'STUDENT_REQUIREMENTS', 'Yêu cầu đối với sinh viên', course.yeucau_sinhvien, 'fa fa-list-alt'),
                createActivity(-4, 'COURSE_DOCUMENTS', 'Tài liệu', '', 'fa fa-book', documents)
            ],
            week: 0,
            course_lesson_id: 0,
            desc_title: '',
            edit: 0,
            slides: []
        };
    }

    loadFirstData() {
        if (this.classSelected.course_id) {
            const condition_class_plan: ConditionOption = {
                condition: [
                    {
                        conditionName: 'course_id',
                        condition: OvicQueryCondition.equal,
                        value: this.classSelected.course_id.toString(),
                    },
                    {
                        conditionName: 'class_id',
                        condition: OvicQueryCondition.equal,
                        value: this.classSelected.id.toString(),
                        orWhere: 'and',
                    },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'order', value: 'ASC' },
                ],
                page: null,
            };

            const condition_course_plan: ConditionOption = {
                condition: [
                    {
                        conditionName: 'course_id',
                        condition: OvicQueryCondition.equal,
                        value: this.classSelected.course_id.toString(),
                    },
                    {
                        conditionName: 'status',
                        condition: OvicQueryCondition.notEqual,
                        value: '-3',
                        orWhere: 'and',
                    },
                    {
                        conditionName: 'week',
                        condition: OvicQueryCondition.greaterThan,
                        value: '0',
                        orWhere: 'and',
                    },
                    {
                        conditionName: 'week',
                        condition: OvicQueryCondition.lessThan,
                        value: '100',
                        orWhere: 'and',
                    },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'ordering' },
                ],
                page: null,
            };


            const condition_plan_bank: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                    { conditionName: 'bank_type', condition: OvicQueryCondition.equal, value: 'CC', orWhere: 'and' },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: 'week,id' },
                    { label: 'groupby', value: 'week' }
                ],
                page: null
            }

            this.noitifi.isProcessing(true);

            forkJoin([
                this.classPlansService.getClassPlansByPageNew(condition_class_plan),
                this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condition_class_plan),
                this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_course_plan),
                this.ovicDateTimeService.getCurrentDateTime(),
                this.userService.getUserByItem(this.classSelected.course_detail.creator_plan_id.toString(), 'id'),
                this.coursePlanBankService.getCoursePlanBankByPageNew(condition_plan_bank),
            ]).subscribe({
                next: ([_class_plan, _class_plan_activities, _course_plan, _date_time, _user, _course_plan_bank]) => {
                    const server_date = new Date(_date_time);
                    server_date.setMinutes(server_date.getMinutes() - 10);
                    if (_user[0])
                        this.classSelected.course_detail['user_label'] = _user[0].display_name;

                    const parent_plan = _course_plan.data.filter((m) => m.parent_id === 0);
                    parent_plan.forEach((f, key) => {
                        f['children'] = _course_plan.data.filter((m) => m.parent_id === f.id && m.type !== 'ACTIVITY_CDR');
                        if (f.children.length) {
                            f.children.forEach((c) => {
                                c['week'] = f.week;
                                c['test_ready'] = false;
                                switch (c['type']) {
                                    case 'MEET':
                                        c['icon'] = 'fa fa-video-camera';
                                        break;
                                    case 'ACTIVITY_TEST':
                                        c['icon'] = 'fa fa-clock-o';
                                        c['test_ready'] = _course_plan_bank.data.filter(m => m.week === c.week).length ? true : false;
                                        const index_class_plan = _class_plan.data.findIndex(m => m.course_plan_activity_id === f.id);
                                        if (index_class_plan !== -1) {
                                            c['start_test'] = true;
                                            c['start_date'] = _class_plan.data[index_class_plan].teaching_day;
                                            f['class_plan'] = _class_plan.data[index_class_plan];
                                        } else {
                                            c['start_test'] = false;
                                            c['start_date'] = null;
                                        }

                                        if (c['start_date']) {
                                            if (new Date(c['start_date']).getTime() >= new Date(server_date).getTime()) {
                                                c['can_edit'] = true;
                                            } else {
                                                c['can_edit'] = false;
                                            }

                                            c['can_edit'] = this.isLanhDaoKhoa || this.isManager ? true : c['can_edit'];
                                        } else {
                                            c['can_edit'] = true;
                                        }

                                        break;
                                    case 'THUONGXUYEN_TRACNGHIEM':
                                        c['icon'] = 'fa fa-clock-o';

                                        break;
                                    case 'THUONGXUYEN_TULUAN':
                                        c['icon'] = 'fa fa-pencil-square-o';
                                        break;
                                    case 'ACTIVITY':
                                        c['icon'] = c['video'] && Object.keys(c['video']).length ? 'fa fa-file-video-o' : 'fa fa-file-text-o';
                                        break;
                                    case 'MUCTIEU':
                                        c['icon'] = c['video'] && Object.keys(c['video']).length ? 'fa fa-file-video-o' : 'fa fa-file-text-o';
                                        break;
                                    case 'GIOITHIEU':
                                        c['icon'] = c['video'] && Object.keys(c['video']).length ? 'fa fa-file-video-o' : 'fa fa-file-text-o';
                                        break;
                                    default:
                                        break;
                                }
                            });

                            if (f.week !== 0 && f.week !== 1000) {
                                const CDR: CoursePlanActivities = {
                                    id: f.id - 0.5,
                                    course_id: this.classSelected.course_id,
                                    parent_id: f.id,
                                    type: 'CDR',
                                    ordering: 0,
                                    title: 'Nội dung',
                                    desc: '',
                                    params: null,
                                    video: null,
                                    files: [],
                                    status: 1,
                                    icon: 'fa fa-list-alt',
                                    children: _course_plan.data.filter((m) => m.parent_id === f.id && m.type === 'ACTIVITY_CDR'),
                                    week: f.week,
                                    course_lesson_id: 0,
                                    desc_title: '',
                                    edit: 0,
                                    slides: []
                                };

                                CDR.children.forEach((c) => {
                                    c['stt'] = c.kyhieu ? c.kyhieu.replace(/\D/g, '') : 0;
                                });



                                CDR.children = this.helperService.sort(CDR.children, 'stt');

                                CDR.status = !CDR.children || !CDR.children.length || CDR.children.findIndex(m => m.status !== 1) !== -1 ? 0 : 1;

                                f['children'].splice(1, 0, CDR);
                            }
                        }

                        // if ( f.week === 1000 ) {
                        //     const index_class_plan = _class_plan.data.findIndex( m => m.course_plan_activity_id === f.id );
                        //     if ( index_class_plan !== -1 ) {
                        //         f[ 'class_plan' ] = _class_plan.data[ index_class_plan ];
                        //         f[ 'children' ].forEach( c => {
                        //             const index_class_activity = _class_plan_activities.data.findIndex( m => m.course_plan_activity_id === c.id );
                        //             if ( index_class_activity !== -1 ) {
                        //                 c[ 'class_plan_activity' ] = _class_plan_activities.data[ index_class_activity ];
                        //                 c[ 'start_date' ] = _class_plan_activities.data[ index_class_activity ].start_date;

                        //             }
                        //         } )
                        //         f[ 'isSync' ] = true;
                        //     } else {
                        //         f[ 'isSync' ] = false;
                        //     }
                        // }
                    })

                    const generalInformationPlan = this.createGeneralInformationPlan();
                    this.list_course_plan = [generalInformationPlan, ...parent_plan];
                    this.selectedPlanActivity = generalInformationPlan.children[0];
                    this.noitifi.isProcessing(false);
                },
                error: () => {
                    this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                    this.noitifi.isProcessing(false);
                },
            });
        }
    }

    onChangePlan(plan_activity: CoursePlanDisplay) {
        this.selectedPlanActivity = plan_activity;
    }

    onSelectFileReview(file: OvicDocument | OvicFile) {
        this.selectedFileReview = null;
        this.selectedFileReview = file;
        this.modalService.open(this.filesLessonReview, LARGE_MODAL_OPTIONS);
    }


    openSetStartDateActivityTest(plan_activity: CoursePlanActivities, plan: CoursePlanActivities) {
        this.displaySyncPlan = true;

        this.selectedPlanActivity = plan_activity;

        this.selectedPlan = plan;

        this.date_start_plan = null;

        // this.disabled_index_date = null;

        // if (plan_activity['start_date']) {
        //     this.date_start_plan = new Date(plan_activity['start_date']);
        //     this.disabled_index_date = 1;
        // }


        // this.loadClassGroup(plan_activity, plan);
    }

    startActivityTest() {
        this.noitifi.isProcessing(true);
        this.ovicDateTimeService.getCurrentDateTime().subscribe({
            next: (_date_time) => {
                if (this.activity_date === 0) {
                    const date_server_ = new Date(_date_time);
                    date_server_.setMinutes(date_server_.getMinutes() - 10)
                    const date_server_time = date_server_.getTime();
                    const date_teaching = new Date(this.date_start_plan).getTime();
                    if (date_server_time > date_teaching) {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastWarning("Thời gian kích hoạt bài test không được nhỏ hơn thời gian hiện tại");
                    } else {
                        const data_plan = {
                            class_id: this.classSelected.id,
                            course_id: this.selectedPlan.course_id,
                            week: this.selectedPlan.week,
                            title: this.selectedPlan.week,
                            teaching_day: this.helperService.stringToDateSql(this.date_start_plan.toString()),
                            course_plan_activity_id: this.selectedPlan.id
                        }

                        if (this.selectedPlan.class_plan && this.selectedPlan.class_plan.id) {
                            this.classPlansService.updateClassPlans(this.selectedPlan.class_plan.id, data_plan).subscribe({
                                next: () => {
                                    this.noitifi.isProcessing(false);
                                    this.noitifi.toastSuccess("Cập nhật thành công");
                                    this.displaySyncPlan = false;
                                    this.loadFirstData();
                                },
                                error: () => {
                                    this.noitifi.isProcessing(false);
                                    this.noitifi.toastError("Cập nhật thất bại, vui lòng thử lại");
                                }
                            })
                        } else {
                            this.classPlansService.addClassPlans(data_plan).subscribe({
                                next: () => {
                                    this.noitifi.isProcessing(false);
                                    this.noitifi.toastSuccess("Kích hoạt thành công");
                                    this.displaySyncPlan = false;
                                    this.loadFirstData();
                                },
                                error: () => {
                                    this.noitifi.isProcessing(false);
                                    this.noitifi.toastError("Kích hoạt thất bại, vui lòng thử lại");
                                }
                            })
                        }
                    }
                } else if (this.activity_date === 1) {
                    const date_server_ = new Date(_date_time);
                    date_server_.setMinutes(date_server_.getMinutes() - 10)
                    const date_server_time = date_server_.getTime();
                    let message: string = null;
                    this.list_class_group.forEach(f => {
                        if (f['teaching_day']) {
                            const date_teaching = new Date(f['teaching_day']).getTime();
                            if (date_server_time > date_teaching) {
                                message = "Thời gian kích hoạt " + f.name + " không được nhỏ hơn thời gian hiện tại";
                            }
                        } else {
                            message = "Vui lòng nhập thời gian kích hoạt " + f.name;
                        }
                    })

                    if (message) {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastWarning(message);
                    } else {
                        const data_plan = {
                            class_id: this.classSelected.id,
                            course_id: this.selectedPlan.course_id,
                            week: this.selectedPlan.week,
                            title: this.selectedPlan.week,
                            course_plan_activity_id: this.selectedPlan.id,
                            teaching_day: null
                        }

                        const request: Observable<any>[] = [];

                        if (!this.selectedPlan.class_plan || !this.selectedPlan.class_plan.id) {
                            request.push(this.classPlansService.addClassPlans(data_plan));
                        }

                        this.list_class_group.forEach(f => {
                            if (f['group_plan'] && f['group_plan'].id) {
                                request.push(this.classGroupPlanService.updateClassGroupPlan(f['group_plan'].id, { teaching_day: this.helperService.stringToDateSql(f['teaching_day']) }))
                            } else {
                                const group_plan = {
                                    class_id: this.classSelected.id,
                                    week: this.selectedPlan.week,
                                    teaching_day: this.helperService.stringToDateSql(f['teaching_day']),
                                    class_group_id: f.id
                                }

                                request.push(this.classGroupPlanService.addClassGroupPlan(group_plan));
                            }
                        })

                        if (request.length) {
                            this.progressValue = 0;
                            this.displayModal = true;
                            this.loopAddForm(request, 0).subscribe({
                                next: () => {
                                    this.displayModal = false;
                                    this.displaySyncPlan = false;
                                    this.noitifi.toastSuccess("Lưu thành công");
                                    this.noitifi.isProcessing(false);
                                    this.loadFirstData();
                                },
                                error: () => {
                                    this.displayModal = false;
                                    this.noitifi.toastError("Lưu thất bại, vui lòng thử lại");
                                }
                            })
                        }
                    }
                }
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })

    }


    loadClassGroup(plan_activity: CoursePlanActivities, plan: CoursePlanActivities) {
        const condition_group: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page: null
        }

        const condition_group_plan: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: plan.week.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }

        this.noitifi.isProcessing(true);

        forkJoin([
            this.classGroupService.getClassGroupByPageNew(condition_group),
            this.classGroupPlanService.getClassGroupPlanByPageNew(condition_group_plan),
            this.ovicDateTimeService.getCurrentDateTime()
        ]).subscribe({
            next: ([_group, _group_plan, _date_time]) => {
                this.noitifi.isProcessing(false);
                const date_server_ = new Date(_date_time);
                date_server_.setMinutes(date_server_.getMinutes() - 10)
                const date_server_time = date_server_.getTime();
                if (_group_plan.recordsFiltered) {
                    this.activity_date = 1;
                    this.disabled_index_date = 0;
                } else {
                    this.activity_date = 0;
                }

                _group.data.forEach(c => {
                    const index = _group_plan.data.findIndex(m => m.class_group_id === c.id);
                    c['teaching_day'] = null;
                    c['can_edit'] = true;
                    if (index !== -1) {
                        c['group_plan'] = _group_plan.data[index];
                        c['teaching_day'] = new Date(_group_plan.data[index].teaching_day);
                        if (c['teaching_day'].getTime() >= date_server_time) {
                            c['can_edit'] = true;
                        } else {
                            c['can_edit'] = false;
                        }

                        c['can_edit'] = this.isLanhDaoKhoa || this.isManager ? true : c['can_edit'];
                    }
                })
                this.list_class_group = _group.data;
            },
            error: () => {
                this.noitifi.isProcessing(false);
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

    /** Bản cũ */



}
