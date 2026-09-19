import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-plan-setting',
    templateUrl: './survey-plan-setting.component.html',
    styleUrls: ['./survey-plan-setting.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyPlanSettingComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



