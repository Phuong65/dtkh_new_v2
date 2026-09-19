import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-giang-vien-lop',
    templateUrl: './home-giang-vien-lop.component.html',
    styleUrls: ['./home-giang-vien-lop.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeGiangVienLopComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



