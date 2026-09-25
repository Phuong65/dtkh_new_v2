import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-tao-cathi',
    templateUrl: './tao-cathi.component.html',
    styleUrls: ['./tao-cathi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TaoCathiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



