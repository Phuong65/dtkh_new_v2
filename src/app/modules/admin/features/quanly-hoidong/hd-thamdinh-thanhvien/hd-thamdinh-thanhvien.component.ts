import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-hd-thamdinh-thanhvien',
    templateUrl: './hd-thamdinh-thanhvien.component.html',
    styleUrls: ['./hd-thamdinh-thanhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HdThamdinhThanhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



