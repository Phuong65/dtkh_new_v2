import { state } from '@angular/animations';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';


import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { merge, Observable, Subject, switchMap, takeUntil, timer } from "rxjs";
import { SIGN_IN_WITH_THIRD_PARTY_VALUES, SignInThirdPartyName } from "../../login-template-ictu/login-template-ictu.component";
import { APP_CONFIGS, environment, getRoute } from "@env";

import { ProgressBarModule } from "primeng/progressbar";

import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { Token } from '@core/models/auth';

const isRedirectFromSupportedThirdParty: (value: unknown) => boolean = (value: unknown): value is SignInThirdPartyName => {
	return SIGN_IN_WITH_THIRD_PARTY_VALUES.includes(value as SignInThirdPartyName);
}

type RedirectUriCallBackState = 'checking' | 'loading' | 'invalid' | 'error' | 'success';

@Component({
	selector: 'app-redirect-uri-call-back',
	standalone: true,
	imports: [CommonModule, ProgressBarModule],
	templateUrl: './redirect-uri-call-back.component.html',
	styleUrls: ['./redirect-uri-call-back.component.css']
})
export default class RedirectUriCallBackComponent implements OnInit, OnDestroy {



	private auth: AuthService = inject(AuthService);

	private router: Router = inject(Router);

	private activatedRoute: ActivatedRoute = inject(ActivatedRoute);

	private notification: NotificationService = inject(NotificationService);

	private http: HttpClient = inject(HttpClient);

	state: string = "checking";

	// readonly state : WritableSignal<RedirectUriCallBackState> = signal( 'checking' );

	// readonly heading : Signal<string> = computed( () : string => {
	// 	switch ( this.state() ) {
	// 		case "loading":
	// 			return 'Loading...';
	// 		case "invalid":
	// 			return 'Invalid';
	// 		case "error":
	// 			return 'Không thể kết nối với máy chủ.';
	// 		default:
	// 			return 'Processing...';
	// 	}
	// } );

	private sendingObserver: Subject<void> = new Subject();

	private destroy$: Subject<void> = new Subject();

	ngOnInit(): void {
		this.validateParams();
	}

	private validateParams(): void {
		const queryParamMap: ParamMap = this.activatedRoute.snapshot.queryParamMap;
		const source: SignInThirdPartyName = queryParamMap.has('redirect-uri-source') && isRedirectFromSupportedThirdParty(queryParamMap.get('redirect-uri-source')) ? (queryParamMap.get('redirect-uri-source') as SignInThirdPartyName) : null;
		if (source && queryParamMap.get('code')) {
			this.sendCode(queryParamMap.get('code'), source);
		}
		else {
			switch (true) {
				case queryParamMap.has('error'):
					void this.router.navigateByUrl('/auth/login');
					break;
				default:
					this.notification.toastError('Mã xác thực không hợp lệ.', 'Xác thực không thành công');
					void this.router.navigateByUrl('/auth/login');
					break;
			}
		}
	}

	private sendCode(code: string, source: SignInThirdPartyName): void {
		this.state = "loading";
		this.sendingObserver.next();
		const _api: string = getRoute(['login', source].join('-'));
		const _baseUrl: URL = new URL(location.href);
		const endpoint: URL = new URL(_baseUrl.origin);
		endpoint.pathname = 'redirect-uri-call-back';
		endpoint.searchParams.set('redirect-uri-source', source);
		this.http.post<Token>(_api, {
			code: code,
			redirect_uri: endpoint.toString()
		}).pipe(
			switchMap((response: Token): Observable<boolean> => this.auth.startSession(response)),
			takeUntil(
				merge(this.destroy$, this.sendingObserver)
			)
		).subscribe({
			next: (success: boolean): void => {
				if (success) {
					this.notification.toastSuccess('Đăng nhập thành công', 'Thông báo');
					this.redirectAfterLoggedIn(500);
				}
				else {
					this.notification.toastError('Quá trình xác thực bị gián đoạn', 'Xác thực không thành công');
					void this.router.navigateByUrl('/auth/login');
				}
			},
			error: (error: HttpErrorResponse): void => {
				this.state = "error";
				switch (error.status) {
					case 500:
						this.notification.toastError('Máy chủ không phản hồi.', 'Lỗi xác thực');
						void this.router.navigateByUrl('/auth/login');
						break;
					case 401:
						this.notification.toastError('Mã xác thực đã hết hạn.', 'Lỗi xác thực');
						void this.router.navigateByUrl('/auth/login');
						break;
					default:
						void this.router.navigateByUrl('/auth/login');
						break;
				}
			}
		})
	}

	private redirectAfterLoggedIn(delay: number = 0): void {
		timer(delay).pipe(
			takeUntil(this.destroy$)
		).subscribe((): void => {
			void this.router.navigateByUrl(APP_CONFIGS.defaultRedirect);
		});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}
}

