import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginTemplateV4Component } from './login-template-v4.component';

describe('LoginTemplateV4Component', () => {
  let component: LoginTemplateV4Component;
  let fixture: ComponentFixture<LoginTemplateV4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginTemplateV4Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginTemplateV4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
