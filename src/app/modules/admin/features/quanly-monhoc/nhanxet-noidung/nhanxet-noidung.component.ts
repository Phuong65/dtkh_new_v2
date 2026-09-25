import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CoursePlanComment } from '@modules/shared/models/course-plan-comment';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanCommentService } from '@modules/shared/services/course-plan-comment.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { SharedModule } from '@modules/shared/shared.module';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, ReactiveFormsModule, FormsModule],
    selector: 'app-nhanxet-noidung',
    templateUrl: './nhanxet-noidung.component.html',
    styleUrls: ['./nhanxet-noidung.component.css'],
})
export class NhanxetNoidungComponent implements OnInit, OnChanges {

    @Input() activity_input: CoursePlanActivities;

    @Input() course_input: ElnKhoaHoc;

    @Input() hideViewAction: boolean = false;

    selectedActivity: CoursePlanActivities;

    selectedCourse: ElnKhoaHoc;

    selectedComment: CoursePlanComment;

    userId: number;

    displayComment: boolean = false;

    constructor(
        private helperService: HelperService,
        private modalService: NgbModal,
        private userService: UserService,
        private auth: AuthService,
        private fileService: FileService,
        private noitifi: NotificationService,
        private httpHepler: HttpParamsHeplerService,
        private coursePlanCommentService: CoursePlanCommentService,
        private ovicDateTimeService: OvicDateTimeService,
        private coursePlanActivitiesService: CoursePlanActivitiesService
    ) {

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['activity_input'] || changes['course_input']) {
            this.selectedActivity = this.activity_input;
            this.selectedCourse = this.course_input;
        }
    }

    ngOnInit(): void {
        this.userId = this.auth.user.id;
    }

    openReply(comment: CoursePlanComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(this.selectedComment, index_comment);
        }
    }

    loadReplyComment(comment: CoursePlanComment, index_comment) {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: comment.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        this.coursePlanCommentService.getCoursePlanCommentByPageNew(condition_comment).subscribe({
            next: (_comment) => {
                _comment.data.forEach(f => {
                    if (f.user_id === this.selectedCourse.creator_plan_id && this.userId !== f.user_id) {
                        f['display_name'] = this.selectedCourse['user_label'];
                    } else if (f.user_id === this.userId) {
                        f['display_name'] = 'Phản hồi của bạn';
                        f['my_reply_comment'] = true;
                    } else if (comment.user_id === f.user_id) {
                        f['display_name'] = 'Ủy viên '.concat((index_comment + 1).toString());
                    } else {
                        f['display_name'] = 'Ủy viên khác'
                    }
                })

                comment['reply_comments'] = _comment.data;

                comment['count_reply'] = _comment.data.length;

            },

            error: () => {
                this.noitifi.toastError('Lỗi kết nôi, vui lòng thử lại');
            }
        })
    }


    saveCommentReply(comment: CoursePlanComment, activity: CoursePlanActivities, index_comment: number) {
        const comment_content = comment['textarea_comment'] ? comment['textarea_comment'].trim() : comment['textarea_comment'].trim();

        if (comment_content && comment_content !== '') {
            const data_comment: CoursePlanComment = {
                course_plan_activity_id: activity.id,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.selectedCourse.id,
                parent_id: comment.id
            }

            this.coursePlanCommentService.addCoursePlanComment(data_comment).subscribe({
                next: () => {
                    this.noitifi.toastSuccess("Đã gửi phản hồi thành công");
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(this.selectedComment, index_comment);
                },
                error: () => {
                    this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại")
                }
            })
        } else {
            this.noitifi.toastWarning("Vui lòng nhập phản hồi trước khi gửi")
        }
    }


    yeucauduyet(activities: CoursePlanActivities) {
        this.noitifi.confirm('<div class="alert-duyetnoidung">' +
            '<span>- Bạn đang thực hiện thao tác yêu cầu duyệt nội dung giảng dạy</span>' +
            '<span>- Thao tác này không thể hoàn tác</span>' +
            '<span>- Bạn có chắc chắn yêu cầu duyệt nội dung giảng dạy này?</span>' +
            '</div>', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.noitifi.isProcessing(true);
                    this.coursePlanActivitiesService.updateCoursePlanActivities(activities.id, { status: -2 }).subscribe({
                        next: () => {
                            activities['status'] = 0;
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastSuccess('Cập nhật thành công');
                        },
                        error: () => {
                            this.noitifi.isProcessing(false);
                            this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
                        }
                    })
                }
            })
    }

    showComment() {
        this.displayComment = !this.displayComment;
    }
}
