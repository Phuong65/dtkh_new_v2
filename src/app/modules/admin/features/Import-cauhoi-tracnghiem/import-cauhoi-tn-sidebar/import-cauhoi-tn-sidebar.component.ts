import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-cauhoi-tn-sidebar',
    templateUrl: './import-cauhoi-tn-sidebar.component.html',
    styleUrls: ['./import-cauhoi-tn-sidebar.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportCauhoiTnSidebarComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



