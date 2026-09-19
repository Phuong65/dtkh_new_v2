import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-stat-question-chart',
    templateUrl: './stat-question-chart.component.html',
    styleUrls: ['./stat-question-chart.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class StatQuestionChartComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



