import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-tao-cathi-duan',
    templateUrl: './tao-cathi-duan.component.html',
    styleUrls: ['./tao-cathi-duan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TaoCathiDuanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



