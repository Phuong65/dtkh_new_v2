import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-form-de',
    templateUrl: './duyet-form-de.component.html',
    styleUrls: ['./duyet-form-de.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetFormDeComponent implements OnInit {
    @Input() selectedCourse: unknown;
    @Input() listThamDInh: unknown[];
    @Input() typeForm: string;

    constructor() {}
    ngOnInit(): void {}
}



