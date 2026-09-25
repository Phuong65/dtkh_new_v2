import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-phongthi-duan',
    templateUrl: './phongthi-duan.component.html',
    styleUrls: ['./phongthi-duan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class PhongthiDuanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



