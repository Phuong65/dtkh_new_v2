import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-h-cn-chamtiendo',
    templateUrl: './h-cn-chamtiendo.component.html',
    styleUrls: ['./h-cn-chamtiendo.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HCnChamtiendoComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



