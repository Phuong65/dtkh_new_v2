import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeLcmsComponent } from './home-lcms.component';

describe('HomeLcmsComponent', () => {
  let component: HomeLcmsComponent;
  let fixture: ComponentFixture<HomeLcmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HomeLcmsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeLcmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
