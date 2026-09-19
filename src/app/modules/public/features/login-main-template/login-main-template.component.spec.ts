import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginMainTemplateComponent } from './login-main-template.component';

describe('LoginMainTemplateComponent', () => {
  let component: LoginMainTemplateComponent;
  let fixture: ComponentFixture<LoginMainTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginMainTemplateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginMainTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
