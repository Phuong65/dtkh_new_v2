import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-kt-cam-bothi',
    templateUrl: './kt-cam-bothi.component.html',
    styleUrls: ['./kt-cam-bothi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KtCamBothiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



