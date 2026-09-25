import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-cauhoi-thuchanh-kthp-manager',
    templateUrl: './cauhoi-thuchanh-kthp-manager.component.html',
    styleUrls: ['./cauhoi-thuchanh-kthp-manager.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CauhoiThuchanhKthpManagerComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



