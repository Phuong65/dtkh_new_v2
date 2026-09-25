import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ctdt-muctieu-cdr',
    templateUrl: './ctdt-muctieu-cdr.component.html',
    styleUrls: ['./ctdt-muctieu-cdr.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CtdtMuctieuCdrComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



