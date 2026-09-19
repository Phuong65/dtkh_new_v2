import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-hoidong-duyet',
    templateUrl: './import-hoidong-duyet.component.html',
    styleUrls: ['./import-hoidong-duyet.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportHoidongDuyetComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



