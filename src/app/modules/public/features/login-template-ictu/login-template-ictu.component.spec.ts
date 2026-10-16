import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InputTextModule } from 'primeng/inputtext';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@core/services/notification.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { of } from 'rxjs';

import { LoginTemplateIctuComponent } from './login-template-ictu.component';

describe('LoginTemplateIctuComponent', () => {
  let component: LoginTemplateIctuComponent;
  let fixture: ComponentFixture<LoginTemplateIctuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginTemplateIctuComponent ], imports: [ ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule, InputTextModule ],
      providers: [
        NgbModal,
        { provide: NotificationService, useValue: { toastError: () => {}, confirm: () => Promise.resolve() } },
        { provide: Title, useValue: { setTitle: () => {} } },
        { provide: AuthService, useValue: { roles: [], useCases: [], isLoggedIn: () => false, login: () => of(true), googleLogin: () => of(true), forgetPassword: () => of(true) } },
        { provide: FileService, useValue: { getFileLocalAsJson: () => of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginTemplateIctuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply PrimeNG InputText to the login fields', () => {
    const username: HTMLInputElement = fixture.nativeElement.querySelector('#username');
    const password: HTMLInputElement = fixture.nativeElement.querySelector('#password');

    expect(username.classList.contains('p-inputtext')).toBeTrue();
    expect(password.classList.contains('p-inputtext')).toBeTrue();
  });

  it('should mark required login fields as touched on an empty submit', () => {
    const form: HTMLFormElement = fixture.nativeElement.querySelector('.ictu-login__form');

    form.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(component.loginForm.controls['username'].touched).toBeTrue();
    expect(component.loginForm.controls['password'].touched).toBeTrue();
  });

  it('should toggle the password visibility state', () => {
    expect(component.formFieldPassword.field).toBe('password');

    component.toggleShowPassword();

    expect(component.formFieldPassword.field).toBe('text');
  });

  it('should render non-submit controls for password visibility and Google sign-in', () => {
    const passwordToggle: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="password-toggle"]');
    const googleButton: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="google-sign-in"]');

    expect(passwordToggle.type).toBe('button');
    expect(googleButton.type).toBe('button');
  });
});


