import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-question-input',
    templateUrl: './survey-question-input.component.html',
    styleUrls: ['./survey-question-input.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyQuestionInputComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



