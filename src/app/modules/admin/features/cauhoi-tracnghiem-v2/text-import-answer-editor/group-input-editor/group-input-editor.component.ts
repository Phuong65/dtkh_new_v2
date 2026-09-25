import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-group-input-editor',
    templateUrl: './group-input-editor.component.html',
    styleUrls: ['./group-input-editor.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class GroupInputEditorComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



