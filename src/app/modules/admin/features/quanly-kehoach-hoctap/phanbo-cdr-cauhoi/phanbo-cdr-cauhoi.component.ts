import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-phanbo-cdr-cauhoi',
    templateUrl: './phanbo-cdr-cauhoi.component.html',
    styleUrls: ['./phanbo-cdr-cauhoi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class PhanboCdrCauhoiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



