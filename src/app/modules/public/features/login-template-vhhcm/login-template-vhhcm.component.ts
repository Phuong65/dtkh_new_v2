import { Component, ElementRef, NgZone, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, Observable, Subject, takeUntil } from 'rxjs';
import { GoogleSignIn, UserSignIn } from '@core/models/auth';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@core/services/notification.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { APP_CONFIGS, google_client_id, key_server } from '@env';
import { NORMAL_MODAL_OPTIONS } from '@core/utils/syscat';
import { BUTTON_CLOSED } from '@core/models/buttons';
import { FileService } from '@core/services/file.service';
import { DEFAULT_MODAL_OPTIONS, LARGE_MODAL_OPTIONS } from '@modules/shared/utils/syscat';
import { FlickityOptions } from '../ngx-flickity/interfaces/flickity-options.interface';

interface Partner {
    src: string;
    link?: string;
}

interface FieldPasswordState {
    field: 'text' | 'password';
    icon: 'pi pi-eye' | 'pi pi-eye-slash';
    next: 'hide' | 'show';
}

interface FieldPasswordControl {
    hide: FieldPasswordState;
    show: FieldPasswordState;
}

interface LoginButton {
    isLoading: boolean;
    name: 'signIn' | 'googleSignIn';
}

interface LoginBanner {
    src: string,
    heading: string,
    subHeading: string
    btnLabel: string,
    btnLink: string,
}

declare var google: any;

@Component({standalone: false, 
    selector: 'app-login-template-vhhcm',
    templateUrl: './login-template-vhhcm.component.html',
    styleUrls: ['./login-template-vhhcm.component.css']
})
export class LoginTemplateVhhcmComponent implements OnInit {
    partners: any = [{ src: 'assets/images/200x150.png' }];

    @ViewChild('reportForStudent') reportForStudent: ElementRef;

    isRealEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(.\w{2,3})+$/;

    loginForm: FormGroup = this.formBuilder.group({
        username: ['', Validators.required],
        password: ['', Validators.required]
    });

    resetPasswordForm: FormGroup = this.formBuilder.group({
        email: ['', [Validators.required, Validators.pattern(this.isRealEmail)]]
    });

    params?: Params;

    showEmailInvalid = false;

    resetPasswordLoading = false;

    fieldPasswordControl: FieldPasswordControl = {
        hide: {
            field: 'password',
            icon: 'pi pi-eye-slash',
            next: 'show'
        },
        show: {
            field: 'text',
            icon: 'pi pi-eye',
            next: 'hide'
        }
    };

    formFieldPassword = this.fieldPasswordControl.hide;

    signInButton: LoginButton = { isLoading: false, name: 'signIn' };

    googleSignInButton: LoginButton = { isLoading: false, name: 'googleSignIn' };

    currentLoginButton = this.signInButton;

    isLoading = true;

    modalResetPasswordRef?: NgbModalRef;

    login$ = new Subject<UserSignIn>();

    resetPassword$ = new Subject<string>();

    observeCloser$ = new Subject<string>();

    front_end: string;

    enableGoogleSignIn = false;

    slides: any;

    config: FlickityOptions = {
        freeScroll: false,
        wrapAround: true,
        prevNextButtons: true,
        autoPlay: 5000,
        pauseAutoPlayOnHover: false,
        selectedAttraction: 0.01,
        friction: 0.15
    };

    help_url: string = "#";
    constructor(
        private formBuilder: FormBuilder,
        private activatedRoute: ActivatedRoute,
        private modalService: NgbModal,
        private router: Router,
        private notificationService: NotificationService,
        private title: Title,
        private auth: AuthService,
        private ngZone: NgZone,
        private fileService: FileService
    ) {

        this.activatedRoute.queryParams.pipe(takeUntil(this.observeCloser$)).subscribe(params => this.params = params);
        this.login$.pipe(takeUntil(this.observeCloser$), debounceTime(100)).subscribe(info => this.checkLogin(info));
        this.resetPassword$.pipe(takeUntil(this.observeCloser$), debounceTime(100)).subscribe(email => this.requestResetPassword(email));
        this.fileService.getFileLocalAsJson('..\\assets\\json\\config.json?v=' + APP_CONFIGS.appVersion).subscribe(_res => {
            this.help_url = _res['help_url'];
        })

    }

    ngOnInit(): void {
        this.isLoading = false;
        this.checkUserLoginStatus();
    }

    ngAfterViewInit(): void {
        const googleButton = document.getElementById('sign-up-form__btn--google-sign-in');
        if (typeof google !== 'undefined' && google?.accounts?.id) {
            google.accounts.id.initialize({
                client_id: google_client_id,
                callback: (response: any) => this.handleGoogleSignIn(response)
            });

            if (googleButton) {
                google.accounts.id.renderButton(
                    googleButton,
                    { text: 'Đăng nhập', locale: 'vi', size: 'large', type: 'standard', width: '300px', shape: 'rectangular', theme: 'filled_blue', scope: 'profile email', longtitle: true, height: 50 }
                );
            }
        }
    }

    private loadBanners() {
        if (!this.slides) {
            this.fileService.getFileLocalAsJson('..\\assets\\json\\login-slides.json?v=' + APP_CONFIGS.appVersion).subscribe(_res => {
                this.slides = _res;
            })
        }

        if (this.partners) {
            this.fileService.getFileLocalAsJson('..\\assets\\json\\login-partners.json?v=' + APP_CONFIGS.appVersion).subscribe(_res => {
                this.partners = _res;
            })
        }
    }

    onSlideSettle(flickity: { resize: () => void }) {
        flickity.resize();
    }

    checkUserLoginStatus() {
        if (this.auth && this.auth.roles && this.auth.roles.length === 1 && this.auth.roles[0].name === 'student') {
            this.auth.removeSession();
            this.auth.logout();
            this.fileService.getFileLocalAsJson('..\\assets\\json\\front_end.json').subscribe(_res => {
                const json = _res;
                this.front_end = json['url'];
                this.isLoading = false;
                this.currentLoginButton.isLoading = false;
                this.notificationService.confirm('<div><div>Đây là trang dành cho giảng viên, bạn không thể truy cập vào trang này</div><div>Chuyển đến trang dành cho sinh viên <a href="' + this.front_end + '">tại đây</a></div></div>', 'Thông báo').then(() => null, () => null)
            })
            return;
        }

        if (this.auth.isLoggedIn()) {
            const redirect = this.params && this.params.hasOwnProperty('redirect') ? this.params['redirect'] : APP_CONFIGS.defaultRedirect;
            const pageTitle = APP_CONFIGS.pageTitle || 'admin area';
            this.title.setTitle(pageTitle);
            void this.router.navigate([redirect], { queryParams: this.params });
            if (this.currentLoginButton) {
                this.currentLoginButton.isLoading = false;
            }
        } else {
            this.title.setTitle('Đăng nhập');
            this.loadBanners();
            if (this.currentLoginButton) {
                this.currentLoginButton.isLoading = false;
            }
        }
    }

    get f() { return this.loginForm.controls; }

    async btnSignIn(button: LoginButton) {
        if (this.isLoading || button.isLoading) {
            return;
        }
        this.currentLoginButton = button;
        if (button.name === 'signIn' && this.loginForm.valid) {
            const signInfo = {
                username: this.loginForm.controls['username'].value,
                password: this.loginForm.controls['password'].value
            };
            this.login$.next(signInfo);
        } else if (button.name === 'googleSignIn') {
            // const signInfo = await this.socialAuthService.signIn( GoogleLoginProvider.PROVIDER_ID );
            // this.login$.next( signInfo );
        }
    }

    checkLogin(info: UserSignIn) {
        this.isLoading = true;
        console.log(this.isLoading);
        this.currentLoginButton.isLoading = true;
        this.auth.login(info).subscribe({
            next: logged => {
                this.isLoading = false;
                this.checkUserLoginStatus();
            },
            error: error => {
                this.isLoading = false;
                this.currentLoginButton.isLoading = false;
            }
        });
    }

    googleLogin(signIn: GoogleSignIn) {
        this.auth.googleLogin(signIn).subscribe({
            next: () => {
                this.currentLoginButton.isLoading = false;
                void this.checkUserLoginStatus();
            },
            error: () => {
                this.isLoading = false;
                this.currentLoginButton.isLoading = false;
            }
        });
    }

    toggleShowPassword() {
        this.formFieldPassword = this.fieldPasswordControl[this.formFieldPassword.next];
    }

    async openResetPasswordPanel(event: Event, template: TemplateRef<any>) {
        event.preventDefault();
        this.resetPasswordForm.reset({
            email: ''
        });
        this.modalResetPasswordRef = this.modalService.open(template, NORMAL_MODAL_OPTIONS);
        try {
            const status = await this.modalResetPasswordRef.result;
            if (status) {
                const userEmail = this.resetPasswordForm.controls['email'].value;
                const bodyMessage = `<p class="text-muted">Yêu cầu RESET mật khẩu của bạn đã được chấp nhận, Chúng tôi đã gửi đến <b class="text-primary">${userEmail}</b> một email hướng dẫn khôi phục mật khẩu, nếu bạn không nhận được email vui lòng kiểm tra trong Spam.</p>`;
                this.notificationService.confirm(bodyMessage, 'Thao tác thành công', [BUTTON_CLOSED]).then(() => null, () => null);
            }
        } catch (e) {

        }
    }

    closeModalResetPassword() {
        this.modalResetPasswordRef?.close(false);
    }

    checkEmailIsValid(email: string): Observable<boolean> {
        return new Observable<boolean>(observable => {
            observable.next(email ? this.isRealEmail.test(email.toLowerCase()) : true);
            return {
                unsubscribe() { }
            };
        });
    }

    btnClickSendRequestPassword() {
        if (this.resetPasswordForm.valid) {
            this.resetPassword$.next(this.resetPasswordForm.controls['email'].value);
        }
    }

    requestResetPassword(email: string) {
        if (!this.resetPasswordLoading) {
            this.resetPasswordLoading = true;
            this.auth.forgetPassword(email).subscribe({
                next: () => {
                    this.resetPasswordLoading = false;
                    this.modalResetPasswordRef?.close(true);
                },
                error: () => {
                    this.resetPasswordLoading = false;
                    this.notificationService.toastError('Thác tác thất bại');
                }
            });
        }
    }

    ngOnDestroy(): void {
        this.observeCloser$.next('closed');
        this.observeCloser$.complete();
    }

    async handleGoogleSignIn(response: GoogleSignIn) {
        // // This next is for decoding the idToken to an object if you want to see the details.
        // const base64Url   = response.credential.split( '.' )[ 1 ];
        // const base64      = base64Url.replace( /-/g , '+' ).replace( /_/g , '/' );
        // const jsonPayload = decodeURIComponent( atob( base64 ).split( '' ).map( function ( c ) {
        // 	return '%' + ( '00' + c.charCodeAt( 0 ).toString( 16 ) ).slice( -2 );
        // } ).join( '' ) );
        // const token       = JSON.parse( jsonPayload );
        // const signInfo    = { id : token.sub , email : token.email , idToken : response.credential };
        await this.ngZone.run(() => this.googleLogin(response));
    }

    handleInputKeyDown(event: KeyboardEvent) {
        if (event['key'] && event['key'] === 'Enter') {
            event.preventDefault();
            void this.btnSignIn(this.signInButton);
        }
    }

    showPassword(show: boolean) {
        this.formFieldPassword = show ? this.fieldPasswordControl.show : this.fieldPasswordControl.hide;
    }

}
