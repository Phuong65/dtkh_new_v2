import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { request } from 'http';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { UserService } from '@core/services/user.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { SharedModule } from '@modules/shared/shared.module';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { catchError, firstValueFrom, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { CHUAN_DAU_RA } from '@modules/shared/utils/syscat';

@Component({
    selector: 'app-clone-course',
    standalone: true,
    imports: [
    SharedModule,
    DialogModule,
    MatProgressBarModule,
    MatListModule,
    MatMenuModule,
    ReactiveFormsModule,
    FormsModule
],
    templateUrl: './clone-course.component.html',
    styleUrls: ['./clone-course.component.css']
})
export class CloneCourseComponent implements OnInit, OnChanges {

    @Input() courseSelected: ElnKhoaHoc;

    list_course_for_clone: ElnKhoaHoc[] = [];

    selectedCourse: ElnKhoaHoc;

    searchCourse: string;

    courseClone: ElnKhoaHoc;

    progressValue: number = 0;

    displayModal: boolean = false;

    EXAMFORMAT = EXAMFORMAT;

    CHUAN_DAU_RA = CHUAN_DAU_RA;

    waittingTitle: string = 'Đang đồng bộ dữ liệu, vui lòng chờ...';

    list_status = [
        { id: 0, label: "Hủy trạng thái duyệt" },
        { id: 1, label: "Giữ trạng thái duyệt" },
    ]

    selectStatus: number = 0;

    constructor(
        private notificationService: NotificationService,
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private courseQuestionsService: CourseQuestionsService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private coursePlanActivityTuluanTieuchichamService: CoursePlanActivityTuluanTieuchichamService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseSelected']) {
            this.selectedCourse = this.courseSelected;
            if (this.courseSelected) {
                this.loadCourseClone();
            }
        }
    }

    ngOnInit(): void {

    }

    loadCourseClone() {

        this.list_course_for_clone = [];

        this.notificationService.isProcessing(true);

        const condition_course: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                { conditionName: 'id', condition: OvicQueryCondition.notEqual, value: this.courseSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.courseSelected.category_ids.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        if (this.courseSelected.copy_course_id) {
            condition_course.condition.push({ conditionName: 'id', condition: OvicQueryCondition.equal, value: this.courseSelected.copy_course_id.toString(), orWhere: 'and' },)
        }

        if (this.courseSelected.nganh_bomon_id) {
            condition_course.condition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.courseSelected.nganh_bomon_id.toString(), orWhere: 'and' })
        }

        this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course).pipe(mergeMap(_course => {
            const teacher_ids = [... new Set(_course.data.filter(m => m.creator_plan_id).map(m => m.creator_plan_id))];
            if (teacher_ids.length) {
                const condition_teacher: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: teacher_ids.toString() },
                        { label: 'include_by', value: "id" }
                    ],
                    page: null
                }

                return this.userService.getUserByPageNew(condition_teacher).pipe(mergeMap(_user => {
                    _course.data.forEach(f => {
                        const index = _user.data.findIndex(m => m.id === f.creator_plan_id);
                        if (index !== -1) {
                            f['creator_plan_name'] = _user.data[index].display_name;
                        }
                    })
                    return of(_course)
                }))
            }
            return of(_course)
        })).subscribe({
            next: (_course) => {
                this.list_course_for_clone = _course.data;
                if (this.selectedCourse.copy_course_id) {
                    this.courseClone = _course.data[0];
                }
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    changeSelecGiangvien(event: MatSelectionListChange) {

        const index = this.list_course_for_clone.findIndex(m => m.id === event.options[0].value.id);

        if (index !== -1) {
            this.courseClone = this.list_course_for_clone[index]
        }
    }

    async startCloneCourse() {
        if (!this.courseClone) {
            return this.notificationService.toastWarning("Vui lòng chon môn học");
        }

        const condition_question: ConditionOption = {
            condition: [
                { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '1' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        const question = await firstValueFrom(this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question));

        this.notificationService.isProcessing(false);

        if (question.recordsFiltered !== 0) {
            return this.notificationService.toastWarning("Môn này đã có câu hỏi, không thể đồng bộ");
        }

        this.notificationService.confirm(
            '<div class="thonbao-saochep">' +
            '<div class="thonbao-saochep_">' +
            '- Thao tác này sẽ xóa nội dung của môn <strong>' + this.selectedCourse.title + '</strong> và sao chép từ môn <strong>' + this.courseClone.title + '</strong>' +
            '</div>' +
            '<div class="thonbao-saochep_">' +
            '- Thầy/Cô có chắc muốn thực hiện thao tác sao chép' +
            '</div>' +
            '</div>', "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === "yes") {
                    const condition_plan: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseClone.id.toString(), orWhere: 'and' },
                            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'order', value: 'ASC' },
                            { label: 'orderby', value: 'ordering' }
                        ],
                        page: null
                    }

                    this.displayModal = true;

                    this.progressValue = 0;

                    this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan).subscribe({
                        next: (_plan) => {
                            const parent = _plan.data.filter(m => m.parent_id === 0);

                            const request: Observable<any>[] = [];

                            const data_course = {
                                av: this.courseClone.av,
                                copy_course_id: this.courseClone.id,
                                params: this.courseClone.params,
                                creator_plan_id: this.courseClone.creator_plan_id
                            }

                            request.push(this.elnKhoaHocService.updateElnKhoaHoc(this.selectedCourse.id, data_course));

                            request.push(this.coursePlanActivitiesService.deleteCoursePlanActivitiesByCol(this.selectedCourse.id.toString(), "course_id"));

                            parent.forEach(f => {

                                const status_parent = this.selectStatus === 1 ? f.status : 0;

                                const data_parent = {
                                    week: f.week,
                                    parent_id: f.parent_id,
                                    course_id: this.selectedCourse.id,
                                    title: f.title,
                                    kyhieu: f.kyhieu,
                                    ma_cdr: f['ma_cdr'],
                                    type: f.type,
                                    desc_title: f.desc_title,
                                    desc: f.desc,
                                    video: f.video,
                                    files: f.files,
                                    slides: f.slides,
                                    params: f.params,
                                    cdr_cauhoi: f.cdr_cauhoi,
                                    ordering: f.ordering,
                                    status: f.week === 1000 || f.week === 100 ? 1 : status_parent,
                                    edit: f.edit
                                }

                                request.push(this.coursePlanActivitiesService.addCoursePlanActivities(data_parent).pipe(
                                    mergeMap(_plan_parent => {
                                        const request_child: Observable<any>[] = [];
                                        const child = _plan.data.filter(m => m.parent_id === f.id);
                                        child.forEach(c => {

                                            const status_children = this.selectStatus === 1 ? c.status : 0;

                                            const data_child = {
                                                week: c.week,
                                                parent_id: _plan_parent,
                                                course_id: this.selectedCourse.id,
                                                title: c.title,
                                                kyhieu: c.kyhieu,
                                                ma_cdr: c['ma_cdr'],
                                                type: c.type,
                                                desc_title: c.desc_title,
                                                desc: c.desc,
                                                video: c.video,
                                                files: c.files,
                                                slides: c.slides,
                                                params: c.params,
                                                cdr_cauhoi: c.cdr_cauhoi,
                                                ordering: c.ordering,
                                                status: f.week === 1000 || f.week === 100 ? 1 : status_children,
                                                edit: c.edit
                                            }
                                            request_child.push(this.coursePlanActivitiesService.addCoursePlanActivities(data_child))
                                        })

                                        if (request_child.length) {
                                            return forkJoin(request_child).pipe(mergeMap(() => {
                                                return of(null);
                                            }));
                                        }
                                        return of(null)
                                    })))
                            })

                            if (request.length) {
                                this.loopAddForm(request, 0).subscribe({
                                    next: () => {
                                        this.displayModal = false;
                                        this.selectedCourse.av = this.courseClone.av;
                                        this.selectedCourse.params = this.courseClone.params;
                                        this.selectedCourse.copy_course_id = this.courseClone.id;
                                        this.notificationService.toastSuccess("Sao chép thành công");
                                    },
                                    error: (e) => {
                                        console.log(e);
                                        this.displayModal = false;
                                        this.notificationService.toastError("Sao chép thất bại, vui lòng thử lại");
                                    }
                                })
                            } else {
                                this.displayModal = false;
                            }
                        },
                        error: () => {

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

    startCloneQuestion() {
        this.notificationService.confirm(
            '<div class="thonbao-saochep">' +
            '<div class="thonbao-saochep_">' +
            '- Thao tác này sẽ xóa câu hỏi TN của môn <strong>' + this.selectedCourse.title + '</strong> và sao chép từ môn <strong>' + this.courseClone.title + '</strong>' +
            '</div>' +
            '<div class="thonbao-saochep_">' +
            '- Thầy/Cô có chắc muốn thực hiện thao tác sao chép' +
            '</div>' +
            '</div>', "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === "yes") {
                    const condition_question: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseClone.id.toString(), orWhere: 'and' },
                            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'select', value: 'status,reference,id,week,reference_id,cdr_id,course_id,answer_correct,raw_answer,question_number,question_direction,question_type,cdr,answer_option,group_id,media,code,private,config' }
                        ],
                        page: null
                    }

                    const condition_plan: ConditionOption = {
                        condition: [
                            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                            { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR', orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: this.selectedCourse.id.toString().concat(',', this.courseClone.id.toString()) },
                            { label: 'include_by', value: 'course_id' }
                        ],
                        page: null
                    }

                    this.displayModal = true;
                    this.progressValue = 0;
                    this.waittingTitle = 'Đang đồng bộ dữ liệu, vui lòng chờ...';
                    forkJoin([
                        this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question),
                        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan)
                    ]).subscribe({
                        next: ([_course_question, _plan_activity]) => {
                            const select_activity = _plan_activity.data.filter(m => m.course_id === this.selectedCourse.id);
                            const clone_activity = _plan_activity.data.filter(m => m.course_id === this.courseClone.id);
                            clone_activity.forEach(f => {
                                const index = select_activity.findIndex(m => m.kyhieu === f.kyhieu);
                                if (index !== -1) {
                                    f['next_plan_id'] = select_activity[index].id;
                                }
                            })

                            _course_question.data.forEach(f => {

                                f.status = this.selectStatus === 1 ? f.status : 0;

                                const index = clone_activity.findIndex(m => m.id === f.reference_id);
                                if (index !== -1) {
                                    f.reference_id = clone_activity[index]['next_plan_id'];
                                    f['week'] = clone_activity[index].week;
                                }

                                const _index = clone_activity.findIndex(m => m.id === f.cdr_id);
                                if (_index !== -1) {
                                    f.cdr_id = clone_activity[_index]['next_plan_id'];
                                }

                                f.course_id = this.selectedCourse.id;
                            })

                            const parent = _course_question.data.filter(m => m.group_id === 0);

                            const request: Observable<any>[] = [];

                            request.push(this.courseQuestionsService.deleteCourseQuestionsBy("course_id", this.selectedCourse.id.toString()));

                            parent.forEach(f => {

                                const id = f.id;


                                delete f.id;

                                request.push(this.courseQuestionsService.addCourseQuestions(f).pipe(mergeMap(_course_id => {

                                    const child = _course_question.data.filter(m => m.group_id === id);

                                    const request_child: Observable<any>[] = [];

                                    child.forEach(c => {

                                        delete c.id;

                                        c.group_id = _course_id;

                                        request_child.push(this.courseQuestionsService.addCourseQuestions(c))
                                    })

                                    if (request_child.length) {
                                        return forkJoin(request_child).pipe(mergeMap(() => {
                                            return of(null);
                                        }))
                                    }
                                    return of(null)
                                })))
                            })

                            if (request.length) {
                                this.loopAddForm(request, 0).subscribe({
                                    next: () => {
                                        this.displayModal = false;
                                        this.selectedCourse.av = this.courseClone.av;
                                        this.selectedCourse.params = this.courseClone.params;
                                        this.selectedCourse.copy_course_id = this.courseClone.id;
                                        this.notificationService.toastSuccess("Sao chép thành công");
                                    },
                                    error: (e) => {
                                        console.log(e);
                                        this.displayModal = false;
                                        this.notificationService.toastError("Sao chép thất bại, vui lòng thử lại");
                                    }
                                })
                            } else {
                                this.displayModal = false;
                            }
                        },

                        error: () => {
                            this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
                        }
                    })
                }
            })
    }

    startCloneQuestionTh() {
        this.notificationService.confirm(
            '<div class="thonbao-saochep">' +
            '<div class="thonbao-saochep_">' +
            '- Thao tác này sẽ xóa câu hỏi TH của môn <strong>' + this.selectedCourse.title + '</strong> và sao chép từ môn <strong>' + this.courseClone.title + '</strong>' +
            '</div>' +
            '<div class="thonbao-saochep_">' +
            '- Thầy/Cô có chắc muốn thực hiện thao tác sao chép' +
            '</div>' +
            '</div>', "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === "yes") {
                    const condition_question: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseClone.id.toString(), orWhere: 'and' },
                            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'select', value: 'id,course_plan_activity_id,title,type,cdr,private,point,time_duration,ordering,desc,note,tuluan_id,activity_cdr_ids,status,tuluan_root_ids' }
                        ],
                        page: null
                    }

                    const condition_plan: ConditionOption = {
                        condition: [
                            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                            { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' }
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: this.selectedCourse.id.toString().concat(',', this.courseClone.id.toString()) },
                            { label: 'include_by', value: 'course_id' }
                        ],
                        page: null
                    }

                    const condition_tieuchi: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseClone.id.toString(), orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'select', value: 'course_plan_activity_tuluan_id,course_plan_activity_id,title,cdr,ordering,point,desc' }
                        ],
                        page: null
                    }

                    this.displayModal = true;

                    this.progressValue = 0;

                    this.waittingTitle = 'Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt (1/4)';

                    forkJoin([
                        this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_question),
                        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
                        this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchi)
                    ]).subscribe({
                        next: ([_course_tuluan, _plan_activity, _tieuchi]) => {

                            const select_activity = _plan_activity.data.filter(m => m.course_id === this.selectedCourse.id);

                            const clone_activity = _plan_activity.data.filter(m => m.course_id === this.courseClone.id);

                            clone_activity.forEach(f => {
                                const index = f.week === 1000 ? select_activity.findIndex(m => m.ordering === f.ordering && m.week === 1000) : select_activity.findIndex(m => m.kyhieu === f.kyhieu && m.kyhieu && m.week !== 1000);
                                if (index !== -1) {
                                    f['next_plan_id'] = select_activity[index].id;
                                }
                            })

                            _course_tuluan.data.forEach(f => {

                                f.status = this.selectStatus === 1 ? f.status : 0

                                f.course_id = this.selectedCourse.id;

                                if (f.course_plan_activity_id !== 0) {

                                    const index = clone_activity.findIndex(m => m.id === f.course_plan_activity_id && m.week === 1000);

                                    if (index !== -1) {
                                        f.course_plan_activity_id = clone_activity[index]['next_plan_id'];
                                    }
                                }

                                if (f.activity_cdr_ids) {
                                    const activity_cdr_ids = clone_activity.filter(m => f.activity_cdr_ids.includes(m.id)).map(m => m['next_plan_id']);
                                    f.activity_cdr_ids = activity_cdr_ids;
                                }

                                // const tuluan_id = f.tuluan_id.split(',');

                                // const next_tuluan_id = clone_activity.filter(m => tuluan_id.includes(m.id)).map(m => m.id);

                                // if (next_tuluan_id.length) {
                                //     f.tuluan_id = next_tuluan_id.join(",");
                                // }
                            })

                            const request: Observable<any>[] = [];

                            request.push(this.coursePlanActivityTuluanService.deleteCoursePlanActivityTuluanByCol(this.selectedCourse.id.toString(), "course_id"));

                            request.push(this.coursePlanActivityTuluanTieuchichamService.deleteCoursePlanActivityTuluanTieuchichamByCol(this.selectedCourse.id.toString(), "course_id"));

                            const tuluan_tx = _course_tuluan.data.filter(m => m.course_plan_activity_id !== 0);

                            tuluan_tx.forEach(f => {

                                const data = {};

                                Object.keys(f).forEach(o => {
                                    if (o !== 'id') {
                                        data[o] = f[o];
                                    }
                                })

                                data['']

                                request.push(this.coursePlanActivityTuluanService.addCoursePlanActivityTuluan(data).pipe(mergeMap(_tu => {

                                    const _tieuchi_filter = _tieuchi.data.filter(m => m.course_plan_activity_tuluan_id === f.id);

                                    _tieuchi_filter.forEach(t => {
                                        t.course_plan_activity_tuluan_id = _tu;
                                        t.course_id = this.selectedCourse.id;
                                        if (this.selectedCourse.params && this.selectedCourse.params.exam_format === 'DUAN') {
                                            const index = clone_activity.findIndex(m => m.id === t.course_plan_activity_id);
                                            if (index !== -1) {
                                                t.course_plan_activity_id = clone_activity[index]['next_plan_id'];
                                            }
                                        } else {
                                            t.course_plan_activity_id = f.course_plan_activity_id;
                                        }
                                    })

                                    const _course_tuluan_ids = _course_tuluan.data.filter(m => m.tuluan_id && m.course_plan_activity_id === 0 && m.tuluan_id.split(",").includes(f.id.toString()));

                                    _course_tuluan_ids.forEach(c => {
                                        if (!c['tuluan_id_new']) {
                                            c['tuluan_id_new'] = [_tu];
                                        } else {
                                            c['tuluan_id_new'].push(_tu);
                                        }
                                    })
                                    return of(null)
                                })))

                            })

                            if (request.length) {
                                this.loopAddForm(request, 0).subscribe({
                                    next: () => {
                                        this.addTuLuanQuestion(_course_tuluan, _tieuchi);
                                    },
                                    error: (e) => {
                                        console.log(e);
                                        this.displayModal = false;
                                        this.notificationService.toastError("Sao chép thất bại, vui lòng thử lại");
                                    }
                                })
                            } else {
                                this.displayModal = false;
                                this.addTuLuanQuestion(_course_tuluan, _tieuchi);
                            }
                        },

                        error: () => {
                            this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
                        }
                    })
                }
            })
    }

    addTuLuanQuestion(_course_tuluan, _tieuchi) {
        this.progressValue = 0;

        this.waittingTitle = 'Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt (2/4)';

        const request_tuluan_question: Observable<any>[] = [];

        const _tuluan_question = _course_tuluan.data.filter(m => m.type === "QUESTION" && m.course_plan_activity_id === 0);

        _tuluan_question.forEach(f => {

            if (f['tuluan_id_new'])
                f.tuluan_id = f['tuluan_id_new'].join(",");

            const data = {};

            Object.keys(f).forEach(o => {
                if (o !== 'id' && o !== 'tuluan_id_new') {
                    data[o] = f[o];
                }
            })

            request_tuluan_question.push(this.coursePlanActivityTuluanService.addCoursePlanActivityTuluan(data).pipe(mergeMap(_tu => {

                const _tieuchi_filter = _tieuchi.data.filter(m => m.course_plan_activity_tuluan_id === f.id);

                _tieuchi_filter.forEach(t => {
                    t.course_plan_activity_tuluan_id = _tu;
                    t.course_id = this.selectedCourse.id;
                    t.course_plan_activity_id = f.course_plan_activity_id;
                })

                const _course_tuluan_ids = _course_tuluan.data.filter(m => m.tuluan_root_ids && m.type === "GROUP_QUESTION" && m.course_plan_activity_id === 0 && m.tuluan_root_ids.split("|").includes(f.id.toString()));

                _course_tuluan_ids.forEach(c => {
                    if (!c['tuluan_root_id_new']) {
                        c['tuluan_root_id_new'] = [_tu];
                    } else {
                        c['tuluan_root_id_new'].push(_tu);
                    }
                })
                return of(null)
            })))
        })

        if (request_tuluan_question.length) {
            this.loopAddForm(request_tuluan_question, 0).subscribe({
                next: () => {
                    this.addTuluanGroupQuestion(_course_tuluan, _tieuchi);
                },
                error: (e) => {
                    console.log(e);
                    this.displayModal = false;
                    this.notificationService.toastError("Sao chép thất bại, vui lòng thử lại");
                }
            })
        } else {
            this.addTuluanGroupQuestion(_course_tuluan, _tieuchi)
        }
    }

    addTuluanGroupQuestion(_course_tuluan, _tieuchi) {
        this.progressValue = 0;

        this.waittingTitle = 'Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt (3/4)';

        const request_tuluan_group_question: Observable<any>[] = [];

        const _tuluan_group_question = _course_tuluan.data.filter(m => m.type === "GROUP_QUESTION" && m.course_plan_activity_id === 0);

        _tuluan_group_question.forEach(f => {

            if (f['tuluan_id_new'])
                f.tuluan_id = f['tuluan_id_new'].join(",");

            if (f['tuluan_root_id_new'])
                f.tuluan_root_ids = "|".concat(f['tuluan_root_id_new'].join("|"), "|");

            const data = {};

            Object.keys(f).forEach(o => {
                if (o !== 'id' && o !== 'tuluan_id_new' && o !== 'tuluan_root_id_new') {
                    data[o] = f[o];
                }
            })


            request_tuluan_group_question.push(this.coursePlanActivityTuluanService.addCoursePlanActivityTuluan(data).pipe(mergeMap(_tu => {

                const _tieuchi_filter = _tieuchi.data.filter(m => m.course_plan_activity_tuluan_id === f.id);

                _tieuchi_filter.forEach(t => {
                    t.course_plan_activity_tuluan_id = _tu;
                    t.course_id = this.selectedCourse.id;
                    t.course_plan_activity_id = f.course_plan_activity_id;
                })

                return of(null)
            })))
        })

        if (request_tuluan_group_question.length) {
            this.loopAddForm(request_tuluan_group_question, 0).subscribe({
                next: () => {
                    this.addTieuchicham(_tieuchi)
                },
                error: (e) => {
                    console.log(e);
                    this.displayModal = false;
                    this.notificationService.toastError("Sao chép thất bại, vui lòng thử lại");
                }
            })
        } else {
            this.addTieuchicham(_tieuchi)
        }
    }

    addTieuchicham(_tieuchi) {
        this.progressValue = 0;

        this.waittingTitle = 'Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt (4/4)';

        const request_tieuchi: Observable<any>[] = [];

        _tieuchi.data.forEach(f => {
            request_tieuchi.push(this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(f))
        })

        if (request_tieuchi.length) {
            this.loopAddForm(request_tieuchi, 0).subscribe({
                next: () => {
                    this.notificationService.toastSuccess("Sao chép thành công");
                    this.displayModal = false;
                },
                error: (e) => {
                    console.log(e);
                    this.displayModal = false;
                    this.notificationService.toastError("Sao chép thất bại, vui lòng thử lại");
                }
            })
        } else {
            this.displayModal = false;
            this.notificationService.toastSuccess("Sao chép thành công");
        }
    }

    changeStatusCopy(event) {
        this.selectStatus = event;
    }
}
