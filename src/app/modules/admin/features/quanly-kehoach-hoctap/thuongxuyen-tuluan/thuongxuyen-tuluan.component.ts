import { HelperService } from '@core/services/helper.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanTuluanCommentService } from './../../../../shared/services/course-plan-tuluan-comment.service';
import { NotificationService } from '@core/services/notification.service';
import { CoursePlanActivityTuluanService } from './../../../../shared/services/course-plan-activity-tuluan.service';
import { Component, OnChanges, OnInit, SimpleChanges, TemplateRef, inject, input, viewChild } from '@angular/core';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { CoursePlanActivityTuluan, TIEUCHICHAM } from '@modules/shared/models/course-plan-activity-tuluan';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { AuthService } from '@core/services/auth.service';
import { CoursePlanTuluanComment } from '@modules/shared/models/course-plan-tuluan-comment';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TooltipModule } from 'primeng/tooltip';
import { CHUAN_DAU_RA } from '@modules/shared/utils/syscat';
import { APP_CONFIGS, environment, key_server } from '@env';
import { MultiSelectModule } from 'primeng/multiselect';
import { ViewThuongxuyenTuluanComponent } from '@modules/shared/components/view-thuongxuyen-tuluan/view-thuongxuyen-tuluan.component';
import { OvicDateTimePipe } from '@modules/shared/pipes/ovic-date-time.pipe';
import { OvicGroupsRadioV2Component } from '@modules/shared/components/ovic-groups-radio-v2/ovic-groups-radio-v2.component';
import { OvicCkeditorDocumentComponent } from '@modules/shared/components/ovic-ckeditor-document/ovic-ckeditor-document.component';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        ReactiveFormsModule,
        FormsModule,
        ButtonModule,
        NgbTooltipModule,
        TooltipModule,
        MultiSelectModule,
        ViewThuongxuyenTuluanComponent,
        OvicDateTimePipe,
        OvicGroupsRadioV2Component,
        OvicCkeditorDocumentComponent
    ],
    selector: 'app-thuongxuyen-tuluan',
    templateUrl: './thuongxuyen-tuluan.component.html',
    styleUrls: ['./thuongxuyen-tuluan.component.css']
})
export class ThuongxuyenTuluanComponent implements OnInit, OnChanges {
    private coursePlanActivityTuluanService = inject(CoursePlanActivityTuluanService);
    private notificationService = inject(NotificationService);
    private formBuilder = inject(FormBuilder);
    private auth = inject(AuthService);
    private coursePlanTuluanCommentService = inject(CoursePlanTuluanCommentService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private helperService = inject(HelperService);


    readonly activity = input<CoursePlanActivities>(undefined);

    readonly courseSelected = input<ElnKhoaHoc>(undefined);

    readonly templateFormAddTuluan = viewChild<TemplateRef<any>>('templateFormAddTuluan');

    readonly templateFormViewTuluan = viewChild<TemplateRef<any>>('templateFormViewTuluan');

    readonly templateFormAddTuluanV2 = viewChild<TemplateRef<any>>('templateFormAddTuluanV2');

    selectedComment: CoursePlanTuluanComment;

    selectedActivity: CoursePlanActivities;

    list_tuluan: CoursePlanActivityTuluan[];

    selectedTuluan: CoursePlanActivityTuluan;

    formTitle: string;

    formData: FormGroup;

    isUpdate = false;

    userId: number;

    list_question = [
        { id: 1, label: 'Câu 1' },
        { id: 2, label: 'Câu 2' }
    ]

    chuandaura = CHUAN_DAU_RA;

    list_activity_cdr: CoursePlanActivities[];

    list_tieuchi_chamdiem: TIEUCHICHAM[] = [];

    constructor() {
        this.formData = this.formBuilder.group({
            course_plan_activity_id: [''],
            desc: [''],
            title: ['', Validators.required],
            course_id: [''],
            time_duration: ['', Validators.required],
            // cdr: [''],
            // point: [''],
            // type: [''],
            // activity_cdr: [''],
        });

    }




    ngOnChanges(changes: SimpleChanges): void {
        if (changes['activity']) {
            this.selectedActivity = this.activity();
            this.loadTuluan();
        }
    }

    get f() {
        return this.formData.controls;
    }

    ngOnInit(): void {
        this.userId = this.auth.user.id;
    }

    loadTuluan() {
        const condition: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        const condition_cdr: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.courseSelected().id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-3',
                    orWhere: 'and',
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.equal,
                    value: 'ACTIVITY_CDR',
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

        forkJoin([
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_cdr)
        ]).subscribe({
            next: ([_tuluan, _cdr]) => {
                this.notificationService.isProcessing(false);
                const _re_kyhieu_cdr = _cdr.data.map(m => {
                    m['label'] = m.kyhieu.concat(". ", m.title);
                    m['re_kyhieu'] = parseFloat(m.kyhieu.replace(/\D/g, ""));
                    return m;
                })

                // const _cdr_numbers: number[] = _cdr.data.map(m => parseFloat(m.params.cdr.cdr_info.find(i => i.id === "level_require")['key']));

                // const max_cdr = Math.max(..._cdr_numbers);

                // console.log(max_cdr);

                this.list_activity_cdr = this.helperService.sort(_re_kyhieu_cdr, "re_kyhieu");

                this.list_tuluan = _tuluan.data;

                console.log(this.list_activity_cdr);
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastWarning('Lỗi kết nối, vui lòng thử lại')
            }
        })
    }

    formReset() {
        this.formData.reset();
        this.f['course_plan_activity_id'].setValue(this.selectedActivity.id);
        this.f['course_id'].setValue(this.selectedActivity.course_id);
        this.f['time_duration'].setValue(50);
        // this.f['type'].setValue("GROUP_QUESTION");
        this.f['title'].setValue("Đề ".concat(this.list_tuluan && this.list_tuluan.length ? (this.list_tuluan.length + 1).toString() : '1'));
        this.list_tieuchi_chamdiem = [];
        this.isUpdate = false;
    }

    createCodeTuluan() {
        this.formTitle = "Thêm đề mới";
        this.formReset();
        // this.notificationService.openSideNavigationMenu({ template: this.templateFormAddTuluanV2, size: window.innerWidth, offsetTop: '0px' })
        this.notificationService.openSideNavigationMenu({ template: this.templateFormAddTuluan(), size: 800, offsetTop: '0px' })
    }

    editCodeTuluan(tuluan: CoursePlanActivityTuluan) {
        this.formTitle = "Sửa đề: ".concat(tuluan.title);
        this.selectedTuluan = tuluan;
        this.formReset();
        this.f['title'].setValue(tuluan.title);
        this.f['desc'].setValue(tuluan.desc);
        this.f['time_duration'].setValue(tuluan.time_duration);
        // this.f['cdr'].setValue(tuluan.cdr)
        // this.list_tieuchi_chamdiem = tuluan.params.tieuchicham;
        // this.f['activity_cdr'].setValue(tuluan.params.cdrlienquan.map(m => m.id));
        // this.f['point'].setValue(tuluan.point)
        this.isUpdate = true;
        // this.notificationService.openSideNavigationMenu({ template: this.templateFormAddTuluanV2, size: window.innerWidth, offsetTop: '0px' })
        this.notificationService.openSideNavigationMenu({ template: this.templateFormAddTuluan(), size: 800, offsetTop: '0px' })
    }

    closeForm() {
        this.notificationService.closeSideNavigationMenu();
    }

    saveCourseTuluan(yeucauduyet: boolean = false) {
        // if (this.list_tieuchi_chamdiem.length !== 0) {

        //     let fill_tieuchi: boolean = true;

        //     this.list_tieuchi_chamdiem.forEach(f => {
        //         Object.keys(f).forEach(c => {
        //             if (!f[c]) {
        //                 this.notificationService.toastWarning("Vui lòng điền đầy đủ thông tin trong Tiêu chí ".concat(f.ordering.toString()));
        //                 fill_tieuchi = false;
        //                 return;
        //             }
        //         })
        //     })

        //     if (!fill_tieuchi) {
        //         return;
        //     }

        //     if (parseFloat(this.returnTotalPointTieuChi().toString()) > parseFloat(this.f['point'].value)) {
        //         this.notificationService.toastWarning("Tổng điểm tiêu chí vượt quá điểm của đề");
        //         return;
        //     }

        if (this.formData.valid) {
            this.notificationService.isProcessing(true);
            const data = this.formData.getRawValue();

            if (yeucauduyet === true) {
                data['status'] = -2;
            }

            // const cdr_select = [];

            // this.list_activity_cdr.filter(m => this.f['activity_cdr'].value.includes(m.id)).forEach(f => {
            //     cdr_select.push({ id: f.id, title: f.title, kyhieu: f.kyhieu })
            // })

            // data["params"] = {
            //     tieuchicham: this.list_tieuchi_chamdiem.map(m => {
            //         m.point = parseFloat(m.point.toString());
            //         return m;
            //     }),
            //     cdrlienquan: cdr_select
            // }

            // delete data['activity_cdr'];

            if (this.isUpdate) {
                this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(this.selectedTuluan.id, data).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.selectedTuluan = null;
                        this.formReset();
                        this.loadTuluan();
                        this.closeForm();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                    }
                })
            } else {
                this.coursePlanActivityTuluanService.addCoursePlanActivityTuluan(data).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.selectedTuluan = null;
                        this.formReset();
                        this.loadTuluan();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        }
        // } else {
        //     this.notificationService.toastWarning("Vui lòng thêm tiêu chí chấm")
        // }
    }

    deleteTuluan(tuluan: CoursePlanActivityTuluan) {
        this.selectedTuluan = tuluan;
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.coursePlanActivityTuluanService.deleteCoursePlanActivityTuluan(tuluan.id).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.loadTuluan();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        })
    }

    onViewTuluan(tuluan: CoursePlanActivityTuluan) {
        this.selectedTuluan = tuluan;
        this.loadCommentTuluan();


    }

    loadCommentTuluan() {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected().id.toString(), orWhere: 'and' },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: '0',
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }

        const condition_reply_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected().id.toString(), orWhere: 'and' },
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
                const object_comment = {};
                _comment.data.forEach((c) => {
                    const count_reply =
                        _comment_child.data.filter(
                            (m) => m.parent_id === c.id
                        ).length;

                    c['count_reply'] = count_reply;
                    c['reply_open'] = false;
                    if (!object_comment[c.user_id]) {
                        object_comment[c.user_id] = [];
                        object_comment[c.user_id].push(c);
                    } else {
                        object_comment[c.user_id].push(c);
                    }
                });

                this.selectedTuluan['comments'] = [];

                Object.keys(object_comment).forEach(
                    (o, key) => {
                        let display_name = 'Ủy viên '.concat((key + 1).toString());
                        if (o.toString() === this.userId.toString()) {
                            display_name = 'Nhận xét của bạn';
                        }

                        this.selectedTuluan['comments'].push({
                            user_id: o,
                            display_name: display_name,
                            children: object_comment[o],
                        });
                    }
                );

                this.notificationService.isProcessing(false);

                this.notificationService.openSideNavigationMenu({ template: this.templateFormViewTuluan(), size: window.innerWidth, offsetTop: '0px' });
            },
            error: () => {

            }
        })
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
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: comment.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment).subscribe({
            next: (_comment) => {
                _comment.data.forEach(f => {
                    const courseSelected = this.courseSelected();
                    if (f.user_id === courseSelected.creator_plan_id && this.userId !== f.user_id) {
                        f['display_name'] = courseSelected['user_label'];
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
                this.notificationService.toastError('Lỗi kết nôi, vui lòng thử lại');
            }
        })
    }


    saveCommentReply(comment: CoursePlanTuluanComment, question: CoursePlanActivityTuluan, index_comment: number) {
        const comment_content = comment['textarea_comment'] ? comment['textarea_comment'].trim() : comment['textarea_comment'].trim();
        if (comment_content && comment_content !== '') {
            const data_comment: CoursePlanTuluanComment = {
                course_plan_activity_id: question.course_plan_activity_id,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.courseSelected().id,
                parent_id: comment.id,
                course_plan_activity_tuluan_id: question.id
            }

            this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data_comment).subscribe({
                next: () => {
                    this.notificationService.toastSuccess("Đã gửi phản hồi thành công");
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(this.selectedComment, index_comment);
                },
                error: () => {
                    this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng nhập phản hồi trước khi gửi")
        }
    }


    yeucauduyet(question: CoursePlanActivityTuluan) {
        this.notificationService.confirm('<div class="alert-duyetnoidung">' +
            '<span>- Bạn đang thực hiện thao tác yêu cầu duyệt nội dung giảng dạy</span>' +
            '<span>- Thao tác này không thể hoàn tác</span>' +
            '<span>- Bạn có chắc chắn yêu cầu duyệt nội dung giảng dạy này?</span>' +
            '</div>', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(question.id, { status: -2 }).subscribe({
                        next: () => {
                            question['status'] = 0;
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastSuccess('Cập nhật thành công');
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError('Cập nhật thất bại, Lỗi kết nối');
                        }
                    })
                }
            })
    }


    openNewQuestion(action: string) {
        const index = this.list_tuluan.findIndex(m => m.id === this.selectedTuluan.id);
        if (index !== -1) {
            if (action === 'next') {
                if (index + 1 >= this.list_tuluan.length) {
                    this.selectedTuluan = this.list_tuluan[0];
                } else {
                    this.selectedTuluan = this.list_tuluan[index + 1];
                }
            } else if (action === 'back') {
                if (index - 1 < 0) {
                    this.selectedTuluan = this.list_tuluan[this.list_tuluan.length - 1];
                } else {
                    this.selectedTuluan = this.list_tuluan[index - 1];
                }
            }
            this.onViewTuluan(this.selectedTuluan);
        } else {
            this.notificationService.toastWarning('Không tìm thấy câu hỏi');
        }
    }

    pointQuestionKeyDown(event, inputPoint_quest) {
        if (event) {
            if (/[0-9]/.test(event.key) || event.key === '.' || event.key === 'Backspace') {
                if (inputPoint_quest.value.replace(/\d/gi, '').length > 0 && event.key === '.') {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    pointQuestionKeyup(event, inputPoint_quest) {
        if (event) {
            if (!isNaN(Number(inputPoint_quest.value))) {

                if (Number(inputPoint_quest.value) > 10) {
                    this.f['point'].setValue(10);
                }


                if (this.f['point'].value > this.list_tieuchi_chamdiem.length) {
                    for (let i = this.list_tieuchi_chamdiem.length + 1; i <= parseFloat(this.f['point'].value); i++) {

                        const tieuchi = {
                            ordering: i,
                            point: 1,
                            title: null,
                            note: null,
                            cdr: this.f['cdr'].value
                        }

                        this.list_tieuchi_chamdiem.push(tieuchi);
                    }
                }
            } else {
                this.f['point'].setValue(0);
            }
        }
    }

    pointTieuchiKeyup(event, inputPoint_quest) {
        if (event) {
            if (!isNaN(Number(inputPoint_quest.value))) {
                if (parseFloat(this.f['point'].value) > 10) {
                    this.f['point'].setValue(10)
                }

            } else {

            }
        }
    }

    onSelectCDR() {
        if (this.f['activity_cdr'].value) {
            const _cdr_number = this.list_activity_cdr.filter(m => this.f['activity_cdr'].value.includes(m.id)).map(m => parseFloat(m.params.cdr.cdr_info.find(i => i.id === "level_require")['key']));
            this.f['cdr'].setValue(Math.max(..._cdr_number));
            this.onChangeCdrCauhoi();
        }
    }

    addTieuChiCham() {
        const data = {
            ordering: this.list_tieuchi_chamdiem.length + 1,
            point: 1,
            title: null,
            note: null,
            cdr: this.f['cdr'].value
        }

        this.list_tieuchi_chamdiem.push(data);
    }

    deleteTieuChiCham(index) {
        this.list_tieuchi_chamdiem.splice(index, 1);
        this.list_tieuchi_chamdiem.map((m, key) => {
            m.ordering = key + 1;
            return m;
        })
    }

    returnTotalPointTieuChi() {
        if (this.list_tieuchi_chamdiem.length) {
            return this.list_tieuchi_chamdiem.map(m => parseFloat(m.point.toString())).reduce((sum, num) => sum + num, 0);
        }
        return 0;
    }

    onChangeCdrTieuchi(event, item: TIEUCHICHAM) {
        console.log(event)
        item.cdr = event.id;
    }

    onChangeCdrCauhoi() {
        this.list_tieuchi_chamdiem.map(m => {
            m.cdr = this.f['cdr'].value;
            return m;
        })
    }
}
