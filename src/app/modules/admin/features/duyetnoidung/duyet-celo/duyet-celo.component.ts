import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-celo',
    templateUrl: './duyet-celo.component.html',
    styleUrls: ['./duyet-celo.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetCeloComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



