import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginTemplateIctuDttxComponent } from './login-template-ictu-dttx.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@core/services/notification.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { of } from 'rxjs';

describe('LoginTemplateIctuDttxComponent', () => {
    let component: LoginTemplateIctuDttxComponent;
    let fixture: ComponentFixture<LoginTemplateIctuDttxComponent>;

    const authServiceMock = {
        roles: [],
        useCases: [],
        isLoggedIn: () => false,
        login: () => of(true),
        googleLogin: () => of(true),
        forgetPassword: () => of(true),
        removeSession: () => {},
        logout: () => {}
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [LoginTemplateIctuDttxComponent],
            imports: [
                ReactiveFormsModule,
                HttpClientTestingModule,
                RouterTestingModule
            ],
            providers: [
                FormBuilder,
                NgbModal,
                { provide: NotificationService, useValue: { confirm: () => Promise.resolve(), toastError: () => {} } },
                { provide: Title, useValue: { setTitle: () => {} } },
                { provide: AuthService, useValue: authServiceMock },
                { provide: FileService, useValue: { getFileLocalAsBlob: () => of(new Blob()) } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LoginTemplateIctuDttxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have universityName as QUẢN LÝ ĐÀO TẠO TỪ XA', () => {
        expect(component.universityName).toBe('QUẢN LÝ ĐÀO TẠO TỪ XA');
    });

    it('should have universitySub as TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG', () => {
        expect(component.universitySub).toBe('TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG');
    });

    it('should have pageTitle as Đăng nhập — Đào tạo từ xa ICTU', () => {
        expect(component.pageTitle).toBe('Đăng nhập — Đào tạo từ xa ICTU');
    });

    it('should initialize loginForm with username and password controls', () => {
        expect(component.loginForm.contains('username')).toBeTruthy();
        expect(component.loginForm.contains('password')).toBeTruthy();
    });

    it('should toggle password visibility', () => {
        expect(component.formFieldPassword.field).toBe('password');
        component.toggleShowPassword();
        expect(component.formFieldPassword.field).toBe('text');
        component.toggleShowPassword();
        expect(component.formFieldPassword.field).toBe('password');
    });
});
