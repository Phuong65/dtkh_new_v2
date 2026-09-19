import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KehoachComponent } from './kehoach.component';

describe('KehoachComponent', () => {
  let component: KehoachComponent;
  let fixture: ComponentFixture<KehoachComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KehoachComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KehoachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
