import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-plan',
    templateUrl: './survey-plan.component.html',
    styleUrls: ['./survey-plan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyPlanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



