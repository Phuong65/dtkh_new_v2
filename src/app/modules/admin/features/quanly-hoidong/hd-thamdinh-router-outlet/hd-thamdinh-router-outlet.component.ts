import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-hd-thamdinh-router-outlet',
    templateUrl: './hd-thamdinh-router-outlet.component.html',
    styleUrls: ['./hd-thamdinh-router-outlet.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HdThamdinhRouterOutletComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



