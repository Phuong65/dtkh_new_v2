import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyetnoidung-router-outlet',
    templateUrl: './duyetnoidung-router-outlet.component.html',
    styleUrls: ['./duyetnoidung-router-outlet.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetnoidungRouterOutletComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



