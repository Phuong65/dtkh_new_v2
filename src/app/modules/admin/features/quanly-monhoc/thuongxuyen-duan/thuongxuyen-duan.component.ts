import { Component, Input, OnInit, QueryList, SimpleChanges, TemplateRef, ViewChild, ViewChildren, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { CoursePlanTuluanCommentService } from '@modules/shared/services/course-plan-tuluan-comment.service';
import { CoursePlanTuluanComment } from '@modules/shared/models/course-plan-tuluan-comment';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin, mergeMap, Observable, of, switchMap, map, firstValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { CHUAN_DAU_RA } from '@modules/shared/utils/syscat';
import { ButtonModule } from 'primeng/button';
import { CoursePlanActivityTuluanTieuchicham } from '@modules/shared/models/course-plan-activity-tuluan-tieuchicham';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AccordionModule } from 'primeng/accordion';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';
import { SplitterModule } from 'primeng/splitter';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { DividerModule } from 'primeng/divider';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';

@Component({
    selector: 'app-thuongxuyen-duan',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        TableModule,
        MultiSelectModule,
        ButtonModule,
        AccordionModule,
        DialogModule,
        MatProgressBarModule,
        PanelModule,
        DropdownModule,
        SplitterModule,
        NgbTooltipModule,
        MatListModule,
        DividerModule,
        LoadMediaOnTextDirective
    ],
    templateUrl: './thuongxuyen-duan.component.html',
    styleUrls: ['./thuongxuyen-duan.component.css']
})
export class ThuongxuyenDuanComponent implements OnInit {
    @Input() activity: CoursePlanActivities;

    @Input() courseSelected: ElnKhoaHoc;

    @ViewChild('templateFormAddTuluanV2') templateFormAddTuluanV2: TemplateRef<any>;

    @ViewChild('templateFormViewTuluan') templateFormViewTuluan: TemplateRef<any>;

    @ViewChild('templateFormAddTieuchicham') templateFormAddTieuchicham: TemplateRef<any>;

    @ViewChild('templatePmsDuan') templatePmsDuan: TemplateRef<any>;

    @ViewChildren('panel_tieuchi') panel_tieuchi: QueryList<any>;

    selectedComment: CoursePlanTuluanComment;

    selectedActivity: CoursePlanActivities;

    list_tuluan: CoursePlanActivityTuluan[];

    selectedTuluan: CoursePlanActivityTuluan;

    formTitle: string;

    formData: FormGroup;

    formTieuchicham: FormGroup;

    list_activity_cdr: CoursePlanActivities[];

    isUpdate: boolean = false;

    select_private = [
        { label: "Private", id: 1 },
        { label: "Public", id: 0 }
    ]

    chuandaura = CHUAN_DAU_RA;

    userId: number;

    activityTieuChiIndex: number = 0;

    list_tieuchi_chamdiem: CoursePlanActivityTuluanTieuchicham[] = [];

    selectedTieuChi: CoursePlanActivityTuluanTieuchicham;

    progressValue: number = 0;

    displayModal: boolean = false;

    waitting_title: string;

    searchDuan: string;

    copyTieuchiDuan: CoursePlanActivityTuluan;

    list_plan_tieu_chi_cham: CoursePlanActivities[];
    constructor(
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private notificationService: NotificationService,
        private formBuilder: FormBuilder,
        private auth: AuthService,
        private coursePlanTuluanCommentService: CoursePlanTuluanCommentService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private helperService: HelperService,
        private coursePlanActivityTuluanTieuchichamService: CoursePlanActivityTuluanTieuchichamService,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone
    ) { }

    ngOnInit(): void {
        this.formData = this.formBuilder.group({
            course_plan_activity_id: [''],
            desc: [''],
            title: ['', Validators.required],
            course_id: [''],
            time_duration: [''],
            cdr: ['', Validators.required],
            point: [''],
            type: [''],
            activity_cdr_ids: ['', Validators.required],
            private: ['']
        });

        this.formTieuchicham = this.formBuilder.group({
            course_id: [''],
            course_plan_activity_tuluan_id: [''],
            course_plan_activity_id: [''],
            title: ['', Validators.required],
            cdr: [''],
            point: ['', Validators.required],
            desc: ['', Validators.required]
        });

        this.userId = this.auth.user.id;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['activity']) {
            this.selectedActivity = this.activity;
            this.loadTuluan();
        }
    }

    get f() {
        return this.formData.controls;
    }

    get fTc() {
        return this.formTieuchicham.controls;
    }

    loadTuluan() {
        const condition: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString() },
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
                    value: this.courseSelected.id.toString(),
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

        const condition_tieuchicham: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.selectedActivity.course_id.toString(), orWhere: "and" },
                { conditionName: "course_plan_activity_id", condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: "and" }
            ],
            set: [
                { label: "limit", value: "-1" },
                { label: "order", value: "ASC" },
                { label: "orderby", value: "ordering" },
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        const condition_plan_0: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: "and" },
                { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: "0", orWhere: "and" },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: "1000", orWhere: "and" },
                { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: "0", orWhere: "and" },
            ],
            set: [
                { label: 'limit', value: '1' }
            ],
            page: null
        }

        const resolvePlanId$ = this.selectedActivity.ordering !== 0
            ? this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan_0).pipe(
                map(course_plan_id => {
                    if (course_plan_id && course_plan_id.recordsFiltered && course_plan_id.data && course_plan_id.data.length) {
                        return course_plan_id.data[0].id.toString();
                    }
                    return null;
                })
            )
            : of(this.selectedActivity.id.toString());

        resolvePlanId$.pipe(
            switchMap(planId => {
                if (planId) {
                    condition.condition.push({ conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: planId, orWhere: "and" });
                }
                return forkJoin([
                    this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition),
                    this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_cdr),
                    this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchicham)
                ]);
            })
        ).subscribe({
            next: ([_tuluan, _cdr, _tieuchicham]) => {
                this.notificationService.isProcessing(false);
                const _re_kyhieu_cdr = _cdr.data.map(m => {
                    m['label'] = m.kyhieu.concat(". ", m.title);
                    m['re_kyhieu'] = parseFloat(m.kyhieu.replace(/\D/g, ""));
                    return m;
                })

                _tuluan.data.forEach(f => {
                    f['hasTieuchi'] = false;
                    f['list_tieuchi'] = [];
                    const _tieuchi__ = _tieuchicham.data.filter(m => m.course_plan_activity_tuluan_id === f.id);
                    if (_tieuchi__.length) {
                        f['hasTieuchi'] = true;
                        f['list_tieuchi'] = _tieuchi__;
                    }
                })

                this.list_activity_cdr = this.helperService.sort(_re_kyhieu_cdr, "re_kyhieu");
                this.list_tuluan = _tuluan.data;
                this.cdr.markForCheck();
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastWarning('Lỗi kết nối, vui lòng thử lại');
                this.cdr.markForCheck();
            }
        });
    }

    formReset() {
        this.formData.reset();
        this.f['course_plan_activity_id'].setValue(this.selectedActivity.id);
        this.f['course_id'].setValue(this.selectedActivity.course_id);
        // this.f['time_duration'].setValue(50);
        this.f['type'].setValue("GROUP_QUESTION_TX");
        this.f['title'].setValue("Dự án ".concat(this.list_tuluan && this.list_tuluan.length ? (this.list_tuluan.length + 1).toString() : '1'));
        this.f['private'].setValue(0);
        this.formTieuchicham.reset();
        this.fTc['course_plan_activity_id'].setValue(this.selectedActivity.id);
        this.fTc['course_id'].setValue(this.selectedActivity.course_id);
        this.fTc['course_plan_activity_tuluan_id'].setValue(this.selectedTuluan ? this.selectedTuluan.id : 0);
        this.fTc['cdr'].setValue(this.selectedTuluan ? this.selectedTuluan.cdr : 0);
        this.fTc['point'].setValue(1);
        this.isUpdate = false;
    }

    createCodeTuluan() {
        this.formTitle = "Thêm dự án mới";
        this.formReset();
        this.notificationService.openSideNavigationMenu({ template: this.templateFormAddTuluanV2, size: 1024, offsetTop: '0px' })
    }

    editCodeTuluan(tuluan: CoursePlanActivityTuluan) {
        this.formTitle = "Sửa dự án: ".concat(tuluan.title);
        this.selectedTuluan = tuluan;
        this.formReset();
        this.f['title'].setValue(tuluan.title);
        this.f['desc'].setValue(tuluan.desc);
        this.f['time_duration'].setValue(tuluan.time_duration);
        this.f['cdr'].setValue(tuluan.cdr);
        this.f['point'].setValue(tuluan.point);
        this.f['activity_cdr_ids'].setValue(tuluan.activity_cdr_ids);
        this.f['private'].setValue(tuluan.private);
        this.isUpdate = true;
        this.notificationService.openSideNavigationMenu({ template: this.templateFormAddTuluanV2, size: 1024, offsetTop: '0px' })
    }

    closeForm() {
        this.notificationService.closeSideNavigationMenu();
    }

    saveCourseTuluan(yeucauduyet: boolean = false) {
        if (this.formData.valid) {
            this.notificationService.isProcessing(true);
            const data = this.formData.getRawValue();

            if (yeucauduyet === true) {
                data['status'] = -2;
            }

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
            } else {
                this.f['point'].setValue(0);
            }
        }
    }

    onSelectCDR() {
        if (this.f['activity_cdr_ids'].value) {
            const _cdr_number = this.list_activity_cdr.filter(m => this.f['activity_cdr_ids'].value.includes(m.id)).map(m => parseFloat(m.params.cdr.cdr_info.find(i => i.id === "level_require")['key']));
            this.f['cdr'].setValue(Math.max(..._cdr_number));
        }
    }

    onViewTuluan(tuluan: CoursePlanActivityTuluan) {
        this.selectedTuluan = tuluan;
        this.loadCommentTuluan();
    }

    loadCommentTuluan() {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: 'and' },
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
            ],
            page: null
        }

        const condition_reply_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: 'and' },
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

        const condition_tieuchicham: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: "and" },
                { conditionName: "course_plan_activity_tuluan_id", condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: "and" },
            ],
            set: [
                { label: "limit", value: "-1" },
                { label: "order", value: "ASC" },
                { label: "orderby", value: "ordering" },
            ],
            page: null
        }

        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: "and" },
                { conditionName: "ordering", condition: OvicQueryCondition.greaterThan, value: '0', orWhere: "and" },
                { conditionName: "parent_id", condition: OvicQueryCondition.notEqual, value: '0', orWhere: "and" },
                { conditionName: "type", condition: OvicQueryCondition.equal, value: 'THUONGXUYEN_DUAN', orWhere: "and" },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        const loadPlan$ = this.selectedActivity.ordering === 0
            ? forkJoin([
                this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
                this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchicham)
            ]).pipe(
                map((_res: any) => {
                    _res[0].data.forEach(f => {
                        f['_tieuchicham'] = _res[1].data.filter(m => m.course_plan_activity_id === f.id);
                    });
                    this.list_plan_tieu_chi_cham = _res[0].data;
                    return null;
                })
            )
            : of(null);

        loadPlan$.pipe(
            switchMap(() => forkJoin([
                this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment),
                this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_reply_comment),
            ]))
        ).subscribe({
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

                this.notificationService.openSideNavigationMenu({ template: this.templateFormViewTuluan, size: window.innerWidth, offsetTop: '0px' });
                this.cdr.markForCheck();
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.cdr.markForCheck();
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
                    if (f.user_id === this.courseSelected.creator_plan_id && this.userId !== f.user_id) {
                        f['display_name'] = this.courseSelected['user_label'];
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
                course_id: this.courseSelected.id,
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

    openAddTieuchicham(tuluan: CoursePlanActivityTuluan) {
        this.formTitle = "".concat(tuluan.title, " - Nhập tiêu chí chấm");
        this.selectedTuluan = tuluan;
        this.activityTieuChiIndex = 0;
        this.notificationService.openSideNavigationMenu({ template: this.templateFormAddTieuchicham, size: window.innerWidth, offsetTop: "0px" });
        this.loadTieuchicham();
    }

    loadTieuchicham() {
        const condition_tieuchicham: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.selectedTuluan.course_id.toString(), orWhere: "and" },
                { conditionName: "course_plan_activity_tuluan_id", condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: "and" },
                { conditionName: "course_plan_activity_id", condition: OvicQueryCondition.equal, value: this.selectedActivity.id.toString(), orWhere: "and" }
            ],
            set: [
                { label: "limit", value: "-1" },
                { label: "order", value: "ASC" },
                { label: "orderby", value: "ordering" }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchicham).subscribe({
            next: (tieuchi_cham) => {
                tieuchi_cham.data.forEach(f => {
                    f['collapsed'] = true;
                })
                this.list_tieuchi_chamdiem = tieuchi_cham.data;


                // if (tieuchi_cham.recordsFiltered) {
                //     this.list_tieuchi_chamdiem = tieuchi_cham.data;
                // } else {
                //     const tieuchis: CoursePlanActivityTuluanTieuchicham[] = [];
                //     for (let i = 1; i <= this.selectedTuluan.point; i++) {
                //         const data: CoursePlanActivityTuluanTieuchicham = {
                //             course_id: this.courseSelected.id,
                //             course_plan_activity_tuluan_id: this.selectedTuluan.id,
                //             course_plan_activity_id: this.selectedActivity.id,
                //             title: '',
                //             cdr: this.selectedTuluan.cdr,
                //             point: 1,
                //             desc: '',
                //             ordering: i
                //         }

                //         tieuchis.push(data);
                //     }

                //     this.list_tieuchi_chamdiem = tieuchis;
                // }

                this.notificationService.isProcessing(false);
            }
        })
    }

    addTieuchicham() {
        this.formTitle = "Thêm tiêu chí chấm";
        this.activityTieuChiIndex = 1;
        this.formReset();
    }

    returnTotalPointTieuChi() {
        if (this.list_tieuchi_chamdiem.length) {
            return this.list_tieuchi_chamdiem.map(m => Number(parseFloat(m.point.toString()).toFixed(2))).reduce((sum, num) => sum + num, 0);
        }
        return 0;
    }

    saveTieuChicham() {
        if (this.formTieuchicham.valid) {
            const data = { ...this.formTieuchicham.getRawValue() };
            this.notificationService.isProcessing(true);
            if (!this.isUpdate) {
                this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data).subscribe({
                    next: () => {
                        this.loadTieuchicham();
                    }
                })
            } else {
                this.coursePlanActivityTuluanTieuchichamService.updateCoursePlanActivityTuluanTieuchicham(this.selectedTieuChi.id, data).subscribe({
                    next: () => {
                        this.activityTieuChiIndex = 0;
                        this.loadTieuchicham();
                    }
                })
            }
        }
    }

    addTieuchiChams(isUpdate: boolean = false) {

        const request: Observable<any>[] = [];

        let point = 10;

        if (!isUpdate) {
            for (let i = 1; i <= point; i++) {
                const data: CoursePlanActivityTuluanTieuchicham = {
                    course_id: this.courseSelected.id,
                    course_plan_activity_tuluan_id: this.selectedTuluan.id,
                    course_plan_activity_id: this.selectedActivity.id,
                    title: '',
                    cdr: this.selectedTuluan.cdr,
                    point: 1,
                    desc: '',
                    ordering: i
                }

                request.push(this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data))
            }
        } else {

            if (this.returnTotalPointTieuChi().toString() !== '10') {
                return this.notificationService.toastWarning("Tổng điểm tiêu chỉ phải bằng " + this.selectedTuluan.point);
            }

            this.list_tieuchi_chamdiem.forEach((f, key) => {
                const data: CoursePlanActivityTuluanTieuchicham = {
                    course_id: f.course_id,
                    course_plan_activity_tuluan_id: f.course_plan_activity_tuluan_id,
                    course_plan_activity_id: f.course_plan_activity_id,
                    title: f.title,
                    cdr: f.cdr,
                    point: f.point,
                    desc: f.desc,
                    ordering: key + 1
                }
                request.push(this.coursePlanActivityTuluanTieuchichamService.updateCoursePlanActivityTuluanTieuchicham(f.id, data))
            })
        }
        this.waitting_title = "Đang tạo tiêu chí chấm, vui lòng chờ";

        this.progressValue = 0;

        this.displayModal = true;
        if (request.length) {
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.notificationService.toastSuccess("Tạo thành công")
                    this.loadTieuchicham();
                },
                error: () => {
                    this.displayModal = false;
                    this.notificationService.toastError("Tạo thất bại, vui lòng thử lại")
                }
            })
        }

    }

    addOneTieuchiChams() {
        const data: CoursePlanActivityTuluanTieuchicham = {
            course_id: this.courseSelected.id,
            course_plan_activity_tuluan_id: this.selectedTuluan.id,
            course_plan_activity_id: this.selectedActivity.id,
            title: '',
            cdr: this.selectedTuluan.cdr,
            point: 1,
            desc: '',
            ordering: this.list_tieuchi_chamdiem && this.list_tieuchi_chamdiem.length ? this.list_tieuchi_chamdiem[this.list_tieuchi_chamdiem.length - 1].ordering + 1 : 1
        }

        this.notificationService.isProcessing(true);

        this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data).subscribe({
            next: () => {
                this.notificationService.toastSuccess("Tạo thành công")
                this.loadTieuchicham();
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Tạo thất bại, vui lòng thử lại")
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

    openHuongdancham(panel, tieuchi: CoursePlanActivityTuluanTieuchicham) {

        tieuchi['collapsed'] = !tieuchi['collapsed'];

        if (this.panel_tieuchi && this.panel_tieuchi.toArray().length) {
            this.panel_tieuchi.toArray().forEach(f => {
                f['animating'] = true;
            })
        }

        if (tieuchi['collapsed'] === false) {
            this.list_tieuchi_chamdiem.filter(m => m.id !== tieuchi.id).map(m => {
                m['collapsed'] = true;
                return m;
            })
        }
    }

    onChangeEditorTieuchi(event, tieuchi: CoursePlanActivityTuluanTieuchicham) {
        tieuchi.desc = event;
    }

    deleteTieuchi(id: number) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.coursePlanActivityTuluanTieuchichamService.deleteCoursePlanActivityTuluanTieuchicham(id).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadTieuchicham();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    pointTieuchiKeyup(event, inputPoint_quest, item: CoursePlanActivityTuluanTieuchicham) {
        if (event) {
            if (!isNaN(Number(inputPoint_quest.value))) {
                if (Number(inputPoint_quest.value) > 1) {
                    item.point = 1
                }
            } else {

            }
        }
    }

    changeSelecDuan(event: MatSelectionListChange) {
        this.copyTieuchiDuan = event.options[0].value;
    }

    openListDuanTuCopyTieuchi(tuluan: CoursePlanActivityTuluan) {
        this.selectedTuluan = tuluan;
        this.list_tuluan.forEach(f => {
            if (f['list_tieuchi'] && f['list_tieuchi'].length && tuluan.id !== f.id) {
                f['hasTieuchi'] = true;
            } else {
                f['hasTieuchi'] = false;
            }
        })
        this.notificationService.openSideNavigationMenu({ template: this.templatePmsDuan, size: 600, offsetTop: '0px' });
    }

    saveTieuchiChamCopy() {
        if (this.copyTieuchiDuan) {
            if (this.copyTieuchiDuan['list_tieuchi'] && this.copyTieuchiDuan['list_tieuchi'].length) {
                const request: Observable<any>[] = [];
                this.displayModal = true;
                this.progressValue = 0;
                this.copyTieuchiDuan['list_tieuchi'].forEach(f => {
                    const data: CoursePlanActivityTuluanTieuchicham = {
                        course_id: f.course_id,
                        course_plan_activity_tuluan_id: this.selectedTuluan.id,
                        course_plan_activity_id: f.course_plan_activity_id,
                        title: f.title,
                        cdr: f.cdr,
                        point: f.point,
                        desc: f.desc,
                        ordering: f.ordering,
                    }
                    request.push(this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data));
                })

                this.loopAddForm(request, 0).subscribe({
                    next: () => {
                        this.displayModal = false;
                        this.notificationService.toastSuccess("Sao chép thành công");
                        this.closeForm();
                        this.loadTuluan();
                    },
                    error: () => {
                        this.notificationService.toastSuccess("Sao chép thất bại, vui lòng thử lại");
                    }
                })
            }
        } else {
            this.notificationService.toastWarning("Vui lòng chọn dự án");
        }
    }
}
