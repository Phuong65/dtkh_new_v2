import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-statistical',
    templateUrl: './survey-statistical.component.html',
    styleUrls: ['./survey-statistical.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyStatisticalComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



