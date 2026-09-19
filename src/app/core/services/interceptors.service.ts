import { Injectable } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';
import { HttpHandler, HttpRequest, HttpEvent, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, Subject, debounceTime, of } from 'rxjs';
import { catchError, filter, take, switchMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ACCESS_TOKEN, getHost, REFRESH_TOKEN, X_APP_ID } from '@env';
import { AuthService } from '@core/services/auth.service';
import { crc32 } from '@core/utils/crc32';
import moment from 'moment';

@Injectable({
    providedIn: 'root'
})
export class InterceptorsService {

    private root = getHost();

    private isRefreshing = false;

    private refreshTokenSubject$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

    private observeRemoveCurrentSession$ = new Subject<string>();

    // serverResponseCode: { [T: string]: string } = {
    //     update_fail: 'Update failed',
    //     create_fail: 'Create failed',
    //     delete_fail: 'Delete failed',
    //     auth_fail: 'Login failed',
    //     user_not_found: 'User not found',
    //     user_disable: 'User has been disabled',
    //     user_not_exist: 'User does not exist',
    //     wrong_password: 'Wrong password',
    //     system_error: 'System error',
    //     not_exist: 'Does not exist',
    //     not_found: 'Not found',
    //     forbidden: 'Forbidden',
    //     unauthorized: 'Unauthorized'
    // };

    serverResponseCode: { [T: string]: string } = {
        'update_fail': 'Cập nhật không thành công',
        'create_fail': 'Tạo mới không thành công',
        'delete_fail': 'Xóa không thành công',
        'auth_fail': 'Đăng nhập thất bại',
        'user_not_found': 'Không tìm thấy người dùng',
        'user_disable': 'Người dùng đã bị vô hiệu hóa',
        'user_not_exist': 'người dùng không tồn tại',
        'wrong_password': 'Sai mật khẩu',
        'system_error': 'Lỗi hệ thống',
        'not_exist': 'Không tồn tại',
        'not_found': 'Không tìm thấy',
        'forbidden': 'Cấm truy cập',
        'unauthorized': 'Không được phép truy cập',
        'resume_login_after_5_minutes': 'Đăng nhập lại sau 5 phút',
        'login_has_been_blocked__please_wait_5_minutes_to_continue_logging_in_': 'Đăng nhập bị khóa, Vui lòng đăng nhập lại sau 5 phút',
        'messages-cannot-be-deleted-after-1-hour': 'Tin nhắn không thể xoá sau khi đăng 1 giờ'
    };

    constructor(
        private auth: AuthService,
        private notificationService: NotificationService,
        private router: Router
    ) {
        this.auth.appLanguageSettings().pipe(filter(v => v !== null && v !== undefined), map((res: {
            translations: any
        }) => res.translations ? res.translations.serverResponseCode : this.serverResponseCode)).subscribe({ next: (serverResponseCode: any) => this.serverResponseCode = serverResponseCode });
        this.observeRemoveCurrentSession$.asObservable().pipe(debounceTime(150)).subscribe(() => this.removeSession());
    }

    private ictuHttpHandler(next: HttpHandler, request: HttpRequest<any>, data: any[]): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(switchMap((response: HttpEvent<any>): Observable<HttpEvent<any>> => {
            if (response instanceof HttpResponse && response.body.data) {
                data.push(...response.body.data);
                if (response['body']['count'] && response['body']['count'] === 1000) {
                    const newRequest: HttpRequest<any> = request.clone({ setParams: { paged: response.body['next'].toString(10) } });
                    return this.ictuHttpHandler(next, newRequest, data);
                } else {
                    response['body']['data'] = data;
                    return of(response);
                }
            }
            return of(response);
        }));
    }


    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = localStorage.getItem(ACCESS_TOKEN);

        if (!request.params.get('token') && request.url.startsWith(getHost()) && !request.url.endsWith('refresh-token') && token) {
            request = InterceptorsService.addToken(request, token);
        }

        if (request.url.startsWith(getHost())) {
            request = request.clone({ setHeaders: { 'X-APP-ID': X_APP_ID } });
            // const _d: Date = new Date();
            // request = request.clone( { setHeaders: { 'x-request-signature': crc32( [ JSON.stringify( request.body ), X_APP_ID, _d.getFullYear().toString( 10 ), _d.getMonth().toString( 10 ) ].join( '' ) ) } } );

            if (!request.body && ['POST', 'PUT'].includes(request.method.toUpperCase())) {
                request = request.clone({ body: {} });
            }
            const none: string = (['POST', 'PUT'].includes(request.method.toUpperCase()) ? JSON.stringify(request.body) : '') + X_APP_ID + moment().format('YYYY-MM-DD HH:mm:00');
            request = request.clone({ setHeaders: { 'x-request-signature': crc32(none) } });
        }

        let data = [];

        if (request.params.has('limit') && request.params.get('limit').toString() === '-1') {
            request = request.clone({ setParams: { limit: '1000' } });
        }

        return next.handle(request).pipe(
            switchMap((res: HttpEvent<any>): Observable<any> => {
                if (request.params.has('limit') && request.params.get('limit').toString() === '1000' && res instanceof HttpResponse && res.body.next && res.body.data && res.body.data.length === 1000) {
                    // const previousData: any[] = res.body['data'];
                    // const newRequest: HttpRequest<any> = request.clone({ setParams: { paged: res.body['next'].toString(10) } });
                    // return next.handle(newRequest).pipe(map((nextResponse: HttpEvent<any>) => {
                    //     if (nextResponse instanceof HttpResponse && nextResponse.body.data) {
                    //         nextResponse.body.data = [...previousData, ...nextResponse.body.data];
                    //     }
                    //     return nextResponse;
                    // }));
                    
                    const newRequest: HttpRequest<any> = request.clone({ setParams: { paged: res.body['next'].toString(10) } });
                    return this.ictuHttpHandler(next, newRequest, res.body.data);
                }
                return of(res);
            }),
            catchError(res => {
                if (res instanceof HttpErrorResponse) {
                    const isLoginPage = this.router.isActive('login', { paths: 'subset', queryParams: 'subset', fragment: 'ignored', matrixParams: 'ignored' });


                    if (res.status === 401) {
                        if (res['error'] && res['error']['message'] && res['error']['message'] === 'jwt expired') {
                            this.triggerRemoveSession();
                        } else {
                            if (res.error && res.error['code'] === "unauthorized") {
                                this.notificationService.toastError('Bạn đã đăng nhập trên 1 thiết bị khác , vui lòng đăng nhập lại');
                                this.auth.removeSession();
                                this.auth.logout();
                                this.router.navigate(['login']).then(() => this.notificationService.isProcessing(false), () => this.notificationService.isProcessing(false));
                                return null;
                            }

                            if (localStorage.getItem(REFRESH_TOKEN)) {
                                return this.handle401Error(request, next);
                            } else if (!isLoginPage) {
                                this.triggerRemoveSession();
                            }
                        }
                    }

                    if (res.error.code === 400) {

                    } else if (res.error && res.error['code']) {
                        // const message: string = res.error['message'];
                        if (res.error['message'] === "Sinh viên này đã có trong ca thi.") {

                        } else {
                            const message: string = this.serverResponseCode[res.error['code']] || res.error['message'];

                            if (typeof message === 'string') {
                                this.notificationService.toastError(message);
                            } else if (typeof message === 'object' && Object.keys(message).length) {
                                Object.keys(message).forEach(key => this.notificationService.toastError(message[key]));
                            }
                        }
                    }

                }

                return throwError(res);
            }));
    }

    private triggerRemoveSession() {
        this.observeRemoveCurrentSession$.next('remove');
    }

    private removeSession() {
        this.notificationService.closeALlActiveModal(null);
        this.notificationService.isProcessing(false);
        this.auth.logout().then(() => this.router.navigate(['login']).then(() => this.notificationService.toastInfo(`Phiên làm việc của bạn đã hết hạn \n vui lòng đang nhập lại`, 'Thông báo')));
    }

    private static addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
        return request.clone({ setHeaders: { Authorization: 'Bearer ' + token } });
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject$.next(null);
            return this.auth.refreshTokenActor.pipe(
                switchMap(({ data }) => {
                    this.isRefreshing = false;
                    this.refreshTokenSubject$.next(data);
                    return next.handle(InterceptorsService.addToken(request, data));
                }),
                catchError(err => {
                    this.refreshTokenSubject$.error('Invalid refresh token');
                    return throwError(err);
                })
            );
        } else {
            return this.refreshTokenSubject$.pipe(
                filter(token => token != null),
                take(1),
                switchMap(access_token => next.handle(InterceptorsService.addToken(request, access_token))));
        }
    }
}
