import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivityTuluanService } from './../../../../shared/services/course-plan-activity-tuluan.service';
import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { DonVi } from '@modules/shared/models/don-vi';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { SharedModule } from '@modules/shared/shared.module';
import { CHUAN_DAU_RA, ROLES } from '@modules/shared/utils/syscat';
import { NgbModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { forkJoin, mergeMap, of } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { DividerModule } from 'primeng/divider';
import { CoursePlanTuluanComment } from '@modules/shared/models/course-plan-tuluan-comment';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { CoursePlanTuluanCommentService } from '@modules/shared/services/course-plan-tuluan-comment.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { InputQuestionDirectionComponent } from '../../cauhoi-tracnghiem/input-question-direction/input-question-direction.component';

@Component({
    selector: 'app-sinhde-thuchanh',
    standalone: true,
    imports: [
        MultiSelectModule,
        CommonModule,
        SharedModule,
        MatListModule,
        PaginatorModule,
        NgbTooltipModule,
        MatTabsModule,
        FormsModule,
        NgbModule,
        ReactiveFormsModule,
        InputQuestionDirectionComponent,
        DividerModule,
        TableModule
    ],
    templateUrl: './sinhde-thuchanh.component.html',
    styleUrls: ['./sinhde-thuchanh.component.css']
})
export class SinhdeThuchanhComponent implements OnInit {
    countChanges = 0;

    @ViewChild('paginator', { static: true }) paginator: Paginator;

    @ViewChild('paginator_q', { static: true }) paginator_q: Paginator;

    @ViewChild('templateQuestion') templateQuestion: TemplateRef<any>;

    list_typeQuestion_practice = [
        { id: 1, label: 'Câu hỏi', key: 'QUESTION' },
        { id: 2, label: 'Đề', key: 'GROUP_QUESTION' },
    ]

    formData: FormGroup;

    chuandaura = CHUAN_DAU_RA;

    closeLeft: boolean = false;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    courseSelected: ElnKhoaHoc;

    dmKhoahoc: ElnKhoaHoc[];

    totalCourse: number = 0;

    limitCourse: number = 20;

    list_donvi_chuyenmon: DonVi[];

    categoryFilter: number;

    searchCourse: string;

    userId: number;

    donviId: number;

    user_profile: ElngUserProfile;

    my_course: boolean = false;

    indexTap = 0;

    type_question: any;

    formTitle: string = '';

    list_tuluan: CoursePlanActivityTuluan[];

    selectedTuluan: CoursePlanActivityTuluan;

    list_question = [
        { id: 1, label: 'Câu 1' },
        { id: 2, label: 'Câu 2' }
    ]

    isUpdate: boolean = false;

    ckEditor = {
        editor1: null,
        editor2: null
    };

    limit_tuluan: number = 20;

    total_tuluan: number = 0;

    list_unprivate_tuluan: CoursePlanActivityTuluan[];

    selectedComment: CoursePlanTuluanComment;

    pageIndex: number;

    selectTuluanForDownload: CoursePlanActivityTuluan[];

    constructor(
        private helperService: HelperService,
        private modalService: NgbModal,
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private auth: AuthService,
        private fileService: FileService,
        private noitifi: NotificationService,
        private configsService: ConfigsService,
        private ovicDateTimeService: OvicDateTimeService,
        private elngUserProfileService: ElngUserProfileService,
        private donViService: DonViService,
        private formBuilder: FormBuilder,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private coursePlanTuluanCommentService: CoursePlanTuluanCommentService
    ) {

        this.formData = this.formBuilder.group({
            desc: ['', Validators.required],
            title: [''],
            course_id: [''],
            time_duration: [''],
            type: [''],
            point: [''],
            private: [''],
            ordering: [''],
            note: [''],
            tuluan_id: [''],
        });

        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
    }

    get f() {
        return this.formData.controls;
    }

    ngOnInit(): void {
        this.noitifi.isProcessing(true);
        const condition_profile: ConditionOption = {
            condition: [
                {
                    conditionName: 'user_id',
                    condition: OvicQueryCondition.equal,
                    value: this.userId.toString(),
                },
            ],
            set: [],
            page: null,
        };

        const condition_donvi: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.donvi_id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.greaterThan,
                    value: '0',
                    orWhere: 'and',
                },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'title' }
            ],

            page: null,
        };



        forkJoin([
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_profile),
            this.donViService.getDonviByPageNew(condition_donvi),
        ]).subscribe({
            next: ([_userProfile, _donvi]) => {

                this.list_donvi_chuyenmon = _donvi.data;

                if (_userProfile.recordsFiltered) {
                    this.user_profile = _userProfile.data[0];
                    if (!this.isManager)
                        this.categoryFilter = this.user_profile.donvi_chuyenmon_id;
                }

                this.noitifi.isProcessing(false);

                this.loadPageData_course(1);
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
            },
        });
    }

    resetForm() {
        this.formData.reset();
        this.isUpdate = false;
        this.f['ordering'].setValue(1);
        this.f['course_id'].setValue(this.courseSelected.id);
        this.f['type'].setValue(this.type_question.key);
        this.f['private'].setValue(1);
        this.f['desc'].setValue('');
        this.f['note'].setValue('');

        if (this.ckEditor.editor1) {
            this.ckEditor.editor1.data.set('');
            // this.ckEditor.editor1 = null;
        }

        if (this.ckEditor.editor2) {
            this.ckEditor.editor2.data.set('');
            // this.ckEditor.editor2 = null;
        }
    }

    ckEditorSetup(ckEditor, name) {
        this.ckEditor[name] = ckEditor;
    }

    loadPageData_course(page: number) {
        this.dmKhoahoc = [];
        const condition_course: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and', },
                { conditionName: 'params', condition: OvicQueryCondition.like, value: '%THUCHANH%', orWhere: 'and', },

            ],
            set: [{ label: 'orderby', value: 'title' }, { label: 'limit', value: this.limitCourse.toString() }],
            page: page.toString()
        }

        if (this.categoryFilter && (this.isLanhDaoBomon || this.isLanhDaoKhoa || this.isManager)) {
            condition_course.condition.push({ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.categoryFilter.toString(), orWhere: 'and' });
        }

        if (this.isLanhDaoBomon && this.user_profile && !this.isLanhDaoKhoa && !this.isManager) {
            condition_course.condition.push({ conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.user_profile.bomon_id.toString(), orWhere: 'and' });
        }

        if (!this.isLanhDaoBomon && this.user_profile && !this.isLanhDaoKhoa && !this.isManager) {
            this.my_course = true;
        }

        if (this.my_course) {
            condition_course.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.user_profile.user_id.toString(), orWhere: 'and' });
        }

        if (this.searchCourse) {
            condition_course.condition.push({ conditionName: 'title', condition: OvicQueryCondition.like, value: '%' + this.searchCourse.toString() + '%', orWhere: 'and' });
        }

        this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course).pipe(mergeMap((_course_ => {

            const _course_ids = [];

            _course_.data.forEach(f => {
                _course_ids.push(f.id);

            })


            if (_course_ids.length) {
                const condition_tuluan: ConditionOption = {

                    condition: [
                        { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: _course_ids.toString() },
                        { label: 'include_by', value: 'course_id' },
                        { label: 'select', value: 'course_id,status,type' }
                    ],
                    page: null
                }

                return this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan).pipe(mergeMap(_tuluan => {
                    _course_.data.forEach(f => {
                        const gray = _tuluan.data.filter(m => (m.status === 0 || m.status === -2) && f.id === m.course_id).length;
                        const red = _tuluan.data.filter(m => m.status === -1 && f.id === m.course_id).length;
                        const blue = _tuluan.data.filter(m => m.status === 1 && f.id === m.course_id).length;
                        f['status_question'] = '(<span class="gray">'.concat(gray.toString(), '</span> + <span class="red">', red.toString(), '</span> + <span class="blue">', blue.toString(), '</span> = ', (gray + red + blue).toString(), ')')
                        f['QUESTION'] = _tuluan.data.filter(m => m.course_id === f.id && m.type === 'QUESTION').length;
                        f['GROUP_QUESTION'] = _tuluan.data.filter(m => m.course_id === f.id && m.type === 'GROUP_QUESTION').length;
                    })
                    return of(_course_);
                }))
            }

            return of(_course_);
        }))).subscribe({
            next: (_course) => {
                this.totalCourse = _course.recordsFiltered;
                if (_course.data && _course.data.length) {

                    let teacher_ids = [0];

                    _course.data.forEach((f, key) => {
                        teacher_ids.push(f.creator_plan_id);
                        if (f.params) {
                            if (f.params.sotinchi) {
                                f['sotinchi'] = f.params.sotinchi;
                            }

                            if (f.params.exam_format) {

                                const index = EXAMFORMAT.findIndex((m) => m.key === f.params.exam_format);
                                if (index !== -1) {
                                    f['hinhthucthi'] = EXAMFORMAT[index].label;
                                }
                            }

                            if (f.params.cdr) {
                                const index = CHUAN_DAU_RA.findIndex((m) => m.id === f.params.cdr);
                                if (index !== -1) {
                                    f['chuandaura'] = CHUAN_DAU_RA[index].label;
                                }
                            }
                        }
                    });


                    const condition_teacher: ConditionOption = {
                        condition: [],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: [...new Set(teacher_ids)].toString() },
                            { label: 'include_by', value: 'id' },
                        ],
                        page: null,
                    };

                    this.userService.getUserByPageNew(condition_teacher).subscribe({
                        next: (_user) => {
                            this.dmKhoahoc.forEach((f) => {
                                const index_creator = _user.data.findIndex((m) => m.id === f.creator_plan_id);

                                f['creator_name'] = 'Chưa có giảng viên';

                                f['display_name'] = 'Chưa có giảng viên';

                                if (index_creator !== -1) {
                                    f['creator_name'] = ''.concat(_user.data[index_creator].display_name);
                                    f['display_name'] = _user.data[index_creator].display_name;
                                }

                                f['info_'] = '';

                                if (f.params) {
                                    const sotinchi = f.params.sotinchi ? f.params.sotinchi : 0;
                                    const sotinchi_th = f.params['sotinchi_th'] ? f.params['sotinchi_th'] : 0;
                                    const index_m = EXAMFORMAT.findIndex((m) => m.key === f.params.exam_format);
                                    let exam = 'Chưa có thông tin';

                                    if (index_m !== -1) {
                                        exam = EXAMFORMAT[index_m].label;
                                    }

                                    f['info_'] = ' - TC: ' + sotinchi.toString().concat('-', sotinchi_th.toString(), ' - ', exam);
                                }
                            });
                        },

                        error: () => { },
                    });

                    this.dmKhoahoc = _course.data;

                    if (this.dmKhoahoc && this.dmKhoahoc.length) {
                        this.courseSelected = this.dmKhoahoc[0];

                        this.onSelectTap(this.type_question ? this.type_question : this.list_typeQuestion_practice[0], this.indexTap);
                    }

                }
                this.noitifi.isProcessing(false);
            },

            error: () => {
                this.noitifi.isProcessing(false);
            }
        })

    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    onSelectCourse(event: MatSelectionListChange) {
        this.courseSelected = event.options[0].value;
        this.onSelectTap(this.list_typeQuestion_practice[0], 0);
    }

    changePage(event) {
        this.loadPageData_course(event.page + 1);
    }

    onChangeFilterChuyenmon(event) {
        if (event) {
            this.categoryFilter = event.id;
        } else {
            this.categoryFilter = null;
        }
        this.onSearchByTitle();
    }

    onSearchByTitle() {
        if (!this.paginator.empty()) {
            this.paginator.changePage(0);
        } else {
            this.loadPageData_course(1);
        }
    }

    changeToMyCourse() {
        this.my_course = !this.my_course;
        this.onSearchByTitle();
    }

    onSelectTap(lvl, index: number) {
        this.indexTap = index;
        this.type_question = lvl;
        this.loadTuLuan(1);
    }

    loadTuLuan(page: number) {
        const conditiion_tuluan: ConditionOption = {
            condition: [
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                // { conditionName: 'type', condition: OvicQueryCondition.equal, value: this.type_question.key, orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        this.noitifi.isProcessing(true);

        const condition_tuluan_unprivate: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,course_plan_activity_id,title,desc' }
            ],
            page: null
        }

        const condition_kynang: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'THUONGXUYEN_TULUAN', orWhere: 'and' },
                { conditionName: 'ordering', condition: OvicQueryCondition.notEqual, value: '1', orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }


        forkJoin([
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(conditiion_tuluan),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_kynang).pipe(mergeMap(_kynangthuchanh => {
                const kynang_ids = [];
                _kynangthuchanh.data.forEach(f => {
                    if (f.ordering !== 1) {
                        kynang_ids.push(f.id);
                    }
                })

                if (kynang_ids.length) {
                    condition_tuluan_unprivate.set.push({ label: 'include', value: kynang_ids.toString() });
                    condition_tuluan_unprivate.set.push({ label: 'include_by', value: 'course_plan_activity_id' });
                    return this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan_unprivate).pipe(mergeMap(_tuluan_unprivate => {
                        _tuluan_unprivate.data.forEach(f => {

                            const index = _kynangthuchanh.data.findIndex(m => m.id === f.course_plan_activity_id);
                            if (index !== -1) {
                                f['label'] = f.title.concat(' - ', _kynangthuchanh.data[index].title);
                                f['show_label'] = _kynangthuchanh.data[index].title.concat(': ', f['label']);
                            }
                        })
                        this.list_unprivate_tuluan = _tuluan_unprivate.data;
                        return of({ _kynangthuchanh: _kynangthuchanh, _tuluan_unprivate: _tuluan_unprivate });
                    }))
                }

                return of({ _kynangthuchanh: _kynangthuchanh, _tuluan_unprivate: null });
            }))
        ]).subscribe({
            next: ([_tuluan, _kynang_and_tuluan]) => {
                this.total_tuluan = _tuluan.recordsFiltered;
                this.noitifi.isProcessing(false);
                const question = _tuluan.data.filter(m => m.type === 'QUESTION');
                const group_question = _tuluan.data.filter(m => m.type === 'GROUP_QUESTION');
                if (question.length) {
                    const question_1 = question.filter(m => m.ordering === 1);
                    const question_2 = question.filter(m => m.ordering === 2);
                    const new_topic: CoursePlanActivityTuluan[] = [];
                    let i = 0;
                    question_1.forEach(q1 => {
                        question_2.forEach(q2 => {
                            i = i + 1;
                            const tuluan_mer: CoursePlanActivityTuluan = {
                                course_plan_activity_id: q1.course_plan_activity_id,
                                desc: '',
                                files: [],
                                ordering: i,
                                title: 'Đề số '.concat(i.toString()),
                                status: 1,
                                approved_at: '',
                                approved_by: 0,
                                course_id: this.courseSelected.id,
                                time_duration: 0
                            }
                        })
                    })
                }

                _tuluan.data.forEach(f => {
                    f['extend'] = true;
                    if (f.tuluan_id && _kynang_and_tuluan['_tuluan_unprivate']) {
                        const ids = f.tuluan_id.toString().split(',')
                        const data = this.list_unprivate_tuluan.filter(m => ids.findIndex(i => i.toString() === m.id.toString()) !== -1);
                        if (data && data.length) {
                            let titles = [];
                            data.forEach(f => {
                                titles.push(f['label']);
                            })
                            f['tuluan_in_name'] = titles;
                        }
                    }
                })

                this.list_tuluan = _tuluan.data;


            },

            error: () => {
                this.noitifi.isProcessing(false);
            }
        })
    }

    onOpenAddQuestion(lvl, index: number) {
        this.type_question = lvl;
        this.formTitle = "Thêm ".concat(this.type_question.label);
        this.indexTap = index;
        this.resetForm();
        this.loadTuLuan(1);
        this.noitifi.openSideNavigationMenu({ template: this.templateQuestion, size: 800, offsetTop: '0px' });
    }

    closeSideMenu() {
        // this.ckEditor.editor1 = null;
        // this.ckEditor.editor2 = null;
        this.noitifi.closeSideNavigationMenu();
    }

    saveCourseTuluan(b?: boolean) {
        if (this.formData.valid) {
            switch (this.type_question.key) {
                case 'QUESTION':
                    if (!this.f['point'].value && this.f['point'].value !== 0) {
                        return this.noitifi.toastWarning("Vui lòng nhập điểm");
                    }
                    break;
                case 'GROUP_QUESTION':

                    if (!this.f['time_duration'].value) {
                        return this.noitifi.toastWarning("Vui lòng nhập thời gian làm bài");
                    }

                    if (!this.f['title'].value) {
                        return this.noitifi.toastWarning("Vui lòng nhập tiêu đề");
                    }

                    break;
                default:
                    break;
            }

            this.noitifi.isProcessing(true);

            if (this.isUpdate) {
                const data = { ...this.formData.getRawValue() };

                if (b === true) {
                    data['status'] = -2;
                }

                const note = data.note ? data.note.replace(/<(.*?)>/gi, '') : null;
                if (!note || note === '') {
                    data.note = null;
                }

                const desc = data.desc ? data.desc.replace(/<(.*?)>/gi, '') : null;

                if (!desc || desc === '') {
                    data.desc = '';
                }

                this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(this.selectedTuluan.id, data).subscribe({
                    next: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Sửa thành công");
                        this.resetForm();
                        this.closeSideMenu();
                        this.loadTuLuan(this.pageIndex);
                    },
                    error: () => {
                        this.noitifi.toastError("Sửa thất bại");
                        this.noitifi.isProcessing(false)
                    }
                })
            } else {
                this.coursePlanActivityTuluanService.addCoursePlanActivityTuluan(this.formData.value).subscribe({
                    next: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Thêm thành công");
                        this.resetForm();
                        this.resetPageTuluan(1);
                    },
                    error: () => {
                        this.noitifi.toastError("Thêm thất bại");
                        this.noitifi.isProcessing(false)
                    }
                })
            }
        } else {
            this.noitifi.toastSuccess("Vui lòng nhập nội dung");
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
            } else {
                this.f['point'].setValue(0);
            }
        }
    }

    changePageQuestion(event) {
        this.pageIndex = event.page + 1;
        // this.loadTuLuan( event.page + 1 );
    }

    resetPageTuluan(page_order: number) {
        if (this.paginator_q) {
            if (!this.paginator_q.empty()) {
                this.paginator_q.changePage(page_order - 1);
            } else {
                this.loadPageData_course(1);
            }
        } else {
            this.loadPageData_course(1);
        }
    }

    editQuestion(quest: CoursePlanActivityTuluan) {
        this.resetForm();
        this.isUpdate = true;
        this.formTitle = "Sửa ".concat(this.type_question.label);
        this.selectedTuluan = quest;

        this.f['title'].setValue(quest.title);
        this.f['time_duration'].setValue(quest.time_duration);
        this.f['point'].setValue(quest.point);
        this.f['ordering'].setValue(quest.ordering);
        this.f['desc'].setValue(quest.desc);
        this.f['note'].setValue(quest.note);
        this.f['tuluan_id'].setValue(quest.type === 'GROUP_QUESTION' ? quest.tuluan_id : Number(quest.tuluan_id));

        if (this.ckEditor.editor1) {
            this.ckEditor.editor1.data.set(quest.desc);
        }

        if (this.ckEditor.editor2) {
            this.ckEditor.editor2.data.set(quest.note);
        }

        this.noitifi.openSideNavigationMenu({ template: this.templateQuestion, size: 800, offsetTop: '0px' });
    }

    deleteQuestion(quest: CoursePlanActivityTuluan) {
        this.noitifi.confirmDelete().then(a => {
            if (a) {
                this.noitifi.isProcessing(true);
                this.coursePlanActivityTuluanService.deleteCoursePlanActivityTuluan(quest.id).subscribe({
                    next: () => {
                        this.resetPageTuluan(this.pageIndex);
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Xoá thành công");
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess("Xoá thất bại");
                    }
                })
            }
        })
    }

    extendQuestion(quest: CoursePlanActivityTuluan) {
        quest['extend'] = !quest['extend'];
    }

    startCopyDesc(event) {
        event.preventDefault();
        const ids = this.f['tuluan_id'].value.toString().split(',')
        const data = this.list_unprivate_tuluan.filter(m => ids.findIndex(i => i.toString() === m.id.toString()) !== -1);
        if (data && data.length) {

            let desc = '';

            data.forEach(f => {
                desc = desc.concat(f.desc);
            })

            this.f['desc'].setValue(desc);

            if (this.ckEditor.editor1) {
                this.ckEditor.editor1.data.set(desc)
            }
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
                this.noitifi.toastError('Lỗi kết nôi, vui lòng thử lại');
            }
        })
    }


    saveCommentReply(comment: CoursePlanTuluanComment, question: CoursePlanActivityTuluan, index_comment: number) {
        const comment_content = comment['textarea_comment'] ? comment['textarea_comment'].trim() : comment['textarea_comment'].trim();

        if (comment_content && comment_content !== '') {
            const data_comment: CoursePlanTuluanComment = {
                course_plan_activity_id: 0,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.courseSelected.id,
                parent_id: comment.id,
                course_plan_activity_tuluan_id: question.id
            }

            this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data_comment).subscribe({
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


    yeucauduyet(question: CoursePlanActivityTuluan) {
        this.noitifi.confirm('<div class="alert-duyetnoidung">' +
            '<span>- Bạn đang thực hiện thao tác yêu cầu duyệt nội dung giảng dạy</span>' +
            '<span>- Thao tác này không thể hoàn tác</span>' +
            '<span>- Bạn có chắc chắn yêu cầu duyệt nội dung giảng dạy này?</span>' +
            '</div>', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then(a => {
                if (a.name === 'yes') {
                    this.noitifi.isProcessing(true);
                    this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(question.id, { status: -2 }).subscribe({
                        next: () => {
                            question['status'] = 0;
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

    returnToOrderPage(page_order: number) {
        if (this.paginator) {
            if (!this.paginator.empty()) {
                this.paginator.changePage(page_order - 1);
            } else {
                this.loadPageData_course(1);
            }
        } else {
            this.loadPageData_course(1);
        }
    }

}
