
import { data_lophoc } from './../../../danh-muc/dongbo-dulieu/dongbo-dulieu.component';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { OrWhereCondition, OvicQueryCondition } from '@core/models/dto';
import { OvicDocument } from '@core/models/file';
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
import { CourseQuestionForm } from '@modules/shared/models/course-question-form';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { Question } from '@modules/shared/models/question';
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
} from '@modules/shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, filter, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { CalendarService } from '@shared/services/calendar.service';
import { Calendar } from '@modules/shared/models/calendar';
import { ClassCalendar } from '@modules/shared/models/class-calendar';
import { MatSelectionListChange } from '@angular/material/list';
@Component( {
    selector: 'app-class-noidung-giangday',
    templateUrl: './class-noidung-giangday.component.html',
    styleUrls: [ './class-noidung-giangday.component.css' ],
} )
export class ClassNoidungGiangdayComponent implements OnInit {
    @Input() classSelected: Classes;

    @Input() courseSelected: ElnKhoaHoc;

    @ViewChild( 'filesLessonReview' ) filesLessonReview: ElementRef;

    selectedPlan: ClassPlans;

    date_start_plan: Date;

    list_course_plan: CoursePlanActivities[];

    selectedFileReview: OvicDocument;

    CHUAN_DAU_RA = CHUAN_DAU_RA;

    EXAMFORMAT = EXAMFORMAT;

    label_parent_kehoach: string = 'Bài';

    list_class_plan_activities: ClassPlans[];

    selectedPlanActivity: ClassPlanActivities;

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

    constructor (
        private helperService: HelperService,
        private noitifi: NotificationService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private courseQuestionsService: CourseQuestionsService,
        private courseQuestionFormService: CourseQuestionFormService,
        private classPlanActivitiesService: ClassPlanActivitiesService,
        private classPlansService: ClassPlansService,
        private modalService: NgbModal,
        private classStudentService: ClassStudentService,
        private classTestService: ClassTestsService,
        private classTestQuestionService: ClassTestQuestionService,
        private classHomeworkService: ClassHomeworkService,
        private classHomeworkPostService: ClassHomeworkPostService,
        private formBuilder: FormBuilder,
        private calendarService: CalendarService
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

        this.formClassActivity = this.formBuilder.group( {
            zoom_meet: [ '' ],
            exprided_date: [ '' ],
        } );
    }

    get fca () {
        return this.formClassActivity.controls;
    }

    formActivityReset () {
        this.formClassActivity.reset();
        this.isUpdate = false;
    }

    ngOnInit (): void {
        this.loadFirstData();
        // this.classHomeworkPostService.getAllClassHomeworkPost().subscribe( () => {} );
    }

    loadFirstData () {
        if ( this.classSelected.course_id ) {
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
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'ordering' },
                ],
                page: null,
            };

            this.noitifi.isProcessing( true );

            forkJoin( [
                this.classPlansService.getClassPlansByPageNew(
                    condition_class_plan
                ),
                this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(
                    condition_class_plan
                ),
                this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(
                    condition_course_plan
                ),
            ] ).subscribe( {
                next: ( [ _class_plan, _class_plan_activities, _course_plan ] ) => {
                    _class_plan.data.forEach( ( f ) => {
                        f.isSync = true;

                    } );

                    const parent_plan = _course_plan.data.filter(
                        ( m ) => m.parent_id === 0
                    );

                    parent_plan.forEach( ( f, key ) => {
                        f[ 'children' ] = _course_plan.data.filter(
                            ( m ) => m.parent_id === f.id
                        );

                        const index = _class_plan.data.findIndex(
                            ( m ) => m.week === f.week
                        );

                        if ( index === -1 ) {
                            const class_plan_inllusion: ClassPlans = {
                                course_plan_activity_id: f.id,
                                id: f.id * -1,
                                class_id: this.classSelected.id,
                                course_id: this.classSelected.course_id,
                                week: f.week,
                                date_start_of_week: null,
                                date_end_of_week: null,
                                desc: f.desc,
                                title: f.title,
                                desc_title: f.desc_title,
                                isSync: false,
                                type: 'PLAN',
                            };

                            _class_plan.data.push( class_plan_inllusion );

                            const child = _course_plan.data.filter(
                                ( m ) => m.parent_id === f.id && m.status !== 1 && m.type !== 'ACTIVITY_TEST'
                            );

                            if ( child.length !== 0 ) {
                                class_plan_inllusion[ 'canSync' ] = false;
                            } else {
                                class_plan_inllusion[ 'canSync' ] = true;
                            }
                        } else {
                            _class_plan.data[ index ].canSync = true;
                        }
                    } );

                    const class_activities: ClassPlanActivities[] =
                        this.helperService.sort(
                            _class_plan_activities.data,
                            'ordering'
                        );

                    _class_plan.data.forEach( ( f ) => {
                        const child = class_activities.filter(
                            ( m ) =>
                                m.plan_id === f.id && m.type !== 'ACTIVITY_CDR'
                        );
                        f.children = child;
                        if ( f.children.length ) {
                            f.children.forEach( ( c ) => {
                                c[ 'week' ] = f.week;
                                switch ( c[ 'type' ] ) {
                                    case 'MEET':
                                        c[ 'icon' ] = 'fa fa-video-camera';
                                        break;
                                    case 'TESTING_TULUAN':
                                        c[ 'icon' ] = 'fa fa-pencil-square-o';
                                        break;
                                    case 'TESTING_TRACNGHIEM':
                                        c[ 'icon' ] = 'fa fa-clock-o';
                                        break;
                                    case 'THUONGXUYEN_TRACNGHIEM':
                                        c[ 'icon' ] = 'fa fa-clock-o';
                                        break;
                                    case 'THUONGXUYEN_TULUAN':
                                        c[ 'icon' ] = 'fa fa-pencil-square-o';
                                        break;
                                    case 'ACTIVITY':
                                        c[ 'icon' ] =
                                            c[ 'video' ] &&
                                                Object.keys( c[ 'video' ] ).length
                                                ? 'fa fa-file-video-o'
                                                : 'fa fa-file-text-o';
                                        break;
                                    case 'MUCTIEU':
                                        c[ 'icon' ] =
                                            c[ 'video' ] &&
                                                Object.keys( c[ 'video' ] ).length
                                                ? 'fa fa-file-video-o'
                                                : 'fa fa-file-text-o';
                                        break;
                                    case 'GIOITHIEU':
                                        c[ 'icon' ] =
                                            c[ 'video' ] &&
                                                Object.keys( c[ 'video' ] ).length
                                                ? 'fa fa-file-video-o'
                                                : 'fa fa-file-text-o';
                                        break;
                                    default:
                                        break;
                                }
                            } );
                            if ( f.week !== 0 && f.week !== 1000 ) {
                                const CDR: ClassPlanActivities = {
                                    id: f.id - 0.5,
                                    class_id: this.classSelected.id,
                                    course_id: this.classSelected.course_id,
                                    plan_id: f.id,
                                    type: 'CDR',
                                    reference_id: 0,
                                    ordering: 0,
                                    obligatory: 0,
                                    title: 'Nội dung',
                                    desc: '',
                                    params: null,
                                    exprided_date: null,
                                    video: null,
                                    files: [],
                                    status: 1,
                                    icon: 'fa fa-list-alt',
                                    children: class_activities.filter(
                                        ( m ) =>
                                            m.plan_id === f.id &&
                                            m.type === 'ACTIVITY_CDR'
                                    ),
                                };

                                CDR.children.forEach( ( c ) => {
                                    c[ 'stt' ] = c.kyhieu
                                        ? c.kyhieu.replace( /\D/g, '' )
                                        : 0;
                                } );

                                CDR.children = this.helperService.sort(
                                    CDR.children,
                                    'stt'
                                );

                                f[ 'children' ].splice( 1, 0, CDR );
                            }
                        }

                        if ( f.week < 3 ) {
                            f.canSync = true;
                        }
                    } );

                    this.list_course_plan = parent_plan;

                    this.list_class_plan_activities = this.helperService.sort(
                        _class_plan.data,
                        'week'
                    );

                    this.noitifi.isProcessing( false );
                },
                error: () => {
                    this.noitifi.toastError( 'Lỗi kết nối, vui lòng thử lại' );
                    this.noitifi.isProcessing( false );
                },
            } );
        }
    }

    onChangePlan ( plan_activity: ClassPlanActivities ) {
        this.activeIndex = 0;
        this.selectedPlanActivity = plan_activity;
        this.editClassPlanActivity( plan_activity );
    }

    onSelectFileReview ( file: OvicDocument ) {
        this.selectedFileReview = null;
        this.selectedFileReview = file;
        this.modalService.open( this.filesLessonReview, LARGE_MODAL_OPTIONS );
    }

    openSyncPlan ( class_plan: ClassPlans ) {
        this.activeIndex = 0;
        this.selectedPlan = class_plan;
    }

    editClassPlanActivity ( item: ClassPlanActivities ) {
        this.isUpdate = true;
        this.fca[ 'zoom_meet' ].setValue( item.zoom_meet );
        this.fca[ 'exprided_date' ].setValue( item.exprided_date );
    }

    syncPLanActivity ( class_plan: ClassPlans ) {
        this.date_start_plan = null;
        const index = this.list_course_plan.findIndex(
            ( m ) => m.id === class_plan.course_plan_activity_id
        );
        if ( index !== -1 ) {
            this.displaySyncPlan = true;
            this.stepIndex = 0;
            this.selectedPlan = class_plan;
            if ( this.selectedPlan.week === 0 || this.selectedPlan.week === 1000 ) {
                this.readyForLoadCoursePlan();
            }
        } else {
            this.noitifi.toastWarning( 'Không tìm thấy bài giảng' );
        }
    }

    getEndOfweek ( date, week = 6 ) {
        const d = new Date( date );
        const result = d.setDate( d.getDate() + week );
        return new Date( result );
    }

    loadClassCalendar ( template, btn ) {
        const condition_calendar: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ngay' }
            ],
            page: null
        }

        this.noitifi.isProcessing( true );

        this.calendarService.getCalendarByPageNew( condition_calendar ).subscribe( {
            next: ( _calendar ) => {
                this.list_calendar = _calendar.data;
                this.noitifi.isProcessing( false );
                template.show( template, btn );
            },
            error: () => {
                this.noitifi.isProcessing( false );
                this.noitifi.toastError( "Lỗi kết nối, vui lòng thử lại" );
            }
        } )
    }

    selectionChangeDate ( event: ClassCalendar, template ) {
        if ( event ) {
            this.date_start_plan = new Date( event.ngay );
            template.hide();
        }
    }

    readyForLoadCoursePlan () {
        if ( this.date_start_plan || this.selectedPlan.week === 0 || this.selectedPlan.week === 1000 ) {
            this.stepIndex = 1;
            const index = this.list_course_plan.findIndex(
                ( m ) => m.id === this.selectedPlan.course_plan_activity_id
            );
            if ( index !== -1 ) {
                const course_plan = this.list_course_plan[ index ];
                this.upLoadNumber = 3;
                if ( course_plan.children.length ) {
                    let id_for_question_form = [];
                    let id_for_question = [];
                    course_plan.children.forEach( ( f ) => {
                        if ( f.type === 'ACTIVITY_TEST' )
                            id_for_question_form.push( f.id );
                        if ( f.type === 'ACTIVITY_CDR' )
                            id_for_question.push( f.id );
                    } );

                    id_for_question = [ ...new Set( id_for_question ) ];
                    id_for_question_form = [
                        ...new Set( id_for_question_form ),
                    ];

                    const condition_question: ConditionOption = {
                        condition: [
                            {
                                conditionName: 'course_id',
                                condition: OvicQueryCondition.equal,
                                value: this.classSelected.course_id.toString(),
                            },
                            {
                                conditionName: 'reference',
                                condition: OvicQueryCondition.equal,
                                value: 'course_plan_activities',
                                orWhere: 'and',
                            },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            {
                                label: 'include',
                                value: id_for_question.toString(),
                            },
                            {
                                label: 'include_by',
                                value: 'reference_id',
                            },
                        ],
                        page: null,
                    };

                    const condition_question_form: ConditionOption = {
                        condition: [
                            {
                                conditionName: 'course_id',
                                condition: OvicQueryCondition.equal,
                                value: this.classSelected.course_id.toString(),
                            },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            {
                                label: 'include',
                                value: id_for_question_form.toString(),
                            },
                            {
                                label: 'include_by',
                                value: 'course_plan_activity_id	',
                            },
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
                            { label: 'orderby', value: 'user_info' },
                            { label: 'limit', value: '-1' },
                        ],
                        page: null,
                    };

                    this.noitifi.isProcessing( true );

                    forkJoin( [
                        this.courseQuestionFormService.getCourseQuestionFormByPageNew(
                            condition_question_form
                        ),
                        this.courseQuestionsService.getCourseQuestionsByPageNew(
                            condition_question
                        ),
                        this.classStudentService.getClassStudentByPageNew(
                            condition_student
                        ),
                    ] ).subscribe( {
                        next: ( [
                            _question_form,
                            _question,
                            _class_student,
                        ] ) => {
                            this.noitifi.isProcessing( false );
                            this.convertDataToSql(
                                // _question_form.data,
                                // _question.data,
                                course_plan,
                                this.selectedPlan,
                                _class_student.data
                            );
                        },
                        error: () => {
                            this.noitifi.isProcessing( false );
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                        },
                    } );
                }
            }
        } else {
            this.noitifi.toastWarning( 'Vui lòng nhập ngày bắt đầu' );
        }
    }

    convertDataToSql (
        // _question_form: CourseQuestionForm[],
        // _question: CourseQuestions[],
        coursePlanActivity: CoursePlanActivities,
        class_plan: ClassPlans,
        class_student: ClassStudent[]
    ) {
        const baitap_tuluan: ClassHomework[] = [];
        const kiemtra_chuyende: ClassTests[] = [];
        const class_plan_activities: ClassPlanActivities[] = [];

        const class_plan_import: ClassPlans = {
            id: class_plan.id < 0 ? 0 : class_plan.id,
            class_id: this.classSelected.id,
            course_id: this.classSelected.course_id,
            week: coursePlanActivity.week,
            date_start_of_week: null,
            date_end_of_week: null,
            desc: coursePlanActivity.desc,
            title: coursePlanActivity.title,
            course_plan_activity_id: coursePlanActivity.id,
            teaching_day: null

        };

        if ( class_plan.week > 0 && class_plan.week < 1000 ) {
            const day = this.date_start_plan.getDay();
            class_plan_import.teaching_day = this.helperService.strToSQLDate( this.date_start_plan.toString() );
            const start_week = this.date_start_plan.setDate( this.date_start_plan.getDate() - ( day - 1 ) );
            class_plan_import[ 'date_start_of_week' ] = this.helperService.strToSQLDate( new Date( start_week ).toString() );
            const end_week = this.date_start_plan.setDate( this.date_start_plan.getDate() + 6 );
            class_plan_import[ 'date_end_of_week' ] = this.helperService.strToSQLDate( new Date( end_week ).toString() );

        }

        coursePlanActivity.children.forEach( ( f ) => {
            const index_class = class_plan.children.findIndex(
                ( m ) => m.course_plan_activity_id === f.id
            );

            if ( f.type === 'ACTIVITY_CDR' ) {
                const cdr = class_plan.children.find( ( m ) => m.type === 'CDR' );
                let id_cdr = 0;
                if ( cdr ) {
                    const index_cdr = cdr.children.findIndex(
                        ( m ) => m.course_plan_activity_id === f.id
                    );
                    id_cdr =
                        index_cdr !== -1 && cdr.children[ index_cdr ].id > 0
                            ? cdr.children[ index_cdr ].id
                            : 0;
                }

                const class_plan_activity: ClassPlanActivities = {
                    id: id_cdr,
                    class_id: this.classSelected.id,
                    course_id: this.classSelected.course_id,
                    plan_id: class_plan.id <= 0 ? 0 : class_plan.id,
                    type: f.type,
                    reference_id: 0,
                    ordering: f.ordering,
                    obligatory: 1,
                    title: f.title,
                    desc: f.desc,
                    desc_title: f.desc_title,
                    params: f.params,
                    exprided_date: class_plan_import.date_end_of_week,
                    video: f.video,
                    files: f.files,
                    status: f.status,
                    kyhieu: f.kyhieu,
                    course_plan_activity_id: f.id,
                };

                class_plan_activities.push( class_plan_activity );
            } else {
                const class_plan_activity: ClassPlanActivities = {
                    id:
                        index_class !== -1 &&
                            class_plan.children[ index_class ].id > 0
                            ? class_plan.children[ index_class ].id
                            : 0,
                    class_id: this.classSelected.id,
                    course_id: this.classSelected.course_id,
                    plan_id: class_plan.id <= 0 ? 0 : class_plan.id,
                    type: null,
                    reference_id:
                        index_class !== -1 &&
                            class_plan.children[ index_class ].id > 0
                            ? class_plan.children[ index_class ].reference_id
                            : 0,
                    ordering: f.ordering,
                    obligatory: 1,
                    title: f.title,
                    desc: f.desc,
                    desc_title: f.desc_title,
                    params: f.params,
                    exprided_date: class_plan_import.date_end_of_week,
                    video: f.video,
                    files: f.files,
                    status: f.status,
                    course_plan_activity_id: f.id,
                    slides: f.slides
                };

                switch ( f.type ) {
                    case 'ACTIVITY_TEST':
                        // const index = _question_form.findIndex(
                        //     ( m ) => m.course_plan_activity_id === f.id
                        // );

                        // if ( index !== -1 ) {
                        //     if ( _question_form[ index ] ) {
                        //         _question_form[ index ].structure.forEach( ( s ) => {
                        //             s[ 'course_question_ids' ] = [];
                        //             if ( s.question && s.question.length ) {
                        //                 s.question.forEach( ( q ) => {
                        //                     s[ 'course_question_ids' ].push( q );
                        //                 } );
                        //             }
                        //             s.question = [];
                        //         } );
                        //     }

                        //     const class_test: ClassTests = {
                        //         id:
                        //             index_class !== -1 &&
                        //                 class_plan.children[ index_class ].id > 0
                        //                 ? class_plan.children[ index_class ]
                        //                     .reference_id
                        //                 : 0,
                        //         content: f.title,
                        //         class_id: this.classSelected.id,
                        //         status: 0,
                        //         time_start:
                        //             class_plan_import.date_start_of_week,
                        //         total_time:
                        //             index !== -1
                        //                 ? _question_form[ index ].total_time
                        //                 : 0,
                        //         point: -1,
                        //         source: 'course_question_form',
                        //         course_question_form_id:
                        //             _question_form[ index ].id,
                        //         type_test:
                        //             index !== -1
                        //                 ? _question_form[ index ].type_test
                        //                 : null,
                        //         structure:
                        //             index !== -1
                        //                 ? _question_form[ index ].structure
                        //                 : null,
                        //         course_plan_activity_id: f.id,
                        //         config:
                        //             index !== -1
                        //                 ? _question_form[ index ].config
                        //                 : null,
                        //         purpose: 'ADDITIONAL',
                        //     };

                        //     if ( class_test.id === 0 ) {
                        //         const class_test_questions: ClassTestQuestion[] =
                        //             [];

                        //         // _question.forEach( ( q ) => {
                        //         //     const class_test_question: ClassTestQuestion =
                        //         //     {
                        //         //         id: q.id,
                        //         //         class_id: this.classSelected.id,
                        //         //         class_test_id: 0,
                        //         //         question_direction:
                        //         //             q.question_direction,
                        //         //         question_type: q.question_type,
                        //         //         answer_option: q.answer_option,
                        //         //         answer_correct: q.answer_correct,
                        //         //         group_id: q.group_id,
                        //         //         status: 1,
                        //         //         part: q.part,
                        //         //         course_id:
                        //         //             this.classSelected.course_id,
                        //         //         course_questions_id: q.id,
                        //         //         media: q.media,
                        //         //         code: q.code,
                        //         //         question_number: q.question_number,
                        //         //         config: q.config,
                        //         //         raw_answer: q[ 'raw_answer' ],
                        //         //     };

                        //         //     class_test_questions.push(
                        //         //         class_test_question
                        //         //     );
                        //         // } );

                        //         const parent_class_test_question =
                        //             class_test_questions.filter(
                        //                 ( m ) => m.group_id === 0
                        //             );
                        //         parent_class_test_question.forEach( ( p ) => {
                        //             p[ 'children' ] = class_test_questions.filter(
                        //                 ( m ) => m.group_id === p.id
                        //             );
                        //         } );

                        //         class_test[ 'class_test_questions' ] =
                        //             parent_class_test_question;
                        //     }

                        //     kiemtra_chuyende.push( class_test );
                        // }

                        class_plan_activity.type = 'TESTING_TRACNGHIEM';

                        break;

                    case 'OFFLINE_TEST':
                        const class_homework: ClassHomework = {
                            id:
                                index_class !== -1 &&
                                    class_plan.children[ index_class ].id > 0
                                    ? class_plan.children[ index_class ]
                                        .reference_id
                                    : 0,
                            class_id: this.classSelected.id,
                            title: f.title,
                            type: 'BAITAP',
                            online: 0,
                            desc: f.desc,
                            files: f.files,
                            time_start: class_plan_import.date_start_of_week,
                            deadlines: class_plan_import.date_end_of_week,
                            type_of_return: 'student',
                            topic_type: 'SINGLE',
                        };

                        class_homework[ 'course_plan_activity_id' ] = f.id;

                        if ( class_homework.id === 0 ) {
                            const class_homework_posts: ClassHomeworkPost[] =
                                [];
                            class_student.forEach( ( c ) => {
                                const class_homework_post: ClassHomeworkPost = {
                                    class_id: this.classSelected.id,
                                    class_homework_id: null,
                                    class_student_id: c.id,
                                    student_id: c.student_id,
                                    point: -1,
                                    status: 1,
                                };

                                class_homework_posts.push( class_homework_post );
                            } );

                            class_homework[ 'class_homework_posts' ] =
                                class_homework_posts;
                        }

                        baitap_tuluan.push( class_homework );
                        class_plan_activity.type = 'TESTING_TULUAN';
                        break;
                    case 'MEET':
                        class_plan_activity.exprided_date =
                            class_plan_import.date_start_of_week;
                        class_plan_activity[ 'type' ] = f.type;
                        break;
                    default:
                        if (
                            f.type === 'ACTIVITY' ||
                            f.type === 'MUCTIEU' ||
                            f.type === 'GIOITHIEU' ||
                            f.type === 'THUONGXUYEN_TRACNGHIEM' ||
                            f.type === 'THUONGXUYEN_TULUAN'
                        )
                            class_plan_activity[ 'type' ] = f.type;

                        if ( f.type === 'THUONGXUYEN_TRACNGHIEM' || f.type === 'THUONGXUYEN_TULUAN' ) {
                            class_plan_activity[ 'status' ] = 0;
                        }

                        break;
                }

                class_plan_activities.push( class_plan_activity );
            }
        } );

        this.upLoadNumber = 1;
        this.stepIndex = 1;
        this.loopAddHomeWork(
            baitap_tuluan[ 0 ],
            baitap_tuluan,
            0,
            class_plan_activities,
            class_plan_import
        );

        // this.loopImportToClassTest(
        //     kiemtra_chuyende[0],
        //     kiemtra_chuyende,
        //     0,
        //     baitap_tuluan,
        //     class_plan_activities,
        //     class_plan_import
        // );
    }

    loopImportToClassTest (
        class_test: ClassTests,
        data_class_test: ClassTests[],
        key: number,
        data_tuluan: ClassHomework[],
        data_class_plan: ClassPlanActivities[],
        class_plan: ClassPlans
    ) {
        if ( key < data_class_test.length ) {
            this.progressValue = ( ( key + 1 ) / data_class_test.length ) * 100;
            const class_test_import: ClassTests = {
                content: class_test.content,
                class_id: this.classSelected.id,
                status: class_test.status,
                time_start: class_test.time_start,
                total_time: class_test.total_time,
                point: class_test.point,
                source: class_test.source,
                course_question_form_id: class_test.course_question_form_id,
                type_test: class_test.type_test,
                structure: class_test.structure,
                course_plan_activity_id: class_test.course_plan_activity_id,
                config: class_test.config,
                purpose: class_test.purpose,
            };

            if ( class_test.id === 0 ) {
                this.classTestService
                    .addClassTests( class_test_import )
                    .subscribe( {
                        next: ( _id_class_test ) => {
                            class_test[ 'id' ] = _id_class_test;
                            class_test[ 'new' ] = true;
                            class_test.class_test_questions
                                .filter(
                                    ( m ) =>
                                        m[ 'course_question_form_id' ] ===
                                        class_test[ 'course_question_form_id' ]
                                )
                                .forEach( ( f ) => {
                                    f[ 'class_test_id' ] = _id_class_test;
                                } );

                            const index = data_class_plan.findIndex(
                                ( m ) =>
                                    m.course_plan_activity_id ===
                                    class_test[ 'course_plan_activity_id' ]
                            );

                            if ( index !== -1 ) {
                                data_class_plan[ index ][ 'reference_id' ] =
                                    _id_class_test;
                            }

                            this.loopImportToClassTest(
                                data_class_test[ key + 1 ],
                                data_class_test,
                                key + 1,
                                data_tuluan,
                                data_class_plan,
                                class_plan
                            );
                        },
                        error: () => {
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                            this.stepIndex = 0;
                        },
                    } );
            } else {
                this.classTestService
                    .updateClassTests( class_test.id, class_test_import )
                    .subscribe( {
                        next: () => {
                            this.loopImportToClassTest(
                                data_class_test[ key + 1 ],
                                data_class_test,
                                key + 1,
                                data_tuluan,
                                data_class_plan,
                                class_plan
                            );
                        },
                        error: () => {
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                            this.stepIndex = 0;
                        },
                    } );
            }
        } else {
            this.upLoadNumber = this.upLoadNumber + 1;
            this.progressValue = 0;

            let questions: ClassTestQuestion[] = [];
            data_class_test.forEach( ( f ) => {
                if ( f[ 'new' ] )
                    questions = questions.concat( f.class_test_questions );
            } );
            if ( questions.length ) {
                this.loopImportToClassTestQuestion(
                    0,
                    questions[ 0 ],
                    questions,
                    data_tuluan,
                    data_class_plan,
                    class_plan,
                    data_class_test
                );
            } else {
                this.upLoadNumber = 1;
                this.stepIndex = 2;
                this.loopAddHomeWork(
                    data_tuluan[ 0 ],
                    data_tuluan,
                    0,
                    data_class_plan,
                    class_plan
                );
            }

            // this.loopImportToClassTestQuestion(
            //     parent[0],
            //     parent,
            //     0,
            //     data_class_test,
            //     _class_student
            // );
        }
    }

    loopImportToClassTestQuestion (
        key: number,
        question: ClassTestQuestion,
        questions: ClassTestQuestion[],
        data_tuluan: ClassHomework[],
        data_class_plan: ClassPlanActivities[],
        class_plan: ClassPlans,
        data_class_test: ClassTests[]
    ) {
        if ( key < questions.length ) {
            this.progressValue = ( ( key + 1 ) / questions.length ) * 100;
            const quest = {
                class_id: this.classSelected.id,
                class_test_id: question.class_test_id,
                question_direction: question.question_direction,
                question_type: question.question_type,
                answer_option: question.answer_option,
                answer_correct: question.answer_correct,
                group_id: question.group_id,
                status: question.status,
                part: question.part,
                course_id: this.classSelected.course_id,
                course_questions_id: question.course_questions_id,
                media: question.media,
                code: question.code,
                question_number: question.question_number,
                config: question.config,
                raw_answer: question[ 'raw_answer' ],
            };

            if ( !quest.media ) {
                delete quest.media;
            }

            this.classTestQuestionService
                .addClassTestQuestion( quest )
                .subscribe( {
                    next: ( _id ) => {
                        if (
                            question[ 'children' ] &&
                            question[ 'children' ].length
                        ) {
                            question[ 'children' ].forEach( ( f ) => {
                                f.group_id = _id;
                            } );
                        }

                        const index_ = data_class_test.findIndex(
                            ( m ) => m.id === quest.class_test_id
                        );

                        if ( index_ !== -1 ) {
                            if ( data_class_test[ index_ ].structure ) {
                                data_class_test[ index_ ].structure.forEach(
                                    ( s ) => {
                                        const index = s[
                                            'course_question_ids'
                                        ].findIndex(
                                            ( m ) =>
                                                m === quest.course_questions_id
                                        );
                                        if ( index !== -1 ) {
                                            s.question.push( _id );
                                        }
                                    }
                                );
                            }
                        }

                        this.loopImportToClassTestQuestion(
                            key + 1,
                            questions[ key + 1 ],
                            questions,
                            data_tuluan,
                            data_class_plan,
                            class_plan,
                            data_class_test
                        );
                    },
                    error: () => {
                        this.displayModal = false;
                        this.stepIndex = 0;
                        this.noitifi.toastError(
                            'Lỗi kết nối, vui lòng thử lại'
                        );
                    },
                } );
        } else {
            let childrens = [];
            questions.forEach( ( f ) => {
                if ( f[ 'children' ] ) {
                    childrens = childrens.concat( f[ 'children' ] );
                }
            } );
            this.upLoadNumber = this.upLoadNumber + 1;
            if ( childrens.length ) {
                this.progressValue = 0;
                this.loopImportToClassTestQuestion(
                    0,
                    childrens[ 0 ],
                    childrens,
                    data_tuluan,
                    data_class_plan,
                    class_plan,
                    data_class_test
                );
            } else {
                this.displayModal = false;
                data_class_test.forEach( ( f ) => {
                    f.structure.forEach( ( s ) => {
                        delete s[ 'course_question_ids' ];
                    } );
                } );
                this.progressValue = 0;
                this.loopUpdateClassTest(
                    data_class_test[ 0 ],
                    data_class_test,
                    0,
                    data_tuluan,
                    data_class_plan,
                    class_plan
                );
                this.noitifi.toastSuccess( 'Thêm câu hỏi thành công' );
            }
        }
    }

    loopUpdateClassTest (
        class_test: ClassTests,
        data_class_test: ClassTests[],
        key: number,
        data_tuluan: ClassHomework[],
        data_class_plan: ClassPlanActivities[],
        class_plan: ClassPlans
    ) {
        if ( key < data_class_test.length ) {
            this.progressValue = ( ( key + 1 ) / data_class_test.length ) * 100;
            this.classTestService
                .updateClassTests( class_test[ 'id' ], {
                    structure: class_test.structure,
                } )
                .subscribe( {
                    next: () => {
                        this.loopUpdateClassTest(
                            data_class_test[ key + 1 ],
                            data_class_test,
                            key + 1,
                            data_tuluan,
                            data_class_plan,
                            class_plan
                        );
                    },
                    error: () => {
                        this.noitifi.toastError(
                            'Lỗi kết nối, vui lòng thử lại'
                        );
                        this.stepIndex = 0;
                    },
                } );
        } else {
            this.upLoadNumber = 1;
            this.stepIndex = 2;
            this.loopAddHomeWork(
                data_tuluan[ 0 ],
                data_tuluan,
                0,
                data_class_plan,
                class_plan
            );
        }
    }

    loopAddHomeWork (
        class_homework: ClassHomework,
        data_class_home: ClassHomework[],
        key: number,
        data_class_plan: ClassPlanActivities[],
        class_plan: ClassPlans
    ) {
        if ( key < data_class_home.length ) {
            this.progressValue = ( ( key + 1 ) / data_class_home.length ) * 100;
            const class_home = {
                class_id: this.classSelected.id,
                title: class_homework.title,
                type: class_homework.type,
                online: class_homework.online,
                desc: class_homework.desc,
                files: class_homework.files,
                time_start: class_homework.time_start,
                deadlines: class_homework.deadlines,
                type_of_return: class_homework.type_of_return,
                topic_type: class_homework.topic_type,
            };

            if ( class_homework.id === 0 ) {
                this.classHomeworkService
                    .addClassHomework( class_home )
                    .subscribe( {
                        next: ( _id_class_homeword ) => {
                            if ( class_homework.class_homework_posts ) {
                                class_homework.class_homework_posts.forEach(
                                    ( f ) => {
                                        f.class_homework_id =
                                            _id_class_homeword;
                                    }
                                );
                            }

                            const index = data_class_plan.findIndex(
                                ( m ) =>
                                    m.course_plan_activity_id ===
                                    class_homework[ 'course_plan_activity_id' ]
                            );
                            if ( index !== -1 ) {
                                data_class_plan[ index ][ 'reference_id' ] =
                                    _id_class_homeword;
                            }

                            this.loopAddHomeWork(
                                data_class_home[ key + 1 ],
                                data_class_home,
                                key + 1,
                                data_class_plan,
                                class_plan
                            );
                        },
                        error: () => {
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                            this.stepIndex = 0;
                        },
                    } );
            } else {
                this.classHomeworkService
                    .updateClassHomework( class_homework.id, class_home )
                    .subscribe( {
                        next: () => {
                            this.loopAddHomeWork(
                                data_class_home[ key + 1 ],
                                data_class_home,
                                key + 1,
                                data_class_plan,
                                class_plan
                            );
                        },
                        error: () => {
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                            this.stepIndex = 0;
                        },
                    } );
            }
        } else {
            this.upLoadNumber = this.upLoadNumber + 1;
            this.progressValue = 0;
            let children: ClassHomeworkPost[] = [];
            data_class_home.forEach( ( f ) => {
                if ( f.class_homework_posts && f.id <= 0 ) {
                    children = children.concat( f.class_homework_posts );
                }
            } );

            if ( children && children.length ) {
                this.loopAddToHomeWorkPost(
                    children[ 0 ],
                    children,
                    0,
                    data_class_plan,
                    class_plan
                );
            } else {
                this.upLoadNumber = this.upLoadNumber + 1;
                this.stepIndex = 2;
                this.upLoadNumber = 0;
                this.addParentPlan( data_class_plan, class_plan );
            }
        }
    }

    loopAddToHomeWorkPost (
        home_post: ClassHomeworkPost,
        data_home_post: ClassHomeworkPost[],
        key,
        data_class_plan: ClassPlanActivities[],
        class_plan: ClassPlans
    ) {
        if ( key < data_home_post.length ) {
            this.progressValue = ( ( key + 1 ) / data_home_post.length ) * 100;
            this.classHomeworkPostService
                .addClassHomeworkPost( home_post )
                .subscribe( {
                    next: () => {
                        this.loopAddToHomeWorkPost(
                            data_home_post[ key + 1 ],
                            data_home_post,
                            key + 1,
                            data_class_plan,
                            class_plan
                        );
                    },
                    error: () => {
                        this.noitifi.toastError(
                            'Lỗi kết nối, vui lòng thử lại'
                        );
                        this.stepIndex = 0;
                    },
                } );
        } else {
            this.upLoadNumber = this.upLoadNumber + 1;
            this.stepIndex = 2;
            this.upLoadNumber = 0;
            this.addParentPlan( data_class_plan, class_plan );
        }
    }

    addParentPlan (
        data_class_plan: ClassPlanActivities[],
        class_plan: ClassPlans
    ) {
        if ( class_plan.id <= 0 ) {
            delete class_plan.id;
            this.classPlansService.addClassPlans( class_plan ).subscribe( {
                next: ( _id ) => {
                    data_class_plan.forEach( ( f ) => {
                        f.plan_id = _id;
                    } );
                    this.upLoadNumber = this.upLoadNumber + 1;
                    this.loopAddClassPlanActivity(
                        data_class_plan[ 0 ],
                        data_class_plan,
                        0
                    );
                },
                error: () => {
                    this.noitifi.toastError( 'Lỗi kết nối, vui lòng thử lại' );
                    this.stepIndex = 0;
                },
            } );
        } else {
            const id = class_plan.id;
            delete class_plan.id;
            this.classPlansService.updateClassPlans( id, class_plan ).subscribe( {
                next: () => {
                    this.upLoadNumber = this.upLoadNumber + 1;
                    this.loopAddClassPlanActivity(
                        data_class_plan[ 0 ],
                        data_class_plan,
                        0
                    );
                },
                error: () => {
                    this.noitifi.toastError( 'Lỗi kết nối, vui lòng thử lại' );
                    this.stepIndex = 0;
                },
            } );
        }
    }

    loopAddClassPlanActivity ( activity: ClassPlanActivities,
        data_activity: ClassPlanActivities[],
        key: number
    ) {
        if ( key < data_activity.length ) {
            this.progressValue = ( ( key + 1 ) / data_activity.length ) * 100;

            const data_import: ClassPlanActivities = {
                class_id: this.classSelected.id,
                course_id: this.classSelected.course_id,
                plan_id: activity.plan_id,
                type: activity.type,
                reference_id: activity.reference_id,
                ordering: activity.ordering,
                obligatory: activity.obligatory,
                title: activity.title,
                desc: activity.desc,
                desc_title: activity.desc_title,
                params: activity.params,
                exprided_date: activity.exprided_date,
                video: activity.video,
                files: activity.files,
                status: activity.status,
                kyhieu: activity.kyhieu,
                course_plan_activity_id: activity.course_plan_activity_id,
                slides: activity.slides
            };

            if ( activity.id <= 0 ) {
                this.classPlanActivitiesService
                    .addClassPlanActivities( data_import )
                    .subscribe( {
                        next: ( _id ) => {
                            activity[ 'class_plan_activity_id' ] = _id;
                            this.loopAddClassPlanActivity(
                                data_activity[ key + 1 ],
                                data_activity,
                                key + 1
                            );
                        },
                        error: () => {
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                            this.stepIndex = 0;
                        },
                    } );
            } else {
                this.classPlanActivitiesService
                    .updateClassPlanActivities( activity.id, data_import )
                    .subscribe( {
                        next: () => {
                            this.loopAddClassPlanActivity(
                                data_activity[ key + 1 ],
                                data_activity,
                                key + 1
                            );
                        },
                        error: () => {
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                            this.stepIndex = 0;
                        },
                    } );
            }
        } else {
            this.upLoadNumber = this.upLoadNumber + 1;
            this.noitifi.toastSuccess( 'Đồng bộ thành công' );
            this.displaySyncPlan = false;
            this.loadFirstData();
        }
    }

    tapViewBaitap () {
        if ( this.activeIndex === 1 ) {
            this.loadStudentClass( 1, this.limit_student );
        }
    }

    loadStudentClass ( page, limit ) {
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
                { label: 'orderby', value: 'user_info' },
                { label: 'limit', value: limit },
            ],
            page: page,
        };

        if ( this.search_student ) {
            condition.condition.push( {
                conditionName: 'user_info',
                condition: OvicQueryCondition.like,
                value: '%' + this.search_student.trim() + '%',
                orWhere: 'and',
            } );
        }

        this.classStudentService
            .getClassStudentByPageNew( condition )
            .pipe(
                catchError( ( e ) => {
                    console.log( e );
                    this.noitifi.isProcessing( false );
                    return of( e );
                } ),
                mergeMap( ( _res_student ) => {
                    if ( this.selectedPlanActivity.type === 'TESTING_TULUAN' ) {
                        const class_student_id = [ 0 ];
                        _res_student.data.forEach( ( f ) => {
                            class_student_id.push( f.id );
                        } );
                        return this.loadPostHomeWork_v2(
                            class_student_id,
                            _res_student
                        );
                    }

                    return of( _res_student );
                } )
            )
            .subscribe( {
                next: ( _resStudent ) => {
                    this.total_student = _resStudent.recordsFiltered;
                    if ( _resStudent.data ) {
                        const tmp = [];
                        // this.objectClassStudent = {};
                        const _index_start = ( page - 1 ) * Number( limit );
                        _resStudent.data.forEach( ( f, key ) => {
                            f[ 'index_' ] = _index_start + key + 1;
                            f[ 'name' ] = f.user_info[ 'name' ];
                            f[ 'full_name' ] = f.user_info[ 'full_name' ];
                            f[ 'birthday' ] = f.user_info[ 'birthday' ]
                                ? f.user_info[ 'birthday' ]
                                : 'Không có';
                            f[ 'email' ] = f.user_info[ 'email' ];
                            f[ 'student_code' ] = f.user_info[ 'student_code' ];
                            f[ 'student_status' ] =
                                f.status === -1
                                    ? '<span class="student-stop-learning">Bỏ học</span>'
                                    : '<span class="student-is-learning">Đang hoạt động</span>';
                            f[ 'student_status' ] =
                                f.status === 0
                                    ? '<span class="student-is-waitting">Chờ duyệt</span>'
                                    : f[ 'student_status' ];
                            // if (!this.objectClassStudent[f.id]) {
                            //     this.objectClassStudent[f.id] = f;
                            // }
                            tmp.push( f );
                        } );

                        this.list_student = _resStudent.data;
                    } else {
                        this.list_student = [];
                    }

                    this.noitifi.isProcessing( false );
                },

                error: ( e ) => {
                    console.log( e );
                    this.noitifi.isProcessing( false );

                    this.noitifi.toastError(
                        'Không tải được dữ liệu, lỗi kết nối'
                    );
                },
            } );
    }

    loadPostHomeWork_v2 (
        class_student_id: any[],
        tmp: { data: ClassStudent[]; recordsFiltered: number }
    ): Observable<{ data: ClassStudent[]; recordsFiltered: number }> {
        const option_homeword_post: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_homework_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedPlanActivity.reference_id.toString(),
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'orderby', value: 'id' },
                { label: 'order', value: 'DESC' },
                { label: 'limit', value: '-1' },
                // { label: 'groupby', value: 'class_student_id' },
                { label: 'include', value: class_student_id.toString() },
                { label: 'include_by', value: 'class_student_id' },
            ],
            page: null,
        };

        return this.classHomeworkPostService
            .getClassStudentByPageNew( option_homeword_post )
            .pipe(
                catchError( ( e ) => {
                    this.noitifi.isProcessing( false );
                    return of( e );
                } ),
                mergeMap( ( _post ) => {
                    tmp.data.forEach( ( f ) => {
                        const index = _post.data.findIndex(
                            ( m ) => m.class_student_id === f.id
                        );
                        if ( index !== -1 ) {
                            if ( _post.data[ index ][ 'created_at' ] ) {
                                f[ 'ngaytao' ] = '--';
                                f[ 'trangthai' ] =
                                    '<b class="accept-homework">KT offline</b>';
                                f[ 'note' ] = _post.data[ index ][ 'note' ]
                                    ? this.decodeHTML( _post.data[ index ][ 'note' ] )
                                    : _post.data[ index ][ 'note' ];
                                f[ 'homework_post_id' ] = _post.data[ index ].id;
                                f[ 'point' ] =
                                    _post.data[ index ][ 'point' ] === -1
                                        ? null
                                        : _post.data[ index ][ 'point' ];
                                f[ 'files' ] = _post.data[ index ][ 'files' ];
                                f[ 'comment' ] = _post.data[ index ][ 'comment' ];
                            }
                        } else {
                            f[ 'point' ] = 0;
                            f[ 'trangthai' ] =
                                '<b class="none-homework">Chưa nộp</b>';
                        }
                    } );
                    return of( tmp );
                } )
            );
    }

    decodeHTML ( text: string ): string {
        return text
            .replace( /&apos;/g, "'" )
            .replace( /&quot;/g, '"' )
            .replace( /&gt;/g, '>' )
            .replace( /&lt;/g, '<' )
            .replace( /&amp;/g, '&' );
    }

    onSearchStudent ( event ) {
        this.loadStudentClass( 1, this.limit_student );
    }

    submitPointStudent () {
        this.displayModal = true;

        const data = this.list_student.filter(
            ( m ) => m[ 'edit' ] && m[ 'homework_post_id' ]
        );
        this.loopSubmitPointStudent( data[ 0 ], data, 0 );
    }

    loopSubmitPointStudent ( data, datas, key ) {
        if ( key < datas.length ) {
            this.progressValue = Number(
                ( ( ( key + 1 ) / datas.length ) * 100 ).toFixed( 2 )
            );
            this.classHomeworkPostService
                .updateClassHomeworkPost( data[ 'homework_post_id' ], {
                    point: data[ 'point' ],
                    status: 1,
                } )
                .subscribe( {
                    next: () => {
                        this.loopSubmitPointStudent(
                            datas[ key + 1 ],
                            datas,
                            key + 1
                        );
                    },
                    error: () => {
                        this.loopSubmitPointStudent(
                            datas[ key + 1 ],
                            datas,
                            key + 1
                        );
                    },
                } );
        } else {
            this.list_student.forEach( ( f ) => {
                f[ 'edit' ] = false;
            } );
            this.displayModal = false;
            this.noitifi.toastSuccess( 'Cập nhật thành công' );
        }
    }

    selectInputPost ( event ) {
        event.focus();
        event.select();
    }

    setPointPostStudent ( event, product, group?: any ) {
        if ( event ) {
            if ( event.target.value > 10 || event.target.value < 0 ) {
                product[ 'edit' ] = false;
                this.noitifi.toastWarning(
                    'Điểm không hợp lệ, điểm hợp lệ là điểm nằm trong khoảng từ 0 đến 10'
                );
            } else {
                product[ 'edit' ] = true;
                product[ 'point' ] = event.target.value;
            }
        }
    }

    changePage_student ( event ) {
        this.loadStudentClass( event.page + 1, this.limit_student );
    }

    saveClassPlanActivity () {
        if ( this.formClassActivity.valid ) {
            const data = { ...this.formClassActivity.getRawValue() };
            if ( this.isUpdate ) {
                this.classPlanActivitiesService.updateClassPlanActivities( this.selectedPlanActivity.id, data ).subscribe( {
                    next: () => {
                        this.loadFirstData();
                        this.noitifi.toastSuccess( 'Sửa thành công' );
                    },
                    error: () => {
                        this.noitifi.toastError(
                            'Lỗi kết nối, sửa thất bại'
                        );
                    },
                } );
            } else {
                this.classPlanActivitiesService
                    .addClassPlanActivities( data )
                    .subscribe( {
                        next: ( _id ) => {
                            this.loadFirstData();
                            this.noitifi.toastSuccess( 'Thêm thành công' );
                        },
                        error: () => {
                            this.noitifi.toastError(
                                'Lỗi kết nối, vui lòng thử lại'
                            );
                        },
                    } );
            }
        } else {
            this.noitifi.toastWarning( 'Vui lòng điền đầy đủ thông tin' );
        }
    }
}
