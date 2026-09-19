import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-detail-question',
    templateUrl: './survey-detail-question.component.html',
    styleUrls: ['./survey-detail-question.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyDetailQuestionComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



