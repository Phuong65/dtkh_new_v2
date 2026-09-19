import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-present-question-content-resizeable',
    templateUrl: './present-question-content-resizeable.component.html',
    styleUrls: [ './present-question-content-resizeable.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DragAndDropAreaDivided implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



