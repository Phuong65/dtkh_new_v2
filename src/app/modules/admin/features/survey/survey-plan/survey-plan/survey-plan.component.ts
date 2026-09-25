import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { IctuQueryParams, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { ParticipantRolesTypeOption, Survey, SurveyParticipantRoles } from '@modules/shared/models/survey';
import { SurveyService } from '@modules/shared/services/survey.service';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Paginator, PaginatorModule } from "primeng/paginator";
import { SharedModule } from "@modules/shared/shared.module";
import { CalendarModule } from "primeng/calendar";
import { HelperService } from '@core/services/helper.service';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { SurveyPlanService } from '@modules/shared/services/survey-plan.service';
import { SurveyQuestionAnswerService } from '@modules/shared/services/survey-question-answer.service';
import { DisplayPositionOption, IsPublicOption, StatusOption, SurveyAuthMethodOption, SurveyPlan } from '@modules/shared/models/survey-plan';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { SidebarModule } from "primeng/sidebar";
interface Temp {
  paged: number;
  limit: number;
  participant_roles: SurveyParticipantRoles | '';
}

@Component({
  selector: 'app-survey-plan',
  standalone: true,
  imports: [FormsModule,
    CommonModule,
    PaginatorModule,
    ReactiveFormsModule,
    SharedModule,
    CalendarModule,
    NgbTooltipModule,
    RouterModule,
    MultiSelectModule,
    TooltipModule, SidebarModule],
  templateUrl: './survey-plan.component.html',
  styleUrls: ['./survey-plan.component.css']
})
export class SurveyPlanComponent implements OnInit {

  constructor(
    private noitifi: NotificationService,
    private surveysPlanService: SurveyPlanService,
    private surveysService: SurveyService,
    private surveyQuestionAnswerService: SurveyQuestionAnswerService,
    public formBuilder: FormBuilder,
    private helperService: HelperService,
    private router: Router) {
    this.formSurvey = this.formBuilder.group({
      id: [''],
      title: ['', Validators.required],
      description: [''],

      status: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: [''],

      // is_public: [0, Validators.required],
      // survey_id: [0, Validators.required],
      // school_year: ['', Validators.required],
      // semester: ['', Validators.required],
      // auth_method: ['', Validators.required],
      // access_link: [''],
      // required: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.initData();
  }


  visiblePanel: boolean = false;


  listSurveyPlan: SurveyPlan[];


  surveyPlanSelect: SurveyPlan;

  survey_ids: string = '';

  listSurvey: Survey[];

  totalSurvey: number = 0;

  answerCountMap: Map<number, number> = new Map();

  participantRolesTypeOption = ParticipantRolesTypeOption;

  displayPositionOption = DisplayPositionOption;

  isPublicOption = IsPublicOption;

  statusOption = StatusOption;

  surveyAuthMethodOption = SurveyAuthMethodOption;


  @ViewChild('createSurvey') createSurvey: TemplateRef<any>;

  @ViewChild('paginator') paginator: Paginator;

  temp: Temp = {
    paged: 1,
    limit: 20,
    participant_roles: ''
  }

  formSurvey: FormGroup;


  isAdd: boolean = true;

  initData() {
    this.noitifi.isProcessing(true);
    const condition: OvicConditionParam[] = [];
    if (this.temp.participant_roles != '') {
      condition.push({
        conditionName: 'participant_roles',
        condition: OvicQueryCondition.like,
        value: `%${this.temp.participant_roles}%`
      });
    }
    const queryParams: IctuQueryParams = {
      limit: this.temp.limit,
      paged: this.temp.paged,
      order: 'DESC',
      orderby: 'created_at'
    };

    // .pipe(map((res) => { return res.data }))
    forkJoin({
      surveys: this.surveysService.loadData(
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
      ),

      surveyPlans: this.surveysPlanService.loadData(condition, queryParams).pipe(
        map(res => {
          this.totalSurvey = res.recordsFiltered;
          return res.data;
        })
      )

    }).pipe(
      switchMap(res => {
        const surveys = res.surveys.data;
        const surveyPlans = res.surveyPlans;
        this.listSurvey = surveys;
        this.listSurveyPlan = surveyPlans;

        // Kiểm tra từng survey plan đã có câu trả lời chưa (limit 1 là đủ)
        if (surveyPlans.length) {
          return forkJoin(
            surveyPlans.map(plan => this.surveyQuestionAnswerService.countAnswer(plan.id.toString()))
          ).pipe(
            map(counts => {
              const map = new Map<number, number>();
              surveyPlans.forEach((plan, i) => {
                if (counts[i] && counts[i] > 0) {
                  map.set(plan.id, counts[i]);
                }
              });
              this.answerCountMap = map;
            })
          );
        }
        this.answerCountMap = new Map();
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.noitifi.isProcessing(false);
      },

      error: () => {
        this.noitifi.toastError('Lỗi kết nối');
        this.noitifi.isProcessing(false);
      }
    });
  }

  changePage(event) {
    this.temp = {
      ...this.temp,
      paged: event.page + 1
    }
    this.initData();
  }

  openFormAddSurvey(): void {
    this.formSurvey.reset();
    this.formSurvey.setValue({
      id: -1,
      title: '',

      description: '',
      status: 'DRAFT',
      start_date: new Date(),
      end_date: null,
      // is_public: 0,
      // survey_id: 0,
      // school_year: '',
      // semester: '',
      // auth_method: 'LMS',
      // access_link: '',
      // required: 1
    });
    this.isAdd = true;
    this.noitifi.openSideNavigationMenu({ template: this.createSurvey, size: 700, offsetTop: '0px' });
  }

  openFormUpdateSurvey(value: SurveyPlan): void {
    this.formSurvey.reset();
    this.formSurvey.setValue({
      id: value.id,
      title: value.title,

      description: value.description,
      status: value.status,
      start_date: new Date(value.start_date),
      end_date: new Date(value.end_date),
      // is_public: value.is_public,
      // survey_id: value.survey_id,
      // school_year: value.school_year,
      // semester: value.semester,
      // auth_method: value.auth_method,
      // access_link: value.access_link,
      // required: value.required
    });
    this.isAdd = false;
    this.noitifi.openSideNavigationMenu({ template: this.createSurvey, size: 700, offsetTop: '0px' });
  }

  closeSideMenu() {
    this.noitifi.closeSideNavigationMenu();
  }

  get formControl() {
    return this.formSurvey.controls;
  }
  onChangeParticipantRoles(event) {
    this.temp = { ...this.temp, participant_roles: event?.id ?? '', paged: 1 };
    this.initData();
  }

  saveSurvey(): void {
    this.noitifi.isProcessing(true);
    if (this.isAdd) {
      this.formControl['status'].setValue('DRAFT');
    }
    const info: Partial<SurveyPlan> = {
      title: this.formControl['title'].value,
      description: this.formControl['description'].value,
      status: this.formControl['status'].value,
      start_date: this.helperService.formatSQLDate(new Date(this.formControl['start_date'].value)),
      end_date: this.formControl['end_date'].value ? this.helperService.formatSQLDate(new Date(this.formControl['end_date'].value)) : null,
      // survey_id: this.formControl['survey_id'].value,
      // school_year: this.formControl['school_year'].value,
      // semester: this.formControl['semester'].value,
      // is_public: this.formControl['is_public'].value,
      // auth_method: this.formControl['auth_method'].value,
      // access_link: this.formControl['access_link'].value,
      // required: this.formControl['required'].value,

    }
    let request$;
    if (this.isAdd) {
      request$ = this.surveysPlanService.postData(info);
    } else {
      request$ = this.surveysPlanService.putData(info, this.formControl['id'].value);
    }
    request$.subscribe({
      next: () => {
        this.noitifi.toastSuccess(this.isAdd ? 'Tạo mới thành công' : 'Cập nhật thành công');
        this.noitifi.isProcessing(false);
        this.closeSideMenu();
        this.initData();
      },
      error: (err) => {
        this.noitifi.toastError(this.isAdd ? 'Tạo mới không thành công' : 'Cập nhật không thành công');
        this.noitifi.isProcessing(false);
      },
    })
  }

  deleteSurveyPlan(item: SurveyPlan): void {
    this.noitifi.confirmDelete().then(
      (a) => {
        if (a) {
          this.noitifi.isProcessing(true);
          this.surveyQuestionAnswerService.countAnswer(item.id.toString()).subscribe({
            next: (count) => {
              if (count > 0) {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Không thể xóa! Đợt khảo sát đã có câu trả lời');
                return;
              }
              this.surveysPlanService.delData(item.id.toString()).subscribe({
                next: () => {
                  this.noitifi.toastSuccess('Xóa thành công');
                  this.noitifi.isProcessing(false);
                  this.initData();
                },
                error: () => {
                  this.noitifi.toastError('Xóa không thành công');
                  this.noitifi.isProcessing(false);
                }
              });
            },
            error: () => {
              this.noitifi.isProcessing(false);
              this.noitifi.toastError('Lỗi kiểm tra dữ liệu');
            }
          });
        }
      },
      () => null
    );
  }

}
