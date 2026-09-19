import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-cauhoi-thuchanh-kthp-detail',
    templateUrl: './duyet-cauhoi-thuchanh-kthp-detail.component.html',
    styleUrls: ['./duyet-cauhoi-thuchanh-kthp-detail.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetCauhoiThuchanhKthpDetailComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



