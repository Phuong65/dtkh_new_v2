import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'ovic-select-classmanagement',
    templateUrl: './ovic-select-classmanagement.component.html',
    styleUrls: ['./ovic-select-classmanagement.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class OvicSelectClassmanagementComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



