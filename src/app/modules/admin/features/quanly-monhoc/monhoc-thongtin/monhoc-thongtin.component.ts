import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-monhoc-thongtin',
    templateUrl: './monhoc-thongtin.component.html',
    styleUrls: ['./monhoc-thongtin.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class MonhocThongtinComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



