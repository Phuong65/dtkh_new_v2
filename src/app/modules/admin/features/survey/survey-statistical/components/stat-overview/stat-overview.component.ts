import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-stat-overview',
    templateUrl: './stat-overview.component.html',
    styleUrls: ['./stat-overview.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class StatOverviewComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



