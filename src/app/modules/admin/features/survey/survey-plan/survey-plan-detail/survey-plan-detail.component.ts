import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-plan-detail',
    templateUrl: './survey-plan-detail.component.html',
    styleUrls: ['./survey-plan-detail.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyPlanDetailComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



