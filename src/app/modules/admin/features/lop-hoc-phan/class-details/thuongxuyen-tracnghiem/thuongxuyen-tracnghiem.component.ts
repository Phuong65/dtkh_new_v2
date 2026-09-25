import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thuongxuyen-tracnghiem',
    templateUrl: './thuongxuyen-tracnghiem.component.html',
    styleUrls: ['./thuongxuyen-tracnghiem.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThuongxuyenTracnghiemComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



