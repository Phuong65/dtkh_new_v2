import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraCuuComponent } from './tra-cuu.component';

describe('TraCuuComponent', () => {
  let component: TraCuuComponent;
  let fixture: ComponentFixture<TraCuuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraCuuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TraCuuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
