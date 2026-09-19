import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-kehoach',
    templateUrl: './kehoach.component.html',
    styleUrls: ['./kehoach.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KehoachComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



