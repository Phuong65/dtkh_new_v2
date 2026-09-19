import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { RoleService } from '@core/services/role.service';
import { Router } from '@angular/router';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { NotificationService } from '@core/services/notification.service';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';


@Component({
    selector: 'app-user-info-v2',
    standalone: true,
    imports: [CommonModule, SharedModule, OverlayPanelModule],
    templateUrl: './user-info-v2.component.html',
    styleUrls: ['./user-info-v2.component.css']
})
export class UserInfoV2Component implements OnInit {

    currentUser = {
        avatar: '../../../../assets/images/a_none.jpg',
        email: 'Email',
        name: 'User name',
        display: 'User name',
        role: 'user role'
    };

    userMenu = {
        profile: 'Profile',
        messages: 'messages',
        help: 'help',
        lock: 'lock',
        signOut: 'signOut'
    };

    subscriptions = new Subscription();

    // trackWindowScroll = new Subscription();

    @ViewChild('panel') panel: OverlayPanel;

    constructor(
        private auth: AuthService,
        private roleService: RoleService,
        private notificationService: NotificationService,
        private router: Router
    ) {
        /*const observerUpdateUser$ = this.auth.onSetUpUser().pipe(
         tap( user => {
         this.currentUser.avatar = user.avatar;
         this.currentUser.name   = user.display_name;
         this.currentUser.email  = user.email;
         } ) ,
         mergeMap( user => ( user && user.role_ids && user.role_ids[ 0 ] ) ? this.roleService.getRoleById( parseInt( user.role_ids[ 0 ] , 10 ) , 'title,realm' ) : of( null ) )
         ).subscribe( {
         next : ( role ) => this.currentUser.role = role ? role.title : 'user role'
         } );*/
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        // this.trackWindowScroll.unsubscribe();
    }

    ngOnInit(): void {
        const observerUpdateUser$ = this.auth.onSetUpUser().subscribe({
            next: user => {
                this.currentUser.avatar = user.avatar;
                this.currentUser.name = user.username;
                this.currentUser.display = user.display_name;
                this.currentUser.email = user.email;
            }
        });

        const changeLanguage$ = this.auth.appLanguageSettings().pipe(filter(value => value !== undefined && value !== null)).subscribe(
            {
                next: (settings) => {
                    this.userMenu.profile = settings.translations.systems.profile;
                    this.userMenu.messages = settings.translations.systems.messages;
                    this.userMenu.help = settings.translations.systems.help;
                    this.userMenu.lock = settings.translations.systems.lock;
                    this.userMenu.signOut = settings.translations.systems.logout;
                }
            }
        );

        this.subscriptions.add(changeLanguage$);
        this.subscriptions.add(observerUpdateUser$);
    }

    async signOut() {
        this.notificationService.isProcessing(true);
        await this.auth.logout();
        this.router.navigate(['login']).then(() => this.notificationService.isProcessing(false), () => this.notificationService.isProcessing(false));
    }

    async confirmSignOut(panel: OverlayPanel) {
        this.notificationService.isProcessing(true);
        this.auth.removeSession();
        await this.auth.logout();
        this.router.navigate(['login']).then(() => this.notificationService.isProcessing(false), () => this.notificationService.isProcessing(false));
        // panel.hide();
        // const headText = this.auth.userLanguage.translations.dashboard.confirm_logout;
        // const question = this.auth.userLanguage.translations.dashboard.confirm_logout_mess;
        // const confirm  = await this.notificationService.confirmRounded( `<p class="text-danger">${ question }</p>` , headText , [ BUTTON_NO , BUTTON_YES ] );
        // if ( confirm && confirm.name && confirm.name === BUTTON_YES.name ) {
        // 	await this.signOut();
        // }
    }

    routeLink(panel: OverlayPanel, router: string) {
        panel.hide();
        this.router.navigateByUrl(router).then(() => null);
    }

    // ngAfterViewInit() : void {
    // 	this.panel.onShow.subscribe( () => this.trackWindowScroll = this.notificationService.onWindowScroll.subscribe( () => this.panel.hide() ) );
    // 	this.panel.onHide.subscribe( () => this.trackWindowScroll.unsubscribe() );
    // }

}
