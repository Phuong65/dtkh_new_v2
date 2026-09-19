import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-detail-info',
    templateUrl: './survey-detail-info.component.html',
    styleUrls: ['./survey-detail-info.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyDetailInfoComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



