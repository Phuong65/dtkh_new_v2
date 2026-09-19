import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-question-date',
    templateUrl: './survey-question-date.component.html',
    styleUrls: ['./survey-question-date.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyQuestionDateComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



