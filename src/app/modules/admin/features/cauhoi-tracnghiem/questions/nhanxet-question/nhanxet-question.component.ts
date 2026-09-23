import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BUTTON_NO, BUTTON_YES} from '@core/models/buttons';
import {OvicQueryCondition} from '@core/models/dto';
import {AuthService} from '@core/services/auth.service';
import {FileService} from '@core/services/file.service';
import {HelperService} from '@core/services/helper.service';
import {HttpParamsHeplerService} from '@core/services/http-params-hepler.service';
import {NotificationService} from '@core/services/notification.service';
import {UserService} from '@core/services/user.service';
import {ConditionOption} from '@modules/shared/models/condition-option';
import {CourseQuestionComment} from '@modules/shared/models/course-question-comment';
import {CourseQuestions} from '@modules/shared/models/course-questions';
import {ElnKhoaHoc} from '@modules/shared/models/elng-khoa-hoc';
import {CourseQuestionCommentService} from '@modules/shared/services/course-question-comment.service';
import {CourseQuestionsService} from '@modules/shared/services/course-questions.service';
import {OvicDateTimeService} from '@modules/shared/services/ovic-date-time.service';
import {SharedModule} from '@modules/shared/shared.module';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';


@Component( {
    selector: 'app-nhanxet-question',
    standalone: true,
    imports: [ CommonModule, SharedModule, FormsModule ],
    templateUrl: './nhanxet-question.component.html',
    styleUrls: [ './nhanxet-question.component.css' ]
} )
export class NhanxetQuestionComponent implements OnInit {

    @Input() question_input: CourseQuestions;

    @Input() course_input: ElnKhoaHoc;



    selectedQuestion: CourseQuestions;

    selectedCourse: ElnKhoaHoc;

    selectedComment: CourseQuestionComment;

    userId: number;

    showComment: boolean = true;

    constructor (
        private helperService: HelperService,
        private modalService: NgbModal,
        private userService: UserService,
        private auth: AuthService,
        private fileService: FileService,
        private noitifi: NotificationService,
        private httpHepler: HttpParamsHeplerService,
        private courseQuestionCommentService: CourseQuestionCommentService,
        private ovicDateTimeService: OvicDateTimeService,
        private courseQuestionsService: CourseQuestionsService
    ) {

    }

    ngOnChanges( changes: SimpleChanges ): void {
        if ( changes[ 'activity_input' ] || changes[ 'course_input' ] ) {
            this.selectedQuestion = this.question_input;
            this.selectedCourse = this.course_input;
            if ( this.selectedQuestion.status === 1 ) {
                this.showComment = false;
            }
        }
    }

    ngOnInit(): void {
        this.userId = this.auth.user.id;
    }

    openReply( comment: CourseQuestionComment, index_comment: number ) {
        comment[ 'reply_open' ] = !comment[ 'reply_open' ];
        this.selectedComment = comment;
        if ( comment[ 'reply_open' ] === true ) {
            this.loadReplyComment( this.selectedComment, index_comment );
        }
    }

    loadReplyComment( comment: CourseQuestionComment, index_comment ) {
        const condition_comment: ConditionOption = {
            condition: [
                {conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: comment.id.toString()}
            ],
            set: [
                {label: 'limit', value: '-1'}
            ],
            page: null
        }

        this.courseQuestionCommentService.getCourseQuestionCommentByPageNew( condition_comment ).subscribe( {
            next: ( _comment ) => {
                _comment.data.forEach( f => {
                    if ( f.user_id === this.selectedCourse.creator_plan_id && this.userId !== f.user_id ) {
                        f[ 'display_name' ] = this.selectedCourse[ 'user_label' ];
                    } else if ( f.user_id === this.userId ) {
                        f[ 'display_name' ] = 'Phản hồi của bạn';
                        f[ 'my_reply_comment' ] = true;
                    } else if ( comment.user_id === f.user_id ) {
                        f[ 'display_name' ] = 'Ủy viên '.concat( ( index_comment + 1 ).toString() );
                    } else {
                        f[ 'display_name' ] = 'Ủy viên khác'
                    }
                } )

                comment[ 'reply_comments' ] = _comment.data;

                comment[ 'count_reply' ] = _comment.data.length;

            },

            error: () => {
                this.noitifi.toastError( 'Lỗi kết nôi, vui lòng thử lại' );
            }
        } )
    }


    saveCommentReply( comment: CourseQuestionComment, question: CourseQuestions, index_comment: number ) {
        const comment_content = comment[ 'textarea_comment' ] ? comment[ 'textarea_comment' ].trim() : comment[ 'textarea_comment' ].trim();

        if ( comment_content && comment_content !== '' ) {
            const data_comment: CourseQuestionComment = {
                course_plan_activity_id: question.course_plan_activity_id,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: question.course_id,
                parent_id: comment.id,
                course_question_id: question.id
            }

            this.courseQuestionCommentService.addCourseQuestionComment( data_comment ).subscribe( {
                next: () => {
                    this.noitifi.toastSuccess( "Đã gửi phản hồi thành công" );
                    comment[ 'textarea_comment' ] = '';
                    this.loadReplyComment( this.selectedComment, index_comment );
                },
                error: () => {
                    this.noitifi.toastError( "Lỗi kết nối, vui lòng thử lại" )
                }
            } )
        } else {
            this.noitifi.toastWarning( "Vui lòng nhập phản hồi trước khi gửi" )
        }
    }


    yeucauduyet( question: CourseQuestions ) {
        this.noitifi.confirm( '<div class="alert-duyetnoidung">' +
            '<span>- Bạn đang thực hiện thao tác yêu cầu duyệt nội dung giảng dạy</span>' +
            '<span>- Thao tác này không thể hoàn tác</span>' +
            '<span>- Bạn có chắc chắn yêu cầu duyệt nội dung giảng dạy này?</span>' +
            '</div>', 'Xác nhận hành động', [ BUTTON_YES, BUTTON_NO ] ).then( a => {
                if ( a.name === 'yes' ) {
                    this.noitifi.isProcessing( true );
                    this.courseQuestionsService.updateCourseQuestions( question.id, {status: -2} ).subscribe( {
                        next: () => {
                            question[ 'status' ] = 0;
                            this.noitifi.isProcessing( false );
                            this.noitifi.toastSuccess( 'Cập nhật thành công' );
                        },
                        error: () => {
                            this.noitifi.isProcessing( false );
                            this.noitifi.toastError( 'Cập nhật thất bại, Lỗi kết nối' );
                        }
                    } )
                }
            } )
    }

    onShowNhanxet ( event ) {
        event.preventDefault();
        this.showComment = !this.showComment;
    }

    checkItemByReport(item:any){
        if(item.order == 1){
            // checkedCount
            // total
            return item.checkedCount == item.total ? 1 : 0;
        }else{

            if(item.checkedCount == 0){
                return  0
            }else{
                return 2;
            }
        }
    }
}
