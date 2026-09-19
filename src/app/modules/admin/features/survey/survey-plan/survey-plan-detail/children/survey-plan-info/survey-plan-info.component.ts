import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-plan-info',
    templateUrl: './survey-plan-info.component.html',
    styleUrls: ['./survey-plan-info.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyPlanInfoComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



