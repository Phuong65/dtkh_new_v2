import { SysConfigsService } from '@modules/shared/services/sys-configs.service';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { state, style, transition, trigger, useAnimation } from '@angular/animations';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService, SideNavigationMenu } from '@core/services/notification.service';
import { delay, filter, switchMap, tap } from 'rxjs/operators';
import { APP_CONFIGS, HIDDEN_MENUS, key_server } from '@env';
import { debounceTime, of, Subscription } from 'rxjs';
import { Ucase } from '@core/models/ucase';
import { UnsubscribeAndCompleteObserversOnDestroy } from '@core/utils/decorator';
import { ThemeSettingsService } from '@core/services/theme-settings.service';
import { LangChangeEvent } from '@ngx-translate/core/lib/translate.service';
import {
    moveFromLeft,
    moveFromRight,
    moveFromTop,
    moveFromBottom,
    moveFromLeftFade,
    moveFromRightFade,
    moveFromTopFade,
    moveFromBottomFade,
    fromLeftEasing,
    fromRightEasing,
    fromTopEasing,
    fromBottomEasing,
    scaleDownFromLeft,
    scaleDownFromRight,
    scaleDownFromTop,
    scaleDownFromBottom,
    scaleDownScaleDown,
    rotateGlueFromLeft,
    rotateGlueFromRight,
    rotateGlueFromTop,
    rotateGlueFromBottom,
    rotateFlipToLeft,
    rotateFlipToRight,
    rotateFlipToTop,
    rotateFlipToBottom,
    rotateNewsPaper,
    rotateRoomToLeft,
    rotateRoomToRight,
    rotateRoomToTop,
    rotateRoomToBottom,
    rotateCubeToLeft,
    rotateCubeToRight,
    rotateCubeToTop,
    rotateCubeToBottom,
    rotateCarouselToLeft,
    rotateCarouselToRight,
    rotateCarouselToTop,
    rotateCarouselToBottom,
    rotateSides,
    slide
} from '@shared/animations/router-animations';
import { OverlayPanel } from 'primeng/overlaypanel/overlaypanel';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { ScrollPanel } from 'primeng/scrollpanel/scrollpanel';
import { Title } from '@angular/platform-browser';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
    animations: [
        trigger('overlayAnimations', [
            state('open', style({
                opacity: 1,
                visibility: 'visible'
            })),
            state('close', style({
                opacity: 0,
                visibility: 'hidden'
            }))
        ]),
        trigger('dropdown', [
            state('open', style({
                top: '100%',
                opacity: 1,
                visibility: 'visible'
            })),
            state('close', style({
                top: 'calc(100% + 13px)',
                opacity: 0,
                visibility: 'hidden'
            }))
        ]),
        trigger('navigationMenuEffect', [state('open', style({ right: 0 }))]),
        trigger('moveFromLeft', [transition('* => *', useAnimation(moveFromLeft))]),
        trigger('moveFromRight', [transition('* => *', useAnimation(moveFromRight))]),
        trigger('moveFromTop', [transition('* => *', useAnimation(moveFromTop))]),
        trigger('moveFromBottom', [transition('* => *', useAnimation(moveFromBottom))]),
        trigger('moveFromLeftFade', [transition('* => *', useAnimation(moveFromLeftFade))]),
        trigger('moveFromRightFade', [transition('* => *', useAnimation(moveFromRightFade))]),
        trigger('moveFromTopFade', [transition('* => *', useAnimation(moveFromTopFade))]),
        trigger('moveFromBottomFade', [transition('* => *', useAnimation(moveFromBottomFade))]),
        trigger('fromLeftEasing', [transition('* => *', useAnimation(fromLeftEasing))]),
        trigger('fromRightEasing', [transition('* => *', useAnimation(fromRightEasing))]),
        trigger('fromTopEasing', [transition('* => *', useAnimation(fromTopEasing))]),
        trigger('fromBottomEasing', [transition('* => *', useAnimation(fromBottomEasing))]),
        trigger('scaleDownFromLeft', [transition('* => *', useAnimation(scaleDownFromLeft))]),
        trigger('scaleDownFromRight', [transition('* => *', useAnimation(scaleDownFromRight))]),
        trigger('scaleDownFromTop', [transition('* => *', useAnimation(scaleDownFromTop))]),
        trigger('scaleDownFromBottom', [transition('* => *', useAnimation(scaleDownFromBottom))]),
        trigger('scaleDownScaleDown', [transition('* => *', useAnimation(scaleDownScaleDown))]),
        trigger('rotateGlueFromLeft', [transition('* => *', useAnimation(rotateGlueFromLeft))]),
        trigger('rotateGlueFromRight', [transition('* => *', useAnimation(rotateGlueFromRight))]),
        trigger('rotateGlueFromTop', [transition('* => *', useAnimation(rotateGlueFromTop))]),
        trigger('rotateGlueFromBottom', [transition('* => *', useAnimation(rotateGlueFromBottom))]),
        trigger('rotateFlipToLeft', [transition('* => *', useAnimation(rotateFlipToLeft))]),
        trigger('rotateFlipToRight', [transition('* => *', useAnimation(rotateFlipToRight))]),
        trigger('rotateFlipToTop', [transition('* => *', useAnimation(rotateFlipToTop))]),
        trigger('rotateFlipToBottom', [transition('* => *', useAnimation(rotateFlipToBottom))]),
        trigger('rotateNewsPaper', [transition('* => *', useAnimation(rotateNewsPaper))]),
        trigger('rotateRoomToLeft', [transition('* => *', useAnimation(rotateRoomToLeft))]),
        trigger('rotateRoomToRight', [transition('* => *', useAnimation(rotateRoomToRight))]),
        trigger('rotateRoomToTop', [transition('* => *', useAnimation(rotateRoomToTop))]),
        trigger('rotateRoomToBottom', [transition('* => *', useAnimation(rotateRoomToBottom))]),
        trigger('rotateCubeToLeft', [transition('* => *', useAnimation(rotateCubeToLeft))]),
        trigger('rotateCubeToRight', [transition('* => *', useAnimation(rotateCubeToRight))]),
        trigger('rotateCubeToTop', [transition('* => *', useAnimation(rotateCubeToTop))]),
        trigger('rotateCubeToBottom', [transition('* => *', useAnimation(rotateCubeToBottom))]),
        trigger('rotateCarouselToLeft', [transition('* => *', useAnimation(rotateCarouselToLeft))]),
        trigger('rotateCarouselToRight', [transition('* => *', useAnimation(rotateCarouselToRight))]),
        trigger('rotateCarouselToTop', [transition('* => *', useAnimation(rotateCarouselToTop))]),
        trigger('rotateCarouselToBottom', [transition('* => *', useAnimation(rotateCarouselToBottom))]),
        trigger('rotateSides', [transition('* => *', useAnimation(rotateSides))]),
        trigger('slide', [transition('* => *', useAnimation(slide))])
    ]
})
@UnsubscribeAndCompleteObserversOnDestroy()
export class DashboardComponent implements OnInit {

    animationType = 'noAnimations';

    isLoading = false;

    menuCollapse = false;

    mobileMenuOpen = false;

    menuActive: MenuItem = { label: 'Bảng điều khiển', icon: 'fi-rr-dashboard', styleClass: '' };

    menuDropdownState = 'close';

    langDropdownState = 'close';

    verticalMenu: MenuItem[] = [];

    subscriptions = new Subscription();

    menuSize = '300px';

    defaultNavigationOffsetTop = '60px';

    navigationOffsetTop = this.defaultNavigationOffsetTop;

    initRight = '-310px';

    sideNavigationMenuSettings: SideNavigationMenu;

    navigationMenuState: 'open' | 'close' = 'close';

    bodyNoScroll = '<style>body {overflow: hidden !important; padding-right: 16.5px;}</style>';

    overflowWrapper = 'visible';

    // overflowXInnerWrapper = 'auto';
    overflowXInnerWrapper = 'hidden';

    showRoutingProgressBar = false;

    sideNavigationOffCanvasSize = '0';

    timeOut: any;

    key_server = key_server;

    secondary_feature: string = null;

    class_main = APP_CONFIGS.class_main;

    class_layout: string;

    showBackButton: boolean = false;

    showHuongdan: boolean = false;

    @ViewChild('scrollPanel', { static: true }) scrollPanel: ScrollPanel;

    constructor(
        private helperService: HelperService,
        private router: Router,
        private notificationService: NotificationService,
        private themeSettingsService: ThemeSettingsService,
        private auth: AuthService,
        private title: Title,
        private activatedRoute: ActivatedRoute,
        private classesService: ClassesService,
        private elnKhoaHocService: ElnKhoaHocService,
        private SysConfigsService: SysConfigsService
    ) {
        this.title.setTitle(APP_CONFIGS.pageTitle);

        const featureChange = this.auth.getFeatureSecondary().subscribe(_name => {
            const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
            this.secondary_feature = null;
            switch (activeLink) {
                case 'lop-hoc-phan/class-details':
                    this.secondary_feature = _name;
                    break;
                case 'lop-hoc-phan/class-details/room-test':
                    this.secondary_feature = _name;
                    break;
                case 'kehoach-hoctap/phanbo-cdr-cauhoi':
                    this.secondary_feature = _name;
                    break;
                case 'kehoach-hoctap/form-de':
                    this.secondary_feature = _name;
                    break;
                case 'huongdan':
                    this.secondary_feature = _name;
                    break;
                default:
                    break;
            }
        })

        this.subscriptions.add(featureChange);

        const observerRouterEvents = router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
            const activeLink = e.url.substring(7).split('?')[0];
            this.showHuongdan = false;
            this.secondary_feature = null;
            this.class_layout = null;
            this.showBackButton = false;
            const useCase = this.auth.getUseCase(activeLink);

            switch (activeLink) {
                case 'kehoach-hoctap/chitiet-kehoach':
                    this.secondary_feature = 'Nội dung môn học';
                    this.class_layout = 'close-main-layout-menu-left';
                    break;
                case 'nganhang-cauhoi/chuandaura':
                    this.secondary_feature = 'Cập nhật câu hỏi';
                    this.class_layout = 'close-main-layout-menu-left';
                    break;
                case 'duyetnoidung-hoctap/chitiet':
                    this.secondary_feature = 'Duyệt nội dung giảng dạy';
                    this.class_layout = 'close-main-layout-menu-left';
                    break;
                case 'thikethuc-hocphan/theodoi-cathi/phongthi':
                    this.secondary_feature = 'Danh sách phòng thi';
                    this.class_layout = 'close-main-layout-menu-left';
                    break;
                case 'lop-hoc-phan/class-details/room-test':
                    this.class_layout = 'close-main-layout-menu-left';
                    this.showBackButton = true;
                    break;
                case 'kehoach-hoctap/phanbo-cdr-cauhoi':
                    this.class_layout = 'close-main-layout-menu-left';
                    this.showBackButton = true;
                    break;
                case 'kehoach-hoctap/form-de':
                    this.class_layout = 'close-main-layout-menu-left';
                    this.showBackButton = true;
                    break;
                default:
                    break;
            }

            this.menuActive = useCase ? { label: useCase.title, icon: useCase.icon, styleClass: useCase.id ? useCase.id.replace(/\//gmi, '__') : '' } : { label: 'Bảng điều khiển', icon: 'fi-rr-dashboard', styleClass: '' };
            if (this.timeOut) {
                clearTimeout(this.timeOut);
            }
            this.timeOut = setTimeout(() => {
                const elmActive = document.querySelector('.--admin-dashboard-menu-parent-active');
                if (elmActive) {
                    elmActive.classList.remove('--admin-dashboard-menu-parent-active');
                }
                const parentMenuActive = this.menuActive.styleClass ? document.querySelector('.' + this.menuActive.styleClass) : null;
                if (parentMenuActive) {
                    parentMenuActive.classList.add('--admin-dashboard-menu-parent-active');
                }
            }, 200);

            const condition_config: ConditionOption = {
                condition: [
                    { conditionName: 'config_key', condition: OvicQueryCondition.equal, value: '__LCMS_APP_VERSION' }
                ],
                set: [
                    { label: 'limit', value: '-1' }
                ],
                page: null
            }

            this.SysConfigsService.getAppConfigs().subscribe({
                next: (_config) => {
                    if (_config.length) {
                        this.auth.setSysConfigs(_config);
                        this.auth.checkAppVersion();

                        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

                        const setting = config.find(m => m.config_key === 'HELP_SETTING');

                        if (setting) {
                            const index = setting['params']['HELP_SETTING'].findIndex(m => m.id === activeLink);
                            if (index !== -1) {
                                this.showHuongdan = true;
                            }
                        }
                    }
                },
                error: () => {

                }
            })
        });

        this.subscriptions.add(observerRouterEvents);
        const observerChangeLanguage = this.auth.appLanguageSettings().pipe(filter(value => value !== undefined && value !== null)).subscribe(
            (settings) => {
                const lang = APP_CONFIGS.multiLanguage ? settings : null;
                this.verticalMenu = this.useCase2ToMenuItem(this.auth.useCases, lang);
            }
        );
        this.subscriptions.add(observerChangeLanguage);

        const observerOpenSideNavigation = this.notificationService.onSideNavigationMenuOpen().pipe(
            debounceTime(100),
            switchMap(settings => {
                this.sideNavigationMenuSettings = settings;
                this.menuSize = settings.size ? `${settings.size}px` : '100%';
                this.initRight = '-' + (settings.size ? `${settings.size + 10}px` : '110%');
                this.navigationOffsetTop = settings.offsetTop ? settings.offsetTop : this.defaultNavigationOffsetTop;
                this.sideNavigationOffCanvasSize = settings['offCanvas'] ? Math.max(0, (settings.size + 10)) + 'px' : '0';
                return of('');
            }
            ), delay(50)).subscribe(() => this.navigationMenuState = 'open');

        this.subscriptions.add(observerOpenSideNavigation);

        const observerCloseSideNavigation = this.notificationService.onSideNavigationMenuClosed().pipe(debounceTime(100)).subscribe(() => {
            console.log('ddd');
            this.navigationMenuState = 'close';
            this.sideNavigationOffCanvasSize = '0';
        });

        this.subscriptions.add(observerCloseSideNavigation);

        const observerThemeSettingsChange = this.themeSettingsService.onThemeSettingsChange.pipe(debounceTime(100)).subscribe(settings => this.animationType = settings.routingAnimation);

        this.subscriptions.add(observerThemeSettingsChange);



    }

    ngOnInit(): void {
        this.themeSettingsService.settingInit(this.auth.userMeta);
        this.menuCollapse = this.themeSettingsService.getSetting('menuCollapse');


        // console.log( this.scrollPanel.calculateContainerHeight() );
    }

    useCase2ToMenuItem(data: Ucase[], lang: LangChangeEvent = null): MenuItem[] {
        const translated = lang ? lang.translations.route : null;
        let result: MenuItem[] = [];
        if (data.length) {
            data.filter(({ position }) => position === 'left').forEach(({ child, title, icon, id }) => {
                if (!HIDDEN_MENUS.has(id)) {
                    const menu: MenuItem = {
                        label: translated && translated.hasOwnProperty(id) ? translated[id] : title,
                        icon: icon,
                        expanded: id === 'quyet-dinh' || id === 'thong-ke-bao-cao'
                    };
                    if (child && child.length) {
                        menu['items'] = [];
                        const styleClass = [id ? id.replace(/\//gmi, '__') : ''];
                        child.filter(({ position }) => position === 'left').forEach(nodeChild => {
                            if (!HIDDEN_MENUS.has(nodeChild.id)) {
                                menu['items'].push({
                                    label: translated && translated.hasOwnProperty(nodeChild.id) ? translated[nodeChild.id] : nodeChild.title,
                                    icon: nodeChild.icon,
                                    routerLink: nodeChild.id
                                });
                                styleClass.push(nodeChild.id ? nodeChild.id.replace(/\//gmi, '__') : '');
                            }
                        });
                        menu['styleClass'] = styleClass.join(' ');
                    } else {
                        menu['routerLink'] = id;
                    }
                    if (id === 'he-thong') {
                        const logoutNode: MenuItem = {
                            label: 'Đăng Xuất',
                            icon: 'pi pi-sign-out',
                            command: () => this.confirmSignOut()
                        };
                        if (menu.items) {
                            menu.items.push(logoutNode);
                        } else {
                            menu['items'] = [logoutNode];
                        }
                    }
                    result.push(menu);
                }
            });
        }
        return result;
    }

    toggleMenu() {
        this.menuCollapse = !this.menuCollapse;
        this.themeSettingsService.changeThemeSettings([{ item: 'menuCollapse', value: this.menuCollapse }], false).pipe(tap(() => this.auth.syncUserMeta())).subscribe();
    }

    toggleMenuForMobile(event: Event | null) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    reloadPage() {
        this.notificationService.isProcessing(true);
        window.location.reload();
    }

    closePanel(name: string) {
        this.notificationService.closeSideNavigationMenu(name);
    }

    getState(outlet, name: string) {
        if (name !== this.animationType) { return; }
        return outlet && outlet.activatedRouteData && outlet.activatedRouteData['state'];
    }

    animationStart() {
        this.overflowWrapper = 'hidden';
        this.overflowXInnerWrapper = 'hidden';
        this.showRoutingProgressBar = true;
    }

    animationDoneStart() {
        setTimeout(() => {
            this.overflowWrapper = 'visible';
            // this.overflowXInnerWrapper  = 'auto';
            this.overflowXInnerWrapper = 'hidden';
            this.showRoutingProgressBar = false;
        }, 100);
    }

    async signOut() {
        this.notificationService.isProcessing(true);
        await this.auth.logout();
        this.router.navigate(['login']).then(() => this.notificationService.isProcessing(false), () => this.notificationService.isProcessing(false));
    }

    async confirmSignOut() {
        this.notificationService.isProcessing(true);
        await this.auth.logout();
        this.router.navigate(['login']).then(() => this.notificationService.isProcessing(false), () => this.notificationService.isProcessing(false));
        // const headText = this.auth.userLanguage.translations.dashboard.confirm_logout;
        // const question = this.auth.userLanguage.translations.dashboard.confirm_logout_mess;
        // const confirm = await this.notificationService.confirmRounded(`<p class="text-danger">${question}</p>`, headText, [BUTTON_NO, BUTTON_YES]);
        // if (confirm && confirm.name && confirm.name === BUTTON_YES.name) {
        //     await this.signOut();
        // }
    }

    mouseenter() {
        this.menuCollapse = false;
        this.themeSettingsService.changeThemeSettings([{ item: 'menuCollapse', value: this.menuCollapse }], false).pipe(tap(() => this.auth.syncUserMeta())).subscribe();
    }

    mouseleave() {
        this.menuCollapse = true;
        this.themeSettingsService.changeThemeSettings([{ item: 'menuCollapse', value: this.menuCollapse }], false).pipe(tap(() => this.auth.syncUserMeta())).subscribe();
    }

    backToClass() {
        const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
        switch (activeLink) {
            case 'lop-hoc-phan/class-details/room-test':
                const url = this.router.url.substring(7).split('&')[0].replace('/room-test', '')
                window.location.assign('admin/'.concat(url));
                break;
            case 'kehoach-hoctap/phanbo-cdr-cauhoi':
                window.location.assign('admin/kehoach-hoctap/');
                break;
            case 'kehoach-hoctap/form-de':
                window.location.assign('admin/kehoach-hoctap/');
                break;
            default:
                break;
        }

    }

    moveToHelp() {

        const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');

        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const setting = config.find(m => m.config_key === 'HELP_SETTING')['params'];

        if (setting) {
            const index = setting['HELP_SETTING'].findIndex(m => m.id === activeLink);
            if (index !== -1) {
                const url = this.router.serializeUrl(this.router.createUrlTree(['admin/huongdan'], { queryParams: { code: activeLink.replace(/\//gi, '_') } }));
                window.open(url, '_blank');
            } else {
                this.notificationService.toastInfo("Chức năng này chưa cập nhật hướng dẫn");
            }
        }
    }
}
