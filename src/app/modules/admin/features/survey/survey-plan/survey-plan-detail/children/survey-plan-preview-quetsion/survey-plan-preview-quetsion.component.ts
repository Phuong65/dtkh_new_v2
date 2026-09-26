import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { SurveyDetailQuestionComponent } from '@modules/admin/features/survey/survey/survey-detail/survey-detail-question/survey-detail-question.component';
import { SurveyPlanService } from '@modules/shared/services/survey-plan.service';
import { SurveyPlan } from '@modules/shared/models/survey-plan';
import { SurveyState } from '@modules/shared/models/survey';

@Component({
  selector: 'app-survey-plan-preview-quetsion',
  standalone: true,
  imports: [CommonModule, SurveyDetailQuestionComponent],
  templateUrl: './survey-plan-preview-quetsion.component.html',
  styleUrls: ['./survey-plan-preview-quetsion.component.css']
})
export class SurveyPlanPreviewQuetsionComponent implements OnInit {
  state: SurveyState | 'NOT_SET' = 'LOADING';

  idPlanSurvey: string = '';

  surveyValue: SurveyPlan;

  constructor(private route: ActivatedRoute,
    private surveysPlanService: SurveyPlanService,
    private noitifi: NotificationService
  ) { }

  ngOnInit(): void {
    this.idPlanSurvey = this.route.snapshot.queryParamMap.get('code');
    this.initData();
  }

  initData(): void {
    this.state = 'LOADING';
    this.noitifi.isProcessing(true);
    this.surveysPlanService.loadData1(this.idPlanSurvey.toString()).subscribe({
      next: (res) => {
        this.surveyValue = res.data;
        this.state = 'SUCCESS';
        if (this.surveyValue.survey_id == 0) {
          this.state = 'NOT_SET';
        }
        this.noitifi.isProcessing(false);
      },
      error: (err) => {
        this.state = 'ERROR';
        this.noitifi.isProcessing(false);
      },
    })
  }

  reloadData(): void {
    this.initData();
  }

}
