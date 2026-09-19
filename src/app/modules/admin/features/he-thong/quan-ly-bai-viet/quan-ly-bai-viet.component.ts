import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-quan-ly-bai-viet',
    templateUrl: './quan-ly-bai-viet.component.html',
    styleUrls: ['./quan-ly-bai-viet.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuanLyBaiVietComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



