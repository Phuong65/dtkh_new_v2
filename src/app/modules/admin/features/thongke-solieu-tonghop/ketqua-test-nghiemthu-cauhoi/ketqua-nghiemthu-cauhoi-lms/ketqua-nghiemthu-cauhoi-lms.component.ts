import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ketqua-nghiemthu-cauhoi-lms',
    templateUrl: './ketqua-nghiemthu-cauhoi-lms.component.html',
    styleUrls: ['./ketqua-nghiemthu-cauhoi-lms.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KetquaNghiemthuCauhoiLmsComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



