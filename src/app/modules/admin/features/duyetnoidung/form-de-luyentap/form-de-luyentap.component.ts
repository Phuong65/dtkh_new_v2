import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-form-de-luyentap',
    templateUrl: './form-de-luyentap.component.html',
    styleUrls: ['./form-de-luyentap.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class FormDeLuyentapComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



