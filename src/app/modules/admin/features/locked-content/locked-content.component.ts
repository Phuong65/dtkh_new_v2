import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-locked-content',
    templateUrl: './locked-content.component.html',
    styleUrls: ['./locked-content.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class LockedContentComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



