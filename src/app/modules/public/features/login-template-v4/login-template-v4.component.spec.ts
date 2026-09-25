import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { FileService } from '@core/services/file.service';
import { LoginTemplateV4Component } from './login-template-v4.component';

describe('LoginTemplateV4Component', () => {
  let component: LoginTemplateV4Component;
  let fixture: ComponentFixture<LoginTemplateV4Component>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LoginTemplateV4Component],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: AuthService, useValue: { roles: [], isLoggedIn: () => false, login: () => of({}), removeSession: () => {}, logout: () => {} } },
        { provide: NotificationService, useValue: { confirm: () => Promise.resolve(true), toastError: () => {} } },
        { provide: FileService, useValue: { getFileLocalAsBlob: () => of(new Blob()) } },
        { provide: NgbModal, useValue: { open: () => ({ result: Promise.resolve(true), close: () => {} }) } },
        { provide: Title, useValue: { setTitle: () => {} } }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginTemplateV4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
