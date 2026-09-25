import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thongtin-giangvienkhac',
    templateUrl: './thongtin-giangvienkhac.component.html',
    styleUrls: ['./thongtin-giangvienkhac.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongtinGiangvienkhacComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



