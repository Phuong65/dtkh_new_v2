import '@angular/compiler';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { ObjectUtils } from 'primeng/utils';

const originalMerge = ObjectUtils.merge;
ObjectUtils.merge = function (obj1: any, obj2: any): any {
  if (obj1 === undefined && obj2 === undefined) {
    return undefined;
  }
  return originalMerge(obj1, obj2);
};

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
