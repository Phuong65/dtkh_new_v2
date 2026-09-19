import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-cauhoi-tn-detail',
    templateUrl: './duyet-cauhoi-tn-detail.component.html',
    styleUrls: ['./duyet-cauhoi-tn-detail.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetCauhoiTnDetailComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



