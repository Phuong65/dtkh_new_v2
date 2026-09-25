import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-cauhoi-thuchanh-kthp',
    templateUrl: './duyet-cauhoi-thuchanh-kthp.component.html',
    styleUrls: ['./duyet-cauhoi-thuchanh-kthp.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetCauhoiThuchanhKthpComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



