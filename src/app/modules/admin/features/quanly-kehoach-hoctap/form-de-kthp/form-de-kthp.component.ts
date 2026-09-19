import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-form-de-kthp',
    templateUrl: './form-de-kthp.component.html',
    styleUrls: ['./form-de-kthp.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class FormDeKthpComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



