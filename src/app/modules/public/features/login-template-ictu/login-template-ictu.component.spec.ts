import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginTemplateIctuComponent } from './login-template-ictu.component';

describe('LoginTemplateIctuComponent', () => {
  let component: LoginTemplateIctuComponent;
  let fixture: ComponentFixture<LoginTemplateIctuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginTemplateIctuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginTemplateIctuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
