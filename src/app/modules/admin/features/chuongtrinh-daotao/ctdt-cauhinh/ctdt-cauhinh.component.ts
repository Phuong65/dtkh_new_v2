import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ctdt-cauhinh',
    templateUrl: './ctdt-cauhinh.component.html',
    styleUrls: ['./ctdt-cauhinh.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CtdtCauhinhComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



