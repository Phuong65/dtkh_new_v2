import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-kiemtra-daugio',
    templateUrl: './kiemtra-daugio.component.html',
    styleUrls: ['./kiemtra-daugio.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KiemtraDaugioComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



