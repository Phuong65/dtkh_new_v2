import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-chitiet-ctdt',
    templateUrl: './chitiet-ctdt.component.html',
    styleUrls: ['./chitiet-ctdt.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ChitietCtdtComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



