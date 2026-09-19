import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-cauhoi',
    templateUrl: './duyet-cauhoi.component.html',
    styleUrls: ['./duyet-cauhoi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetCauhoiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



