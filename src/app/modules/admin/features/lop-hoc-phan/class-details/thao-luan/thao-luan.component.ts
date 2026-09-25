import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thao-luan',
    templateUrl: './thao-luan.component.html',
    styleUrls: ['./thao-luan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThaoLuanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



