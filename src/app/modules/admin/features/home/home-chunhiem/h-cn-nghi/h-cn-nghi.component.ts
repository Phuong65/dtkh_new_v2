import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-h-cn-nghi',
    templateUrl: './h-cn-nghi.component.html',
    styleUrls: ['./h-cn-nghi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HCnNghiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



