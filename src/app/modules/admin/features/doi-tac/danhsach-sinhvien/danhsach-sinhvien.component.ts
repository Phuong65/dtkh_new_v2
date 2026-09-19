import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-danhsach-sinhvien',
    templateUrl: './danhsach-sinhvien.component.html',
    styleUrls: ['./danhsach-sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DanhsachSinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



