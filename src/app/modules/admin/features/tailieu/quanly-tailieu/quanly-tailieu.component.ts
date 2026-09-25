import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-quanly-tailieu',
    templateUrl: './quanly-tailieu.component.html',
    styleUrls: ['./quanly-tailieu.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuanlyTailieuComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



