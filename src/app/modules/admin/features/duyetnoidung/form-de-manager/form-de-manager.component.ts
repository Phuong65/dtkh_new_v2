import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-form-de-manager',
    templateUrl: './form-de-manager.component.html',
    styleUrls: ['./form-de-manager.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class FormDeManagerComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



