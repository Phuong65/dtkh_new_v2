import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-drag-drop-editor',
    templateUrl: './drag-drop-editor.component.html',
    styleUrls: ['./drag-drop-editor.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DragDropEditorComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



