import { Component, OnInit } from '@angular/core';

import { FormDeV2Component } from '../form-de-ictu-v2/form-de-v2/form-de-v2.component';

@Component({
    selector: 'app-form-de-main',
    standalone: true,
    imports: [
    FormDeV2Component,
  
],
    templateUrl: './form-de-main.component.html',
    styleUrls: ['./form-de-main.component.css']
})
export class FormDeMainComponent implements OnInit {

    constructor() { }

    ngOnInit(): void {
    }

}
