import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-question-rate',
    templateUrl: './survey-question-rate.component.html',
    styleUrls: ['./survey-question-rate.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyQuestionRateComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



