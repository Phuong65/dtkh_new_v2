
import { NotificationService } from './notification.service';
import { Injectable } from '@angular/core';
import { UserSignIn, GoogleSignIn, Auth, Permission, Token, SimpleRole } from '@core/models/auth';
import { of, Observable, distinctUntilChanged, debounceTime, switchMap, forkJoin, BehaviorSubject, mergeMap, Subject, firstValueFrom } from 'rxjs';
import { catchError, filter, map, tap } from 'rxjs/operators';
import { APP_STORES, UCASE_KEY, ROLES_KEY, ENCRYPT_KEY, USER_KEY, EXPIRED_KEY, META_KEY, APP_CONFIGS, ACCESS_TOKEN, REFRESH_TOKEN, getRoute, SWITCH_DONVI_ID, ACCEPT_ROUTER, PASS_ROOMS } from '@env';
import { User, UserMeta } from '@core/models/user';
import { Ucase, UcaseAdvance } from '@core/models/ucase';
import { UserService } from '@core/services/user.service';
import * as CryptoJS from 'crypto-js';
import { TranslateService } from '@ngx-translate/core';
import { LangChangeEvent } from '@ngx-translate/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Dto } from '@core/models/dto';
import { CLOUD_STORAGE_KEY } from '../../../environments/environment.prod';
import { TREE } from '@modules/shared/components/tree-custom/tree-custom.component';
import { SystemConfig, SysConfigsService } from '@modules/shared/services/sys-configs.service';
import { rotateCarouselToBottom } from '@modules/shared/animations/router-animations';
import { BUTTON_CLOSED, BUTTON_CONFIRMED, BUTTON_UPDATE, BUTTON_YES } from '@core/models/buttons';
import { Classes } from '@modules/shared/models/classes';
import { MENU_TEST_V2 } from '@modules/shared/models/menu-test';
import { Router } from '@angular/router';

interface AppChangeLangEvent {
    lang: string;
    updateMetaData: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private jwtHelper = new JwtHelperService();

    private _user: User;

    private _userMeta: UserMeta[];

    private auth: Auth;

    private _languageSettings: LangChangeEvent;

    private appLanguage$ = new BehaviorSubject<LangChangeEvent>(null);

    private triggerChangeLanguages$ = new Subject<AppChangeLangEvent>();

    private onSetUser$ = new BehaviorSubject<User>(null);

    private onSignIn$ = new BehaviorSubject<string>(null);

    private onSignOut$ = new BehaviorSubject<string>(null);

    private _roles: SimpleRole[] = [];

    private _useCases: Ucase[] = [];

    private _mapPms = new Map<string, UcaseAdvance>();

    private _options: {};

    private current_folder: TREE;

    private secondary_feature: string;

    private onSetFolder$ = new BehaviorSubject<TREE>(null);

    private onSetSecondaryfeature$ = new BehaviorSubject<string>(null);

    private sysConfigs: SystemConfig[];

    constructor(
        private userService: UserService,
        private translate: TranslateService,
        private http: HttpClient,
        private sysConfigsService: SysConfigsService,
        private notificationService: NotificationService,
        private router: Router
    ) {
        this.translate.onLangChange.asObservable().pipe(distinctUntilChanged()).subscribe(settings => this.setLanguageSettings(settings));
        this.triggerChangeLanguages$.asObservable().pipe(filter(value => value !== undefined && value !== null), debounceTime(100), mergeMap(lang => this.updateUserMetaLanguage(lang))).subscribe(lang => this.translate.use(lang));


        if (this.__isTokenNotExpiredYet()) {
            // load stored data
            this.loadStoredUserLanguage();
            this.loadStoredUseCases();
            this.loadStoredRoles();
            this.loadStoredUser();
            this.loadStoredUserMeta();
            if (this.isLoggedIn()) {
                this.onSignIn$.next(this.accessToken);
            }
            this.checkAppVersion();
        } else {
            this.removeSession();
        }

    }

    login(user: UserSignIn): Observable<boolean> {
        return this.http.post<Auth>(getRoute('login'), user).pipe(
            switchMap(auth => this.startSession(auth)),
            catchError(() => of(false))
        );
    }

    googleLogin(signIn: GoogleSignIn): Observable<boolean> {
        return this.http.post<Auth>(getRoute('login-google'), signIn).pipe(
            switchMap(auth => this.startSession(auth)),
            catchError(() => of(false))
        );
    }

    async logout(): Promise<boolean> {
        if (!this.accessToken) {
            return Promise.resolve(true);
        }
        try {
            await firstValueFrom(this.http.post<any>(getRoute('logout'), null));
            this.removeSession();
            return Promise.resolve(true);
        } catch {
            this.removeSession();
            return Promise.resolve(false);
        }
    }

    private __isTokenNotExpiredYet(): boolean {
        let isLoggedIn: boolean;
        if (this.refreshToken) {
            isLoggedIn = this.accessToken && !this.jwtHelper.isTokenExpired(this.accessToken);
        } else {
            const time = localStorage.getItem(EXPIRED_KEY);
            const expired = time ? new Date(time) : new Date();
            isLoggedIn = expired && expired > new Date();
        }
        return isLoggedIn;
    }

    isLoggedIn(): boolean {
        return !!(this.accessToken);
    }

    get accessToken(): string {
        return localStorage.getItem(ACCESS_TOKEN);
    }

    set accessToken(token: string) {
        localStorage.setItem(ACCESS_TOKEN, token);
    }

    get refreshToken(): string {
        return localStorage.getItem(REFRESH_TOKEN);
    }

    set refreshToken(token: string) {
        localStorage.setItem(REFRESH_TOKEN, token);
    }

    get refreshTokenActor() {
        return this.http.post<{ data: string }>(getRoute('refresh-token'), { 'refresh_token': this.refreshToken }).pipe(tap(({ data }) => this.accessToken = data));
    }

    startSession(info: Auth | Token): Observable<boolean> {
        let userInfo$: Observable<User>;
        // if ( info.hasOwnProperty( 'access_token' ) ) {
        if ('access_token' in info) {
            userInfo$ = this.saveToken(info as Token);
            this.onSignIn$.next(info['access_token']);
        } else {
            userInfo$ = this.saveAuth(info as Auth);
            this.onSignIn$.next(info['session_id']);
        }

        const loadUserMeta$: Observable<UserMeta[]> = this.userService.getUserMeta();
        const loadUserPermissions$: Observable<Permission> = this.http.get<Permission>(getRoute('permission'));
        const loadSysConfigs$: Observable<SystemConfig[]> = this.sysConfigsService.getAppConfigs('config_key,title,value');
        return forkJoin<[User, UserMeta[], Permission, SystemConfig[]]>([userInfo$, loadUserMeta$, loadUserPermissions$, loadSysConfigs$]).pipe(tap(([user, meta, { data }, sysConfigs]) => {
            if (data.roles && data.roles.length === 1 && data.roles[0].name === 'student') {

                // return;
            }
            this.updateUser(user);
            // const menu = menus.map( o => {
            // 	if ( o.id === 'he-thong' ) {
            // 		o.child = o.child.filter( i => i.id !== 'he-thong/quan-ly-nhom-quyen' );
            // 	}
            // 	return o;
            // } );

            // const a = [
            // 	{
            // 		id       : 'dashboard' ,
            // 		title    : 'Dashboard' ,
            // 		icon     : 'fa fa-tachometer' ,
            // 		position : 'left',
            // 		hide     : false ,
            // 	} ,
            // 	{
            // 		id       : 'he-thong' ,
            // 		title    : 'Hệ thống' ,
            // 		icon     : 'fa fa-cogs' ,
            // 		position : 'left' ,
            // 		hide     : false ,
            // 		child    : [
            // 			{
            // 				id       : 'he-thong/thong-tin-tai-khoan' ,
            // 				title    : 'Thông tin tài khoản' ,
            // 				icon     : 'fa fa-key' ,
            // 				hide     : false ,
            // 				position : 'left'
            // 			} ,
            // 			{
            // 				id       : 'he-thong/quan-ly-nhom-quyen' ,
            // 				title    : 'Quản lý nhóm quyền' ,
            // 				icon     : 'fa fa-users' ,
            // 				hide     : false ,
            // 				position : 'left'
            // 			} ,
            // 			{
            // 				id       : 'he-thong/quan-ly-tai-khoan' ,
            // 				title    : 'Quản lý tài khoản' ,
            // 				icon     : 'fa fa-wrench' ,
            // 				hide     : false ,
            // 				position : 'left'
            // 			} ,
            // 			{
            // 				id       : 'he-thong/thong-tin-he-thong' ,
            // 				title    : 'Thông tin hệ thống' ,
            // 				icon     : 'fa fa-user-circle-o' ,
            // 				hide     : false ,
            // 				position : 'left'
            // 			}
            // 		]
            // 	} ,
            // 	{
            // 		id       : 'message' ,
            // 		title    : 'Tin nhắn' ,
            // 		icon     : 'fa fa-comments-o' ,
            // 		position : 'left' ,
            // 		hide     : false ,
            // 		child    : [
            // 			{
            // 				id       : 'message/notifications' ,
            // 				title    : 'Thông báo' ,
            // 				icon     : 'fa fa-bell-o' ,
            // 				hide     : false ,
            // 				position : 'left'
            // 			} ,
            // 			{
            // 				id       : 'message/notification-details' ,
            // 				title    : 'Chi tiết Thông báo' ,
            // 				icon     : 'fa fa-bell-o' ,
            // 				hide     : true ,
            // 				position : 'left'
            // 			} ,
            // 			{
            // 				id       : 'message/chat' ,
            // 				title    : 'Trò chuyện' ,
            // 				icon     : 'fa fa-commenting-o' ,
            // 				hide     : false ,
            // 				position : 'left'
            // 			}
            // 		]
            // 	}
            // ];
            //
            // const defaultFeature = {
            // 	id       : 'message' ,
            // 	title    : 'Tin nhắn' ,
            // 	icon     : 'fa fa-comments-o' ,
            // 	position : 'left' ,
            // 	pms      : [ 1 , 1 , 1 , 1 ] ,
            // 	child    : [
            // 		{
            // 			id       : 'message/notifications' ,
            // 			title    : 'Thông báo' ,
            // 			icon     : 'fa fa-bell-o' ,
            // 			position : 'left' ,
            // 			pms      : [ 1 , 1 , 1 , 1 ]
            // 		} ,
            // 		{
            // 			id       : 'message/chat' ,
            // 			title    : 'Trò chuyện' ,
            // 			icon     : 'fa fa-commenting-o' ,
            // 			position : 'left' ,
            // 			pms      : [ 1 , 1 , 1 , 1 ]
            // 		}
            // 	]
            // };
            // menu.push( defaultFeature );
            if (APP_CONFIGS.multiLanguage) {
                const metaLang = meta.find(m => m.meta_key === APP_CONFIGS.metaKeyLanguage);
                const lang = metaLang ? metaLang.meta_value : APP_CONFIGS.defaultLanguage.name;
                this.storeUserLanguage(lang, false);
            } else {
                this.storeUserLanguage(APP_CONFIGS.defaultLanguage.name, false);
            }
            this.setUserMeta(meta);
            this.storeRoles(data.roles);
            this.storeUseCases(data.menus);
            this.setSysConfigs(sysConfigs);
            this.checkAppVersion();
        }), map(() => true));
    }

    syncUserMeta() {
        this.userService.getUserMeta().subscribe(meta => this.setUserMeta(meta));
    }

    updateUserMeta(data: UserMeta): Observable<UserMeta[]> {
        return this.userService.updateMeta(data).pipe(switchMap(() => this.userService.getUserMeta()), tap(meta => this.setUserMeta(meta)));
    }

    removeSession() {
        this.onSignOut$.next('removeSession');
        this.auth = null;
        this.user = null;
        this._roles = [];
        this._useCases = [];
        this._mapPms.clear();
        this.current_folder = null;
        this.secondary_feature = null;
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(EXPIRED_KEY);
        localStorage.removeItem(UCASE_KEY);
        localStorage.removeItem(ROLES_KEY);
        localStorage.removeItem(META_KEY);
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem(CLOUD_STORAGE_KEY);
        localStorage.removeItem(PASS_ROOMS);
        this.clearSysConfigs();
    }

    forgetPassword(email: string): Observable<any> {
        const home_url = location.protocol + '//' + location.host;
        const callback = location.protocol + '//' + location.host + '/reset-password';
        return this.http.post(getRoute('forget-password'), { to: email, callback, home_url });
    }

    get user(): User {
        return this._user;
    }

    set user(user: User) {
        this._user = JSON.parse(JSON.stringify(user));
        if (user) {
            const none = new Date().valueOf();
            this._user.avatar = user.avatar ? [user.avatar, '?v=', none.toString()].join('') : '../../assets/images/a_none.jpg';
            this.onSetUser$.next(this._user);
        }
    }

    updateUser(user: User) {
        this.user = user;
        const encrypt = this.encryptData(JSON.stringify(user));
        localStorage.setItem(USER_KEY, encrypt);
    }

    onSetUpUser(): Observable<User> {
        return this.onSetUser$;
    }

    private saveToken(token: Token): Observable<User> {
        // this.updateUser( auth.user );
        // const { data } : { data : User } = this.jwtHelper.decodeToken( token.access_token );
        const { user_id }: { exp: number; iat: number; session_id: string; user_id: number; } = this.jwtHelper.decodeToken(token.access_token);

        // this.updateUser( extracted.data );
        this.accessToken = token.access_token;
        this.refreshToken = token.refresh_token;
        localStorage.removeItem(EXPIRED_KEY);
        return this.http.get<Dto>(getRoute('profile')).pipe(map(res => Array.isArray(res.data) ? res.data[0] : res.data));
    }

    private saveAuth(auth: Auth): Observable<User> {
        // this.updateUser( auth.user );
        localStorage.setItem(ACCESS_TOKEN, auth.session_id);
        localStorage.setItem(EXPIRED_KEY, auth.expires);
        localStorage.removeItem(REFRESH_TOKEN);
        return of(auth.data);
    }

    private loadStoredUser() {
        const u = localStorage.getItem(USER_KEY);
        const decrypt = u ? this.decryptData(u) : null;
        this.user = decrypt ? JSON.parse(decrypt) : null;
    }

    private storeRoles(roles: SimpleRole[]) {
        this._roles = roles;
        const _data = (roles && roles.length) ? roles : [];
        const encrypt = this.encryptData(JSON.stringify(_data));
        localStorage.setItem(ROLES_KEY, encrypt);
    }

    get roles(): SimpleRole[] {
        return this._roles;
    }

    private loadStoredRoles() {
        const stored = localStorage.getItem(ROLES_KEY);
        const decrypt = stored ? this.decryptData(stored) : '';
        this._roles = decrypt ? JSON.parse(decrypt) : [];
    }

    private storeUseCases(useCases: Ucase[]) {
        this.setUseCases(useCases);
        const _data = (useCases && useCases.length) ? useCases : [];
        const encrypt = this.encryptData(JSON.stringify(_data));
        localStorage.setItem(UCASE_KEY, encrypt);
    }

    get useCases(): Ucase[] {
        return this._useCases;
    }

    private setUseCases(useCases: Ucase[]) {
        // Menu test
        // const menu_test_v2 = MENU_TEST_V2;
        // menu_test_v2.forEach(f => {
        //     f['pms'] = [1, 1, 1, 1];
        //     if (f['child'] && f['child'].length)
        //         f['child'].forEach(c => {
        //             c['pms'] = [1, 1, 1, 1];
        //         })
        // })
        this._useCases = useCases;
        this._mapPms.clear();
        useCases.forEach(node => {
            this._mapPms.set(node['url'], {
                id: node.id,
                url: node['url'],
                icon: node.icon,
                title: node.title,
                position: node['position'],
                pms: node['pms'],
                canAccess: !!(node['pms'][0]),
                canAdd: !!(node['pms'][1]),
                canEdit: !!(node['pms'][2]),
                canDelete: !!(node['pms'][3])
            });
            if (node.child && node.child.length) {
                node.child.forEach(child => this._mapPms.set(node.url.concat("/", child.url), {
                    id: child.id,
                    url: node.url.concat("/", child.url),
                    icon: child.icon,
                    title: child.title,
                    position: child['position'],
                    parent_id: node.id,
                    pms: child['pms'],
                    canAccess: !!(child['pms'][0]),
                    canAdd: !!(child['pms'][1]),
                    canEdit: !!(child['pms'][2]),
                    canDelete: !!(child['pms'][3])
                }));
            }
        });
    }

    private loadStoredUseCases() {
        const stored = localStorage.getItem(UCASE_KEY);
        const decrypt = stored ? this.decryptData(stored) : '';
        this.setUseCases(decrypt ? JSON.parse(decrypt) : []);
    }

    userCanAccess(route: string): boolean {
        const ar_route = route.split("/");
        if (route === 'huong-dan' || (ar_route[1] && ar_route[1] === 'dashboard')) {
            return true;
        }

        if (ar_route.length > 2) {
            ar_route.splice(0, 2);
            const index = ACCEPT_ROUTER.findIndex(m => m === ar_route.join("/"));
            if (index !== -1) {
                return true;
            }
        }

        if (this._mapPms.size === 0 || !this._mapPms.has(route)) {
            return false;
        }

        return this._mapPms.get(route).canAccess;
    }

    userCanAdd(route: string): boolean {
        if (this._mapPms.size === 0 || !this._mapPms.has(route)) {
            return false;
        }
        return this._mapPms.get(route).canAdd;
    }

    userCanEdit(route: string): boolean {
        if (this._mapPms.size === 0 || !this._mapPms.has(route)) {
            return false;
        }
        return this._mapPms.get(route).canEdit;
    }

    userCanDelete(route: string): boolean {
        if (this._mapPms.size === 0 || !this._mapPms.has(route)) {
            return false;
        }
        return this._mapPms.get(route).canDelete;
    }

    getUseCase(route: string): Ucase {
        return this._mapPms.get(route);
    }

    userHasRole(roleName: string): boolean {
        return -1 !== this._roles.findIndex(({ name }) => roleName === name);
    }

    get userLanguage(): LangChangeEvent {
        return this._languageSettings;
    }

    appLanguageSettings(): Observable<LangChangeEvent> {
        return this.appLanguage$.asObservable();
    }

    setLanguageSettings(settings: LangChangeEvent) {
        this._languageSettings = settings;
        this.appLanguage$.next(settings);
    }

    changeUserLanguage(lang: string) {
        this.storeUserLanguage(lang, true);
    }

    storeUserLanguage(lang: string, updateMetaData = false) {
        // localStorage.setItem( 'lang' , lang );
        this.triggerChangeLanguages$.next({ lang, updateMetaData });
    }

    loadStoredUserLanguage() {
        let stored = APP_CONFIGS.multiLanguage ? localStorage.getItem('lang') : APP_CONFIGS.defaultLanguage.name;
        this.triggerChangeLanguages$.next({
            lang: stored || APP_CONFIGS.defaultLanguage.name,
            updateMetaData: false
        });
    }

    get userMeta(): UserMeta[] {
        return this._userMeta;
    }

    setUserMeta(meta: UserMeta[]) {
        this._userMeta = meta;
        const _data = (meta && meta.length) ? meta : [];
        const encrypt = this.encryptData(JSON.stringify(_data));
        localStorage.setItem(META_KEY, encrypt);
    }

    get cloudStore(): string {
        const meta = this._userMeta && Array.isArray(this._userMeta) ? this._userMeta.find(m => m.meta_key === APP_CONFIGS.metaKeyStore) : null;
        return meta ? meta.meta_value : null;
    }

    private loadStoredUserMeta() {
        const stored = localStorage.getItem(META_KEY);
        const decrypt = stored ? this.decryptData(stored) : '';
        this._userMeta = decrypt ? JSON.parse(decrypt) : [];
    }

    encryptData(data: string): string {

        // const raw = 'Ban tin goc ban dau';
        // const key = '12345678901234567890123456789012';
        // const _key         = CryptoJS.enc.Utf8.parse( ENCRYPT_KEY );
        // const encryptedECB = CryptoJS.AES.encrypt( raw.trim() , _key , {
        // 	mode    : CryptoJS.mode.ECB ,
        // 	padding : CryptoJS.pad.NoPadding
        // } ).toString();

        try {
            return CryptoJS.AES.encrypt(data, ENCRYPT_KEY).toString();
        } catch (e) {
            return '';
        }
    }

    decryptData(data: string): string {
        try {
            const bytes = CryptoJS.AES.decrypt(data, ENCRYPT_KEY);
            if (bytes.toString()) {
                return bytes.toString(CryptoJS.enc.Utf8);
            }
            return data;
        } catch (e) {
            return '';
        }
    }

    getOption(keyName: string) {
        this.getStoredAuthOptions();
        return !!(keyName && this._options[keyName]) ? this._options[keyName] : null;
    }

    setOption(keyName: string, value: any) {
        this.getStoredAuthOptions();
        this._options[keyName] = value;
        const encrypt = this.encryptData(JSON.stringify(this._options));
        localStorage.setItem(APP_STORES, encrypt);
    }

    private getStoredAuthOptions() {
        if (!this._options) {
            const stored = localStorage.getItem(APP_STORES);
            const decrypt = stored ? this.decryptData(stored) : '';
            this._options = decrypt ? JSON.parse(decrypt) : {};
        }
        return this._options;
    }

    private updateUserMetaLanguage(settings: AppChangeLangEvent): Observable<string> {
        if (this.user && settings.updateMetaData) {
            return this.userService.updateMeta({
                user_id: this.user.id,
                meta_key: APP_CONFIGS.metaKeyLanguage,
                meta_title: 'User language',
                meta_value: settings.lang
            }).pipe(tap(() => localStorage.setItem('lang', settings.lang)), map(() => settings.lang));
        } else {
            return of(settings.lang);
        }
    }

    get onSignIn(): Observable<string> {
        return this.onSignIn$;
    }

    get onSignOut(): Observable<string> {
        return this.onSignOut$;
    }

    resetPassword(info: { token: string, password: string, password_confirmation: string }): Observable<any> {
        return this.http.post(getRoute('reset-password'), info);
    }

    get userDonViId(): number {
        return (this.roles && -1 !== this.roles.findIndex(({ name }) => name === 'admin') && localStorage.getItem(SWITCH_DONVI_ID)) ? parseInt(localStorage.getItem(SWITCH_DONVI_ID), 10) : this.user.donvi_id;
    }

    get currentFolder(): TREE {
        return this.current_folder;
    }

    set currentFolder(folder: TREE) {
        this.current_folder = folder;
        if (folder) {
            this.onSetFolder$.next(this.current_folder);
        }
    }

    getFeatureSecondary(): Observable<string> {
        return this.onSetSecondaryfeature$.asObservable();
    }


    setFeatureSecondary(title: string) {
        this.secondary_feature = title;
        if (title) {
            this.onSetSecondaryfeature$.next(this.secondary_feature);
        }
    }

    getSysConfigValue(config_key: string, _default: number = 0): number {
        const cfg = this.sysConfigs && Array.isArray(this.sysConfigs) ? this.sysConfigs.find(i => i.config_key === config_key) : null;
        return cfg ? cfg.value : _default;
    }

    getSysConfigParams(config_key: string, _default: number = 0): number {
        const cfg = this.sysConfigs && Array.isArray(this.sysConfigs) ? this.sysConfigs.find(i => i.config_key === config_key) : null;
        return cfg ? cfg.params : _default;
    }

    clearSysConfigs(): void {
        this.sysConfigs = null;
        localStorage.removeItem('--app_configs-' + APP_CONFIGS.realm);
    }

    setSysConfigs(configs: SystemConfig[]): void {
        this.sysConfigs = configs;
        // const encrypt : string = this.encryptData( JSON.stringify( configs ) );
        // localStorage.setItem( '--app_configs-' + APP_CONFIGS.realm , encrypt );
        localStorage.setItem('--app_configs-' + APP_CONFIGS.realm, JSON.stringify(configs));
    }

    forceReload() {
        const url: URL = new URL(window.location.toString());
        // if ( url.searchParams.has( 'hash-code' ) ) {
        // 	url.searchParams.set( 'hash-code' , Date.now().toString( 10 ) );
        // } else {
        // 	url.searchParams.append( 'hash-code' , Date.now().toString( 10 ) );
        // }
        url.searchParams.set('hash-code', Date.now().toString(10));
        window.location.assign(url.toString());
    }

    public checkAppVersion() {
        const searchParams: URLSearchParams = window.location.search ? new URLSearchParams(window.location.search) : null;
        const hash: number = searchParams && searchParams.has('hash-code') ? parseInt(searchParams.get('hash-code'), 10) : NaN;
        const currentTime: number = Date.now();
        const fiveMinutes: number = (5 * 60000);
        if (Number.isNaN(hash) || hash < (currentTime - fiveMinutes) && hash > (currentTime + fiveMinutes)) {
            const appVersion: number = Number(APP_CONFIGS.appVersion.replace(/\./g, ''));
            const requireVersion: number = this.getSysConfigValue('__LCMS_APP_VERSION', appVersion);
            if (appVersion < requireVersion) {
                const first_number = Math.floor(requireVersion / 1000);
                const secondary_number = (requireVersion % 1000) / 100;
                this.notificationService.confirm('Vừa có cập nhật phiên bản mới (v' + first_number.toString().concat(".", secondary_number.toString()) + '), vui lòng nhấn CẬP NHẬT để tải bản mới nhất.', 'Thông báo', [BUTTON_UPDATE]).then(a => {
                    this.forceReload();
                });
            }
        }
    }

    hasRouter(r: string, outer_url?: string): boolean {
        const activeLink = this.router.url.replace("/admin/", '').split('?')[0].replace(outer_url, '');
        const useCase = this.getUseCase(outer_url ? activeLink.replace(outer_url, '') : activeLink);
        const index = this._useCases.findIndex(m => useCase && m.id === useCase['parent_id']);
        if (index !== -1) {
            if (this._useCases[index].id === r) {
                return true;
            }
            return false;
        }
        return false;
    }
}
