import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-quanly-monhoc-router-outlet',
    templateUrl: './quanly-monhoc-router-outlet.component.html',
    styleUrls: ['./quanly-monhoc-router-outlet.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuanlyMonhocRouterOutletComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



