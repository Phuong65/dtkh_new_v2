import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { KhoaHocComponent } from './khoa-hoc.component';

describe('KhoaHocComponent', () => {
  let component: KhoaHocComponent;
  let fixture: ComponentFixture<KhoaHocComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ KhoaHocComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KhoaHocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


