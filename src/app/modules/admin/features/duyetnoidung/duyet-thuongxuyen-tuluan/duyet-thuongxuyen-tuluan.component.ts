import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-thuongxuyen-tuluan',
    templateUrl: './duyet-thuongxuyen-tuluan.component.html',
    styleUrls: ['./duyet-thuongxuyen-tuluan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetThuongxuyenTuluanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



