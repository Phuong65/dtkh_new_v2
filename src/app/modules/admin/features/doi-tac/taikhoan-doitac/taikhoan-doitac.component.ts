import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-taikhoan-doitac',
    templateUrl: './taikhoan-doitac.component.html',
    styleUrls: ['./taikhoan-doitac.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TaikhoanDoitacComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



