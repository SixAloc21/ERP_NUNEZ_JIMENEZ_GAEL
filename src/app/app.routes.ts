import { Routes } from '@angular/router';


export const routes: Routes = [
    {
  path: '',
  loadComponent: () => import('./pages/landing/landing').then(m => m.LandingComponent),
    },
    {
  path: 'home',
  loadComponent: () =>
    import('./pages/home/home').then(m => m.HomeComponent),
},
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/auth/register/register').then(m => m.RegisterComponent),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },

  { path: '**', redirectTo: '' },
];