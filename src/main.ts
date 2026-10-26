import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { configureAmplify } from './app/config/amplify.config';

configureAmplify();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
