import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-xoa-cau-hoi-theo-bai-cdr',
    templateUrl: './xoa-cau-hoi-theo-bai-cdr.component.html',
    styleUrls: ['./xoa-cau-hoi-theo-bai-cdr.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class XoaCauHoiTheoBaiCdrComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



