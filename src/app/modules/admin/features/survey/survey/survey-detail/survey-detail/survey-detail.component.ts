import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-survey-detail',
    templateUrl: './survey-detail.component.html',
    styleUrls: ['./survey-detail.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SurveyDetailComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



