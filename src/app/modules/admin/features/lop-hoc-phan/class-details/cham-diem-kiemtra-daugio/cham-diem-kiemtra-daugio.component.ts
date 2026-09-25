import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-cham-diem-kiemtra-daugio',
    templateUrl: './cham-diem-kiemtra-daugio.component.html',
    styleUrls: ['./cham-diem-kiemtra-daugio.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ChamDiemKiemtraDaugioComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
    requestDeactivate(): boolean { return true; }
}



