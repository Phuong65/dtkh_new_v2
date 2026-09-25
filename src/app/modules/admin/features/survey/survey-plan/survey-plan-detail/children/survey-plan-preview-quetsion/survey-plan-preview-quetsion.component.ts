import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-plan-preview-quetsion',
    templateUrl: './survey-plan-preview-quetsion.component.html',
    styleUrls: ['./survey-plan-preview-quetsion.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyPlanPreviewQuetsionComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



