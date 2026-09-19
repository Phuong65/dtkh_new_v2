import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-admin',
    templateUrl: './home-admin.component.html',
    styleUrls: ['./home-admin.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeAdminComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



