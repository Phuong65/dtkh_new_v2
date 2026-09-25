import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-kq-chart',
    templateUrl: './kq-chart.component.html',
    styleUrls: ['./kq-chart.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KqChartComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



