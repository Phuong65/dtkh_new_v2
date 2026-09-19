import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-quanly-kehoach-hoctap',
    templateUrl: './quanly-kehoach-hoctap.component.html',
    styleUrls: ['./quanly-kehoach-hoctap.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuanlyKehoachHoctapComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



