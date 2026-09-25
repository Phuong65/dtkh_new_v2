import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-tao-cathi-thuchanh',
    templateUrl: './tao-cathi-thuchanh.component.html',
    styleUrls: ['./tao-cathi-thuchanh.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TaoCathiThuchanhComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



