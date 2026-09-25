import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ctdt-cdr',
    templateUrl: './ctdt-cdr.component.html',
    styleUrls: ['./ctdt-cdr.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CtdtCdrComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



