import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-thuongxuyen-duan-detail',
    templateUrl: './duyet-thuongxuyen-duan-detail.component.html',
    styleUrls: ['./duyet-thuongxuyen-duan-detail.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetThuongxuyenDuanDetailComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



