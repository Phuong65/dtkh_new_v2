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
import { CHUAN_DAU_RA, HOIDONGDUYET, ROLES } from '@modules/shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, mergeMap, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { ExtractCorrectAnswerPipe } from '@modules/shared/pipes/extract-correct-answer.pipe';
import { IctuMediaLinkPipe } from '@modules/shared/pipes/ictu-media-link.pipe';
import { QuestionPrefixPipe } from '@modules/shared/pipes/question-prefix.pipe';
import { SafeHtmlSinglePipe } from '@modules/shared/pipes/safe-html-single.pipe';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { QuestionTypesModule } from '../../cauhoi-tracnghiem/question-types/question-types.module';
import { AnswerLabelPipe } from '../../cauhoi-tracnghiem/questions/list-questions/answer-label.pipe';
import { IsAnswerCorrectPipe } from '../../cauhoi-tracnghiem/questions/list-questions/is-answer-correct.pipe';

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
        InputTextareaModule
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

    @Input() canReply: boolean = false;

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

    HOIDONGDUYET = HOIDONGDUYET;

    _chuanhanxet: number;

    _chuaduyet: number;

    _khoadaduyet: number = 1;

    checkKhoa: boolean = true;

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
        private courseQuestionCommentService: CourseQuestionCommentService
    ) {
        this.CHUAN_DAU_RA.forEach(f => {
            this.object_chuandaura[f.id] = f.label;
        })

        this.rejectRole = this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) ? true : false;
    }



    ngOnChanges(changes: SimpleChanges): void {
        if (changes['courseSelected']) {
            this.selectedCourse = this.courseSelected;
        }

        if (changes['activity']) {
            if (this.selectedCourse.id) {
                this.selectedActivity = this.activity;
                this.loadData();
            }
        }
    }

    ngOnInit(): void {
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
                        this.selectedActivity['count_question'] = '('.concat(_question.data.filter(m => m.status_captruong === 0 && m.group_id !== 0).length.toString(), ' + <span class="red">', _question.data.filter(m => (m.status_captruong === -1 || m.status_captruong === -2) && m.group_id !== 0).length.toString(), '</span> + <span class="blue">', _question.data.filter(m => m.status_captruong === 1 && m.group_id !== 0).length.toString(), '</span> = ', _question.data.filter(m => m.group_id !== 0).length.toString(), ')');

                        _question.data.forEach(f => {
                            question_ids.push(f.id);
                            if (f.group_id === 0) {
                                f.children = _question.data.filter(m => m.group_id === f.id);
                                parent_question.push(f);
                            }
                        })
                    } else {
                        this.selectedActivity['count_question'] = '('.concat(_question.data.filter(m => m.status_captruong === 0).length.toString(), ' + <span class="red">', _question.data.filter(m => m.status_captruong === -1 || m.status_captruong === -2).length.toString(), '</span> + <span class="green">', _question.data.filter(m => m.status_captruong === 1).length.toString(), '</span> = ', _question.data.length.toString(), ')');

                        _question.data.forEach(f => {
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

                        const condition_comment: ConditionOption = {
                            condition: [
                                { conditionName: 'cap_hoidong', condition: OvicQueryCondition.equal, value: 'cap_truong' },
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
                        ]).pipe(mergeMap(([_result, _config, _comment]) => {
                            let question_list = [];
                            _plan_activity.data.forEach(f => {
                                if (f.question_cdr && f.question_cdr.length) {
                                    question_list = question_list.concat(f.question_cdr);
                                    f.question_cdr.forEach((q, key) => {
                                        q['index_question'] = key + 1;
                                        q['in_cdr'] = f.kyhieu;
                                        q['hoidong_comment'] = {};
                                        q['_chuanhanxet'] = 1;
                                        q['_chuaduyet'] = q.status_captruong !== 1 ? 1 : 0;
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
                this.list_cdr = _activity.data;

            },
            error: (e) => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    chooseQuestion(question: CourseQuestions, index_question: number) {
        this.selectedQuestion = question;
        if (question.count_teacher || question['old_status'] === 1) {
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
        this.noitifi.isProcessing(true);
        forkJoin([
            this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_comment),
            this.courseQuestionCommentService.getCourseQuestionCommentByPageNew(condition_reply_comment),
        ]).subscribe({
            next: ([_comment, _comment_child]) => {
                _comment.data.forEach((f) => {

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

                Object.keys(object_comment).forEach((o, key) => {
                    let display_name = 'Ủy viên '.concat((key + 1).toString());
                    if (o.toString() === this.userId.toString()) {
                        display_name = 'Nhận xét của bạn';
                    } else if (this.courseSelected.creator_plan_id !== this.userId) {
                        display_name = object_comment[o] ? object_comment[o]['display_name'] : 'Không xác định';
                    }

                    if (object_comment[o]['cap_khoa'] && object_comment[o]['cap_khoa'].length) {
                        this.selectedQuestion['comments'].push({ user_id: Number(o), display_name: display_name, cap_hoidong: 'cap_khoa', children: object_comment[o]['cap_khoa'] });
                    }

                    if (object_comment[o]['cap_truong'] && object_comment[o]['cap_truong'].length) {
                        this.selectedQuestion['comments'].push({ user_id: Number(o), display_name: display_name, cap_hoidong: 'cap_truong', children: object_comment[o]['cap_truong'] });
                    }
                });

                this.selectedQuestion['textarea_comment'] = '';
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
                    if (f.user_id === this.courseSelected.creator_plan_id && this.userId !== f.user_id) {
                        f['display_name'] = this.courseSelected['display_name'];
                    } else if (f.user_id === this.userId) {
                        f['display_name'] = 'Phản hồi của bạn';
                        f['my_reply_comment'] = true;
                    } else {
                        if (this.userId !== this.courseSelected.creator_plan_id) {
                            f['display_name'] = f.user ? f.user.display_name : 'Không xác định';
                        } else {
                            if (comment.user_id === f.user_id) {
                                f['display_name'] = 'Ủy viên '.concat((index_comment + 1).toString());
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
            const index = this.hoidong.findIndex(m => m.user_id === this.userId);
            let cap_hoidong = null;
            if (index !== -1) {
                cap_hoidong = 'cap_truong';
            } else if (this.courseSelected.creator_plan_id !== this.userId) {
                cap_hoidong = 'cap_khoa';
            }
            const data_comment: CourseQuestionComment = {
                course_plan_activity_id: activity.course_plan_activity_id,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.courseSelected.id,
                parent_id: comment.id,
                course_question_id: activity.id,
                cap_hoidong: cap_hoidong
            };

            this.courseQuestionCommentService.addCourseQuestionComment(data_comment).subscribe({
                next: () => {
                    this.noitifi.toastSuccess('Đã gửi phản hồi thành công');
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(this.selectedComment, index_comment);
                },
                error: () => {
                    this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                },
            });
        } else {
            this.noitifi.toastWarning('Vui lòng nhập phản hồi trước khi gửi');
        }
    }

    saveComment(status, activity: CourseQuestions) {
        const noidung = activity['textarea_comment'] ? activity['textarea_comment'].trim() : activity['textarea_comment'];
        if (noidung) {
            this.noitifi.confirm(status === -1 ? 'Thầy / Cô có chắc chắn yêu cầu sửa' : 'Thầy / Cô có chắc chắn đồng ý duyệt', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then((a) => {
                if (a.name === 'yes') {
                    const data: CourseQuestionComment = {
                        course_plan_activity_id: activity.course_plan_activity_id,
                        comment: noidung,
                        status: status,
                        user_id: this.auth.user.id,
                        course_id: this.courseSelected.id,
                        parent_id: 0,
                        course_question_id: activity.id,
                        cap_hoidong: 'cap_truong',
                    };

                    this.courseQuestionCommentService.addCourseQuestionComment(data).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Cập nhật thành công');
                            this.loadCommentQuestion();
                        },
                        error: () => {
                            this.noitifi.toastError('Cập nhật thất bại, lỗi kết nối');
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

        this.noitifi.confirm(confirm_data, 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then((a) => {
            if (a.name === 'yes') {
                this.noitifi.isProcessing(true);
                this.ovicDateTimeService.getCurrentDateTime().pipe(
                    mergeMap((_date) => {
                        return this.courseQuestionsService.updateCourseQuestions(activity.id, {
                            status_captruong: status,
                            approved_captruong_by: this.userId,
                            approved_captruong_at: this.helperService.stringToDateSql(_date.toString()),
                        }).pipe(mergeMap(() => {
                            return of(null);
                        })
                        );
                    })
                ).subscribe({
                    next: () => {
                        this.loadData();
                        this.selectedQuestion.status_captruong = status;
                        this.selectedQuestion.approved_captruong_at = new Date().toString();
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess('Cập nhật thành công');
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
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
                                this.selectedQuestion.status_captruong = 0;

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

    reDoAction(event, question: CourseQuestions, status: number) {
        event.preventDefault();
        event.stopPropagation();
        if (status === 1 && question.old_status !== 1) {
            return this.noitifi.toastWarning("Nội dung này chưa từng được duyệt, không thể khóa");
        }
        this.noitifi.isProcessing(true);
        this.ovicDateTimeService.getCurrentDateTime().pipe(
            mergeMap((_date) => {
                return this.courseQuestionsService.updateCourseQuestions(question.id, { old_status: question.status_captruong, status: status, accept_edit_id: this.userId, accept_edit_at: this.helperService.stringToDateSql(_date.toString()), }).pipe(
                    mergeMap(() => {
                        return of(null);
                    })
                );
            })
        ).subscribe({
            next: () => {
                this.loadData();
                // question.status_captruong = status;
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
                case '_khoadaduyet':
                    this._khoadaduyet = 1;
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
                case '_khoadaduyet':
                    this._khoadaduyet = null;
                    break;
                default:
                    break;
            }
        }
    }
}
