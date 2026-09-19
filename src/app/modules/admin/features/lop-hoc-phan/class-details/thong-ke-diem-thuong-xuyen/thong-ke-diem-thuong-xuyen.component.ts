import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thong-ke-diem-thuong-xuyen',
    templateUrl: './thong-ke-diem-thuong-xuyen.component.html',
    styleUrls: ['./thong-ke-diem-thuong-xuyen.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongKeDiemThuongXuyenComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



