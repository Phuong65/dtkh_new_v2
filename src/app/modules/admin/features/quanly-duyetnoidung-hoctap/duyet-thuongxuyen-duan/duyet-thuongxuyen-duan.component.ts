import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-thuongxuyen-duan',
    templateUrl: './duyet-thuongxuyen-duan.component.html',
    styleUrls: ['./duyet-thuongxuyen-duan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetThuongxuyenDuanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



