import { Component, OnInit } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';
import { HelperService } from '@core/services/helper.service';
import { ParticipantRolesTypeOption, SurveyState } from '@modules/shared/models/survey';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from "@modules/shared/shared.module";
import { CalendarModule } from "primeng/calendar";
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SurveyPlanService } from '@modules/shared/services/survey-plan.service';
import { IsPublicOption, StatusOption, SurveyPlan } from '@modules/shared/models/survey-plan';

@Component({
  selector: 'app-survey-plan-info',
  standalone: true,
  imports: [FormsModule,
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule,
    CalendarModule],
  templateUrl: './survey-plan-info.component.html',
  styleUrls: ['./survey-plan-info.component.css']
})
export class SurveyPlanInfoComponent implements OnInit {

  constructor(
    private noitifi: NotificationService,
    private surveysPlanService: SurveyPlanService,
    public formBuilder: FormBuilder,
    private helperService: HelperService,
    private route: ActivatedRoute) {
    this.formSurvey = this.formBuilder.group({
      id: [''],
      title: ['', Validators.required],
      description: [''],
      participant_roles: [''],
      status: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: [''],
      is_public: [0, Validators.required],
      required: [1, Validators.required]
    });
  }

  state: SurveyState = 'LOADING';

  participantRolesTypeOption = ParticipantRolesTypeOption;

  isPublicOption = IsPublicOption;

  statusOption = StatusOption;

  formSurvey: FormGroup;

  idPlanSurvey: string = '';

  surveyPlan: SurveyPlan;

  ngOnInit(): void {
    this.idPlanSurvey = this.route.snapshot.queryParamMap.get('code');
    this.initData();
  }

  initData() {
    this.noitifi.isProcessing(true);
    this.state = 'LOADING';
    this.surveysPlanService.loadData1(this.idPlanSurvey).subscribe({
      next: (res) => {
        this.surveyPlan = res.data;
        this.formSurvey.patchValue({
          id: this.surveyPlan.id,
          title: this.surveyPlan.title,
          description: this.surveyPlan.description,
          participant_roles: this.surveyPlan.participant_roles,
          status: this.surveyPlan.status,
          start_date: new Date(this.surveyPlan.start_date),
          end_date: this.surveyPlan.end_date ? new Date(this.surveyPlan.end_date) : null,
          is_public: this.surveyPlan.is_public,
          required: this.surveyPlan.required
        });
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
    this.noitifi.isProcessing(true);
    const info: Partial<SurveyPlan> = {
      title: this.formControl['title'].value,
      description: this.formControl['description'].value,
      participant_roles: this.formControl['participant_roles'].value,
      status: this.formControl['status'].value,
      start_date: this.helperService.formatSQLDate(new Date(this.formControl['start_date'].value)),
      end_date: this.formControl['end_date'].value ? this.helperService.formatSQLDate(new Date(this.formControl['end_date'].value)) : null,
      is_public: this.formControl['is_public'].value,
      required: this.formControl['required'].value
    };
    this.surveysPlanService.putData(info, this.formControl['id'].value).subscribe({
      next: () => {
        this.noitifi.toastSuccess('Cập nhật thành công');
        this.noitifi.isProcessing(false);
      },
      error: () => {
        this.noitifi.toastError('Cập nhật không thành công');
        this.noitifi.isProcessing(false);
      }
    });
  }

  reloadData(): void {
    this.initData();
  }
}
