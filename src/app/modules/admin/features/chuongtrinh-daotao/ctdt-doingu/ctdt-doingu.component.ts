import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ctdt-doingu',
    templateUrl: './ctdt-doingu.component.html',
    styleUrls: ['./ctdt-doingu.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CtdtDoinguComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



