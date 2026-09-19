import { Component, OnChanges , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-arrange-paragraphs-editor',
    templateUrl: './arrange-paragraphs-editor.component.html',
    styleUrls: ['./arrange-paragraphs-editor.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ArrangeParagraphsEditorComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



