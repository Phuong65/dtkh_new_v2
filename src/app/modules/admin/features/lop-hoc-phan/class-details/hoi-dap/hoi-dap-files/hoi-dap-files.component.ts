import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-hoi-dap-files',
    templateUrl: './hoi-dap-files.component.html',
    styleUrls: ['./hoi-dap-files.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HoiDapFilesComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



