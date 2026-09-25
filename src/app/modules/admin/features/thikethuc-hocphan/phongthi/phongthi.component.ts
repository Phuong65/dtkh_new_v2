import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-phongthi',
    templateUrl: './phongthi.component.html',
    styleUrls: ['./phongthi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class PhongthiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



