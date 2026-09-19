import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-hd-thamdinh-info',
    templateUrl: './hd-thamdinh-info.component.html',
    styleUrls: ['./hd-thamdinh-info.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HdThamdinhInfoComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



