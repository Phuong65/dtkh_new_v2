import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-inputbox-editor',
    templateUrl: './inputbox-editor.component.html',
    styleUrls: ['./inputbox-editor.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class InputboxEditorComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



