import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-quanly-lophocphan',
    templateUrl: './quanly-lophocphan.component.html',
    styleUrls: ['./quanly-lophocphan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuanlyLophocphanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



