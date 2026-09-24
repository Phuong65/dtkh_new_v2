import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { AuthService } from '@core/services/auth.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { GeneralModule } from '@modules/kiem-thu-ngan-hang-cau-hoi/general/general.module';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ParticipantRolesTypeOption, Survey, SurveyGroupInfo, SurveyState } from '@modules/shared/models/survey';
import { DisplayPositionOption, IsPublicOption, SchoolYearOption, SemesterOption, StatusOption, SurveyAuthMethodOption, SurveyPlan, SurveyPlanTypeOption } from '@modules/shared/models/survey-plan';
import { SharedModule } from '@modules/shared/shared.module';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { SurveyService } from '@modules/shared/services/survey.service';
import { SurveyPlanService } from '@modules/shared/services/survey-plan.service';
import { SurveyQuestionAnswerService } from '@modules/shared/services/survey-question-answer.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { Dto } from '@core/models/dto';

@Component({
  selector: 'app-survey-plan-setting',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    CalendarModule,
    DropdownModule,
    NgbTooltipModule,
    RouterModule,
    MultiSelectModule,
    TooltipModule,
    SidebarModule,
    MatMenuModule,
    MatButtonModule,
    GeneralModule,
    MatExpansionModule,
    CheckboxModule
  ],
  templateUrl: './survey-plan-setting.component.html',
  styleUrls: ['./survey-plan-setting.component.css']
})
export class SurveyPlanSettingComponent implements OnInit {
  constructor(
    private noitifi: NotificationService,
    private surveysPlanService: SurveyPlanService,
    private surveysService: SurveyService,
    public formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private elnKhoaHocService: ElnKhoaHocService,
    private classesService: ClassesService,
    private surveyQuestionAnswerService: SurveyQuestionAnswerService,
    private httpHelper: HttpParamsHeplerService,
    private oauth: AuthService,
    private donViService: DonViService,
    private userProfileService: ElngUserProfileService,
    private router: Router
  ) {
    this.formSurvey = this.formBuilder.group({
      id: [''],
      school_year: ['', Validators.required],
      semester: ['', Validators.required],
      display_position: [''],
      type: ['', Validators.required],
      auth_method: ['', Validators.required],
      access_link: [''],
      survey_id: [0, Validators.required],
      course_ids: [[]],
      participant_roles: [''],
      random_question: [0],
      dothoc: [null]
    });
  }

  state: SurveyState = 'LOADING';

  isLanhDaoKhoaContext: boolean = false;

  isLock: boolean = false;

  isViewCourse: boolean = false;

  surveyPlan: SurveyPlan;

  participantRolesTypeOption = ParticipantRolesTypeOption;

  displayPositionOption = DisplayPositionOption;

  isPublicOption = IsPublicOption;

  statusOption = StatusOption;

  surveyAuthMethodOption = SurveyAuthMethodOption;

  surveyPlanTypeOption = SurveyPlanTypeOption;

  schoolYearOption = SchoolYearOption;

  semesterOption = SemesterOption;

  formSurvey: FormGroup;

  idPlanSurvey: string = '';

  listCourse: ElnKhoaHoc[] = [];

  listCourseAll: ElnKhoaHoc[] = [];

  listCourseSelect: ElnKhoaHoc[] = [];

  listSurvey: Survey[] = [];

  listClasses: Classes[] = [];

  dmDonvi: DonVi[] = [];

  listKhoaHoc: any[] = [];

  listDot: any[] = [{ label: 'Tất cả', value: '' }];

  selectedDot: string | number = '';

  selectedKhoaHoc: string[] = [];

  listKhoaDonVi: any[] = [];

  selectedKhoaDonVi: number[] = [];

  selectedClassIds: number[] = [];

  surveyGroupInfo: SurveyGroupInfo[] = [];

  groupRandomMap: { [id: string]: number } = {};

  condition_monhoc: ConditionOption = {
    condition: [
      { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'or' }
    ],
    set: [
      { label: 'orderby', value: 'title' },
      { label: 'order', value: 'ASC' },
      { label: 'limit', value: '-1' },
      { label: 'select', value: 'id,title,maso,slug,category_ids' },
      { label: 'include_by', value: 'id' }
    ],
    page: '1'
  };

  ngOnInit(): void {
    this.idPlanSurvey = this.route.snapshot.queryParamMap.get('code');
    this.isLanhDaoKhoaContext = this.router.url.startsWith('/admin/lanhdao-khoa/');
    this.loadDotOptions();
    this.loadKhoaHoc();
    this.loadKhoa(() => this.initData());
  }

  loadDotOptions(): void {
    const condition: ConditionOption = {
      condition: [],
      page: '1',
      set: [
        { label: 'limit', value: '-1' },
        { label: 'groupby', value: 'dothoc' },
        { label: 'select', value: 'dothoc' },
        { label: 'orderby', value: 'dothoc' },
        { label: 'order', value: 'ASC' }
      ]
    };
    this.classesService.getClassesByPageNew(condition).subscribe({
      next: (res) => {
        const dots = res.data
          .map(item => item.dothoc)
          .filter((v): v is number => v != null)
          .filter((v, i, a) => a.indexOf(v) === i)
          .map(v => ({ label: String(v), value: v }));
        this.listDot = [{ label: 'Tất cả', value: '' }, ...dots];
      }
    });
  }

  private dotCondition(): OvicConditionParam | null {
    if (this.selectedDot === '' || this.selectedDot == null) return null;
    return { conditionName: 'dothoc', condition: OvicQueryCondition.equal, value: String(this.selectedDot), orWhere: 'and' };
  }

  loadKhoaHoc(): void {
    // Khóa học: load từ classes theo năm học/học kì (groupby khoa)
    const namhoc = this.formControl['school_year'].value;
    const hocky = this.formControl['semester'].value;
    if (!namhoc || !hocky) return;
    const condition: ConditionOption = {
      condition: [
        { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: namhoc, orWhere: 'and' },
        { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: hocky, orWhere: 'and' },
        ...(this.dotCondition() ? [this.dotCondition()] : [])
      ],
      page: '1',
      set: [
        { label: 'limit', value: '-1' },
        { label: 'groupby', value: 'khoa' }
      ]
    };
    this.classesService.getClassesByPageNew(condition).subscribe({
      next: (res) => {
        this.listKhoaHoc = res.data
          .filter(item => item.khoa)
          .map(item => ({ label: item.khoa, value: item.khoa }))
          .filter((v, i, a) => a.findIndex(t => t.value === v.value) === i);
      }
    });
  }

  loadKhoa(onLoaded?: () => void): void {
    // Khoa: load từ đơn vị con của đơn vị của user (giống donvi.loadData)
    const donviId = this.oauth.user.donvi_id;
    const condition_donvi = this.httpHelper.paramsConditionBuilder(
      [
        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: donviId.toString(), orWhere: 'and' },
      ]
    ).set('limit', '-1').set('order', 'ASC').set('orderby', 'title');

    forkJoin({
      khoa: this.donViService.getDonViByCols(condition_donvi),
      profiles: this.isLanhDaoKhoaContext
        ? this.userProfileService.getElngUserProfileByCol('user_id', this.oauth.user.id.toString())
        : of([])
    }).subscribe({
      next: ({ khoa, profiles }) => {
        this.dmDonvi = khoa;
        if (this.isLanhDaoKhoaContext) {
          const khoaId = profiles[0]?.donvi_chuyenmon_id;
          const currentKhoa = khoa.find(item => item.id === khoaId);
          if (!currentKhoa) {
            this.listKhoaDonVi = [];
            this.selectedKhoaDonVi = [];
            this.noitifi.toastInfo('Thầy/Cô chưa được phân vào khoa trong hệ thống');
          } else {
            this.listKhoaDonVi = [{ label: currentKhoa.title, value: currentKhoa.id }];
            this.selectedKhoaDonVi = [currentKhoa.id];
          }
        } else {
          this.listKhoaDonVi = [
            { label: 'Tất cả', value: 0 },
            ...khoa.map(item => ({ label: item.title, value: item.id }))
          ];
          this.selectedKhoaDonVi = [0];
        }
        onLoaded?.();
      },
      error: () => {
        this.listKhoaDonVi = [];
        this.selectedKhoaDonVi = [];
        this.noitifi.toastError('Không load được danh mục khoa');
        onLoaded?.();
      }
    });
  }

  onChangeKhoaHoc(event: any): void {
    this.selectedKhoaHoc = event.value;
    this.loadClassAndCourse();
  }

  onChangeKhoaDonVi(event: any): void {
    let values: number[] = event.value || [];
    if (this.isLanhDaoKhoaContext && values.length === 0) {
      this.selectedKhoaDonVi = [];
      this.listCourse = [];
      this.listCourseSelect = [];
      this.formSurvey.patchValue({ course_ids: [] });
      return;
    }
    if (values.includes(0) && values.length > 1) {
      values = event.itemValue === 0 ? [0] : values.filter(id => id !== 0);
    }
    this.selectedKhoaDonVi = values.length ? values : [0];

    if (this.selectedKhoaDonVi.includes(0)) {
      this.listCourse = [...this.listCourseAll];
    } else {
      this.listCourse = this.listCourseAll.filter(course => {
        const rawCategoryIds: any = course.category_ids;
        let categoryIds: number[] = [];
        if (Array.isArray(rawCategoryIds)) {
          categoryIds = rawCategoryIds.map(Number);
        } else if (rawCategoryIds != null && rawCategoryIds !== '') {
          try {
            const parsed = JSON.parse(String(rawCategoryIds));
            categoryIds = (Array.isArray(parsed) ? parsed : [parsed]).map(Number);
          } catch {
            categoryIds = String(rawCategoryIds).split(',').map(Number);
          }
        }
        return categoryIds.some(id => this.selectedKhoaDonVi.includes(id));
      });
    }

    const validCourseIds = this.listCourse.map(course => course.id);
    const selectedCourseIds: number[] = (this.formControl['course_ids'].value || [])
      .filter((id: number) => validCourseIds.includes(id));
    this.formSurvey.patchValue({ course_ids: selectedCourseIds });
    this.listCourseSelect = this.listCourse.filter(course => selectedCourseIds.includes(course.id));
  }

  loadClassAndCourse(): void {
    const namhoc = this.formControl['school_year'].value;
    const hocky = this.formControl['semester'].value;
    if (!namhoc || !hocky || this.selectedKhoaHoc.length === 0) {
      this.listClasses = [];
      this.listCourse = [];
      this.listCourseSelect = [];
      this.formSurvey.patchValue({ course_ids: [] });
      return;
    }
    this.noitifi.isProcessing(true);
    const condition_classes: ConditionOption = {
      condition: [
        { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: namhoc, orWhere: 'and' },
        { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: hocky, orWhere: 'and' },
        ...(this.dotCondition() ? [this.dotCondition()] : [])

      ],
      page: '1',
      set: [{ label: 'limit', value: '-1' },
      { label: 'include', value: this.selectedKhoaHoc.join(',') },
      { label: 'include_by', value: 'khoa' }
      ]
    };
    const condition_monhoc1: ConditionOption = JSON.parse(JSON.stringify(this.condition_monhoc));
    this.classesService.getClassesByPageNew(condition_classes).pipe(
      switchMap(classesRes => {
        this.listClasses = classesRes.data;
        const course_ids = [...new Set(classesRes.data.map(item => item.course_id))].join(',');
        condition_monhoc1.set.push({ label: 'include', value: course_ids || '-1' });
        return this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_monhoc1);
      })
    ).subscribe({
      next: (res) => {
        this.listCourseAll = res.data;
        this.listCourse = [...this.listCourseAll];
        if (this.selectedKhoaDonVi.length && !this.selectedKhoaDonVi.includes(0)) {
          this.onChangeKhoaDonVi({ value: this.selectedKhoaDonVi });
        }
        this.listCourseSelect = [];
        this.formSurvey.patchValue({ course_ids: [] });
        this.noitifi.isProcessing(false);
      },
      error: () => {
        this.noitifi.toastError('Lỗi kết nối');
        this.noitifi.isProcessing(false);
      }
    });
  }

  initData(): void {
    this.noitifi.isProcessing(true);
    this.state = 'LOADING';
    const condition_monhoc1: ConditionOption = JSON.parse(JSON.stringify(this.condition_monhoc));

    this.surveysPlanService.loadData1(this.idPlanSurvey).pipe(
      switchMap(res => {
        this.surveyPlan = res.data;
        const classIds = Array.isArray(this.surveyPlan.class_ids) && this.surveyPlan.class_ids.length
          ? this.surveyPlan.class_ids.join(',')
          : '';

        const condition_classes: ConditionOption = {
          condition: [
            {
              conditionName: 'namhoc', condition: OvicQueryCondition.equal,
              value: this.surveyPlan.school_year, orWhere: 'and'
            },
            { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: this.surveyPlan.semester?.toString(), orWhere: 'and' },
            ...(this.dotCondition() ? [this.dotCondition()] : [])
          ],
          page: '1',
          set: [
            { label: 'limit', value: '-1' },
            ...(classIds ? [{ label: 'include', value: classIds }, { label: 'include_by', value: 'id' }] : [])
          ]
        };

        const classes$ = this.surveyPlan.school_year
          ? this.classesService.getClassesByPageNew(condition_classes)
          : of({ data: [], recordsFiltered: 0 });

        return classes$.pipe(
          switchMap(classesRes => {
            if (this.surveyPlan.school_year) {
              const course_ids = [...new Set(classesRes.data.map(item => item.course_id))].join(',');
              this.listClasses = classesRes.data;
              condition_monhoc1.set.push({ label: 'include', value: course_ids || '-1' });
            }
            return forkJoin({
              courses: this.surveyPlan.school_year ? this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_monhoc1) : of({ data: [], recordsFiltered: 0 }),
              question_answer: this.surveyQuestionAnswerService.countAnswer(this.surveyPlan.id.toString())
            });
          })
        );
      }),
      switchMap(res => {
        return this.surveysService.loadData(
          [{
            conditionName: 'status',
            condition: OvicQueryCondition.equal,
            value: 'PUBLISHED'
          }],
          {
            limit: -1,
            paged: 1,
            order: 'DESC',
            orderby: 'created_at'
          }
        ).pipe(
          map((surveyRes: Dto) => ({ ...res, surveys: surveyRes.data }))
        );
      }),
      // Load survey info để lấy group_info
      switchMap((res: any) => {
        return this.surveysService.loadData1(this.surveyPlan.survey_id?.toString()).pipe(
          map((surveyRes: any) => ({ ...res, surveyDetail: surveyRes.data }))
        );
      })
    ).subscribe({
      next: (res) => {
        if (res.question_answer > 0) {
          this.isLock = true;
        }
        this.listCourseAll = res.courses.data;
        this.listCourse = [...this.listCourseAll];
        this.listSurvey = res.surveys || [];
        this.surveyGroupInfo = res.surveyDetail?.group_info || [];
        const courseIds = Array.isArray(this.surveyPlan.course_ids) ? this.surveyPlan.course_ids : [];
        const surveyInfo = this.listSurvey.find(s => s.id === this.surveyPlan.survey_id);
        this.formSurvey.patchValue({
          id: this.surveyPlan.id,
          school_year: this.surveyPlan.school_year,
          semester: this.surveyPlan.semester,
          display_position: this.surveyPlan.display_position,
          type: this.surveyPlan.type,
          auth_method: this.surveyPlan.auth_method,
          access_link: this.surveyPlan.access_link,
          survey_id: this.surveyPlan.survey_id || 0,
          course_ids: courseIds,
          participant_roles: surveyInfo ? surveyInfo.participant_roles : this.surveyPlan.participant_roles,
          random_question: this.surveyPlan.question_pools || [],
          dothoc: this.surveyPlan.dothoc ?? null
        });

        this.isViewCourse = this.surveyPlan.type === 'COURSE';
        this.selectedKhoaHoc = Array.isArray(this.surveyPlan.khoa) ? this.surveyPlan.khoa : [];
        if (!this.isLanhDaoKhoaContext) {
          const savedKhoaIds: number[] = Array.isArray(this.surveyPlan.danh_muc_khoa)
            ? this.surveyPlan.danh_muc_khoa.map(Number)
            : [];
          this.selectedKhoaDonVi = savedKhoaIds.length
            ? this.listKhoaDonVi.filter(d => savedKhoaIds.includes(d.value)).map(d => d.value)
            : [0];
        }
        this.onChangeKhoaDonVi({ value: this.selectedKhoaDonVi });
        this.selectedClassIds = Array.isArray(this.surveyPlan.class_ids) ? this.surveyPlan.class_ids : [];
        this.selectedDot = this.surveyPlan.dothoc ?? '';
        // Load random_question
        this.groupRandomMap = {};
        if (Array.isArray(this.surveyPlan.question_pools)) {
          for (const item of this.surveyPlan.question_pools) {
            this.groupRandomMap[item.group_info_id] = item.random_count;
          }
        }
        this.state = 'SUCCESS';
        this.noitifi.isProcessing(false);
      },
      error: () => {
        this.state = 'ERROR';
        this.noitifi.isProcessing(false);
      }
    });
  }

  get formControl() {
    return this.formSurvey.controls;
  }

  saveSurvey(): void {
    if (this.isLock == true) {
      this.noitifi.toastError('Khảo sát đã có câu trả lời! Không thể chỉnh sửa');
      return;
    }
    this.noitifi.isProcessing(true);
    this.state = 'LOADING';
    const info: Partial<SurveyPlan> = {
      school_year: this.formControl['school_year'].value,
      semester: this.formControl['semester'].value,
      display_position: this.formControl['display_position'].value,
      auth_method: this.formControl['auth_method'].value,
      access_link: this.formControl['access_link'].value,
      type: this.formControl['type'].value,
      survey_id: this.formControl['survey_id'].value,
      course_ids: this.formControl['type'].value == 'COURSE' ? this.formControl['course_ids'].value : 0,
      class_ids: this.selectedClassIds,
      participant_roles: this.formControl['participant_roles'].value,
      khoa: this.selectedKhoaHoc,
      danh_muc_khoa: this.selectedKhoaDonVi.includes(0)
        ? this.listKhoaDonVi.filter(item => item.value !== 0).map(item => item.value)
        : this.selectedKhoaDonVi,
      dothoc: this.selectedDot === '' || this.selectedDot == null ? null : Number(this.selectedDot),
      question_pools: this.surveyGroupInfo.map(g => ({
        group_info_id: g.id,
        ids: g.ids || [],
        random_count: this.groupRandomMap[g.id] || 0
      }))
    };
    this.surveysPlanService.putData(info, this.formControl['id'].value).subscribe({
      next: () => {
        this.noitifi.isProcessing(false);
        this.state = 'SUCCESS';
        this.noitifi.toastSuccess('Cập nhật thành công');
      },
      error: () => {
        this.noitifi.isProcessing(false);
        this.state = 'SUCCESS';
        this.noitifi.toastError('Cập nhật không thành công');
      }
    });
  }

  onChangeTypeSurveyPlan(event: any): void {
    const value = event.id;
    this.isViewCourse = value == 'COURSE';
  }

  onChangeCourse(event: any): void {
    this.formSurvey.patchValue({
      course_ids: event.value
    });
    this.listCourseSelect = this.listCourse.filter((item) => this.formControl['course_ids'].value.includes(item.id));
    this.selectedClassIds = this.listClasses
      .filter((item) => this.formControl['course_ids'].value.includes(item.course_id))
      .map((item) => item.id);
  }

  delChangeCourse(id: number): void {
    this.listCourseSelect = this.listCourseSelect.filter((item) => item.id != id);
    this.formSurvey.patchValue({
      course_ids: this.listCourseSelect.map((item) => item.id)
    });
    this.selectedClassIds = [];
  }

  onChangeDot(event: any): void {
    this.selectedDot = event?.value ?? '';
    this.formSurvey.patchValue({ dothoc: this.selectedDot === '' ? null : this.selectedDot });
    if (this.selectedKhoaHoc.length === 0) {
      this.reloadClassesData();
      return;
    }
    // giữ khóa đã chọn: chỉ refresh lớp/môn theo đợt mới
    this.loadClassAndCourse();
  }

  onChangeSchoolYear(): void {
    this.selectedKhoaHoc = [];
    this.reloadClassesData();
  }

  reloadClassesData(): void {
    this.noitifi.isProcessing(true);
    this.listCourseSelect = [];
    this.formSurvey.patchValue({
      course_ids: []
    });
    this.loadKhoaHoc();
    const condition_classes: ConditionOption = {
      condition: [
        {
          conditionName: 'namhoc', condition: OvicQueryCondition.equal,
          value: this.formControl['school_year'].value, orWhere: 'and'
        },
        { conditionName: 'hocky', condition: OvicQueryCondition.equal, value: this.formControl['semester'].value, orWhere: 'and' },
        ...(this.dotCondition() ? [this.dotCondition()] : [])
      ],
      page: '1',
      set: [{ label: 'limit', value: '-1' }]
    };
    const condition_monhoc1 = JSON.parse(JSON.stringify(this.condition_monhoc));
    this.classesService.getClassesByPageNew(condition_classes).pipe(
      switchMap(classesRes => {
        this.listClasses = classesRes.data;
        const course_ids = [...new Set(classesRes.data.map(item => item.course_id))].join(',');
        condition_monhoc1.set.push({ label: 'include', value: course_ids || '-1' });
        return this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_monhoc1);
      })
    ).subscribe({
      next: (res) => {
        this.listCourseAll = res.data;
        this.listCourse = [...this.listCourseAll];
        if (this.selectedKhoaDonVi.length && !this.selectedKhoaDonVi.includes(0)) {
          this.onChangeKhoaDonVi({ value: this.selectedKhoaDonVi });
        }
        this.state = 'SUCCESS';
        this.noitifi.isProcessing(false);
      },
      error: () => {
        this.state = 'SUCCESS';
        this.noitifi.toastError('Lỗi kết nối');
        this.noitifi.isProcessing(false);
      }
    });
  }

  onChangeSurvey(): void {
    const survey = this.listSurvey.find(s => s.id === this.formControl['survey_id'].value);
    if (survey) {
      this.formSurvey.patchValue({ participant_roles: survey.participant_roles });
    }
  }

  getlistClasses(course_id: number): Classes[] {
    return this.listClasses.filter((item) => item.course_id == course_id);
  }

  getAllClasses(): Classes[] {
    const course_ids = this.formControl['course_ids'].value;
    return Array.isArray(course_ids) ? this.listClasses.filter((item) => course_ids.includes(item.course_id)) : [];
  }

  onClassSelectionChange(id: number, checked: boolean): void {
    if (checked) {
      if (!this.selectedClassIds.includes(id)) {
        this.selectedClassIds.push(id);
      }
    } else {
      this.selectedClassIds = this.selectedClassIds.filter(cid => cid !== id);
    }
  }

  onSaveGroupRandom(): void {
    if (this.isLock) {
      this.noitifi.toastError('Khảo sát đã có câu trả lời! Không thể chỉnh sửa');
      return;
    }
    const question_pools = this.surveyGroupInfo.map(g => ({
      group_info_id: g.id,
      ids: g.ids || [],
      random_count: this.groupRandomMap[g.id] || 0
    }));
    this.noitifi.isProcessing(true);
    this.surveysPlanService.putData({ question_pools }, this.formControl['id'].value).subscribe({
      next: () => {
        this.noitifi.isProcessing(false);
        this.noitifi.toastSuccess('Lưu thành công');
      },
      error: () => {
        this.noitifi.isProcessing(false);
        this.noitifi.toastError('Lưu thất bại');
      }
    });
  }

  reloadData(): void {
    this.initData();
  }
}
