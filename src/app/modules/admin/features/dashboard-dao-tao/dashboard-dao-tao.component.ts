import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-dashboard-dao-tao',
    templateUrl: './dashboard-dao-tao.component.html',
    styleUrls: ['./dashboard-dao-tao.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DashboardDaoTaoComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



