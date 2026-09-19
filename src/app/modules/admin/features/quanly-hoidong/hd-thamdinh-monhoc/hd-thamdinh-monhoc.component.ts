import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-hd-thamdinh-monhoc',
    templateUrl: './hd-thamdinh-monhoc.component.html',
    styleUrls: ['./hd-thamdinh-monhoc.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HdThamdinhMonhocComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



