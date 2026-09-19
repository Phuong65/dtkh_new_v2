import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-giang-vien-nghiquasobuoi',
    templateUrl: './home-giang-vien-nghiquasobuoi.component.html',
    styleUrls: ['./home-giang-vien-nghiquasobuoi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeGiangVienNghiquasobuoiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



