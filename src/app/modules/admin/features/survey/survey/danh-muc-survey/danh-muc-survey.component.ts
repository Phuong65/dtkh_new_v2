import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-danh-muc-survey',
    templateUrl: './danh-muc-survey.component.html',
    styleUrls: ['./danh-muc-survey.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DanhMucSurveyComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



