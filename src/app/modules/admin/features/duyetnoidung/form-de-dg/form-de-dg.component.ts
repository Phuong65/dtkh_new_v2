import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-form-de-dg',
    templateUrl: './form-de-dg.component.html',
    styleUrls: ['./form-de-dg.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class FormDeDgComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



