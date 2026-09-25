import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuyetCauhoiThuchanhKthpComponent } from './duyet-cauhoi-thuchanh-kthp.component';

describe('DuyetCauhoiThuchanhKthpComponent', () => {
  let component: DuyetCauhoiThuchanhKthpComponent;
  let fixture: ComponentFixture<DuyetCauhoiThuchanhKthpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DuyetCauhoiThuchanhKthpComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuyetCauhoiThuchanhKthpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
