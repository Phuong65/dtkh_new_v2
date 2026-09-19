import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-form-de-tn-tx',
    templateUrl: './form-de-tn-tx.component.html',
    styleUrls: ['./form-de-tn-tx.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class FormDeTnTxComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



