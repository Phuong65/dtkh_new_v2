import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-cauhoi-thuchanh',
    templateUrl: './cauhoi-thuchanh.component.html',
    styleUrls: ['./cauhoi-thuchanh.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CauhoiThuchanhComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



