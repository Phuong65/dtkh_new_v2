import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-hd-thamdinh-manager',
    templateUrl: './hd-thamdinh-manager.component.html',
    styleUrls: ['./hd-thamdinh-manager.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HdThamdinhManagerComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



