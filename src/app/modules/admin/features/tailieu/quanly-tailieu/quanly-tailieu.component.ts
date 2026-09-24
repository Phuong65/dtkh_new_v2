import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SharedModule } from '@modules/shared/shared.module';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule],
  selector: 'app-quanly-tailieu',
  templateUrl: './quanly-tailieu.component.html',
  styleUrls: ['./quanly-tailieu.component.css'],
  providers: [
    NgbActiveModal,
  ]
})
export class QuanlyTailieuComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
