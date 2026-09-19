import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-quanly-clo',
    templateUrl: './quanly-clo.component.html',
    styleUrls: ['./quanly-clo.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuanlyCloComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



