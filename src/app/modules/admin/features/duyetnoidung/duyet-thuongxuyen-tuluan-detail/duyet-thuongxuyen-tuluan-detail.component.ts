import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-thuongxuyen-tuluan-detail',
    templateUrl: './duyet-thuongxuyen-tuluan-detail.component.html',
    styleUrls: ['./duyet-thuongxuyen-tuluan-detail.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetThuongxuyenTuluanDetailComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



