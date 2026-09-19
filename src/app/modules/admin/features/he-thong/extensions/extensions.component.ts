import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-extensions',
    templateUrl: './extensions.component.html',
    styleUrls: ['./extensions.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ExtensionsComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



