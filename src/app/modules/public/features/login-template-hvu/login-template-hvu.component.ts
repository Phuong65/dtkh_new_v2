import { Component, ElementRef, NgZone, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap/modal/modal-ref';
import { debounceTime, map, Observable, Subject, takeUntil } from 'rxjs';
import { GoogleSignIn, UserSignIn } from '@core/models/auth';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@core/services/notification.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { APP_CONFIGS, getRoute, google_client_id } from '@env';
import { NORMAL_MODAL_OPTIONS } from '@core/utils/syscat';
import { BUTTON_CLOSED } from '@core/models/buttons';
import { FileService } from '@core/services/file.service';
import { DEFAULT_MODAL_OPTIONS, LARGE_MODAL_OPTIONS } from '@modules/shared/utils/syscat';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SignInThirdPartyName } from '../login-template-ictu/login-template-ictu.component';


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

declare var google: any;

interface SignInThirdPartyResponse {
    code: string,
    data: string,
    message: string,
}

@Component({
    selector: 'app-login-template-hvu',
    templateUrl: './login-template-hvu.component.html',
    styleUrls: ['./login-template-hvu.component.css']
})

export class LoginTemplateHvuComponent implements OnInit {

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

    private signInWithThirdPartyObserver: Subject<SignInThirdPartyName> = new Subject<SignInThirdPartyName>();

    constructor(
        private formBuilder: FormBuilder,
        private activatedRoute: ActivatedRoute,
        private modalService: NgbModal,
        private router: Router,
        private notificationService: NotificationService,
        private title: Title,
        private auth: AuthService,
        private ngZone: NgZone,
        private fileService: FileService,
        private http: HttpClient
    ) {

        this.activatedRoute.queryParams.pipe(takeUntil(this.observeCloser$)).subscribe(params => this.params = params);
        this.login$.pipe(takeUntil(this.observeCloser$), debounceTime(100)).subscribe(info => this.checkLogin(info));
        this.resetPassword$.pipe(takeUntil(this.observeCloser$), debounceTime(100)).subscribe(email => this.requestResetPassword(email));
        this.signInWithThirdPartyObserver.asObservable().pipe(
            debounceTime(200),
            takeUntil(this.observeCloser$)
        ).subscribe((source: SignInThirdPartyName): void => {
            this.handleSignInWithThirdPartyAccounts(source);
        });
    }

    ngOnInit(): void {
        this.isLoading = false;
        this.checkUserLoginStatus();
    }

    ngAfterViewInit(): void {
        google.accounts.id.initialize({
            client_id: google_client_id,
            callback: (response: any) => this.handleGoogleSignIn(response)
        });

        google.accounts.id.renderButton(
            document.getElementById('sign-up-form__btn--google-sign-in'),
            { text: 'Đăng nhập', locale: 'vi', size: 'large', type: 'standard', width: '300px', shape: 'rectangular', theme: 'filled_blue', scope: 'profile email', longtitle: true, height: 50 }  // customization attributes
        );
    }

    checkUserLoginStatus() {
        if (this.auth && this.auth.roles && this.auth.roles.length === 1 && this.auth.roles[0].name === 'student') {
            this.auth.removeSession();
            this.auth.logout();
            this.fileService.getFileLocalAsBlob('..\\assets\\json\\front_end.json').subscribe(_res => {
                const reader = new FileReader();
                reader.readAsText(_res);
                reader.onloadend = (event) => {
                    const localUrl = reader.result;
                    const json = JSON.parse(localUrl.toString());
                    this.front_end = json.url;
                    this.isLoading = false;
                    this.currentLoginButton.isLoading = false;
                    this.notificationService.confirm('<div><div>Đây là trang dành cho giảng viên, bạn không thể truy cập vào trang này</div><div>Chuyển đến trang dành cho sinh viên <a href="' + this.front_end + '">tại đây</a></div></div>', 'Thông báo').then(() => null, () => null)
                };
            })
            return;
        }

        if (this.auth.isLoggedIn()) {
            let url = '/admin';
            if (this.auth.useCases.length) {
                url = url.concat("/", this.auth.useCases[0].url, "/dashboard");
            }
            const redirect = this.params && this.params.hasOwnProperty('redirect') ? this.params['redirect'] : url;
            const pageTitle = APP_CONFIGS.pageTitle || 'admin area';
            this.title.setTitle(pageTitle);
            void this.router.navigate([redirect], { queryParams: this.params });
            if (this.currentLoginButton) {
                this.currentLoginButton.isLoading = false;
            }
        } else {
            this.title.setTitle('Đăng nhập');
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

    btnSignInWithThirdPartyAccounts(source: SignInThirdPartyName): void {
        this.isLoading = true;
        this.signInWithThirdPartyObserver.next(source);
    }

    private handleSignInWithThirdPartyAccounts(source: SignInThirdPartyName): void {
        const _baseUrl: URL = new URL(location.href);
        const endpoint: URL = new URL(_baseUrl.origin);
        endpoint.pathname = 'redirect-uri-call-back';
        endpoint.searchParams.set('redirect-uri-source', source);
        const params: HttpParams = new HttpParams({
            fromObject: {
                redirect_uri: endpoint.toString()
            }
        });
        const _api: string = getRoute(['login', source].join('-'));
        this.http.get<SignInThirdPartyResponse>(_api, { params }).pipe(
            map((response: SignInThirdPartyResponse): string => {
                return response.data && (/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig).test(response.data) ? response.data : null;
            }),
            takeUntil(this.observeCloser$)
        ).subscribe({
            next: (url: string): void => {
                if (url) {
                    location.assign(url);
                    setTimeout((): void => {
                        if (this.isLoading) {
                            this.isLoading = false;
                        }
                    }, 500);
                }
                else {
                    this.isLoading = false;
                    this.notificationService.toastError('Định dạng đường dẫn đăng nhập không đúng');
                }
            },
            error: (): void => {
                this.isLoading = false;
            }
        });
    }
}
