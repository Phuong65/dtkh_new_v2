import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-cauhoi-tn-main',
    templateUrl: './import-cauhoi-tn-main.component.html',
    styleUrls: ['./import-cauhoi-tn-main.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportCauhoiTnMainComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



