import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-kiemtra-kynang',
    templateUrl: './kiemtra-kynang.component.html',
    styleUrls: ['./kiemtra-kynang.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KiemtraKynangComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



