import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-noidung-hoctap',
    templateUrl: './noidung-hoctap.component.html',
    styleUrls: ['./noidung-hoctap.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class NoidungHoctapComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



