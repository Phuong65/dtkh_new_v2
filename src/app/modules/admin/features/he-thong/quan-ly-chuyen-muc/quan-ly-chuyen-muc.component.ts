import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-quan-ly-chuyen-muc',
    templateUrl: './quan-ly-chuyen-muc.component.html',
    styleUrls: ['./quan-ly-chuyen-muc.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuanLyChuyenMucComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



