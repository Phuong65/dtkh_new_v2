import { CoursePlanTuluanCommentService } from './../../../../shared/services/course-plan-tuluan-comment.service';
import { CoursePlanActivityTuluanService } from './../../../../shared/services/course-plan-activity-tuluan.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OrWhereCondition, OvicQueryCondition } from '@core/models/dto';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { forkJoin, mergeMap, of } from 'rxjs';
import { CourseThanhvienService } from '@modules/shared/services/course-thanhvien.service';
import { CourseThanhvien } from '@modules/shared/models/course_thanhvien';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { AuthService } from '@core/services/auth.service';
import { CourseQuestionComment } from '@modules/shared/models/course-question-comment';
import { CoursePlanTuluanComment } from '@modules/shared/models/course-plan-tuluan-comment';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { HelperService } from '@core/services/helper.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { HOIDONGDUYET, ROLES } from '@modules/shared/utils/syscat';
import { SharedModule } from '@modules/shared/shared.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        CheckboxModule,
        TableModule,
        ReactiveFormsModule,
        FormsModule,
        TableModule
    ],
    selector: 'app-duyet-cauhoi-thuchanh-kthp',
    templateUrl: './duyet-cauhoi-thuchanh-kthp.component.html',
    styleUrls: ['./duyet-cauhoi-thuchanh-kthp.component.css']
})
export class DuyetCauhoiThuchanhKthpComponent implements OnInit, OnChanges {

    @Input() selectedCourse: ElnKhoaHoc;

    @Input() planTuluan: CoursePlanActivities;

    @Input() listThamDInh: CourseThanhvien[];

    @Input() canReply: boolean = false;

    @ViewChild('templateFormViewTuluan') templateFormViewTuluan: TemplateRef<any>;

    selectedComment: CoursePlanTuluanComment;

    selectedTuluan: CoursePlanActivityTuluan;

    hoidong: CourseThanhvien[];

    list_plan_kynang: CoursePlanActivities[];

    list_de_tuluan: CoursePlanActivityTuluan[];

    kd_hoidong: boolean = false;

    kd_uyvien: boolean = false;

    userId: number;

    donviId: number;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    rejectRole: boolean = false;

    HOIDONGDUYET = HOIDONGDUYET;

    _chuanhanxet: number;

    _chuaduyet: number;

    _khoadaduyet: number = 1;

    checkKhoa: boolean = true;

    constructor(
        private notificationService: NotificationService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private coursePlanTuluanCommentService: CoursePlanTuluanCommentService,
        private auth: AuthService,
        private helperService: HelperService,
        private ovicDateTimeService: OvicDateTimeService
    ) {
        this.rejectRole = this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) ? true : false;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['planTuluan']) {
            this.loadKynangTuluan(this.planTuluan);
        }

        if (changes['listThamDInh']) {
            this.hoidong = this.listThamDInh;
        }
    }

    loadKynangTuluan(plan_tuluan: CoursePlanActivities) {
        this.notificationService.isProcessing(true);
        this.list_plan_kynang = null;

        // const condition_tuluan: ConditionOption = {
        //     condition: [
        //         { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: plan_tuluan.id.toString() },
        //         { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: plan_tuluan.course_id.toString(), orWhere: 'and' },
        //         { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'THUONGXUYEN_TULUAN', orWhere: 'and' }
        //     ],
        //     set: [
        //         { label: 'limit', value: '-1' }
        //     ],
        //     page: null
        // }




        // this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_tuluan).pipe(mergeMap(_plan_tuluan => {
        // const plan_tuluan_ids = [0];

        // _plan_tuluan.data.forEach(f => {
        //     plan_tuluan_ids.push(f.id);
        // })

        const condition_detuluan: ConditionOption = {
            condition: [
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                // { label: 'include', value: [... new Set(plan_tuluan_ids)].toString() },
                // { label: 'include_by', value: 'course_plan_activity_id' },
            ],
            page: null
        }



        forkJoin([
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_detuluan).pipe(mergeMap(_tuluan => {
                const _tuluan_ids = [];
                _tuluan.data.forEach(f => {
                    _tuluan_ids.push(f.id);
                })
                if (_tuluan_ids.length) {
                    const condition_comment: ConditionOption = {
                        condition: [
                            { conditionName: 'cap_hoidong', condition: OvicQueryCondition.equal, value: 'cap_truong' }
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: [... new Set(_tuluan_ids)].toString() },
                            { label: 'include_by', value: 'course_plan_activity_tuluan_id' },
                            { label: 'select', value: 'course_plan_activity_tuluan_id,user_id,id' },

                            // { label: 'order', value: 'ASC' },
                            // { label: 'orderby', value: 'ordering' }
                        ],
                        page: null
                    }
                    return this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment).pipe(mergeMap(_comment => {
                        _tuluan.data.forEach(q => {
                            q['hoidong_comment'] = {};
                            q['_chuanhanxet'] = 1;
                            q['_chuaduyet'] = q.status_captruong !== 1 ? 1 : 0;
                            this.hoidong.forEach(h => {
                                q['hoidong_comment'][h.user_id] = false;
                                const index = _comment.data.findIndex(m => m.course_plan_activity_tuluan_id === q.id && m.user_id === h.user_id);
                                if (index !== -1) {
                                    q['hoidong_comment'][h.user_id] = true;
                                    if (h.user_id === this.auth.user.id) {
                                        q['_chuanhanxet'] = 0;
                                    }
                                }
                            })
                        })
                        return of(_tuluan);
                    }))
                }
                return of(_tuluan);
            })),
        ]).subscribe(([_detuluan]) => {
            this.list_de_tuluan = _detuluan.data;
            this.notificationService.isProcessing(false);
            // _plan_tuluan.data.forEach(f => {
            // const detuluan = _detuluan.data.filter(m => m.course_plan_activity_id === f.id);

        })
        // return of(_plan_tuluan);
        // })
        // })).subscribe({
        //     next: (_plan) => {
        //         this.list_plan_kynang = _plan.data;
        //         this.notificationService.isProcessing(false);
        //     },
        //     error: () => {
        //         this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
        //     }
        // })
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

    onSelectDeTuluan(tuluan: CoursePlanActivityTuluan) {
        this.selectedTuluan = tuluan;
        this.loadCommentTuluan();
    }


    loadCommentTuluan() {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
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
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
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
        this.notificationService.isProcessing(true);
        forkJoin([
            this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment),
            this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_reply_comment),
        ]).subscribe({
            next: ([_comment, _comment_child]) => {
                _comment.data.forEach((f) => {
                    // const index = this.hoidong.findIndex(
                    //     ( m ) => m.user_id === f.user_id
                    // );
                    // if ( index !== -1 ) {
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

                this.selectedTuluan['comments'] = [];

                Object.keys(object_comment).forEach((o, key) => {
                    let display_name = 'Ủy viên '.concat((key + 1).toString());
                    if (o.toString() === this.userId.toString()) {
                        display_name = 'Nhận xét của bạn';
                    } else if (this.selectedCourse.creator_plan_id !== this.userId) {
                        display_name = object_comment[o] ? object_comment[o]['display_name'] : 'Không xác định';
                    }

                    if (object_comment[o]['cap_khoa'] && object_comment[o]['cap_khoa'].length) {
                        this.selectedTuluan['comments'].push({ user_id: Number(o), display_name: display_name, cap_hoidong: 'cap_khoa', children: object_comment[o]['cap_khoa'] });
                    }

                    if (object_comment[o]['cap_truong'] && object_comment[o]['cap_truong'].length) {
                        this.selectedTuluan['comments'].push({ user_id: Number(o), display_name: display_name, cap_hoidong: 'cap_truong', children: object_comment[o]['cap_truong'] });
                    }
                }
                );

                this.selectedTuluan['textarea_comment'] = '';
                this.notificationService.isProcessing(false);
                this.notificationService.openSideNavigationMenu({ template: this.templateFormViewTuluan, size: window.innerWidth, offsetTop: '0px' });
            },
            error: () => {

            }
        })
    }


    closeForm() {
        this.notificationService.closeSideNavigationMenu();
    }


    openReply(comment: CoursePlanTuluanComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(this.selectedComment, index_comment);
        }
    }

    loadReplyComment(comment: CoursePlanTuluanComment, index_comment) {
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

        this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment).subscribe({
            next: (_comment) => {
                _comment.data.forEach((f) => {
                    if (f.user_id === this.selectedCourse.creator_plan_id && this.userId !== f.user_id) {
                        f['display_name'] = this.selectedCourse['display_name'];
                    } else if (f.user_id === this.userId) {
                        f['display_name'] = 'Phản hồi của bạn';
                        f['my_reply_comment'] = true;
                    } else {
                        if (this.userId !== this.selectedCourse.creator_plan_id) {
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
                this.notificationService.toastError('Lỗi kết nôi, vui lòng thử lại');
            },
        });
    }

    saveCommentReply(comment: CoursePlanTuluanComment, activity: CoursePlanActivityTuluan, index_comment: number) {
        const comment_content = comment['textarea_comment'] ? comment['textarea_comment'].trim() : comment['textarea_comment'].trim();

        if (comment_content && comment_content !== '') {

            const index = this.hoidong.findIndex(m => m.user_id === this.userId);
            let cap_hoidong = null;
            if (index !== -1) {
                cap_hoidong = 'cap_truong';
            } else if (this.selectedCourse.creator_plan_id !== this.userId) {
                cap_hoidong = 'cap_khoa';
            }

            const data_comment: CoursePlanTuluanComment = {
                course_plan_activity_id: 0,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.selectedCourse.id,
                parent_id: comment.id,
                course_plan_activity_tuluan_id: activity.id,
                cap_hoidong: cap_hoidong
            };

            this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data_comment).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Đã gửi phản hồi thành công');
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(
                        this.selectedComment,
                        index_comment
                    );
                },
                error: () => {
                    this.notificationService.toastError(
                        'Lỗi kết nối, vui lòng thử lại'
                    );
                },
            });
        } else {
            this.notificationService.toastWarning('Vui lòng nhập phản hồi trước khi gửi');
        }
    }

    saveComment(status, activity: CoursePlanActivityTuluan) {
        const noidung = activity['textarea_comment'] ? activity['textarea_comment'].trim() : activity['textarea_comment'];
        if (noidung) {
            this.notificationService.confirm(status === -1 ? 'Thầy / Cô có chắc chắn yêu cầu sửa' : 'Thầy / Cô có chắc chắn đồng ý duyệt', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then((a) => {
                if (a.name === 'yes') {
                    const data: CoursePlanTuluanComment = {
                        course_plan_activity_id: 0,
                        comment: noidung,
                        status: status,
                        user_id: this.auth.user.id,
                        course_id: this.selectedCourse.id,
                        parent_id: 0,
                        course_plan_activity_tuluan_id: activity.id,
                        cap_hoidong: 'cap_truong'
                    };

                    this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess(
                                'Cập nhật thành công'
                            );

                            this.loadCommentTuluan();
                        },
                        error: () => {
                            this.notificationService.toastError(
                                'Cập nhật thất bại, lỗi kết nối'
                            );
                        },
                    });
                }
            });
        } else {
            this.notificationService.toastWarning('Vui lòng nhập nội dung');
        }
    }


    duyetNoidung(activity: CoursePlanActivityTuluan, status) {
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

        this.notificationService
            .confirm(confirm_data, 'Xác nhận hành động', [
                BUTTON_YES,
                BUTTON_NO,
            ])
            .then((a) => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.ovicDateTimeService.getCurrentDateTime().pipe(
                        mergeMap((_date) => {
                            return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(activity.id, {
                                status_captruong: status,
                                approved_captruong_by: this.userId,
                                approved_captruong_at: this.helperService.stringToDateSql(_date.toString()),
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
                                this.loadKynangTuluan(this.planTuluan);
                                this.selectedTuluan.status_captruong = status;
                                this.selectedTuluan.approved_captruong_at = new Date().toString();
                                this.notificationService.isProcessing(false);
                                this.notificationService.toastSuccess(
                                    'Cập nhật thành công'
                                );
                            },
                            error: () => {
                                this.notificationService.isProcessing(false);
                                this.notificationService.toastError(
                                    'Cập nhật thất bại, Lỗi kết nối'
                                );
                            },
                        });
                }
            });
    }


    huyTrangThai(activity) {
        this.notificationService.confirm(
            '<div class="alert-duyetnoidung">' +
            '<span>- Bạn đang thực hiện thao tác đưa nội dung về trạng thái chờ duyệt</span>' +
            '<span>- Bạn có chắc chắn thực hiện thao tác này?</span>' +
            '</div>',
            'Xác nhận hành động',
            [BUTTON_YES, BUTTON_NO]
        )
            .then((a) => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.ovicDateTimeService.getCurrentDateTime().pipe(
                        mergeMap((_date) => {
                            return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(activity.id, { status: 0, approved_by: this.userId, approved_at: this.helperService.stringToDateSql(_date.toString()), }).pipe(
                                mergeMap(() => {
                                    return of(null);
                                })
                            );
                        })
                    )
                        .subscribe({
                            next: () => {
                                this.loadKynangTuluan(this.planTuluan);
                                this.selectedTuluan.status = 0;
                                this.notificationService.isProcessing(false);
                                this.notificationService.toastSuccess(
                                    'Cập nhật thành công'
                                );
                            },
                            error: () => {
                                this.notificationService.isProcessing(false);
                                this.notificationService.toastError(
                                    'Cập nhật thất bại, Lỗi kết nối'
                                );
                            },
                        });
                }
            });
    }


    openNewQuestion(action: string) {

        let data = this.list_de_tuluan;

        const index = data.findIndex(m => m.id === this.selectedTuluan.id);
        if (index !== -1) {
            if (action === 'next') {
                if (index + 1 >= data.length) {
                    this.selectedTuluan = data[0];
                } else {
                    this.selectedTuluan = data[index + 1];
                }
            } else if (action === 'back') {
                if (index - 1 < 0) {
                    this.selectedTuluan = data[data.length - 1];
                } else {
                    this.selectedTuluan = data[index - 1];
                }
            }
            this.onSelectDeTuluan(this.selectedTuluan);
        } else {
            this.notificationService.toastWarning('Không tìm thấy câu hỏi');
        }
    }


    reDoAction(event, question: CoursePlanActivityTuluan, status: number) {
        event.preventDefault();
        event.stopPropagation();
        if (status === 1 && question.old_status !== 1) {
            return this.notificationService.toastWarning("Nội dung này chưa từng được duyệt, không thể khóa");
        }
        this.notificationService.isProcessing(true);
        this.ovicDateTimeService.getCurrentDateTime().pipe(
            mergeMap((_date) => {
                return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(question.id, { old_status: question.status, status: status, accept_edit_id: this.userId, accept_edit_at: this.helperService.stringToDateSql(_date.toString()), }).pipe(
                    mergeMap(() => {
                        return of(null);
                    })
                );
            })
        )
            .subscribe({
                next: () => {
                    this.loadKynangTuluan(this.planTuluan);
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess(
                        'Cập nhật thành công'
                    );
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError(
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
