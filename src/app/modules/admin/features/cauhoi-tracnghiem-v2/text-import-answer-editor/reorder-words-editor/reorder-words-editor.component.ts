import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-reorder-words-editor',
    templateUrl: './reorder-words-editor.component.html',
    styleUrls: ['./reorder-words-editor.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ReorderWordsEditorComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



