import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-question-checkbox',
    templateUrl: './survey-question-checkbox.component.html',
    styleUrls: ['./survey-question-checkbox.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyQuestionCheckboxComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



