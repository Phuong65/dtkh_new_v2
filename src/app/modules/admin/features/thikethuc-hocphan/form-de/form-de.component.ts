import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-form-de',
    templateUrl: './form-de.component.html',
    styleUrls: ['./form-de.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class FormDeComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



