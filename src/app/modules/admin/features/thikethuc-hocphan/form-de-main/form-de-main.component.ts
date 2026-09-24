import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormDeComponent } from '../form-de/form-de.component';
import { FormDeV2Component } from '../form-de-ictu-v2/form-de-v2/form-de-v2.component';

@Component({
    selector: 'app-form-de-main',
    standalone: true,
    imports: [
        CommonModule,
        FormDeV2Component,
        FormDeComponent
    ],
    templateUrl: './form-de-main.component.html',
    styleUrls: ['./form-de-main.component.css']
})
export class FormDeMainComponent implements OnInit {

    constructor() { }

    ngOnInit(): void {
    }

}
