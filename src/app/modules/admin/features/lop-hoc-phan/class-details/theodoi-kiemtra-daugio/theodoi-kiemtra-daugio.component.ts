import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-theodoi-kiemtra-daugio',
    templateUrl: './theodoi-kiemtra-daugio.component.html',
    styleUrls: ['./theodoi-kiemtra-daugio.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TheodoiKiemtraDaugioComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



