import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-lichhoc-tueba',
    templateUrl: './import-lichhoc.component.html',
    styleUrls: ['./import-lichhoc.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportLichhocComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



