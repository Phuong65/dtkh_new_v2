import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-form-de-main',
    templateUrl: './form-de-main.component.html',
    styleUrls: ['./form-de-main.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class FormDeMainComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



