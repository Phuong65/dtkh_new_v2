import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyetnoidung-manager',
    templateUrl: './duyetnoidung-manager.component.html',
    styleUrls: ['./duyetnoidung-manager.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetnoidungManagerComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



