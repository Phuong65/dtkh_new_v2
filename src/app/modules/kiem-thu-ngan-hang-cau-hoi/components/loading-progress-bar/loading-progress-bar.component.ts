import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-loading-progress-bar',
    templateUrl: './loading-progress-bar.component.html',
    styleUrls: [ './loading-progress-bar.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class LoadingProgressBarComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



