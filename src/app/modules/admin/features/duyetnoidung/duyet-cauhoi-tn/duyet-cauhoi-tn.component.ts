import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-cauhoi-tn',
    templateUrl: './duyet-cauhoi-tn.component.html',
    styleUrls: ['./duyet-cauhoi-tn.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetCauhoiTnComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



