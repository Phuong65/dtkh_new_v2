import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NganhBomonComponent } from './nganh-bomon.component';

describe('NganhBomonComponent', () => {
  let component: NganhBomonComponent;
  let fixture: ComponentFixture<NganhBomonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NganhBomonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NganhBomonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
