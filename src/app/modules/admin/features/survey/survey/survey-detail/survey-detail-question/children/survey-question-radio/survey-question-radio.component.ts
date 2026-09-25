import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-question-radio',
    templateUrl: './survey-question-radio.component.html',
    styleUrls: ['./survey-question-radio.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyQuestionRadioComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



