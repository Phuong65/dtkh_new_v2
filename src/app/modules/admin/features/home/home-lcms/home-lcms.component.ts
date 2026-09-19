import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-lcms',
    templateUrl: './home-lcms.component.html',
    styleUrls: ['./home-lcms.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeLcmsComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



