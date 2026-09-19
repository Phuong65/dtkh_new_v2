import { SysConfigsService } from '@modules/shared/services/sys-configs.service';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { state, style, transition, trigger, useAnimation } from '@angular/animations';
import { Component, OnChanges, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router, RouterLink, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService, SideNavigationMenu } from '@core/services/notification.service';
import { delay, distinctUntilChanged, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { APP_CONFIGS, HIDDEN_MENUS, key_server } from '@env';
import { debounceTime, of, Subscription, BehaviorSubject, merge, Subject, firstValueFrom } from 'rxjs';
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
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { UserInfoV2Component } from './user-info-v2/user-info-v2.component';
import { MENU_TEST_V2 } from '@modules/shared/models/menu-test';
import { MenuModule } from 'primeng/menu';
import { TabMenuModule } from 'primeng/tabmenu';

@Component({
    selector: 'app-dashboard-v2',
    standalone: true,
    imports: [CommonModule, SharedModule, RouterModule, UserInfoV2Component, MenuModule, TabMenuModule],
    templateUrl: './dashboard-v2.component.html',
    styleUrls: ['./dashboard-v2.component.css'],
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
export class DashboardV2Component implements OnInit {
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

    version = 'v'.concat(APP_CONFIGS.appVersion);

    MENU_TEST = [];

    subMenuItem: MenuItem[] = [];

    indexActivityMenu: string;

    back_url: string;

    app_config = APP_CONFIGS;

    hideDefaultTopMenu: boolean = false;

    menuTopV2: MenuItem[];

    key_menu_top: string;

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
        private SysConfigsService: SysConfigsService,
    ) {

        this.menuCollapse = this.themeSettingsService.getSetting('menuCollapse');

        this.verticalMenu = this.convertMenu(this.auth.useCases);

        this.title.setTitle(APP_CONFIGS.pageTitle);

        const featureChange = this.auth.getFeatureSecondary().subscribe(_name => {
            this.secondary_feature = _name;
        })



        const close_left_menu = this.notificationService.getCloseLeftMenu().subscribe(_closed => {
            if (_closed) {
                this.class_layout = 'close-main-layout-menu-left';
                this.showBackButton = true;
                const activeLink = this.router.url.substring(7).split('?')[0];
                const ar_activeLink = activeLink.split("/");
                const last_route = ar_activeLink.splice(ar_activeLink.length - 1, 1);
                switch (last_route.toString()) {
                    case 'room-test':
                        this.back_url = this.router.url.substring(7).split('&')[0].replace('/room-test', '');
                        break;
                    case 'kt-daugio':
                        this.back_url = this.router.url.substring(7).split('&')[0].replace('/kt-daugio', '');
                        break;
                    case 'chambai-15p':
                        this.back_url = this.router.url.substring(7).split('&')[0].replace('/chambai-15p', '');
                        break;
                    case 'kt-tuluan-15p':
                        this.back_url = this.router.url.substring(7).split('&')[0].replace('/kt-tuluan-15p', '');
                        break;
                    default:
                        if (activeLink.indexOf('duyet-cauhoi-tn-detail') !== -1) {
                            const parts = activeLink.split('/');
                            const detailIndex = parts.indexOf('duyet-cauhoi-tn-detail');
                            const basePath = parts.slice(0, detailIndex).join('/').concat('/cauhoi');
                            const urlTree = this.router.parseUrl(this.router.url);
                            const codeParam = urlTree.queryParams['code'];
                            this.back_url = codeParam ? basePath.concat('?code=', codeParam) : basePath;
                        } else if (activeLink.indexOf('duyet-thuongxuyen-duan-detail') !== -1) {
                            const parts = activeLink.split('/');
                            const detailIndex = parts.indexOf('duyet-thuongxuyen-duan-detail');
                            const basePath = parts.slice(0, detailIndex).join('/').concat('/cauhoi');
                            const urlTree = this.router.parseUrl(this.router.url);
                            const codeParam = urlTree.queryParams['code'];
                            this.back_url = codeParam ? basePath.concat('?code=', codeParam) : basePath;
                        } else if (activeLink.indexOf('duyet-thuongxuyen-tuluan-detail') !== -1) {
                            const parts = activeLink.split('/');
                            const detailIndex = parts.indexOf('duyet-thuongxuyen-tuluan-detail');
                            const basePath = parts.slice(0, detailIndex).join('/').concat('/cauhoi');
                            const urlTree = this.router.parseUrl(this.router.url);
                            const codeParam = urlTree.queryParams['code'];
                            this.back_url = codeParam ? basePath.concat('?code=', codeParam) : basePath;
                        } else if (activeLink.indexOf('duyet-cauhoi-thuchanh-kthp-detail') !== -1) {
                            const parts = activeLink.split('/');
                            const detailIndex = parts.indexOf('duyet-cauhoi-thuchanh-kthp-detail');
                            const basePath = parts.slice(0, detailIndex).join('/').concat('/cauhoi');
                            const urlTree = this.router.parseUrl(this.router.url);
                            const codeParam = urlTree.queryParams['code'];
                            this.back_url = codeParam ? basePath.concat('?code=', codeParam) : basePath;
                        } else {
                            this.back_url = ''.concat(ar_activeLink.join('/'));
                        }
                        break;
                }
            }
        })

        const observerRouterEvents = router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(async (e: NavigationEnd) => {

            const nav = this.router.getCurrentNavigation();

            let redirect = nav?.extras?.queryParams?.['redirect'];

            if (!redirect) {
                redirect = this.activatedRoute.snapshot.queryParamMap.get('redirect');
            }

            if (redirect) {
                const decoded = decodeURIComponent(redirect);
                this.router.navigateByUrl(decoded);
            }

            const activeLink = e.url.substring(7).split('?')[0];

            this.showHuongdan = true;

            this.secondary_feature = null;

            this.class_layout = null;

            this.showBackButton = false;

            this.key_menu_top = null;

            this.changeMenuTop(activeLink);

            const useCase = this.auth.getUseCase(activeLink);

            if (useCase) {
                const index_parent = this.verticalMenu.findIndex(m => m.id === useCase['parent_id']);
                if (index_parent !== -1) {
                    this.openSubMenu(this.verticalMenu[index_parent], index_parent);
                }
            }

            this.menuActive = useCase;

            const ar_link = activeLink.split("/");

            if (ar_link[1] && ar_link[1] === "dashboard") {
                const index = this.verticalMenu.findIndex(m => m.id === ar_link[0]);
                if (index !== -1) {
                    this.openSubMenu(this.verticalMenu[index], index);
                }
            }

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

        this.subscriptions.add(featureChange);

        this.subscriptions.add(close_left_menu);

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
            this.navigationMenuState = 'close';
            this.sideNavigationOffCanvasSize = '0';
        });

        this.subscriptions.add(observerCloseSideNavigation);

        const observerThemeSettingsChange = this.themeSettingsService.onThemeSettingsChange.pipe(debounceTime(100)).subscribe(settings => this.animationType = settings.routingAnimation);

        this.subscriptions.add(observerThemeSettingsChange);

        if (this.router.url === '/admin/huong-dan') {
            this.secondary_feature = 'HƯỚNG DẪN';
            this.menuCollapse = true;

        }
    }


    ngOnInit(): void {
        this.themeSettingsService.settingInit(this.auth.userMeta);
        if (this.router.url === '/admin/huong-dan') {
            this.menuCollapse = true;
            this.secondary_feature = 'HƯỚNG DẪN';

        }

    }

    changeMenuTop(url: string) {
        const urls = [
            { urlKey: 'dao-tao/chuongtrinh-daotao', menuKey: 'menuTopV2' },
            { urlKey: 'quanly-monhoc', menuKey: 'menuTopV2' },
            { urlKey: 'hoi-dong/thamdinh-celo', menuKey: 'menuTopV2' },
            { urlKey: 'hoi-dong/thamdinh-noidung', menuKey: 'menuTopV2' },
            { urlKey: 'hoi-dong/thamdinh-cauhoi', menuKey: 'menuTopV2' },
            { urlKey: '/cauhoi-thuchanh-kthp', menuKey: 'menuTopV2' },
            { urlKey: 'hoi-dong/duyetnoidung', menuKey: 'menuTopV2' },
            { urlKey: 'khao-sat/khaosat-phieu', menuKey: 'menuTopV2' },
            { urlKey: 'khao-sat/khaosat-dot', menuKey: 'menuTopV2' },
            { urlKey: 'lanhdao-khoa/lanhdao-khoa-khaosatphieu', menuKey: 'menuTopV2' },
            { urlKey: 'lanhdao-khoa/lanhdao-khoa-khaosatdot', menuKey: 'menuTopV2' },
        ];

        const checkUrl = urls.findIndex(i => url.indexOf(i.urlKey) !== -1);

        const codeDirect = this.activatedRoute.snapshot.queryParamMap.get('code');

        const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));

        const setting = config.find(m => m.config_key === 'SETTING')['params'];

        const unLimitQuestion = setting && setting['form_question'] && this.key_server === 'tueba_dttx' ? setting['form_question']['unlimit'] : false;

        if (checkUrl !== -1) {
            const ar_url = url.split("/");
            switch (urls[checkUrl].urlKey) {
                case 'dao-tao/chuongtrinh-daotao':
                    const menu_ctdt = [
                        { label: 'Thông tin chung', routerLink: ['dao-tao/chuongtrinh-daotao/ctdt-thongtin'], queryParams: { 'code': codeDirect } },
                        { label: 'Mục tiêu', routerLink: ['dao-tao/chuongtrinh-daotao/ctdt-muctieu'], queryParams: { 'code': codeDirect } },
                        { label: 'CDR', routerLink: ['dao-tao/chuongtrinh-daotao/ctdt-cdr'], queryParams: { 'code': codeDirect } },
                        { label: 'Nội dung', routerLink: ['dao-tao/chuongtrinh-daotao/ctdt-noidung'], queryParams: { 'code': codeDirect } },
                        { label: 'Đội ngũ', routerLink: ['dao-tao/chuongtrinh-daotao/ctdt-doingu'], queryParams: { 'code': codeDirect } },
                        { label: 'Cấu hình', routerLink: ['dao-tao/chuongtrinh-daotao/ctdt-cauhinh'], queryParams: { 'code': codeDirect } }
                    ];

                    if (menu_ctdt.findIndex(m => m.routerLink[0] === url) !== -1) {
                        this.menuTopV2 = menu_ctdt;
                        this.notificationService.setCloseLeftMenu(true);
                        this.key_menu_top = urls[checkUrl].menuKey;
                    }
                    break;
                case 'quanly-monhoc':
                    const menu_monhoc = [
                        { label: 'Thông tin chung', routerLink: [ar_url[0].concat('/', ar_url[1], '/monhoc-thongtin')], queryParams: { 'code': codeDirect } },
                        { label: 'Mục tiêu/CDR', routerLink: [ar_url[0].concat('/', ar_url[1], '/monhoc-muctieu')], queryParams: { 'code': codeDirect } },
                        { label: 'Nội dung', routerLink: [ar_url[0].concat('/', ar_url[1], '/monhoc-noidung')], queryParams: { 'code': codeDirect } },
                        { label: 'Phân bổ câu hỏi CDR', routerLink: [ar_url[0].concat('/', ar_url[1], '/monhoc-question-cdr')], queryParams: { 'code': codeDirect } },
                        { label: 'Form Đề', routerLink: [ar_url[0].concat('/', ar_url[1], '/monhoc-formde')], queryParams: { 'code': codeDirect } },
                        { label: 'Kiểm tra, đánh giá', routerLink: [ar_url[0].concat('/', ar_url[1], '/monhoc-kiemtra-danhgia')], queryParams: { 'code': codeDirect } },
                        { label: 'Cấu hình', routerLink: [ar_url[0].concat('/', ar_url[1], '/monhoc-cauhinh')], queryParams: { 'code': codeDirect } },
                    ];

                    if (unLimitQuestion) {
                        menu_monhoc.splice(3, 1);
                    }

                    if (menu_monhoc.findIndex(m => m.routerLink[0] === url) !== -1) {
                        this.menuTopV2 = menu_monhoc;
                        this.notificationService.setCloseLeftMenu(true);
                        this.key_menu_top = urls[checkUrl].menuKey;
                    }
                    break;
                case '/cauhoi-thuchanh-kthp':
                    const menu_cauhoi = [
                        { label: 'Form đề', routerLink: [ar_url[0].concat('/', ar_url[1], '/form-th-kthp')], queryParams: { 'code': codeDirect } },
                        { label: 'Câu hỏi', routerLink: [ar_url[0].concat('/', ar_url[1], '/danhsach-cauhoi')], queryParams: { 'code': codeDirect } },
                    ];

                    if (menu_cauhoi.findIndex(m => m.routerLink[0] === url) !== -1) {
                        this.menuTopV2 = menu_cauhoi;
                        this.notificationService.setCloseLeftMenu(true);
                        this.key_menu_top = urls[checkUrl].menuKey;
                    }

                    break;
                case 'hoi-dong/duyetnoidung':
                    const menu_duyetnoidung = [
                        { label: 'CPI', routerLink: [ar_url[0].concat('/', ar_url[1], '/celo')], queryParams: { 'code': codeDirect } },
                        { label: 'Bài giảng', routerLink: [ar_url[0].concat('/', ar_url[1], '/baigiang')], queryParams: { 'code': codeDirect } },
                    ];

                    if (menu_duyetnoidung.findIndex(m => m.routerLink[0] === url) !== -1) {
                        this.menuTopV2 = menu_duyetnoidung;
                        this.notificationService.setCloseLeftMenu(true);
                        this.key_menu_top = urls[checkUrl].menuKey;
                    } else if (url.indexOf('cauhoi') !== -1 || url.indexOf('thuongxuyen-duan-detail') !== -1) {
                        this.notificationService.setCloseLeftMenu(true);
                    } else if (url.indexOf('thuongxuyen-tuluan-detail') !== -1) {
                        this.notificationService.setCloseLeftMenu(true);
                    } else if (url.indexOf('duyet-cauhoi-thuchanh-kthp-detail') !== -1) {
                        this.notificationService.setCloseLeftMenu(true);
                    }
                    break;
                case 'khao-sat/khaosat-phieu':
                    const menu_survey = [
                        { label: 'Thiết lập phiếu', routerLink: ['khao-sat/khaosat-phieu/survey-info'], queryParams: { 'code': codeDirect } },
                        { label: 'Câu hỏi', routerLink: ['khao-sat/khaosat-phieu/survey-question'], queryParams: { 'code': codeDirect } },
                    ];

                    if (menu_survey.findIndex(m => m.routerLink[0] === url) !== -1) {
                        this.menuTopV2 = menu_survey;
                        this.notificationService.setCloseLeftMenu(true);
                        this.key_menu_top = urls[checkUrl].menuKey;
                    }
                    break;
                case 'khao-sat/khaosat-dot':
                case 'lanhdao-khoa/lanhdao-khoa-khaosatdot':
                    const menu_survey_plan = [
                        { label: 'Thiết lập đợt', routerLink: ['khao-sat/khaosat-dot/survey-plan-info'], queryParams: { 'code': codeDirect } },
                        { label: 'Xem trước câu hỏi', routerLink: ['khao-sat/khaosat-dot/survey-plan-question'], queryParams: { 'code': codeDirect } },
                        { label: 'Cấu hình phiếu', routerLink: ['khao-sat/khaosat-dot/survey-plan-setting'], queryParams: { 'code': codeDirect } },
                    ];

                    if (menu_survey_plan.findIndex(m => m.routerLink[0] === url) !== -1) {
                        this.menuTopV2 = menu_survey_plan;
                        this.notificationService.setCloseLeftMenu(true);
                        this.key_menu_top = urls[checkUrl].menuKey;
                    }
                    break;
                default:
                    if (urls[checkUrl].urlKey === 'hoi-dong/thamdinh-celo' || urls[checkUrl].urlKey === 'hoi-dong/thamdinh-noidung' || urls[checkUrl].urlKey === 'hoi-dong/thamdinh-cauhoi') {
                        const menu_hoidong = [
                            { label: 'Thông tin', routerLink: [urls[checkUrl].urlKey.concat("/hoidong-info")], queryParams: { 'code': codeDirect } },
                            { label: 'Thành viên', routerLink: [urls[checkUrl].urlKey.concat("/hoidong-thanhvien")], queryParams: { 'code': codeDirect } },
                            { label: 'Môn học', routerLink: [urls[checkUrl].urlKey.concat("/hoidong-monhoc")], queryParams: { 'code': codeDirect } },
                        ];

                        if (menu_hoidong.findIndex(m => m.routerLink[0] === url) !== -1) {
                            this.menuTopV2 = menu_hoidong;
                            this.notificationService.setCloseLeftMenu(true);
                            this.key_menu_top = urls[checkUrl].menuKey;
                        }
                    }

                    // if (checkUrl >= 5 && checkUrl <= 7) {
                    //     this.notificationService.setCloseLeftMenu(true);
                    // }

                    break;
            }
        }
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
                                styleClass.push(nodeChild.id ? nodeChild.id.replace(/\//gmi, '__').concat(' child-submenu-item-v2') : '');
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
        const ar = this.back_url.split("/");
        if (ar.length === 2) {
            this.title.setTitle(this.app_config.pageTitle);
        }
        this.router.navigateByUrl('admin/'.concat(this.back_url));
    }

    moveToHelp() {

        // const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
        //
        // const config = JSON.parse(localStorage.getItem('--app_configs-' + APP_CONFIGS.realm));
        //
        // const setting = config.find(m => m.config_key === 'HELP_SETTING')['params'];
        //
        // if (setting) {
        //     const index = setting['HELP_SETTING'].findIndex(m => m.id === activeLink);
        //     if (index !== -1) {
        //         const url = this.router.serializeUrl(this.router.createUrlTree(['admin/huongdan'], { queryParams: { code: activeLink.replace(/\//gi, '_') } }));
        //         window.open(url, '_blank');
        //     } else {
        //         this.notificationService.toastInfo("Chức năng này chưa cập nhật hướng dẫn");
        //     }
        // }

        const url = this.router.serializeUrl(this.router.createUrlTree(['admin/he-thong/trogiup-kythuat']));
        window.open(url, '_blank');
    }

    menuToggle() {
        this.menuCollapse = !this.menuCollapse;
    }

    openSubMenu(item, index_menu: number) {
        if (item['id'] !== 'dang-xuat') {
            this.indexActivityMenu = item.id;
            this.subMenuItem = [];
            this.subMenuItem = item['child'];
            this.menuCollapse = false;
        } else {
            this.confirmSignOut()
        }
    }

    convertMenu(usecase) {
        const menu = [];
        usecase.forEach(f => {
            const data_menu = {
                id: f.id,
                label: f.title,
                icon: f.icon,
                child: []
            }
            if (f['child']) {
                const parent = [];
                const child = [];
                f['child'].forEach(c => {
                    const id_ar = c.id.replace(f.id.concat("_"), '').split("_");
                    if (!c.url) {
                        parent.push({
                            id: c.id,
                            label: c.title,
                            key: id_ar[0],
                            items: []
                        })
                    } else {
                        child.push({
                            id: c.id,
                            label: c.title,
                            key: id_ar[0],
                            icon: c.icon,
                            styleClass: "child-submenu-item-v2",
                            routerLink: f.url.concat("/", c.url),
                        })
                    }
                })

                parent.forEach(p => {
                    p['items'] = child.filter(m => m.key === p.key)
                })

                data_menu.child = parent;
            }

            menu.push(data_menu);
        })

        menu.push(
            {
                id: "dang-xuat",
                label: "Đăng xuất",
                icon: "fa-solid fa-power-off",
            },
        )
        return menu;
    }

}
