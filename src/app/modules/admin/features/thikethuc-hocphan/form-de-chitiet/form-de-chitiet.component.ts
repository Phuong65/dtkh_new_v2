import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-form-de-chitiet',
    templateUrl: './form-de-chitiet.component.html',
    styleUrls: ['./form-de-chitiet.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class FormDeChitietComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



