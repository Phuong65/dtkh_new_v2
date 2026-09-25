import { CourseFormDuyetService } from './../../../../shared/services/course-form-duyet.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { CourseFormCommentService } from './../../../../shared/services/course-form-comment.service';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { CourseFormComment } from '@modules/shared/models/course-form-comment';
import { AuthService } from '@core/services/auth.service';
import { CourseFormDuyet } from '@modules/shared/models/course-form-duyet';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { forkJoin, mergeMap, Observable, of, Subject, takeUntil } from 'rxjs';
import { ROLES } from '@modules/shared/utils/syscat';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';

export interface UserComment {
    user_id: number,
    display_name: string,
    children: CourseFormComment[]
}

interface PendingUndoAction {
    role: 'uy_vien' | 'chutich';
    action: 'approve' | 'request_change';
    commentId?: number;
    duyetId?: number;
    duyetCreated?: boolean;
    previousDuyet?: CourseFormDuyet | null;
    expiresAt: number;
}

@Component({
    selector: 'app-duyet-form-de',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule
    ],
    templateUrl: './duyet-form-de.component.html',
    styleUrls: ['./duyet-form-de.component.css']
})
export class DuyetFormDeComponent implements OnInit, OnDestroy {

    @Input() selectedCourse: ElnKhoaHoc;

    @Input() listThamDInh: HoidongThamdinhMonhocThanhvien[];

    @Input() typeForm: 'TN_KTHP' | 'TH_KTHP' | 'DG' | 'TNTX' | 'CC';

    @Output() onChangeStatus = new EventEmitter<any>();

    list_comment: UserComment[] = [];

    courseFormDuyet: CourseFormDuyet;

    textComment: string;

    kd_uyvien: boolean = false;

    kd_hoidong: boolean = false;

    userId: number;

    isManager: boolean = false;

    selectedComment: CourseFormComment;

    showRequestChangeForm: boolean = false;

    pendingUndoAction: PendingUndoAction | null = null;
    undoRemainingSeconds: number = 0;
    private undoTimer: any = null;

    private destroy$ = new Subject<void>();

    constructor(
        private courseFormCommentService: CourseFormCommentService,
        private notificationService: NotificationService,
        private helperService: HelperService,
        private auth: AuthService,
        private courseFormDuyetService: CourseFormDuyetService,
        private ovicDateTimeService: OvicDateTimeService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) ? true : false
    }

    ngOnInit(): void {
        this.userId = this.auth.user.id;
        if (this.listThamDInh) {
            const index = this.listThamDInh.findIndex(m => m.user_id === this.userId);
            if (index !== -1) {
                this.kd_hoidong = this.listThamDInh[index].chutich === 1 ? true : false;
                this.kd_uyvien = this.listThamDInh[index].chutich !== 1 ? true : false;
            }
        }
        this.loadCommentAndStatus();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.clearUndoTimer();
    }

    loadCommentAndStatus() {
        this.notificationService.isProcessing(true);
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: "form_type", condition: OvicQueryCondition.equal, value: this.typeForm, orWhere: 'and' }
            ],
            set: [
                { label: "limit", value: "-1" },
                { label: "with", value: "user" }
            ],
            page: null
        }

        const condition_form_duyet: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: "form_type", condition: OvicQueryCondition.equal, value: this.typeForm, orWhere: 'and' }
            ],
            set: [
                { label: "limit", value: "-1" }
            ],
            page: null
        }

        forkJoin([
            this.courseFormDuyetService.getCourseFormDuyetByPageNew(condition_form_duyet),
            this.courseFormCommentService.getCourseFormCommentByPageNew(condition_comment)
        ]).pipe(takeUntil(this.destroy$)).subscribe({
            next: ([_duyet, _comment]) => {
                const comment_parent = _comment.data.filter(m => m.parent_id === 0);

                const data = [];

                const object_comment = {};

                comment_parent.forEach(f => {
                    const count_reply = _comment.data.filter((m) => m.parent_id === f.id).length;

                    f['count_reply'] = count_reply;

                    if (f.user) {
                        f['display_name'] = f.user.display_name;
                    }

                    if (!object_comment[f.user_id]) {
                        object_comment[f.user_id] = [];
                        object_comment[f.user_id].push(f);
                    } else {
                        object_comment[f.user_id].push(f);
                    }
                })

                Object.keys(object_comment).forEach((o, key) => {
                    let display_name = 'Ủy viên '.concat((key + 1).toString());
                    if (this.kd_hoidong || this.isManager) {
                        if (o.toString() === this.userId.toString()) {
                            display_name = 'Nhận xét của bạn';
                        } else {
                            display_name = object_comment[o] ? object_comment[o][0]['display_name'] : 'Không xác định';
                        }
                    } else if (o.toString() === this.userId.toString()) {
                        display_name = 'Nhận xét của bạn';
                    }

                    data.push({ user_id: Number(o), display_name: display_name, children: object_comment[o] })
                })

                if (_duyet.recordsFiltered) {
                    this.courseFormDuyet = _duyet.data[0];
                } else {
                    this.courseFormDuyet = undefined;
                }

                this.list_comment = data;

                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    saveComment(status: number) {
        if (status === -1 && !this.showRequestChangeForm) {
            this.showRequestChangeForm = true;
            setTimeout(() => {
                const textarea = document.querySelector('.request-change-textarea') as HTMLTextAreaElement | null;
                textarea?.focus();
            });
            return;
        }

        const noidung = status === 1
            ? 'Đồng ý duyệt'
            : (this.textComment ? this.textComment.trim() : '');

        if (!noidung) {
            this.notificationService.toastWarning('Vui lòng nhập nội dung yêu cầu sửa');
            return;
        }

        this.doSaveComment(noidung, status);
    }

    private doSaveComment(noidung: string, status: number) {
        const data: CourseFormComment = {
            course_id: this.selectedCourse.id,
            form_type: this.typeForm,
            comment: noidung,
            parent_id: 0,
            user_id: this.userId,
            status: status
        };

        this.notificationService.isProcessing(true);
        this.courseFormCommentService.addCourseFormComment(data)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (createdComment: any) => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess('Cập nhật thành công');
                    this.showRequestChangeForm = false;
                    this.textComment = '';
                    this.registerUndoAction({
                        role: 'uy_vien',
                        action: status === 1 ? 'approve' : 'request_change',
                        commentId: this.extractCommentId(createdComment),
                        expiresAt: Date.now() + 10000
                    });
                    this.loadCommentAndStatus();
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError('Cập nhật thất bại, lỗi kết nối');
                },
            });
    }

    cancelRequestChange() {
        this.showRequestChangeForm = false;
        this.textComment = '';
    }

    duyetNoidung(status: number) {
        const previousDuyet: CourseFormDuyet | null = this.courseFormDuyet
            ? JSON.parse(JSON.stringify(this.courseFormDuyet))
            : null;

        let today = new Date();
        this.notificationService.isProcessing(true);
        this.ovicDateTimeService.getCurrentDateTime().pipe(
            mergeMap((_date) => {
                const data: CourseFormDuyet = {
                    course_id: this.selectedCourse.id,
                    form_type: this.typeForm,
                    status: status,
                    approved_by: this.userId,
                    approved_at: this.helperService.stringToDateSql(_date.toString())
                };

                today = _date;

                if (this.courseFormDuyet) {
                    return this.courseFormDuyetService
                        .updateCourseFormDuyet(this.courseFormDuyet.id, data)
                        .pipe(mergeMap(() => of({ id: this.courseFormDuyet.id, created: false })));
                } else {
                    return this.courseFormDuyetService
                        .addCourseFormDuyet(data)
                        .pipe(mergeMap((newId: any) => of({ id: this.extractCommentId(newId), created: true })));
                }
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: (result: { id: number | undefined, created: boolean }) => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Cập nhật thành công');
                this.onChangeStatus.emit({
                    id: this.courseFormDuyet ? this.courseFormDuyet.id : result.id,
                    status: status,
                    approved_at: today
                });
                this.registerUndoAction({
                    role: 'chutich',
                    action: status === 1 ? 'approve' : 'request_change',
                    duyetId: result.id,
                    duyetCreated: result.created,
                    previousDuyet: previousDuyet,
                    expiresAt: Date.now() + 10000
                });
                this.loadCommentAndStatus();
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Cập nhật thất bại, Lỗi kết nối');
            },
        });
    }

    private registerUndoAction(action: PendingUndoAction) {
        this.clearUndoTimer();
        this.pendingUndoAction = action;
        this.undoRemainingSeconds = 10;
        this.undoTimer = setInterval(() => {
            if (!this.pendingUndoAction) {
                this.clearUndoTimer();
                return;
            }
            this.undoRemainingSeconds = Math.max(
                0,
                Math.ceil((this.pendingUndoAction.expiresAt - Date.now()) / 1000)
            );
            if (this.undoRemainingSeconds <= 0) {
                this.pendingUndoAction = null;
                this.clearUndoTimer();
            }
        }, 1000);
    }

    private clearUndoTimer() {
        if (this.undoTimer) {
            clearInterval(this.undoTimer);
            this.undoTimer = null;
        }
        this.undoRemainingSeconds = 0;
    }

    restorePreviousAction() {
        const undoAction = this.pendingUndoAction;
        if (!undoAction) return;
        if (Date.now() > undoAction.expiresAt) {
            this.pendingUndoAction = null;
            this.clearUndoTimer();
            this.notificationService.toastWarning('Đã hết thời gian khôi phục');
            return;
        }

        const actions: Observable<any>[] = [];

        if (undoAction.role === 'uy_vien' && undoAction.commentId) {
            actions.push(this.courseFormCommentService.deleteCourseFormComment(undoAction.commentId));
        }

        if (undoAction.role === 'chutich' && undoAction.duyetId) {
            if (undoAction.duyetCreated) {
                actions.push(this.courseFormDuyetService.deleteCourseFormDuyet(undoAction.duyetId));
            } else if (undoAction.previousDuyet) {
                actions.push(this.courseFormDuyetService.updateCourseFormDuyet(
                    undoAction.duyetId,
                    {
                        status: undoAction.previousDuyet.status,
                        approved_by: undoAction.previousDuyet['approved_by'],
                        approved_at: undoAction.previousDuyet['approved_at']
                    }
                ));
            }
        }

        this.notificationService.isProcessing(true);
        (actions.length ? forkJoin(actions) : of(null))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess('Đã khôi phục');
                    this.pendingUndoAction = null;
                    this.clearUndoTimer();
                    if (undoAction.role === 'chutich') {
                        this.onChangeStatus.emit({
                            id: undoAction.duyetCreated ? null : (undoAction.previousDuyet?.id || null),
                            status: undoAction.previousDuyet ? undoAction.previousDuyet.status : 0,
                            approved_at: undoAction.previousDuyet ? undoAction.previousDuyet['approved_at'] : null
                        });
                    }
                    this.loadCommentAndStatus();
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError('Khôi phục thất bại, vui lòng thử lại');
                }
            });
    }

    private extractCommentId(res: any): number | undefined {
        if (res === null || res === undefined) return undefined;
        if (typeof res === 'number' && !isNaN(res)) return res;
        if (typeof res === 'string') {
            const n = Number(res);
            return isNaN(n) ? undefined : n;
        }
        if (typeof res === 'object') {
            const candidate = res.id ?? res.insert_id ?? res.inserted_id ?? res.last_id ?? res.lastInsertId;
            if (candidate !== undefined && candidate !== null) {
                const n = Number(candidate);
                return isNaN(n) ? undefined : n;
            }
            if (res.data) return this.extractCommentId(res.data);
        }
        return undefined;
    }

    openReply(comment: CourseFormComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(this.selectedComment, index_comment);
        }
    }

    loadReplyComment(comment: CourseFormComment, index_comment) {
        this.notificationService.isProcessing(true);

        const condition_comment: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: comment.id.toString(),
                }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null,
        };

        this.courseFormCommentService.getCourseFormCommentByPageNew(condition_comment)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (_comment) => {
                    _comment.data.forEach((f) => {
                        if (f.user_id === this.selectedCourse.creator_plan_id && this.userId !== f.user_id) {
                            f['display_name'] = this.selectedCourse['display_name'];
                        } else if (f.user_id === this.userId) {
                            f['display_name'] = 'Phản hồi của bạn';
                            f['my_reply_comment'] = true;
                        } else {
                            if (this.kd_hoidong || this.isManager) {
                                if (this.listThamDInh) {
                                    const index = this.listThamDInh.findIndex((m) => m.user_id === f.user_id);
                                    f['display_name'] = this.listThamDInh[index].user['display_name'];
                                }
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

                    this.notificationService.isProcessing(false);
                },

                error: () => {
                    this.notificationService.toastError('Lỗi kết nôi, vui lòng thử lại');
                },
            });
    }

    saveCommentReply(comment: CourseFormComment, index_comment: number) {
        const comment_content = comment['textarea_comment'] ? comment['textarea_comment'].trim() : comment['textarea_comment'];
        if (comment_content && comment_content !== '') {
            const data_comment: CourseFormComment = {
                course_id: this.selectedCourse.id,
                form_type: this.typeForm,
                comment: comment_content,
                parent_id: comment.id,
                user_id: this.userId,
                status: 0
            };

            this.notificationService.isProcessing(true);
            this.courseFormCommentService.addCourseFormComment(data_comment)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.notificationService.toastSuccess('Đã gửi phản hồi thành công');
                        comment['textarea_comment'] = '';
                        this.loadReplyComment(this.selectedComment, index_comment);
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                    },
                });
        } else {
            this.notificationService.toastWarning('Vui lòng nhập phản hồi trước khi gửi');
        }
    }
}
