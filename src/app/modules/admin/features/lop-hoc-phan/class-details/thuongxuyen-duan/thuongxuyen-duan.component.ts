import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thuongxuyen-duan',
    templateUrl: './thuongxuyen-duan.component.html',
    styleUrls: ['./thuongxuyen-duan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThuongxuyenDuanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



