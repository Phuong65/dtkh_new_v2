import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-form-de-v2',
    templateUrl: './form-de-v2.component.html',
    styleUrls: ['./form-de-v2.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class FormDeV2Component implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



