import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-canbothi',
    templateUrl: './import-canbothi.component.html',
    styleUrls: ['./import-canbothi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportCanbothiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



