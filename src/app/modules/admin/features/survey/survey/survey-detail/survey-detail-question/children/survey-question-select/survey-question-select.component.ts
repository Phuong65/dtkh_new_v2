import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-question-select',
    templateUrl: './survey-question-select.component.html',
    styleUrls: ['./survey-question-select.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyQuestionSelectComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



