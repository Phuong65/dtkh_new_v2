import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-theodoi-tiendo',
    templateUrl: './theodoi-tiendo.component.html',
    styleUrls: ['./theodoi-tiendo.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TheodoiTiendoComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



