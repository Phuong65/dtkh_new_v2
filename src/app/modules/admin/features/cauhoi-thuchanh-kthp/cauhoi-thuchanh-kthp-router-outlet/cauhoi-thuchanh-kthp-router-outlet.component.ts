import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-cauhoi-thuchanh-kthp-router-outlet',
    templateUrl: './cauhoi-thuchanh-kthp-router-outlet.component.html',
    styleUrls: ['./cauhoi-thuchanh-kthp-router-outlet.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CauhoiThuchanhKthpRouterOutletComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



