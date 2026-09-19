import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-grouping-editor',
    templateUrl: './grouping-editor.component.html',
    styleUrls: ['./grouping-editor.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class GroupingEditorComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



