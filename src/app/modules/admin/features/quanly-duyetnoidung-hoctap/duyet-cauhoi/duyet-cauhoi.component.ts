import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { CourseQuestionCommentService } from './../../../../shared/services/course-question-comment.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CourseQuestionComment } from '@modules/shared/models/course-question-comment';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { CourseThanhvien } from '@modules/shared/models/course_thanhvien';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanCommentService } from '@modules/shared/services/course-plan-comment.service';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CourseTesterResultsDucService } from '@modules/shared/services/course-tester-results-duc.service';
import { CourseThanhvienService } from '@modules/shared/services/course-thanhvien.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { CHUAN_DAU_RA, ROLES } from '@modules/shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, mergeMap, Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { QuestionTypesModule } from '../../cauhoi-tracnghiem/question-types/question-types.module';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { MatChipsModule } from '@angular/material/chips';
import { SharedModule } from '@modules/shared/shared.module';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { IctuMediaLinkPipe } from '@modules/shared/pipes/ictu-media-link.pipe';
import { SafeHtmlSinglePipe } from '@modules/shared/pipes/safe-html-single.pipe';
import { ExtractCorrectAnswerPipe } from '@modules/shared/pipes/extract-correct-answer.pipe';
import { QuestionPrefixPipe } from '@modules/shared/pipes/question-prefix.pipe';
import { IsAnswerCorrectPipe } from '../../cauhoi-tracnghiem/questions/list-questions/is-answer-correct.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AnswerLabelPipe } from '../../cauhoi-tracnghiem/questions/list-questions/answer-label.pipe';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { key_server, ROLES_KEY } from '@env';
import { SplitterModule } from 'primeng/splitter';
import { TooltipModule } from "primeng/tooltip";
import { RippleModule } from "primeng/ripple";
import { ButtonModule } from "primeng/button";
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CourseQuestionReport, CourseQuestionReportService } from "@shared/services/course-question-report.service";
import { map } from "rxjs/operators";
import {
    ReportsListQuestion
} from "@modules/admin/features/cauhoi-tracnghiem/questions/list-questions/list-questions.component";
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { OrderAnswerOptionsByCorrectAnswerPipe } from "../../cauhoi-tracnghiem/questions/list-questions/pipes/order-answer-options-by-correct-answer.pipe";
import { KatexImgDirective } from "@modules/shared/directives/katex-img.directive";

@Component({
    standalone: true,
    imports: [
    CommonModule,
    SharedModule,
    QuestionTypesModule,
    LoadMediaOnTextDirective,
    MatChipsModule,
    CheckboxModule,
    TableModule,
    IctuMediaLinkPipe,
    SafeHtmlSinglePipe,
    ExtractCorrectAnswerPipe,
    QuestionPrefixPipe,
    IsAnswerCorrectPipe,
    FormsModule,
    ReactiveFormsModule,
    AnswerLabelPipe,
    InputTextareaModule,
    SplitterModule,
    TooltipModule,
    RippleModule,
    ButtonModule,
    OverlayPanelModule,
    DialogModule,
    MatProgressBarModule,
    OrderAnswerOptionsByCorrectAnswerPipe,
    KatexImgDirective
],
    selector: 'app-duyet-cauhoi',
    templateUrl: './duyet-cauhoi.component.html',
    styleUrls: ['./duyet-cauhoi.component.css'],
})
export class DuyetCauhoiComponent implements OnInit, OnChanges {

    @ViewChild('templateQuestionView') templateQuestionView: TemplateRef<any>;

    @Input() courseSelected: ElnKhoaHoc;

    @Input() activity: CoursePlanActivities;

    @Input() hoidong: CourseThanhvien[];

    key_server = key_server;

    selectedCourse: ElnKhoaHoc;

    selectedActivity: CoursePlanActivities;

    selectedQuestion: CourseQuestions;

    list_cdr: CoursePlanActivities[];

    list_question: CourseQuestions[];

    // selectedCdr: CoursePlanActivities;

    CHUAN_DAU_RA = CHUAN_DAU_RA;

    object_chuandaura = {};

    token: string = this.auth.accessToken;

    kd_hoidong: boolean = false;

    kd_uyvien: boolean = false;

    userId: number;

    selectedComment: CourseQuestionComment;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    isManager: boolean = false;

    donviId: number;

    rejectRole: boolean = false;

    _chuanhanxet: any;

    _chuaduyet: number = null;

    _daduyet: number = null;

    checkBoxChuaDuyet: boolean = true;

    list_check_status = [
        { id: 100, label: 'Tất cả' },
        { id: 1, label: 'Đã duyệt' },
        { id: 0, label: 'Chưa duyệt' }
    ]

    displayModal: boolean = false;

    progressValue: number = 0;

    config_check_hoidong_by_chutich: boolean =false;
    isChutichHoidong: boolean =false;

    constructor(
        private helperService: HelperService,
        private modalService: NgbModal,
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private auth: AuthService,
        private fileService: FileService,
        private noitifi: NotificationService,
        private courseThanhvienService: CourseThanhvienService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private coursePlanCommentService: CoursePlanCommentService,
        private configsService: ConfigsService,
        private ovicDateTimeService: OvicDateTimeService,
        private elngUserProfileService: ElngUserProfileService,
        private donViService: DonViService,
        private courseQuestionsService: CourseQuestionsService,
        private courseTesterResultsDucService: CourseTesterResultsDucService,
        private courseQuestionCommentService: CourseQuestionCommentService,
        private courseQuestionReportService: CourseQuestionReportService
    ) {
        this.CHUAN_DAU_RA.forEach(f => {
            this.object_chuandaura[f.id] = f.label;
        })

        this.rejectRole = this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon) ? true : false;


    }



    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseSelected']) {
            this.selectedCourse = this.courseSelected;
            this.isChutichHoidong = this.hoidong && !!this.hoidong.find(f => f.user_id == this.auth.user.id && f.vaitro == "CHUTICH");

        }

        if (changes['activity']) {
            if (this.selectedCourse.id) {
                this.selectedActivity = this.activity;
                this.loadData();
                this.isChutichHoidong = this.hoidong && !!this.hoidong.find(f => f.user_id == this.auth.user.id && f.vaitro == "CHUTICH");


            }
        }
    }

    ngOnInit(): void {
        this.userId = this.auth.user.id;
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
        const index = this.hoidong.findIndex(m => m.user_id === this.auth.user.id);
        if (index !== -1) {
            this.kd_hoidong = this.hoidong[index].vaitro === 'CHUTICH' ? true : false;
            this.kd_uyvien = this.hoidong[index].vaitro === 'UYVIEN' ? true : false;
        }
    }

    loadData() {
        const condition_cdr: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString() },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                // { label: 'order_by', value: 'id' },
                // { label: 'order', value: 'ASC' },
            ],
            page: null
        }

        if (this.activity.id !== 0) {
            condition_cdr.condition.push({ conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.activity.id.toString(), orWhere: 'and' })
        }

        this.noitifi.isProcessing(true);


        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_cdr).pipe(mergeMap(_plan_activity => {
            let _plan_activity_ids = [];
            _plan_activity.data.forEach(f => {
                _plan_activity_ids.push(f.id);
            })

            if (_plan_activity_ids.length) {
                const condition_question: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString() },
                        { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: [...new Set(_plan_activity_ids)].toString() },
                        { label: 'include_by', value: 'reference_id' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'cdr' }
                    ],
                    page: null
                }

                return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).pipe(mergeMap(_question => {
                    const question_ids = [];
                    const parent_question: CourseQuestions[] = [];

                    if (this.selectedCourse.av === 1) {
                        this.selectedActivity['count_question'] = '('.concat(_question.data.filter(m => m.status === 0 && m.group_id !== 0).length.toString(), ' + <span class="red">', _question.data.filter(m => (m.status === -1 || m.status === -2) && m.group_id !== 0).length.toString(), '</span> + <span class="blue">', _question.data.filter(m => m.status === 1 && m.group_id !== 0).length.toString(), '</span> = ', _question.data.filter(m => m.group_id !== 0).length.toString(), ')');

                        _question.data.forEach(f => {
                            question_ids.push(f.id);
                            if (f.group_id === 0) {
                                f.children = _question.data.filter(m => m.group_id === f.id);
                                parent_question.push(f);
                            }
                        })
                    } else {
                        this.selectedActivity['count_question'] = '('.concat(_question.data.filter(m => m.status === 0 && m.group_id === 0).length.toString(), ' + <span class="red">', _question.data.filter(m => (m.status === -1 || m.status === -2) && m.group_id === 0).length.toString(), '</span> + <span class="green">', _question.data.filter(m => m.status === 1 && m.group_id === 0).length.toString(), '</span> = ', _question.data.filter(m => m.group_id === 0).length.toString(), ')'); _question.data.forEach(f => {
                            question_ids.push(f.id);
                            if (f.group_id === 0) {
                                f.children = _question.data.filter(m => m.group_id === f.id);
                                parent_question.push(f);
                            }
                        })
                    }

                    _plan_activity.data.forEach(f => {
                        f['cdr_cauhoi_label'] = '0 + 0 + 0 + 0';
                        if (f.cdr_cauhoi) {
                            const cauhoi_label = [];
                            let s = 0;
                            Object.keys(f.cdr_cauhoi).forEach(c => {
                                if (this.object_chuandaura[c]) {
                                    cauhoi_label.push(f.cdr_cauhoi[c]);
                                    s += f.cdr_cauhoi[c];
                                }
                            })
                            f['cdr_cauhoi_label'] = cauhoi_label.join(' + ').concat(' = ', s.toString());
                        }
                        f['question_cdr'] = parent_question.filter(m => m.reference_id === f.id);
                    })

                    if (question_ids.length) {
                        const condition_result: ConditionOption = {
                            condition: [
                            ],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: [... new Set(question_ids)].toString() },
                                { label: 'include_by', value: 'question_id' }
                            ],
                            page: null
                        }

                        const condition_config: ConditionOption = {
                            condition: [
                                { conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'TIME_FOR_TEST' },
                            ],
                            set: [
                                { label: 'limit', value: '-1' },
                            ],
                            page: null
                        }

                        const condition_getConfigChutich :ConditionOption= {
                            condition:[
                                { conditionName:'config_key',condition:OvicQueryCondition.equal,value:'CHECK_DUYET_HOIDONG_BY_CHUTICH'}
                            ],
                            set:[
                                {label:'limit',value:'1'}
                            ],
                            page:'1'
                        }

                        const condition_comment: ConditionOption = {
                            condition: [
                            ],
                            set: [
                                { label: 'limit', value: '-1' },
                                { label: 'include', value: [... new Set(question_ids)].toString() },
                                { label: 'include_by', value: 'course_question_id' }
                            ],
                            page: null
                        }

                        return forkJoin([
                            this.courseTesterResultsDucService.getCourseTesterResultsDucByPageNew(condition_result),
                            this.configsService.getConfigsByPageNew(condition_config),
                            this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_comment),
                            this.configsService.getConfigsByPageNew(condition_getConfigChutich).pipe(map(m=>m.data[0])),

                        ]).pipe(mergeMap(([_result, _config, _comment,_configChutich]) => {
                            this.config_check_hoidong_by_chutich =_configChutich['params']['check'];
                            let question_list = [];
                            _plan_activity.data.forEach(f => {
                                if (f.question_cdr && f.question_cdr.length) {
                                    question_list = question_list.concat(f.question_cdr);
                                    f.question_cdr.forEach((q, key) => {
                                        q['index_question'] = key + 1;
                                        q['in_cdr'] = f.kyhieu;
                                        q['hoidong_comment'] = {};
                                        q['_chuanhanxet'] = 1;
                                        q['_chuaduyet'] = q.status !== 1 ? 1 : 0;
                                        q['_daduyet'] = q.status === 1 ? 1 : 0;
                                        this.hoidong.forEach(h => {
                                            q['hoidong_comment'][h.user_id] = false;
                                            const index = _comment.data.findIndex(m => m.course_question_id === q.id && m.user_id === h.user_id);
                                            if (index !== -1) {
                                                q['hoidong_comment'][h.user_id] = true;
                                                if (h.user_id === this.auth.user.id) {
                                                    q['_chuanhanxet'] = 0;
                                                }
                                            }
                                        })

                                        q['count_teacher'] = 0;
                                        q['count_answer_true'] = 0;
                                        q['count_answer_false'] = 0;
                                        q.count_answer_later = 0;

                                        if (q.children.length) {
                                            // const answers = _result.data.filter( m => m.question_id === q.id );
                                            // q[ 'count_teacher' ] = answers.length;
                                            q.children.forEach(c => {
                                                const answers = _result.data.filter(m => m.question_id === c.id);
                                                q['count_teacher'] += answers.length;
                                                q['count_answer_true'] += answers.filter(m => m.result === 1).length;
                                                q['count_answer_false'] += answers.filter(m => m.result === 0).length;
                                                q.count_answer_later += answers.filter(m => m.time_to_answer > _config.data[0].params['MONKHAC'][q.cdr]).length;
                                            })
                                        } else {
                                            const answers = _result.data.filter(m => m.question_id === q.id);
                                            q['count_teacher'] = answers.length;
                                            q['count_answer_true'] = answers.filter(m => m.result === 1).length;
                                            q['count_answer_false'] = answers.filter(m => m.result === 0).length;
                                            q.count_answer_later = answers.filter(m => m.time_to_answer > _config.data[0].params['MONKHAC'][q.cdr]).length;
                                        }
                                    })
                                }
                            })
                            this.list_question = question_list;
                            return of(_plan_activity);
                        }))
                    }
                    return of(_plan_activity);
                }))
            }
            return of(_plan_activity);
        })).subscribe({
            next: (_activity) => {
                this.noitifi.isProcessing(false);
                this.list_cdr = _activity.data.sort((a, b) => a.kyhieu.localeCompare(b.kyhieu));

            },
            error: (e) => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    async chooseQuestion(question: CourseQuestions, index_question: number) {
        this.noitifi.isProcessing(true);
        const new_question = await this.getCloneQuestion(question);
        this.noitifi.isProcessing(false);
        if (new_question === true) {
            this.loadData();
            return this.noitifi.toastInfo("Câu hỏi mới được cập nhật, vui lòng chọn lại");
        }
        this.selectedQuestion = question;
        if (question.count_teacher || question['old_status'] === 1 || question['question_root_id'] || key_server === 'hvu') {
            this.loadCommentQuestion();
            this.noitifi.openSideNavigationMenu({ template: this.templateQuestionView, size: 1024, offsetTop: '0px' });
        } else {
            this.noitifi.toastWarning("Chưa có giảng viên test, không thể nhận xét");
        }
    }


    loadCommentQuestion() {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_question_id', condition: OvicQueryCondition.equal, value: this.selectedQuestion.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: '0',
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null
        }

        const condition_reply_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_question_id', condition: OvicQueryCondition.equal, value: this.selectedQuestion.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.notEqual,
                    value: '0',
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, parent_id' },
            ],
            page: null,
        };

        const conditionQuestionReport: ConditionOption = {
            condition: [
                {
                    conditionName: 'question_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedQuestion.id.toString().toString()
                },
            ],
            page: '1',
            set: []
        }
        this.noitifi.isProcessing(true);
        forkJoin([
            this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_comment),
            this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_reply_comment),
            this.courseQuestionReportService.getDataByPageNew(conditionQuestionReport).pipe(map(m => m.data))
        ]).subscribe({
            next: ([_comment, _comment_child, _courseQuestionReport]) => {
                _comment.data.forEach((f) => {
                    // const index = this.hoidong.findIndex(
                    //     (m) => m.user_id === f.user_id
                    // );
                    // if (index !== -1) {
                    //     f['display_name'] =
                    //         this.hoidong[index][
                    //         'display_name'
                    //         ];
                    // }

                    f['display_name'] = f.user ? f.user.display_name : 'Không xác định';

                    f['reply_open'] = false;

                    f['textarea_comment'] = '';
                });




                const object_comment = {};

                _comment.data.forEach((c) => {
                    const count_reply = _comment_child.data.filter((m) => m.parent_id === c.id).length;

                    c['count_reply'] = count_reply;

                    if (!object_comment[c.user_id]) {
                        object_comment[c.user_id] = { cap_khoa: [], cap_truong: [], display_name: c['display_name'] };
                        object_comment[c.user_id][c.cap_hoidong].push(c);
                    } else {
                        object_comment[c.user_id][c.cap_hoidong].push(c);
                    }
                });

                this.selectedQuestion['comments'] = [];

                let j = 0;
                Object.keys(object_comment).forEach((o, key) => {
                    let display_name = 'Ủy viên '.concat((key + 1).toString());
                    if (this.kd_hoidong || this.isLanhDaoKhoa || this.isManager || this.isLanhDaoBomon) {
                        if (o.toString() === this.userId.toString()) {
                            display_name = 'Nhận xét của bạn';
                        } else {
                            display_name = object_comment[o] ? object_comment[o]['display_name'] : 'Không xác định';
                        }
                    } else if (o.toString() === this.userId.toString()) {
                        display_name = 'Nhận xét của bạn';
                    }


                    if (object_comment[o]['cap_khoa'] && object_comment[o]['cap_khoa'].length) {
                        this.selectedQuestion['comments'].push({ user_id: Number(o), display_name: display_name, cap_hoidong: 'cap_khoa', children: object_comment[o]['cap_khoa'] });
                    }

                    if (object_comment[o]['cap_truong'] && object_comment[o]['cap_truong'].length) {
                        j = j + 1;
                        this.selectedQuestion['comments'].push({ user_id: Number(o), display_name: this.isManager ? display_name.concat(" (Cấp trường)") : 'Ủy viên trường '.concat((j).toString()), cap_hoidong: 'cap_truong', children: object_comment[o]['cap_truong'] });
                    }

                    // this.selectedQuestion['comments'].push({
                    //     user_id: o,
                    //     display_name: display_name,
                    //     children: object_comment[o],
                    // });
                }
                );

                this.selectedQuestion['textarea_comment'] = '';

                this.selectedQuestion['_reportQuestions'] = this.mapListReduceQuestionReport(_courseQuestionReport.filter(rp => rp.question_id == this.selectedQuestion.id))
                this.noitifi.isProcessing(false);
            },
            error: () => {

            }
        })
    }

    closeForm() {
        this.noitifi.closeSideNavigationMenu();
    }


    openReply(comment: CourseQuestionComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(this.selectedComment, index_comment);
        }
    }

    loadReplyComment(comment: CourseQuestionComment, index_comment) {
        const condition_comment: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: comment.id.toString(),
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null,
        };

        this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_comment).subscribe({
            next: (_comment) => {
                _comment.data.forEach((f) => {
                    if (f.cap_hoidong === 'cap_truong') {
                        if (this.isManager) {
                            f['display_name'] = f.user ? f.user.display_name.concat(' (Cấp trường)') : 'Uỷ viên (Cấp trường)';
                        } else if (comment.user_id === f.user_id) {
                            f['display_name'] = 'Ủy viên cấp trường '.concat((index_comment + 1).toString());
                        } else {
                            f['display_name'] = 'Ủy viên cấp trường';
                        }
                    } else if (
                        f.user_id === this.courseSelected.creator_plan_id &&
                        this.userId !== f.user_id
                    ) {
                        f['display_name'] =
                            this.courseSelected['display_name'];
                    } else if (f.user_id === this.userId) {
                        f['display_name'] = 'Phản hồi của bạn';
                        f['my_reply_comment'] = true;
                    } else {
                        if (
                            this.kd_hoidong || this.isManager || this.isLanhDaoKhoa || this.isLanhDaoBomon
                        ) {
                            const index = this.hoidong.findIndex(
                                (m) => m.user_id === f.user_id
                            );
                            f['display_name'] =
                                this.hoidong[index]['display_name'];
                        } else {
                            if (comment.user_id === f.user_id) {
                                f['display_name'] = 'Ủy viên '.concat(
                                    (index_comment + 1).toString()
                                );
                            } else {
                                f['display_name'] = 'Ủy viên khác';
                            }
                        }
                    }
                });

                comment['reply_comments'] = _comment.data;
                comment['count_reply'] = _comment.data.length;
            },

            error: () => {
                this.noitifi.toastError('Lỗi kết nôi, vui lòng thử lại');
            },
        });
    }

    saveCommentReply(comment: CourseQuestionComment, activity: CourseQuestions, index_comment: number) {
        const comment_content = comment['textarea_comment']
            ? comment['textarea_comment'].trim()
            : comment['textarea_comment'].trim();

        if (comment_content && comment_content !== '') {
            const data_comment: CourseQuestionComment = {
                course_plan_activity_id: activity.course_plan_activity_id,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.courseSelected.id,
                parent_id: comment.id,
                course_question_id: activity.id
            };

            this.courseQuestionCommentService.addCourseQuestionComment(data_comment).subscribe({
                next: () => {
                    this.noitifi.toastSuccess('Đã gửi phản hồi thành công');
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(
                        this.selectedComment,
                        index_comment
                    );
                },
                error: () => {
                    this.noitifi.toastError(
                        'Lỗi kết nối, vui lòng thử lại'
                    );
                },
            });
        } else {
            this.noitifi.toastWarning('Vui lòng nhập phản hồi trước khi gửi');
        }
    }

    saveComment(status, activity: CourseQuestions) {
        const noidung = activity['textarea_comment']
            ? activity['textarea_comment'].trim()
            : activity['textarea_comment'];
        if (noidung) {
            this.noitifi
                .confirm(
                    status === -1
                        ? 'Thầy / Cô có chắc chắn yêu cầu sửa'
                        : 'Thầy / Cô có chắc chắn đồng ý duyệt',
                    'Xác nhận hành động',
                    [BUTTON_YES, BUTTON_NO]
                )
                .then((a) => {
                    if (a.name === 'yes') {
                        const data: CourseQuestionComment = {
                            course_plan_activity_id: activity.course_plan_activity_id,
                            comment: noidung,
                            status: status,
                            user_id: this.auth.user.id,
                            course_id: this.courseSelected.id,
                            parent_id: 0,
                            course_question_id: activity.id
                        };

                        this.courseQuestionCommentService.addCourseQuestionComment(data).subscribe({
                            next: () => {
                                this.noitifi.toastSuccess(
                                    'Cập nhật thành công'
                                );
                                this.loadCommentQuestion();
                            },
                            error: () => {
                                this.noitifi.toastError(
                                    'Cập nhật thất bại, lỗi kết nối'
                                );
                            },
                        });
                    }
                });
        } else {
            this.noitifi.toastWarning('Vui lòng nhập nội dung');
        }
    }

    duyetNoidung(activity: CourseQuestions, status) {
        const confirm_data =
            status === 1
                ? '<div class="alert-duyetnoidung">' +
                '<span>- Bạn đang thực hiện thao tác duyệt câu hỏi</span>' +
                '<span>- Chức năng nhận xét cho câu hỏi này sẽ bị đóng</span>' +
                '<span>- Thao tác này không thể hoàn tác</span>' +
                '<span>- Bạn có chắc chắn duyệt câu hỏi này?</span>' +
                '</div>'
                : '<div class="alert-duyetnoidung">' +
                '<span>- Bạn đang thực hiện thao tác yêu cầu sửa câu hỏi</span>' +
                '<span>- Chức năng nhận xét cho câu hỏi sẽ bị đóng</span>' +
                '<span>- Thao tác này không thể hoàn tác</span>' +
                '<span>- Bạn có chắc chắn yêu cầu sửa câu hỏi này?</span>' +
                '</div>';

        this.noitifi.confirm(confirm_data, 'Xác nhận hành động', [
            BUTTON_YES,
            BUTTON_NO,
        ])
            .then((a) => {
                if (a.name === 'yes') {
                    this.noitifi.isProcessing(true);
                    this.ovicDateTimeService.getCurrentDateTime().pipe(
                        mergeMap((_date) => {
                            return this.courseQuestionsService.updateCourseQuestions(activity.id, {
                                status: status,
                                approved_by: this.userId,
                                approved_at:
                                    this.helperService.stringToDateSql(
                                        _date.toString()
                                    ),
                            })
                                .pipe(
                                    mergeMap(() => {
                                        return of(null);
                                    })
                                );
                        })
                    )
                        .subscribe({
                            next: () => {
                                this.loadData();
                                this.selectedQuestion.status = status;
                                this.selectedQuestion.approved_at = new Date().toString();
                                this.noitifi.isProcessing(false);
                                this.noitifi.toastSuccess(
                                    'Cập nhật thành công'
                                );
                            },
                            error: () => {
                                this.noitifi.isProcessing(false);
                                this.noitifi.toastError(
                                    'Cập nhật thất bại, Lỗi kết nối'
                                );
                            },
                        });
                }
            });
    }

    huyTrangThai(activity) {
        this.noitifi
            .confirm(
                '<div class="alert-duyetnoidung">' +
                '<span>- Bạn đang thực hiện thao tác đưa nội dung về trạng thái chờ duyệt</span>' +
                '<span>- Bạn có chắc chắn thực hiện thao tác này?</span>' +
                '</div>',
                'Xác nhận hành động',
                [BUTTON_YES, BUTTON_NO]
            )
            .then((a) => {
                if (a.name === 'yes') {
                    this.noitifi.isProcessing(true);
                    this.ovicDateTimeService.getCurrentDateTime().pipe(
                        mergeMap((_date) => {
                            return this.courseQuestionsService.updateCourseQuestions(activity.id, { status: 0, approved_by: this.userId, approved_at: this.helperService.stringToDateSql(_date.toString()), }).pipe(
                                mergeMap(() => {
                                    return of(null);
                                })
                            );
                        })
                    )
                        .subscribe({
                            next: () => {
                                this.loadData();
                                this.selectedQuestion.status = 0;

                                this.noitifi.isProcessing(false);
                                this.noitifi.toastSuccess(
                                    'Cập nhật thành công'
                                );
                            },
                            error: () => {
                                this.noitifi.isProcessing(false);
                                this.noitifi.toastError(
                                    'Cập nhật thất bại, Lỗi kết nối'
                                );
                            },
                        });
                }
            });
    }

    openNewQuestion(action: string) {
        let data = this.list_question;
        const index = data.findIndex(m => m.id === this.selectedQuestion.id);
        if (index !== -1) {
            if (action === 'next') {
                if (index + 1 >= data.length) {
                    this.selectedQuestion = data[0];
                } else {
                    this.selectedQuestion = data[index + 1];
                }
            } else if (action === 'back') {
                if (index - 1 < 0) {
                    this.selectedQuestion = data[data.length - 1];
                } else {
                    this.selectedQuestion = data[index - 1];
                }
            }
            this.chooseQuestion(this.selectedQuestion, index + 1);
        } else {
            this.noitifi.toastWarning('Không tìm thấy câu hỏi');
        }
    }

    getCloneQuestionPromise(question: CourseQuestions): Promise<any> {
        return new Promise((resolve, reject) => {
            const objectRoles = {};
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: "question_root_id",
                        condition: OvicQueryCondition.equal,
                        value: question.id.toString(),
                        orWhere: "and",
                    },
                    {
                        conditionName: "old_status",
                        condition: OvicQueryCondition.equal,
                        value: "1",
                        orWhere: "and",
                    },
                    {
                        conditionName: "status",
                        condition: OvicQueryCondition.equal,
                        value: "0",
                        orWhere: "and",
                    },
                ],
                set: [],
                page: null,
            };
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition).subscribe({
                next: (_role) => {
                    if (_role.data[0]) {
                        resolve(_role.data[0].id);
                    } else {
                        resolve(0);
                    }
                },
                error: () => {
                    resolve(0);
                },
            });
        });
    }


    async reDoAction(event, question: CourseQuestions, status: number) {
        event.preventDefault();
        event.stopPropagation();
        if (status === 1 && question.old_status !== 1) {
            return this.noitifi.toastWarning("Nội dung này chưa từng được duyệt, không thể khóa");
        }
        this.noitifi.isProcessing(true);
        const id = await this.getCloneQuestionPromise(question);
        if (id !== 0) {
            this.loadData();
            return this.noitifi.toastInfo("Câu hỏi mới được cập nhật, vui lòng thao tác lại");
        }
        this.ovicDateTimeService.getCurrentDateTime().pipe(
            mergeMap((_date) => {
                return this.courseQuestionsService.updateCourseQuestions(question.id, { old_status: question.status, status: status, accept_edit_id: this.userId, accept_edit_at: this.helperService.stringToDateSql(_date.toString()), }).pipe(
                    mergeMap(() => {
                        return of(null);
                    })
                );
            })
        ).subscribe({
            next: () => {
                this.loadData();
                // question.status = status;
                this.noitifi.isProcessing(false);
                this.noitifi.toastSuccess(
                    'Cập nhật thành công'
                );
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError(
                    'Cập nhật thất bại, Lỗi kết nối'
                );
            },
        });
    }

    checkValue(event, key: string) {
        if (event.checked === true) {
            switch (key) {
                case '_chuanhanxet':
                    this._chuanhanxet = 1
                    break;
                case '_chuaduyet':
                    this._chuaduyet = 1;
                    break;
                default:
                    break;
            }
        } else {
            switch (key) {
                case '_chuanhanxet':
                    this._chuanhanxet = null;
                    break;
                case '_chuaduyet':
                    this._chuaduyet = null
                    break;
                default:
                    break;
            }
        }
    }

    onSelectStatus(event) {
        if (event === 100) {
            this._daduyet = null
        } else {
            this._daduyet = event;
        }
    }

    getCloneQuestion(question: CourseQuestions): Promise<any> {
        return new Promise((resolve, reject) => {
            const objectRoles = {};
            const condition: ConditionOption = {
                condition: [
                    {
                        conditionName: "question_root_id",
                        condition: OvicQueryCondition.equal,
                        value: question.id.toString(),
                        orWhere: "and",
                    },
                ],
                set: [],
                page: null,
            };
            this.courseQuestionsService.getCourseQuestionsByPageNew(condition).pipe().subscribe({
                next: (_role) => {
                    if (_role.data[0]) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                },
                error: () => {
                    resolve(null);
                },
            });
        });
    }

    btnUpdateLockQuestion(type: 1 | 0) {

        const dataContentMap = Array.from(this.list_question).filter(f => f.status >= 0 && f.status !== type);
        if (dataContentMap.length > 0) {
            this.noitifi.isProcessing(true);
            const step: number = 100 / dataContentMap.length;
            this.noitifi.loadingAnimationV2({ process: { percent: 0 } });
            const condition_question: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString() },
                    { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: [...new Set(this.list_cdr.map(m => m.id))].toString() },
                    { label: 'include_by', value: 'reference_id' },
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'cdr' }
                ],
                page: null
            }

            // return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)

            forkJoin([
                this.ovicDateTimeService.getCurrentDateTime(),
                this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
            ]).pipe(

                mergeMap(dataNew => {

                    const dataContentMapNew = Array.from(dataNew[1]['data']).filter(f => f.status >= 0 && f.status !== type);

                    return this.loopUpdateStatusQuestion(dataContentMapNew, type, dataNew[0], step, 0)
                })).subscribe({
                    next: () => {
                        // this.load(this._coursePlan);
                        this.loadData();
                        this.noitifi.disableLoadingAnimationV2()
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess('Cập nhật thành công');
                    }, error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.disableLoadingAnimationV2()

                        this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
                    }
                })

        } else {
            this.noitifi.toastWarning(type == 1 ? 'Không có câu hỏi nào đang mở khóa' : 'Không có đề nào đang bị khóa');
        }


    }


    private loopUpdateStatusQuestion(data: any[], status: number, _date: any, step: number, percent: number) {

        const index = data.findIndex(f => !f['_haveUpdate']);
        if (index !== -1) {
            const activity = data[index];
            activity['_haveUpdate'] = true; // đánh dấu đã xử lý
            const newPercent: number = percent + step;
            this.noitifi.loadingAnimationV2({ process: { percent: newPercent } });

            if (status === 1 && activity.old_status !== 1) {
                this.noitifi.toastWarning("Nội dung này chưa từng được duyệt, không thể khóa");
                return this.loopUpdateStatusQuestion(data, status, _date, step, newPercent);
            }
            return this.courseQuestionsService.updateCourseQuestions(activity.id, {
                old_status: activity.status,
                status: status,
                accept_edit_id: this.auth.user.id,
                accept_edit_at: this.helperService.stringToDateSql(_date.toString())
            }).pipe(mergeMap(() => this.loopUpdateStatusQuestion(data, status, _date, step, newPercent)));

        } else {
            return of(data);
        }
    }


    // long
    private mapListReduceQuestionReport(data: CourseQuestionReport[]): ReportsListQuestion[] {
        if (data.length == 0) {
            return [];
        }

        const resultMap = new Map<string, Map<number, { title: string; checkedCount: number; total: number }>>();
        const othersMap = new Map<string, { value: string; userId: number }[]>();

        for (const userEntry of data) {
            const userId = userEntry.user_id;

            for (const section of userEntry.content) {
                const header = section.header;
                if (!resultMap.has(header)) resultMap.set(header, new Map());
                if (!othersMap.has(header)) othersMap.set(header, []);

                for (const item of section.items) {
                    const isOrder4 = item.title.trim().toLowerCase() === 'khác';
                    const hasContent = item.value?.trim() || item.check;

                    // Nếu order = 4 → đưa vào others nếu có nội dung hoặc được chọn
                    if (isOrder4 && hasContent) {
                        othersMap.get(header)!.push({
                            value: item.value?.trim() || "(được chọn)",
                            userId,
                        });
                        continue; // Không đưa vào stats
                    }

                    // Nếu KHÔNG phải order = 4, và có order thì xử lý stats
                    if (typeof item.order === "number" && item.title.trim().toLowerCase() !== 'khác') {
                        const itemMap = resultMap.get(header)!;
                        if (!itemMap.has(item.order)) {
                            itemMap.set(item.order, {
                                title: item.title,
                                checkedCount: 0,
                                total: 0,
                            });
                        }

                        const stat = itemMap.get(item.order)!;
                        stat.total += 1;
                        if (item.check) stat.checkedCount += 1;
                    }
                }
            }
        }

        // Convert Map to array
        const result: ReportsListQuestion[] = [];
        for (const [header, itemsMap] of resultMap.entries()) {
            const stats = Array.from(itemsMap.entries())
                .map(([order, stat]) => ({
                    order,
                    title: stat.title,
                    checkedCount: stat.checkedCount,
                    total: stat.total,
                }))
                .sort((a, b) => a.order - b.order);

            result.push({
                header,
                stats,
                others: othersMap.get(header) || [],
            });
        }

        return result;
    }
    checkItemByReport(item: any) {
        if (item.order == 1) {
            // checkedCount
            // total
            return item.checkedCount == item.total ? 1 : 0;
        } else {

            if (item.checkedCount == 0) {
                return 0
            } else {
                return 2;
            }
        }
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

    approvedAll() {
        this.noitifi.confirm("Thầy/Cô có chắc chắn muốn duyệt tất cả không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === "yes") {
                this.displayModal = true;
                this.progressValue = 0;
                this.ovicDateTimeService.getCurrentDateTime().subscribe({
                    next: (date) => {
                        const request: Observable<any>[] = [];

                        let question_ = [];

                        this.list_cdr.forEach(f => {
                            question_ = question_.concat(f['question_cdr'].filter(m => m.status !== 1));
                        })

                        question_.forEach(f => {
                            request.push(this.courseQuestionsService.updateCourseQuestions(f.id, { old_status: 0, status: 1, approved_by: this.userId, approved_at: this.helperService.stringToDateSql(date.toString()) }));
                        })

                        if (request.length) {
                            this.loopAddForm(request, 0).subscribe({
                                next: () => {
                                    this.displayModal = false;
                                    this.loadData();
                                    this.noitifi.toastSuccess("Cập nhật thành công");
                                },
                                error: (e) => {
                                    console.log(e);
                                    this.displayModal = false;
                                    this.noitifi.toastError("Cập nhật thất bại, vui lòng thử lại");
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
}
