import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '@core/services/notification.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HelperService } from '@core/services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ParticipantRolesTypeOption, StatusOption, Survey, SurveyState } from '@modules/shared/models/survey';
import { SharedModule } from "@modules/shared/shared.module";
import { CalendarModule } from "primeng/calendar";
import { MultiSelectModule } from 'primeng/multiselect';
import { SurveyService } from '@modules/shared/services/survey.service';

@Component({
    selector: 'app-survey-detail-info',
    standalone: true,
    imports: [CommonModule, SharedModule, CalendarModule, FormsModule, ReactiveFormsModule, MultiSelectModule],
    templateUrl: './survey-detail-info.component.html',
    styleUrls: ['./survey-detail-info.component.css']
})
export class SurveyDetailInfoComponent implements OnInit {

    constructor(
        private noitifi: NotificationService,
        private surveysService: SurveyService,
        public formBuilder: FormBuilder,
        private helperService: HelperService,
        private router: Router,
        private route: ActivatedRoute) {

        this.formSurvey = this.formBuilder.group({
            id: [''],
            title: ['', Validators.required],
            description: [''],
            total_questions: [{ value: 0, disabled: true }],
            status: ['', Validators.required],
            participant_roles: [{ value: 'STUDENT', disabled: true }],
            assigned_count: [{ value: 0, disabled: true }]
        });
    }

    state: SurveyState = 'LOADING';

    formSurvey: FormGroup;

    idSurvey: string = '';

    surveyInfo: Survey;

    isLock: boolean = false;

    get formControl() {
        return this.formSurvey.controls;
    }

    participantRolesTypeOption = ParticipantRolesTypeOption;

    statusOption = StatusOption;


    ngOnInit(): void {
        this.idSurvey = this.route.snapshot.queryParamMap.get('code');
        this.initData();
    }

    initData() {
        this.state = 'LOADING';
        this.noitifi.isProcessing(true);
        this.surveysService.loadData1(this.idSurvey).pipe(
            map(res => res.data)
        ).subscribe({
            next: (surveyInfo) => {
                this.surveyInfo = surveyInfo;
                this.setFormControl();
                this.state = 'SUCCESS';
                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.state = 'ERROR';
                this.noitifi.isProcessing(false);
            },
        });
    }


    setFormControl(): void {
        this.formSurvey.setValue({
            id: this.surveyInfo.id,
            title: this.surveyInfo.title,
            description: this.surveyInfo.description,
            total_questions: this.surveyInfo.total_questions,
            status: this.surveyInfo.status,
            participant_roles: this.surveyInfo.participant_roles,
            assigned_count: this.surveyInfo.assigned_count
        });
    }

    isDisplayWeekOption(): boolean {
        const value = this.formControl['display_position'].value;

        return [
            'LESSON_ACCESS',
            'BEFORE_HOMEWORK_TEST',
            'AFTER_HOMEWORK_TEST',
            'BEFORE_INCLASS_TEST',
            'AFTER_INCLASS_TEST'
        ].includes(value);
    }

    saveSurvey(): void {
        if (this.isLock == true) {
            this.noitifi.toastError('Khảo sát đã có câu trả lời! Không thể chỉnh sửa');
            return;
        }
        this.noitifi.isProcessing(true);
        const info: Partial<Survey> = {
            title: this.formControl['title'].value,
            description: this.formControl['description'].value,
            status: this.formControl['status'].value,
            participant_roles: this.formControl['participant_roles'].value,
        }
        this.surveysService.putData(info, this.idSurvey).subscribe({
            next: () => {
                this.noitifi.toastSuccess('Cập nhật thành công');
                this.noitifi.isProcessing(false);
            },
            error: () => {
                this.noitifi.toastError('Cập nhật không thành công');
                this.noitifi.isProcessing(false);
            },
        })
    }

    reloadData(): void {
        this.initData();
    }
}
