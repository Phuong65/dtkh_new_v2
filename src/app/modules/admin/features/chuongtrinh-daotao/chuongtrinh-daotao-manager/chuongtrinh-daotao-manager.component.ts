import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-chuongtrinh-daotao-manager',
    templateUrl: './chuongtrinh-daotao-manager.component.html',
    styleUrls: ['./chuongtrinh-daotao-manager.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ChuongtrinhDaotaoManagerComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



